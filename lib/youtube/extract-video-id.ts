// Extrae el video_id de un enlace de YouTube. Lógica única y compartida por
// el frontend (validación previa) y el backend (API route).
const VIDEO_ID_RE = /^[A-Za-z0-9_-]{11}$/;

const SUBPATHS = new Set(['shorts', 'embed', 'live', 'v', 'watch']);

function isYouTubeHost(host: string): boolean {
  return (
    host === 'youtu.be' ||
    host === 'youtube.com' ||
    host.endsWith('.youtube.com') ||
    host === 'youtube-nocookie.com' ||
    host.endsWith('.youtube-nocookie.com')
  );
}

/**
 * Devuelve el video_id de 11 caracteres o null si el texto no es un enlace
 * válido de YouTube. Acepta watch?v=, youtu.be/, /shorts/, /embed/, /live/, /v/
 * y también un video_id pegado directamente.
 */
export function extractYouTubeVideoId(input: string): string | null {
  if (!input) return null;
  let raw = input.trim();
  if (!raw) return null;

  // El usuario pudo pegar sólo el identificador.
  if (VIDEO_ID_RE.test(raw)) return raw;

  if (!/^https?:\/\//i.test(raw)) raw = `https://${raw}`;

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }

  const host = url.hostname.toLowerCase().replace(/^www\./, '').replace(/^m\./, '');
  if (!isYouTubeHost(host)) return null;

  if (host === 'youtu.be') {
    const id = url.pathname.split('/').filter(Boolean)[0] || '';
    return VIDEO_ID_RE.test(id) ? id : null;
  }

  const v = url.searchParams.get('v');
  if (v && VIDEO_ID_RE.test(v)) return v;

  const parts = url.pathname.split('/').filter(Boolean);
  if (parts.length >= 2 && SUBPATHS.has(parts[0].toLowerCase())) {
    const id = parts[1];
    if (VIDEO_ID_RE.test(id)) return id;
  }

  return null;
}

export function isYouTubeUrl(input: string): boolean {
  return extractYouTubeVideoId(input) !== null;
}
