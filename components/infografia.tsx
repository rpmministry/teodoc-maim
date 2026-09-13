'use client'

import React, { useEffect, useRef, useState } from 'react'

// ---------------------------------------------------------------------------
// Datos (estructuralmente compatibles con el análisis de /api/analyze)
// ---------------------------------------------------------------------------
type Versiculo = { cita: string; texto: string }
type Punto = { punto: string; explicacion: string; versiculos?: Versiculo[] }

export type InfografiaData = {
  titulo?: string
  idea_principal?: string
  infografia?: { frase_corta?: string; texto_clave?: string; contexto_breve?: string }
  conceptos_clave?: string[]
  desarrollo_progresivo?: Punto[]
  aplicacion?: string[]
  oracion?: string
}

export type InfografiaVariant = 'wide' | 'medium' | 'compact'

// `resumir` lo usa el PDF (bosquejo). La INFOGRAFÍA ya NO recorta texto.
export function resumir(texto: string, max: number): string {
  const t = (texto || '').replace(/\s+/g, ' ').trim()
  return t.length > max ? `${t.slice(0, max).trimEnd()}…` : t
}

// ---------------------------------------------------------------------------
// Identidad visual TeoDoc (Carbon)
// ---------------------------------------------------------------------------
const C = {
  ink: '#161616',
  sub: '#525252',
  rule: '#e0e0e0',
  white: '#ffffff',
  gray: '#f4f4f4',
  navy: '#002d9c',
  navyDeep: '#001141',
  blue: '#0f62fe',
  blueDark: '#0043ce',
  blueTint: '#edf5ff',
  amber: '#b28600',
  amberTint: '#fdf6e0',
} as const

const TEMAS = [
  { accent: C.blue, accentDark: C.blueDark, soft: C.blueTint },
  { accent: '#6929c4', accentDark: '#491d8b', soft: '#f6f2ff' },
  { accent: '#005d5d', accentDark: '#003a3a', soft: '#e5f6f6' },
] as const



function hashIndex(texto: string, n: number): number {
  let h = 0
  const s = texto || ''
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return n > 0 ? h % n : 0
}

// Reparte bloques en columnas balanceando por peso (evita columnas vacías o
// desbordadas y garantiza que TODO el contenido quede dentro del lienzo).
function distribuir<T extends { peso: number }>(items: T[], columnas: number): T[][] {
  const n = Math.max(1, columnas)
  const cols: T[][] = Array.from({ length: n }, () => [])
  const pesos = new Array(n).fill(0) as number[]
  for (const item of items) {
    const i = pesos.indexOf(Math.min(...pesos))
    cols[i].push(item)
    pesos[i] += item.peso
  }
  return cols
}

// ---------------------------------------------------------------------------
// Iconografía
// ---------------------------------------------------------------------------
function svg(size: number, color: string, children: React.ReactNode, sw = 2) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  )
}
const G = {
  bible: (s: number, c: string) => svg(s, c, <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H19v15H6.5A2.5 2.5 0 0 0 4 20.5z" /><path d="M4 5.5v15" /><path d="M11.5 7.5v5M9.2 10h4.6" /></>),
  lamp: (s: number, c: string) => svg(s, c, <><path d="M9 18h6M10 21h4" /><path d="M12 3a6 6 0 0 0-3.5 10.9c.7.5 1 1.2 1 2.1h5c0-.9.3-1.6 1-2.1A6 6 0 0 0 12 3z" /></>),
  seed: (s: number, c: string) => svg(s, c, <><path d="M12 21c0-6 3-10 8-11-1 6-4 10-8 11z" /><path d="M12 21c0-6-3-10-8-11 1 6 4 10 8 11z" /><path d="M12 21v-6" /></>),
  path: (s: number, c: string) => svg(s, c, <><path d="M5 19c6 0 4-7 9-7s5-5 5-9" /><circle cx="5" cy="19" r="1.6" /><path d="M19 3l-2.2 3h4.4z" fill={c} stroke="none" /></>),
  heart: (s: number, c: string) => svg(s, c, <path d="M12 20.5c-1.6-1.3-7-4.9-7-9A3.9 3.9 0 0 1 12 8.9a3.9 3.9 0 0 1 7-2.4c0 4.1-5.4 7.7-7 14z" />),
  dove: (s: number, c: string) => svg(s, c, <><path d="M4 15c5 1 8-1 10-4 1.2-1.8 2.6-2.5 5-2.5-.4 3-1.8 5-4 6-1.4 5-6 7-11 6 2-1 3-3 3-5.5" /><path d="M14 8.5l2-2" /></>),
  pray: (s: number, c: string) => svg(s, c, <><path d="M12 3c1.6 2.2 2.4 4.6 2.4 8.2V19a2.4 2.4 0 0 1-4.8 0v-7.8C9.6 7.6 10.4 5.2 12 3z" /><path d="M12 10.5v6" /></>),
  check: (s: number, c: string) => svg(s, c, <path d="M4 12.5 L9.5 18 L20 6.5" />, 2.4),
  quote: (s: number, c: string) => svg(s, c, <><path d="M7 7h4v4H7zM13 7h4v4h-4z" /><path d="M7 11c0 3-1 5-3 7M13 11c0 3-1 5-3 7" /></>),
  target: (s: number, c: string) => svg(s, c, <><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3.5" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /></>),
}
const POINT_GLYPHS = [G.lamp, G.seed, G.path, G.heart, G.dove, G.bible, G.pray, G.target]

// Logo oficial horizontal en blanco (para fondos oscuros), vectorial.
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

// "Cajones" que muestran la evolución del análisis (Texto → Idea → Puntos →
// Aplicación → Oración), dibujados y conectados. Ocupan el lateral del encabezado.
function AnalisisFlow({ compact, accent, small }: { compact: number; accent: string; small: number }) {
  const pasos: Array<[string, (s: number, c: string) => React.ReactNode]> = [
    ['Texto bíblico', G.bible],
    ['Idea central', G.target],
    ['Puntos clave', G.lamp],
    ['Aplicación', G.check],
    ['Oración', G.pray],
  ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', width: '100%' }}>
      {pasos.map(([label, draw], i) => (
        <div key={label}>
          <div style={{ display: 'flex', alignItems: 'center', gap: compact * 0.55, background: 'rgba(255,255,255,0.09)', border: '1px solid rgba(120,169,255,0.42)', borderRadius: compact * 0.5, padding: `${compact * 0.3}px ${compact * 0.5}px` }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: compact, height: compact, borderRadius: compact * 0.35, background: accent, flexShrink: 0 }}>
              {draw(compact * 0.56, '#ffffff')}
            </span>
            <span style={{ fontSize: small * 1.02, color: '#e6ecf7', fontWeight: 600, letterSpacing: '0.02em' }}>{label}</span>
            <span style={{ marginLeft: 'auto', fontSize: small * 0.88, color: '#9db8e8', fontWeight: 800 }}>{String(i + 1).padStart(2, '0')}</span>
          </div>
          {i < pasos.length - 1 ? (
            <div style={{ width: 2, height: compact * 0.42, background: 'rgba(120,169,255,0.5)', marginLeft: compact * 0.95 }} />
          ) : null}
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Motor 9:16 con MEDICIÓN (dos pasadas): se mide el alto natural del componente
// y el lienzo se fija a esa altura (mínimo 1920) manteniendo 9:16 exacto. Así
// NADA se corta y el reparto interno llena todo el lienzo.
// ---------------------------------------------------------------------------
export default function Infografia({ data }: { data: InfografiaData; variant?: InfografiaVariant }) {
  const uid = React.useId().replace(/[^a-zA-Z0-9]/g, '')
  const rootRef = useRef<HTMLDivElement>(null)
  const [canvasW, setCanvasW] = useState(1080)
  const [naturalH, setNaturalH] = useState(0)
  const medido = naturalH > 0

  const gap = Math.round(canvasW * 0.022)
  const pad = Math.round(canvasW * 0.05)
  const footerH = Math.round(canvasW * 0.058)
  const cols = canvasW <= 1200 ? 1 : canvasW <= 1800 ? 2 : 3
  const fontScale = 1

  // Pasada 1: mide el alto natural (root con alto automático). Se espera a que
  // carguen las fuentes para medir con las métricas reales (si no, se subestima
  // y el contenido se recortaría al fijar la altura).
  useEffect(() => {
    if (medido) return
    const el = rootRef.current
    if (!el) return
    let cancelled = false
    const run = () => {
      if (cancelled) return
      // offsetHeight NO incluye transformaciones: mide el alto real de layout
      // aunque la vista previa esté escalada con transform: scale().
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

  // Pasada 2: lienzo 9:16 exacto, con altura garantizada ≥ contenido.
  const canvasH = Math.max(naturalH || 1920, 1920)
  useEffect(() => {
    if (!medido) return
    const neededW = Math.max(1080, Math.round((canvasH * 9) / 16))
    if (Math.abs(neededW - canvasW) >= 8) setCanvasW(neededW)
  }, [medido, canvasH, canvasW])

  const tema = TEMAS[hashIndex(data.titulo || 'teodoc', TEMAS.length)]
  const acento = tema.accent
  const acentoOscuro = tema.accentDark
  const suave = tema.soft

  const puntos = data.desarrollo_progresivo || []
  const aplicaciones = data.aplicacion || []
  const conceptos = (data.conceptos_clave || []).map((c) => String(c || '').trim()).filter(Boolean).slice(0, 8)
  const frases = data.infografia?.frase_corta || ''
  const contexto = data.infografia?.contexto_breve || ''
  const pasaje = puntos.find((p) => p.versiculos?.[0]?.cita)?.versiculos?.[0]?.cita || ''
  const textoClave = data.infografia?.texto_clave || ''
  const fecha = new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })
  const totalVersiculos = new Set(puntos.flatMap((p) => (p.versiculos || []).map((v) => v.cita)).filter(Boolean)).size

  const h1 = Math.round(Math.max(40, Math.min(86, canvasW * 0.06)) * fontScale)
  const h2 = Math.round(Math.max(22, Math.min(40, canvasW * 0.03)) * fontScale)
  const body = Math.round(Math.max(17, Math.min(22, canvasW * 0.019)) * fontScale)
  const small = Math.round(body * 0.82)
  const lead = Math.round(canvasW * 0.026 * fontScale)

  const chip: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    fontSize: small,
    fontWeight: 600,
    letterSpacing: '0.04em',
    borderRadius: 999,
    padding: `${Math.round(small * 0.35)}px ${Math.round(small * 0.8)}px`,
  }
  const card: React.CSSProperties = {
    background: C.white,
    border: `1px solid ${C.rule}`,
    borderRadius: 16,
    padding: Math.round(body * 1.1),
    breakInside: 'avoid',
    boxShadow: '0 6px 18px rgba(22,22,22,0.06)',
  }
  const sectionTitle = (n: string, label: string, color: string) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '0 0 12px' }}>
      <span style={{ fontSize: h2 * 0.9, fontWeight: 800, color, lineHeight: 1 }}>{n}</span>
      <span style={{ fontSize: h2, fontWeight: 800, color: C.ink, lineHeight: 1.1, textTransform: 'uppercase', letterSpacing: '0.01em' }}>{label}</span>
      <span style={{ flex: 1, height: 2, background: color, opacity: 0.2, borderRadius: 2 }} />
    </div>
  )

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
          padding: `${Math.round(pad * 0.55)}px ${pad}px`,
        }}
      >
        <svg viewBox="0 0 1600 400" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.22, pointerEvents: 'none' }} aria-hidden="true">
          <defs>
            <pattern id={`grid-${uid}`} width="64" height="64" patternUnits="userSpaceOnUse">
              <path d="M64 0H0V64" fill="none" stroke="#78a9ff" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="1600" height="400" fill={`url(#grid-${uid})`} />
        </svg>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: Math.round(pad * 0.7) }}>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            {TeoLogo(small * 9.5)}
            <span style={{ fontSize: small, letterSpacing: '0.32em', textTransform: 'uppercase', color: '#a6c8ff' }}>Análisis bíblico</span>
          </div>

          <h1 style={{ margin: 0, lineHeight: 1.02, fontWeight: 800, letterSpacing: '-0.01em', fontSize: h1, overflowWrap: 'anywhere' }}>
            {data.titulo || 'Análisis de la prédica'}
          </h1>

          {frases ? <div style={{ marginTop: 8, fontSize: lead, fontStyle: 'italic', color: '#cfe0ff', overflowWrap: 'anywhere' }}>{frases}</div> : null}

          {data.idea_principal ? (
            <p style={{ margin: '10px 0 0', fontSize: body, lineHeight: 1.5, color: '#e6ecf7', maxWidth: 1500, overflowWrap: 'anywhere' }}>{data.idea_principal}</p>
          ) : null}

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 14 }}>
            {pasaje ? <span style={{ ...chip, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(120,169,255,0.5)', color: C.white }}>{pasaje}</span> : null}
            <span style={{ ...chip, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(120,169,255,0.35)', color: '#cfe0ff' }}>{puntos.length} puntos</span>
            {totalVersiculos ? <span style={{ ...chip, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(120,169,255,0.35)', color: '#cfe0ff' }}>{totalVersiculos} pasajes</span> : null}
            {aplicaciones.length ? <span style={{ ...chip, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(120,169,255,0.35)', color: '#cfe0ff' }}>{aplicaciones.length} aplicaciones</span> : null}
            <span style={{ ...chip, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(120,169,255,0.2)', color: '#9db8e8' }}>Generado el {fecha}</span>
          </div>
          </div>
          <div style={{ width: '34%', alignSelf: 'stretch', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <AnalisisFlow compact={Math.round(canvasW * 0.05)} accent={acento} small={small} />
          </div>
        </div>
      </header>

      {/* CUERPO — ocupa todo el alto útil (sin espacios muertos) */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: `${Math.round(pad * 0.5)}px ${pad}px`, overflow: 'hidden' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap }}>
          {/* 01 · DESARROLLO BÍBLICO */}
          <section style={{ ...card, borderTop: `4px solid ${acento}` }}>
            {sectionTitle('01', 'Desarrollo bíblico', acento)}
            {contexto ? <p style={{ margin: '0 0 12px', fontSize: body, lineHeight: 1.55, color: C.sub }}>{contexto}</p> : null}
            {pasaje || textoClave ? (
              <div style={{ background: suave, borderLeft: `4px solid ${acento}`, borderRadius: 10, padding: Math.round(body * 0.8), marginBottom: 10 }}>
                {pasaje ? <div style={{ fontSize: h2 * 0.85, fontWeight: 800, color: acentoOscuro }}>{pasaje}</div> : null}
                {textoClave ? <div style={{ marginTop: 6, fontSize: body, fontStyle: 'italic', lineHeight: 1.5, color: C.ink }}>“{textoClave}”</div> : null}
              </div>
            ) : null}
            {data.idea_principal ? (
              <div style={{ display: 'flex', gap: 10 }}>
                <span style={{ flexShrink: 0, marginTop: 2 }}>{G.target(small * 1.3, acento)}</span>
                <span style={{ fontSize: body, lineHeight: 1.5, fontWeight: 600 }}>{data.idea_principal}</span>
              </div>
            ) : null}
          </section>

          {/* CONCEPTOS CLAVE */}
          {conceptos.length > 0 ? (
            <section style={{ ...card, background: suave, borderTop: `4px solid ${acento}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <span style={{ display: 'inline-flex' }}>{G.target(small * 1.4, acento)}</span>
                <span style={{ fontSize: h2, fontWeight: 800, textTransform: 'uppercase', color: C.ink, letterSpacing: '0.01em' }}>Conceptos clave</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {conceptos.map((c, i) => (
                  <span
                    key={i}
                    className="font-hand"
                    style={{
                      fontSize: small * 1.3,
                      color: acentoOscuro,
                      border: `1.5px solid ${acento}`,
                      borderRadius: 999,
                      padding: `${Math.round(small * 0.3)}px ${Math.round(small * 0.85)}px`,
                      background: C.white,
                    }}
                  >
                    {c}
                  </span>
                ))}
              </div>
            </section>
          ) : null}

          {/* 02 · PUNTOS PRINCIPALES (repartidos en columnas balanceadas) */}
          {puntos.length > 0 ? (
            <section>
              {sectionTitle('02', 'Puntos principales', acento)}
              <div style={{ display: 'flex', gap, alignItems: 'flex-start' }}>
                {distribuir(
                  puntos.map((p, i) => ({
                    peso: (p.punto || '').length + (p.explicacion || '').length + (p.versiculos?.[0]?.texto || '').length + 120,
                    nodo: (
                      <article key={i} style={card}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: h2 * 1.7, height: h2 * 1.7, borderRadius: '50%', background: i % 2 === 0 ? acento : C.navy, color: C.white, fontWeight: 800, fontSize: h2 * 0.8, flexShrink: 0 }}>
                            {String(i + 1).padStart(2, '0')}
                          </span>
                          <span style={{ display: 'inline-flex', flexShrink: 0 }}>{POINT_GLYPHS[i % POINT_GLYPHS.length](h2 * 1.1, i % 2 === 0 ? acento : C.navy)}</span>
                          <h3 style={{ margin: 0, fontSize: h2 * 0.82, fontWeight: 800, lineHeight: 1.15, overflowWrap: 'anywhere' }}>{p.punto}</h3>
                        </div>
                        {p.explicacion ? <p style={{ margin: 0, fontSize: body, lineHeight: 1.55, color: C.sub }}>{p.explicacion}</p> : null}
                        {p.versiculos?.[0]?.cita ? (
                          <div style={{ marginTop: 10, paddingTop: 8, borderTop: `1px dashed ${C.rule}`, display: 'flex', gap: 8 }}>
                            <span style={{ flexShrink: 0, marginTop: 2 }}>{G.quote(small * 1.2, i % 2 === 0 ? acento : C.navy)}</span>
                            <span style={{ fontSize: body, lineHeight: 1.5 }}>
                              <strong style={{ color: i % 2 === 0 ? acento : C.navy }}>{p.versiculos[0].cita}</strong>
                              {p.versiculos[0].texto ? <span style={{ color: C.sub }}> {p.versiculos[0].texto}</span> : null}
                            </span>
                          </div>
                        ) : null}
                      </article>
                    ),
                  })),
                  cols,
                ).map((columna, ci) => (
                  <div key={ci} style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: gap * 0.8 }}>
                    {columna.map((b) => b.nodo)}
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {/* 03 · APLICACIÓN PRÁCTICA */}
          {aplicaciones.length > 0 ? (
            <section style={{ ...card, background: C.amberTint, borderTop: `4px solid ${C.amber}` }}>
              {sectionTitle('03', 'Aplicación práctica', C.amber)}
              <div style={{ display: 'flex', gap, alignItems: 'flex-start' }}>
                {distribuir(
                  aplicaciones.map((a, i) => ({
                    peso: a.length + 40,
                    nodo: (
                      <li key={i} style={{ display: 'flex', gap: 10 }}>
                        <span style={{ flexShrink: 0, marginTop: 2 }}>{G.check(small * 1.2, C.amber)}</span>
                        <span style={{ fontSize: body, lineHeight: 1.55 }}>{a}</span>
                      </li>
                    ),
                  })),
                  Math.min(cols, 2),
                ).map((columna, ci) => (
                  <ul key={ci} style={{ flex: 1, minWidth: 0, margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {columna.map((b) => b.nodo)}
                  </ul>
                ))}
              </div>
            </section>
          ) : null}

          {/* 04 · ORACIÓN */}
          {data.oracion ? (
            <section style={{ ...card, background: suave, borderTop: `4px solid ${acento}` }}>
              {sectionTitle('04', 'Oración', acento)}
              <p style={{ margin: 0, fontSize: body, lineHeight: 1.65, fontStyle: 'italic' }}>{data.oracion}</p>
            </section>
          ) : null}
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
// Exportación PNG (una sola imagen 16:9)
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
