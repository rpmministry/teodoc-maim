// ---------------------------------------------------------------------------
// Motor de composición de la infografía (lógica PURA, sin dependencias ni DOM).
//
// Objetivo: el canvas de exportación es SIEMPRE 9:16 fijo (1080×1920). El alto
// NUNCA depende del texto. Para que el contenido quepa se usan presets de
// densidad (completos, no un escalado proporcional) y, si ni el preset más
// denso respeta el piso de legibilidad, se activa modo carrusel o resumen.
// ---------------------------------------------------------------------------

export const CANVAS_W = 1080
export const CANVAS_H = 1920

// Zonas reservadas para las superposiciones típicas de cada red/uso.
// Son constantes configurables (fracción del alto/ancho del canvas).
export const SAFE_ZONE_STORY_TOP = 0.15 // barra de progreso, perfil, hora
export const SAFE_ZONE_STORY_BOTTOM = 0.2 // caja de respuesta, reacciones
export const SAFE_ZONE_FEED = 0.8 // área central que sobrevive al recorte a cuadrado
export const SAFE_ZONE_SIDES = Math.max(0.045, (1 - SAFE_ZONE_FEED) / 2) // = 0.1

// Piso ABSOLUTO de legibilidad (px sobre canvas de 1080 de ancho). Nunca se
// renderiza texto por debajo de estos valores, en ningún nivel de densidad.
export const PISO_LEGIBILIDAD = {
  cuerpo: 30,
  titulo: 38, // títulos de sección de las tarjetas
  numeral: 38, // números del timeline y de tarjeta
  caption: 23, // etiquetas y captions secundarios
} as const

export type NivelDensidad = 1 | 2 | 3 | 4

export type Preset = {
  nivel: NivelDensidad
  nombre: string
  display: number // título principal
  tituloTarjeta: number
  numeral: number
  cuerpo: number
  caption: number
  lineHeight: number
  padTarjeta: number
  gapTarjetas: number
  icono: number
  ilustracion: 'grande' | 'mediana' | 'pequena' | 'ninguna'
}

// Cada nivel es un preset COMPLETO (no un factor de escala).
export const PRESETS: Record<NivelDensidad, Preset> = {
  1: { nivel: 1, nombre: 'Ligero', display: 82, tituloTarjeta: 52, numeral: 58, cuerpo: 40, caption: 30, lineHeight: 1.5, padTarjeta: 40, gapTarjetas: 34, icono: 120, ilustracion: 'grande' },
  2: { nivel: 2, nombre: 'Medio', display: 72, tituloTarjeta: 46, numeral: 50, cuerpo: 34, caption: 26, lineHeight: 1.4, padTarjeta: 32, gapTarjetas: 26, icono: 96, ilustracion: 'mediana' },
  3: { nivel: 3, nombre: 'Denso', display: 64, tituloTarjeta: 40, numeral: 42, cuerpo: 31, caption: 24, lineHeight: 1.28, padTarjeta: 24, gapTarjetas: 18, icono: 72, ilustracion: 'pequena' },
  4: { nivel: 4, nombre: 'Muy denso', display: 58, tituloTarjeta: 38, numeral: 38, cuerpo: 30, caption: 23, lineHeight: 1.2, padTarjeta: 18, gapTarjetas: 12, icono: 48, ilustracion: 'ninguna' },
}

export function presetRespetaPiso(p: Preset): boolean {
  return p.cuerpo >= PISO_LEGIBILIDAD.cuerpo
    && p.tituloTarjeta >= PISO_LEGIBILIDAD.titulo
    && p.numeral >= PISO_LEGIBILIDAD.numeral
    && p.caption >= PISO_LEGIBILIDAD.caption
}

export type TipoUnidad = 'texto' | 'lista' | 'citas' | 'chips'
export type PesoVisual = 'ligero' | 'medio' | 'pesado'

export type UnidadContenido = {
  id: string
  etiqueta: string
  tipo: TipoUnidad
  chars: number
  items: number
  esencial: boolean
  peso: PesoVisual
  semilla: string
}

export function pesar(masa: number): PesoVisual {
  return masa < 260 ? 'ligero' : masa < 560 ? 'medio' : 'pesado'
}

export function masaUnidad(tipo: TipoUnidad, chars: number, items: number): number {
  switch (tipo) {
    case 'texto':
      return chars
    case 'lista':
      return chars + items * 46
    case 'citas':
      return chars + items * 34
    case 'chips':
      return items * 22
  }
}

// Entrada estructural (compatible con InfografiaData del componente).
export type EntradaInfografia = {
  titulo?: string
  mensajeCentral?: string
  pasaje?: string
  textoClave?: string
  verdadPrincipal?: string
  contextoBreve?: string
  grandes?: { titulo?: string; descripcion?: string }[]
  palabras?: string[]
  conexiones?: { cita?: string; texto?: string }[]
  fraseRecordar?: string
}

function unidadTexto(id: string, etiqueta: string, texto: string, esencial: boolean, forzarPesado = false): UnidadContenido {
  const chars = (texto || '').length
  const masa = masaUnidad('texto', chars, 0)
  return { id, etiqueta, tipo: 'texto', chars, items: 0, esencial, peso: forzarPesado ? 'pesado' : pesar(masa), semilla: texto }
}

export function construirUnidades(e: EntradaInfografia): UnidadContenido[] {
  const u: UnidadContenido[] = []
  if (e.mensajeCentral) u.push(unidadTexto('mensaje', 'Mensaje central', e.mensajeCentral, true, true))
  const textoClave = [e.pasaje, e.textoClave].filter(Boolean).join(' ')
  if (textoClave) {
    u.push({ id: 'texto-clave', etiqueta: 'Texto bíblico clave', tipo: 'citas', chars: textoClave.length, items: 1, esencial: true, peso: pesar(masaUnidad('citas', textoClave.length, 1)), semilla: textoClave })
  }
  if (e.verdadPrincipal) u.push(unidadTexto('verdad', 'Verdad principal', e.verdadPrincipal, true))
  if (e.contextoBreve && e.contextoBreve !== e.mensajeCentral) u.push(unidadTexto('contexto', 'Contexto', e.contextoBreve, false))
  const grandes = (e.grandes || []).filter((g) => g?.titulo || g?.descripcion)
  if (grandes.length) {
    const chars = grandes.reduce((a, g) => a + (g.titulo || '').length + (g.descripcion || '').length, 0)
    u.push({ id: 'grandes', etiqueta: 'Grandes enseñanzas', tipo: 'lista', chars, items: grandes.length, esencial: true, peso: 'pesado', semilla: grandes.map((g) => `${g.titulo} ${g.descripcion}`).join(' ') })
  }
  const palabras = e.palabras || []
  if (palabras.length) {
    u.push({ id: 'palabras', etiqueta: 'Palabras clave', tipo: 'chips', chars: 0, items: palabras.length, esencial: false, peso: pesar(masaUnidad('chips', 0, palabras.length)), semilla: palabras.join(' ') })
  }
  const conexiones = (e.conexiones || []).filter((c) => c?.cita)
  if (conexiones.length) {
    const chars = conexiones.reduce((a, c) => a + (c.cita || '').length + (c.texto || '').length, 0)
    u.push({ id: 'conexiones', etiqueta: 'Conexiones bíblicas', tipo: 'lista', chars, items: conexiones.length, esencial: false, peso: pesar(masaUnidad('lista', chars, conexiones.length)), semilla: conexiones.map((c) => `${c.cita} ${c.texto}`).join(' ') })
  }
  if (e.fraseRecordar) u.push(unidadTexto('frase', 'Frase para recordar', e.fraseRecordar, true))
  return u
}

// Índice de contenido total: caracteres + ítems + número de bloques.
export function indiceContenido(unidades: UnidadContenido[]): number {
  const chars = unidades.reduce((a, x) => a + x.chars, 0)
  const items = unidades.reduce((a, x) => a + x.items, 0)
  return chars + items * 40 + unidades.length * 60
}

export function elegirNivelPorIndice(indice: number): NivelDensidad {
  if (indice < 900) return 1
  if (indice < 1700) return 2
  if (indice < 2600) return 3
  return 4
}

// ---------------------------------------------------------------------------
// Estimación determinista de alturas (sin DOM). Conservadora a propósito.
// ---------------------------------------------------------------------------
const ANCHO_GLIFO = 0.52 // ancho medio de glifo relativo al tamaño de fuente

export function anchoTarjeta(_peso: PesoVisual, anchoContenido: number, spineW: number): number {
  // Columna única con riel lateral: se maximiza el ancho de lectura para que
  // el piso tipográfico quepa sin forzar más densidad de la necesaria.
  return Math.max(320, anchoContenido - spineW)
}

function numLineas(chars: number, font: number, ancho: number): number {
  const porLinea = Math.max(6, Math.floor(ancho / (font * ANCHO_GLIFO)))
  return Math.max(1, Math.ceil(chars / porLinea))
}

export function estimarAltoCabecera(titulo: string, p: Preset, anchoEsencial: number): number {
  const lineas = numLineas((titulo || 'Análisis del mensaje').length, p.display, anchoEsencial)
  const filaLogo = p.caption * 3.2
  const chips = p.caption * 3
  const margenes = p.caption * 2.4
  return Math.round(lineas * p.display * 1.12 + filaLogo + chips + margenes)
}

export function estimarAltoUnidad(u: UnidadContenido, p: Preset, anchoContenido: number, spineW: number): number {
  const ancho = anchoTarjeta(u.peso, anchoContenido, spineW)
  const interior = Math.max(160, ancho - 2 * p.padTarjeta)
  const header = p.caption * 2.8
  const base = header + 2 * p.padTarjeta + p.gapTarjetas
  if (u.tipo === 'texto') {
    const l = numLineas(u.chars, p.cuerpo, interior)
    return Math.round(base + l * p.cuerpo * p.lineHeight)
  }
  if (u.tipo === 'chips') {
    const filas = Math.max(1, Math.ceil(u.items / 3))
    return Math.round(base + filas * p.caption * 2.2)
  }
  if (u.tipo === 'citas') {
    const l = numLineas(u.chars, p.caption, interior)
    return Math.round(base + l * p.caption * p.lineHeight + p.caption * 1.2 * u.items)
  }
  // lista (grandes enseñanzas / conexiones)
  const lineasTitulo = numLineas(Math.max(1, Math.round(u.chars / Math.max(1, u.items) * 0.5)), p.cuerpo, interior - p.caption * 3)
  const lineasDesc = numLineas(Math.max(1, Math.round(u.chars / Math.max(1, u.items) * 0.5)), p.caption, interior - p.caption * 3)
  const altoItem = lineasTitulo * p.cuerpo * 1.25 + lineasDesc * p.caption * 1.45 + p.caption * 1.3
  return Math.round(base + u.items * altoItem)
}

export function estimarAltoPagina(unidades: UnidadContenido[], p: Preset, anchoContenido: number, spineW: number, altoCabecera: number): number {
  return Math.round(altoCabecera + unidades.reduce((a, u) => a + estimarAltoUnidad(u, p, anchoContenido, spineW), 0))
}

// ---------------------------------------------------------------------------
// Empaquetado en páginas (carrusel) y planificación automática.
// ---------------------------------------------------------------------------
export function empaquetarEnPaginas(unidades: UnidadContenido[], p: Preset, anchoContenido: number, spineW: number, altoCabecera: number, altoDisponible: number): UnidadContenido[][] {
  const paginas: UnidadContenido[][] = []
  let actual: UnidadContenido[] = []
  let alto = altoCabecera
  for (const u of unidades) {
    const h = estimarAltoUnidad(u, p, anchoContenido, spineW)
    if (actual.length && alto + h > altoDisponible) {
      paginas.push(actual)
      actual = []
      alto = altoCabecera
    }
    actual.push(u)
    alto += h
  }
  if (actual.length) paginas.push(actual)
  return paginas.length ? paginas : [[]]
}

// Recorte inteligente para modo resumen: conserva lo esencial y limita las
// listas a sus puntos más relevantes. El detalle completo queda en el PDF.
export function recortarParaResumen(unidades: UnidadContenido[]): UnidadContenido[] {
  const esenciales = unidades.filter((u) => u.esencial)
  return esenciales.map((u) => (u.tipo === 'lista' ? { ...u, items: Math.min(u.items, 3), chars: Math.min(u.chars, 320), semilla: u.semilla.slice(0, 320) } : u))
}

export type PlanInfografia = {
  modo: 'unico' | 'carrusel' | 'resumen'
  nivel: NivelDensidad
  indice: number
  paginas: UnidadContenido[][]
}

export type OpcionesPlan = {
  anchoContenido: number
  spineW: number
  altoDisponible: number
  titulo: string
  extraCabecera?: number
  maxPaginasCarrusel?: number
}

export function planificarInfografia(unidades: UnidadContenido[], opciones: OpcionesPlan): PlanInfografia {
  const { anchoContenido, spineW, altoDisponible, titulo } = opciones
  const extra = opciones.extraCabecera ?? 0
  const maxPaginas = opciones.maxPaginasCarrusel ?? 3
  const indice = indiceContenido(unidades)

  // Altura de cabecera estimada con el preset correspondiente (+ extras como
  // la barra de progreso), para que entre en el presupuesto del canvas fijo.
  const altoCab = (p: Preset) => extra + estimarAltoCabecera(titulo, p, anchoContenido)

  // Escalada de densidad: se parte del nivel por índice y se sube hasta que
  // quepa en una sola página (sin cruzar nunca el piso de legibilidad).
  let nivel = elegirNivelPorIndice(indice)
  while (nivel < 4 && estimarAltoPagina(unidades, PRESETS[nivel], anchoContenido, spineW, altoCab(PRESETS[nivel])) > altoDisponible) {
    nivel = (nivel + 1) as NivelDensidad
  }

  const preset = PRESETS[nivel]
  const cab = altoCab(preset)
  if (estimarAltoPagina(unidades, preset, anchoContenido, spineW, cab) <= altoDisponible) {
    return { modo: 'unico', nivel, indice, paginas: [unidades] }
  }

  // Ni el Nivel 4 (con el piso respetado) logra una sola página.
  const cab4 = altoCab(PRESETS[4])
  const paginas = empaquetarEnPaginas(unidades, PRESETS[4], anchoContenido, spineW, cab4, altoDisponible)
  if (paginas.length <= maxPaginas) {
    return { modo: 'carrusel', nivel: 4, indice, paginas }
  }

  // Demasiadas páginas: modo resumen (recorta lo menos esencial, nunca el piso).
  let resumen = recortarParaResumen(unidades)
  if (estimarAltoPagina(resumen, PRESETS[4], anchoContenido, spineW, cab4) > altoDisponible) {
    resumen = resumen
      .filter((u) => u.id === 'mensaje' || u.id === 'texto-clave' || u.id === 'frase')
      .map((u) => (u.tipo === 'lista' ? { ...u, items: Math.min(u.items, 1), chars: Math.min(u.chars, 200) } : u))
  }
  return { modo: 'resumen', nivel: 4, indice, paginas: [resumen] }
}

// ---------------------------------------------------------------------------
// Constantes de composición derivadas del canvas fijo.
// ---------------------------------------------------------------------------
export function metricasCanvas() {
  const anchoEsen = Math.round(CANVAS_W * (1 - 2 * SAFE_ZONE_SIDES))
  const top = Math.round(CANVAS_H * SAFE_ZONE_STORY_TOP)
  const bottom = Math.round(CANVAS_H * SAFE_ZONE_STORY_BOTTOM)
  const spineW = Math.round(CANVAS_W * 0.115)
  const footerH = Math.round(CANVAS_H * 0.0) // sin pie fuera de la zona segura
  return {
    anchoEsen,
    safeTop: top,
    safeBottom: bottom,
    safeLateral: Math.round(CANVAS_W * SAFE_ZONE_SIDES),
    altoBanda: CANVAS_H - top - bottom,
    spineW,
    footerH,
  }
}
