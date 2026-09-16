// Limitador de tasa en memoria robusto y eficiente para protección contra abusos y DDoS.
// Soporta claves aisladas por endpoint, cuotas por IP y limpieza periódica de memoria.

type Bucket = { count: number; reset: number };

const buckets = new Map<string, Bucket>();
let ultimoMantenimiento = Date.now();
const INTERVALO_LIMPIEZA_MS = 5 * 60 * 1000; // Cada 5 minutos

function limpiarBucketsExpirados() {
  const ahora = Date.now();
  if (ahora - ultimoMantenimiento < INTERVALO_LIMPIEZA_MS && buckets.size < 5000) {
    return;
  }
  ultimoMantenimiento = ahora;
  for (const [clave, bucket] of buckets.entries()) {
    if (ahora > bucket.reset) {
      buckets.delete(clave);
    }
  }
}

export function extraerIP(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  const real = req.headers.get('x-real-ip');
  if (real) return real.trim();
  const cf = req.headers.get('cf-connecting-ip');
  if (cf) return cf.trim();
  return '127.0.0.1';
}

export interface ResultadoRateLimit {
  permitido: boolean;
  restante: number;
  resetMs: number;
}

/**
 * Verifica si una petición dentro de una categoría / endpoint específico está permitida.
 */
export function verificarRateLimit(
  req: Request,
  prefijo: string = 'general',
  max: number = 20,
  ventanaMs: number = 60_000
): ResultadoRateLimit {
  limpiarBucketsExpirados();

  const ip = extraerIP(req);
  const clave = `${prefijo}:${ip}`;
  const ahora = Date.now();
  const bucket = buckets.get(clave);

  if (!bucket || ahora > bucket.reset) {
    buckets.set(clave, { count: 1, reset: ahora + ventanaMs });
    return {
      permitido: true,
      restante: max - 1,
      resetMs: ventanaMs,
    };
  }

  if (bucket.count >= max) {
    return {
      permitido: false,
      restante: 0,
      resetMs: Math.max(0, bucket.reset - ahora),
    };
  }

  bucket.count += 1;
  return {
    permitido: true,
    restante: Math.max(0, max - bucket.count),
    resetMs: Math.max(0, bucket.reset - ahora),
  };
}

/**
 * Compatibilidad con la firma original para rutas existentes.
 */
export function permitirPeticion(req: Request, max = 20, ventanaMs = 60_000): boolean {
  return verificarRateLimit(req, 'general', max, ventanaMs).permitido;
}
