// Contrato del proveedor de transcripciones. La app depende de esta interfaz,
// NO de una implementación concreta, para poder cambiar de proveedor (librería
// npm, API externa, microservicio, etc.) sin tocar el pipeline de TeoDoc.

export type TranscriptSegment = {
  text: string;
  start: number; // segundos
  duration: number; // segundos
};

export type TranscriptMeta = {
  source: 'youtube';
  videoId: string;
  url: string;
  language?: string;
  /** true = generados automáticamente; undefined si no se pudo determinar. */
  generated?: boolean;
  title?: string;
  author?: string;
  durationMs?: number;
};

export type TranscriptResult = {
  text: string;
  segments: TranscriptSegment[];
  meta: TranscriptMeta;
};

export type TranscriptErrorCode =
  | 'url_invalida'
  | 'sin_transcripcion'
  | 'bloqueado'
  | 'video_no_disponible'
  | 'desconocido';

export class TranscriptError extends Error {
  code: TranscriptErrorCode;
  constructor(code: TranscriptErrorCode, message?: string) {
    super(message || code);
    this.name = 'TranscriptError';
    this.code = code;
  }
}

export interface TranscriptProvider {
  readonly name: string;
  fetchTranscript(videoId: string, opts?: { languages?: string[] }): Promise<TranscriptResult>;
}

/** Convierte los fragmentos (con tiempos) en un texto continuo y limpio. */
export function normalizeSegments(segments: TranscriptSegment[]): string {
  return segments
    .map((s) => (s.text || '').replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}
