import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import { construirPdfGeneralDocumento, construirPdfModalidad } from '../lib/pdf/index.ts';
import { nombreArchivoPdf } from '../lib/modalidades.ts';
import { crearResultadoDemo, metadatosDemo } from './fixtures/demo.ts';
import type { ModalidadId } from '../lib/tipos.ts';
import type { RecursosPdf } from '../lib/pdf/base.ts';

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const salida = resolve(raiz, 'tmp', 'pdf');
mkdirSync(salida, { recursive: true });

const base64 = (rel: string) => readFileSync(resolve(raiz, rel)).toString('base64');
const recursos: RecursosPdf = {
  logoPortada: `data:image/jpeg;base64,${base64('public/institucional/maim-portada.jpg')}`,
  logoIcono: `data:image/jpeg;base64,${base64('public/institucional/maim-perfil.jpg')}`,
  formatoLogo: 'JPEG',
  formatoIcono: 'JPEG',
  fuentes: {
    regular: base64('public/fonts/IBMPlexSans-Regular.ttf'),
    bold: base64('public/fonts/IBMPlexSans-Bold.ttf'),
    italic: base64('public/fonts/IBMPlexSans-Italic.ttf'),
    boldItalic: base64('public/fonts/IBMPlexSans-BoldItalic.ttf'),
  },
};

interface InspeccionPdf {
  paginas: number;
  texto: string;
  bytes: number;
}

async function inspeccionar(blob: Blob): Promise<InspeccionPdf> {
  const buffer = Buffer.from(await blob.arrayBuffer());
  const documento = await pdfjs.getDocument({ data: new Uint8Array(buffer), useSystemFonts: false, verbosity: 0 }).promise;
  let texto = '';
  for (let numero = 1; numero <= documento.numPages; numero++) {
    const pagina = await documento.getPage(numero);
    const contenido = await pagina.getTextContent();
    texto += contenido.items.map((item) => ('str' in item ? item.str : '')).join(' ') + '\n';
  }
  const paginas = documento.numPages;
  await documento.destroy();
  return { paginas, texto, bytes: buffer.length };
}

let pasadas = 0;
const pruebas: string[] = [];
function comprobar(nombre: string, fn: () => void) {
  fn();
  pasadas += 1;
  pruebas.push(`  ✓ ${nombre}`);
}

const resultados: Record<ModalidadId, InspeccionPdf> = {} as Record<ModalidadId, InspeccionPdf>;

for (const modalidad of ['general', 'bosquejo', 'grupos', 'jovenes', 'ninos', 'devocionales'] as ModalidadId[]) {
  const analisis = crearResultadoDemo(modalidad);
  const metadatos = modalidad === 'general' ? { ...metadatosDemo('general'), modalidad: 'general' as const } : metadatosDemo(modalidad);
  const blob = modalidad === 'general'
    ? construirPdfGeneralDocumento({ analisis, metadatos, recursos })
    : construirPdfModalidad({ analisis, metadatos, recursos });
  const nombre = nombreArchivoPdf(modalidad);
  writeFileSync(resolve(salida, nombre), Buffer.from(await blob.arrayBuffer()));
  resultados[modalidad] = await inspeccionar(blob);
}

comprobar('Se generan los seis PDF con el nombre exacto solicitado', () => {
  assert.deepEqual(Object.keys(resultados).sort(), ['bosquejo', 'devocionales', 'general', 'grupos', 'jovenes', 'ninos'].sort());
  for (const modalidad of Object.keys(resultados) as ModalidadId[]) {
    assert.equal(nombreArchivoPdf(modalidad), `teodoc-maim-${{ general: 'analisis-general', bosquejo: 'liderazgo', grupos: 'grupos-pequenos', jovenes: 'jovenes', ninos: 'clase-infantil', devocionales: 'devocionales-7-dias' }[modalidad]}.pdf`);
  }
});

comprobar('Todos los PDF son multipágina y superan el tamaño mínimo con fuentes incrustadas', () => {
  const minimos: Record<ModalidadId, number> = { general: 2, bosquejo: 2, grupos: 3, jovenes: 3, ninos: 3, devocionales: 8 };
  for (const modalidad of Object.keys(resultados) as ModalidadId[]) {
    const pdf = resultados[modalidad];
    assert.ok(pdf.paginas >= minimos[modalidad], `${modalidad}: ${pdf.paginas} páginas`);
    assert.ok(pdf.bytes > 20_000, `${modalidad}: ${pdf.bytes} bytes`);
  }
});

comprobar('Los PDF incluyen la portada institucional, el título y el predicador', () => {
  for (const modalidad of Object.keys(resultados) as ModalidadId[]) {
    const texto = resultados[modalidad].texto;
    assert.ok(texto.includes('La fe que transforma'), `${modalidad}: falta el título`);
    assert.ok(texto.includes('Samuel Rojas'), `${modalidad}: falta el predicador`);
    assert.ok(texto.includes('MAIM Casa de Oración'), `${modalidad}: falta la institución`);
    assert.ok(texto.includes('TeoDoc MAIM'), `${modalidad}: falta la marca`);
  }
});

comprobar('Los PDF preservan acentos y no contienen placeholders técnicos', () => {
  for (const modalidad of Object.keys(resultados) as ModalidadId[]) {
    const texto = resultados[modalidad].texto;
    assert.ok(texto.includes('Oración') || texto.includes('oración'), `${modalidad}: falta texto acentuado`);
    assert.ok(!texto.includes('undefined'), `${modalidad}: contiene undefined`);
    assert.ok(!texto.includes('null'), `${modalidad}: contiene null`);
    assert.ok(!texto.includes('NaN'), `${modalidad}: contiene NaN`);
    assert.ok(!texto.includes('�'), `${modalidad}: contiene carácter de reemplazo`);
    assert.ok(!texto.includes('PREDICADOR O EXPOSITOR\n\n'), `${modalidad}: predicador vacío`);
  }
});

comprobar('Cada PDF contiene las secciones distintivas de su modalidad', () => {
  const requeridos: Record<ModalidadId, string[]> = {
    general: ['Identificación del mensaje', 'Idea central y propósito', 'Fundamento bíblico', 'Desarrollo del mensaje', 'Enseñanzas principales', 'Aplicación práctica', 'Conclusión del estudio'],
    bosquejo: ['DOCUMENTO EDITORIAL DE FORMACIÓN MINISTERIAL', 'La fe que transforma', 'CONCLUSIÓN Y EXHORTACIÓN MINISTERIAL'],
    grupos: ['Agenda del encuentro', 'Para comenzar', 'Comprender el texto', 'Actividad grupal', 'Compromiso de la semana', 'Orientaciones para el líder'],
    jovenes: ['Objetivo y tema del encuentro', 'Pasaje y conceptos fundamentales', 'Reflexión individual', 'Conversación grupal', 'Dinámica participativa', 'Desafío de la semana', 'Guía para el líder juvenil'],
    ninos: ['Datos de la clase', 'El versículo que aprenderemos', 'El relato bíblico', 'Actividad didáctica', 'Juego o dinámica', 'Lo que puedo vivir hoy', 'Guía para el maestro', 'Rango de edad'],
    devocionales: ['Introducción', 'CÓMO USAR ESTE PLAN', 'Una fe que escucha', 'Una fe que responde', 'Una fe que sigue'],
  };
  for (const modalidad of Object.keys(requeridos) as ModalidadId[]) {
    for (const seccion of requeridos[modalidad]) {
      assert.ok(resultados[modalidad].texto.includes(seccion), `${modalidad}: falta la sección "${seccion}"`);
    }
  }
});

comprobar('La numeración de páginas aparece en todos los documentos', () => {
  for (const modalidad of Object.keys(resultados) as ModalidadId[]) {
    const pdf = resultados[modalidad];
    assert.match(pdf.texto, /Página 2 de \d+/, `${modalidad}: falta numeración`);
    assert.ok(pdf.texto.includes(`Página ${pdf.paginas} de ${pdf.paginas}`), `${modalidad}: falta la última página numerada`);
  }
});

comprobar('El plan devocional conserva las siete jornadas completas', () => {
  const texto = resultados.devocionales.texto;
  for (let dia = 1; dia <= 7; dia++) assert.match(texto, new RegExp(`D[IÍ]A\\s+${dia}`), `Falta el día ${dia}`);
  assert.ok(texto.includes('Una fe que sigue'), 'Falta la jornada final');
  assert.ok(texto.includes('Comparte tu compromiso'), 'Falta la acción de la jornada final');
});

comprobar('La clase infantil respeta el rango de edad seleccionado', () => {
  assert.ok(resultados.ninos.texto.includes('6 a 8 años'), 'Falta el rango 6 a 8 años');
  assert.ok(resultados.ninos.texto.includes('45 minutos'), 'Falta la duración');
});

const tituloLargo = `La fe que transforma ${'la vida cotidiana '.repeat(7)}PALABRAFIN`;
const analisisTituloLargo = { ...crearResultadoDemo('general'), titulo: tituloLargo };
const metadatosTituloLargo = { ...metadatosDemo('general'), tituloProporcionado: tituloLargo, predicador: undefined };
const pdfTituloLargo = await inspeccionar(construirPdfGeneralDocumento({ analisis: analisisTituloLargo, metadatos: metadatosTituloLargo, recursos }));
assert.ok(pdfTituloLargo.texto.includes('PALABRAFIN'), 'El título largo se cortó en la portada');
pasadas += 1;
pruebas.push('  ✓ Un título largo no se recorta en la portada');
const analisisSinPredicador = crearResultadoDemo('general');
const metadatosSinPredicador = { ...metadatosDemo('general'), predicador: undefined };
const pdfSinPredicador = await inspeccionar(construirPdfGeneralDocumento({ analisis: analisisSinPredicador, metadatos: metadatosSinPredicador, recursos }));
assert.ok(!pdfSinPredicador.texto.includes('PREDICADOR O EXPOSITOR'), 'Se imprimió el rótulo de predicador vacío');
assert.ok(pdfSinPredicador.texto.includes('La fe que transforma'));
pasadas += 1;
pruebas.push('  ✓ El nombre es opcional: sin predicador no se imprime un campo vacío');

console.log('Verificación funcional de los seis PDF');
console.log(pruebas.join('\n'));
console.log(`\n${pasadas} pruebas superadas. Archivos en tmp/pdf/.`);
