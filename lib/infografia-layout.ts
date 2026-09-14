// ---------------------------------------------------------------------------
// Motor de Composición Editorial de la Infografía TeoDoc
// Principios inspirados en Carbon Design System:
// - Retícula estructurada con unidad base de 8 px
// - Escala tipográfica deliberada con jerarquía visual estricta
// - Composición continua en una sola lámina vertical 9:16 (1080×1920 px)
// - Densidad adaptativa según volumen real (Breve, Medio, Extenso)
// - Distribución armónica sin vacíos ni elementos apiñados
// ---------------------------------------------------------------------------

export const CANVAS_W = 1080;
export const CANVAS_H = 1920;

// Unidad base de retícula (Carbon 8px grid)
export const GRID_BASE = 8;
export const g = (n: number) => n * GRID_BASE;

// Zonas seguras optimizadas: márgenes limpios y calibrados para dar máxima
// presencia y amplitud al contenido editorial sin invadir controles de redes
export const SAFE_TOP = 64;       // 8 * 8 = 64 px
export const SAFE_BOTTOM = 64;    // 8 * 8 = 64 px
export const SAFE_LATERAL = 48;   // 6 * 8 = 48 px
export const ANCHO_UTIL = CANVAS_W - SAFE_LATERAL * 2; // 984 px
export const ALTO_UTIL = CANVAS_H - SAFE_TOP - SAFE_BOTTOM; // 1792 px

// Piso de legibilidad absoluto en px (canvas 1080 px).
export const PISO_LEGIBILIDAD = {
  display: 48,
  subtitulo: 22,
  tituloModulo: 20,
  cuerpo: 16,
  numeral: 32,
  caption: 12,
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
  otrosVersiculos?: { cita: string; texto: string }[];
  doctrinas?: { sobre: string; ensenanza: string }[];
  conceptos: string[];
  conexiones?: { cita?: string; texto?: string }[];
  fraseRecordar?: string;
};

export type PlanEditorial = {
  arquetipo: ArquetipoEditorial;
  columnasPuntos: 1 | 2;
  puntos: PuntoEditorial[];
  versiculosApoyo: { cita: string; texto: string }[];
  doctrinas: { sobre: string; ensenanza: string }[];
  mostrarVersiculosApoyo: boolean;
  mostrarDoctrina: boolean;
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
  const minPos = Math.round(maxChars * 0.4);
  const finOracion = Math.max(
    corte.lastIndexOf('. '),
    corte.lastIndexOf('! '),
    corte.lastIndexOf('? ')
  );
  if (finOracion >= minPos) return corte.slice(0, finOracion + 1).trim();

  const puntoDirecto = Math.max(corte.lastIndexOf('.'), corte.lastIndexOf('!'), corte.lastIndexOf('?'));
  if (puntoDirecto >= minPos) return corte.slice(0, puntoDirecto + 1).trim();

  const finFrase = Math.max(corte.lastIndexOf(', '), corte.lastIndexOf('; '));
  if (finFrase >= minPos) return corte.slice(0, finFrase).trim();

  const ultimoEspacio = corte.lastIndexOf(' ');
  if (ultimoEspacio >= minPos) return corte.slice(0, ultimoEspacio).trim();

  return corte.trim();
}

/**
 * Planifica la composición editorial con proporciones armónicas y fluidas
 * en el lienzo de 1080×1920 px, evitando tanto vacíos como aglomeraciones.
 */
export function planificarComposicion(e: EntradaInfografia): PlanEditorial {
  const numPuntos = Math.min(e.puntos.length, 10);

  let arquetipo: ArquetipoEditorial = 'medio';
  if (numPuntos <= 3) {
    arquetipo = 'breve';
  } else if (numPuntos >= 6) {
    arquetipo = 'extenso';
  }

  // Escalas tipográficas adaptativas basadas en Carbon Design System
  const escalas = {
    breve: {
      display: 62,
      subtitulo: 24,
      biblia: 24,
      tituloPunto: 24,
      cuerpoPunto: 18,
      numeral: 48,
      caption: 14,
    },
    medio: {
      display: 54,
      subtitulo: 22,
      biblia: 22,
      tituloPunto: 21,
      cuerpoPunto: 17,
      numeral: 40,
      caption: 13,
    },
    extenso: {
      display: 48, // Respeta PISO_LEGIBILIDAD.display
      subtitulo: 22,
      biblia: 20,
      tituloPunto: 20, // Respeta PISO_LEGIBILIDAD.tituloModulo
      cuerpoPunto: 16, // Respeta PISO_LEGIBILIDAD.cuerpo
      numeral: 34,    // Respeta PISO_LEGIBILIDAD.numeral
      caption: 12,
    },
  };

  const escala = escalas[arquetipo];
  const columnasPuntos: 1 | 2 = arquetipo === 'breve' ? 1 : 2;
  const ilustracionTamano: 'hero' | 'medio' | 'banner' =
    arquetipo === 'breve' ? 'hero' : arquetipo === 'medio' ? 'medio' : 'banner';

  const versiculosApoyo = (e.otrosVersiculos || [])
    .filter((v) => v.cita && v.cita !== e.pasaje)
    .slice(0, 2)
    .map((v) => ({
      cita: v.cita,
      texto: resumirEditorial(v.texto, 150),
    }));

  const doctrinas = (e.doctrinas || []).slice(0, 1);
  const mostrarVersiculosApoyo = versiculosApoyo.length > 0;
  const mostrarDoctrina = doctrinas.length > 0;

  const maxDetalle = arquetipo === 'breve' ? 200 : arquetipo === 'medio' ? 140 : 100;
  const puntos: PuntoEditorial[] = e.puntos.slice(0, numPuntos).map((p, i) => ({
    indice: i + 1,
    numeral: String(i + 1).padStart(2, '0'),
    titulo: resumirEditorial(p.titulo || '', 80),
    detalle: resumirEditorial(p.detalle || '', maxDetalle),
    versiculo: p.versiculo,
  }));

  const altHeader = 80;
  const altHero = arquetipo === 'breve' ? 240 : arquetipo === 'medio' ? 220 : 200;
  const altBiblico = arquetipo === 'breve' ? 180 : arquetipo === 'medio' ? 160 : 140;
  const altCierre = 120;
  const altDoctrina = mostrarDoctrina ? 80 : 0;
  const altDesarrollo = ALTO_UTIL - altHeader - altHero - altBiblico - altDoctrina - altCierre;

  return {
    arquetipo,
    columnasPuntos,
    puntos,
    versiculosApoyo,
    doctrinas,
    mostrarVersiculosApoyo,
    mostrarDoctrina,
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
