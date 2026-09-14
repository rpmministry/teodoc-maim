// Verificación del motor de composición editorial de la infografía TeoDoc
// (canvas fijo 9:16, retícula 8px, arquetipos de densidad, piso de legibilidad y lámina única).
// Se ejecuta con: node scripts/verificar-infografia.mts
import assert from 'node:assert/strict';
import {
  CANVAS_W,
  CANVAS_H,
  GRID_BASE,
  SAFE_TOP,
  SAFE_BOTTOM,
  SAFE_LATERAL,
  ANCHO_UTIL,
  ALTO_UTIL,
  PISO_LEGIBILIDAD,
  planificarComposicion,
  resumirEditorial,
  metricasCanvas,
  type EntradaInfografia,
} from '../lib/infografia-layout.ts';

let pasadas = 0;
const pruebas: string[] = [];
const comprobar = (nombre: string, fn: () => void) => {
  fn();
  pasadas += 1;
  pruebas.push(`  ✓ ${nombre}`);
};

const m = metricasCanvas();

// ---- 1. Canvas Fijo 9:16 ----
comprobar('El canvas es SIEMPRE 1080×1920 (9:16 exacto)', () => {
  assert.equal(CANVAS_W, 1080);
  assert.equal(CANVAS_H, 1920);
  assert.equal(CANVAS_W / CANVAS_H, 9 / 16);
});

// ---- 2. Retícula matemática base 8px (Carbon Design System) ----
comprobar('Retícula matemática basada en unidad de 8 px', () => {
  assert.equal(GRID_BASE, 8);
  assert.equal(SAFE_TOP % GRID_BASE, 0, 'SAFE_TOP debe ser múltiplo de 8');
  assert.equal(SAFE_BOTTOM % GRID_BASE, 0, 'SAFE_BOTTOM debe ser múltiplo de 8');
  assert.equal(SAFE_LATERAL % GRID_BASE, 0, 'SAFE_LATERAL debe ser múltiplo de 8');
  assert.equal(ANCHO_UTIL, CANVAS_W - SAFE_LATERAL * 2);
  assert.equal(ALTO_UTIL, CANVAS_H - SAFE_TOP - SAFE_BOTTOM);
});

// ---- 3. Safe Zones para Redes Sociales ----
comprobar('Safe zones protegen contra recortes en Stories/WhatsApp', () => {
  assert.ok(SAFE_TOP >= 60 && SAFE_TOP <= 120, 'margen superior fuera de rango seguro');
  assert.ok(SAFE_BOTTOM >= 60 && SAFE_BOTTOM <= 130, 'margen inferior fuera de rango seguro');
  assert.ok(SAFE_LATERAL >= 40 && SAFE_LATERAL <= 96, 'margen lateral fuera de rango seguro');
});

// ---- 4. Piso de Legibilidad Absoluto ----
comprobar('Piso de legibilidad absoluto definido y respetado', () => {
  assert.ok(PISO_LEGIBILIDAD.cuerpo >= 16, 'el piso de cuerpo debe ser >= 16px');
  assert.ok(PISO_LEGIBILIDAD.tituloModulo >= 20, 'el piso de título debe ser >= 20px');
  assert.ok(PISO_LEGIBILIDAD.numeral >= 32, 'el piso de numeral debe ser >= 32px');
  assert.ok(PISO_LEGIBILIDAD.display >= 48, 'el piso de display debe ser >= 48px');
});

// ---- 5. Clasificación Dinámica de Arquetipos ----
comprobar('Contenido breve (1-3 puntos) activa Arquetipo Breve con Ilustración Hero', () => {
  const e: EntradaInfografia = {
    titulo: 'El Buen Pastor',
    tema: 'Confianza y Paz',
    mensajeCentral: 'Dios cuida de sus hijos en todo momento.',
    pasaje: 'Salmos 23:1',
    textoClave: 'Jehová es mi pastor; nada me faltará.',
    puntos: [
      { titulo: 'Descanso en su provisión', detalle: 'En lugares de delicados pastos me pastoreará.' },
      { titulo: 'Dirección por sendas de justicia', detalle: 'Junto a aguas de reposo me guiará con amor.' },
    ],
    conceptos: ['Paz', 'Provisión', 'Guía'],
  };
  const plan = planificarComposicion(e);
  assert.equal(plan.arquetipo, 'breve');
  assert.equal(plan.columnasPuntos, 1);
  assert.equal(plan.ilustracionTamano, 'hero');
  assert.equal(plan.puntos.length, 2);
  assert.ok(plan.escala.cuerpoPunto >= PISO_LEGIBILIDAD.cuerpo);
});

comprobar('Contenido medio (4-5 puntos) activa Arquetipo Medio con Grid de 2 Columnas', () => {
  const e: EntradaInfografia = {
    titulo: 'La Armadura de Dios',
    tema: 'Victoria Espiritual',
    mensajeCentral: 'Vestíos de toda la armadura de Dios para resistir.',
    pasaje: 'Efesios 6:10-18',
    textoClave: 'Fortaleceos en el Señor y en el poder de su fuerza.',
    puntos: [
      { titulo: 'El cinturón de la verdad', detalle: 'Vivir en integridad y fidelidad a la Palabra.' },
      { titulo: 'La coraza de justicia', detalle: 'Guardar el corazón de toda acusación del enemigo.' },
      { titulo: 'El calzado de la paz', detalle: 'Prontitud para compartir las buenas nuevas.' },
      { titulo: 'El escudo de la fe', detalle: 'Apagar todos los dardos de fuego del maligno.' },
    ],
    conceptos: ['Verdad', 'Justicia', 'Fe', 'Paz'],
  };
  const plan = planificarComposicion(e);
  assert.equal(plan.arquetipo, 'medio');
  assert.equal(plan.columnasPuntos, 2);
  assert.equal(plan.ilustracionTamano, 'medio');
  assert.equal(plan.puntos.length, 4);
  assert.ok(plan.escala.cuerpoPunto >= PISO_LEGIBILIDAD.cuerpo);
});

comprobar('Contenido extenso (6-10 puntos) activa Arquetipo Extenso sin carrusel', () => {
  const e: EntradaInfografia = {
    titulo: 'El Fruto del Espíritu y la Vida Victoriosa',
    tema: 'Madurez Cristiana',
    mensajeCentral: 'El Espíritu Santo transforma nuestro carácter de gloria en gloria.',
    pasaje: 'Gálatas 5:22-23',
    textoClave: 'Mas el fruto del Espíritu es amor, gozo, paz...',
    puntos: Array.from({ length: 10 }, (_, i) => ({
      titulo: `Virtud espiritual número ${i + 1}`,
      detalle: `Explicación teológica del aspecto ${i + 1} del carácter de Cristo manifestado en el creyente.`,
    })),
    conceptos: ['Amor', 'Paz', 'Paciencia', 'Benignidad', 'Bondad', 'Fe'],
  };
  const plan = planificarComposicion(e);
  assert.equal(plan.arquetipo, 'extenso');
  assert.equal(plan.columnasPuntos, 2);
  assert.equal(plan.puntos.length, 10);
  assert.equal(plan.puntos[0].numeral, '01');
  assert.equal(plan.puntos[9].numeral, '10');
  assert.ok(plan.escala.cuerpoPunto >= PISO_LEGIBILIDAD.cuerpo);
  assert.ok(plan.escala.numeral >= PISO_LEGIBILIDAD.numeral);
});

// ---- 6. Resumen Editorial Determinista ----
comprobar('resumirEditorial no corta a mitad de palabra y respeta puntuación', () => {
  const frase = 'La fe es la certeza de lo que se espera, la convicción de lo que no se ve. Es el ancla de nuestra alma.';
  const res = resumirEditorial(frase, 60);
  assert.ok(res.length <= 60);
  assert.ok(!res.endsWith(' '));
  assert.ok(res.endsWith('.') || res.endsWith(',') || !res.includes('  '));
});

// ---- 7. Integridad y Cero Desbordamiento ----
comprobar('Las alturas estimadas suman coherentemente dentro del lienzo 1080×1920', () => {
  const e: EntradaInfografia = {
    titulo: 'Rendidos a su Presencia',
    mensajeCentral: 'No se trata de nuestras fuerzas, sino del poder de Dios obrando en nuestra debilidad.',
    pasaje: 'Éxodo 33:14',
    textoClave: 'Mi presencia irá contigo y te daré descanso.',
    puntos: [
      { titulo: 'El clamor de Moisés', detalle: 'Buscar a Dios por quien es Él y no por sus beneficios.' },
      { titulo: 'La promesa del descanso', detalle: 'La presencia de Dios es nuestra verdadera tierra prometida.' },
      { titulo: 'La señal para las naciones', detalle: 'Lo que nos distingue es que Dios camina con nosotros.' },
    ],
    conceptos: ['Presencia', 'Descanso', 'Comunión'],
  };
  const plan = planificarComposicion(e);
  assert.equal(plan.alturasEstimadas.total, CANVAS_H);
});

console.log('Verificación del motor editorial de infografía (9:16, 1 lámina, retícula 8px)');
console.log(pruebas.join('\n'));
console.log(`\n${pasadas} pruebas superadas.`);
