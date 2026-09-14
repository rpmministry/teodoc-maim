// Verificación del motor de composición de la infografía (canvas fijo 9:16,
// niveles de densidad, piso de legibilidad, safe zones y modos automáticos).
// Se ejecuta con: node scripts/verificar-infografia.mts
import assert from 'node:assert/strict';
import {
  CANVAS_W,
  CANVAS_H,
  PRESETS,
  PISO_LEGIBILIDAD,
  SAFE_ZONE_STORY_TOP,
  SAFE_ZONE_STORY_BOTTOM,
  SAFE_ZONE_FEED,
  presetRespetaPiso,
  construirUnidades,
  indiceContenido,
  elegirNivelPorIndice,
  estimarAltoPagina,
  planificarInfografia,
  metricasCanvas,
  type EntradaInfografia,
  type NivelDensidad,
} from '../lib/infografia-layout.ts';

let pasadas = 0;
const pruebas: string[] = [];
const comprobar = (nombre: string, fn: () => void) => {
  fn();
  pasadas += 1;
  pruebas.push(`  ✓ ${nombre}`);
};

const m = metricasCanvas();
const plan = (e: EntradaInfografia) =>
  planificarInfografia(construirUnidades(e), {
    anchoContenido: m.anchoEsen,
    spineW: m.spineW,
    altoDisponible: m.altoBanda - 24,
    titulo: e.titulo || '',
    maxPaginasCarrusel: 3,
  });

const palabras = (n: number, tam = 6) => Array.from({ length: n }, (_, i) => `concepto${i}${'x'.repeat(tam)}`);
const grandes = (n: number, tam: number) =>
  Array.from({ length: n }, (_, i) => ({ titulo: `Enseñanza ${i + 1}`, descripcion: 'y'.repeat(tam) }));
const conexiones = (n: number, tam: number) =>
  Array.from({ length: n }, (_, i) => ({ cita: `Romanos 8:${i + 1}`, texto: 'z'.repeat(tam) }));

// ---- Canvas fijo 9:16 (nunca variable) ----
comprobar('El canvas es SIEMPRE 1080×1920 (9:16 exacto)', () => {
  assert.equal(CANVAS_W, 1080);
  assert.equal(CANVAS_H, 1920);
  assert.equal(CANVAS_W / CANVAS_H, 9 / 16);
});

// ---- Zonas seguras ampliadas y configurables ----
comprobar('Safe zones de Stories, feed y laterales definidas', () => {
  assert.ok(SAFE_ZONE_STORY_TOP >= 0.15 && SAFE_ZONE_STORY_TOP <= 0.2, 'top fuera de rango');
  assert.ok(SAFE_ZONE_STORY_BOTTOM >= 0.2 && SAFE_ZONE_STORY_BOTTOM <= 0.3, 'bottom fuera de rango');
  assert.equal(SAFE_ZONE_FEED, 0.8);
  assert.ok(m.safeTop >= Math.round(CANVAS_H * 0.15), 'zona superior insuficiente');
  assert.ok(m.safeBottom >= Math.round(CANVAS_H * 0.2), 'zona inferior insuficiente');
  assert.ok(m.altoBanda === CANVAS_H - m.safeTop - m.safeBottom, 'banda inconsistente');
  assert.ok(m.safeLateral >= Math.round(CANVAS_W * 0.1) - 1, 'safe lateral fuera del 80% central');
});

// ---- Piso de legibilidad: ningún preset lo cruza ----
comprobar('Todos los presets respetan el piso de legibilidad', () => {
  (Object.keys(PRESETS) as unknown as string[]).forEach((k) => {
    const p = PRESETS[Number(k) as NivelDensidad];
    assert.ok(presetRespetaPiso(p), `preset ${k} cruza el piso`);
    assert.ok(p.cuerpo >= PISO_LEGIBILIDAD.cuerpo, `cuerpo ${p.cuerpo} < piso`);
    assert.ok(p.tituloTarjeta >= PISO_LEGIBILIDAD.titulo, `titulo ${p.tituloTarjeta} < piso`);
    assert.ok(p.numeral >= PISO_LEGIBILIDAD.numeral, `numeral ${p.numeral} < piso`);
    assert.ok(p.caption >= PISO_LEGIBILIDAD.caption, `caption ${p.caption} < piso`);
  });
});

comprobar('Los presets son completos y decrecientes en densidad', () => {
  assert.ok(PRESETS[1].cuerpo > PRESETS[2].cuerpo, 'L1 no es menos denso que L2');
  assert.ok(PRESETS[2].cuerpo > PRESETS[3].cuerpo, 'L2 no es menos denso que L3');
  assert.ok(PRESETS[3].cuerpo >= PRESETS[4].cuerpo, 'L3 no es menos denso que L4');
  assert.ok(PRESETS[1].gapTarjetas > PRESETS[4].gapTarjetas, 'espaciado no decrece');
  assert.equal(PRESETS[1].ilustracion, 'grande');
  assert.equal(PRESETS[4].ilustracion, 'ninguna');
});

// ---- Niveles según índice de contenido ----
comprobar('El nivel sube con el índice de contenido', () => {
  assert.equal(elegirNivelPorIndice(400), 1);
  assert.equal(elegirNivelPorIndice(1200), 2);
  assert.equal(elegirNivelPorIndice(2000), 3);
  assert.equal(elegirNivelPorIndice(5000), 4);
  const ligero = construirUnidades({ mensajeCentral: 'a'.repeat(200) });
  const denso = construirUnidades({ mensajeCentral: 'a'.repeat(200), grandes: grandes(10, 250) });
  assert.ok(indiceContenido(denso) > indiceContenido(ligero));
});

// ---- Casos de uso ----
comprobar('Contenido ligero → una sola página', () => {
  const r = plan({ titulo: 'Mensaje breve', mensajeCentral: 'a'.repeat(120), textoClave: 'b'.repeat(60), verdadPrincipal: 'c'.repeat(80), fraseRecordar: 'd'.repeat(60) });
  assert.equal(r.modo, 'unico');
  assert.equal(r.paginas.length, 1);
});

comprobar('Contenido denso → carrusel o resumen (nunca recorta el piso)', () => {
  const r = plan({
    titulo: 'Enseñanza profunda sobre la gracia y la fe',
    mensajeCentral: 'a'.repeat(400),
    pasaje: 'Romanos 8:28',
    textoClave: 'b'.repeat(400),
    verdadPrincipal: 'c'.repeat(400),
    contextoBreve: 'e'.repeat(500),
    grandes: grandes(10, 320),
    palabras: palabras(8),
    conexiones: conexiones(6, 200),
    fraseRecordar: 'd'.repeat(300),
  });
  assert.ok(r.modo === 'carrusel' || r.modo === 'resumen', `modo inesperado: ${r.modo}`);
  if (r.modo === 'carrusel') {
    assert.ok(r.paginas.length >= 2, 'carrusel sin páginas múltiples');
    assert.ok(r.paginas.length <= 3, 'carrusel excede el máximo');
  }
  assert.ok(presetRespetaPiso(PRESETS[r.nivel]), 'el nivel elegido cruza el piso');
});

comprobar('Ninguna página queda vacía', () => {
  for (const e of [
    { mensajeCentral: 'a'.repeat(120) },
    { mensajeCentral: 'a'.repeat(600), grandes: grandes(8, 300), conexiones: conexiones(5, 200) },
    { mensajeCentral: 'a'.repeat(1200), grandes: grandes(10, 500), conexiones: conexiones(6, 400), palabra: [] } as unknown as EntradaInfografia,
  ]) {
    const r = plan(e);
    assert.ok(r.paginas.every((p) => p.length > 0), 'página vacía');
  }
});

comprobar('Modo resumen conserva lo esencial', () => {
  const entrada: EntradaInfografia = {
    mensajeCentral: 'a'.repeat(3000),
    pasaje: 'Juan 3:16',
    textoClave: 'b'.repeat(3000),
    verdadPrincipal: 'c'.repeat(3000),
    contextoBreve: 'e'.repeat(3000),
    grandes: grandes(10, 800),
    palabras: palabras(8, 40),
    conexiones: conexiones(6, 800),
    fraseRecordar: 'd'.repeat(1000),
  };
  const r = plan(entrada);
  assert.equal(r.modo, 'resumen');
  const ids = r.paginas[0].map((u) => u.id);
  assert.ok(ids.includes('mensaje') && ids.includes('texto-clave') && ids.includes('frase'), 'faltan esenciales');
  assert.ok(!ids.includes('palabras') && !ids.includes('conexiones'), 'no recortó lo no esencial');
  assert.ok(presetRespetaPiso(PRESETS[r.nivel]));
});

comprobar('El estimador crece con más contenido', () => {
  const p = PRESETS[3];
  const chico = construirUnidades({ mensajeCentral: 'a'.repeat(100) });
  const grande = construirUnidades({ mensajeCentral: 'a'.repeat(100), grandes: grandes(8, 300) });
  const hChico = estimarAltoPagina(chico, p, m.anchoEsen, m.spineW, 300);
  const hGrande = estimarAltoPagina(grande, p, m.anchoEsen, m.spineW, 300);
  assert.ok(hGrande > hChico);
});

console.log('Verificación del motor de infografía (canvas fijo 9:16)');
console.log(pruebas.join('\n'));
console.log(`\n${pasadas} pruebas superadas.`);
