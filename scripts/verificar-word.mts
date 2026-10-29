import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import JSZip from 'jszip';
import { construirWordGeneralDocumento, construirWordModalidad } from '../lib/docx/index.ts';
import { nombreArchivoWord } from '../lib/modalidades.ts';
import { crearResultadoDemo, metadatosDemo } from './fixtures/demo.ts';
import type { ModalidadId } from '../lib/tipos.ts';

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const salida = resolve(raiz, 'tmp', 'docx');
mkdirSync(salida, { recursive: true });

interface InspeccionWord {
  bytes: number;
  xml: string;
  core: string;
  footer: string;
  paginasEstimadas: number;
}

async function inspeccionar(blob: Blob): Promise<InspeccionWord> {
  const buffer = Buffer.from(await blob.arrayBuffer());
  const zip = await JSZip.loadAsync(buffer);
  const xml = await zip.file('word/document.xml')?.async('string') || '';
  const core = await zip.file('docProps/core.xml')?.async('string') || '';
  const footer = await zip.file('word/footer1.xml')?.async('string') || '';
  return {
    bytes: buffer.length,
    xml,
    core,
    footer,
    paginasEstimadas: (xml.match(/<w:br w:type="page"\/>/g) || []).length + 1,
  };
}

function textoPlano(xml: string): string {
  return xml
    .replace(/<w:tab\/>/g, ' ')
    .replace(/<w:br\/>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

let pasadas = 0;
const pruebas: string[] = [];
function comprobar(nombre: string, fn: () => void) {
  fn();
  pasadas += 1;
  pruebas.push(`  ✓ ${nombre}`);
}

const modalidades: ModalidadId[] = ['general', 'bosquejo', 'grupos', 'jovenes', 'ninos', 'devocionales'];
const resultados = {} as Record<ModalidadId, InspeccionWord>;

for (const modalidad of modalidades) {
  const analisis = crearResultadoDemo(modalidad);
  const metadatos = metadatosDemo(modalidad);
  const blob = modalidad === 'general'
    ? await construirWordGeneralDocumento({ analisis, metadatos })
    : await construirWordModalidad({ analisis, metadatos });
  const nombre = nombreArchivoWord(modalidad);
  writeFileSync(resolve(salida, nombre), Buffer.from(await blob.arrayBuffer()));
  resultados[modalidad] = await inspeccionar(blob);
}

comprobar('Se generan los seis documentos Word con nombre exacto', () => {
  for (const modalidad of modalidades) {
    const nombre = nombreArchivoWord(modalidad);
    assert.match(nombre, /^teodoc-maim-[a-z0-9-]+\.docx$/);
    assert.ok(resultados[modalidad].bytes > 8_000, `${modalidad}: ${resultados[modalidad].bytes} bytes`);
  }
});

comprobar('Los DOCX son archivos ZIP válidos con documento y propiedades', () => {
  for (const modalidad of modalidades) {
    assert.ok(resultados[modalidad].xml.includes('<w:document'), `${modalidad}: falta document.xml`);
    assert.ok(resultados[modalidad].core.includes('TeoDoc MAIM'), `${modalidad}: faltan propiedades`);
  }
});

comprobar('Los DOCX incluyen portada, título, predicador y salto de página', () => {
  for (const modalidad of modalidades) {
    const texto = textoPlano(resultados[modalidad].xml);
    assert.ok(texto.includes('La fe que transforma'), `${modalidad}: falta el título`);
    assert.ok(texto.includes('Samuel Rojas'), `${modalidad}: falta el predicador`);
    assert.ok(texto.includes('MAIM Casa de Oración'), `${modalidad}: falta la institución`);
    assert.ok(textoPlano(resultados[modalidad].footer).includes('Página'), `${modalidad}: falta el pie con paginación`);
    assert.ok(resultados[modalidad].paginasEstimadas >= 2, `${modalidad}: no hay saltos de página`);
  }
});

comprobar('Cada DOCX conserva la estructura propia de su especialidad', () => {
  const requeridas: Record<ModalidadId, string[]> = {
    general: ['Ficha técnica', 'Idea central', 'Fundamento bíblico', 'Desarrollo completo', 'Inventario de referencias'],
    bosquejo: ['LIDERAZGO MAIM', 'La fe que transforma', 'CONCLUSIÓN Y EXHORTACIÓN MINISTERIAL'],
    grupos: ['Preparación del facilitador', 'Agenda de la reunión', 'Observación del texto', 'Actividad grupal', 'Compromiso de la semana', 'Nota para el facilitador'],
    jovenes: ['Ficha del encuentro', 'Conceptos teológicos', 'Casos prácticos', 'Dinámica participativa', 'Compromiso de la semana', 'Guía breve para el líder'],
    ninos: ['Ficha del maestro', 'Relato bíblico', 'Actividad central', 'Juego o dinámica', 'Aplicación para el niño', 'Salvaguardas infantiles'],
    devocionales: ['Introducción general', 'Día 1', 'Día 7', 'Oración sugerida', 'Cierre del itinerario'],
  };
  for (const modalidad of modalidades) {
    const texto = textoPlano(resultados[modalidad].xml);
    for (const seccion of requeridas[modalidad]) {
      assert.ok(texto.includes(seccion), `${modalidad}: falta "${seccion}"`);
    }
  }
});

comprobar('Los DOCX conservan acentos y no contienen marcadores técnicos', () => {
  for (const modalidad of modalidades) {
    const texto = textoPlano(resultados[modalidad].xml);
    assert.ok(texto.includes('Oración') || texto.includes('oración'), `${modalidad}: faltan acentos`);
    assert.ok(!texto.includes('undefined'), `${modalidad}: contiene undefined`);
    assert.ok(!texto.includes('null'), `${modalidad}: contiene null`);
    assert.ok(!texto.includes('�'), `${modalidad}: contiene carácter de reemplazo`);
  }
});

comprobar('El plan devocional contiene siete jornadas en Word', () => {
  const texto = textoPlano(resultados.devocionales.xml);
  for (let dia = 1; dia <= 7; dia++) assert.ok(texto.includes(`Día ${dia}`), `Falta Día ${dia}`);
});

console.log('Verificación funcional de los seis documentos Word');
console.log(pruebas.join('\n'));
console.log(`\n${pasadas} pruebas superadas. Archivos en tmp/docx/.`);
