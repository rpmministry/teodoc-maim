'use client'

import React, { useEffect, useRef, useState } from 'react'

// ---------------------------------------------------------------------------
// Datos (estructuralmente compatibles con el análisis de /api/analyze).
// La INFOGRAFÍA usa su propia selección editorial (campo `infografia`), con
// respaldo en los campos del PDF para no romperse nunca si falta alguno.
// ---------------------------------------------------------------------------
type Versiculo = { cita: string; texto: string }
type Punto = { punto: string; explicacion: string; subtemas?: { titulo: string; desarrollo: string }[]; versiculos?: Versiculo[] }

export type InfografiaData = {
  titulo?: string
  idea_principal?: string
  tema_principal?: string
  texto_biblico_principal?: { cita?: string; texto?: string }
  contexto_biblico?: string
  infografia?: {
    frase_corta?: string
    texto_clave?: string
    contexto_breve?: string
    mensaje_central?: string
    verdad_principal?: string
    grandes_ensenanzas?: { titulo?: string; descripcion?: string }[]
    palabras_clave?: string[]
    frase_recordar?: string
  }
  conceptos_clave?: string[]
  conceptos_teologicos?: { concepto?: string; significado?: string }[]
  desarrollo_progresivo?: Punto[]
  // Compatibilidad estructural: el PDF los usa, la infografía NO los muestra.
  aplicacion?: string[]
  oracion?: string
}

export type InfografiaVariant = 'wide' | 'medium' | 'compact'

// `resumir` lo usa el PDF (bosquejo) y también la infografía para acotar texto.
export function resumir(texto: string, max: number): string {
  const t = (texto || '').replace(/\s+/g, ' ').trim()
  return t.length > max ? `${t.slice(0, max).trimEnd()}…` : t
}

// ---------------------------------------------------------------------------
// Identidad visual: base IBM Carbon/TeoDoc + paleta viva de referencia.
// ---------------------------------------------------------------------------
const C = {
  ink: '#161616',
  sub: '#525252',
  rule: '#e0e0e0',
  white: '#ffffff',
  navy: '#002d9c',
  navyDeep: '#001141',
  grid: '#78a9ff',
} as const

type Paleta = { base: string; dark: string; soft: string }
const PALETA: Paleta[] = [
  { base: '#e0a400', dark: '#7a5c00', soft: '#fff6d9' }, // dorado
  { base: '#e4572e', dark: '#8f2d12', soft: '#ffede4' }, // naranja / coral
  { base: '#0fa3b1', dark: '#075e66', soft: '#e2f7f8' }, // turquesa
  { base: '#0f62fe', dark: '#002d9c', soft: '#edf5ff' }, // azul TeoDoc
  { base: '#8a3ffc', dark: '#491d8b', soft: '#f6f2ff' }, // violeta / magenta
  { base: '#d02670', dark: '#740937', soft: '#fff0f6' }, // magenta
]

function hashIndex(texto: string, n: number): number {
  let h = 0
  const s = texto || ''
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return n > 0 ? h % n : 0
}

// ---------------------------------------------------------------------------
// Iconografía (líneas simples, estilo plantilla).
// ---------------------------------------------------------------------------
function svg(size: number, color: string, children: React.ReactNode, sw = 2) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  )
}
const G = {
  target: (s: number, c: string) => svg(s, c, <><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3.5" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /></>),
  bible: (s: number, c: string) => svg(s, c, <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H19v15H6.5A2.5 2.5 0 0 0 4 20.5z" /><path d="M4 5.5v15" /><path d="M11.5 7.5v5M9.2 10h4.6" /></>),
  spark: (s: number, c: string) => svg(s, c, <><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" /></>),
  list: (s: number, c: string) => svg(s, c, <><path d="M8 6h12M8 12h12M8 18h12" /><circle cx="4" cy="6" r="1.4" /><circle cx="4" cy="12" r="1.4" /><circle cx="4" cy="18" r="1.4" /></>),
  tag: (s: number, c: string) => svg(s, c, <><path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9-9-9z" /><circle cx="7.5" cy="7.5" r="1.6" /></>),
  quote: (s: number, c: string) => svg(s, c, <><path d="M7 7h4v4H7zM13 7h4v4h-4z" /><path d="M7 11c0 3-1 5-3 7M13 11c0 3-1 5-3 7" /></>),
}

// Logo oficial vectorial en blanco (fondos oscuros).
function TeoLogo(width: number) {
  return (
    <svg width={width} height={(width * 180) / 640} viewBox="0 0 640 180" aria-label="TeoDoc">
      <g transform="translate(90,90)">
        <rect x="-58" y="-40" width="116" height="80" fill="none" stroke="#ffffff" strokeWidth="4" />
        <circle cx="-58" cy="0" r="12" fill="none" stroke="#ffffff" strokeWidth="4" />
        <circle cx="58" cy="0" r="12" fill="none" stroke="#ffffff" strokeWidth="4" />
        <rect x="-44" y="-20" width="58" height="6" fill="#ffffff" />
        <rect x="-44" y="-4" width="58" height="6" fill="#ffffff" />
        <rect x="-44" y="12" width="34" height="6" fill="#ffffff" />
        <rect x="22" y="-24" width="5" height="12" fill="#ffffff" />
        <rect x="32" y="-30" width="5" height="24" fill="#ffffff" />
        <rect x="42" y="-20" width="5" height="12" fill="#ffffff" />
      </g>
      <text x="185" y="105" fontSize="56" fontWeight="600" fill="#ffffff" fontFamily="var(--font-plex), sans-serif">
        Teo<tspan fill="#78a9ff">Doc</tspan>
      </text>
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Motor 9:16 con MEDICIÓN (dos pasadas): se mide el alto natural y el lienzo
// se fija a esa altura (mínimo 1920) manteniendo la proporción 9:16 exacta.
// ---------------------------------------------------------------------------
export default function Infografia({ data }: { data: InfografiaData; variant?: InfografiaVariant }) {
  const uid = React.useId().replace(/[^a-zA-Z0-9]/g, '')
  const rootRef = useRef<HTMLDivElement>(null)
  const [canvasW, setCanvasW] = useState(1080)
  const [naturalH, setNaturalH] = useState(0)
  const medido = naturalH > 0

  const pad = Math.round(canvasW * 0.05)
  const footerH = Math.round(canvasW * 0.06)
  const spineW = Math.round(canvasW * 0.11)
  const nodeSize = Math.round(canvasW * 0.056)
  const rowGap = Math.round(canvasW * 0.018)
  const sideGap = Math.round(canvasW * 0.02)

  // Pasada 1: mide el alto natural (root con alto automático). Se espera a que
  // carguen las fuentes para medir con las métricas reales.
  useEffect(() => {
    if (medido) return
    const el = rootRef.current
    if (!el) return
    let cancelled = false
    const run = () => {
      if (cancelled) return
      const h = Math.ceil(el.offsetHeight)
      if (h > 0) setNaturalH(h)
    }
    if (typeof document !== 'undefined' && document.fonts?.ready) {
      document.fonts.ready.then(() => setTimeout(run, 60)).catch(run)
    } else {
      setTimeout(run, 60)
    }
    const respaldo = setTimeout(run, 900)
    return () => {
      cancelled = true
      clearTimeout(respaldo)
    }
  }, [medido])

  // Pasada 2: lienzo 9:16 exacto, con altura garantizada >= contenido.
  const canvasH = Math.max(naturalH || 1920, 1920)
  useEffect(() => {
    if (!medido) return
    const neededW = Math.max(1080, Math.round((canvasH * 9) / 16))
    if (Math.abs(neededW - canvasW) >= 8) setCanvasW(neededW)
  }, [medido, canvasH, canvasW])

  // -------- Selección de contenido de la infografía --------
  const info = data.infografia || {}
  const pasaje = data.texto_biblico_principal?.cita
    || (data.desarrollo_progresivo || []).find((p) => p.versiculos?.[0]?.cita)?.versiculos?.[0]?.cita
    || ''
  const textoClave = info.texto_clave || data.texto_biblico_principal?.texto || ''
  const mensajeCentral = info.mensaje_central || data.idea_principal || ''
  const verdadPrincipal = info.verdad_principal || data.tema_principal || ''
  const fraseRecordar = info.frase_recordar || info.frase_corta || ''
  const grandes = (info.grandes_ensenanzas || [])
    .map((g) => ({ titulo: (g.titulo || '').trim(), descripcion: (g.descripcion || '').trim() }))
    .filter((g) => g.titulo || g.descripcion)
    .slice(0, 6)
  const palabras = (info.palabras_clave?.length ? info.palabras_clave : data.conceptos_clave || [])
    .map((p) => String(p || '').replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .filter((p, i, arr) => arr.findIndex((x) => x.toLowerCase() === p.toLowerCase()) === i)
    .slice(0, 6)
  const fecha = new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })

  // Tipografía fluida según el ancho del lienzo.
  const h1 = Math.round(Math.max(44, Math.min(88, canvasW * 0.064)))
  const h2 = Math.round(Math.max(24, Math.min(40, canvasW * 0.032)))
  const body = Math.round(Math.max(17, Math.min(23, canvasW * 0.0205)))
  const small = Math.round(body * 0.82)
  const lead = Math.round(canvasW * 0.028)

  // -------- Definición de bloques (solo los que tienen contenido) --------
  type Bloque = { etiqueta: string; icono: (s: number, c: string) => React.ReactNode; body: React.ReactNode }
  const bloques: Bloque[] = []

  if (mensajeCentral) {
    bloques.push({
      etiqueta: 'Mensaje central',
      icono: G.target,
      body: <p style={{ margin: 0, fontSize: body, lineHeight: 1.5, color: C.ink, fontWeight: 600 }}>{resumir(mensajeCentral, 320)}</p>,
    })
  }
  if (pasaje || textoClave) {
    bloques.push({
      etiqueta: 'Texto bíblico clave',
      icono: G.bible,
      body: (
        <div>
          {pasaje ? <div style={{ fontSize: h2 * 0.78, fontWeight: 800, color: C.ink, marginBottom: 6 }}>{pasaje}</div> : null}
          {textoClave ? <p style={{ margin: 0, fontSize: body, fontStyle: 'italic', lineHeight: 1.5, color: C.sub }}>“{resumir(textoClave, 300)}”</p> : null}
        </div>
      ),
    })
  }
  if (verdadPrincipal) {
    bloques.push({
      etiqueta: 'Verdad principal',
      icono: G.spark,
      body: <p style={{ margin: 0, fontSize: body, lineHeight: 1.5, color: C.ink }}>{resumir(verdadPrincipal, 320)}</p>,
    })
  }
  if (grandes.length) {
    bloques.push({
      etiqueta: 'Grandes enseñanzas',
      icono: G.list,
      body: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: Math.round(small * 0.7) }}>
          {grandes.map((g, i) => {
            const p = PALETA[(i + 1) % PALETA.length]
            return (
              <div key={i} style={{ display: 'flex', gap: Math.round(small * 0.6), alignItems: 'flex-start' }}>
                <span style={{ flexShrink: 0, width: small * 2.1, height: small * 2.1, borderRadius: '50%', background: p.base, color: '#fff', fontWeight: 800, fontSize: small * 0.95, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div style={{ minWidth: 0 }}>
                  {g.titulo ? <div style={{ fontSize: body, fontWeight: 700, color: C.ink, lineHeight: 1.25 }}>{resumir(g.titulo, 80)}</div> : null}
                  {g.descripcion ? <div style={{ fontSize: small, color: C.sub, lineHeight: 1.4, marginTop: 2 }}>{resumir(g.descripcion, 190)}</div> : null}
                </div>
              </div>
            )
          })}
        </div>
      ),
    })
  }
  if (palabras.length) {
    bloques.push({
      etiqueta: 'Palabras clave',
      icono: G.tag,
      body: (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: Math.round(small * 0.55) }}>
          {palabras.map((p, i) => {
            const pal = PALETA[i % PALETA.length]
            return (
              <span key={i} style={{ fontSize: small * 1.12, fontWeight: 700, color: pal.dark, background: pal.soft, border: `1.5px solid ${pal.base}`, borderRadius: 999, padding: `${Math.round(small * 0.28)}px ${Math.round(small * 0.8)}px` }}>
                {p}
              </span>
            )
          })}
        </div>
      ),
    })
  }
  if (fraseRecordar) {
    bloques.push({
      etiqueta: 'Frase para recordar',
      icono: G.quote,
      body: <p style={{ margin: 0, fontSize: h2 * 0.86, lineHeight: 1.4, fontStyle: 'italic', color: C.ink, fontWeight: 600 }}>“{resumir(fraseRecordar, 200)}”</p>,
    })
  }

  const tema = PALETA[hashIndex(data.titulo || 'teodoc', PALETA.length)]

  return (
    <div
      ref={rootRef}
      style={{
        width: canvasW,
        height: medido ? canvasH : 'auto',
        boxSizing: 'border-box',
        background: C.white,
        color: C.ink,
        fontFamily: 'var(--font-plex), system-ui, sans-serif',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* ENCABEZADO */}
      <header
        style={{
          boxSizing: 'border-box',
          position: 'relative',
          overflow: 'hidden',
          color: C.white,
          background: `linear-gradient(140deg, ${C.navy} 0%, ${C.navyDeep} 62%, #000a1f 100%)`,
          padding: `${Math.round(pad * 0.7)}px ${pad}px`,
        }}
      >
        <svg viewBox="0 0 1600 400" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.22, pointerEvents: 'none' }} aria-hidden="true">
          <defs>
            <pattern id={`grid-${uid}`} width="64" height="64" patternUnits="userSpaceOnUse">
              <path d="M64 0H0V64" fill="none" stroke={C.grid} strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="1600" height="400" fill={`url(#grid-${uid})`} />
        </svg>

        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: Math.round(pad * 0.2) }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {TeoLogo(small * 9)}
              <span style={{ fontSize: small, letterSpacing: '0.3em', textTransform: 'uppercase', color: '#a6c8ff' }}>Análisis bíblico</span>
            </div>
            <span style={{ fontSize: small * 0.9, color: '#9db8e8', letterSpacing: '0.06em' }}>{fecha}</span>
          </div>

          <h1 style={{ margin: 0, lineHeight: 1.04, fontWeight: 800, letterSpacing: '-0.01em', fontSize: h1, overflowWrap: 'anywhere' }}>
            {data.titulo || 'Análisis de la prédica'}
          </h1>

          {info.frase_corta ? (
            <div style={{ marginTop: 8, fontSize: lead, fontStyle: 'italic', color: '#cfe0ff', overflowWrap: 'anywhere' }}>{info.frase_corta}</div>
          ) : null}

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 14 }}>
            {data.tema_principal ? (
              <span style={{ fontSize: small, fontWeight: 600, letterSpacing: '0.03em', borderRadius: 999, padding: `${Math.round(small * 0.3)}px ${Math.round(small * 0.75)}px`, background: tema.base, color: '#ffffff' }}>{data.tema_principal}</span>
            ) : null}
            {pasaje ? (
              <span style={{ fontSize: small, fontWeight: 600, letterSpacing: '0.03em', borderRadius: 999, padding: `${Math.round(small * 0.3)}px ${Math.round(small * 0.75)}px`, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(120,169,255,0.5)', color: C.white }}>{pasaje}</span>
            ) : null}
          </div>
        </div>
      </header>

      {/* CUERPO — timeline alterno con espina central punteada */}
      <div style={{ flex: 1, position: 'relative', padding: `${Math.round(pad * 0.5)}px ${pad}px`, boxSizing: 'border-box' }}>
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: Math.round(pad * 0.4),
            bottom: Math.round(pad * 0.4),
            left: '50%',
            transform: 'translateX(-50%)',
            width: 3,
            backgroundImage: `repeating-linear-gradient(to bottom, ${tema.base} 0 5px, transparent 5px 12px)`,
            opacity: 0.7,
          }}
        />

        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
          {bloques.map((b, i) => {
            const lado: 'left' | 'right' = i % 2 === 0 ? 'left' : 'right'
            const pal = PALETA[(i + (i % 2 === 0 ? 0 : 1)) % PALETA.length]
            const numero = String(i + 1).padStart(2, '0')
            const esIzq = lado === 'left'
            return (
              <div key={b.etiqueta} style={{ display: 'flex', alignItems: 'stretch', marginBottom: i < bloques.length - 1 ? rowGap : 0 }}>
                <div style={{ flex: 1, minWidth: 0, display: 'flex', justifyContent: 'flex-end' }}>
                  {esIzq ? (
                    <Tarjeta numero={numero} etiqueta={b.etiqueta} icono={b.icono} pal={pal} small={small} h2={h2} side="right" gap={sideGap}>
                      {b.body}
                    </Tarjeta>
                  ) : null}
                </div>

                <div style={{ width: spineW, flexShrink: 0, position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
                  <div
                    style={{
                      marginTop: Math.round(nodeSize * 0.35),
                      width: nodeSize,
                      height: nodeSize,
                      borderRadius: '50%',
                      background: '#ffffff',
                      border: `4px solid ${tema.base}`,
                      color: tema.base,
                      fontWeight: 800,
                      fontSize: nodeSize * 0.4,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 12px rgba(22,22,22,0.16)',
                    }}
                  >
                    {numero}
                  </div>
                </div>

                <div style={{ flex: 1, minWidth: 0, display: 'flex', justifyContent: 'flex-start' }}>
                  {!esIzq ? (
                    <Tarjeta numero={numero} etiqueta={b.etiqueta} icono={b.icono} pal={pal} small={small} h2={h2} side="left" gap={sideGap}>
                      {b.body}
                    </Tarjeta>
                  ) : null}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* PIE */}
      <footer
        style={{
          height: footerH,
          background: C.navyDeep,
          color: '#a6c8ff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: `0 ${pad}px`,
          fontSize: small,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
        }}
      >
        {TeoLogo(small * 8)}
        <span>RPM Ministry</span>
      </footer>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tarjeta de bloque: banner de color + icono circular + contenido, con el
// número gigante de marca de agua. Alterna lado en la composición.
// ---------------------------------------------------------------------------
function Tarjeta({
  numero,
  etiqueta,
  icono,
  pal,
  small,
  h2,
  side,
  gap,
  children,
}: {
  numero: string
  etiqueta: string
  icono: (s: number, c: string) => React.ReactNode
  pal: Paleta
  small: number
  h2: number
  side: 'left' | 'right'
  gap: number
  children: React.ReactNode
}) {
  const waterMarkSide: React.CSSProperties = side === 'right'
    ? { left: Math.round(small * 0.5) }
    : { right: Math.round(small * 0.5) }
  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        marginRight: side === 'right' ? gap : 0,
        marginLeft: side === 'left' ? gap : 0,
        background: '#ffffff',
        border: `1.5px solid ${pal.soft}`,
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: '0 8px 22px rgba(22,22,22,0.08)',
        position: 'relative',
      }}
    >
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          ...waterMarkSide,
          bottom: -Math.round(small * 1.6),
          fontSize: h2 * 3.4,
          fontWeight: 800,
          color: pal.soft,
          lineHeight: 1,
          pointerEvents: 'none',
        }}
      >
        {numero}
      </span>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: Math.round(small * 0.6),
          background: pal.base,
          color: '#ffffff',
          padding: `${Math.round(small * 0.55)}px ${Math.round(small * 0.85)}px`,
          position: 'relative',
        }}
      >
        <span
          style={{
            flexShrink: 0,
            width: small * 2.2,
            height: small * 2.2,
            borderRadius: '50%',
            background: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icono(small * 1.35, pal.base)}
        </span>
        <span style={{ fontSize: h2 * 0.62, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: 1.1 }}>
          {numero} · {etiqueta}
        </span>
      </div>

      <div style={{ padding: Math.round(small * 0.9), position: 'relative' }}>{children}</div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Exportación PNG (una sola imagen)
// ---------------------------------------------------------------------------
export async function exportarInfografiaPng(node: HTMLElement): Promise<string> {
  const { default: domtoimage } = await import('dom-to-image-more')
  const ancho = node.offsetWidth
  const alto = node.offsetHeight
  if (!ancho || !alto) throw new Error('Artboard vacío')

  // Límites seguros para iOS/Safari: no superar ~14 MP ni 4096 px por lado.
  const MAX_AREA = 14_000_000
  const MAX_DIM = 4096
  const escala = Math.min(1, Math.sqrt(MAX_AREA / (ancho * alto)), MAX_DIM / Math.max(ancho, alto))

  const intentar = (s: number) =>
    domtoimage.toPng(node, {
      width: Math.max(1, Math.round(ancho * s)),
      height: Math.max(1, Math.round(alto * s)),
      style: {
        width: `${ancho}px`,
        height: `${alto}px`,
        transform: `scale(${s})`,
        transformOrigin: 'top left',
      },
      bgcolor: '#FFFFFF',
    })

  try {
    return await intentar(escala)
  } catch {
    // Reintento con menos resolución: evita fallos por límites de canvas.
    return await intentar(Math.max(0.35, escala * 0.6))
  }
}

// Variante que devuelve un Blob (descarga directa, sin data URL/base64): más
// fiable y ligera en móvil. Es la que usa el botón "Descargar infografía PNG".
export async function exportarInfografiaBlob(node: HTMLElement): Promise<Blob> {
  const { default: domtoimage } = await import('dom-to-image-more')
  const ancho = node.offsetWidth
  const alto = node.offsetHeight
  if (!ancho || !alto) throw new Error('Artboard vacío')

  const MAX_AREA = 14_000_000
  const MAX_DIM = 4096
  const escala = Math.min(1, Math.sqrt(MAX_AREA / (ancho * alto)), MAX_DIM / Math.max(ancho, alto))

  const opciones = (s: number) => ({
    width: Math.max(1, Math.round(ancho * s)),
    height: Math.max(1, Math.round(alto * s)),
    style: {
      width: `${ancho}px`,
      height: `${alto}px`,
      transform: `scale(${s})`,
      transformOrigin: 'top left',
    },
    bgcolor: '#FFFFFF',
  })

  try {
    return await domtoimage.toBlob(node, opciones(escala))
  } catch {
    return await domtoimage.toBlob(node, opciones(Math.max(0.35, escala * 0.6)))
  }
}

// ---------------------------------------------------------------------------
// Visualización responsive
// ---------------------------------------------------------------------------
export function ResponsiveInfografia({ data }: { data: InfografiaData }) {
  const hostRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const [hostW, setHostW] = useState(0)
  const [size, setSize] = useState({ w: 0, h: 0 })

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    const measure = () => setHostW(host.clientWidth)
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(host)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const inner = innerRef.current
    if (!inner) return
    const measure = () =>
      setSize((prev) => {
        const w = inner.offsetWidth
        const h = inner.offsetHeight
        return prev.w === w && prev.h === h ? prev : { w, h }
      })
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(inner)
    return () => ro.disconnect()
  })

  const scale = hostW > 0 && size.w > 0 ? hostW / size.w : 0

  return (
    <div ref={hostRef} style={{ width: '100%' }}>
      <div style={{ width: '100%', height: size.h && scale ? size.h * scale : undefined, overflow: 'hidden' }}>
        <div ref={innerRef} style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: 'max-content' }}>
          <Infografia data={data} />
        </div>
      </div>
    </div>
  )
}
