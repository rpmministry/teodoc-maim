// Limitador de tasa en memoria (por instancia). Suficiente como primera barrera
// contra abuso de endpoints con costo; no reemplaza un límite distribuido.
type Bucket = { count: number; reset: number };

const buckets = new Map<string, Bucket>();

function ipDe(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return req.headers.get('x-real-ip') || 'anon';
}

/** Devuelve true si la petición está permitida; false si superó el límite. */
export function permitirPeticion(req: Request, max = 20, ventanaMs = 60_000): boolean {
  const ip = ipDe(req);
  const ahora = Date.now();
  const bucket = buckets.get(ip);

  if (!bucket || ahora > bucket.reset) {
    buckets.set(ip, { count: 1, reset: ahora + ventanaMs });
    return true;
  }
  if (bucket.count >= max) return false;
  bucket.count += 1;
  return true;
}
