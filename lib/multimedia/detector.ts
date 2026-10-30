/**
 * Detector y validador de enlaces multimedia con protección perimetral anti-SSRF.
 */

export type ProveedorMultimedia =
  | 'youtube'
  | 'vimeo'
  | 'facebook'
  | 'instagram'
  | 'twitter'
  | 'tiktok'
  | 'stream_directo'
  | 'desconocido';

export interface ValidacionUrlResultado {
  esValida: boolean;
  proveedor: ProveedorMultimedia;
  urlLimpia?: string;
  error?: string;
}

const HOSTNAMES_PROHIBIDOS = new Set([
  'localhost',
  '127.0.0.1',
  '::1',
  '0.0.0.0',
  'metadata.google.internal',
  '169.254.169.254', // AWS/GCP/Azure link-local metadata
]);

/**
 * Comprueba si una dirección IP o hostname pertenece a redes privadas o restringidas (Anti-SSRF).
 */
export function esIpORedPrivada(hostname: string): boolean {
  const host = hostname.toLowerCase().trim();

  if (HOSTNAMES_PROHIBIDOS.has(host)) return true;
  if (host.endsWith('.local') || host.endsWith('.internal') || host.endsWith('.lan')) return true;

  // IPv4 privadas
  if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host)) return true;
  if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(host)) return true;
  if (/^169\.254\.\d{1,3}\.\d{1,3}$/.test(host)) return true;
  if (/^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host)) return true;
  if (/^0\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host)) return true;

  // 172.16.0.0 - 172.31.255.255
  const match172 = host.match(/^172\.(\d{1,3})\.\d{1,3}\.\d{1,3}$/);
  if (match172) {
    const segundoOcteto = parseInt(match172[1], 10);
    if (segundoOcteto >= 16 && segundoOcteto <= 31) return true;
  }

  return false;
}

/**
 * Valida minuciosamente una URL para descargas y extracción multimedia.
 */
export function validarUrlMultimedia(rawUrl: string): ValidacionUrlResultado {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { esValida: false, proveedor: 'desconocido', error: 'No se proporcionó una URL.' };
  }

  let limpia = rawUrl.trim();
  // Quitar delimitadores o comillas accidentales
  limpia = limpia.replace(/^[<"']+|[>"']+$/g, '');

  // Reparar duplicación accidental de pegado: https://...https://...
  const matchDoble = limpia.match(/(https?:\/\/[^\s"'<>]+?)https?:\/\//i);
  if (matchDoble && matchDoble[1]) {
    limpia = matchDoble[1];
  }

  // Si no se incluyó protocolo http:// o https://, agregarlo por defecto
  if (!/^https?:\/\//i.test(limpia)) {
    limpia = `https://${limpia}`;
  }

  let parsed: URL;
  try {
    parsed = new URL(limpia);
  } catch {
    return { esValida: false, proveedor: 'desconocido', error: 'El formato del enlace no es una URL válida.' };
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return {
      esValida: false,
      proveedor: 'desconocido',
      error: 'Solo se admiten enlaces seguros mediante protocolo HTTP o HTTPS.',
    };
  }

  // Prevenir credenciales en URL (http://user:pass@host)
  if (parsed.username || parsed.password) {
    return {
      esValida: false,
      proveedor: 'desconocido',
      error: 'No se permiten credenciales de autenticación incrustadas en el enlace.',
    };
  }

  if (esIpORedPrivada(parsed.hostname)) {
    return {
      esValida: false,
      proveedor: 'desconocido',
      error: 'Por motivos de seguridad, no se permite acceder a redes locales o direcciones internas.',
    };
  }

  const host = parsed.hostname.toLowerCase();
  const path = parsed.pathname.toLowerCase();

  let proveedor: ProveedorMultimedia = 'desconocido';

  if (host.includes('youtube.com') || host.includes('youtu.be')) {
    proveedor = 'youtube';
  } else if (host.includes('vimeo.com')) {
    proveedor = 'vimeo';
  } else if (host.includes('facebook.com') || host.includes('fb.watch')) {
    proveedor = 'facebook';

    // Detección de perfil o página de Facebook sin video específico
    const tieneIndicadorVideo =
      host.includes('fb.watch') ||
      path.includes('/videos/') ||
      path.includes('/watch') ||
      path.includes('/reel/') ||
      path.includes('/live/') ||
      parsed.searchParams.has('v');

    if (!tieneIndicadorVideo && path.length > 1 && !path.startsWith('/watch')) {
      return {
        esValida: false,
        proveedor: 'facebook',
        error:
          'El enlace introducido corresponde a la página o perfil de Facebook, no a un video en específico. Para analizar la prédica, abre el video y copia su enlace directo, o usa la transmisión oficial de YouTube.',
      };
    }
  } else if (host.includes('instagram.com')) {
    proveedor = 'instagram';
  } else if (host.includes('twitter.com') || host.includes('x.com')) {
    proveedor = 'twitter';
  } else if (host.includes('tiktok.com')) {
    proveedor = 'tiktok';
  } else if (
    path.endsWith('.mp4') ||
    path.endsWith('.webm') ||
    path.endsWith('.m4v') ||
    path.endsWith('.mov') ||
    path.endsWith('.m3u8') ||
    path.endsWith('.mpd')
  ) {
    proveedor = 'stream_directo';
  }

  return {
    esValida: true,
    proveedor,
    urlLimpia: parsed.toString(),
  };
}

