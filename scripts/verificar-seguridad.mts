// Verificación estática de los invariantes de seguridad y blindaje del código fuente
// Se ejecuta con: node scripts/verificar-seguridad.mts
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (rel: string) => readFileSync(resolve(raiz, rel), 'utf8');

const nextConfig = leer('next.config.mjs');
const proxy = leer('proxy.ts');
const rateLimit = leer('lib/rate-limit.ts');
const analyze = leer('app/api/analyze/route.ts');
const transcribe = leer('app/api/transcribe/route.ts');
const upload = leer('app/api/upload/route.ts');
const youtube = leer('app/api/youtube/route.ts');

let pasadas = 0;
const comprobar = (nombre: string, fn: () => void) => {
  fn();
  pasadas += 1;
  console.log(`  ✓ ${nombre}`);
};

console.log('Verificación de blindaje y capas de seguridad:');

// ---- 1. Compilación y Cabeceras Perimetrales ----
comprobar('next.config.mjs: Source maps deshabilitados en producción', () => {
  assert.ok(nextConfig.includes('productionBrowserSourceMaps: false'), 'Falta productionBrowserSourceMaps: false');
});

comprobar('next.config.mjs: Huella X-Powered-By eliminada', () => {
  assert.ok(nextConfig.includes('poweredByHeader: false'), 'Falta poweredByHeader: false');
});

comprobar('next.config.mjs: Cabeceras de seguridad perimetral (CSP, HSTS, X-Frame, Nosniff)', () => {
  assert.ok(nextConfig.includes('X-Frame-Options') && nextConfig.includes('DENY'), 'Falta X-Frame-Options DENY');
  assert.ok(nextConfig.includes('X-Content-Type-Options') && nextConfig.includes('nosniff'), 'Falta nosniff');
  assert.ok(nextConfig.includes('Content-Security-Policy'), 'Falta CSP');
  assert.ok(nextConfig.includes('Strict-Transport-Security'), 'Falta HSTS');
});

// ---- 2. Gateway Perimetral Next.js 16 (proxy.ts) ----
comprobar('proxy.ts: Interceptor perimetral activo para /api/*', () => {
  assert.ok(existsSync(resolve(raiz, 'proxy.ts')), 'No existe proxy.ts');
  assert.ok(proxy.includes('export function proxy'), 'Falta export function proxy');
  assert.ok(proxy.includes('/api/:path*'), 'Falta matcher /api/:path*');
  assert.ok(proxy.includes('originHost !== host'), 'Falta validación de host/origen');
});

// ---- 3. Rate Limiting con Aislamiento de Endpoints ----
comprobar('lib/rate-limit.ts: Aislamiento por endpoint y extracción multi-cabecera', () => {
  assert.ok(rateLimit.includes('verificarRateLimit'), 'Falta verificarRateLimit');
  assert.ok(rateLimit.includes('extraerIP'), 'Falta extraerIP');
  assert.ok(rateLimit.includes('limpiarBucketsExpirados'), 'Falta recolección de basura de memoria');
});

// ---- 4. Endurecimiento de Rutas Backend ----
const aiGemini = leer('lib/ai-gemini.ts');

comprobar('API Analyze: Rate limiting, techo de 250k chars y anti-prompt injection', () => {
  assert.ok(analyze.includes("verificarRateLimit(req, 'analyze'"), 'Falta rate limit en analyze');
  assert.ok(analyze.includes('250_000'), 'Falta límite de 250,000 caracteres');
  assert.ok(analyze.includes('BLINDAJE DE SEGURIDAD Y CONFIDENCIALIDAD'), 'Falta cláusula anti-prompt injection');
  assert.ok(aiGemini.includes('MODELOS_GEMINI'), 'MODELOS_GEMINI debe contener los modelos configurados');
});

comprobar('API Transcribe: Rate limiting y filtro anti-SSRF de audioUrl', () => {
  assert.ok(transcribe.includes("verificarRateLimit(req, 'transcribe'"), 'Falta rate limit en transcribe');
  assert.ok(transcribe.includes('esUrlAudioSegura'), 'Falta función anti-SSRF');
  assert.ok(transcribe.includes('169.254'), 'Debe bloquear IP de metadatos 169.254');
  assert.ok(transcribe.includes('127.0.0.1'), 'Debe bloquear localhost/127.0.0.1');
  assert.ok(transcribe.includes('ASSEMBLYAI_API_KEY') && transcribe.includes('DEEPGRAM_API_KEY'), 'Debe validar los proveedores de transcripción');
  assert.ok(transcribe.includes('No hay proveedor de transcripción configurado'), 'Debe explicar la falta de configuración');
});

comprobar('API Upload: Rate limiting, límite 150 MB y validación de tipos MIME', () => {
  assert.ok(upload.includes("verificarRateLimit(req, 'upload'"), 'Falta rate limit en upload');
  assert.ok(upload.includes('150 * 1024 * 1024'), 'Falta límite de tamaño de 150 MB');
  assert.ok(upload.includes('esTipoValido'), 'Falta validación de tipo MIME');
});

comprobar('API YouTube: Rate limiting por IP activo', () => {
  assert.ok(youtube.includes("verificarRateLimit(req, 'youtube'"), 'Falta rate limit en youtube');
});

console.log(`\n${pasadas} pruebas de seguridad superadas exitosamente.`);
