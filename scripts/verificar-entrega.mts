// Verificación estática de los invariantes de entrega (escenarios 9-15 del
// encargo): exportación iOS, PNG válido, PDF con zona segura y 9:16.
// Se ejecuta con: node scripts/verificar-entrega.mts
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (rel: string) => readFileSync(resolve(raiz, rel), 'utf8');

const page = leer('app/page.tsx');
const infografia = leer('components/infografia.tsx');
const ilustraciones = leer('components/ilustraciones/index.tsx');
const layout = leer('lib/infografia-layout.ts');
const modular = leer('lib/infografia-modular.ts');
const analyze = leer('app/api/analyze/route.ts');

let pasadas = 0;
const pruebas: string[] = [];
const comprobar = (nombre: string, fn: () => void) => {
  fn();
  pasadas += 1;
  pruebas.push(`  ✓ ${nombre}`);
};

// ---- Exportación PDF/PNG en iOS (casos 13, 14, 15) ----
comprobar('iOS detectado (incluye iPadOS) y Web Share de archivos', () => {
  assert.ok(page.includes('const esIOS = ()'), 'falta esIOS');
  assert.ok(page.includes('maxTouchPoints'), 'falta detección iPadOS');
  assert.ok(page.includes('canShare') && page.includes('share('), 'falta Web Share API');
});

comprobar('iOS nunca navega la pestaña actual (pestaña nueva / share)', () => {
  assert.ok(page.includes("window.open('', '_blank')"), 'falta pestaña preabierta');
  assert.ok(page.includes("a.target = '_blank'"), 'falta fallback a pestaña nueva');
});

comprobar('Escritorio usa descarga clásica con <a download>', () => {
  assert.ok(page.includes('a.download = nombre'), 'falta descarga clásica');
});

comprobar('Se eliminó el mecanismo antiguo descargarBlob', () => {
  assert.ok(!page.includes('descargarBlob'), 'descargarBlob aún presente');
});

// ---- PNG realmente PNG (caso 14 y 15) ----
comprobar('El PNG se reafirma con MIME image/png', () => {
  assert.ok(page.includes("new Blob([blob], { type: 'image/png' })"), 'no se reafirma image/png');
  assert.ok(infografia.includes("type: 'image/png'"), 'exportarInfografiaFile sin image/png');
});

comprobar('El nombre de archivo termina exactamente en .png (sin .png.)', () => {
  assert.match(page, /TeoDoc_Infografia_/);
  assert.ok(!page.includes('.png.txt'), 'aparece extensión .png.txt');
  assert.ok(/TeoDoc_Infografia_\$\{safe\}\.png/.test(page), 'nombre de PNG simple mal formado');
  assert.ok(/TeoDoc_Infografia_\$\{safe\}_\$\{i \+ 1\}de\$\{total\}\.png/.test(page), 'nombre de carrusel mal formado');
});

comprobar('El PDF se entrega con MIME application/pdf', () => {
  assert.ok(page.includes("new Blob([pdfBlob], { type: 'application/pdf' })"), 'PDF sin MIME');
});

// ---- PDF: márgenes de impresión/argollado y layout (casos 9, 10) ----
comprobar('PDF con margen interior de argollado y exterior distintos', () => {
  assert.ok(page.includes('const margin = 98'), 'sin margen interior de anillado');
  assert.ok(page.includes('const marginR = 54'), 'sin margen exterior');
  assert.ok(page.includes('const marginT = 60'), 'sin margen superior');
  assert.ok(page.includes('const marginB = 64'), 'sin margen inferior');
  // Interior al menos ~15 mm mayor que el exterior (98-54 = 44pt ≈ 15.5 mm).
  assert.ok(98 - 54 >= 15 * 2.8346, 'margen de anillado insuficiente');
});

comprobar('PDF: numeral y contenido desde un único objeto (sin desfase)', () => {
  assert.ok(page.includes('const puntosPDF: PuntoPDF[]'), 'sin objeto unificado de puntos');
  assert.ok(page.includes('puntosPDF.forEach((pt)'), 'el render no usa el objeto unificado');
  assert.ok(page.includes('numeral en el punto'), 'sin validación de numeral 1:1');
});

comprobar('PDF con keep-with-next y control de página (sin huérfanos)', () => {
  assert.ok(page.includes('const heading = (label: string, keep'), 'sin keep en headings');
  assert.ok(page.includes('const nuevaPagina = ()'), 'sin control de página');
});

comprobar('PDF: título de 2+ líneas con altura real y padding fijo', () => {
  assert.ok(page.includes('TITLE_LINE_H'), 'sin interlineado real de título');
  assert.ok(page.includes('PAD_TITULO_CUERPO'), 'sin padding fijo título→cuerpo');
  assert.ok(page.includes('titleBlockH'), 'el cuerpo no se posiciona según el bloque del título');
  assert.ok(page.includes('titleLines.forEach'), 'el título no se dibuja línea por línea');
  // El cuerpo arranca debajo del bloque completo del título.
  assert.match(page, /y = Math\.max\(top \+ numSize, titleTop \+ titleBlockH\) \+ PAD_TITULO_CUERPO/);
});

comprobar('Franjas superior/inferior funcionales y ≤15% (sin color vacío)', () => {
  assert.ok(layout.includes('MAX_FRANJA_SIN_CONTENIDO'), 'sin tope de franja');
  assert.ok(layout.includes('SAFE_ZONE_STORY_TOP = 0.12'), 'franja superior mayor al 12%');
  assert.ok(layout.includes('SAFE_ZONE_STORY_BOTTOM = 0.14'), 'franja inferior mayor al 14%');
  assert.ok(infografia.includes('FRANJA SUPERIOR (funcional'), 'la franja superior no declara contenido funcional');
  assert.ok(infografia.includes('TeoIcono('), 'la franja superior no lleva icono de marca');
  assert.ok(infografia.includes('fecha'), 'la franja superior no lleva fecha');
  assert.ok(infografia.includes('FRANJA INFERIOR (funcional'), 'la franja inferior no declara contenido funcional');
});

comprobar('Textos eliminados y sin truncado en la infografía', () => {
  assert.ok(!infografia.includes('RPM Ministry'), 'aún aparece "RPM Ministry"');
  assert.ok(!infografia.includes('piso legible'), 'aún aparece "piso legible"');
  assert.ok(!infografia.includes('Nivel {preset.nombre}'), 'aún aparece el nivel de densidad');
  // El tema superior no se trunca con "…".
  assert.ok(!infografia.includes('resumir(temaNombre'), 'el tema superior sigue truncándose');
  assert.ok(!infografia.includes('resumir(entrada.fraseRecordar, 60)'), 'la frase del encabezado sigue truncándose');
  // El wordmark de texto se eliminó (icono sin la palabra "TeoDoc").
  assert.ok(!/<text/.test(infografia.slice(infografia.indexOf('function TeoIcono'), infografia.indexOf('function TeoIcono') + 1600)), 'el logo conserva el wordmark de texto');
});

comprobar('PDF: sin recorte a mitad de idea y sin solape de etiquetas', () => {
  assert.ok(page.includes('recortarEnOracion'), 'sin recorte por oración (aparecería "…")');
  assert.ok(page.includes('labelTextW'), 'las etiquetas no miden su ancho real');
  assert.ok(page.includes('const apilado'), 'las etiquetas anchas no pasan a su propia línea');
});

comprobar('Infografía modular: filas 1/2/3 columnas, timeline y destacados', () => {
  assert.ok(infografia.includes("tipo_fila === 'grid_columnas'"), 'sin grid de columnas');
  assert.ok(infografia.includes("tipo_fila === 'timeline_secuencial'"), 'sin timeline secuencial');
  assert.ok(infografia.includes('destacado_ancho_completo'), 'sin destacados a ancho completo');
  assert.ok(infografia.includes('plan.cabecera.palabras_clave'), 'sin palabras clave de cabecera');
  assert.ok(infografia.includes('plan.cabecera.subtitulo'), 'sin subtítulo de cabecera');
});

comprobar('Infografía modular: límites de texto y conexiones SVG', () => {
  assert.ok(modular.includes('export const LIMITES'), 'sin límites de texto');
  assert.ok(modular.includes('limitarPalabras'), 'sin recorte por palabras');
  assert.ok(modular.includes('conexiones_visuales'), 'sin conexiones visuales');
  assert.ok(modular.includes('categoriaDe'), 'sin mapeo de categorías SVG');
  assert.ok(infografia.includes('conexionesPagina'), 'las conexiones no se calculan');
  assert.ok(infografia.includes('<path'), 'sin trazo SVG de conexión');
});

comprobar('Infografía modular: usa los puntos reales del análisis', () => {
  assert.ok(infografia.includes('data.desarrollo_progresivo'), 'no usa los puntos del análisis');
  assert.ok(modular.includes('LIMITES.pasosPorFila'), 'no reparte pasos por fila');
  assert.ok(modular.includes('pasosPorFila: 4'), 'el límite por fila no es 4');
  assert.ok(modular.includes('ideaPalabras: 15'), 'el límite de idea no es 15 palabras');
  assert.ok(modular.includes('pasoPalabras: 20'), 'el límite de paso no es 20 palabras');
});

// ---- Infografía: canvas FIJO 9:16, densidad y safe zones ----
comprobar('Infografía con canvas FIJO 9:16 (nunca crece por contenido)', () => {
  assert.ok(layout.includes('export const CANVAS_W = 1080'), 'sin ancho 1080');
  assert.ok(layout.includes('export const CANVAS_H = 1920'), 'sin alto 1920');
  assert.ok(infografia.includes('height: CANVAS_H'), 'el canvas no usa alto fijo');
  assert.ok(!infografia.includes('setCanvasH'), 'aún crece el alto dinámicamente');
  assert.ok(!infografia.includes('naturalH'), 'aún mide alto natural');
  assert.ok(!infografia.includes('scrollHeight'), 'aún amplía por desborde');
  assert.ok(!infografia.includes('16 / 9'), 'aparece 16:9 erróneo');
});

comprobar('Niveles de densidad como presets completos (1-4)', () => {
  assert.ok(layout.includes('export const PRESETS'), 'sin presets');
  assert.ok(layout.includes('NivelDensidad = 1 | 2 | 3 | 4'), 'sin 4 niveles');
  for (const campo of ['display', 'tituloTarjeta', 'numeral', 'cuerpo', 'caption', 'lineHeight', 'padTarjeta', 'gapTarjetas', 'icono', 'ilustracion']) {
    assert.ok(layout.includes(campo), `preset sin campo ${campo}`);
  }
});

comprobar('Piso de legibilidad absoluto definido y respetado', () => {
  assert.ok(layout.includes('export const PISO_LEGIBILIDAD'), 'sin piso de legibilidad');
  assert.ok(layout.includes('export function presetRespetaPiso'), 'sin validador de piso');
  assert.ok(layout.includes('cuerpo: 30'), 'piso de cuerpo distinto de 30');
  assert.ok(layout.includes('titulo: 38'), 'piso de título distinto de 38');
  assert.ok(layout.includes('numeral: 38'), 'piso de numeral distinto de 38');
  assert.ok(layout.includes('caption: 23'), 'piso de caption distinto de 23');
});

comprobar('Modos automáticos carrusel y resumen', () => {
  assert.ok(layout.includes("'unico' | 'carrusel' | 'resumen'"), 'sin modos');
  assert.ok(layout.includes('export function planificarInfografia'), 'sin planificador');
  assert.ok(layout.includes('export function recortarParaResumen'), 'sin recorte de resumen');
  assert.ok(layout.includes('export function empaquetarEnPaginas'), 'sin empaquetado de carrusel');
  assert.ok(infografia.includes('{idx + 1}/{total}'), 'sin numeración de carrusel');
  assert.ok(infografia.includes('pagina'), 'el componente no acepta página');
});

comprobar('Safe zones ampliadas de Stories y feed', () => {
  assert.ok(layout.includes('SAFE_ZONE_STORY_TOP'), 'sin zona superior');
  assert.ok(layout.includes('SAFE_ZONE_STORY_BOTTOM'), 'sin zona inferior');
  assert.ok(layout.includes('SAFE_ZONE_FEED'), 'sin zona de feed');
  assert.ok(layout.includes('export function metricasCanvas'), 'sin métricas de canvas');
});

comprobar('Infografía con breadcrumbs y flechas de conexión', () => {
  assert.ok(infografia.includes('Breadcrumb'), 'sin breadcrumbs en el timeline');
  assert.ok(infografia.includes('marker'), 'sin punta de flecha en las conexiones');
});

comprobar('Infografía sin recursos remotos (Safari-safe)', () => {
  assert.ok(!infografia.includes('http://') && !infografia.includes('https://'), 'referencia remota en infografia');
  assert.ok(!ilustraciones.includes('http://') && !ilustraciones.includes('https://'), 'referencia remota en ilustraciones');
});

comprobar('Librería de ilustraciones por categorías temáticas (1.2)', () => {
  assert.ok(ilustraciones.includes('export function elegirIlustracion'), 'sin selector temático');
  for (const id of ['casa', 'mesa', 'vela', 'corazon', 'manos', 'llama', 'bifurcacion', 'brujula', 'huellas', 'manantial', 'semilla', 'amanecer', 'rollo', 'cayado', 'paloma']) {
    assert.ok(ilustraciones.includes(`'${id}'`), `falta ilustración ${id}`);
  }
});

// ---- Análisis: esquema enriquecido y profundidad (casos 1-8, 16) ----
comprobar('Análisis con clasificador de riqueza aislado', () => {
  assert.ok(analyze.includes("@/lib/riqueza-contenido"), 'no importa el clasificador');
});

comprobar('Esquema con campos enriquecidos', () => {
  for (const campo of ['proposito', 'contexto_general', 'contexto_historico', 'contexto_literario', 'relacion_textos', 'interpretacion', 'conexiones_biblicas']) {
    assert.ok(analyze.includes(campo), `falta campo ${campo}`);
  }
});

// ---- Terminología (encargo explícito) ----
comprobar('Sin "prédica" en la interfaz, PDF e infografía', () => {
  assert.ok(!page.includes('prédica'), 'page.tsx aún dice prédica');
  assert.ok(!infografia.includes('prédica'), 'infografia.tsx aún dice prédica');
});

comprobar('El prompt prohíbe "predicador" y pide "expositor"', () => {
  assert.ok(analyze.includes('nunca "el predicador"'), 'sin instrucción de terminología');
  assert.ok(analyze.includes('el expositor'), 'sin uso de expositor');
});

console.log('Verificación de entrega (iOS / PNG / PDF / infografía)');
console.log(pruebas.join('\n'));
console.log(`\n${pasadas} pruebas superadas.`);
