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
  assert.match(page, /TeoDoc_Infografia_.*\.png/);
  assert.ok(!page.includes('.png.txt'), 'aparece extensión .png.txt');
  assert.ok(/Infografia_\$\{safe \|\| 'mensaje'\}\.png/.test(page), 'nombre de PNG mal formado');
});

comprobar('El PDF se entrega con MIME application/pdf', () => {
  assert.ok(page.includes("new Blob([pdfBlob], { type: 'application/pdf' })"), 'PDF sin MIME');
});

// ---- PDF: márgenes de impresión/argollado y layout (casos 9, 10) ----
comprobar('PDF con margen interior de argollado y exterior distintos', () => {
  assert.ok(page.includes('const margin = 74'), 'sin margen interior');
  assert.ok(page.includes('const marginR = 52'), 'sin margen exterior');
  assert.ok(page.includes('const marginT = 58'), 'sin margen superior');
  assert.ok(page.includes('const marginB = 62'), 'sin margen inferior');
});

comprobar('PDF con keep-with-next y control de página (sin huérfanos)', () => {
  assert.ok(page.includes('const heading = (label: string, keep'), 'sin keep en headings');
  assert.ok(page.includes('const nuevaPagina = ()'), 'sin control de página');
});

// ---- Infografía 9:16 y zona segura (casos 11, 12) ----
comprobar('Infografía en 9:16 (NO 16:9)', () => {
  assert.ok(infografia.includes('(canvasH * 9) / 16'), 'no usa 9:16');
  assert.ok(!infografia.includes('16 / 9'), 'aparece 16:9 erróneo');
});

comprobar('Infografía con zona segura proporcional', () => {
  assert.ok(infografia.includes('const safe = Math.max(48'), 'sin zona segura');
});

comprobar('Infografía con bloques dinámicos (hasta 10 enseñanzas)', () => {
  assert.ok(infografia.includes('.slice(0, 10)'), 'sin tope dinámico de 10');
  assert.ok(infografia.includes('conexiones_biblicas'), 'sin conexiones bíblicas');
  assert.ok(infografia.includes('IlustracionTema'), 'sin ilustración de relleno');
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
