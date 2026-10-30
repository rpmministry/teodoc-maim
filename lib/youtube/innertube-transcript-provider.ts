import {
  TranscriptError,
  type TranscriptProvider,
  type TranscriptResult,
  type TranscriptSegment,
  withTimeout,
} from './transcript-provider.ts';
import { getYouTubeVisitorData } from './visitor-data.ts';
import { fetchYouTubeOembed } from './oembed.ts';

const INNERTUBE_API_URL = 'https://www.youtube.com/youtubei/v1/player?prettyPrint=false';

interface InnerTubeClientProfile {
  name: string;
  context: {
    client: Record<string, unknown>;
  };
  userAgent: string;
}

const OBTENER_PERFILES_CLIENTE = (visitorData?: string): InnerTubeClientProfile[] => [
  // 1. Cliente oficial iOS: inmune a comprobaciones de Play Integrity / DroidGuard y bloqueos 429 en centros de datos (Vercel/AWS).
  {
    name: 'IOS',
    context: {
      client: {
        clientName: 'IOS',
        clientVersion: '21.26.4',
        deviceMake: 'Apple',
        deviceModel: 'iPhone16,2',
        userInterfaceTheme: 'USER_INTERFACE_THEME_DARK',
        osName: 'iOS',
        osVersion: '18.3.2.22D82',
        timeZone: 'Europe/Madrid',
        utcOffsetMinutes: 60,
        hl: 'es',
        gl: 'ES',
      },
    },
    userAgent: 'com.google.ios.youtube/21.26.4 (iPhone16,2; U; CPU iOS 18_3_2 like Mac OS X;)',
  },
  // 2. Cliente oficial Android con visitorData de sesión rotativa
  {
    name: 'ANDROID',
    context: {
      client: {
        clientName: 'ANDROID',
        clientVersion: '20.10.38',
        androidSdkVersion: 34,
        hl: 'es',
        gl: 'ES',
        ...(visitorData ? { visitorData } : {}),
      },
    },
    userAgent: 'com.google.android.youtube/20.10.38 (Linux; U; Android 14)',
  },
];

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

function parsearXmlSubtitulos(xml: string, _idioma?: string): TranscriptSegment[] {
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

  // Formato clásico: <text start="s" dur="s">contenido</text>
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
 * Proveedor nativo de alto rendimiento para YouTube basado en perfiles multi-cliente de InnerTube.
 * Prioriza el cliente oficial de iOS (inmune a bot-challenges y rate-limits en IPs de centros de datos de Vercel/AWS)
 * con respaldo automático a Android con sesión verificada.
 * No realiza scraping de HTML, no descarga video ni audio, y obtiene subtítulos
 * directos oficiales y metadatos (título y autor) en ~1-2 segundos.
 */
export const innertubeTranscriptProvider: TranscriptProvider = {
  name: 'innertube',

  async fetchTranscript(videoId: string, opts?: { languages?: string[] }): Promise<TranscriptResult> {
    return withTimeout(
      (async () => {
        const visitorData = await getYouTubeVisitorData();
        const perfiles = OBTENER_PERFILES_CLIENTE(visitorData);

        let ultimoError: TranscriptError | null = null;

        for (const perfil of perfiles) {
          try {
            let resp: Response;
            try {
              resp = await fetch(INNERTUBE_API_URL, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'User-Agent': perfil.userAgent,
                },
                body: JSON.stringify({
                  context: perfil.context,
                  videoId,
                }),
              });
            } catch (netErr) {
              console.warn(`[InnerTube] Error de red en perfil ${perfil.name}:`, (netErr as Error)?.message);
              ultimoError = new TranscriptError('desconocido', `Error de red al conectar con YouTube: ${(netErr as Error)?.message}`);
              continue;
            }

            if (!resp.ok) {
              if (resp.status === 429) {
                console.warn(`[InnerTube] Perfil ${perfil.name} recibió HTTP 429. Probando siguiente perfil...`);
                ultimoError = new TranscriptError('bloqueado', 'Límite de solicitudes alcanzado en YouTube.');
                continue;
              }
              console.warn(`[InnerTube] Perfil ${perfil.name} devolvió HTTP ${resp.status}. Probando siguiente...`);
              ultimoError = new TranscriptError('desconocido', `YouTube devolvió estado HTTP ${resp.status}`);
              continue;
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
              ultimoError = new TranscriptError('desconocido', 'Respuesta vacía de YouTube.');
              continue;
            }

            const playStatus = data.playabilityStatus?.status;
            const reason = data.playabilityStatus?.reason || '';
            const isPrivate = Boolean(data.videoDetails?.isPrivate) || /privado|private/i.test(reason);
            const isUnavailable =
              playStatus === 'ERROR' ||
              /unavailable|no está disponible|no disponible|eliminado|removed|borrado|deleted|does not exist/i.test(reason);

            // Si el video está eliminado o no existe en absoluto, no insistir en otros clientes
            if (isPrivate || isUnavailable) {
              throw new TranscriptError('video_no_disponible', reason || 'Este video no está disponible o es privado.');
            }

            if (playStatus === 'LOGIN_REQUIRED') {
              console.warn(`[InnerTube] Perfil ${perfil.name} requiere login (${reason}). Probando siguiente perfil...`);
              ultimoError = new TranscriptError('bloqueado', reason || 'YouTube requiere comprobación de acceso para este método.');
              continue;
            }

            if (playStatus && playStatus !== 'OK') {
              console.warn(`[InnerTube] Perfil ${perfil.name} playStatus: ${playStatus} (${reason}). Probando siguiente...`);
              ultimoError = new TranscriptError('bloqueado', reason || 'YouTube no autorizó la consulta directa por este método.');
              continue;
            }

            const captionTracks = data.captions?.playerCaptionsTracklistRenderer?.captionTracks;
            if (!Array.isArray(captionTracks) || captionTracks.length === 0) {
              console.warn(`[InnerTube] Perfil ${perfil.name} no devolvió pistas de subtítulos. Probando siguiente...`);
              ultimoError = new TranscriptError(
                'sin_subtitulos',
                'No encontramos subtítulos automáticos en este video de YouTube.'
              );
              continue;
            }

            // Selección inteligente de pista:
            // 1. Idiomas solicitados en opts o español por defecto
            // 2. Primera pista disponible
            const idiomasBuscados = opts?.languages && opts.languages.length > 0
              ? opts.languages
              : ['es', 'es-419', 'es-ES', 'es-MX', 'es-US'];

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
              ultimoError = new TranscriptError('sin_transcripcion', 'La pista de subtítulos no tiene URL válida.');
              continue;
            }

            let timedTextRes: Response;
            try {
              timedTextRes = await fetch(selectedTrack.baseUrl, {
                headers: {
                  'User-Agent': perfil.userAgent,
                },
              });
            } catch (ttErr) {
              console.warn(`[InnerTube] Error al descargar subtítulos con perfil ${perfil.name}:`, (ttErr as Error)?.message);
              ultimoError = new TranscriptError('desconocido', `Error al descargar los subtítulos: ${(ttErr as Error)?.message}`);
              continue;
            }

            if (!timedTextRes.ok) {
              ultimoError = new TranscriptError('sin_subtitulos', `Error al obtener subtítulos (HTTP ${timedTextRes.status}).`);
              continue;
            }

            const xml = await timedTextRes.text();
            const segments = parsearXmlSubtitulos(xml, selectedTrack.languageCode);

            const text = segments
              .map((s) => s.text)
              .join(' ')
              .replace(/\s+/g, ' ')
              .trim();

            if (!text || text.length < 50) {
              ultimoError = new TranscriptError('sin_subtitulos', 'La pista de subtítulos está vacía o es muy corta.');
              continue;
            }

            let title = data.videoDetails?.title?.trim();
            let author = data.videoDetails?.author?.trim();

            // Respaldo de metadatos vía oEmbed si vienen vacíos
            if (!title || !author) {
              const oembed = await fetchYouTubeOembed(videoId);
              if (!title && oembed.title) title = oembed.title;
              if (!author && oembed.author) author = oembed.author;
            }

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
          } catch (err) {
            if (err instanceof TranscriptError && err.code === 'video_no_disponible') {
              throw err;
            }
            ultimoError = err instanceof TranscriptError ? err : new TranscriptError('desconocido', (err as Error)?.message);
          }
        }

        throw ultimoError || new TranscriptError('sin_subtitulos', 'No encontramos subtítulos utilizables en este video.');
      })(),
      15_000,
      'Tiempo de espera agotado al consultar YouTube.'
    );
  },
};
