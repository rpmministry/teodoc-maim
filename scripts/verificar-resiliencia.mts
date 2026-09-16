// Verificación estática de los invariantes de resiliencia ante pantalla apagada y persistencia
// Se ejecuta con: node scripts/verificar-resiliencia.mts
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (rel: string) => readFileSync(resolve(raiz, rel), 'utf8');

const wakeLock = leer('lib/wake-lock.ts');
const storage = leer('lib/analisis-storage.ts');
const page = leer('app/page.tsx');
const aiGemini = leer('lib/ai-gemini.ts');

let pasadas = 0;
const comprobar = (nombre: string, fn: () => void) => {
  fn();
  pasadas += 1;
  console.log(`  ✓ ${nombre}`);
};

console.log('Verificación de resiliencia y retención de análisis con pantalla apagada:');

// ---- 1. Screen Wake Lock API ----
comprobar('lib/wake-lock.ts: Funciones requeridas exportadas', () => {
  assert.ok(existsSync(resolve(raiz, 'lib/wake-lock.ts')), 'No existe lib/wake-lock.ts');
  assert.ok(wakeLock.includes('export async function adquirirPantallaActiva'), 'Falta adquirirPantallaActiva');
  assert.ok(wakeLock.includes('export async function liberarPantallaActiva'), 'Falta liberarPantallaActiva');
  assert.ok(wakeLock.includes('export function estaPantallaActiva'), 'Falta estaPantallaActiva');
});

comprobar('lib/wake-lock.ts: Detección segura de soporte y visibilidad de pestaña', () => {
  assert.ok(wakeLock.includes("'wakeLock' in navigator"), 'Falta verificación de soporte wakeLock en navigator');
  assert.ok(wakeLock.includes("visibilitychange"), 'Falta observador de visibilitychange para reconexión');
  assert.ok(wakeLock.includes("document.visibilityState === 'visible'"), 'Falta re-adquisición al regresar a la pestaña');
});

// ---- 2. Persistencia en Cliente (LocalStorage & SessionStorage) ----
comprobar('lib/analisis-storage.ts: Métodos de guardado y recuperación exportados', () => {
  assert.ok(existsSync(resolve(raiz, 'lib/analisis-storage.ts')), 'No existe lib/analisis-storage.ts');
  assert.ok(storage.includes('export function guardarUltimoAnalisis'), 'Falta guardarUltimoAnalisis');
  assert.ok(storage.includes('export function obtenerUltimoAnalisis'), 'Falta obtenerUltimoAnalisis');
  assert.ok(storage.includes('export function limpiarUltimoAnalisis'), 'Falta limpiarUltimoAnalisis');
  assert.ok(storage.includes('export function guardarTranscripcionPendiente'), 'Falta guardarTranscripcionPendiente');
  assert.ok(storage.includes('export function obtenerTranscripcionPendiente'), 'Falta obtenerTranscripcionPendiente');
  assert.ok(storage.includes('export function limpiarTranscripcionPendiente'), 'Falta limpiarTranscripcionPendiente');
});

comprobar('lib/analisis-storage.ts: TTL de 48 horas y seguridad ante SSR', () => {
  assert.ok(storage.includes('48 * 60 * 60 * 1000'), 'Falta TTL de 48 horas');
  assert.ok(storage.includes("typeof window === 'undefined'"), 'Falta salvaguarda contra SSR');
});

// ---- 3. Integración en Flujo Principal (app/page.tsx) ----
comprobar('app/page.tsx: Adquisición de bloqueo en todos los canales de análisis', () => {
  assert.ok(page.includes("import { adquirirPantallaActiva, liberarPantallaActiva } from '@/lib/wake-lock'"), 'Falta import de wake-lock');
  assert.ok(page.includes('adquirirPantallaActiva()'), 'Falta llamada a adquirirPantallaActiva');
  assert.ok(page.includes('liberarPantallaActiva()'), 'Falta llamada a liberarPantallaActiva');
});

comprobar('app/page.tsx: Restauración de estado al montar el componente', () => {
  assert.ok(page.includes('obtenerUltimoAnalisis'), 'Falta restauración con obtenerUltimoAnalisis');
  assert.ok(page.includes('obtenerTranscripcionPendiente'), 'Falta restauración con obtenerTranscripcionPendiente');
});

comprobar('app/page.tsx: Limpieza de estado y liberación de pantalla en nuevo análisis', () => {
  assert.ok(page.includes('limpiarUltimoAnalisis()'), 'Falta limpiarUltimoAnalisis en nuevoAnalisis');
  assert.ok(page.includes('limpiarTranscripcionPendiente()'), 'Falta limpiarTranscripcionPendiente en nuevoAnalisis');
});

comprobar('app/page.tsx: Badge visual Carbon "Pantalla activa"', () => {
  assert.ok(page.includes('Pantalla activa'), 'Falta badge de Pantalla activa en la UI de carga');
});

// ---- 4. Invariante de Modelos Gemini ----
comprobar('lib/ai-gemini.ts: Modelos gemini-3.7-flash y gemini-3.6-flash preservados intactos', () => {
  assert.ok(
    aiGemini.includes("'gemini-3.7-flash'") && aiGemini.includes("'gemini-3.6-flash'"),
    'Los modelos Gemini autorizados fueron alterados'
  );
});

console.log(`\nResumen: ${pasadas} verificaciones de resiliencia completadas exitosamente.`);
