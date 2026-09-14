'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Ilustracion, Breadcrumb, elegirIlustracion, type IlustracionId } from '@/components/ilustraciones'
import { CANVAS_W, CANVAS_H, PRESETS, metricasCanvas } from '@/lib/infografia-layout'
import {
  construirModular,
  planificarModular,
  ilustracionDeCategoria,
  type BloqueModular,
  type CategoriaSVG,
  type EntradaModular,
  type FilaLayout,
  type InfografiaModular,
  type PlanModular,
} from '@/lib/infografia-modular'

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
// Identidad visual (pieza editorial libre, no replica el Design System de la UI).
// ---------------------------------------------------------------------------
const C = {
  ink: '#161616',
  sub: '#525252',
  rule: '#e0e0e0',
  white: '#ffffff',
  navy: '#002d9c',
  navyDeep: '#001141',
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

const PALETA_CATEGORIA: Record<CategoriaSVG, number> = {
  hogar: 0,
  fe: 5,
  camino: 2,
  milagro: 1,
  generico: 3,
}

function hashIndex(texto: string, n: number): number {
  let h = 0
  const s = texto || ''
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return n > 0 ? h % n : 0
}

function TeoIcono(size: number) {
  return (
    <svg width={size} height={(size * 180) / 320} viewBox="0 0 320 180" aria-label="TeoDoc">
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
// Análisis → entrada modular → plan (puro y determinista).
// ---------------------------------------------------------------------------
export function construirEntradaModular(data: InfografiaData): EntradaModular {
  const info = data.infografia || {}
  const pasaje = data.texto_biblico_principal?.cita
    || (data.desarrollo_progresivo || []).find((p) => p.versiculos?.[0]?.cita)?.versiculos?.[0]?.cita
    || ''
  const versiculos: Versiculo[] = [
    ...(data.texto_biblico_principal?.cita
      ? [{ cita: data.texto_biblico_principal.cita, texto: data.texto_biblico_principal.texto || '' }]
      : []),
    ...(data.desarrollo_progresivo || []).flatMap((p) => p.versiculos || []),
  ]
  return {
    titulo: data.titulo,
    temaPrincipal: data.tema_principal,
    ideaPrincipal: info.mensaje_central || data.idea_principal || '',
    mensajeCentral: info.mensaje_central || data.idea_principal || '',
    verdadPrincipal: info.verdad_principal || data.tema_principal || '',
    fraseRecordar: info.frase_recordar || info.frase_corta || '',
    contexto: info.contexto_breve || data.contexto_biblico || '',
    pasaje,
    textoClave: info.texto_clave || data.texto_biblico_principal?.texto || '',
    palabras: info.palabras_clave?.length ? info.palabras_clave : data.conceptos_clave || [],
    puntos: (data.desarrollo_progresivo || []).map((p) => ({ titulo: p.punto, detalle: p.explicacion })),
    versiculos,
    conexiones: info.conexiones_biblicas || [],
  }
}

export function planInfografia(data: InfografiaData): PlanModular {
  const m = metricasCanvas()
  const mod = construirModular(construirEntradaModular(data))
  return planificarModular(mod, { anchoContenido: m.anchoEsen, altoDisponible: m.altoBanda - 24, maxPaginasCarrusel: 4 })
}

export function modularDe(data: InfografiaData): InfografiaModular {
  return construirModular(construirEntradaModular(data))
}

// ---------------------------------------------------------------------------
// Icono + tarjeta modular
// ---------------------------------------------------------------------------
function IconoCategoria({ categoria, size, color }: { categoria: CategoriaSVG; size: number; color: string }) {
  const id = ilustracionDeCategoria(categoria) as IlustracionId
  return <Ilustracion id={id} size={size} pal={{ base: color, dark: color, soft: 'rgba(255,255,255,0.55)' }} />
}

function TarjetaModular({
  b,
  preset,
  pal,
  registrarRef,
  compacta = false,
}: {
  b: BloqueModular
  preset: (typeof PRESETS)[keyof typeof PRESETS]
  pal: Paleta
  registrarRef: (el: HTMLDivElement | null) => void
  compacta?: boolean
}) {
  return (
    <div
      ref={registrarRef}
      style={{
        background: '#ffffff',
        border: `1.5px solid ${pal.soft}`,
        borderTop: `6px solid ${pal.base}`,
        borderRadius: 16,
        boxShadow: '0 8px 22px rgba(22,22,22,0.08)',
        padding: preset.padTarjeta,
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        gap: Math.round(preset.caption * 0.5),
        minWidth: 0,
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: Math.round(preset.caption * 0.55) }}>
        <span style={{ flexShrink: 0, width: preset.icono * 0.78, height: preset.icono * 0.78, borderRadius: '50%', background: pal.soft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <IconoCategoria categoria={b.categoriaSVG} size={preset.icono * 0.62} color={pal.base} />
        </span>
        <span style={{ fontSize: preset.cuerpo * 1.02, fontWeight: 800, color: C.ink, lineHeight: 1.2, overflowWrap: 'anywhere' }}>
          {b.titulo}
        </span>
      </div>
      {b.texto ? (
        <p style={{ margin: 0, fontSize: compacta ? preset.caption : preset.caption * 1.06, lineHeight: 1.45, color: C.sub, overflowWrap: 'anywhere' }}>
          {b.texto}
        </p>
      ) : null}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Render de una página (canvas SIEMPRE 1080×1920, 9:16 exacto).
// ---------------------------------------------------------------------------
export default function Infografia({ data, pagina = 0 }: { data: InfografiaData; pagina?: number; variant?: InfografiaVariant }) {
  const plan = planInfografia(data)
  const preset = PRESETS[plan.nivel]
  const m = metricasCanvas()
  const total = plan.paginas.length
  const idx = Math.max(0, Math.min(pagina, total - 1))
  const filas = plan.paginas[idx] || []
  const tema = PALETA[hashIndex(plan.cabecera.titulo || 'teodoc', PALETA.length)]
  const fecha = new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })
  const ilustracionId = elegirIlustracion(`${plan.cabecera.titulo} ${plan.cabecera.subtitulo} ${plan.cabecera.palabras_clave.join(' ')}`)

  const rootRef = useRef<HTMLDivElement>(null)
  const refsBloques = useRef<Record<string, HTMLDivElement | null>>({})
  const [posiciones, setPosiciones] = useState<Record<string, { x: number; y: number }>>({})

  // Mide la posición real de cada bloque para dibujar las flechas curvas.
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const idsPagina = new Set(filas.flatMap((f) => f.bloques.map((b) => b.id)))
    const medir = () => {
      const rb = root.getBoundingClientRect()
      const p: Record<string, { x: number; y: number }> = {}
      for (const [id, el] of Object.entries(refsBloques.current)) {
        if (!el || !idsPagina.has(id)) continue
        const r = el.getBoundingClientRect()
        p[id] = { x: r.left - rb.left + r.width / 2, y: r.top - rb.top + r.height / 2 }
      }
      setPosiciones(p)
    }
    const ro = new ResizeObserver(() => medir())
    ro.observe(root)
    const t = setTimeout(medir, 60)
    return () => { ro.disconnect(); clearTimeout(t) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan.nivel, plan.paginas.length, idx])

  const conexionesPagina = plan.conexiones_visuales.filter((c) => posiciones[c.origen_id] && posiciones[c.destino_id])

  const renderFila = (fila: FilaLayout, fi: number) => {
    if (fila.tipo_fila === 'grid_columnas') {
      return (
        <div key={`f${fi}`} style={{ display: 'grid', gridTemplateColumns: `repeat(${fila.columnas}, 1fr)`, gap: Math.round(preset.caption * 0.9), marginBottom: preset.gapTarjetas }}>
          {fila.bloques.map((b, i) => (
            <TarjetaModular key={b.id} b={b} preset={preset} pal={PALETA[(PALETA_CATEGORIA[b.categoriaSVG] + i) % PALETA.length]} compacta={fila.columnas === 3} registrarRef={(el) => { refsBloques.current[b.id] = el }} />
          ))}
        </div>
      )
    }
    if (fila.tipo_fila === 'timeline_secuencial') {
      return (
        <div key={`f${fi}`} style={{ display: 'flex', flexDirection: 'column', marginBottom: preset.gapTarjetas }}>
          {fila.bloques.map((b, i) => (
            <div key={b.id} style={{ display: 'flex', gap: Math.round(preset.caption * 0.8), alignItems: 'stretch' }}>
              <div style={{ width: preset.numeral, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ width: preset.numeral, height: preset.numeral, borderRadius: '50%', background: tema.base, color: '#fff', fontWeight: 800, fontSize: preset.numeral * 0.42, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(22,22,22,0.18)' }}>
                  {b.paso || String(i + 1).padStart(2, '0')}
                </span>
                {i < fila.bloques.length - 1 ? (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: Math.round(preset.caption * 1.6) }}>
                    <div aria-hidden="true" style={{ flex: 1, width: 3, backgroundImage: `repeating-linear-gradient(to bottom, ${tema.base} 0 5px, transparent 5px 12px)`, opacity: 0.75 }} />
                    <Breadcrumb color={tema.base} size={preset.caption * 1.3} />
                  </div>
                ) : null}
              </div>
              <div style={{ flex: 1, minWidth: 0, paddingBottom: Math.round(preset.caption * 0.7) }}>
                <TarjetaModular b={b} preset={preset} pal={PALETA[(PALETA_CATEGORIA[b.categoriaSVG] + i) % PALETA.length]} registrarRef={(el) => { refsBloques.current[b.id] = el }} />
              </div>
            </div>
          ))}
        </div>
      )
    }
    // destacado_ancho_completo
    return (
      <div key={`f${fi}`} style={{ display: 'flex', flexDirection: 'column', gap: Math.round(preset.caption * 0.7), marginBottom: preset.gapTarjetas }}>
        {fila.bloques.map((b, i) => {
          const pal = PALETA[(i + 4) % PALETA.length]
          const esVersiculo = b.tipo === 'versiculo'
          return (
            <div key={b.id} ref={(el) => { refsBloques.current[b.id] = el }} style={{ width: '100%', boxSizing: 'border-box', background: `linear-gradient(120deg, ${pal.soft}, #ffffff)`, border: `1.5px solid ${pal.base}55`, borderLeft: `10px solid ${pal.base}`, borderRadius: 16, padding: Math.round(preset.padTarjeta * 1.1), display: 'flex', gap: Math.round(preset.caption * 1), alignItems: 'flex-start' }}>
              <span style={{ flexShrink: 0, width: preset.icono * 0.9, height: preset.icono * 0.9, borderRadius: '50%', background: '#ffffff', border: `2px solid ${pal.base}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconoCategoria categoria={b.categoriaSVG} size={preset.icono * 0.7} color={pal.base} />
              </span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: preset.caption * 1.02, fontWeight: 800, letterSpacing: '0.05em', textTransform: esVersiculo ? 'none' : 'uppercase', color: pal.dark, marginBottom: 4 }}>{b.titulo}</div>
                <div style={{ fontSize: esVersiculo ? preset.caption * 1.12 : preset.cuerpo, fontStyle: esVersiculo ? 'italic' : 'normal', color: C.ink, lineHeight: 1.45, fontWeight: esVersiculo ? 500 : 700 }}>
                  {esVersiculo ? `“${b.texto}”` : b.texto}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div
      ref={rootRef}
      style={{
        width: CANVAS_W,
        height: CANVAS_H,
        boxSizing: 'border-box',
        background: `linear-gradient(180deg, ${C.white} 0%, ${C.white} 62%, ${tema.soft} 100%)`,
        color: C.ink,
        fontFamily: 'var(--font-plex), system-ui, sans-serif',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* ================= FRANJA SUPERIOR (funcional, ≤12%) ================= */}
      <div
        style={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: m.safeTop, boxSizing: 'border-box',
          background: `linear-gradient(135deg, ${tema.dark} 0%, ${C.navyDeep} 45%, ${tema.base} 135%)`,
          display: 'flex', alignItems: 'center', gap: Math.round(preset.caption * 1.2),
          padding: `0 ${m.safeLateral}px`, overflow: 'hidden',
        }}
      >
        <div style={{ position: 'relative', flexShrink: 0, display: 'flex', alignItems: 'center' }}>{TeoIcono(preset.caption * 5.4)}</div>
        <div style={{ position: 'relative', flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: Math.round(preset.caption * 0.25) }}>
          <span style={{ fontSize: preset.caption * 0.98, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#ffffff', lineHeight: 1.24, overflowWrap: 'anywhere' }}>
            {data.tema_principal || 'Análisis bíblico'}
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
          <div style={{ position: 'absolute', top: Math.round(preset.caption * 0.4), right: m.safeLateral, background: tema.base, color: '#fff', fontWeight: 800, fontSize: preset.caption, borderRadius: 999, padding: `${Math.round(preset.caption * 0.26)}px ${Math.round(preset.caption * 0.72)}px`, zIndex: 6 }}>
            {idx + 1}/{total}
          </div>
        ) : null}

        {/* CABECERA MODULAR */}
        <header style={{ position: 'relative', flexShrink: 0 }}>
          <h1 style={{ margin: 0, lineHeight: 1.04, fontWeight: 800, letterSpacing: '-0.01em', fontSize: preset.display, color: C.ink, overflowWrap: 'anywhere' }}>
            {plan.cabecera.titulo}
          </h1>
          {plan.cabecera.subtitulo ? (
            <p style={{ margin: `${Math.round(preset.caption * 0.4)}px 0 0`, fontSize: preset.cuerpo * 1.05, color: C.sub, lineHeight: 1.35 }}>
              {plan.cabecera.subtitulo}
            </p>
          ) : null}
          {plan.cabecera.palabras_clave.length ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: Math.round(preset.caption * 0.45), marginTop: Math.round(preset.caption * 0.6) }}>
              {plan.cabecera.palabras_clave.map((p, i) => {
                const pal = PALETA[i % PALETA.length]
                return (
                  <span key={i} style={{ fontSize: preset.caption, fontWeight: 700, color: pal.dark, background: pal.soft, border: `1.5px solid ${pal.base}`, borderRadius: 999, padding: `${Math.round(preset.caption * 0.26)}px ${Math.round(preset.caption * 0.8)}px` }}>
                    {p}
                  </span>
                )
              })}
            </div>
          ) : null}
        </header>

        {/* FILAS MODULARES */}
        <div style={{ position: 'relative', flex: 1, minHeight: 0, paddingTop: Math.round(preset.gapTarjetas * 1.1), overflow: 'hidden' }}>
          {filas.map((f, i) => renderFila(f, i))}
        </div>
      </div>

      {/* CONEXIONES VISUALES (hilo conductor) */}
      {conexionesPagina.length ? (
        <svg aria-hidden="true" viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`} width={CANVAS_W} height={CANVAS_H} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 4 }}>
          <defs>
            <marker id="teo-arrow" markerWidth="12" markerHeight="12" refX="8" refY="6" orient="auto">
              <path d="M0 0 L12 6 L0 12 z" fill={tema.base} opacity="0.8" />
            </marker>
          </defs>
          {conexionesPagina.map((c, i) => {
            const a = posiciones[c.origen_id]
            const b = posiciones[c.destino_id]
            const curva = a.y < b.y ? 80 : -80
            const d = `M ${a.x} ${a.y} Q ${(a.x + b.x) / 2 + curva} ${(a.y + b.y) / 2} ${b.x} ${b.y}`
            return <path key={i} d={d} fill="none" stroke={tema.base} strokeWidth={3} strokeDasharray="3 9" strokeLinecap="round" markerEnd="url(#teo-arrow)" opacity={0.6} />
          })}
        </svg>
      ) : null}

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
          <Ilustracion id={elegirIlustracion(`${plan.cabecera.titulo} comunidad manosSostienen`)} size={Math.round(m.safeBottom * 0.46)} pal={{ base: '#ffffff', dark: '#d6e4ff', soft: 'rgba(255,255,255,0.16)' }} />
        </div>
        {total > 1 ? (
          <div style={{ position: 'absolute', right: m.safeLateral, background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.45)', color: '#ffffff', fontWeight: 800, fontSize: preset.caption, borderRadius: 999, padding: `${Math.round(preset.caption * 0.26)}px ${Math.round(preset.caption * 0.72)}px` }}>
            {idx + 1}/{total}
          </div>
        ) : null}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Exportación PNG (una imagen por página).
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
// Visualización responsive: todas las páginas (carrusel) apiladas.
// ---------------------------------------------------------------------------
export function ResponsiveInfografia({ data }: { data: InfografiaData }) {
  const hostRef = useRef<HTMLDivElement>(null)
  const [hostW, setHostW] = useState(0)
  const total = planInfografia(data).paginas.length

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    const measure = () => setHostW(host.clientWidth)
    const ro = new ResizeObserver(measure)
    ro.observe(host)
    const t = setTimeout(measure, 40)
    return () => { ro.disconnect(); clearTimeout(t) }
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
        {total > 1 ? `Carrusel de ${total} imágenes 9:16 (1080×1920)` : 'Infografía 9:16 (1080×1920)'}
      </p>
    </div>
  )
}
