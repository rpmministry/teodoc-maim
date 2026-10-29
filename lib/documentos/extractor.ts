import JSZip from 'jszip';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';

export interface ResultadoExtraccionDocumento {
  ok: boolean;
  texto: string;
  tituloSugerido?: string;
  tipo: 'docx' | 'pdf' | 'txt' | 'rtf' | 'odt' | 'desconocido';
  caracteres: number;
  palabras: number;
  esEscaneado?: boolean;
  advertencia?: string;
  error?: string;
}

const LIMITE_MAX_BYTES = 50 * 1024 * 1024; // 50 MB
export const MIN_CARACTERES_TEXTO = 120;
export const MAX_CARACTERES_TEXTO = 250_000;

/**
 * Normaliza saltos de línea y espacios en blanco sin alterar el contenido doctrinal o citas bíblicas.
 */
export function normalizarTextoExtraido(texto: string): string {
  if (!texto) return '';
  return texto
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\u00A0/g, ' ') // Espacios duros
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Intenta sugerir un título a partir de las primeras líneas del documento extraído.
 */
export function sugerirTituloDeTexto(texto: string): string | undefined {
  if (!texto) return undefined;
  const lineas = texto
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 3 && l.length <= 150);

  if (lineas.length === 0) return undefined;

  // Tomar la primera línea que parezca un título (no un versículo ni número de página)
  for (const linea of lineas.slice(0, 5)) {
    if (/^(página|p[aá]g\.|cap[ií]tulo|\d+[\.\-\/])/i.test(linea)) continue;
    // Si la línea está en mayúsculas o tiene formato de título
    return linea.replace(/[.:;]+$/, '').trim();
  }
  return lineas[0];
}

/**
 * Extrae texto de un archivo DOCX analizando su XML interno word/document.xml.
 * Conserva la jerarquía de párrafos, títulos y citas sin depender de herramientas externas.
 */
export async function extraerTextoDocx(buffer: Uint8Array | Buffer): Promise<string> {
  const zip = await JSZip.loadAsync(buffer);
  const docXmlFile = zip.file('word/document.xml');
  if (!docXmlFile) {
    throw new Error('El archivo DOCX no contiene el documento principal (word/document.xml).');
  }

  const xml = await docXmlFile.async('text');

  // Separar párrafos en </w:p>
  const parrafosRaw = xml.split('</w:p>');
  const lineas: string[] = [];

  for (const parrafo of parrafosRaw) {
    // Detectar si el párrafo tiene estilo de título o encabezado
    const esTitulo = /<w:pStyle\s+w:val="(?:Heading|Titulo|Title|Heading1|Heading2)[^"]*"/i.test(parrafo);

    // Extraer todos los fragmentos de texto <w:t>
    const matchesTexto = parrafo.match(/<w:t(?:[^>]*)>([\s\S]*?)<\/w:t>/g) || [];
    const textoParrafo = matchesTexto
      .map((tag) => tag.replace(/<[^>]+>/g, ''))
      .join('')
      .trim();

    if (textoParrafo) {
      if (esTitulo) {
        lineas.push(`\n${textoParrafo}\n`);
      } else {
        lineas.push(textoParrafo);
      }
    }
  }

  return normalizarTextoExtraido(lineas.join('\n\n'));
}

/**
 * Extrae texto de un archivo ODT analizando su content.xml.
 */
export async function extraerTextoOdt(buffer: Uint8Array | Buffer): Promise<string> {
  const zip = await JSZip.loadAsync(buffer);
  const contentXml = zip.file('content.xml');
  if (!contentXml) {
    throw new Error('El archivo ODT no contiene el documento principal (content.xml).');
  }

  const xml = await contentXml.async('text');
  // Extraer etiquetas <text:p> y <text:h>
  const fragmentos = xml.split(/<\/(?:text:p|text:h)>/);
  const lineas: string[] = [];

  for (const frag of fragmentos) {
    const texto = frag.replace(/<[^>]+>/g, '').trim();
    if (texto) lineas.push(texto);
  }

  return normalizarTextoExtraido(lineas.join('\n\n'));
}

/**
 * Extrae texto seleccionable de un archivo PDF página por página con pdfjs-dist.
 * Si el documento no contiene caracteres legibles, detecta si es escaneado.
 */
export async function extraerTextoPdf(buffer: Uint8Array | Buffer): Promise<{ texto: string; paginas: number; esEscaneado: boolean }> {
  // pdfjs-dist rechaza objetos Node Buffer explícitamente; aseguramos un Uint8Array puro
  const uint8 = Buffer.isBuffer(buffer)
    ? new Uint8Array(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength))
    : new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  const doc = await pdfjs.getDocument({
    data: uint8,
    useSystemFonts: false,
    verbosity: 0,
  }).promise;

  const totalPaginas = doc.numPages;
  const paginasTexto: string[] = [];
  let totalCaracteresLegibles = 0;

  for (let num = 1; num <= totalPaginas; num++) {
    const page = await doc.getPage(num);
    const textContent = await page.getTextContent();
    const items = textContent.items
      .map((item) => ('str' in item ? (item.str as string) : ''))
      .filter((s) => s.length > 0);

    const paginaTexto = items.join(' ').trim();
    if (paginaTexto) {
      paginasTexto.push(paginaTexto);
      totalCaracteresLegibles += paginaTexto.replace(/\s+/g, '').length;
    }
  }

  await doc.destroy();

  const textoFinal = normalizarTextoExtraido(paginasTexto.join('\n\n'));
  const esEscaneado = totalCaracteresLegibles < 40 && totalPaginas > 0;

  return {
    texto: textoFinal,
    paginas: totalPaginas,
    esEscaneado,
  };
}

/**
 * Extrae texto de un archivo RTF sencillo limpiando los grupos de control.
 */
export function extraerTextoRtf(contenidoRaw: string): string {
  // Elimina encabezados y grupos de control {\rtf1 ... }
  let limpio = contenidoRaw
    .replace(/\\rtf1[\s\S]*?\\deflang\d+/gi, '')
    .replace(/\\fonttbl[\s\S]*?;\}/gi, '')
    .replace(/\\colortbl[\s\S]*?;\}/gi, '')
    .replace(/\{\\*?\\[a-zA-Z0-9]+[\s\S]*?\}/g, '')
    .replace(/\\par[d]?\s*/gi, '\n')
    .replace(/\\line\s*/gi, '\n')
    .replace(/\\tab\s*/gi, '\t')
    .replace(/\\'[0-9a-fA-F]{2}/g, (match) => {
      try {
        const hex = match.slice(2);
        return Buffer.from(hex, 'hex').toString('latin1');
      } catch {
        return '';
      }
    })
    .replace(/\\[a-zA-Z0-9_-]+\s*/g, '')
    .replace(/[{}]/g, '');

  return normalizarTextoExtraido(limpio);
}

/**
 * Procesa cualquier documento admitido (DOCX, PDF, TXT, RTF, ODT) y extrae su contenido.
 */
export async function extraerTextoDeArchivo(
  buffer: Uint8Array | Buffer,
  nombreArchivo: string,
  mimeType?: string,
): Promise<ResultadoExtraccionDocumento> {
  if (buffer.length > LIMITE_MAX_BYTES) {
    return {
      ok: false,
      texto: '',
      tipo: 'desconocido',
      caracteres: 0,
      palabras: 0,
      error: `El archivo supera el tamaño máximo permitido de 50 MB.`,
    };
  }

  const nombreLower = nombreArchivo.toLowerCase();
  const mimeLower = (mimeType || '').toLowerCase();

  try {
    let texto = '';
    let tipo: ResultadoExtraccionDocumento['tipo'] = 'desconocido';
    let esEscaneado = false;
    let advertencia: string | undefined;

    if (nombreLower.endsWith('.docx') || mimeLower.includes('wordprocessingml')) {
      tipo = 'docx';
      texto = await extraerTextoDocx(buffer);
    } else if (nombreLower.endsWith('.pdf') || mimeLower.includes('pdf')) {
      tipo = 'pdf';
      const resPdf = await extraerTextoPdf(buffer);
      texto = resPdf.texto;
      esEscaneado = resPdf.esEscaneado;
      if (esEscaneado) {
        advertencia =
          'El archivo PDF parece ser un documento escaneado o una imagen sin capa de texto seleccionable. Si es posible, utiliza un PDF digital o pega directamente la transcripción.';
      }
    } else if (nombreLower.endsWith('.odt') || mimeLower.includes('opendocument.text')) {
      tipo = 'odt';
      texto = await extraerTextoOdt(buffer);
    } else if (nombreLower.endsWith('.rtf') || mimeLower.includes('rtf')) {
      tipo = 'rtf';
      const raw = buffer.toString('utf-8');
      texto = extraerTextoRtf(raw);
    } else if (nombreLower.endsWith('.txt') || mimeLower.startsWith('text/')) {
      tipo = 'txt';
      // Intentar UTF-8 con fallback a latin1
      try {
        texto = normalizarTextoExtraido(Buffer.from(buffer).toString('utf-8'));
      } catch {
        texto = normalizarTextoExtraido(Buffer.from(buffer).toString('latin1'));
      }
    } else {
      // Intentar identificar por firma mágica (magic bytes)
      const primeros4 = Buffer.from(buffer.slice(0, 4)).toString('hex');
      if (primeros4 === '504b0304') {
        // Zip magic byte (DOCX u ODT)
        try {
          texto = await extraerTextoDocx(buffer);
          tipo = 'docx';
        } catch {
          texto = await extraerTextoOdt(buffer);
          tipo = 'odt';
        }
      } else if (primeros4 === '25504446') {
        // %PDF
        tipo = 'pdf';
        const resPdf = await extraerTextoPdf(buffer);
        texto = resPdf.texto;
        esEscaneado = resPdf.esEscaneado;
      } else {
        // Intentar leer como texto plano
        texto = normalizarTextoExtraido(Buffer.from(buffer).toString('utf-8'));
        tipo = 'txt';
      }
    }

    // Limitar al techo de caracteres si es excesivo
    if (texto.length > MAX_CARACTERES_TEXTO) {
      advertencia = `El documento contiene ${texto.length.toLocaleString('es-CO')} caracteres. Se recortó a los primeros ${MAX_CARACTERES_TEXTO.toLocaleString('es-CO')} caracteres para garantizar el análisis.`;
      texto = texto.slice(0, MAX_CARACTERES_TEXTO);
    }

    const caracteres = texto.length;
    const palabras = texto ? texto.trim().split(/\s+/).length : 0;
    const tituloSugerido = sugerirTituloDeTexto(texto);

    if (caracteres < MIN_CARACTERES_TEXTO && !esEscaneado) {
      return {
        ok: false,
        texto,
        tipo,
        caracteres,
        palabras,
        tituloSugerido,
        error: `El documento contiene muy poco texto (${caracteres} caracteres). Se requieren al menos ${MIN_CARACTERES_TEXTO} caracteres para un análisis ministerial significativo.`,
      };
    }

    return {
      ok: true,
      texto,
      tipo,
      caracteres,
      palabras,
      tituloSugerido,
      esEscaneado,
      advertencia,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error desconocido al procesar el documento.';
    return {
      ok: false,
      texto: '',
      tipo: 'desconocido',
      caracteres: 0,
      palabras: 0,
      error: `No se pudo procesar el documento: ${errorMsg}`,
    };
  }
}
