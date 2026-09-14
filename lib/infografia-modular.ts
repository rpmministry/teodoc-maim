// ---------------------------------------------------------------------------
// Arquitectura de información MODULAR para la infografía (lógica PURA).
//
// Toma el análisis teológico y lo estructura en filas modulares (1/2/3
// columnas, timeline, destacados) con límites de texto estrictos y conexiones
// visuales por id. El canvas final es SIEMPRE 9:16 (1080×1920) con zona segura.
// ---------------------------------------------------------------------------

import {
  CANVAS_W,
  CANVAS_H,
  PRESETS,
  metricasCanvas,
  presetRespetaPiso,
  type NivelDensidad,
  type Preset,
} from './infografia-layout.ts'

export type CategoriaSVG = 'hogar' | 'fe' | 'camino' | 'milagro' | 'generico'

export type BloqueModular = {
  id: string
  tipo?: 'versiculo' | 'frase' | 'dato'
  paso?: string
  titulo: string
  texto: string
  categoriaSVG: CategoriaSVG
}

export type FilaLayout =
  | { tipo_fila: 'grid_columnas'; columnas: 2 | 3; bloques: BloqueModular[] }
  | { tipo_fila: 'timeline_secuencial'; bloques: BloqueModular[] }
  | { tipo_fila: 'destacado_ancho_completo'; bloques: BloqueModular[] }

export type ConexionVisual = { origen_id: string; destino_id: string }

export type InfografiaModular = {
  cabecera: { titulo: string; subtitulo: string; palabras_clave: string[] }
  filas_layout: FilaLayout[]
  conexiones_visuales: ConexionVisual[]
}

export type EntradaModular = {
  titulo?: string
  subtitulo?: string
  ideaPrincipal?: string
  mensajeCentral?: string
  temaPrincipal?: string
  pasaje?: string
  textoClave?: string
  verdadPrincipal?: string
  fraseRecordar?: string
  contexto?: string
  puntos?: { titulo?: string; detalle?: string }[]
  palabras?: string[]
  versiculos?: { cita?: string; texto?: string }[]
  conexiones?: { cita?: string; texto?: string }[]
}

// ---------------------------------------------------------------------------
// Utilidades de longitud (los límites son lo que evita que el diseño se rompa).
// ---------------------------------------------------------------------------
export function limpiarTexto(t: string): string {
  return String(t || '').replace(/\s+/g, ' ').trim()
}

export function contarPalabras(t: string): number {
  const s = limpiarTexto(t)
  return s ? s.split(' ').filter(Boolean).length : 0
}

/** Recorta a un máximo de palabras, sin cortar a mitad de palabra. */
export function limitarPalabras(t: string, max: number): string {
  const palabras = limpiarTexto(t).split(' ').filter(Boolean)
  if (palabras.length <= max) return palabras.join(' ')
  return `${palabras.slice(0, max).join(' ')}…`
}

/** Recorta por caracteres en el último espacio (para textos de apoyo). */
export function recortarCaracteres(t: string, max: number): string {
  const s = limpiarTexto(t)
  if (s.length <= max) return s
  const corte = s.slice(0, max)
  const espacio = corte.lastIndexOf(' ')
  return `${(espacio > max * 0.6 ? corte.slice(0, espacio) : corte).trimEnd()}…`
}

// ---------------------------------------------------------------------------
// Mapeo de categorías SVG por palabras clave (hogar, fe, camino, milagro, generico).
// ---------------------------------------------------------------------------
const CATEGORIAS: { categoria: CategoriaSVG; re: RegExp }[] = [
  { categoria: 'hogar', re: /(casa|hogar|familia|mesa|hospitalidad|puerta|morada|habitac|hermano|prójimo|projimo|vecino|comuni)/ },
  { categoria: 'fe', re: /(fe|creer|confiar|confianza|oración|oracion|orar|corazón|corazon|amor|gracia|espíritu|espiritu|adorar|rendir)/ },
  { categoria: 'camino', re: /(camino|seguir|decisión|decision|decidir|dirección|direccion|guía|guia|paso|sendero|discipulado|andar|proceso)/ },
  { categoria: 'milagro', re: /(milagro|sanidad|sanar|resurrección|resurreccion|poder|señal|senal|providencia|manantial|semilla|amanecer|gloria)/ },
]

export function categoriaDe(texto: string): CategoriaSVG {
  const s = limpiarTexto(texto).toLowerCase()
  for (const c of CATEGORIAS) if (c.re.test(s)) return c.categoria
  return 'generico'
}

/** Ilustración/icono concreto por categoría (biblioteca vectorial existente). */
export function ilustracionDeCategoria(categoria: CategoriaSVG): string {
  switch (categoria) {
    case 'hogar': return 'casa'
    case 'fe': return 'corazon'
    case 'camino': return 'bifurcacion'
    case 'milagro': return 'amanecer'
    default: return 'biblia'
  }
}

function bloque(id: string, titulo: string, texto: string, extra?: Partial<BloqueModular>): BloqueModular {
  const base = `${titulo} ${texto}`
  return { id, titulo: limpiarTexto(titulo), texto: limpiarTexto(texto), categoriaSVG: categoriaDe(base), ...extra }
}

// ---------------------------------------------------------------------------
// Constructor: análisis → estructura modular con LÍMITES estrictos.
//   · Cabecera: título (≤5 palabras), subtítulo (1 línea), 3-4 palabras clave.
//   · Ideas principales: 2-3 bloques, texto ≤15 palabras.
//   · Timeline: 2-4 pasos por fila, texto ≤20 palabras.
//   · Destacados: 1-2 bloques a ancho completo (versículo/frase).
// ---------------------------------------------------------------------------
export const LIMITES = {
  tituloPalabras: 5,
  subtituloChars: 92,
  ideasMax: 3,
  ideaPalabras: 15,
  pasosPorFila: 4,
  pasoPalabras: 20,
  destacadosMax: 2,
  palabrasClave: 4,
} as const

export function construirModular(e: EntradaModular): InfografiaModular {
  const titulo = limitarPalabras(e.titulo || e.temaPrincipal || 'Análisis del mensaje', LIMITES.tituloPalabras)
  const subtitulo = recortarCaracteres(e.ideaPrincipal || e.mensajeCentral || e.verdadPrincipal || '', LIMITES.subtituloChars)
  const palabrasClave = (e.palabras || [])
    .map((p) => limitarPalabras(p, 2))
    .filter(Boolean)
    .filter((p, i, arr) => arr.findIndex((x) => x.toLowerCase() === p.toLowerCase()) === i)
    .slice(0, LIMITES.palabrasClave)

  const puntos = (e.puntos || []).filter((p) => limpiarTexto(p?.titulo || '') || limpiarTexto(p?.detalle || ''))
  const filas: FilaLayout[] = []

  // --- Ideas principales (grid de 2-3 columnas) ---
  const ideas: BloqueModular[] = []
  puntos.slice(0, LIMITES.ideasMax).forEach((p, i) => {
    ideas.push(bloque(`c${i + 1}`, limitarPalabras(p.titulo || '', 6), limitarPalabras(p.detalle || p.titulo || '', LIMITES.ideaPalabras)))
  })
  // Respaldo: si no hay puntos, se usan verdad/subtítulo/mensaje.
  if (ideas.length < 2) {
    const respaldos = [e.mensajeCentral, e.verdadPrincipal, e.contexto].filter(Boolean)
    respaldos.slice(0, 3 - ideas.length).forEach((t, i) => {
      ideas.push(bloque(`c${ideas.length + 1 + i}`, `Idea ${ideas.length + 1 + i}`, limitarPalabras(t as string, LIMITES.ideaPalabras)))
    })
  }
  if (ideas.length >= 2) {
    filas.push({ tipo_fila: 'grid_columnas', columnas: ideas.length >= 3 ? 3 : 2, bloques: ideas.slice(0, 3) })
  }

  // --- Timeline secuencial (resto de puntos; 2-4 pasos por fila, sin perder ninguno) ---
  const restantes = puntos.slice(LIMITES.ideasMax)
  let pasoGlobal = 1
  for (let i = 0; i < restantes.length; i += LIMITES.pasosPorFila) {
    const trozo = restantes.slice(i, i + LIMITES.pasosPorFila)
    const bloquesFila = trozo.map((p) => {
      const nodo = bloque(`t${pasoGlobal}`, limitarPalabras(p.titulo || '', 6), limitarPalabras(p.detalle || p.titulo || '', LIMITES.pasoPalabras), { paso: String(pasoGlobal).padStart(2, '0') })
      pasoGlobal += 1
      return nodo
    })
    if (bloquesFila.length) filas.push({ tipo_fila: 'timeline_secuencial', bloques: bloquesFila })
  }

  // --- Destacados a ancho completo (versículo + frase) ---
  const destacados: BloqueModular[] = []
  const versiculo = e.versiculos?.find((v) => limpiarTexto(v?.cita || '')) || (e.pasaje ? { cita: e.pasaje, texto: e.textoClave || '' } : undefined)
  if (versiculo) {
    destacados.push({ id: 'd1', tipo: 'versiculo', titulo: limpiarTexto(versiculo.cita || ''), texto: recortarCaracteres(versiculo.texto || '', 180), categoriaSVG: 'generico' })
  }
  const frase = e.fraseRecordar || e.verdadPrincipal
  if (frase && destacados.length < LIMITES.destacadosMax) {
    destacados.push(bloque('d2', 'Frase para recordar', limitarPalabras(frase, 16), { tipo: 'frase' }))
  }
  if (destacados.length) filas.push({ tipo_fila: 'destacado_ancho_completo', bloques: destacados.slice(0, LIMITES.destacadosMax) })

  // --- Conexiones visuales (hilo conductor) ---
  const conexiones: ConexionVisual[] = []
  const primerTimeline = filas.find((f) => f.tipo_fila === 'timeline_secuencial') as Extract<FilaLayout, { tipo_fila: 'timeline_secuencial' }> | undefined
  if (ideas.length && primerTimeline?.bloques.length) conexiones.push({ origen_id: ideas[0].id, destino_id: primerTimeline.bloques[0].id })
  if (ideas.length > 1 && primerTimeline?.bloques.length) conexiones.push({ origen_id: ideas[1].id, destino_id: primerTimeline.bloques[0].id })
  if (primerTimeline?.bloques.length && destacados.length) conexiones.push({ origen_id: primerTimeline.bloques[primerTimeline.bloques.length - 1].id, destino_id: destacados[0].id })
  if (destacados.length > 1) conexiones.push({ origen_id: destacados[0].id, destino_id: destacados[1].id })

  return { cabecera: { titulo, subtitulo, palabras_clave: palabrasClave }, filas_layout: filas, conexiones_visuales: conexiones }
}

// ---------------------------------------------------------------------------
// Estimación de alto (determinista) y planificación en 1 página o carrusel.
// ---------------------------------------------------------------------------
const ANCHO_GLIFO = 0.52
function numLineas(chars: number, font: number, ancho: number): number {
  const porLinea = Math.max(6, Math.floor(ancho / (font * ANCHO_GLIFO)))
  return Math.max(1, Math.ceil(chars / porLinea))
}

function estimarCabecera(mod: InfografiaModular, p: Preset, ancho: number): number {
  const l = numLineas(mod.cabecera.titulo.length, p.display, ancho)
  return Math.round(l * p.display * 1.1 + p.caption * 2.6 + p.caption * 2.6 + p.caption * 1.4)
}

function estimarBloque(b: BloqueModular, p: Preset, anchoCol: number): number {
  const interior = Math.max(140, anchoCol - 2 * p.padTarjeta)
  const icono = p.icono * 0.8
  const lineasTitulo = numLineas(b.titulo.length, p.cuerpo, interior)
  const lineasTexto = numLineas(b.texto.length, p.caption, interior)
  return Math.round(icono + lineasTitulo * p.cuerpo * 1.28 + lineasTexto * p.caption * 1.5 + 2 * p.padTarjeta + p.gapTarjetas)
}

function estimarFila(f: FilaLayout, p: Preset, ancho: number): number {
  if (f.tipo_fila === 'grid_columnas') {
    const gap = p.caption * 0.9
    const anchoCol = (ancho - gap * (f.columnas - 1)) / f.columnas
    return Math.max(...f.bloques.map((b) => estimarBloque(b, p, anchoCol))) + p.gapTarjetas
  }
  if (f.tipo_fila === 'timeline_secuencial') {
    return f.bloques.reduce((a, b) => a + estimarBloque(b, p, ancho - p.numeral - p.caption * 1.6) + p.caption * 2.4, 0) + p.gapTarjetas
  }
  return f.bloques.reduce((a, b) => a + estimarBloque(b, p, ancho), 0) + p.gapTarjetas
}

export function estimarAlturaModular(mod: InfografiaModular, paginas: FilaLayout[][], p: Preset, ancho: number): number {
  const cab = estimarCabecera(mod, p, ancho)
  return Math.max(...paginas.map((filas) => cab + filas.reduce((a, f) => a + estimarFila(f, p, ancho), 0)))
}

export type PlanModular = {
  modo: 'unico' | 'carrusel' | 'resumen'
  nivel: NivelDensidad
  cabecera: InfografiaModular['cabecera']
  conexiones_visuales: ConexionVisual[]
  paginas: FilaLayout[][]
}

export type OpcionesModular = {
  anchoContenido: number
  altoDisponible: number
  maxPaginasCarrusel?: number
}

export function planificarModular(mod: InfografiaModular, opciones: OpcionesModular): PlanModular {
  const { anchoContenido, altoDisponible } = opciones
  const maxPaginas = opciones.maxPaginasCarrusel ?? 4
  const limite = altoDisponible * 0.94

  // Niveles: se sube la densidad hasta que todo quepa en una página.
  let nivel: NivelDensidad = 1
  while (nivel < 4) {
    const alto = estimarAlturaModular(mod, [mod.filas_layout], PRESETS[nivel], anchoContenido)
    if (alto <= limite) break
    nivel = (nivel + 1) as NivelDensidad
  }
  const preset = PRESETS[nivel]
  if (estimarAlturaModular(mod, [mod.filas_layout], preset, anchoContenido) <= limite) {
    return { modo: 'unico', nivel, ...mod, paginas: [mod.filas_layout] }
  }

  // Carrusel: reparte las filas entre páginas (la cabecera se repite).
  const cab = estimarCabecera(mod, PRESETS[4], anchoContenido)
  const paginas: FilaLayout[][] = []
  let actual: FilaLayout[] = []
  let alto = cab
  for (const f of mod.filas_layout) {
    const h = estimarFila(f, PRESETS[4], anchoContenido)
    if (actual.length && alto + h > limite) {
      paginas.push(actual)
      actual = []
      alto = cab
    }
    actual.push(f)
    alto += h
  }
  if (actual.length) paginas.push(actual)
  if (!paginas.length) paginas.push([])

  if (paginas.length <= maxPaginas) {
    return { modo: 'carrusel', nivel: 4, ...mod, paginas }
  }

  // Resumen: conserva los destacados y las primeras ideas/pasos.
  const resumen = mod.filas_layout.filter((f) => f.tipo_fila !== 'destacado_ancho_completo').slice(0, 2)
  const destacado = mod.filas_layout.find((f) => f.tipo_fila === 'destacado_ancho_completo')
  const filas = destacado ? [...resumen, destacado] : resumen
  const paginasResumen: FilaLayout[][] = []
  let acc: FilaLayout[] = []
  let h2 = cab
  for (const f of filas) {
    const h = estimarFila(f, PRESETS[4], anchoContenido)
    if (acc.length && h2 + h > limite) { paginasResumen.push(acc); acc = []; h2 = cab }
    acc.push(f); h2 += h
  }
  if (acc.length) paginasResumen.push(acc)
  return { modo: 'resumen', nivel: 4, ...mod, paginas: paginasResumen.length ? paginasResumen : [[]] }
}

export function metricasModular() {
  const m = metricasCanvas()
  return { ...m, canvasW: CANVAS_W, canvasH: CANVAS_H }
}

export { PRESETS, presetRespetaPiso }
