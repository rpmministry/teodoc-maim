'use client'

import React, { useEffect, useRef, useState } from 'react'
import {
  Ilustracion,
  BarraProgreso,
  elegirIlustracion,
} from '@/components/ilustraciones'
import {
  CANVAS_W,
  CANVAS_H,
  PRESETS,
  metricasCanvas,
  construirUnidades,
  planificarInfografia,
  estimarAltoCabecera,
  estimarAltoPagina,
  type EntradaInfografia,
  type UnidadContenido,
  type PlanInfografia,
} from '@/lib/infografia-layout'

// ---------------------------------------------------------------------------
// Datos (estructuralmente compatibles con el análisis de /api/analyze).
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
    conexiones_biblicas?: { cita?: string; texto?: string }[]
    frase_recordar?: string
  }
  conceptos_clave?: string[]
  conceptos_teologicos?: { concepto?: string; significado?: string }[]
  desarrollo_progresivo?: Punto[]
  aplicacion?: string[]
  oracion?: string
}

export type InfografiaVariant = 'wide' | 'medium' | 'compact'

export function resumir(texto: string, max: number): string {
  const t = String(texto || '').replace(/\s+/g, ' ').trim()
  if (t.length <= max) return t
  const corte = t.slice(0, max)
  const fin = Math.max(corte.lastIndexOf('. '), corte.lastIndexOf('! '), corte.lastIndexOf('? '))
  if (fin >= Math.round(max * 0.35)) return corte.slice(0, fin + 1).trim()
  const punto = Math.max(corte.lastIndexOf('.'), corte.lastIndexOf('!'), corte.lastIndexOf('?'))
  if (punto >= Math.round(max * 0.35)) return corte.slice(0, punto + 1).trim()
  const fin2 = Math.max(corte.lastIndexOf(', '), corte.lastIndexOf('; '))
  if (fin2 >= Math.round(max * 0.5)) return corte.slice(0, fin2).trim()
  return t
}

// ---------------------------------------------------------------------------
// Identidad visual. La infografía es una pieza EDITORIAL libre (no replica el
// Carbon Design System de la interfaz): colorida, con profundidad y una paleta
// de acento que varía según el mensaje dentro de la marca TeoDoc.
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
  { base: '#e0a400', dark: '#7a5c00', soft: '#fff6d9' },
  { base: '#e4572e', dark: '#8f2d12', soft: '#ffede4' },
  { base: '#0fa3b1', dark: '#075e66', soft: '#e2f7f8' },
  { base: '#0f62fe', dark: '#002d9c', soft: '#edf5ff' },
  { base: '#8a3ffc', dark: '#491d8b', soft: '#f6f2ff' },
  { base: '#d02670', dark: '#740937', soft: '#fff0f6' },
  { base: '#198038', dark: '#0b4a20', soft: '#defbe6' },
]

function hashIndex(texto: string, n: number): number {
  let h = 0
  const s = texto || ''
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return n > 0 ? h % n : 0
}

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
  cross: (s: number, c: string) => svg(s, c, <><path d="M12 3v18M6 9h12" /></>),
}

const ICONO_POR_UNIDAD: Record<string, (s: number, c: string) => React.ReactNode> = {
  mensaje: G.target,
  'texto-clave': G.bible,
  verdad: G.spark,
  contexto: G.bible,
  puntos: G.list,
  palabras: G.tag,
  conexiones: G.list,
  frase: G.quote,
}

// Icono de marca TeoDoc (SIN wordmark: se eliminó el texto "TeoDoc" y su
// relleno, que dañaba la legibilidad). Trazo claro y limpio.
function TeoIcono(size: number) {
  const w = size
  const h = (size * 180) / 320
  return (
    <svg width={w} height={h} viewBox="0 0 320 180" aria-label="TeoDoc">
      <g transform="translate(160,90)">
        <rect x="-108" y="-62" width="216" height="124" rx="14" fill="none" stroke="#ffffff" strokeWidth="9" />
        <circle cx="-108" cy="0" r="20" fill="none" stroke="#ffffff" strokeWidth="9" />
        <circle cx="108" cy="0" r="20" fill="none" stroke="#ffffff" strokeWidth="9" />
        <rect x="-78" y="-32" width="96" height="11" rx="5" fill="#ffffff" />
        <rect x="-78" y="-6" width="96" height="11" rx="5" fill="#ffffff" />
        <rect x="-78" y="20" width="58" height="11" rx="5" fill="#ffffff" />
        <rect x="34" y="-38" width="9" height="20" rx="4" fill="#ffffff" />
        <rect x="52" y="-50" width="9" height="44" rx="4" fill="#ffffff" />
        <rect x="70" y="-32" width="9" height="20" rx="4" fill="#ffffff" />
      </g>
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Entrada estructural + plan (puro y determinista; lo comparte app/page.tsx).
// ---------------------------------------------------------------------------
export function construirEntrada(data: InfografiaData): EntradaInfografia {
  const info = data.infografia || {}
  const pasaje = data.texto_biblico_principal?.cita
    || (data.desarrollo_progresivo || []).find((p) => p.versiculos?.[0]?.cita)?.versiculos?.[0]?.cita
    || ''
  const puntos = (data.desarrollo_progresivo || [])
    .map((p) => ({ titulo: p.punto || '', detalle: p.explicacion || '' }))
    .filter((p) => p.titulo || p.detalle)
    .slice(0, 12)
  return {
    titulo: data.titulo || '',
    mensajeCentral: info.mensaje_central || data.idea_principal || '',
    pasaje,
    textoClave: info.texto_clave || data.texto_biblico_principal?.texto || '',
    verdadPrincipal: info.verdad_principal || data.tema_principal || '',
    contextoBreve: info.contexto_breve || data.contexto_biblico || '',
    puntos,
    grandes: (info.grandes_ensenanzas || []).slice(0, 10),
    palabras: (info.palabras_clave?.length ? info.palabras_clave : data.conceptos_clave || []).slice(0, 8),
    conexiones: (info.conexiones_biblicas || []).slice(0, 6),
    fraseRecordar: info.frase_recordar || info.frase_corta || '',
  }
}

const extraCabeceraProgreso = (mostrar: boolean) => (mostrar ? PRESETS[2].caption * 2.6 : 0)

export function planInfografia(data: InfografiaData): PlanInfografia {
  const m = metricasCanvas()
  const entrada = construirEntrada(data)
  const unidades = construirUnidades(entrada)
  const mostrarProgreso = unidades.length >= 5
  return planificarInfografia(unidades, {
    anchoContenido: m.anchoEsen,
    spineW: m.spineW,
    altoDisponible: m.altoBanda - 24,
    titulo: entrada.titulo || '',
    extraCabecera: extraCabeceraProgreso(mostrarProgreso),
    maxPaginasCarrusel: 6,
  })
}

// ---------------------------------------------------------------------------
// Render de una página (el canvas SIEMPRE es 1080×1920, 9:16 exacto).
// ---------------------------------------------------------------------------
export default function Infografia({ data, pagina = 0 }: { data: InfografiaData; pagina?: number; variant?: InfografiaVariant }) {
  const entrada = construirEntrada(data)
  const plan = planInfografia(data)
  const preset = PRESETS[plan.nivel]
  const m = metricasCanvas()
  const total = plan.paginas.length
  const idx = Math.max(0, Math.min(pagina, total - 1))
  const unidadesPagina = plan.paginas[idx] || []
  const mostrarProgreso = plan.modo === 'unico' && total === 1 && construirUnidades(entrada).length >= 5
  const tema = PALETA[hashIndex(entrada.titulo || 'teodoc', PALETA.length)]
  const tema2 = PALETA[(hashIndex(entrada.titulo || 'teodoc', PALETA.length) + 3) % PALETA.length]
  const fecha = new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })
  const temaNombre = data.tema_principal || 'Análisis bíblico'
  const ilustracionId = elegirIlustracion(`${entrada.titulo} ${entrada.mensajeCentral} ${entrada.pasaje} ${(entrada.palabras || []).join(' ')}`)
  const fuenteIlustracion = preset.ilustracion === 'grande' ? preset.icono * 1.5
    : preset.ilustracion === 'mediana' ? preset.icono * 1.15
      : preset.ilustracion === 'pequena' ? preset.icono * 0.85
        : 0

  const listaPuntos = (entrada.puntos && entrada.puntos.length)
    ? entrada.puntos
    : (entrada.grandes || []).map((g) => ({ titulo: g.titulo, detalle: g.descripcion }))

  const contenidoUnidad = (u: UnidadContenido): React.ReactNode => {
    switch (u.id) {
      case 'mensaje':
        return <p style={{ margin: 0, fontSize: preset.cuerpo, lineHeight: preset.lineHeight, color: C.ink, fontWeight: 600 }}>{resumir(entrada.mensajeCentral || '', 420)}</p>
      case 'texto-clave':
        return (
          <div>
            {entrada.pasaje ? <div style={{ fontSize: preset.tituloTarjeta * 0.82, fontWeight: 800, color: C.ink, marginBottom: 6 }}>{entrada.pasaje}</div> : null}
            {entrada.textoClave ? <p style={{ margin: 0, fontSize: preset.cuerpo, fontStyle: 'italic', lineHeight: preset.lineHeight, color: C.sub }}>“{resumir(entrada.textoClave, 420)}”</p> : null}
          </div>
        )
      case 'verdad':
        return <p style={{ margin: 0, fontSize: preset.cuerpo, lineHeight: preset.lineHeight, color: C.ink }}>{resumir(entrada.verdadPrincipal || '', 380)}</p>
      case 'contexto':
        return <p style={{ margin: 0, fontSize: preset.cuerpo, lineHeight: preset.lineHeight, color: C.sub }}>{resumir(entrada.contextoBreve || '', 380)}</p>
      case 'puntos': {
        const desde = u.desde ?? 0
        const items = listaPuntos.slice(desde, desde + u.items)
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: Math.round(preset.caption * 0.7) }}>
            {items.map((p, i) => {
              const pn = desde + i + 1
              const pal = PALETA[(pn - 1) % PALETA.length]
              return (
                <div key={pn} style={{ display: 'flex', gap: Math.round(preset.caption * 0.6), alignItems: 'flex-start' }}>
                  <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span style={{ width: preset.caption * 2.2, height: preset.caption * 2.2, borderRadius: '50%', background: pal.base, color: '#fff', fontWeight: 800, fontSize: preset.caption * 0.98, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {String(pn).padStart(2, '0')}
                    </span>
                    {i < items.length - 1 ? (
                      <span aria-hidden="true" style={{ display: 'flex', gap: 3, marginTop: 4 }}>
                        {Array.from({ length: 3 }).map((_, ci) => (
                          <span key={ci} style={{ width: 4, height: 4, borderRadius: '50%', background: pal.base, opacity: ci === 2 ? 0.5 : 1 }} />
                        ))}
                      </span>
                    ) : null}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    {p.titulo ? <div style={{ fontSize: preset.cuerpo, fontWeight: 700, color: C.ink, lineHeight: 1.25 }}>{resumir(p.titulo, 100)}</div> : null}
                    {preset.detallePuntos && p.detalle ? <div style={{ fontSize: preset.caption, color: C.sub, lineHeight: 1.4, marginTop: 2 }}>{resumir(p.detalle, preset.nivel <= 2 ? 200 : 120)}</div> : null}
                  </div>
                </div>
              )
            })}
          </div>
        )
      }
      case 'palabras': {
        const items = (entrada.palabras || []).slice(0, u.items)
        return (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: Math.round(preset.caption * 0.55) }}>
            {items.map((p, i) => {
              const pal = PALETA[i % PALETA.length]
              return (
                <span key={i} style={{ fontSize: preset.caption * 1.12, fontWeight: 700, color: pal.dark, background: pal.soft, border: `1.5px solid ${pal.base}`, borderRadius: 999, padding: `${Math.round(preset.caption * 0.3)}px ${Math.round(preset.caption * 0.85)}px` }}>
                  {p}
                </span>
              )
            })}
          </div>
        )
      }
      case 'conexiones': {
        const items = (entrada.conexiones || []).slice(0, u.items)
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: Math.round(preset.caption * 0.5) }}>
            {items.map((c, i) => (
              <div key={i} style={{ display: 'flex', gap: Math.round(preset.caption * 0.6), alignItems: 'baseline' }}>
                <span style={{ flexShrink: 0, fontSize: preset.caption * 1.02, fontWeight: 800, color: PALETA[i % PALETA.length].dark }}>{c.cita}</span>
                {c.texto ? <span style={{ fontSize: preset.caption, color: C.sub, lineHeight: 1.4 }}>{resumir(c.texto, 130)}</span> : null}
              </div>
            ))}
          </div>
        )
      }
      case 'frase':
        return <p style={{ margin: 0, fontSize: preset.tituloTarjeta * 0.9, lineHeight: 1.35, fontStyle: 'italic', color: C.ink, fontWeight: 600 }}>“{resumir(entrada.fraseRecordar || '', 260)}”</p>
      default:
        return null
    }
  }

  // ---- Relleno útil de la holgura (nunca color plano vacío) ----
  const altoCabPage = estimarAltoCabecera(entrada.titulo || '', preset, m.anchoEsen) + extraCabeceraProgreso(mostrarProgreso)
  const altoUsado = estimarAltoPagina(unidadesPagina, preset, m.anchoEsen, m.spineW, altoCabPage)
  const holgura = Math.max(0, m.altoBanda - 24 - altoUsado)

  const versiculosLibres = (data.desarrollo_progresivo || [])
    .flatMap((p) => p.versiculos || [])
    .filter((v) => v.cita && !(entrada.conexiones || []).some((c) => c.cita === v.cita))
    .filter((v, i, arr) => arr.findIndex((x) => x.cita === v.cita) === i)
    .slice(0, 2)
  const conceptoLibre = (data.conceptos_teologicos || []).find((c) => c.concepto && c.significado)
  const citaLibre = (entrada.puntos || []).map((p) => resumir(p.detalle || '', 160)).find((t) => t.length > 50 && !(entrada.mensajeCentral || '').includes(t.slice(0, 40)))

  const rellenos: { id: string; alto: number; nodo: React.ReactNode }[] = []
  rellenos.push({
    id: 'ilustracion',
    alto: Math.round(preset.icono * 2.4 + preset.caption * 4),
    nodo: (
      <div style={{ display: 'flex', alignItems: 'center', gap: Math.round(preset.caption * 1.2), background: `linear-gradient(120deg, ${tema.soft}, ${tema2.soft})`, border: `1.5px solid ${tema.base}55`, borderRadius: 18, padding: Math.round(preset.caption * 1.1), boxSizing: 'border-box' }}>
        <Ilustracion id={ilustracionId} size={Math.round(preset.icono * 1.9)} pal={tema} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: preset.caption * 0.9, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: tema.dark }}>Imagen del mensaje</span>
          <span style={{ fontSize: preset.cuerpo, fontWeight: 700, lineHeight: 1.35, color: C.ink }}>{resumir(entrada.verdadPrincipal || entrada.mensajeCentral || '', 120)}</span>
        </div>
      </div>
    ),
  })
  if (citaLibre) {
    rellenos.push({
      id: 'pull',
      alto: Math.round(preset.caption * 9),
      nodo: <div style={{ background: tema.soft, borderLeft: `8px solid ${tema.base}`, borderRadius: 14, padding: Math.round(preset.caption * 1.1), fontSize: preset.cuerpo, fontStyle: 'italic', color: C.ink, lineHeight: 1.45, boxSizing: 'border-box' }}>“{citaLibre}”</div>,
    })
  }
  versiculosLibres.forEach((v, i) => {
    rellenos.push({
      id: `verso-${i}`,
      alto: Math.round(preset.caption * 9),
      nodo: (
        <div style={{ background: '#fff', border: `1.5px solid ${PALETA[i % PALETA.length].soft}`, borderTop: `6px solid ${PALETA[i % PALETA.length].base}`, borderRadius: 14, padding: Math.round(preset.caption * 1.1), boxSizing: 'border-box' }}>
          <div style={{ fontSize: preset.caption * 1.05, fontWeight: 800, color: PALETA[i % PALETA.length].dark, marginBottom: 4 }}>{v.cita}</div>
          {v.texto ? <div style={{ fontSize: preset.caption, color: C.sub, lineHeight: 1.45 }}>“{resumir(v.texto, 150)}”</div> : null}
        </div>
      ),
    })
  })
  if (conceptoLibre) {
    rellenos.push({
      id: 'concepto',
      alto: Math.round(preset.caption * 8),
      nodo: (
        <div style={{ background: tema2.soft, border: `1.5px solid ${tema2.base}55`, borderRadius: 14, padding: Math.round(preset.caption * 1.1), boxSizing: 'border-box' }}>
          <div style={{ fontSize: preset.caption * 0.9, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: tema2.dark }}>Concepto teológico</div>
          <div style={{ fontSize: preset.cuerpo, fontWeight: 800, color: C.ink, marginTop: 2 }}>{resumir(conceptoLibre.concepto || '', 60)}</div>
          <div style={{ fontSize: preset.caption, color: C.sub, lineHeight: 1.4, marginTop: 2 }}>{resumir(conceptoLibre.significado || '', 180)}</div>
        </div>
      ),
    })
  }

  const elegidos: { id: string; nodo: React.ReactNode }[] = []
  let acumulado = 0
  for (const r of rellenos) {
    if (r.id === 'ilustracion') continue
    if (acumulado + r.alto > holgura - 40) break
    elegidos.push({ id: r.id, nodo: r.nodo })
    acumulado += r.alto
  }
  const altoIlustracion = holgura - acumulado

  return (
    <div
      style={{
        width: CANVAS_W,
        height: CANVAS_H,
        boxSizing: 'border-box',
        background: `linear-gradient(180deg, ${C.white} 0%, ${C.white} 40%, ${tema.soft} 70%, ${tema.soft} 100%)`,
        color: C.ink,
        fontFamily: 'var(--font-plex), system-ui, sans-serif',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Elementos visuales sutiles: degradado + círculos geométricos */}
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <svg width="100%" height="100%" viewBox="0 0 1080 1920" preserveAspectRatio="none">
          <defs>
            <linearGradient id="gradFondo" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(240,240,240,0.4)" />
              <stop offset="100%" stopColor="rgba(220,220,220,0.2)" />
            </linearGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#gradFondo)" />
          {Array.from({ length: 6 }).map((_, i) => {
            const x = Math.round(120 + (i * 160) % 800)
            const y = Math.round(280 + (i * 210) % 600)
            const size = Math.round(80 + ((i * 37) % 120))
            return (
              <circle key={i} cx={x} cy={y} r={size} fill={tema.base} opacity={0.06} />
            )
          })}
          <path d="M0 1400 Q 540 1200, 1080 1400" stroke={tema.base} strokeWidth="2" fill="none" opacity={0.12} />
          <path d="M0 1600 Q 540 1450, 1080 1600" stroke={tema.base} strokeWidth="2" fill="none" opacity={0.08} />
        </svg>
      </div>

      {/* ================= FRANJA SUPERIOR (funcional, ≤12%) ================= */}
      <div
        style={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: m.safeTop, boxSizing: 'border-box',
          background: `linear-gradient(135deg, ${tema.dark} 0%, ${C.navyDeep} 45%, ${tema.base} 135%)`,
          display: 'flex', alignItems: 'center', gap: Math.round(preset.caption * 1.2),
          padding: `0 ${m.safeLateral}px`, overflow: 'hidden',
        }}
      >
        <div style={{ position: 'relative', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
          {TeoIcono(preset.caption * 5.4)}
        </div>
        <div style={{ position: 'relative', flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: Math.round(preset.caption * 0.25) }}>
          <span style={{ fontSize: preset.caption * 0.98, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#ffffff', lineHeight: 1.24, overflowWrap: 'anywhere' }}>
            {temaNombre}
          </span>
          <span style={{ fontSize: preset.caption * 0.9, color: '#cfe0ff', letterSpacing: '0.05em' }}>{fecha}</span>
        </div>
        <div aria-hidden="true" style={{ position: 'relative', flexShrink: 0, opacity: 0.95 }}>
          <Ilustracion id={ilustracionId} size={Math.round(m.safeTop * 0.66)} pal={{ base: '#ffffff', dark: '#d6e4ff', soft: 'rgba(255,255,255,0.18)' }} />
        </div>
      </div>

      {/* ================= BANDA DE CONTENIDO (zona segura) ================= */}
      <div style={{ position: 'absolute', top: m.safeTop, left: 0, width: '100%', height: m.altoBanda, boxSizing: 'border-box', padding: `${Math.round(preset.caption * 0.7)}px ${m.safeLateral}px`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {total > 1 ? (
          <div style={{ position: 'absolute', top: Math.round(preset.caption * 0.5), right: m.safeLateral, background: tema.base, color: '#fff', fontWeight: 800, fontSize: preset.caption, borderRadius: 999, padding: `${Math.round(preset.caption * 0.28)}px ${Math.round(preset.caption * 0.75)}px`, zIndex: 3 }}>
            {idx + 1}/{total}
          </div>
        ) : null}

        {/* CABECERA: título + etiquetas (elementos esenciales, dentro de la zona segura) */}
        <header style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: Math.round(preset.caption * 0.5) }}>
            {entrada.pasaje ? (
              <span style={{ fontSize: preset.caption, fontWeight: 700, letterSpacing: '0.03em', borderRadius: 999, padding: `${Math.round(preset.caption * 0.3)}px ${Math.round(preset.caption * 0.8)}px`, background: tema.base, color: '#ffffff' }}>{entrada.pasaje}</span>
            ) : null}
          </div>
          <h1 style={{ margin: 0, lineHeight: 1.06, fontWeight: 800, letterSpacing: '-0.01em', fontSize: preset.display, color: C.ink, overflowWrap: 'anywhere' }}>
            {entrada.titulo || 'Análisis del mensaje'}
          </h1>
          <div style={{ width: Math.round(preset.numeral * 1.5), height: Math.round(preset.caption * 0.6), background: tema.base, borderRadius: 999, marginTop: Math.round(preset.caption * 0.6) }} />
          {mostrarProgreso ? (
            <div style={{ marginTop: Math.round(preset.caption * 0.7) }}>
              <BarraProgreso total={construirUnidades(entrada).length} colorActivo={tema.base} colorInactivo={C.rule} etiquetaColor={C.sub} small={preset.caption} />
            </div>
          ) : null}
        </header>

        {/* BLOQUES: todas las secciones con contenido real */}
        <div style={{ position: 'relative', flex: 1, minHeight: 0, paddingTop: Math.round(preset.gapTarjetas * 0.8), overflow: 'hidden' }}>
          {unidadesPagina.map((u, i) => {
            const num = String(i + 1).padStart(2, '0')
            const pal = PALETA[(i + 1) % PALETA.length]
            const icono = ICONO_POR_UNIDAD[u.id] || G.spark
            const esUltimo = i === unidadesPagina.length - 1 && elegidos.length === 0 && altoIlustracion <= 0
            return (
              <div key={`${u.id}-${u.desde ?? 0}`} style={{ position: 'relative', display: 'flex', gap: Math.round(preset.caption * 0.9), marginBottom: esUltimo ? 0 : preset.gapTarjetas }}>
                <div style={{ width: m.spineW, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                  <div
                    style={{
                      width: preset.numeral, height: preset.numeral, borderRadius: '50%', background: '#ffffff',
                      border: `4px solid ${tema.base}`, color: tema.dark, fontWeight: 800, fontSize: preset.numeral * 0.42,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(22,22,22,0.16)', position: 'relative', zIndex: 1,
                    }}
                  >
                    {num}
                  </div>
                  {!esUltimo ? (
                    <div aria-hidden="true" style={{ position: 'absolute', top: preset.numeral, bottom: -preset.gapTarjetas, width: 3, backgroundImage: `repeating-linear-gradient(to bottom, ${tema.base} 0 5px, transparent 5px 12px)`, opacity: 0.6 }} />
                  ) : null}
                </div>

                <div aria-hidden="true" style={{ position: 'absolute', top: Math.round(preset.numeral / 2 - preset.numeral * 0.6), left: m.spineW, width: Math.round(preset.caption * 1.6), height: Math.round(preset.numeral * 1.2), pointerEvents: 'none' }}>
                  <svg aria-hidden="true" width={Math.round(preset.caption * 1.6)} height={Math.round(preset.numeral * 1.2)} viewBox={`0 0 ${Math.round(preset.caption * 1.6)} ${Math.round(preset.numeral * 1.2)}`} fill="none">
                  <path d={`M0 ${Math.round(preset.numeral * 1.2 * 0.5)} Q ${Math.round(preset.caption * 0.8)} ${Math.round(preset.numeral * 1.2 * 0.3)}, ${Math.round(preset.caption * 1.6)} ${Math.round(preset.numeral * 1.2 * 0.5)}`} stroke={pal.base} strokeWidth="2" strokeDasharray={`${Math.round(preset.caption * 0.15)} ${Math.round(preset.caption * 0.1)}`} opacity="0.6" />
                </svg>
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ padding: `${Math.round(preset.padTarjeta * 0.8)}px 0 ${Math.round(preset.padTarjeta * 0.5)}px`, borderBottom: `2px solid ${pal.soft}`, position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: Math.round(preset.caption * 0.6), marginBottom: Math.round(preset.caption * 0.5) }}>
                      <span style={{ width: preset.caption * 1.5, height: preset.caption * 1.5, borderRadius: '50%', background: pal.base, color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {icono(preset.caption * 1.1, C.white)}
                      </span>
                      <span style={{ fontSize: preset.tituloTarjeta * 0.7, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: pal.dark, lineHeight: 1.1 }}>
                        {u.etiqueta}
                      </span>
                    </div>
                    <div style={{ position: 'relative' }}>{contenidoUnidad(u)}</div>
                  </div>
                </div>
              </div>
            )
          })}

          {/* RELLENO ÚTIL de la holgura */}
          {elegidos.map((r) => (
            <div key={r.id} style={{ width: '100%', marginBottom: preset.gapTarjetas }}>{r.nodo}</div>
          ))}
          {altoIlustracion > 140 ? (
            <div style={{ width: '100%', height: altoIlustracion, borderRadius: 18, overflow: 'hidden', background: `linear-gradient(120deg, ${tema.soft}, ${tema2.soft})`, border: `1.5px solid ${tema.base}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: Math.round(preset.caption * 1.2), boxSizing: 'border-box' }}>
              {fuenteIlustracion > 0 ? <Ilustracion id={ilustracionId} size={Math.min(altoIlustracion * 0.6, preset.icono * 2.2)} pal={tema} /> : null}
              <div style={{ maxWidth: '46%', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: preset.caption * 0.9, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: tema.dark }}>Imagen del mensaje</span>
                <span style={{ fontSize: preset.cuerpo, fontWeight: 700, color: C.ink, lineHeight: 1.35 }}>{resumir(entrada.verdadPrincipal || entrada.mensajeCentral || '', 120)}</span>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* ================= FRANJA INFERIOR (funcional, ≤14%) ================= */}
      <div
        style={{
          position: 'absolute', bottom: 0, left: 0, width: '100%', height: m.safeBottom, boxSizing: 'border-box',
          background: `linear-gradient(0deg, ${C.navyDeep} 0%, ${tema.dark} 60%, ${tema.base} 175%)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: `0 ${m.safeLateral}px`, overflow: 'hidden',
        }}
      >
        <div aria-hidden="true" style={{ display: 'flex', alignItems: 'center', gap: Math.round(preset.caption * 1.8), opacity: 0.95 }}>
          <Ilustracion id={ilustracionId} size={Math.round(m.safeBottom * 0.46)} pal={{ base: '#ffffff', dark: '#d6e4ff', soft: 'rgba(255,255,255,0.16)' }} />
          <Ilustracion id={elegirIlustracion(`${entrada.titulo} ${entrada.mensajeCentral} comunidad manosSostienen`)} size={Math.round(m.safeBottom * 0.46)} pal={{ base: '#ffffff', dark: '#d6e4ff', soft: 'rgba(255,255,255,0.16)' }} />
        </div>
        {total > 1 ? (
          <div style={{ position: 'absolute', right: m.safeLateral, background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.45)', color: '#ffffff', fontWeight: 800, fontSize: preset.caption, borderRadius: 999, padding: `${Math.round(preset.caption * 0.28)}px ${Math.round(preset.caption * 0.75)}px` }}>
            {idx + 1}/{total}
          </div>
        ) : null}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Exportación PNG (una sola imagen por página).
// ---------------------------------------------------------------------------
function asegurarPng(blob: Blob | null | undefined): Blob {
  if (!blob) throw new Error('La exportación no devolvió imagen')
  if (blob.type === 'image/png') return blob
  return new Blob([blob], { type: 'image/png' })
}

export async function exportarInfografiaPng(node: HTMLElement): Promise<string> {
  const { default: domtoimage } = await import('dom-to-image-more')
  const ancho = node.offsetWidth
  const alto = node.offsetHeight
  if (!ancho || !alto) throw new Error('Artboard vacío')
  const MAX_AREA = 14_000_000
  const MAX_DIM = 4096
  const escala = Math.min(1, Math.sqrt(MAX_AREA / (ancho * alto)), MAX_DIM / Math.max(ancho, alto))
  const intentar = (s: number) =>
    domtoimage.toPng(node, {
      width: Math.max(1, Math.round(ancho * s)),
      height: Math.max(1, Math.round(alto * s)),
      style: { width: `${ancho}px`, height: `${alto}px`, transform: `scale(${s})`, transformOrigin: 'top left' },
      bgcolor: '#FFFFFF',
    })
  try {
    return await intentar(escala)
  } catch {
    return await intentar(Math.max(0.35, escala * 0.6))
  }
}

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
    style: { width: `${ancho}px`, height: `${alto}px`, transform: `scale(${s})`, transformOrigin: 'top left' },
    bgcolor: '#FFFFFF',
  })
  let blob: Blob
  try {
    blob = await domtoimage.toBlob(node, opciones(escala))
  } catch {
    blob = await domtoimage.toBlob(node, opciones(Math.max(0.35, escala * 0.6)))
  }
  return asegurarPng(blob)
}

export async function exportarInfografiaFile(node: HTMLElement, nombre: string): Promise<File> {
  const blob = await exportarInfografiaBlob(node)
  const base = (nombre || 'teodoc-infografia').replace(/[.]+$/, '')
  const conExtension = base.toLowerCase().endsWith('.png') ? base : `${base}.png`
  return new File([blob], conExtension, { type: 'image/png' })
}

// ---------------------------------------------------------------------------
// Visualización responsive: muestra todas las páginas (carrusel) apiladas.
// ---------------------------------------------------------------------------
export function ResponsiveInfografia({ data }: { data: InfografiaData }) {
  const hostRef = useRef<HTMLDivElement>(null)
  const [hostW, setHostW] = useState(0)
  const [pagina, setPagina] = useState(0)
  const plan = planInfografia(data)
  const total = plan.paginas.length

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    const measure = () => setHostW(host.clientWidth)
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(host)
    return () => ro.disconnect()
  }, [])

  const scale = hostW > 0 ? hostW / CANVAS_W : 0
  const altoEscalado = CANVAS_H * scale

  return (
    <div ref={hostRef} style={{ width: '100%' }}>
      <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: CANVAS_W, height: altoEscalado || undefined, overflow: 'hidden' }}>
          <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: CANVAS_W, height: CANVAS_H }}>
            <Infografia data={data} pagina={pagina} />
          </div>
        </div>
      </div>
      {total > 1 ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 12 }}>
          <button type="button" onClick={() => setPagina((p) => Math.max(0, p - 1))} disabled={pagina === 0}
            style={{ padding: '6px 16px', fontSize: 13, fontWeight: 600, border: '1px solid #393939', borderRadius: 6, background: '#161616', color: pagina === 0 ? '#555' : '#c6c6c6', cursor: pagina === 0 ? 'default' : 'pointer' }}>
            Anterior
          </button>
          <span style={{ fontSize: 13, color: '#6f6f6f' }}>{pagina + 1} / {total}</span>
          <button type="button" onClick={() => setPagina((p) => Math.min(total - 1, p + 1))} disabled={pagina === total - 1}
            style={{ padding: '6px 16px', fontSize: 13, fontWeight: 600, border: '1px solid #393939', borderRadius: 6, background: '#161616', color: pagina === total - 1 ? '#555' : '#c6c6c6', cursor: pagina === total - 1 ? 'default' : 'pointer' }}>
            Siguiente
          </button>
        </div>
      ) : null}
      <p style={{ marginTop: 8, fontSize: 12, color: '#6f6f6f', textAlign: 'center' }}>
        Infografía 9:16 (1080×1920)
      </p>
    </div>
  )
}
