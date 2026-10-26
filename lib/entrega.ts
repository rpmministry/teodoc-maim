export function esIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const plataforma = (navigator as Navigator & { platform?: string }).platform || '';
  const maxTouch = (navigator as Navigator & { maxTouchPoints?: number }).maxTouchPoints || 0;
  const iPadOS = plataforma === 'MacIntel' && maxTouch > 1;
  return /iPad|iPhone|iPod/.test(ua) || iPadOS;
}

export function descargarArchivo(blob: Blob, nombre: string): void {
  if (typeof document === 'undefined') return;
  const url = URL.createObjectURL(blob);
  if (!esIOS()) {
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = nombre;
    enlace.style.position = 'fixed';
    enlace.style.left = '-9999px';
    enlace.style.top = '0';
    document.body.appendChild(enlace);
    enlace.click();
    setTimeout(() => enlace.remove(), 1500);
  }
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export function puedeCompartirArchivos(): boolean {
  if (typeof navigator === 'undefined') return false;
  const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean; share?: (data: ShareData) => Promise<void> };
  return typeof nav.share === 'function' && typeof nav.canShare === 'function';
}

export async function compartirArchivo(archivo: File, nombre: string): Promise<boolean> {
  if (typeof navigator === 'undefined') return false;
  const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean; share?: (data: ShareData) => Promise<void> };
  if (!nav.share || !nav.canShare || !nav.canShare({ files: [archivo] })) return false;
  try {
    await nav.share({ files: [archivo], title: nombre });
    return true;
  } catch {
    return false;
  }
}

export function crearArchivo(blob: Blob, nombre: string): File {
  return new File([blob], nombre, { type: blob.type || 'application/pdf' });
}
