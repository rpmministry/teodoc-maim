import {
  TranscriptError,
  type TranscriptProvider,
  type TranscriptResult,
  type TranscriptSegment,
  withTimeout,
} from './transcript-provider.ts';

const INNERTUBE_API_URL = 'https://www.youtube.com/youtubei/v1/player?prettyPrint=false';
const INNERTUBE_CLIENT_VERSION = '20.10.38';
const INNERTUBE_USER_AGENT = `com.google.android.youtube/${INNERTUBE_CLIENT_VERSION} (Linux; U; Android 14)`;

function decodificarEntidades(texto: string): string {
  return texto
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)));
}

function parsearXmlSubtitulos(xml: string, idioma?: string): TranscriptSegment[] {
  const segmentos: TranscriptSegment[] = [];

  // Formato srv3: <p t="ms" d="ms"><s>palabra</s>...</p>
  const pRegex = /<p\s+t="(\d+)"\s+d="(\d+)"[^>]*>([\s\S]*?)<\/p>/g;
  let match: RegExpExecArray | null;

  while ((match = pRegex.exec(xml)) !== null) {
    const startMs = parseInt(match[1], 10);
    const durMs = parseInt(match[2], 10);
    const inner = match[3];

    let texto = '';
    const sRegex = /<s[^>]*>([^<]*)<\/s>/g;
    let sMatch: RegExpExecArray | null;

    while ((sMatch = sRegex.exec(inner)) !== null) {
      texto += sMatch[1];
    }

    if (!texto) {
      texto = inner.replace(/<[^>]+>/g, '');
    }

    texto = decodificarEntidades(texto).replace(/\s+/g, ' ').trim();
    if (texto) {
      segmentos.push({
        text: texto,
        start: startMs / 1000,
        duration: durMs / 1000,
      });
    }
  }

  if (segmentos.length > 0) return segmentos;

  // Formato clásico de respaldo: <text start="s" dur="s">contenido</text>
  const classicRegex = /<text\s+start="([^"]*)"\s+dur="([^"]*)"[^>]*>([\s\S]*?)<\/text>/g;
  while ((match = classicRegex.exec(xml)) !== null) {
    const startSec = parseFloat(match[1]);
    const durSec = parseFloat(match[2]);
    const texto = decodificarEntidades(match[3]).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

    if (texto) {
      segmentos.push({
        text: texto,
        start: Number.isFinite(startSec) ? startSec : 0,
        duration: Number.isFinite(durSec) ? durSec : 0,
      });
    }
  }

  return segmentos;
}

/**
 * Proveedor nativo de alto rendimiento para YouTube basado en InnerTube Android.
 * No realiza scraping de HTML, no descarga video ni audio, y obtiene subtítulos
 * directos oficiales y metadatos (título y autor) en ~1-2 segundos.
 */
export const innertubeTranscriptProvider: TranscriptProvider = {
  name: 'innertube',

  async fetchTranscript(videoId: string, opts?: { languages?: string[] }): Promise<TranscriptResult> {
    return withTimeout(
      (async () => {
        let resp: Response;
        try {
          resp = await fetch(INNERTUBE_API_URL, {
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
                },
              },
              videoId,
            }),
          });
        } catch (netErr) {
          throw new TranscriptError('desconocido', `Error de red al conectar con YouTube: ${(netErr as Error)?.message}`);
        }

        if (!resp.ok) {
          if (resp.status === 429) {
            throw new TranscriptError('bloqueado', 'Límite de solicitudes alcanzado en YouTube.');
          }
          throw new TranscriptError('desconocido', `YouTube devolvió estado HTTP ${resp.status}`);
        }

        const data = (await resp.json().catch(() => null)) as {
          videoDetails?: { title?: string; author?: string; isPrivate?: boolean };
          playabilityStatus?: { status?: string; reason?: string };
          captions?: {
            playerCaptionsTracklistRenderer?: {
              captionTracks?: Array<{
                baseUrl: string;
                vssId?: string;
                languageCode?: string;
                kind?: string;
              }>;
            };
          };
        } | null;

        if (!data) {
          throw new TranscriptError('desconocido', 'Respuesta vacía de YouTube.');
        }

        const playStatus = data.playabilityStatus?.status;
        if ((playStatus && playStatus !== 'OK') || data.videoDetails?.isPrivate) {
          const reason = data.playabilityStatus?.reason || 'Este video no está disponible o es privado.';
          if (playStatus === 'LOGIN_REQUIRED') {
            throw new TranscriptError('video_no_disponible', 'Este video requiere inicio de sesión, es privado o tiene restricción de edad.');
          }
          throw new TranscriptError('video_no_disponible', reason);
        }

        const captionTracks = data.captions?.playerCaptionsTracklistRenderer?.captionTracks;
        if (!Array.isArray(captionTracks) || captionTracks.length === 0) {
          throw new TranscriptError(
            'sin_subtitulos',
            'No encontramos subtítulos automáticos en este video de YouTube.'
          );
        }

        // Selección inteligente de pista:
        // 1. Prioridad: español explícito ('es', 'es-419', 'es-ES', etc.)
        // 2. Idiomas solicitados en opts
        // 3. Primera pista disponible
        const idiomasBuscados = opts?.languages && opts.languages.length > 0 ? opts.languages : ['es', 'es-419', 'es-ES', 'es-MX', 'es-US'];
        let selectedTrack = captionTracks.find((t) =>
          idiomasBuscados.some((lang) => (t.languageCode || '').toLowerCase() === lang.toLowerCase())
        );

        if (!selectedTrack) {
          selectedTrack = captionTracks.find((t) => (t.languageCode || '').toLowerCase().startsWith('es'));
        }

        if (!selectedTrack) {
          selectedTrack = captionTracks[0];
        }

        if (!selectedTrack?.baseUrl) {
          throw new TranscriptError('sin_transcripcion', 'La pista de subtítulos no tiene URL válida.');
        }

        let timedTextRes: Response;
        try {
          timedTextRes = await fetch(selectedTrack.baseUrl, {
            headers: {
              'User-Agent': INNERTUBE_USER_AGENT,
            },
          });
        } catch (ttErr) {
          throw new TranscriptError('desconocido', `Error al descargar los subtítulos: ${(ttErr as Error)?.message}`);
        }

        if (!timedTextRes.ok) {
          throw new TranscriptError('sin_transcripcion', `Error al obtener subtítulos (HTTP ${timedTextRes.status}).`);
        }

        const xml = await timedTextRes.text();
        const segments = parsearXmlSubtitulos(xml, selectedTrack.languageCode);

        const text = segments
          .map((s) => s.text)
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim();

        if (!text || text.length < 50) {
          throw new TranscriptError('sin_transcripcion', 'La transcripción obtenida está vacía o es muy corta.');
        }

        const title = data.videoDetails?.title?.trim();
        const author = data.videoDetails?.author?.trim();

        return {
          text,
          segments,
          meta: {
            source: 'youtube',
            videoId,
            url: `https://www.youtube.com/watch?v=${videoId}`,
            language: selectedTrack.languageCode || 'es',
            generated: selectedTrack.kind === 'asr',
            title,
            author,
            providerName: 'innertube',
            method: 'subtitulos',
          },
        };
      })(),
      15_000,
      'Tiempo de espera agotado al consultar YouTube.'
    );
  },
};
