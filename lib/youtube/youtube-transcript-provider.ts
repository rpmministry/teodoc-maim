import {
  fetchTranscript,
  YoutubeTranscriptDisabledError,
  YoutubeTranscriptNotAvailableError,
  YoutubeTranscriptNotAvailableLanguageError,
  YoutubeTranscriptTooManyRequestError,
  YoutubeTranscriptVideoUnavailableError,
} from 'youtube-transcript';
import {
  normalizeSegments,
  TranscriptError,
  type TranscriptProvider,
  type TranscriptResult,
  type TranscriptSegment,
} from './transcript-provider';

// Prioridad de idioma: español y sus variantes; luego el primer track disponible
// (si la prédica está en otro idioma, el análisis actual igual puede procesarla).
const LANGUAGES = ['es', 'es-419', 'es-ES', 'es-MX', 'es-US'];

// Cabeceras tipo navegador: reducen bloqueos de YouTube en entornos cloud.
const YT_HEADERS: Record<string, string> = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
  'Accept-Language': 'es-ES,es;q=0.9,en;q=0.6',
};

const ytFetch: typeof fetch = (input, init) =>
  fetch(input, {
    ...init,
    headers: { ...(init?.headers as Record<string, string> | undefined), ...YT_HEADERS },
  });

function timeoutSignal(ms: number): AbortSignal | undefined {
  const anyAbort = AbortSignal as unknown as { timeout?: (n: number) => AbortSignal };
  return typeof anyAbort?.timeout === 'function' ? anyAbort.timeout(ms) : undefined;
}

function mapError(err: unknown): TranscriptError {
  const msg = String((err as { message?: string })?.message || '');

  // Se combinan instanceof (estable) y mensaje (por si el bundling cambia la clase).
  if (
    err instanceof YoutubeTranscriptTooManyRequestError ||
    /429|too many request|too many|blocked|403|forbidden/i.test(msg)
  ) {
    return new TranscriptError('bloqueado', msg);
  }
  if (err instanceof YoutubeTranscriptVideoUnavailableError || /unavailable|private|removed|does not exist/i.test(msg)) {
    return new TranscriptError('video_no_disponible', msg);
  }
  if (
    err instanceof YoutubeTranscriptDisabledError ||
    err instanceof YoutubeTranscriptNotAvailableError ||
    err instanceof YoutubeTranscriptNotAvailableLanguageError ||
    /disabled|no transcripts|not available|no caption/i.test(msg)
  ) {
    return new TranscriptError('sin_transcripcion', msg);
  }
  return new TranscriptError('desconocido', msg || 'No se pudo obtener la transcripción.');
}

/** Metadatos best-effort (título autor). Si falla, se continúa sin ellos. */
async function fetchOembed(videoId: string): Promise<{ title?: string; author?: string }> {
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
      { signal: timeoutSignal(4000) },
    );
    if (!res.ok) return {};
    const data = await res.json();
    return { title: data?.title, author: data?.author_name };
  } catch {
    return {};
  }
}

async function fetchFromLibrary(
  videoId: string,
  languages: string[],
): Promise<{ segments: TranscriptSegment[]; language?: string }> {
  // Se intenta cada idioma en orden y, como último recurso, el primer track
  // disponible sin filtro de idioma.
  let lastError: unknown = null;
  for (const lang of [...languages, undefined]) {
    try {
      const raw = await fetchTranscript(
        videoId,
        lang ? { lang, fetch: ytFetch } : { fetch: ytFetch },
      );
      if (raw && raw.length) {
        const segments = raw.map((s) => ({
          text: (s.text || '').replace(/\s+/g, ' ').trim(),
          start: typeof s.offset === 'number' ? s.offset : 0,
          duration: typeof s.duration === 'number' ? s.duration : 0,
        }));
        return { segments, language: raw[0]?.lang };
      }
    } catch (err) {
      lastError = err;
    }
  }
  throw mapError(lastError);
}

/**
 * Proveedor basado en la librería `youtube-transcript` (InnerTube + scraping de
 * la página). NO descarga audio ni video: sólo obtiene los subtítulos.
 */
export const youtubeTranscriptProvider: TranscriptProvider = {
  name: 'youtube-transcript',
  async fetchTranscript(videoId: string, opts?: { languages?: string[] }): Promise<TranscriptResult> {
    const { segments, language } = await fetchFromLibrary(videoId, opts?.languages ?? LANGUAGES);
    const text = normalizeSegments(segments);
    if (!text) throw new TranscriptError('sin_transcripcion', 'La transcripción está vacía.');

    const { title, author } = await fetchOembed(videoId);
    return {
      text,
      segments,
      meta: {
        source: 'youtube',
        videoId,
        url: `https://www.youtube.com/watch?v=${videoId}`,
        language,
        generated: undefined,
        title,
        author,
      },
    };
  },
};
