/**
 * Gestor de Pantalla Activa (Screen Wake Lock API).
 * Impide que la pantalla de teléfonos y tabletas (iOS Safari 16.4+, Android Chrome)
 * se apague automáticamente durante la subida, transcripción y análisis homilético.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let wakeLockSentinel: any = null;
let procesoActivo = false;
let listenerRegistrado = false;

/**
 * Solicita el bloqueo de apagado de pantalla al navegador.
 * Seguro ante navegadores sin soporte o restricciones de permisos.
 */
export async function adquirirPantallaActiva(): Promise<boolean> {
  procesoActivo = true;

  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }

  // Comprobar soporte de la Screen Wake Lock API
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!('wakeLock' in navigator) || typeof (navigator as any).wakeLock?.request !== 'function') {
    return false;
  }

  try {
    // Si ya tenemos un bloqueo activo, no duplicar
    if (wakeLockSentinel && !wakeLockSentinel.released) {
      return true;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    wakeLockSentinel = await (navigator as any).wakeLock.request('screen');

    wakeLockSentinel.addEventListener('release', () => {
      wakeLockSentinel = null;
    });

    // Registrar observador de visibilidad para re-adquirir si el usuario minimizó y volvió
    if (!listenerRegistrado && typeof document !== 'undefined') {
      listenerRegistrado = true;
      document.addEventListener('visibilitychange', async () => {
        if (procesoActivo && document.visibilityState === 'visible') {
          await adquirirPantallaActiva();
        }
      });
    }

    return true;
  } catch (err) {
    // El navegador puede rechazar el wake lock si la batería está en modo extremo de ahorro
    console.warn('[WakeLock] No se pudo activar el bloqueo de pantalla:', err);
    return false;
  }
}

/**
 * Libera el bloqueo de pantalla inmediatamente al finalizar el análisis o ante un error.
 * Permite que el dispositivo vuelva a su comportamiento normal de ahorro de batería.
 */
export async function liberarPantallaActiva(): Promise<void> {
  procesoActivo = false;

  if (wakeLockSentinel) {
    try {
      await wakeLockSentinel.release();
    } catch {
      // Ignorar si ya fue liberado
    } finally {
      wakeLockSentinel = null;
    }
  }
}

/**
 * Indica si el bloqueo de pantalla está actualmente en vigor.
 */
export function estaPantallaActiva(): boolean {
  return Boolean(wakeLockSentinel && !wakeLockSentinel.released);
}
