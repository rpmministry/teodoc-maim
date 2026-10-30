import assert from 'node:assert/strict';

try {
  process.loadEnvFile('.env.local');
} catch {}

import { extractYouTubeVideoId, isYouTubeUrl } from '../lib/youtube/extract-video-id.ts';
import { innertubeTranscriptProvider } from '../lib/youtube/innertube-transcript-provider.ts';
import { youtubeAudioTranscriptProvider } from '../lib/youtube/audio-transcript-provider.ts';
import { resolveTranscriptProvider } from '../lib/youtube/index.ts';
import { TranscriptError } from '../lib/youtube/transcript-provider.ts';
import { calcularHuellaUrl, guardarContenidoCanonico, obtenerContenidoCanonico } from '../lib/canonical-store.ts';

let pasadas = 0;
const pruebas: string[] = [];

async function comprobarAsync(nombre: string, fn: () => Promise<void>) {
  try {
    await fn();
    pasadas += 1;
    pruebas.push(`  ✓ ${nombre}`);
    console.log(`  ✓ ${nombre}`);
  } catch (err) {
    console.error(`  ✗ Fallo en prueba: ${nombre}`);
    throw err;
  }
}

console.log('=== SUITE DE VALIDACIÓN: SISTEMA DEFINITIVO DE EXTRACCIÓN Y TRANSCRIPCIÓN YOUTUBE ===\n');

// 1. Normalización e identificación de IDs de YouTube
await comprobarAsync('Normalización: Reconoce todas las variantes habituales de URLs de YouTube', async () => {
  const casos = [
    { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', esperado: 'dQw4w9WgXcQ' },
    { url: 'https://youtube.com/watch?v=dQw4w9WgXcQ', esperado: 'dQw4w9WgXcQ' },
    { url: 'https://youtu.be/dQw4w9WgXcQ', esperado: 'dQw4w9WgXcQ' },
    { url: 'https://m.youtube.com/watch?v=dQw4w9WgXcQ&t=42s', esperado: 'dQw4w9WgXcQ' },
    { url: 'https://www.youtube.com/shorts/dQw4w9WgXcQ', esperado: 'dQw4w9WgXcQ' },
    { url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', esperado: 'dQw4w9WgXcQ' },
    { url: 'https://www.youtube.com/live/dQw4w9WgXcQ?feature=share', esperado: 'dQw4w9WgXcQ' },
    { url: 'https://www.youtube.com/v/dQw4w9WgXcQ', esperado: 'dQw4w9WgXcQ' },
    { url: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ', esperado: 'dQw4w9WgXcQ' },
    { url: 'dQw4w9WgXcQ', esperado: 'dQw4w9WgXcQ' },
  ];

  for (const c of casos) {
    assert.equal(extractYouTubeVideoId(c.url), c.esperado, `Fallo en: ${c.url}`);
    assert.equal(isYouTubeUrl(c.url), true);
  }

  // Rechazo de enlaces inválidos o malformados
  assert.equal(extractYouTubeVideoId('https://vimeo.com/12345678'), null);
  assert.equal(extractYouTubeVideoId('https://facebook.com/watch/?v=123'), null);
  assert.equal(extractYouTubeVideoId('texto_aleatorio_no_id'), null);
  assert.equal(extractYouTubeVideoId(''), null);
});

// 2. Extracción de subtítulos oficiales / automáticos (Método 1)
await comprobarAsync('Método 1: Extrae subtítulos disponibles y metadatos con InnerTube Android', async () => {
  const videoId = 'dQw4w9WgXcQ';
  const resultado = await innertubeTranscriptProvider.fetchTranscript(videoId);

  assert.ok(resultado.text.length > 500, `Texto muy corto: ${resultado.text.length}`);
  assert.ok(resultado.segments.length > 10, `Segmentos insuficientes: ${resultado.segments.length}`);
  assert.equal(resultado.meta.source, 'youtube');
  assert.equal(resultado.meta.videoId, videoId);
  assert.ok(resultado.meta.title?.includes('Rick Astley'), `Título incorrecto: ${resultado.meta.title}`);
  assert.equal(resultado.meta.method, 'subtitulos');

  // Verificar estructura de segmentos
  const primerSeg = resultado.segments[0];
  assert.ok(typeof primerSeg.text === 'string' && primerSeg.text.length > 0);
  assert.ok(typeof primerSeg.start === 'number' && primerSeg.start >= 0);
  assert.ok(typeof primerSeg.duration === 'number' && primerSeg.duration >= 0);
});

// 3. Manejo de videos no disponibles / privados (no intenta evadir permisos)
await comprobarAsync('Seguridad: Detecta correctamente video no disponible o privado y respeta permisos', async () => {
  let codigoError = '';
  try {
    await innertubeTranscriptProvider.fetchTranscript('XXXXXXXXXXX');
  } catch (err: any) {
    if (err instanceof TranscriptError) {
      codigoError = err.code;
    }
  }
  assert.equal(codigoError, 'video_no_disponible', `Código de error esperado: video_no_disponible, recibido: ${codigoError}`);
});

// 4. Extracción de audio y transcripción IA (Método 2)
await comprobarAsync('Método 2: Extracción directa de flujo de audio + Deepgram Nova-2', async () => {
  const videoId = 'jNQXAC9IVRw'; // Me at the zoo (audio corto para test rápido)
  const resultado = await youtubeAudioTranscriptProvider.fetchTranscript(videoId, { languages: ['en'] });

  assert.ok(resultado.text.length > 50, `Texto de audio muy corto: ${resultado.text.length}`);
  assert.ok(resultado.text.toLowerCase().includes('elephant') || resultado.text.toLowerCase().includes('zoo'), 'El texto transcrito no coincide');
  assert.equal(resultado.meta.method, 'audio_stt');
  assert.ok(resultado.meta.providerName?.includes('audio-'), `Proveedor no registrado: ${resultado.meta.providerName}`);
  assert.ok(resultado.segments.length > 0, 'No se generaron segmentos');
});

// 5. Cadena de respaldo unificada (FallbackTranscriptProvider)
await comprobarAsync('Fallback: resolveTranscriptProvider() resuelve con innertube prioritario y audio como respaldo', async () => {
  const provider = resolveTranscriptProvider();
  assert.ok(provider.name.includes('innertube'), 'Falta innertube en la cadena');
  assert.ok(provider.name.includes('audio'), 'Falta audio en la cadena');
});

// 6. Caché Canónica Deduplicada
await comprobarAsync('Caché Canónica: Evita peticiones duplicadas y reduce latencia y costes a 0', async () => {
  const testUrl = 'https://www.youtube.com/watch?v=TEST_CACHE_YOUTUBE';
  const huella = calcularHuellaUrl(testUrl);

  // Guardar transcripción simulada
  guardarContenidoCanonico({
    huella,
    tipo: 'url',
    fuente: testUrl,
    titulo: 'Prédica Simulada de Prueba',
    estado: 'completada',
    texto: 'Este es el texto completo de la prédica simulada en caché para verificar deduplicación.',
    caracteres: 85,
    palabras: 14,
    idioma: 'es',
    proveedor: 'test-cache',
    creadoEn: Date.now(),
    actualizadoEn: Date.now(),
    expiraEn: 0,
    metadatosAdicionales: {
      method: 'subtitulos',
      segments: [{ text: 'Este es el texto completo...', start: 0, duration: 10 }],
    },
  });

  const recuperado = obtenerContenidoCanonico(huella);
  assert.ok(recuperado, 'No se recuperó el registro de caché');
  assert.equal(recuperado.estado, 'completada');
  assert.equal(recuperado.titulo, 'Prédica Simulada de Prueba');
});

console.log(`\n=======================================================`);
console.log(`Resultados: ${pasadas} de 6 pruebas de YouTube completadas con éxito.`);
console.log(`=======================================================\n`);
