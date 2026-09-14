'use client'

import React, { useEffect, useRef, useState } from 'react'
import {
  Ilustracion,
  ConectorNodo,
  Breadcrumb,
  BarraProgreso,
  elegirIlustracion,
} from '@/components/ilustraciones'
import {
  CANVAS_W,
  CANVAS_H,
  PRESETS,
  PISO_LEGIBILIDAD,
  metricasCanvas,
  construirUnidades,
  planificarInfografia,
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
  { base: '#e0a400', dark: '#7a5c00', soft: '#fff6d9' },
  { base: '#e4572e', dark: '#8f2d12', soft: '#ffede4' },
  { base: '#0fa3b1', dark: '#075e66', soft: '#e2f7f8' },
  { base: '#0f62fe', dark: '#002d9c', soft: '#edf5ff' },
  { base: '#8a3ffc', dark: '#491d8b', soft: '#f6f2ff' },
  { base: '#d02670', dark: '#740937', soft: '#fff0f6' },
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
}

const ICONO_POR_UNIDAD: Record<string, (s: number, c: string) => React.ReactNode> = {
  mensaje: G.target,
  'texto-clave': G.bible,
  verdad: G.spark,
  contexto: G.bible,
  grandes: G.list,
  palabras: G.tag,
  conexiones: G.list,
  frase: G.quote,
}

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
// Entrada estructural + plan (puro y determinista; lo comparte app/page.tsx).
// ---------------------------------------------------------------------------
export function construirEntrada(data: InfografiaData): EntradaInfografia {
  const info = data.infografia || {}
  const pasaje = data.texto_biblico_principal?.cita
    || (data.desarrollo_progresivo || []).find((p) => p.versiculos?.[0]?.cita)?.versiculos?.[0]?.cita
    || ''
  return {
    titulo: data.titulo || '',
    mensajeCentral: info.mensaje_central || data.idea_principal || '',
    pasaje,
    textoClave: info.texto_clave || data.texto_biblico_principal?.texto || '',
    verdadPrincipal: info.verdad_principal || data.tema_principal || '',
    contextoBreve: info.contexto_breve || data.contexto_biblico || '',
    grandes: (info.grandes_ensenanzas || []).slice(0, 10),
    palabras: (info.palabras_clave?.length ? info.palabras_clave : data.conceptos_clave || []).slice(0, 8),
    conexiones: (info.conexiones_biblicas || []).slice(0, 6),
    fraseRecordar: info.frase_recordar || info.frase_corta || '',
  }
}

export function planInfografia(data: InfografiaData): PlanInfografia {
  const m = metricasCanvas()
  const entrada = construirEntrada(data)
  const unidades = construirUnidades(entrada)
  const mostrarProgreso = unidades.length >= 5
  const extraCabecera = mostrarProgreso ? PRESETS[2].caption * 2.6 : 0
  return planificarInfografia(unidades, {
    anchoContenido: m.anchoEsen,
    spineW: m.spineW,
    // Pequeño margen de seguridad para garantizar que nada se recorta.
    altoDisponible: m.altoBanda - 24,
    titulo: entrada.titulo || '',
    extraCabecera,
    maxPaginasCarrusel: 3,
  })
}

// ---------------------------------------------------------------------------
// Render de una página (el canvas SIEMPRE es 1080×1920, 9:16 exacto).
// ---------------------------------------------------------------------------
export default function Infografia({ data, pagina = 0 }: { data: InfografiaData; pagina?: number; variant?: InfografiaVariant }) {
  const uid = React.useId().replace(/[^a-zA-Z0-9]/g, '')
  const entrada = construirEntrada(data)
  const plan = planInfografia(data)
  const preset = PRESETS[plan.nivel]
  const m = metricasCanvas()
  const total = plan.paginas.length
  const idx = Math.max(0, Math.min(pagina, total - 1))
  const unidadesPagina = plan.paginas[idx] || []
  const mostrarProgreso = plan.modo === 'unico' && total === 1 && construirUnidades(entrada).length >= 5
  const tema = PALETA[hashIndex(entrada.titulo || 'teodoc', PALETA.length)]
  const fecha = new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })
  const ilustracionId = elegirIlustracion(`${entrada.titulo} ${entrada.mensajeCentral} ${entrada.pasaje} ${entrada.palabras?.join(' ')}`)
  const ilustracionTam = preset.ilustracion === 'grande' ? preset.icono * 1.5
    : preset.ilustracion === 'mediana' ? preset.icono * 1.15
      : preset.ilustracion === 'pequena' ? preset.icono * 0.85
        : 0

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
      case 'grandes': {
        const items = (entrada.grandes || []).slice(0, u.items)
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: Math.round(preset.caption * 0.7) }}>
            {items.map((g, i) => {
              const p = PALETA[(i + 1) % PALETA.length]
              return (
                <div key={i} style={{ display: 'flex', gap: Math.round(preset.caption * 0.6), alignItems: 'flex-start' }}>
                  <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span style={{ width: preset.caption * 2.2, height: preset.caption * 2.2, borderRadius: '50%', background: p.base, color: '#fff', fontWeight: 800, fontSize: preset.caption * 0.98, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    {i < items.length - 1 ? <Breadcrumb color={p.base} size={preset.caption * 1.1} /> : null}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    {g.titulo ? <div style={{ fontSize: preset.cuerpo, fontWeight: 700, color: C.ink, lineHeight: 1.25 }}>{resumir(g.titulo, 90)}</div> : null}
                    {g.descripcion ? <div style={{ fontSize: preset.caption, color: C.sub, lineHeight: 1.4, marginTop: 2 }}>{resumir(g.descripcion, 200)}</div> : null}
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

  return (
    <div
      style={{
        width: CANVAS_W,
        height: CANVAS_H,
        boxSizing: 'border-box',
        background: C.white,
        color: C.ink,
        fontFamily: 'var(--font-plex), system-ui, sans-serif',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* ZONA SUPERIOR RESERVADA (superposiciones de Stories) — solo fondo */}
      <div aria-hidden="true" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: m.safeTop, background: `linear-gradient(160deg, ${C.navy} 0%, ${C.navyDeep} 70%, #000a1f 100%)`, overflow: 'hidden' }}>
        <svg viewBox="0 0 1080 288" preserveAspectRatio="none" style={{ width: '100%', height: '100%', opacity: 0.2 }}>
          <defs>
            <pattern id={`grid-${uid}`} width="64" height="64" patternUnits="userSpaceOnUse">
              <path d="M64 0H0V64" fill="none" stroke={C.grid} strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="1080" height="288" fill={`url(#grid-${uid})`} />
        </svg>
      </div>

      {/* ZONA INFERIOR RESERVADA (caja de respuesta y reacciones) — solo fondo */}
      <div aria-hidden="true" style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: m.safeBottom, background: `linear-gradient(0deg, #000a1f 0%, ${C.navyDeep} 60%, ${C.navy} 100%)` }} />

      {/* BANDA DE CONTENIDO dentro de la zona segura ampliada */}
      <div style={{ position: 'absolute', top: m.safeTop, left: 0, width: '100%', height: m.altoBanda, boxSizing: 'border-box', padding: `0 ${m.safeLateral}px`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Ilustración temática de fondo (no compite con el texto) */}
        {ilustracionTam > 0 ? (
          <div aria-hidden="true" style={{ position: 'absolute', right: -preset.icono * 0.5, bottom: -preset.icono * 0.5, opacity: 0.08, pointerEvents: 'none' }}>
            <Ilustracion id={ilustracionId} size={preset.icono * 3.2} pal={tema} />
          </div>
        ) : null}

        {/* Marca de página (carrusel) en la esquina de la zona segura */}
        {total > 1 ? (
          <div style={{ position: 'absolute', top: Math.round(preset.caption * 0.6), right: m.safeLateral, background: tema.base, color: '#fff', fontWeight: 800, fontSize: preset.caption, borderRadius: 999, padding: `${Math.round(preset.caption * 0.28)}px ${Math.round(preset.caption * 0.75)}px`, zIndex: 3 }}>
            {idx + 1}/{total}
          </div>
        ) : null}

        {/* CABECERA */}
        <header style={{ position: 'relative', flexShrink: 0, paddingTop: Math.round(preset.caption * 0.6) }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: Math.round(preset.caption * 0.7) }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
              <span style={{ flexShrink: 0 }}>{TeoLogo(preset.caption * 8.5)}</span>
              <span style={{ fontSize: preset.caption, letterSpacing: '0.28em', textTransform: 'uppercase', color: C.sub }}>Análisis bíblico</span>
            </div>
            <span style={{ fontSize: preset.caption * 0.9, color: C.sub, letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{fecha}</span>
          </div>

          <h1 style={{ margin: 0, lineHeight: 1.06, fontWeight: 800, letterSpacing: '-0.01em', fontSize: preset.display, color: C.ink, overflowWrap: 'anywhere' }}>
            {entrada.titulo || 'Análisis del mensaje'}
          </h1>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: Math.round(preset.caption * 0.7) }}>
            {data.tema_principal ? (
              <span style={{ fontSize: preset.caption, fontWeight: 700, letterSpacing: '0.03em', borderRadius: 999, padding: `${Math.round(preset.caption * 0.3)}px ${Math.round(preset.caption * 0.8)}px`, background: tema.base, color: '#ffffff' }}>{data.tema_principal}</span>
            ) : null}
            {entrada.pasaje ? (
              <span style={{ fontSize: preset.caption, fontWeight: 700, letterSpacing: '0.03em', borderRadius: 999, padding: `${Math.round(preset.caption * 0.3)}px ${Math.round(preset.caption * 0.8)}px`, border: `1.5px solid ${tema.base}`, color: tema.dark }}>{entrada.pasaje}</span>
            ) : null}
          </div>

          {mostrarProgreso ? (
            <div style={{ marginTop: Math.round(preset.caption * 0.8) }}>
              <BarraProgreso total={construirUnidades(entrada).length} colorActivo={tema.base} colorInactivo={C.rule} etiquetaColor={C.sub} small={preset.caption} />
            </div>
          ) : null}
        </header>

        {/* BLOQUES (columna única con riel temporal) */}
        <div style={{ position: 'relative', flex: 1, minHeight: 0, paddingTop: Math.round(preset.gapTarjetas * 0.8) }}>
          {unidadesPagina.map((u, i) => {
            const num = String(i + 1).padStart(2, '0')
            const pal = PALETA[i % PALETA.length]
            const icono = ICONO_POR_UNIDAD[u.id] || G.spark
            const esUltimo = i === unidadesPagina.length - 1
            return (
              <div key={u.id} style={{ position: 'relative', display: 'flex', gap: Math.round(preset.caption * 0.9), marginBottom: esUltimo ? 0 : preset.gapTarjetas }}>
                {/* Riel + nodo */}
                <div style={{ width: m.spineW, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                  <div
                    style={{
                      width: preset.numeral,
                      height: preset.numeral,
                      borderRadius: '50%',
                      background: '#ffffff',
                      border: `4px solid ${tema.base}`,
                      color: tema.dark,
                      fontWeight: 800,
                      fontSize: preset.numeral * 0.42,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 12px rgba(22,22,22,0.16)',
                      position: 'relative',
                      zIndex: 1,
                    }}
                  >
                    {num}
                  </div>
                  {!esUltimo ? (
                    <div
                      aria-hidden="true"
                      style={{ position: 'absolute', top: preset.numeral, bottom: -preset.gapTarjetas, width: 3, backgroundImage: `repeating-linear-gradient(to bottom, ${tema.base} 0 5px, transparent 5px 12px)`, opacity: 0.6 }}
                    />
                  ) : null}
                </div>

                {/* Conector riel → tarjeta */}
                <div
                  aria-hidden="true"
                  style={{ position: 'absolute', top: Math.round(preset.numeral / 2 - preset.numeral * 0.6), left: m.spineW, width: Math.round(preset.caption * 1.6), height: Math.round(preset.numeral * 1.2), pointerEvents: 'none' }}
                >
                  <ConectorNodo lado="right" ancho={Math.round(preset.caption * 1.6)} alto={Math.round(preset.numeral * 1.2)} color={pal.base} />
                </div>

                {/* Tarjeta */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ background: '#ffffff', border: `1.5px solid ${pal.soft}`, borderRadius: 16, overflow: 'hidden', boxShadow: '0 8px 22px rgba(22,22,22,0.08)', position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: Math.round(preset.caption * 0.6), background: pal.base, color: '#ffffff', padding: `${Math.round(preset.caption * 0.55)}px ${Math.round(preset.caption * 0.85)}px` }}>
                      <span style={{ flexShrink: 0, width: preset.caption * 2.2, height: preset.caption * 2.2, borderRadius: '50%', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {icono(preset.caption * 1.35, pal.base)}
                      </span>
                      <span style={{ fontSize: preset.tituloTarjeta * 0.62, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: 1.1 }}>
                        {num} · {u.etiqueta}
                      </span>
                      {u.tipo === 'lista' ? (
                        <span style={{ marginLeft: 'auto', display: 'flex', opacity: 0.9 }} aria-hidden="true">
                          <Breadcrumb color="#ffffff" size={preset.caption * 1.1} />
                        </span>
                      ) : null}
                    </div>
                    <div style={{ padding: preset.padTarjeta, position: 'relative' }}>{contenidoUnidad(u)}</div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
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
  const total = planInfografia(data).paginas.length

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
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: scale ? Math.round(24 * scale) : 0 }}>
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} style={{ width: '100%', height: altoEscalado || undefined, overflow: 'hidden' }}>
            <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: CANVAS_W, height: CANVAS_H }}>
              <Infografia data={data} pagina={i} />
            </div>
          </div>
        ))}
      </div>
      <p style={{ marginTop: 8, fontSize: 12, color: '#6f6f6f', textAlign: 'center' }}>
        {total > 1 ? `Carrusel de ${total} imágenes 9:16 (1080×1920)` : 'Infografía 9:16 (1080×1920)'} · Nivel de densidad {PRESETS[planInfografia(data).nivel]?.nivel} · piso legible {PISO_LEGIBILIDAD.cuerpo}px
      </p>
    </div>
  )
}
