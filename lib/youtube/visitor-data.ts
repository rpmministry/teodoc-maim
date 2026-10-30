let cachedVisitorData: string | undefined = undefined;
let cachedExpiry = 0;

/**
 * Obtiene o reutiliza un token visitorData legítimo de YouTube para autenticar
 * la sesión de invitado ante la API de InnerTube. Evita que YouTube clasifique
 * las peticiones desde datacenters o entornos en la nube (Vercel, AWS, GCP) como tráfico sospechoso
 * o bots sin sesión.
 */
export async function getYouTubeVisitorData(): Promise<string | undefined> {
  const now = Date.now();
  if (cachedVisitorData && now < cachedExpiry) {
    return cachedVisitorData;
  }
  try {
    const res = await fetch('https://www.youtube.com/youtubei/v1/visitor_id', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      },
      body: JSON.stringify({
        context: {
          client: {
            clientName: 'WEB',
            clientVersion: '2.20240410.01.00',
            hl: 'es',
            gl: 'ES',
          },
        },
      }),
      signal: AbortSignal.timeout(6000),
    });
    if (res.ok) {
      const data = (await res.json().catch(() => null)) as {
        responseContext?: { visitorData?: string };
      } | null;
      const v = data?.responseContext?.visitorData;
      if (typeof v === 'string' && v.length > 10) {
        cachedVisitorData = v;
        cachedExpiry = now + 3600_000; // 1 hora de validez
        return v;
      }
    }
  } catch {
    // Si la llamada falla o hay timeout, se continúa sin visitorData
  }
  return undefined;
}
