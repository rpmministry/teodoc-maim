import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ETAPAS_ANALISIS,
  DURACIONES_HISTORICAS,
  MENSAJES_POR_MODALIDAD,
  calcularProgresoYEstimacion,
  obtenerMensajeEtapa,
  crearTrabajoAnalisis,
  obtenerTrabajoAnalisis,
  cancelarTrabajoAnalisis,
  buscarTrabajoActivoPorHuella,
} from '../lib/analisis-job-manager.ts';
import { guardarContenidoCanonico, guardarAnalisisEnCanonico, calcularHuellaTexto } from '../lib/canonical-store.ts';
import { formatearTiempoSegundos } from '../lib/tracker-analisis.ts';
import { MODALIDADES } from '../lib/modalidades.ts';
import type { ModalidadId, ResultadoAnalisis } from '../lib/tipos.ts';

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (rel: string) => readFileSync(resolve(raiz, rel), 'utf8');

let pasadas = 0;
const pruebas: string[] = [];

function comprobar(nombre: string, fn: () => void | Promise<void>) {
  const res = fn();
  if (res instanceof Promise) {
    throw new Error('comprobar no soporta async directo; usa comprobarAsync');
  }
  pasadas += 1;
  pruebas.push(`  ✓ ${nombre}`);
}

async function comprobarAsync(nombre: string, fn: () => Promise<void>) {
  await fn();
  pasadas += 1;
  pruebas.push(`  ✓ ${nombre}`);
}

console.log('=== SUITE DE VERIFICACIÓN: EXPERIENCIA DE ESPERA Y PROGRESO MAIM ===\n');

// ---------------------------------------------------------------------------
// PRUEBA 1: Estructura de Etapas y Cálculo Exacto de Porcentaje sin Invenciones
// ---------------------------------------------------------------------------
comprobar('Prueba 1: Etapas reales ponderadas con cálculo honesto de porcentaje', () => {
  assert.equal(ETAPAS_ANALISIS.length, 6, 'Deben existir exactamente 6 etapas maestras');

  // Verificar que la suma de pesos sin audio es exactamente 100%
  const sumaSinAudio = ETAPAS_ANALISIS.reduce((s, e) => s + e.pesoSinAudio, 0);
  assert.equal(sumaSinAudio, 100, `La suma de pesos sin audio debe ser 100 (actual: ${sumaSinAudio})`);

  // Verificar que la suma de pesos con audio es exactamente 100%
  const sumaConAudio = ETAPAS_ANALISIS.reduce((s, e) => s + e.pesoConAudio, 0);
  assert.equal(sumaConAudio, 100, `La suma de pesos con audio debe ser 100 (actual: ${sumaConAudio})`);

  // Simular cálculo de porcentaje en etapa inicial
  const calc1 = calcularProgresoYEstimacion('validacion_preparacion', [], 1, 'bosquejo', false);
  assert.ok(calc1.progreso >= 5 && calc1.progreso <= 15, `Progreso inicial inesperado: ${calc1.progreso}`);
  assert.equal(calc1.esEstimado, true);

  // Simular cálculo con etapas intermedias completadas
  const calc2 = calcularProgresoYEstimacion(
    'redaccion_especialidad',
    ['validacion_preparacion', 'contexto_biblico', 'analisis_general'],
    10,
    'bosquejo',
    false,
  );
  assert.ok(calc2.progreso >= 60 && calc2.progreso <= 95, `Progreso intermedio inesperado: ${calc2.progreso}`);

  // El cálculo NUNCA debe llegar al 100% mientras la tarea esté en progreso
  assert.ok(calc2.progreso < 100, 'El progreso estimado no debe alcanzar el 100% antes de finalizar');
});

// ---------------------------------------------------------------------------
// PRUEBA 2: Mensajes Dinámicos Contextuales Específicos por Especialidad
// ---------------------------------------------------------------------------
comprobar('Prueba 2: Mensajes contextuales específicos para cada una de las 6 modalidades', () => {
  const modalidadesEsperadas: ModalidadId[] = ['general', 'bosquejo', 'grupos', 'jovenes', 'ninos', 'devocionales'];

  for (const mod of modalidadesEsperadas) {
    const mensajes = MENSAJES_POR_MODALIDAD[mod];
    assert.ok(mensajes, `Faltan mensajes para modalidad ${mod}`);
    assert.ok(mensajes.validacion_preparacion, `Falta mensaje de preparación en ${mod}`);
    assert.ok(mensajes.analisis_general, `Falta mensaje de análisis en ${mod}`);
    assert.ok(mensajes.verificacion_entrega, `Falta mensaje de entrega en ${mod}`);
    assert.ok(mensajes.completado, `Falta mensaje de completado en ${mod}`);

    const msgPreparacion = obtenerMensajeEtapa(mod, 'validacion_preparacion');
    assert.ok(msgPreparacion.length > 20, `Mensaje demasiado corto en ${mod}`);
  }

  // Verificar especificidad del mensaje de Liderazgo MAIM
  const msgLiderazgo = obtenerMensajeEtapa('bosquejo', 'redaccion_especialidad');
  assert.ok(
    msgLiderazgo.includes('bloques continuos') || msgLiderazgo.includes('liderazgo') || msgLiderazgo.includes('editorial'),
    'El mensaje de Liderazgo debe reflejar su carácter editorial',
  );

  // Verificar especificidad del mensaje de Niños
  const msgNinos = obtenerMensajeEtapa('ninos', 'redaccion_especialidad');
  assert.ok(msgNinos.includes('relato bíblico') || msgNinos.includes('didáctica') || msgNinos.includes('niños'), 'Mensaje de niños específico');

  // Verificar especificidad del mensaje de Devocionales
  const msgDevocionales = obtenerMensajeEtapa('devocionales', 'redaccion_especialidad');
  assert.ok(msgDevocionales.includes('siete jornadas') || msgDevocionales.includes('devocional'), 'Mensaje devocionales específico');
});

// ---------------------------------------------------------------------------
// PRUEBA 3: Creación de Trabajos, Deduplicación y Reutilización Canónica
// ---------------------------------------------------------------------------
comprobar('Prueba 3: Creación de trabajo, deduplicación activa y entrega inmediata desde caché', () => {
  const textoDemo = 'Texto de prueba para verificar la creación del trabajo asíncrono en TeoDoc MAIM. Este mensaje contiene suficiente texto para superar el umbral mínimo establecido.';
  const huella = calcularHuellaTexto(textoDemo);

  // 1. Crear un trabajo nuevo
  const t1 = crearTrabajoAnalisis({
    text: textoDemo,
    modalidad: 'general',
    titulo: 'Predicación de Prueba',
    predicador: 'Pastor MAIM',
  });

  assert.ok(t1.id, 'El trabajo debe tener un UUID asignado');
  assert.equal(t1.huella, huella);
  assert.equal(t1.modalidad, 'general');
  assert.ok(['iniciado', 'procesando'].includes(t1.estado));

  // 2. Consulta del trabajo creado
  const snapshot = obtenerTrabajoAnalisis(t1.id);
  assert.ok(snapshot, 'Debe recuperarse el trabajo por ID');
  assert.equal(snapshot?.id, t1.id);

  // 3. Deduplicación activa: si se solicita de nuevo para la misma huella mientras está activo, re-enlazar
  const tDuplicado = crearTrabajoAnalisis({
    text: textoDemo,
    modalidad: 'general',
    titulo: 'Predicación de Prueba Repetida',
  });
  assert.equal(tDuplicado.id, t1.id, 'Debe re-enlazar a la tarea activa sin crear una duplicada');

  // 4. Cancelación limpia
  const cancelado = cancelarTrabajoAnalisis(t1.id);
  assert.equal(cancelado, true);
  const snapCancelado = obtenerTrabajoAnalisis(t1.id);
  assert.equal(snapCancelado?.estado, 'cancelado');

  // 5. Entrega inmediata si ya está en caché canónica
  const textoCache = 'Texto con caché canónica previa para entrega en 10ms';
  const huellaCache = calcularHuellaTexto(textoCache);
  guardarContenidoCanonico({
    huella: huellaCache,
    tipo: 'texto',
    fuente: 'test_cache',
    estado: 'completada',
    texto: textoCache,
    caracteres: textoCache.length,
    palabras: 10,
    idioma: 'es',
    proveedor: 'directo',
    creadoEn: Date.now(),
    actualizadoEn: Date.now(),
    expiraEn: 0,
  });
  guardarAnalisisEnCanonico(huellaCache, 'general', {
    titulo: 'Análisis en Caché',
    idea_principal: 'La fe obra',
    tema_principal: 'Fe activa',
    proposito: 'Enseñar',
    contexto_general: 'Mensaje',
    texto_biblico_principal: { cita: 'Stg 2', texto: 'Fe' },
    otros_textos: [],
    contexto_biblico: '',
    contexto_historico: '',
    contexto_literario: '',
    relacion_textos: '',
    interpretacion: '',
    desarrollo_progresivo: [],
    ensenanzas: [],
    conceptos_clave: [],
    conceptos_teologicos: [],
    aplicacion: [],
    conclusion: 'Fin',
    oracion: 'Amén',
    metadatos: { modalidad: 'general', fechaAnalisis: '2026-10-29' },
    especializado: {},
  });

  const tInmediato = crearTrabajoAnalisis({
    text: textoCache,
    modalidad: 'general',
    titulo: 'Análisis Inmediato',
  });
  assert.equal(tInmediato.estado, 'completado');
  assert.equal(tInmediato.progreso, 100);
  assert.ok(tInmediato.resultado, 'Debe incluir el resultado de inmediato');
});

// ---------------------------------------------------------------------------
// PRUEBA 4: Formateo de Tiempos y Estimaciones Confiables
// ---------------------------------------------------------------------------
comprobar('Prueba 4: Formateo de tiempo transcurrido y estimaciones restantes', () => {
  assert.equal(formatearTiempoSegundos(0), '0 s');
  assert.equal(formatearTiempoSegundos(45), '45 s');
  assert.equal(formatearTiempoSegundos(60), '1 min');
  assert.equal(formatearTiempoSegundos(84), '1 min 24 s');
  assert.equal(formatearTiempoSegundos(180), '3 min');
  assert.equal(formatearTiempoSegundos(215), '3 min 35 s');
});

// ---------------------------------------------------------------------------
// PRUEBA 5: Endpoints de API (Job y Streaming SSE)
// ---------------------------------------------------------------------------
comprobar('Prueba 5: Endpoints backend /api/analyze/job y /api/analyze/job/stream existen y son conformes', () => {
  const rutaJob = resolve(raiz, 'app/api/analyze/job/route.ts');
  const rutaStream = resolve(raiz, 'app/api/analyze/job/stream/route.ts');

  assert.ok(existsSync(rutaJob), 'No existe app/api/analyze/job/route.ts');
  assert.ok(existsSync(rutaStream), 'No existe app/api/analyze/job/stream/route.ts');

  const codigoJob = leer('app/api/analyze/job/route.ts');
  assert.ok(codigoJob.includes('export async function POST'), 'Falta export POST en job route');
  assert.ok(codigoJob.includes('export async function GET'), 'Falta export GET en job route');
  assert.ok(codigoJob.includes('export async function DELETE'), 'Falta export DELETE en job route');
  assert.ok(codigoJob.includes('verificarRateLimit'), 'Falta rate limiting en job route');

  const codigoStream = leer('app/api/analyze/job/stream/route.ts');
  assert.ok(codigoStream.includes('text/event-stream'), 'Falta header text/event-stream');
  assert.ok(codigoStream.includes('ReadableStream'), 'Debe utilizar ReadableStream nativo de Next.js');
  assert.ok(codigoStream.includes(': ping'), 'Debe incluir ping de mantenimiento de conexión');
});

// ---------------------------------------------------------------------------
// PRUEBA 6: Componente UI de Progreso y Accesibilidad WCAG
// ---------------------------------------------------------------------------
comprobar('Prueba 6: Componente ProgresoAnalisis cumple WCAG (role, aria-live, minimizado)', () => {
  const rutaComponente = resolve(raiz, 'components/progreso-analisis.tsx');
  assert.ok(existsSync(rutaComponente), 'No existe components/progreso-analisis.tsx');

  const codigoComp = leer('components/progreso-analisis.tsx');
  assert.ok(codigoComp.includes('role="progressbar"'), 'Falta role="progressbar"');
  assert.ok(codigoComp.includes('aria-valuenow'), 'Falta aria-valuenow');
  assert.ok(codigoComp.includes('aria-valuemin={0}'), 'Falta aria-valuemin');
  assert.ok(codigoComp.includes('aria-valuemax={100}'), 'Falta aria-valuemax');
  assert.ok(codigoComp.includes('aria-live="polite"'), 'Falta región aria-live="polite" para lectores de pantalla');
  assert.ok(codigoComp.includes('Minimizar') || codigoComp.includes('minimizado'), 'Debe ofrecer minimizado');
  assert.ok(codigoComp.includes('Ver resultado') || codigoComp.includes('onVerResultado'), 'Debe ofrecer acceso directo al resultado');

  // Verificar regla de reducción de movimiento en CSS
  const css = leer('app/globals.css');
  assert.ok(css.includes('prefers-reduced-motion'), 'Falta media query prefers-reduced-motion');
  assert.ok(css.includes('progressbar'), 'Falta desactivación de transiciones en progressbar con reduced-motion');
});

// ---------------------------------------------------------------------------
// PRUEBA 7: Integración en app/page.tsx y Conservación de Invariantes
// ---------------------------------------------------------------------------
comprobar('Prueba 7: app/page.tsx integra el tracker y conserva persistencia y pantalla activa', () => {
  const page = leer('app/page.tsx');
  assert.ok(page.includes('useTrackerAnalisis'), 'app/page.tsx debe usar useTrackerAnalisis');
  assert.ok(page.includes('ProgresoAnalisis'), 'app/page.tsx debe renderizar ProgresoAnalisis');
  assert.ok(page.includes('adquirirPantallaActiva()'), 'Debe conservar adquisición de wake lock');
  assert.ok(page.includes('liberarPantallaActiva()'), 'Debe conservar liberación de wake lock');
  assert.ok(page.includes('Pantalla activa'), 'Debe conservar el badge de Pantalla activa');
  assert.ok(page.includes('limpiarUltimoAnalisis()'), 'Debe conservar limpieza al iniciar nuevo análisis');
});

// ---------------------------------------------------------------------------
// PRUEBA 8: Persistencia del Trabajo Local y Recuperación tras Recarga
// ---------------------------------------------------------------------------
comprobar('Prueba 8: tracker-analisis.ts exporta métodos de persistencia y reconexión local', () => {
  const rutaTracker = resolve(raiz, 'lib/tracker-analisis.ts');
  assert.ok(existsSync(rutaTracker), 'No existe lib/tracker-analisis.ts');

  const codigoTracker = leer('lib/tracker-analisis.ts');
  assert.ok(codigoTracker.includes('guardarTrabajoActivoLocal'), 'Falta guardarTrabajoActivoLocal');
  assert.ok(codigoTracker.includes('obtenerTrabajoActivoLocal'), 'Falta obtenerTrabajoActivoLocal');
  assert.ok(codigoTracker.includes('limpiarTrabajoActivoLocal'), 'Falta limpiarTrabajoActivoLocal');
  assert.ok(codigoTracker.includes('EventSource'), 'Falta soporte de EventSource SSE');
  assert.ok(codigoTracker.includes('iniciarPollingFallback'), 'Falta fallback a polling si SSE se interrumpe');
  assert.ok(codigoTracker.includes('enviarNotificacionNavegador'), 'Falta soporte de notificaciones del navegador');
});

console.log(`\n=======================================================`);
console.log(`Resultados: ${pasadas} de 8 pruebas de experiencia de espera superadas.`);
console.log(`=======================================================\n`);
pruebas.forEach((p) => console.log(p));
