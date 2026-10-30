import { AssemblyAI } from 'assemblyai';
import {
  TranscriptError,
  type TranscriptProvider,
  type TranscriptResult,
  type TranscriptSegment,
  withTimeout,
} from './transcript-provider.ts';
import { getYouTubeVisitorData } from './visitor-data.ts';

const INNERTUBE_API_URL = 'https://www.youtube.com/youtubei/v1/player?prettyPrint=false';
const INNERTUBE_CLIENT_VERSION = '20.10.38';
const INNERTUBE_USER_AGENT = `com.google.android.youtube/${INNERTUBE_CLIENT_VERSION} (Linux; U; Android 14)`;

interface AdaptiveAudioFormat {
  itag: number;
  mimeType: string;
  bitrate?: number;
  contentLength?: string;
  approxDurationMs?: string;
  url?: string;
  signatureCipher?: string;
}

interface InnerTubePlayerData {
  videoDetails?: {
    title?: string;
    author?: string;
    isPrivate?: boolean;
    lengthSeconds?: string;
  };
  playabilityStatus?: {
    status?: string;
    reason?: string;
  };
  streamingData?: {
    adaptiveFormats?: AdaptiveAudioFormat[];
  };
}

/**
 * Transcribe un buffer de audio usando Deepgram Nova-2.
 */
async function transcribirConDeepgram(
  buffer: Buffer,
  mimeType: string,
  apiKey: string,
  idioma = 'es',
): Promise<{ text: string; segments: TranscriptSegment[] }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120_000);

  const contentType = mimeType.includes('webm') ? 'audio/webm' : 'audio/mp4';
  const urlApi = `https://api.deepgram.com/v1/listen?model=nova-2&language=${encodeURIComponent(
    idioma,
  )}&smart_format=true&punctuate=true&paragraphs=true`;

  try {
    const res = await fetch(urlApi, {
      method: 'POST',
      headers: {
        Authorization: `Token ${apiKey}`,
        'Content-Type': contentType,
      },
      body: new Uint8Array(buffer),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`Deepgram falló con HTTP ${res.status}: ${errText.slice(0, 160)}`);
    }

    const data = (await res.json()) as {
      results?: {
        channels?: Array<{
          alternatives?: Array<{
            transcript?: string;
            paragraphs?: {
              paragraphs?: Array<{
                sentences?: Array<{ text?: string; start?: number; end?: number }>;
                start?: number;
                end?: number;
              }>;
            };
            words?: Array<{ word?: string; start?: number; end?: number }>;
          }>;
        }>;
      };
    };

    const alt = data.results?.channels?.[0]?.alternatives?.[0];
    const text = (alt?.transcript || '').trim();
    if (!text) {
      throw new Error('Deepgram no detectó voz en el audio extraído.');
    }

    const segments: TranscriptSegment[] = [];
    const paragraphs = alt?.paragraphs?.paragraphs;

    if (Array.isArray(paragraphs) && paragraphs.length > 0) {
      for (const p of paragraphs) {
        if (Array.isArray(p.sentences) && p.sentences.length > 0) {
          for (const s of p.sentences) {
            const sentenceText = (s.text || '').trim();
            if (sentenceText) {
              const start = s.start ?? 0;
              const duration = s.end ? Math.max(0, s.end - start) : 0;
              segments.push({ text: sentenceText, start, duration });
            }
          }
        } else if (p.start !== undefined && p.end !== undefined) {
          // Si no hay sentences individuales
          segments.push({
            text: text.slice(0, 100),
            start: p.start,
            duration: Math.max(0, p.end - p.start),
          });
        }
      }
    }

    // Si no se generaron segmentos por párrafos, usar chunks temporales de palabras
    if (segments.length === 0 && Array.isArray(alt?.words) && alt.words.length > 0) {
      const words = alt.words;
      const CHUNK_SIZE = 15;
      for (let i = 0; i < words.length; i += CHUNK_SIZE) {
        const chunk = words.slice(i, i + CHUNK_SIZE);
        const chunkText = chunk.map((w) => w.word).filter(Boolean).join(' ');
        const start = chunk[0]?.start ?? 0;
        const end = chunk[chunk.length - 1]?.end ?? start;
        segments.push({
          text: chunkText,
          start,
          duration: Math.max(0, end - start),
        });
      }
    }

    // Segmento de respaldo si no hay metadata detallada de tiempo
    if (segments.length === 0) {
      segments.push({ text, start: 0, duration: 0 });
    }

    return { text, segments };
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}

/**
 * Transcribe un buffer de audio usando AssemblyAI como respaldo.
 */
async function transcribirConAssemblyAI(
  buffer: Buffer,
  apiKey: string,
  idioma = 'es',
): Promise<{ text: string; segments: TranscriptSegment[] }> {
  // 1. Subir buffer a AssemblyAI
  const uploadRes = await fetch('https://api.assemblyai.com/v2/upload', {
    method: 'POST',
    headers: {
      Authorization: apiKey,
      'Content-Type': 'application/octet-stream',
    },
    body: new Uint8Array(buffer),
  });

  if (!uploadRes.ok) {
    const errText = await uploadRes.text().catch(() => '');
    throw new Error(`AssemblyAI upload falló (HTTP ${uploadRes.status}): ${errText.slice(0, 160)}`);
  }

  const { upload_url } = (await uploadRes.json()) as { upload_url?: string };
  if (!upload_url) {
    throw new Error('AssemblyAI no devolvió URL de subida para el archivo de audio.');
  }

  // 2. Iniciar transcripción
  const aai = new AssemblyAI({ apiKey });
  const transcript = await aai.transcripts.transcribe({
    audio: upload_url,
    language_code: idioma as any,
  });

  if (transcript.status === 'error') {
    throw new Error(transcript.error || 'AssemblyAI devolvió un error en la transcripción.');
  }

  const text = (transcript.text || '').trim();
  if (!text) {
    throw new Error('AssemblyAI no detectó voz en el audio.');
  }

  const segments: TranscriptSegment[] = [];
  if (Array.isArray(transcript.words) && transcript.words.length > 0) {
    const words = transcript.words;
    const CHUNK_SIZE = 15;
    for (let i = 0; i < words.length; i += CHUNK_SIZE) {
      const chunk = words.slice(i, i + CHUNK_SIZE);
      const chunkText = chunk.map((w) => w.text).filter(Boolean).join(' ');
      const startMs = chunk[0]?.start ?? 0;
      const endMs = chunk[chunk.length - 1]?.end ?? startMs;
      segments.push({
        text: chunkText,
        start: startMs / 1000,
        duration: Math.max(0, (endMs - startMs) / 1000),
      });
    }
  }

  if (segments.length === 0) {
    segments.push({ text, start: 0, duration: 0 });
  }

  return { text, segments };
}

/**
 * Proveedor de transcripción de audio nativo por streaming para videos de YouTube sin subtítulos.
 *
 * Extrae directamente la pista de audio (AAC ligero itag 139 o 140) desde la API oficial de InnerTube
 * sin dependencias de yt-dlp ni ffmpeg, y la transcribe en streaming usando Deepgram Nova-2 o AssemblyAI.
 */
export const youtubeAudioTranscriptProvider: TranscriptProvider = {
  name: 'youtube-audio-stt',

  async fetchTranscript(videoId: string, opts?: { languages?: string[] }): Promise<TranscriptResult> {
    return withTimeout(
      (async () => {
        const deepgramApiKey = process.env.DEEPGRAM_API_KEY?.trim();
        const assemblyApiKey = process.env.ASSEMBLYAI_API_KEY?.trim();

        if (!deepgramApiKey && !assemblyApiKey) {
          throw new TranscriptError(
            'sin_transcripcion',
            'No hay proveedores de IA configurados (DEEPGRAM_API_KEY o ASSEMBLYAI_API_KEY) para transcribir el audio.',
          );
        }

        // 1. Obtener información del reproductor InnerTube con sesión verificada
        const visitorData = await getYouTubeVisitorData();
        let playerResp: Response;
        try {
          playerResp = await fetch(INNERTUBE_API_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': INNERTUBE_USER_AGENT,
            },
            body: JSON.stringify({
              context: {
                client: {
                  clientName: 'ANDROID',
                  clientVersion: INNERTUBE_CLIENT_VERSION,
                  androidSdkVersion: 34,
                  hl: 'es',
                  gl: 'ES',
                  ...(visitorData ? { visitorData } : {}),
                },
              },
              videoId,
            }),
          });
        } catch (netErr) {
          throw new TranscriptError(
            'desconocido',
            `Error de conexión con YouTube: ${(netErr as Error)?.message}`,
          );
        }

        if (!playerResp.ok) {
          if (playerResp.status === 429) {
            throw new TranscriptError('bloqueado', 'Límite de solicitudes alcanzado en YouTube.');
          }
          throw new TranscriptError('desconocido', `YouTube devolvió estado HTTP ${playerResp.status}`);
        }

        const data = (await playerResp.json().catch(() => null)) as InnerTubePlayerData | null;
        if (!data) {
          throw new TranscriptError('desconocido', 'Respuesta vacía de YouTube al consultar audio.');
        }

        const playStatus = data.playabilityStatus?.status;
        const reason = data.playabilityStatus?.reason || '';
        const isPrivate = Boolean(data.videoDetails?.isPrivate) || /privado|private/i.test(reason);
        const isUnavailable =
          playStatus === 'ERROR' ||
          /unavailable|no está disponible|no disponible|eliminado|removed|borrado|deleted|does not exist/i.test(reason);

        if (isPrivate || isUnavailable) {
          throw new TranscriptError('video_no_disponible', reason || 'Este video no está disponible o es privado.');
        }

        if (playStatus === 'LOGIN_REQUIRED') {
          throw new TranscriptError('bloqueado', reason || 'YouTube requiere comprobación de acceso para este método.');
        }

        if (playStatus && playStatus !== 'OK') {
          throw new TranscriptError('bloqueado', reason || 'YouTube restringió el flujo de audio para este cliente.');
        }

        const formats = data.streamingData?.adaptiveFormats || [];
        const audioFormats = formats.filter((f) => f.mimeType?.startsWith('audio/') && Boolean(f.url));

        if (audioFormats.length === 0) {
          throw new TranscriptError(
            'sin_transcripcion',
            'No se encontró una pista de audio accesible directamente en este video.',
          );
        }

        // Selección óptima de formato:
        // itag 139: AAC ~48kbps (ultrarrápido, bajo consumo de ancho de banda y memoria, optimizado para voz)
        // itag 140: AAC ~128kbps (estándar alta calidad)
        // itag 249/251: Opus (WebM)
        const format =
          audioFormats.find((f) => f.itag === 139) ||
          audioFormats.find((f) => f.itag === 140) ||
          audioFormats.find((f) => f.mimeType.includes('audio/mp4')) ||
          audioFormats[0];

        if (!format?.url) {
          throw new TranscriptError('sin_transcripcion', 'La pista de audio no contiene URL de reproducción.');
        }

        console.info(
          `[YouTube Audio STT] Descargando flujo de audio itag ${format.itag} (${format.mimeType}) para video ${videoId}...`,
        );

        let audioResp: Response;
        try {
          audioResp = await fetch(format.url, {
            headers: {
              'User-Agent': INNERTUBE_USER_AGENT,
            },
          });
        } catch (fetchErr) {
          throw new TranscriptError(
            'desconocido',
            `Error al descargar la pista de audio de YouTube: ${(fetchErr as Error)?.message}`,
          );
        }

        if (!audioResp.ok) {
          throw new TranscriptError(
            'desconocido',
            `Error al obtener flujo de audio de YouTube (HTTP ${audioResp.status}).`,
          );
        }

        const arrayBuffer = await audioResp.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        if (buffer.length < 5_000) {
          throw new TranscriptError(
            'sin_transcripcion',
            'El flujo de audio descargado está vacío o es demasiado corto para transcribir.',
          );
        }

        console.info(
          `[YouTube Audio STT] Flujo de audio obtenido (${(buffer.length / 1024 / 1024).toFixed(
            2,
          )} MB). Iniciando transcripción neuronal...`,
        );

        const idioma = opts?.languages?.[0] || 'es';
        let resultado: { text: string; segments: TranscriptSegment[] } | null = null;
        let proveedorExitoso = '';
        let errorDeepgram = '';
        let errorAssembly = '';

        // Prioridad 1: Deepgram Nova-2
        if (deepgramApiKey) {
          try {
            console.info('[YouTube Audio STT] Transcribiendo con Deepgram Nova-2...');
            resultado = await transcribirConDeepgram(buffer, format.mimeType, deepgramApiKey, idioma);
            proveedorExitoso = 'deepgram';
          } catch (dgErr) {
            errorDeepgram = (dgErr as Error)?.message || 'Fallo desconocido en Deepgram';
            console.warn('[YouTube Audio STT] Deepgram falló, intentando respaldo:', errorDeepgram);
          }
        }

        // Prioridad 2: AssemblyAI
        if (!resultado && assemblyApiKey) {
          try {
            console.info('[YouTube Audio STT] Transcribiendo con AssemblyAI...');
            resultado = await transcribirConAssemblyAI(buffer, assemblyApiKey, idioma);
            proveedorExitoso = 'assemblyai';
          } catch (aaiErr) {
            errorAssembly = (aaiErr as Error)?.message || 'Fallo desconocido en AssemblyAI';
            console.warn('[YouTube Audio STT] AssemblyAI falló:', errorAssembly);
          }
        }

        if (!resultado || !resultado.text) {
          throw new TranscriptError(
            'sin_transcripcion',
            `No se pudo transcribir el audio del video: ${[errorDeepgram, errorAssembly]
              .filter(Boolean)
              .join(' | ')}`,
          );
        }

        const title = data.videoDetails?.title?.trim();
        const author = data.videoDetails?.author?.trim();
        const durationSec = data.videoDetails?.lengthSeconds ? parseInt(data.videoDetails.lengthSeconds, 10) : 0;

        console.info(
          `[YouTube Audio STT] Transcripción exitosa vía ${proveedorExitoso}: ${resultado.segments.length} segmentos, ${resultado.text.length} caracteres.`,
        );

        return {
          text: resultado.text,
          segments: resultado.segments,
          meta: {
            source: 'youtube',
            videoId,
            url: `https://www.youtube.com/watch?v=${videoId}`,
            language: idioma,
            generated: true,
            title,
            author,
            durationMs: durationSec > 0 ? durationSec * 1000 : undefined,
            providerName: `audio-${proveedorExitoso}`,
            method: 'audio_stt',
          },
        };
      })(),
      150_000,
      'Tiempo de espera agotado durante la extracción o transcripción del audio de YouTube.',
    );
  },
};
