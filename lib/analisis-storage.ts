/**
 * Almacenamiento y Recuperación de Estado en Cliente.
 * Protege contra pérdida de análisis por bloqueo de pantalla, recargas de pestaña
 * o descarte de memoria en Safari iOS y Android.
 */

const STORAGE_KEY_ANALISIS = 'teodoc_ultimo_analisis_v1';
const STORAGE_KEY_TRANSCRIPCION = 'teodoc_transcripcion_activa_v1';
const TTL_ANALISIS_MS = 48 * 60 * 60 * 1000; // 48 horas

interface RegistroAnalisis<T> {
  resultado: T;
  timestamp: number;
}

export function guardarUltimoAnalisis<T>(resultado: T): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const registro: RegistroAnalisis<T> = {
      resultado,
      timestamp: Date.now(),
    };
    window.localStorage.setItem(STORAGE_KEY_ANALISIS, JSON.stringify(registro));
    // Al guardar un resultado exitoso, limpiamos la transcripción intermedia
    limpiarTranscripcionPendiente();
  } catch (err) {
    console.warn('[Storage] No se pudo persistir el análisis en localStorage:', err);
  }
}

export function obtenerUltimoAnalisis<T>(): T | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  try {
    const dataRaw = window.localStorage.getItem(STORAGE_KEY_ANALISIS);
    if (!dataRaw) return null;
    const registro: RegistroAnalisis<T> = JSON.parse(dataRaw);
    if (!registro || typeof registro !== 'object' || !registro.resultado) return null;

    // Verificar expiración (48 horas)
    if (Date.now() - registro.timestamp > TTL_ANALISIS_MS) {
      limpiarUltimoAnalisis();
      return null;
    }

    return registro.resultado;
  } catch (err) {
    console.warn('[Storage] Error al recuperar análisis de localStorage:', err);
    return null;
  }
}

export function limpiarUltimoAnalisis(): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.removeItem(STORAGE_KEY_ANALISIS);
  } catch {
    // Ignorar
  }
}

export function guardarTranscripcionPendiente(texto: string): void {
  if (typeof window === 'undefined' || !window.sessionStorage) return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY_TRANSCRIPCION, texto);
  } catch {
    // Ignorar
  }
}

export function obtenerTranscripcionPendiente(): string | null {
  if (typeof window === 'undefined' || !window.sessionStorage) return null;
  try {
    return window.sessionStorage.getItem(STORAGE_KEY_TRANSCRIPCION);
  } catch {
    return null;
  }
}

export function limpiarTranscripcionPendiente(): void {
  if (typeof window === 'undefined' || !window.sessionStorage) return;
  try {
    window.sessionStorage.removeItem(STORAGE_KEY_TRANSCRIPCION);
  } catch {
    // Ignorar
  }
}
