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
  /** Proveedor que realmente sirvió la transcripción (diagnóstico). */
  providerName?: string;
};

export type TranscriptResult = {
  text: string;
  segments: TranscriptSegment[];
  meta: TranscriptMeta;
};

export type TranscriptErrorCode =
  | 'url_invalida'
  | 'sin_subtitulos'
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

/** Limita una promesa en el tiempo para que una petición nunca quede colgada. */
export function withTimeout<T>(promise: Promise<T>, ms: number, message = 'Tiempo de espera agotado.'): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const id = setTimeout(() => reject(new TranscriptError('bloqueado', message)), ms);
    promise.then(
      (value) => { clearTimeout(id); resolve(value); },
      (err) => { clearTimeout(id); reject(err); },
    );
  });
}

// Errores "definitivos": no tiene sentido probar otro proveedor.
// `sin_subtitulos` NO es definitivo: otro proveedor (p. ej. Supadata) puede
// generar la transcripción con IA aunque este no encuentre subtítulos.
const DEFINITIVE: TranscriptErrorCode[] = ['sin_transcripcion', 'video_no_disponible', 'url_invalida'];

/**
 * Encadena varios proveedores. Si el primero falla por un motivo transitorio
 * (bloqueo, red, desconocido) se intenta el siguiente; ante un error definitivo
 * (sin transcripción / video no disponible) se detiene.
 */
export class FallbackTranscriptProvider implements TranscriptProvider {
  readonly name: string;
  private readonly providers: TranscriptProvider[];

  constructor(providers: TranscriptProvider[]) {
    this.providers = providers.filter(Boolean);
    this.name = this.providers.map((p) => p.name).join('->') || 'none';
  }

  async fetchTranscript(videoId: string, opts?: { languages?: string[] }): Promise<TranscriptResult> {
    let lastError: unknown = null;
    for (const provider of this.providers) {
      try {
        const result = await provider.fetchTranscript(videoId, opts);
        // Deja rastro de qué proveedor respondió (diagnóstico en la respuesta).
        result.meta.providerName = provider.name;
        return result;
      } catch (err) {
        lastError = err;
        const code: TranscriptErrorCode = err instanceof TranscriptError ? err.code : 'desconocido';
        console.warn(`[Transcript] ${provider.name} falló (${code}):`, (err as Error)?.message);
        if (DEFINITIVE.includes(code)) throw err;
      }
    }
    throw lastError instanceof TranscriptError
      ? lastError
      : new TranscriptError('desconocido', String((lastError as Error)?.message || lastError));
  }
}
