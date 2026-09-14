// ---------------------------------------------------------------------------
// Motor de Composición Editorial de la Infografía TeoDoc
// Principios inspirados en Carbon Design System:
// - Retícula estructurada con unidad base de 8 px
// - Escala tipográfica deliberada con jerarquía visual estricta
// - Composición continua en una sola lámina vertical 9:16 (1080×1920 px)
// - Densidad adaptativa según volumen real (Breve, Medio, Extenso)
// - Cero invención de contenidos y cero carrusel
// ---------------------------------------------------------------------------

export const CANVAS_W = 1080;
export const CANVAS_H = 1920;

// Unidad base de retícula (Carbon 8px grid)
export const GRID_BASE = 8;
export const g = (n: number) => n * GRID_BASE;

// Zonas seguras (Safe Areas para Instagram Stories, WhatsApp Status y redes)
// Nada crítico toca los bordes: margen funcional para controles de interfaz móvil
export const SAFE_TOP = 96;       // 12 * 8 = 96 px (~5% superior para stories)
export const SAFE_BOTTOM = 104;   // 13 * 8 = 104 px (~5.4% inferior para barra de interacción)
export const SAFE_LATERAL = 72;   // 9 * 8 = 72 px (~6.6% a cada lado)
export const ANCHO_UTIL = CANVAS_W - SAFE_LATERAL * 2; // 936 px
export const ALTO_UTIL = CANVAS_H - SAFE_TOP - SAFE_BOTTOM; // 1720 px

// Piso de legibilidad absoluto en px (canvas 1080 px).
// Ningún texto de la infografía puede caer por debajo de estos mínimos:
export const PISO_LEGIBILIDAD = {
  display: 48,
  subtitulo: 24,
  tituloModulo: 20,
  cuerpo: 16,
  numeral: 32,
  caption: 13,
} as const;

export type ArquetipoEditorial = 'breve' | 'medio' | 'extenso';

export type VersiculoInfografia = {
  cita: string;
  texto: string;
};

export type PuntoEditorial = {
  indice: number;
  numeral: string; // "01", "02", etc.
  titulo: string;
  detalle: string;
  versiculo?: string;
};

export type EntradaInfografia = {
  titulo: string;
  tema?: string;
  mensajeCentral: string;
  pasaje?: string;
  textoClave?: string;
  verdadPrincipal?: string;
  contextoBreve?: string;
  puntos: { titulo: string; detalle: string; versiculo?: string }[];
  conceptos: string[];
  conexiones?: { cita?: string; texto?: string }[];
  fraseRecordar?: string;
};

export type PlanEditorial = {
  arquetipo: ArquetipoEditorial;
  columnasPuntos: 1 | 2;
  puntos: PuntoEditorial[];
  ilustracionTamano: 'hero' | 'medio' | 'banner';
  escala: {
    display: number;
    subtitulo: number;
    biblia: number;
    tituloPunto: number;
    cuerpoPunto: number;
    numeral: number;
    caption: number;
  };
  alturasEstimadas: {
    header: number;
    hero: number;
    biblico: number;
    desarrollo: number;
    doctrina: number;
    cierre: number;
    total: number;
  };
};

// Resumen editorial respetuoso: corta por oraciones o comas sin truncar a mitad de palabra ni inventar
export function resumirEditorial(texto: string, maxChars: number): string {
  const t = String(texto || '').replace(/\s+/g, ' ').trim();
  if (!t || t.length <= maxChars) return t;

  const corte = t.slice(0, maxChars);
  // Buscar fin de oración dentro del 40% final del corte
  const minPos = Math.round(maxChars * 0.4);
  const finOracion = Math.max(
    corte.lastIndexOf('. '),
    corte.lastIndexOf('! '),
    corte.lastIndexOf('? ')
  );
  if (finOracion >= minPos) return corte.slice(0, finOracion + 1).trim();

  const puntoDirecto = Math.max(corte.lastIndexOf('.'), corte.lastIndexOf('!'), corte.lastIndexOf('?'));
  if (puntoDirecto >= minPos) return corte.slice(0, puntoDirecto + 1).trim();

  // Buscar coma o punto y coma
  const finFrase = Math.max(corte.lastIndexOf(', '), corte.lastIndexOf('; '));
  if (finFrase >= minPos) return corte.slice(0, finFrase).trim();

  // Si no hay puntuación, cortar en último espacio
  const ultimoEspacio = corte.lastIndexOf(' ');
  if (ultimoEspacio >= minPos) return corte.slice(0, ultimoEspacio).trim();

  return corte.trim();
}

/**
 * Clasifica el contenido disponible y planifica la composición editorial
 * adaptada para encajar perfectamente en el lienzo de 1080×1920 px.
 */
export function planificarComposicion(e: EntradaInfografia): PlanEditorial {
  const numPuntos = Math.min(e.puntos.length, 10);

  // Arquetipo según riqueza de puntos reales:
  // Breve: 1 a 3 puntos -> Gran presencia visual, héroe amplio, ilustración hero
  // Medio: 4 a 5 puntos -> Grid de 2 columnas o módulos escalonados, ilustración media
  // Extenso: 6 a 10 puntos -> Grid de 2 columnas compacto, números 01-10, ilustración banner
  let arquetipo: ArquetipoEditorial = 'medio';
  if (numPuntos <= 3) {
    arquetipo = 'breve';
  } else if (numPuntos >= 6) {
    arquetipo = 'extenso';
  }

  // Configuración de escalas tipográficas deliberadas (Carbon type scale)
  const escalas = {
    breve: {
      display: 64,
      subtitulo: 28,
      biblia: 26,
      tituloPunto: 26,
      cuerpoPunto: 20,
      numeral: 52,
      caption: 16,
    },
    medio: {
      display: 58,
      subtitulo: 24,
      biblia: 24,
      tituloPunto: 22,
      cuerpoPunto: 18,
      numeral: 44,
      caption: 14,
    },
    extenso: {
      display: 52,
      subtitulo: 22,
      biblia: 22,
      tituloPunto: 20,
      cuerpoPunto: 16, // respeta PISO_LEGIBILIDAD.cuerpo
      numeral: 38,    // respeta PISO_LEGIBILIDAD.numeral
      caption: 13,
    },
  };

  const escala = escalas[arquetipo];
  const columnasPuntos: 1 | 2 = arquetipo === 'breve' ? 1 : 2;
  const ilustracionTamano: 'hero' | 'medio' | 'banner' =
    arquetipo === 'breve' ? 'hero' : arquetipo === 'medio' ? 'medio' : 'banner';

  // Preparar puntos con numeración editorial 01, 02, 03...
  const maxDetalle = arquetipo === 'breve' ? 220 : arquetipo === 'medio' ? 140 : 100;
  const puntos: PuntoEditorial[] = e.puntos.slice(0, numPuntos).map((p, i) => ({
    indice: i + 1,
    numeral: String(i + 1).padStart(2, '0'),
    titulo: resumirEditorial(p.titulo || '', 80),
    detalle: resumirEditorial(p.detalle || '', maxDetalle),
    versiculo: p.versiculo,
  }));

  // Estimación de alturas para balance visual de la lámina completa
  const altHeader = 88;
  const altHero = arquetipo === 'breve' ? 260 : arquetipo === 'medio' ? 240 : 210;
  const altBiblico = arquetipo === 'breve' ? 220 : arquetipo === 'medio' ? 180 : 160;
  const altCierre = 130;
  const altDoctrina = e.conceptos.length > 0 ? 80 : 0;
  const altDesarrollo = ALTO_UTIL - altHeader - altHero - altBiblico - altDoctrina - altCierre;

  return {
    arquetipo,
    columnasPuntos,
    puntos,
    ilustracionTamano,
    escala,
    alturasEstimadas: {
      header: altHeader,
      hero: altHero,
      biblico: altBiblico,
      desarrollo: Math.max(300, altDesarrollo),
      doctrina: altDoctrina,
      cierre: altCierre,
      total: CANVAS_H,
    },
  };
}

/**
 * Métricas generales del canvas para consumo de componentes y pruebas.
 */
export function metricasCanvas() {
  return {
    ancho: CANVAS_W,
    alto: CANVAS_H,
    anchoUtil: ANCHO_UTIL,
    altoUtil: ALTO_UTIL,
    safeTop: SAFE_TOP,
    safeBottom: SAFE_BOTTOM,
    safeLateral: SAFE_LATERAL,
  };
}
