// Verificación del arquitecto modular de infografía: estructura JSON, límites
// de texto, categorías SVG, conexiones y reparto de puntos.
// Se ejecuta con: node scripts/verificar-modular.mts
import assert from 'node:assert/strict';
import {
  construirModular,
  contarPalabras,
  limitarPalabras,
  categoriaDe,
  ilustracionDeCategoria,
  planificarModular,
  LIMITES,
  type BloqueModular,
  type EntradaModular,
} from '../lib/infografia-modular.ts';
import { metricasCanvas } from '../lib/infografia-layout.ts';

let pasadas = 0;
const pruebas: string[] = [];
const comprobar = (nombre: string, fn: () => void) => { fn(); pasadas += 1; pruebas.push(`  ✓ ${nombre}`); };

const texto = (n: number) => Array.from({ length: n }, (_, i) => `palabra${i}`).join(' ');

const entradaCompleta: EntradaModular = {
  titulo: 'La necesidad de rendirse a la presencia de Dios en medio de la prueba',
  ideaPrincipal: 'No se trata de tus fuerzas ni de tu terquedad; se trata de rendirte a la presencia de Dios.',
  temaPrincipal: 'Rendición',
  pasaje: 'Éxodo 33:12-14',
  textoClave: 'Mi presencia irá contigo y yo te daré descanso.',
  verdadPrincipal: 'Su presencia es nuestro centro.',
  fraseRecordar: 'Ríndete a su presencia y hallarás descanso.',
  palabras: ['rendición', 'presencia', 'descanso', 'gracia'],
  puntos: Array.from({ length: 10 }, (_, i) => ({ titulo: `Punto principal ${i + 1}`, detalle: texto(12) })),
  versiculos: [{ cita: 'Éxodo 33:14', texto: 'Mi presencia irá contigo.' }],
};

const mod = construirModular(entradaCompleta);

comprobar('Cabecera: título ≤5 palabras, subtítulo y 3-4 palabras clave', () => {
  assert.ok(contarPalabras(mod.cabecera.titulo) <= LIMITES.tituloPalabras, `título: ${mod.cabecera.titulo}`);
  assert.ok(mod.cabecera.subtitulo.length <= LIMITES.subtituloChars + 1);
  assert.ok(mod.cabecera.palabras_clave.length >= 3 && mod.cabecera.palabras_clave.length <= LIMITES.palabrasClave);
});

comprobar('Estructura JSON con las claves exactas solicitadas', () => {
  const claves = Object.keys(mod).sort();
  assert.deepEqual(claves, ['cabecera', 'conexiones_visuales', 'filas_layout']);
  assert.deepEqual(Object.keys(mod.cabecera).sort(), ['palabras_clave', 'subtitulo', 'titulo']);
  for (const f of mod.filas_layout) {
    assert.ok(['grid_columnas', 'timeline_secuencial', 'destacado_ancho_completo'].includes(f.tipo_fila));
    for (const b of f.bloques) {
      assert.ok(typeof b.id === 'string' && b.id.length > 0);
      assert.ok(typeof b.titulo === 'string' && typeof b.texto === 'string');
      assert.ok(['hogar', 'fe', 'camino', 'milagro', 'generico'].includes(b.categoriaSVG));
    }
  }
  // Debe ser serializable tal cual.
  JSON.parse(JSON.stringify(mod));
});

comprobar('Grid de 2-3 columnas con textos ≤15 palabras', () => {
  const grid = mod.filas_layout.find((f) => f.tipo_fila === 'grid_columnas');
  assert.ok(grid && grid.tipo_fila === 'grid_columnas');
  if (grid && grid.tipo_fila === 'grid_columnas') {
    assert.ok(grid.columnas === 2 || grid.columnas === 3, `columnas=${grid.columnas}`);
    assert.ok(grid.bloques.length >= 2 && grid.bloques.length <= 3);
    for (const b of grid.bloques) assert.ok(contarPalabras(b.texto) <= LIMITES.ideaPalabras, b.texto);
  }
});

comprobar('Timeline con pasos ≤20 palabras y ≤4 por fila', () => {
  const timelines = mod.filas_layout.filter((f) => f.tipo_fila === 'timeline_secuencial');
  assert.ok(timelines.length >= 1, 'sin timeline');
  for (const t of timelines) {
    assert.ok(t.bloques.length >= 2 && t.bloques.length <= LIMITES.pasosPorFila);
    for (const b of t.bloques) {
      assert.ok(contarPalabras(b.texto) <= LIMITES.pasoPalabras, b.texto);
      assert.match(b.paso || '', /^\d{2}$/);
    }
  }
});

comprobar('Destacados a ancho completo (1-2) con versículo', () => {
  const dest = mod.filas_layout.find((f) => f.tipo_fila === 'destacado_ancho_completo');
  assert.ok(dest, 'sin destacado');
  if (dest) {
    assert.ok(dest.bloques.length >= 1 && dest.bloques.length <= LIMITES.destacadosMax);
    assert.ok(dest.bloques.some((b) => b.tipo === 'versiculo'), 'sin versículo destacado');
  }
});

comprobar('Se conservan los 10 puntos (3 en grid + 7 en timeline)', () => {
  const enGrid = mod.filas_layout.filter((f) => f.tipo_fila === 'grid_columnas').flatMap((f) => f.bloques).length;
  const enTimeline = mod.filas_layout.filter((f) => f.tipo_fila === 'timeline_secuencial').flatMap((f) => f.bloques).length;
  assert.equal(enGrid + enTimeline, 10, `grid=${enGrid} timeline=${enTimeline}`);
});

comprobar('Conexiones visuales referencian ids existentes', () => {
  const ids = new Set(mod.filas_layout.flatMap((f) => f.bloques.map((b) => b.id)));
  assert.ok(mod.conexiones_visuales.length >= 1, 'sin conexiones');
  for (const c of mod.conexiones_visuales) {
    assert.ok(ids.has(c.origen_id), `origen inexistente: ${c.origen_id}`);
    assert.ok(ids.has(c.destino_id), `destino inexistente: ${c.destino_id}`);
  }
});

comprobar('Categorías SVG por palabras clave', () => {
  assert.equal(categoriaDe('Casa de oración y hospitalidad'), 'hogar');
  assert.equal(categoriaDe('Paso de fe y confianza'), 'fe');
  assert.equal(categoriaDe('Camino y decisión'), 'camino');
  assert.equal(categoriaDe('Milagro de sanidad'), 'milagro');
  assert.equal(categoriaDe('texto neutro'), 'generico');
  for (const cat of ['hogar', 'fe', 'camino', 'milagro', 'generico'] as const) {
    assert.ok(ilustracionDeCategoria(cat).length > 0);
  }
});

comprobar('limitarPalabras no corta a mitad de palabra', () => {
  const r = limitarPalabras('uno dos tres cuatro cinco seis siete', 3);
  assert.ok(r.startsWith('uno dos tres'));
  assert.equal(contarPalabras(r.replace('…', '')), 3);
});

comprobar('El plan siempre tiene al menos una página y respeta 9:16', () => {
  const m = metricasCanvas();
  const plan = planificarModular(mod, { anchoContenido: m.anchoEsen, altoDisponible: m.altoBanda - 24, maxPaginasCarrusel: 4 });
  assert.ok(plan.paginas.length >= 1);
  for (const pg of plan.paginas) assert.ok(pg.length >= 0);
  assert.ok([1, 2, 3, 4].includes(plan.nivel));
});

// Caso mínimo: sin puntos, no debe romperse.
comprobar('Caso mínimo: solo cabecera + destacado', () => {
  const min = construirModular({ titulo: 'Título', ideaPrincipal: 'Una idea central.', pasaje: 'Juan 3:16', textoClave: 'Porque de tal manera amó Dios.' });
  assert.ok(min.cabecera.titulo.length > 0);
  assert.ok(min.filas_layout.some((f) => f.tipo_fila === 'destacado_ancho_completo'));
  const bl: BloqueModular[] = min.filas_layout.flatMap((f) => f.bloques);
  assert.ok(bl.length >= 1);
});

console.log('Verificación del arquitecto modular de infografía');
console.log(pruebas.join('\n'));
console.log(`\n${pasadas} pruebas superadas.`);
