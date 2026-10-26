export const ALLOWED_EXTENSIONS = ['.mp3', '.wav', '.m4a', '.m4b', '.aac', '.flac', '.ogg', '.oga', '.opus', '.wma', '.amr', '.webm', '.mp4', '.mov', '.aiff', '.aif', '.caf', '.3gp'];
export const MAX_FILE_SIZE = 500 * 1024 * 1024;
const CHUNK_SIZE = 20 * 1024 * 1024;

export function validarArchivo(file: File): string | null {
  if (file.size > MAX_FILE_SIZE) return 'El archivo supera el límite permitido de 500 MB.';
  const fileName = file.name.toLowerCase();
  const mimeType = (file.type || '').toLowerCase();
  const extensionValida = ALLOWED_EXTENSIONS.some((extension) => fileName.endsWith(extension));
  const mimeValido = mimeType.startsWith('audio/') || mimeType.startsWith('video/');
  const tipoDesconocido = mimeType.length === 0 || mimeType === 'application/octet-stream';
  if (!extensionValida && !mimeValido && !tipoDesconocido) {
    return 'Formato no compatible. Utiliza archivos de audio como MP3, M4A, WAV, MP4, AAC, OGG u OPUS.';
  }
  return null;
}

function interpretarRespuesta(texto: string, status: number): { secure_url?: string } {
  if (status < 200 || status >= 300) {
    let mensaje = `El servicio de audio respondió con error ${status}.`;
    try {
      const datos = JSON.parse(texto);
      if (datos?.error?.message) {
        mensaje = datos.error.message;
        if (mensaje.includes('File size too large')) {
          mensaje = 'El archivo es demasiado pesado para la red. Usa MP3 o M4A comprimido.';
        }
      }
    } catch {
      throw new Error(mensaje);
    }
    throw new Error(mensaje);
  }
  try {
    return JSON.parse(texto);
  } catch {
    throw new Error('El servicio de audio devolvió una respuesta que no pudo interpretarse.');
  }
}

export async function subirAudio(
  file: File,
  onProgress?: (porcentaje: number) => void,
): Promise<{ audioUrl: string; publicId?: string }> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'antbfat3';
  const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`;
  const uploadPreset = 'teodoc_preset';
  let data: { secure_url?: string; public_id?: string } | undefined;

  onProgress?.(10);

  if (file.size <= CHUNK_SIZE) {
    const formData = new FormData();
    formData.append('file', file, file.name);
    formData.append('upload_preset', uploadPreset);
    const response = await fetch(uploadUrl, { method: 'POST', body: formData });
    data = interpretarRespuesta(await response.text(), response.status);
    onProgress?.(30);
  } else {
    const randomPart =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}_${file.size}_${file.lastModified}`;
    const uniqueUploadId = `teodoc_${randomPart}`;
    let start = 0;
    while (start < file.size) {
      const end = Math.min(start + CHUNK_SIZE, file.size);
      const chunk = file.slice(start, end);
      const formData = new FormData();
      formData.append('file', chunk);
      formData.append('upload_preset', uploadPreset);
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'X-Unique-Upload-Id': uniqueUploadId,
          'Content-Range': `bytes ${start}-${end - 1}/${file.size}`,
        },
        body: formData,
      });
      const parsed = interpretarRespuesta(await response.text(), response.status);
      if (end >= file.size) data = parsed;
      onProgress?.(10 + Math.floor((end / file.size) * 20));
      start = end;
    }
  }

  if (!data?.secure_url) throw new Error('El servicio de audio no devolvió la URL del archivo.');
  return { audioUrl: data.secure_url, publicId: data.public_id };
}
