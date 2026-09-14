// Verificación de la lógica de riqueza/profundidad (punto 14 del encargo).
// Se ejecuta con: node scripts/verificar-riqueza.mts
import assert from 'node:assert/strict';
import {
  evaluarRiqueza,
  rangoPuntosSugerido,
  contextoRiqueza,
  PALABRAS_POR_MINUTO,
  type NivelProfundidad,
} from '../lib/riqueza-contenido.ts';

const relleno = (palabras: number) => Array.from({ length: palabras }, (_, i) => `palabra${i % 40}`).join(' ');

let pasadas = 0;
const pruebas: string[] = [];
function comprobar(nombre: string, fn: () => void) {
  fn();
  pasadas += 1;
  pruebas.push(`  ✓ ${nombre}`);
}

// Caso 1 — Audio corto, enseñanza sencilla.
comprobar('Caso 1: mensaje breve → nivel breve, 2-3 puntos', () => {
  const r = evaluarRiqueza(relleno(300));
  assert.equal(r.nivel, 'breve');
  assert.deepEqual(rangoPuntosSugerido(r.nivel), { min: 2, max: 3 });
});

// Caso 2 — Predicación de duración media (~22 min).
comprobar('Caso 2: mensaje medio → nivel media, 3-6 puntos', () => {
  const r = evaluarRiqueza(relleno(22 * PALABRAS_POR_MINUTO));
  assert.equal(r.nivel, 'media');
  assert.deepEqual(rangoPuntosSugerido(r.nivel), { min: 3, max: 6 });
});

// Caso 3 — Predicación extensa con muchos puntos (~45 min).
comprobar('Caso 3: mensaje extenso → nivel amplia, 5-9 puntos', () => {
  const r = evaluarRiqueza(relleno(45 * PALABRAS_POR_MINUTO));
  assert.equal(r.nivel, 'amplia');
  assert.deepEqual(rangoPuntosSugerido(r.nivel), { min: 5, max: 9 });
});

// Caso 4 — Conferencia teológica muy densa (~92 min).
comprobar('Caso 4: conferencia densa → nivel profunda, 7-12 puntos', () => {
  const r = evaluarRiqueza(relleno(92 * PALABRAS_POR_MINUTO));
  assert.equal(r.nivel, 'profunda');
  assert.deepEqual(rangoPuntosSugerido(r.nivel), { min: 7, max: 12 });
});

// Caso 5 — Transcripción con pocos textos bíblicos.
comprobar('Caso 5: sin referencias bíblicas → refs = 0', () => {
  const r = evaluarRiqueza(relleno(3000));
  assert.equal(r.refs, 0);
});

// Caso 6 — Transcripción con muchos textos bíblicos (+ densidad sube nivel).
comprobar('Caso 6: muchas referencias bíblicas elevan la densidad', () => {
  const base = Array.from({ length: 16 }, (_, i) => `Juan 3:${i + 1} y Romanos 8:${i + 1}`).join('. ');
  const texto = `${relleno(2000)}. ${base}`;
  const r = evaluarRiqueza(texto);
  assert.ok(r.refs >= 15, `refs=${r.refs}`);
  assert.equal(r.nivel, 'amplia'); // media base + densidad => amplia
});

// Caso 16 — Contenido extremadamente largo.
comprobar('Caso 16: contenido extremadamente largo → profunda y coherente', () => {
  const r = evaluarRiqueza(relleno(26000));
  assert.equal(r.nivel, 'profunda');
  assert.ok(r.duracionMin >= 200, `duracionMin=${r.duracionMin}`);
});

// Robustez: entrada vacía / nula no debe romper.
comprobar('Robustez: texto vacío → breve, 0 palabras', () => {
  const r = evaluarRiqueza('');
  assert.equal(r.palabras, 0);
  assert.equal(r.nivel, 'breve');
});

// El contexto inyectado al prompt menciona el rango orientativo.
comprobar('contextoRiqueza incluye nivel y rango', () => {
  const ctx = contextoRiqueza(relleno(45 * PALABRAS_POR_MINUTO));
  assert.match(ctx, /AMPLIA/);
  assert.match(ctx, /5 a 9 puntos/);
});

// La duración es coherente con las palabras (indicador secundario).
comprobar('duracionMin = palabras / 130', () => {
  const r = evaluarRiqueza(relleno(1300));
  assert.equal(r.duracionMin, Math.round(1300 / PALABRAS_POR_MINUTO));
});

const niveles: NivelProfundidad[] = ['breve', 'media', 'amplia', 'profunda'];
comprobar('Los cuatro niveles tienen rango definido y creciente', () => {
  const rangos = niveles.map((n) => rangoPuntosSugerido(n));
  for (let i = 1; i < rangos.length; i++) assert.ok(rangos[i].min >= rangos[i - 1].min);
});

console.log('Verificación de riqueza/profundidad');
console.log(pruebas.join('\n'));
console.log(`\n${pasadas} pruebas superadas.`);
