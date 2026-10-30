import {
  normalizeSegments,
  TranscriptError,
  withTimeout,
  type TranscriptProvider,
  type TranscriptResult,
  type TranscriptSegment,
} from './transcript-provider.ts';
import { fetchYouTubeOembed } from './oembed.ts';

// Proveedor externo (Supadata). Corre desde su infraestructura, por lo que no
// sufre los bloqueos de IP que YouTube aplica a proveedores cloud.
// mode=auto: usa la transcripción nativa; si no existe, la GENERA con IA, de
// modo que casi cualquier video puede analizarse.
const BASE = 'https://api.supadata.ai/v1';
const LANG_PREFERENCE = ['es', 'es-419', 'es-ES', 'es-MX', 'es-US'];
const REQUEST_TIMEOUT_MS = 30_000;
const JOB_POLL_INTERVAL_MS = 2_000;
const JOB_MAX_WAIT_MS = 100_000;

type Chunk = { text?: string; offset?: number; duration?: number; lang?: string };
type TranscriptPayload = { content?: Chunk[] | string; lang?: string; availableLangs?: string[] };
type JobPayload = { status?: string; content?: Chunk[] | string; lang?: string; error?: { error?: string } | null };

function toSegments(content: Chunk[] | string | undefined): TranscriptSegment[] {
  if (typeof content === 'string') {
    const text = content.replace(/\s+/g, ' ').trim();
    return text ? [{ text, start: 0, duration: 0 }] : [];
  }
  if (!Array.isArray(content)) return [];
  return content
    .map((c) => ({
      text: (c.text || '').replace(/\s+/g, ' ').trim(),
      start: (typeof c.offset === 'number' ? c.offset : 0) / 1000,
      duration: (typeof c.duration === 'number' ? c.duration : 0) / 1000,
    }))
    .filter((s) => s.text);
}

function mapStatus(status: number, errorCode?: string): TranscriptError {
  const code = errorCode || '';
  if (status === 206 || code === 'transcript-unavailable') {
    return new TranscriptError('sin_transcripcion', code || 'transcript-unavailable');
  }
  if (
    status === 401 ||
    status === 429 ||
    code === 'unauthorized' ||
    code === 'forbidden' ||
    code === 'upgrade-required' ||
    code === 'limit-exceeded'
  ) {
    return new TranscriptError('bloqueado', code || `HTTP ${status}`);
  }
  if (status === 404 || code === 'not-found') {
    return new TranscriptError('video_no_disponible', code || `HTTP ${status}`);
  }
  return new TranscriptError('desconocido', code || `HTTP ${status}`);
}

async function supadataFetch(path: string, apiKey: string): Promise<Response> {
  return withTimeout(
    fetch(`${BASE}${path}`, { headers: { 'x-api-key': apiKey }, cache: 'no-store' }),
    REQUEST_TIMEOUT_MS,
    'Supadata no respondió a tiempo.',
  );
}

async function pollJob(jobId: string, apiKey: string): Promise<TranscriptPayload> {
  const started = Date.now();
  while (Date.now() - started < JOB_MAX_WAIT_MS) {
    await new Promise((resolve) => setTimeout(resolve, JOB_POLL_INTERVAL_MS));
    const res = await supadataFetch(`/transcript/${encodeURIComponent(jobId)}`, apiKey);
    if (!res.ok) throw mapStatus(res.status);
    const job: JobPayload = await res.json();
    if (job.status === 'completed') return { content: job.content, lang: job.lang };
    if (job.status === 'failed') {
      throw new TranscriptError('sin_transcripcion', job.error?.error || 'transcript-unavailable');
    }
  }
  throw new TranscriptError('bloqueado', 'El trabajo de transcripción tardó demasiado.');
}

export const supadataTranscriptProvider: TranscriptProvider = {
  name: 'supadata',
  async fetchTranscript(videoId: string, opts?: { languages?: string[] }): Promise<TranscriptResult> {
    const apiKey = process.env.SUPADATA_API_KEY;
    if (!apiKey) throw new TranscriptError('desconocido', 'Falta SUPADATA_API_KEY');

    const lang = opts?.languages?.[0] || LANG_PREFERENCE[0];
    const videoUrl = encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`);
    const res = await supadataFetch(
      `/transcript?url=${videoUrl}&lang=${encodeURIComponent(lang)}&mode=auto`,
      apiKey,
    );

    if (!res.ok) {
      let errorCode: string | undefined;
      try {
        errorCode = (await res.json())?.error;
      } catch {
        /* respuesta sin JSON */
      }
      throw mapStatus(res.status, errorCode);
    }

    const data: (TranscriptPayload & { jobId?: string }) = await res.json();
    const payload: TranscriptPayload = data.jobId ? await pollJob(data.jobId, apiKey) : data;

    const segments = toSegments(payload.content);
    const text = normalizeSegments(segments);
    if (!text) throw new TranscriptError('sin_transcripcion', 'La transcripción está vacía.');

    const { title, author } = await fetchYouTubeOembed(videoId);
    return {
      text,
      segments,
      meta: {
        source: 'youtube',
        videoId,
        url: `https://www.youtube.com/watch?v=${videoId}`,
        language: payload.lang,
        generated: undefined,
        title,
        author,
      },
    };
  },
};
