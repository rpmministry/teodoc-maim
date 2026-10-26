import type { FuentesPdf, RecursosPdf } from './base.ts';

async function archivoADataUrl(ruta: string): Promise<string | undefined> {
  try {
    const respuesta = await fetch(ruta);
    if (!respuesta.ok) return undefined;
    const blob = await respuesta.blob();
    return await new Promise<string | undefined>((resolve) => {
      const lector = new FileReader();
      lector.onload = () => resolve(typeof lector.result === 'string' ? lector.result : undefined);
      lector.onerror = () => resolve(undefined);
      lector.readAsDataURL(blob);
    });
  } catch {
    return undefined;
  }
}

async function archivoABase64(ruta: string): Promise<string | undefined> {
  const dataUrl = await archivoADataUrl(ruta);
  if (!dataUrl) return undefined;
  const coma = dataUrl.indexOf(',');
  return coma >= 0 ? dataUrl.slice(coma + 1) : undefined;
}

export async function cargarRecursosPdf(): Promise<RecursosPdf> {
  const [logoPortada, logoIcono, regular, bold, italic, boldItalic] = await Promise.all([
    archivoADataUrl('/institucional/maim-portada.jpg'),
    archivoADataUrl('/institucional/maim-perfil.jpg'),
    archivoABase64('/fonts/IBMPlexSans-Regular.ttf'),
    archivoABase64('/fonts/IBMPlexSans-Bold.ttf'),
    archivoABase64('/fonts/IBMPlexSans-Italic.ttf'),
    archivoABase64('/fonts/IBMPlexSans-BoldItalic.ttf'),
  ]);
  const fuentes: Partial<FuentesPdf> = {};
  if (regular) fuentes.regular = regular;
  if (bold) fuentes.bold = bold;
  if (italic) fuentes.italic = italic;
  if (boldItalic) fuentes.boldItalic = boldItalic;
  return { logoPortada, logoIcono, formatoLogo: 'JPEG', formatoIcono: 'JPEG', fuentes };
}
