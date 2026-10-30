import {
  normalizeSegments,
  TranscriptError,
  withTimeout,
  type TranscriptProvider,
  type TranscriptResult,
  type TranscriptSegment,
} from './transcript-provider.ts';
import { parseVtt } from './vtt.ts';
import { fetchYouTubeOembed } from './oembed.ts';

// Respaldo OPEN SOURCE auto-hospedable. Apunta a un servicio propio (por
// ejemplo `youtube-transcript-api`, ver microservicios-externos/youtube-transcript-api) que no
// depende de créditos de terceros: se puede usar indefinidamente.
//
// Contrato del servicio:
//   GET  {TRANSCRIPT_SERVICE_URL}?videoId=ID&lang=es
//   Auth opcional:  Authorization: Bearer {TRANSCRIPT_SERVICE_TOKEN}
//   Respuesta JSON: { "text": "...", "segments": [{ "text", "start", "duration" }], "lang": "es" }
//   También se acepta una respuesta WebVTT/SRT (text/vtt) y se parsea.
const LANG_PREFERENCE = ['es', 'es-419', 'es-ES', 'es-MX', 'es-US'];
const REQUEST_TIMEOUT_MS = 60_000;

type JsonSegment = { text?: string; start?: number; offset?: number; duration?: number };
type JsonTranscript = { text?: string; segments?: JsonSegment[]; content?: JsonSegment[] | string; lang?: string };

function fromJson(data: JsonTranscript): TranscriptSegment[] {
  const arr = data.segments || (Array.isArray(data.content) ? data.content : undefined);
  if (arr) {
    return arr
      .map((s) => ({
        text: (s.text || '').replace(/\s+/g, ' ').trim(),
        start: typeof s.start === 'number' ? s.start : typeof s.offset === 'number' ? s.offset / 1000 : 0,
        duration: typeof s.duration === 'number' ? s.duration : 0,
      }))
      .filter((s) => s.text);
  }
  if (typeof data.content === 'string') {
    const text = data.content.replace(/\s+/g, ' ').trim();
    return text ? [{ text, start: 0, duration: 0 }] : [];
  }
  return [];
}

function mapStatus(status: number): TranscriptError {
  if (status === 404) return new TranscriptError('video_no_disponible', `HTTP ${status}`);
  // Sin subtítulos: error "blando" para que otro proveedor pueda generarlos.
  if (status === 422) return new TranscriptError('sin_subtitulos', `HTTP ${status}`);
  if (status === 401 || status === 403 || status === 429 || status === 503 || status === 504) {
    return new TranscriptError('bloqueado', `HTTP ${status}`);
  }
  return new TranscriptError('desconocido', `HTTP ${status}`);
}

export const remoteTranscriptProvider: TranscriptProvider = {
  name: 'remote-service',
  async fetchTranscript(videoId: string, opts?: { languages?: string[] }): Promise<TranscriptResult> {
    const base = process.env.TRANSCRIPT_SERVICE_URL;
    if (!base) throw new TranscriptError('desconocido', 'Falta TRANSCRIPT_SERVICE_URL');

    const lang = opts?.languages?.[0] || LANG_PREFERENCE[0];
    const url = `${base}${base.includes('?') ? '&' : '?'}videoId=${encodeURIComponent(videoId)}&lang=${encodeURIComponent(lang)}`;
    const headers: Record<string, string> = {};
    const token = process.env.TRANSCRIPT_SERVICE_TOKEN;
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await withTimeout(
      fetch(url, { headers, cache: 'no-store' }),
      REQUEST_TIMEOUT_MS,
      'El servicio de transcripción no respondió a tiempo.',
    );
    if (!res.ok) throw mapStatus(res.status);

    const contentType = (res.headers.get('content-type') || '').toLowerCase();
    let segments: TranscriptSegment[] = [];
    let language: string | undefined;

    if (contentType.includes('application/json')) {
      const data: JsonTranscript = await res.json();
      language = data.lang;
      segments = fromJson(data);
      if (!segments.length && typeof data.text === 'string') {
        const text = data.text.replace(/\s+/g, ' ').trim();
        if (text) segments = [{ text, start: 0, duration: 0 }];
      }
    } else {
      segments = parseVtt(await res.text());
    }

    const text = normalizeSegments(segments);
    // Vacío = sin subtítulos: deja que otro proveedor (Supadata) lo intente.
    if (!text) throw new TranscriptError('sin_subtitulos', 'Sin subtítulos disponibles.');

    const { title, author } = await fetchYouTubeOembed(videoId);
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
