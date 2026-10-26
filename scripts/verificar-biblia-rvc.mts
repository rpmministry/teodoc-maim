import assert from 'node:assert/strict';
import { crearResultadoDemo } from './fixtures/demo.ts';
import { construirReferencias } from '../lib/referencias.ts';

process.env.BIBLE_PROVIDER = 'api-bible';
process.env.BIBLE_API_BASE = 'https://api.bible.test/v1';
process.env.BIBLE_API_KEY = 'clave-de-prueba';
process.env.BIBLE_TRANSLATION_ID = 'rvc-test';
process.env.BIBLE_TRANSLATION_NAME = 'Reina Valera Contemporánea';
process.env.BIBLE_TRANSLATION_LICENSE = 'Licencia de prueba';
process.env.BIBLE_VERIFY = 'true';

const originalFetch = globalThis.fetch;
const urls: string[] = [];
globalThis.fetch = (async (input: RequestInfo | URL) => {
  urls.push(String(input));
  return new Response(JSON.stringify({
    data: {
      content: '<p>Texto RVC de prueba.</p>',
      copyright: '© Sociedades Bíblicas Unidas. Licencia de prueba.',
    },
  }), { status: 200, headers: { 'Content-Type': 'application/json' } });
}) as typeof fetch;

const { verificarReferencias } = await import('../lib/biblia.ts');

let pasadas = 0;
const pruebas: string[] = [];
async function comprobar(nombre: string, fn: () => void | Promise<void>) {
  await fn();
  pasadas += 1;
  pruebas.push(`  ✓ ${nombre}`);
}

await comprobar('El adaptador API.Bible usa el identificador OSIS de la referencia', async () => {
  const analisis = crearResultadoDemo('general');
  await verificarReferencias(analisis);
  assert.ok(urls.some((url) => url.includes('/passages/JAS.2.17')), 'No se consultó JAS.2.17');
  assert.ok(urls.every((url) => url.includes('/bibles/rvc-test/')), 'No se usó el ID de RVC');
});

await comprobar('El texto, la traducción y la licencia de RVC llegan al inventario', async () => {
  const analisis = crearResultadoDemo('general');
  await verificarReferencias(analisis);
  const referencias = construirReferencias(analisis);
  const santiago = referencias.find((referencia) => referencia.cita === 'Santiago 2:17');
  assert.ok(santiago);
  assert.equal(santiago.estado, 'verificada');
  assert.equal(santiago.traduccion, 'Reina Valera Contemporánea');
  assert.equal(santiago.licencia, '© Sociedades Bíblicas Unidas. Licencia de prueba.');
  assert.match(santiago.texto, /Texto RVC de prueba/);
});

globalThis.fetch = originalFetch;

console.log('Verificación del adaptador Reina Valera Contemporánea (API.Bible simulado)');
console.log(pruebas.join('\n'));
console.log(`\n${pasadas} pruebas superadas (API.Bible simulado; no se usó una clave real).`);
