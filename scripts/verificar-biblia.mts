import assert from 'node:assert/strict';
import { crearResultadoDemo } from './fixtures/demo.ts';
import { construirReferencias } from '../lib/referencias.ts';

process.env.BIBLE_VERIFY = 'true';
process.env.BIBLE_TRANSLATION = 'sse';
process.env.BIBLE_TRANSLATION_LICENSE = 'Dominio público';
process.env.BIBLE_API_BASE = 'https://bible.test/v2';

const originalFetch = globalThis.fetch;
globalThis.fetch = (async (input: RequestInfo | URL) => {
  const url = String(input);
  if (url.includes('Mateo')) {
    return new Response('no disponible', { status: 503 });
  }
  return new Response(JSON.stringify({
    sse_ref: {
      translation: 'Sagradas Escrituras (1569)',
      verses: [{ text: 'Texto bíblico verificado de prueba.' }],
    },
  }), { status: 200, headers: { 'Content-Type': 'application/json' } });
}) as typeof fetch;

const { normalizarCita, verificarReferencias } = await import('../lib/biblia.ts');

let pasadas = 0;
const pruebas: string[] = [];
async function comprobar(nombre: string, fn: () => void | Promise<void>) {
  await fn();
  pasadas += 1;
  pruebas.push(`  ✓ ${nombre}`);
}

await comprobar('Normaliza nombres y abreviaturas de libros en español', () => {
  assert.equal(normalizarCita('Santiago 2:17'), 'Santiago 2:17');
  assert.equal(normalizarCita('Salmo 23:1-3'), 'Salmos 23:1-3');
  assert.equal(normalizarCita('1 Co 13:4-7'), '1 Corintios 13:4-7');
  assert.equal(normalizarCita('texto sin referencia'), null);
});

await comprobar('Verifica las referencias con una fuente abierta y conserva licencia y fuente', async () => {
  const analisis = crearResultadoDemo('general');
  await verificarReferencias(analisis);
  const referencias = construirReferencias(analisis);
  assert.ok(referencias.length >= 4);
  const santiago = referencias.find((referencia) => referencia.cita === 'Santiago 2:17');
  assert.ok(santiago);
  assert.equal(santiago.estado, 'verificada');
  assert.equal(santiago.traduccion, 'Sagradas Escrituras (1569)');
  assert.equal(santiago.licencia, 'Dominio público');
  assert.match(santiago.fuente, /^https:\/\/bible\.test\/v2\/sse\//);
  assert.equal(santiago.texto, 'Texto bíblico verificado de prueba.');
});

await comprobar('Una referencia no disponible queda pendiente sin borrar el texto detectado', async () => {
  const analisis = crearResultadoDemo('general');
  await verificarReferencias(analisis);
  const referencias = construirReferencias(analisis);
  const mateo = referencias.find((referencia) => referencia.cita === 'Mateo 5:16');
  assert.ok(mateo);
  assert.equal(mateo.estado, 'pendiente_de_verificacion');
  assert.ok(mateo.texto.length > 0);
});

await comprobar('No se inventa una traducción cuando la verificación falla', async () => {
  const analisis = crearResultadoDemo('general');
  await verificarReferencias(analisis);
  const referencias = construirReferencias(analisis);
  const pendiente = referencias.find((referencia) => referencia.estado === 'pendiente_de_verificacion');
  assert.ok(pendiente);
  assert.equal(pendiente.traduccion, 'No identificada en la transcripción');
});

globalThis.fetch = originalFetch;

console.log('Verificación de referencias bíblicas con fuente abierta');
console.log(pruebas.join('\n'));
console.log(`\n${pasadas} pruebas superadas (fetch simulado).`);
