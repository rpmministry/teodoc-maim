import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MODALIDADES, nombreArchivoPdf } from '../lib/modalidades.ts';

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (rel: string) => readFileSync(resolve(raiz, rel), 'utf8');

const page = leer('app/page.tsx');
const form = leer('components/formulario-analisis.tsx');
const panel = leer('components/resultados/panel.tsx');
const entrega = leer('lib/entrega.ts');
const pdfBase = leer('lib/pdf/base.ts');
const pdfIndex = leer('lib/pdf/index.ts');
const recursos = leer('lib/pdf/recursos.ts');
const paquete = JSON.parse(leer('package.json')) as { scripts: Record<string, string>; dependencies: Record<string, string>; devDependencies: Record<string, string> };

let pasadas = 0;
const pruebas: string[] = [];
function comprobar(nombre: string, fn: () => void) {
  fn();
  pasadas += 1;
  pruebas.push(`  ✓ ${nombre}`);
}

comprobar('La interfaz ofrece las cinco modalidades y el campo de predicador', () => {
  assert.equal(MODALIDADES.length, 5);
  assert.ok(form.includes('Predicador o expositor'), 'Falta el campo de predicador');
  assert.ok(form.includes('Título del mensaje'), 'Falta el campo de título');
  assert.ok(form.includes('Rango de edad de los niños'), 'Falta el selector de edad');
  assert.ok(form.includes('MODALIDADES.map'), 'El selector no se genera desde las modalidades');
  assert.ok(page.includes('PanelResultados'), 'La página no presenta los resultados');
});

comprobar('Cada modalidad tiene un PDF descargable con su nombre exacto', () => {
  const esperados = [
    'teodoc-maim-analisis-general.pdf',
    'teodoc-maim-grupos-pequenos.pdf',
    'teodoc-maim-jovenes.pdf',
    'teodoc-maim-clase-infantil.pdf',
    'teodoc-maim-devocionales-7-dias.pdf',
  ];
  const nombres = MODALIDADES.map((m) => nombreArchivoPdf(m.id));
  assert.deepEqual(nombres, esperados);
  for (const nombre of nombres) assert.ok(!nombre.includes('infografia'));
  assert.ok(panel.includes('Descargar PDF de esta modalidad'));
  assert.ok(panel.includes('Análisis general'));
  assert.ok(page.includes("descargar('general')"));
  assert.ok(page.includes("descargar('modalidad')"));
});

comprobar('Los cinco constructores de PDF están conectados y tienen fallback seguro', () => {
  for (const constructor of ['construirPdfGeneral', 'construirPdfGrupos', 'construirPdfJovenes', 'construirPdfNinos', 'construirPdfDevocionales']) {
    assert.ok(pdfIndex.includes(constructor), `Falta ${constructor}`);
    assert.ok(existsSync(resolve(raiz, `lib/pdf/${constructor.replace('construirPdf', '').toLowerCase()}.ts`)), `Falta el archivo de ${constructor}`);
  }
  assert.ok(pdfIndex.includes('throw new Error'), 'La modalidad sin contenido debe fallar con un mensaje claro');
});

comprobar('El PDF conserva identidad, fuentes Unicode, portada y numeración', () => {
  assert.ok(pdfBase.includes('logoPortada'), 'Falta el logotipo de portada');
  assert.ok(pdfBase.includes('IBMPlexSans'), 'Falta la fuente Unicode');
  assert.ok(pdfBase.includes('addFileToVFS'), 'La fuente no se incrusta');
  assert.ok(pdfBase.includes('Página ${pagina} de ${total}'), 'Falta numeración');
  assert.ok(pdfBase.includes('INSTITUCION'), 'Falta el nombre institucional');
  assert.ok(recursos.includes('/institucional/maim-portada.jpg'), 'No se carga el logotipo oficial');
  assert.ok(recursos.includes('/fonts/IBMPlexSans-Regular.ttf'), 'No se cargan las fuentes');
  assert.ok(readFileSync(resolve(raiz, 'public/fonts/OFL.txt')).length > 1_000, 'Falta la licencia de las fuentes');
});

comprobar('El PDF general mantiene el análisis completo y el especializado sus secciones', () => {
  const general = leer('lib/pdf/general.ts');
  const grupos = leer('lib/pdf/grupos.ts');
  const jovenes = leer('lib/pdf/jovenes.ts');
  const ninos = leer('lib/pdf/ninos.ts');
  const devocionales = leer('lib/pdf/devocionales.ts');
  for (const seccion of ['Idea central y propósito', 'Fundamento bíblico', 'Desarrollo del mensaje', 'Enseñanzas principales', 'Aplicación práctica', 'Conclusión del estudio', 'Oración']) {
    assert.ok(general.includes(seccion), `Falta la sección general ${seccion}`);
  }
  assert.ok(grupos.includes('Agenda del encuentro') && grupos.includes('Orientaciones para el líder'));
  assert.ok(jovenes.includes('Dinámica participativa') && jovenes.includes('Guía para el líder juvenil'));
  assert.ok(ninos.includes('El relato bíblico') && ninos.includes('Guía para el maestro'));
  assert.ok(devocionales.includes('plan.dias.forEach'));
  assert.ok(devocionales.includes('Jornada ${dia.dia} de ${plan.dias.length}'));
});

comprobar('La entrega funciona en escritorio e iOS sin navegar la pestaña', () => {
  assert.ok(entrega.includes('export function descargarArchivo'));
  assert.ok(entrega.includes("enlace.download = nombre"));
  assert.ok(entrega.includes("window.open") === false, 'La descarga no debe abrir pestañas');
  assert.ok(entrega.includes('canShare'), 'Falta Web Share');
  assert.ok(entrega.includes("share({ files: [archivo]"), 'Falta compartir archivos');
  assert.ok(entrega.includes('maxTouchPoints'), 'Falta detección de iPadOS');
  assert.ok(page.includes('descargarArchivo(blob, nombre)'));
  assert.ok(page.includes('compartirArchivo(ultimoArchivo.file'));
});

comprobar('La vista previa y el aviso de descarga siguen disponibles', () => {
  assert.ok(page.includes('Vista previa'));
  assert.ok(page.includes('Archivo disponible'));
  assert.ok(page.includes('Ver PDF'));
  assert.ok(page.includes('<iframe'));
  assert.ok(page.includes('Escape'));
});

comprobar('La funcionalidad de infografías y sus dependencias fueron retiradas', () => {
  assert.ok(!existsSync(resolve(raiz, 'components/infografia.tsx')));
  assert.ok(!existsSync(resolve(raiz, 'lib/infografia-layout.ts')));
  assert.ok(!existsSync(resolve(raiz, 'components/ilustraciones')));
  assert.ok(paquete.dependencies['dom-to-image-more'] === undefined);
  assert.ok(paquete.dependencies['html2pdf.js'] === undefined);
  assert.ok(paquete.scripts['test:infografia'] === undefined);
  assert.ok(!page.includes('.png'));
  assert.ok(!pdfBase.includes('Infografía'));
});

comprobar('La transcripción, el análisis y el audio compartido se conservan', () => {
  assert.ok(existsSync(resolve(raiz, 'app/api/transcribe/route.ts')));
  assert.ok(existsSync(resolve(raiz, 'app/api/upload/route.ts')));
  assert.ok(existsSync(resolve(raiz, 'lib/audio-upload.ts')));
  assert.ok(form.includes('Audio del mensaje'));
  assert.ok(form.includes('Transcripción lista'));
  assert.ok(!form.includes('<textarea'), 'La interfaz simplificada no debe mostrar el editor de transcripción');
  assert.ok(form.indexOf('Elige la modalidad') < form.indexOf('Sube el audio'), 'La modalidad debe elegirse antes del audio');
  assert.ok(form.includes('htmlFor="audio-file-input"'), 'El botón de audio debe usar activación nativa con label');
  assert.ok(form.includes('id="audio-file-input"'), 'Falta el input de audio identificable');
  assert.ok(form.includes('accept="audio/*'), 'El selector debe aceptar audio en móviles');
  assert.ok(form.includes('className="sr-only"'), 'El input debe estar accesible pero no oculto con display:none');
  assert.ok(!form.includes('inputRef.current?.click()'), 'No debe depender del click programático en móviles');
  assert.ok(form.includes('min-h-[48px]') && form.includes('touch-manipulation'), 'El objetivo táctil debe ser de al menos 48 px');
  assert.ok(page.includes('/api/transcribe'));
  assert.ok(page.includes('/api/analyze'));
  assert.ok(existsSync(resolve(raiz, 'components/liquid-orb.tsx')));
});

comprobar('La suite de pruebas cubre los cinco PDF y las modalidades', () => {
  assert.ok(paquete.scripts['test:pdf'] === 'node scripts/verificar-pdf.mts');
  assert.ok(paquete.scripts['test:modalidades'] === 'node scripts/verificar-modalidades.mts');
  assert.ok(paquete.scripts['verificar'].includes('test:pdf'));
  assert.ok(paquete.scripts['verificar'].includes('test:modalidades'));
});

console.log('Verificación de entrega de las cinco modalidades y sus PDF');
console.log(pruebas.join('\n'));
console.log(`\n${pasadas} pruebas superadas.`);
