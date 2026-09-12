'use client'

import React, { useEffect, useRef, useState } from 'react'

// ---------------------------------------------------------------------------
// Tipos (estructuralmente compatibles con el análisis de /api/analyze)
// ---------------------------------------------------------------------------
type Versiculo = { cita: string; texto: string }
type Punto = { punto: string; explicacion: string; versiculos?: Versiculo[] }

export type InfografiaData = {
  titulo?: string
  idea_principal?: string
  infografia?: { frase_corta?: string; texto_clave?: string; contexto_breve?: string }
  desarrollo_progresivo?: Punto[]
  aplicacion?: string[]
  oracion?: string
}

export type InfografiaVariant = 'wide' | 'medium' | 'compact'

// ---------------------------------------------------------------------------
// Utilidad de resumen (exportada: el PDF la reutiliza)
// ---------------------------------------------------------------------------
export function resumir(texto: string, max: number): string {
  const t = (texto || '').replace(/\s+/g, ' ').trim()
  return t.length > max ? `${t.slice(0, max).trimEnd()}…` : t
}

// ---------------------------------------------------------------------------
// Sistema visual TeoDoc — inspirado en la plantilla narrativa de referencia:
//   · franjas de color a todo lo ancho (capítulos del relato)
//   · encabezado oscuro protagonista
//   · números en círculos de color (anclas visuales)
//   · iconos ilustrados dentro de círculos
//   · títulos de sección centrados con énfasis mixto
//   · arco conector entre capítulos
// ---------------------------------------------------------------------------
const C = {
  ink: '#161616',
  sub: '#525252',
  faint: '#8d8d8d',
  rule: '#e0e0e0',
  white: '#ffffff',
  gray: '#f4f4f4',
  navy: '#002d9c',
  navyDeep: '#001141',
  blue: '#0f62fe',
  blueDark: '#0043ce',
  blueTint: '#edf5ff',
  purple: '#6929c4',
  amber: '#b28600',
  amberBright: '#f1c21b',
  amberTint: '#fdf6e0',
} as const

const ACCENTS = [C.blue, C.purple, C.amber, C.blueDark, '#8a3ffc']

type Cfg = {
  pad: number
  bandY: number
  title: number
  sermon: number
  h2: number
  body: number
  small: number
  cols: 1 | 2 | 3
  gap: number
  circle: number
}

const VARIANTS: Record<InfografiaVariant, Cfg> = {
  wide: { pad: 48, bandY: 38, title: 60, sermon: 27, h2: 30, body: 12.5, small: 10.5, cols: 3, gap: 18, circle: 66 },
  medium: { pad: 32, bandY: 28, title: 44, sermon: 21, h2: 25, body: 12, small: 10.5, cols: 2, gap: 14, circle: 56 },
  compact: { pad: 20, bandY: 24, title: 33, sermon: 18, h2: 21, body: 13, small: 11, cols: 1, gap: 14, circle: 50 },
}

// ---------------------------------------------------------------------------
// Glifos monocromos (para círculos de color)
// ---------------------------------------------------------------------------
function glyph(size: number, color: string, children: React.ReactNode) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  )
}
const G = {
  cross: (s: number, c: string) => glyph(s, c, <><path d="M12 3.5v17" /><path d="M6.5 9h11" /></>),
  bible: (s: number, c: string) => glyph(s, c, <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H19v15H6.5A2.5 2.5 0 0 0 4 20.5z" /><path d="M4 5.5v15" /><path d="M11.5 7.5v5M9.2 10h4.6" /></>),
  lamp: (s: number, c: string) => glyph(s, c, <><path d="M9 18h6M10 21h4" /><path d="M12 3a6 6 0 0 0-3.5 10.9c.7.5 1 1.2 1 2.1h5c0-.9.3-1.6 1-2.1A6 6 0 0 0 12 3z" /></>),
  seed: (s: number, c: string) => glyph(s, c, <><path d="M12 21c0-6 3-10 8-11-1 6-4 10-8 11z" /><path d="M12 21c0-6-3-10-8-11 1 6 4 10 8 11z" /><path d="M12 21v-6" /></>),
  path: (s: number, c: string) => glyph(s, c, <><path d="M5 19c6 0 4-7 9-7s5-5 5-9" /><circle cx="5" cy="19" r="1.6" /><path d="M19 3l-2.2 3h4.4z" fill={c} stroke="none" /></>),
  heart: (s: number, c: string) => glyph(s, c, <path d="M12 20.5c-1.6-1.3-7-4.9-7-9A3.9 3.9 0 0 1 12 8.9a3.9 3.9 0 0 1 7-2.4c0 4.1-5.4 7.7-7 14z" />),
  dove: (s: number, c: string) => glyph(s, c, <><path d="M4 15c5 1 8-1 10-4 1.2-1.8 2.6-2.5 5-2.5-.4 3-1.8 5-4 6-1.4 5-6 7-11 6 2-1 3-3 3-5.5" /><path d="M14 8.5l2-2" /></>),
  steps: (s: number, c: string) => glyph(s, c, <><path d="M5 19h4v-4h4v-4h4V7" /><path d="M14 7l2.5-2.5L19 7" /></>),
  pray: (s: number, c: string) => glyph(s, c, <><path d="M12 3c1.6 2.2 2.4 4.6 2.4 8.2V19a2.4 2.4 0 0 1-4.8 0v-7.8C9.6 7.6 10.4 5.2 12 3z" /><path d="M12 10.5v6" /></>),
  ear: (s: number, c: string) => glyph(s, c, <path d="M8 9a4 4 0 1 1 8 0c0 2-1.5 2.5-2 4-.5 1.4-.5 3-2.5 3M6 9a6 6 0 0 1 12 0M9 20c1.5 1 5 1 6-2" />),
  think: (s: number, c: string) => glyph(s, c, <><path d="M12 3a6 6 0 0 0-3.7 10.7c.5.4.7 1 .7 1.6V17h6v-1.7c0-.6.2-1.2.7-1.6A6 6 0 0 0 12 3z" /><path d="M10 21h4" /></>),
  decide: (s: number, c: string) => glyph(s, c, <><path d="M12 21V4" /><path d="M12 5h7l-2 3 2 3h-7" /><path d="M5 5h7v6H5z" /></>),
  act: (s: number, c: string) => glyph(s, c, <><path d="M5 20h6l8-8-4-4-8 8v4z" /><path d="M14 7l3-3 4 4-3 3" /></>),
  check: (s: number, c: string) => glyph(s, c, <path d="M4 12.5 L9.5 18 L20 6.5" />),
}

const POINT_GLYPHS = [G.lamp, G.seed, G.path, G.heart, G.dove, G.bible]

// Orbe + ola (identidad TeoDoc) en blanco para el encabezado oscuro
function TeoMark(size: number, id: string) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <radialGradient id={id} cx="50%" cy="36%" r="68%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="55%" stopColor="#78a9ff" />
          <stop offset="100%" stopColor="#0f62fe" />
        </radialGradient>
      </defs>
      <circle cx="32" cy="32" r="23" fill={`url(#${id})`} />
      <path d="M13 34.5c5.4-3.2 10.3-3.2 15.6 0 5.2 3.1 9.7 1.6 13.4-1.2" stroke={C.navyDeep} strokeOpacity="0.85" strokeWidth="2.6" strokeLinecap="round" fill="none" />
    </svg>
  )
}

// Nodos/decoración técnica del encabezado (inspirado en la referencia)
function HeaderNodes() {
  return (
    <svg viewBox="0 0 900 150" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 'auto', opacity: 0.5, pointerEvents: 'none' }} aria-hidden="true">
      <g fill="none" stroke="#78a9ff" strokeWidth="1.6">
        <path d="M40 120 L40 40 L120 40 M40 70 L96 70 M120 40 L120 12" />
        <path d="M860 120 L860 40 L780 40 M860 70 L804 70 M780 40 L780 12" />
        <path d="M150 24 L210 24 M690 24 L750 24" />
      </g>
      <g fill="#78a9ff">
        <circle cx="40" cy="120" r="4" /><circle cx="120" cy="40" r="4" /><circle cx="96" cy="70" r="3.5" />
        <circle cx="860" cy="120" r="4" /><circle cx="780" cy="40" r="4" /><circle cx="804" cy="70" r="3.5" />
        <rect x="146" y="20" width="8" height="8" /><rect x="686" y="20" width="8" height="8" />
      </g>
    </svg>
  )
}

// Ilustración central: Biblia abierta con rayos (sin texto, sin datos inventados)
function BibleArt({ width }: { width: number }) {
  return (
    <svg width={width} height={width * 0.62} viewBox="0 0 240 150" aria-hidden="true" style={{ display: 'block', margin: '0 auto' }}>
      <g stroke={C.amberBright} strokeWidth="3" strokeLinecap="round">
        <path d="M120 16v-10" /><path d="M92 24l-7-9" /><path d="M148 24l7-9" />
      </g>
      <path d="M120 56c-16-10-40-12-58-8v62c18-4 42-2 58 8 16-10 40-12 58-8V48c-18-4-42-2-58 8z" fill={C.white} stroke={C.blue} strokeWidth="3" />
      <path d="M120 56v62" stroke={C.blue} strokeWidth="3" />
      <g stroke={C.rule} strokeWidth="2">
        <path d="M78 66h30M78 76h30M78 86h24" /><path d="M132 66h30M132 76h30M132 86h24" />
      </g>
      <path d="M120 72v22M112 80h16" stroke={C.amber} strokeWidth="4" strokeLinecap="round" />
      <path d="M62 110c18-4 42-2 58 8 16-10 40-12 58-8" stroke={C.blueDark} strokeWidth="3" fill="none" strokeLinecap="round" />
    </svg>
  )
}

// Arco conector entre capítulos (como el embudo de la referencia)
function ArcConnector() {
  return (
    <svg width="100%" height="70" viewBox="0 0 900 70" preserveAspectRatio="xMidYMid meet" aria-hidden="true" style={{ display: 'block' }}>
      <path d="M120 20 Q 450 96 780 20" fill="none" stroke={C.blue} strokeWidth="3" opacity="0.55" />
      <circle cx="120" cy="20" r="7" fill={C.blue} />
      <circle cx="780" cy="20" r="7" fill={C.amber} />
      <circle cx="120" cy="20" r="13" fill="none" stroke={C.blue} strokeWidth="2" opacity="0.4" />
      <circle cx="780" cy="20" r="13" fill="none" stroke={C.amber} strokeWidth="2" opacity="0.4" />
      <circle cx="450" cy="55" r="5" fill={C.purple} />
    </svg>
  )
}

// Título de sección con énfasis mixto (patrón "USE A STORY ARC FOR YOUR ...")
function BandTitle({ lead, main, note, dark, accent, cfg }: { lead?: string; main: string; note?: string; dark?: boolean; accent: string; cfg: Cfg }) {
  return (
    <div style={{ textAlign: 'center', marginBottom: cfg.bandY * 0.7 }}>
      <h2 style={{ margin: 0, lineHeight: 1.05, letterSpacing: '0.01em', color: dark ? C.white : C.ink }}>
        {lead ? <span style={{ fontSize: cfg.h2 * 0.62, fontWeight: 500, opacity: 0.75, letterSpacing: '0.08em' }}>{lead} </span> : null}
        <span style={{ fontSize: cfg.h2, fontWeight: 800, textTransform: 'uppercase', color: dark ? C.white : accent }}>{main}</span>
      </h2>
      <svg width={cfg.cols === 1 ? 180 : 260} height="10" viewBox="0 0 260 10" style={{ display: 'block', margin: '6px auto 0' }}>
        <path d="M4 6 C 60 1, 120 10, 180 5 S 240 1, 256 6" fill="none" stroke={accent} strokeWidth="3" strokeLinecap="round" />
      </svg>
      {note ? <p style={{ margin: '10px auto 0', maxWidth: cfg.cols === 1 ? '100%' : 620, fontSize: cfg.body + 0.5, lineHeight: 1.45, color: dark ? '#c6c6c6' : C.sub }}>{note}</p> : null}
    </div>
  )
}

function CircleGlyph({ size, color, children }: { size: number; color: string; children: React.ReactNode }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: size, height: size, borderRadius: '50%', background: color, boxShadow: `0 0 0 6px ${color}22`, flexShrink: 0 }}>
      <span style={{ display: 'inline-flex', transform: `scale(${size / 56})` }}>{children}</span>
    </span>
  )
}

// ---------------------------------------------------------------------------
// Composición principal
// ---------------------------------------------------------------------------
export default function Infografia({ data, variant = 'wide' }: { data: InfografiaData; variant?: InfografiaVariant }) {
  const cfg = VARIANTS[variant]
  const uid = React.useId().replace(/[^a-zA-Z0-9]/g, '')

  const primerVersiculo = (() => {
    for (const p of data.desarrollo_progresivo || []) {
      const v = (p.versiculos || [])[0]
      if (v?.cita) return v
    }
    return null
  })()
  const pasaje = primerVersiculo?.cita || ''
  const textoPasaje = primerVersiculo?.texto || data.infografia?.texto_clave || ''
  const contexto = data.infografia?.contexto_breve || ''
  const fraseCorta = data.infografia?.frase_corta || ''
  // Sin límite de diseño: el tope es solo una salvaguarda ante datos anómalos.
  const puntos = (data.desarrollo_progresivo || []).slice(0, 12)
  const aplicaciones = (data.aplicacion || []).slice(0, 8)
  const palabrasClave = Array.from(new Set(
    (data.desarrollo_progresivo || [])
      .map((p) => (p.punto || '').split(/\s+/).slice(0, 2).join(' ').replace(/[.,;:]+$/, '').trim())
      .filter((k) => k.length > 2),
  )).slice(0, 8)
  const nPasajes = new Set((data.desarrollo_progresivo || []).flatMap((p) => (p.versiculos || []).map((v) => v.cita)).filter(Boolean)).size
  const fecha = new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })

  // Columnas de los puntos según la cantidad real (evita filas huérfanas).
  const pointCols: 1 | 2 | 3 =
    variant === 'compact' || puntos.length <= 1
      ? 1
      : puntos.length % 3 === 0
        ? 3
        : 2
  const band: React.CSSProperties = { position: 'relative', padding: `${cfg.bandY}px ${cfg.pad}px` }
  const gridCols = pointCols === 3 ? '1fr 1fr 1fr' : pointCols === 2 ? '1fr 1fr' : '1fr'
  const rutaAplicacion: Array<[string, (s: number, c: string) => React.ReactNode]> = [
    ['Escuchar', G.ear], ['Reflexionar', G.think], ['Decidir', G.decide], ['Actuar', G.act],
  ]

  return (
    <div
      style={{
        backgroundColor: C.white,
        color: C.ink,
        fontFamily: 'var(--font-plex), system-ui, sans-serif',
        position: 'relative',
        overflow: 'hidden',
        boxSizing: 'border-box',
        width: '100%',
      }}
    >
      {/* ======================= ENCABEZADO OSCURO ======================= */}
      <header style={{ position: 'relative', background: `linear-gradient(160deg, ${C.navy} 0%, ${C.navyDeep} 70%)`, padding: `${cfg.bandY + 14}px ${cfg.pad}px ${cfg.bandY}px`, textAlign: 'center', overflow: 'hidden' }}>
        <HeaderNodes />
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 9, marginBottom: 8 }}>
            {TeoMark(cfg.cols === 1 ? 26 : 30, `tdg${uid}`)}
            <span style={{ fontSize: cfg.small, letterSpacing: '0.28em', textTransform: 'uppercase', color: '#a6c8ff' }}>TeoDoc · Mapa visual de una prédica</span>
          </div>

          <h1 style={{ margin: 0, lineHeight: 1, letterSpacing: '-0.01em' }}>
            <span style={{ fontSize: cfg.title, fontWeight: 800, color: '#78a9ff' }}>ANÁLISIS</span>
            {'\u00A0'}
            <span style={{ fontSize: cfg.title, fontWeight: 800, color: C.white }}>DE LA PRÉDICA</span>
          </h1>

          {/* Título completo: nunca se recorta (envuelve si es largo). */}
          <div style={{ marginTop: 12, fontSize: cfg.sermon, fontWeight: 600, color: C.amberBright, lineHeight: 1.2, overflowWrap: 'anywhere' }}>
            {data.titulo || 'Prédica'}
          </div>

          {fraseCorta ? (
            <div className="font-hand" style={{ fontSize: cfg.sermon + 6, color: C.white, marginTop: 6, lineHeight: 1.15, overflowWrap: 'anywhere' }}>{fraseCorta}</div>
          ) : null}

          {data.idea_principal ? (
            <p style={{ margin: '10px auto 0', maxWidth: cfg.cols === 1 ? '100%' : 660, fontSize: cfg.body + 1.5, fontStyle: 'italic', color: '#e0e0e0', lineHeight: 1.5 }}>
              “{resumir(data.idea_principal, 200)}”
            </p>
          ) : null}

          {/* Llamados de datos (stat callouts de la referencia) */}
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: cfg.cols === 1 ? 18 : 34, marginTop: 20 }}>
            {[
              { n: puntos.length, l: 'Puntos' },
              { n: nPasajes, l: 'Pasajes' },
              { n: aplicaciones.length, l: 'Aplicaciones' },
            ].map((s) => (
              <div key={s.l} style={{ textAlign: 'center', minWidth: 64 }}>
                <div style={{ fontSize: cfg.h2 + 6, fontWeight: 800, color: C.amberBright, lineHeight: 1 }}>{String(s.n).padStart(2, '0')}</div>
                <div style={{ fontSize: cfg.small - 1, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#a6c8ff', marginTop: 4 }}>{s.l}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 16, fontSize: cfg.small, color: '#a6c8ff', letterSpacing: '0.06em' }}>
            {pasaje ? <span style={{ color: C.white, fontWeight: 700 }}>{pasaje}</span> : null}
            {pasaje ? '   ·   ' : ''}Generado el {fecha}
          </div>
        </div>
      </header>

      {/* ======================= 01 · DESARROLLO BÍBLICO ======================= */}
      <section style={{ ...band, background: C.white }}>
        <BandTitle lead="El fundamento de todo:" main="Desarrollo bíblico" note={contexto ? resumir(contexto, 210) : undefined} accent={C.blue} cfg={cfg} />
        <BibleArt width={cfg.cols === 1 ? 190 : 250} />

        <div style={{ display: 'grid', gridTemplateColumns: cfg.cols === 1 ? '1fr' : '1fr 1fr', gap: cfg.gap, marginTop: cfg.bandY * 0.6 }}>
          <div style={{ border: `2px solid ${C.blue}`, borderRadius: 12, padding: '14px 16px', background: C.blueTint }}>
            <div style={{ fontSize: cfg.small - 1.5, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.blueDark, marginBottom: 6 }}>Pasaje principal</div>
            <div className="font-hand" style={{ fontSize: cfg.cols === 1 ? 22 : 26, color: C.blue, lineHeight: 1.05 }}>{pasaje || '—'}</div>
            {textoPasaje ? <div style={{ fontSize: cfg.body, color: C.sub, fontStyle: 'italic', marginTop: 6, lineHeight: 1.45 }}>“{resumir(textoPasaje, 170)}”</div> : null}
          </div>
          <div style={{ border: `2px solid ${C.rule}`, borderRadius: 12, padding: '14px 16px', background: C.white }}>
            <div style={{ fontSize: cfg.small - 1.5, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.sub, marginBottom: 6 }}>Idea central</div>
            <div style={{ fontSize: cfg.body + 1.5, fontWeight: 600, lineHeight: 1.45 }}>{resumir(data.idea_principal || '', 210) || '—'}</div>
          </div>
        </div>

        {palabrasClave.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: cfg.bandY * 0.6 }}>
            {palabrasClave.map((k, i) => (
              <span key={i} className="font-hand" style={{ fontSize: cfg.small > 11 ? 18 : 17, lineHeight: 1, color: C.blue, border: `1.5px solid ${C.blue}`, borderRadius: 999, padding: '4px 12px', background: C.white }}>{k}</span>
            ))}
          </div>
        ) : null}
      </section>

      {/* Arco conector */}
      <div style={{ background: C.white, padding: `0 ${cfg.pad}px` }}>
        <ArcConnector />
      </div>

      {/* ======================= 02 · PUNTOS PRINCIPALES ======================= */}
      <section style={{ ...band, background: C.gray }}>
        <BandTitle lead="La enseñanza se sostiene en" main={puntos.length === 1 ? '1 punto principal' : puntos.length ? `${puntos.length} puntos principales` : 'Puntos principales'} accent={C.purple} cfg={cfg} />
        <div style={{ display: 'grid', gridTemplateColumns: gridCols, gap: cfg.gap }}>
          {puntos.map((p, i) => {
            const color = ACCENTS[i % ACCENTS.length]
            const v = (p.versiculos || [])[0]
            return (
              <div key={i} style={{ position: 'relative', background: C.white, borderRadius: 14, border: `2px solid ${C.ink}`, padding: '18px 16px 16px', boxShadow: `5px 5px 0 ${color}26` }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
                  <CircleGlyph size={cfg.circle} color={color}>{POINT_GLYPHS[i % POINT_GLYPHS.length](24, C.white)}</CircleGlyph>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: cfg.small, fontWeight: 800, letterSpacing: '0.14em', color, background: `${color}1a`, borderRadius: 999, padding: '2px 9px' }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                </div>
                {/* Título del punto completo, sin recortar. */}
                <div className="font-hand" style={{ fontSize: pointCols === 1 ? 23 : 21, lineHeight: 1.1, textAlign: 'center', overflowWrap: 'anywhere' }}>{p.punto}</div>
                <div style={{ fontSize: cfg.body, color: C.sub, lineHeight: 1.45, marginTop: 8, textAlign: 'center' }}>{resumir(p.explicacion, 150)}</div>
                {v?.cita ? (
                  <div style={{ marginTop: 10, paddingTop: 8, borderTop: `1px dashed ${C.rule}`, textAlign: 'center' }}>
                    <div style={{ fontSize: cfg.small, fontWeight: 700, color }}>{v.cita}</div>
                    {v.texto ? <div style={{ fontSize: cfg.small - 1, color: C.faint, fontStyle: 'italic', marginTop: 3, lineHeight: 1.4 }}>“{resumir(v.texto, 80)}”</div> : null}
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      </section>

      {/* ======================= 03 · APLICACIÓN PRÁCTICA ======================= */}
      <section style={{ ...band, background: C.amberTint }}>
        <BandTitle lead="La enseñanza se vuelve vida en la" main="Aplicación práctica" accent={C.amber} cfg={cfg} />

        {/* Ruta de aplicación en círculos (patrón de iconos de la referencia) */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: cfg.cols === 1 ? 20 : 40, marginBottom: cfg.bandY * 0.7 }}>
          {rutaAplicacion.map(([label, draw]) => (
            <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, minWidth: 72 }}>
              <CircleGlyph size={cfg.circle} color={C.amber}>{draw(24, C.white)}</CircleGlyph>
              <span style={{ fontSize: cfg.small, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.amber }}>{label}</span>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: cfg.cols === 1 ? '1fr' : '1fr 1fr', gap: cfg.gap, maxWidth: cfg.cols === 1 ? '100%' : 760, margin: '0 auto' }}>
          {aplicaciones.map((a, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', background: C.white, borderRadius: 10, border: `1.5px solid ${C.amber}`, padding: '10px 12px' }}>
              <span style={{ display: 'inline-flex', flexShrink: 0, marginTop: 1 }}>{G.check(18, C.amber)}</span>
              <span style={{ fontSize: cfg.body, lineHeight: 1.45 }}>{resumir(a, 130)}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ======================= 04 · ORACIÓN MINISTERIAL ======================= */}
      <section style={{ ...band, background: `linear-gradient(160deg, ${C.navy} 0%, ${C.navyDeep} 100%)` }}>
        <BandTitle lead="El recorrido termina en" main="Oración ministerial" dark accent={C.amberBright} cfg={cfg} />
        <div style={{ maxWidth: cfg.cols === 1 ? '100%' : 700, margin: '0 auto' }}>
          <div style={{ borderRadius: 14, border: `2px solid ${C.amberBright}`, background: 'rgba(255,255,255,0.08)', padding: '16px 18px' }}>
            <div style={{ fontSize: cfg.body + 1, fontStyle: 'italic', lineHeight: 1.6, color: C.white }}>{resumir(data.oracion || '', 480)}</div>
          </div>
          {puntos.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 16 }}>
              {puntos.slice(0, 5).map((p, i) => (
                <span key={i} style={{ fontSize: cfg.small, color: C.white, border: '1.5px solid #78a9ff', borderRadius: 999, padding: '4px 11px', background: 'rgba(15,98,254,0.18)' }}>
                  {resumir(p.punto || '', 34)}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      {/* ======================= PIE ======================= */}
      <footer style={{ background: C.navyDeep, padding: `16px ${cfg.pad}px`, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, color: '#a6c8ff', fontSize: cfg.small - 1, letterSpacing: '0.18em', textTransform: 'uppercase' }}>
        <span>TeoDoc · Análisis Ministerial</span>
        <span>RPM Ministry</span>
      </footer>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Exportación PNG: parte del artboard (tamaño de diseño fijo, no del viewport)
// y amplía el clon con transform para que el contenido llene el canvas exacto.
// Resultado: la infografía completa, sin hoja A4, sin recortes ni fondo extra.
// ---------------------------------------------------------------------------
export async function exportarInfografiaPng(node: HTMLElement): Promise<string> {
  const { default: domtoimage } = await import('dom-to-image-more')
  const ancho = node.offsetWidth
  const alto = node.offsetHeight
  if (!ancho || !alto) throw new Error('Artboard vacío')

  // Nitidez ~15 MP: nítido y por debajo del límite de canvas de Safari/iOS.
  const MAX_AREA = 15_000_000
  const escala = Math.min(3, Math.max(1.5, Math.sqrt(MAX_AREA / (ancho * alto))))

  // dom-to-image-more aplica width/height al clon y refluye su contenido; por
  // eso fijamos el clon en su tamaño natural y lo escalamos con transform.
  return domtoimage.toPng(node, {
    width: Math.round(ancho * escala),
    height: Math.round(alto * escala),
    style: {
      width: `${ancho}px`,
      height: `${alto}px`,
      transform: `scale(${escala})`,
      transformOrigin: 'top left',
    },
    bgcolor: '#FFFFFF',
  })
}

// ---------------------------------------------------------------------------
// Visualización responsive: elige variante por ancho real del contenedor y
// escala el artboard de diseño para conservar proporciones y jerarquía.
// NUNCA se usa para exportar: la exportación parte del artboard fijo de 900px.
// ---------------------------------------------------------------------------
export function ResponsiveInfografia({ data }: { data: InfografiaData }) {
  const hostRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const [hostW, setHostW] = useState(0)
  const [innerH, setInnerH] = useState(0)

  // El contenedor visible está acotado a 900px, así que el breakpoint se mide
  // sobre el ancho real disponible (no sobre el viewport).
  const variant: InfografiaVariant = hostW < 640 ? 'compact' : hostW < 860 ? 'medium' : 'wide'

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
    if (!inner) {
      setInnerH(0)
      return
    }
    const measure = () => setInnerH(inner.offsetHeight)
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(inner)
    return () => ro.disconnect()
  }, [variant])

  if (variant === 'compact') {
    return (
      <div ref={hostRef} style={{ width: '100%' }}>
        <Infografia data={data} variant="compact" />
      </div>
    )
  }

  const designW = variant === 'wide' ? 900 : 760
  const scale = hostW > 0 ? Math.min(1, hostW / designW) : 0

  return (
    <div ref={hostRef} style={{ width: '100%' }}>
      <div
        style={{
          width: innerH ? designW * scale : '100%',
          height: innerH ? innerH * scale : undefined,
          marginInline: 'auto',
          overflow: 'hidden',
        }}
      >
        <div ref={innerRef} style={{ width: designW, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
          <Infografia data={data} variant={variant} />
        </div>
      </div>
    </div>
  )
}
