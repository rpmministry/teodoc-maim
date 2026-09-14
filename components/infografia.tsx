'use client'

import React, { useEffect, useRef, useState } from 'react'
import {
  IlustracionEditorial,
  elegirIlustracion,
  categoriaIlustracion,
  type IlustracionId,
  type PaletaIlustracion,
} from '@/components/ilustraciones'
import {
  CANVAS_W,
  CANVAS_H,
  SAFE_TOP,
  SAFE_BOTTOM,
  SAFE_LATERAL,
  planificarComposicion,
  resumirEditorial,
  type EntradaInfografia,
  type PuntoEditorial,
} from '@/lib/infografia-layout'

// ---------------------------------------------------------------------------
// Tipos de Datos (compatibles con el análisis de /api/analyze y app/page.tsx).
// ---------------------------------------------------------------------------
export type Versiculo = { cita: string; texto: string }
export type Punto = {
  punto: string
  explicacion: string
  subtemas?: { titulo: string; desarrollo: string }[]
  versiculos?: Versiculo[]
}

export type InfografiaData = {
  titulo?: string
  idea_principal?: string
  tema_principal?: string
  proposito?: string
  contexto_general?: string
  texto_biblico_principal?: { cita?: string; texto?: string }
  otros_textos?: Versiculo[]
  contexto_biblico?: string
  contexto_historico?: string
  contexto_literario?: string
  relacion_textos?: string
  interpretacion?: string
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
  ensenanzas?: { sobre?: string; ensenanza?: string }[]
  aplicacion?: string[]
  oracion?: string
  conclusion?: string
}

export function resumir(texto: string, max: number): string {
  return resumirEditorial(texto, max)
}

// ---------------------------------------------------------------------------
// Paletas Carbon / TeoDoc (Semánticas, contraste alto, inspiradas en IBM Carbon)
// ---------------------------------------------------------------------------
const PALETAS: PaletaIlustracion[] = [
  // 0: Carbon Blue 60 + Cyan 40 (Clásico tecnológico y doctrinal)
  { primary: '#0f62fe', secondary: '#0043ce', accent: '#33b1ff', glow: '#78a9ff' },
  // 1: Amber 50 + Gold (Templo, gloria y sabiduría)
  { primary: '#d25f00', secondary: '#8a3800', accent: '#f1c21b', glow: '#fddc69' },
  // 2: Purple 60 + Magenta (Majestad, realeza y pacto)
  { primary: '#8a3ffc', secondary: '#6929c4', accent: '#d12771', glow: '#d4bbff' },
  // 3: Teal 50 + Green (Vida, provisión y esperanza)
  { primary: '#007d79', secondary: '#005d5d', accent: '#24a148', glow: '#6fdc8c' },
  // 4: Coral 50 + Flame (Avivamiento, celo y redención)
  { primary: '#da1e28', secondary: '#a2191f', accent: '#ff8389', glow: '#ffd7d9' },
  // 5: Cool Gray / Slate Tech (Precisión exegética)
  { primary: '#1192e8', secondary: '#00539a', accent: '#00bcd4', glow: '#a6c8ff' },
]

function hashColor(texto: string, max: number): number {
  let h = 0
  const s = texto || 'teodoc'
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return max > 0 ? h % max : 0
}

// Badge Isotipo Carbon / TeoDoc
function TeoDocBadge({ color }: { color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <svg width={26} height={26} viewBox="0 0 100 100" aria-label="TeoDoc">
        <rect x="6" y="6" width="88" height="88" rx="14" fill="#161616" stroke={color} strokeWidth="6" />
        <line x1="24" y1="30" x2="76" y2="30" stroke="#ffffff" strokeWidth="8" strokeLinecap="round" />
        <line x1="24" y1="50" x2="58" y2="50" stroke="#ffffff" strokeWidth="8" strokeLinecap="round" />
        <line x1="24" y1="70" x2="68" y2="70" stroke={color} strokeWidth="8" strokeLinecap="round" />
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#f4f4f4' }}>
          TEODOC
        </span>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color }}>
          ANÁLISIS EDITORIAL
        </span>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Extracción Completa de Datos Reales (Sin inventar nada)
// ---------------------------------------------------------------------------
export function construirEntrada(data: InfografiaData): EntradaInfografia {
  const info = data.infografia || {}

  const pasaje =
    data.texto_biblico_principal?.cita ||
    (data.desarrollo_progresivo || []).flatMap((p) => p.versiculos || []).find((v) => v.cita)?.cita ||
    ''

  const textoClave =
    info.texto_clave ||
    data.texto_biblico_principal?.texto ||
    (data.desarrollo_progresivo || []).flatMap((p) => p.versiculos || []).find((v) => v.texto)?.texto ||
    ''

  // Puntos principales del sermón
  const puntosRaw = (data.desarrollo_progresivo && data.desarrollo_progresivo.length > 0)
    ? data.desarrollo_progresivo.map((p) => ({
        titulo: p.punto || '',
        detalle: p.explicacion || '',
        versiculo: p.versiculos?.[0]?.cita,
      }))
    : (info.grandes_ensenanzas || []).map((g) => ({
        titulo: g.titulo || '',
        detalle: g.descripcion || '',
        versiculo: undefined,
      }))

  const puntos = puntosRaw.filter((p) => p.titulo || p.detalle)

  // Extraer versículos relevantes secundarios REALES del análisis (otros_textos, puntos, conexiones)
  const citaPrincipal = pasaje.trim().toLowerCase()
  const otrosVersiculosRaw: { cita: string; texto: string }[] = []

  if (Array.isArray(data.otros_textos)) {
    for (const v of data.otros_textos) {
      if (v?.cita && v.cita.trim().toLowerCase() !== citaPrincipal && !otrosVersiculosRaw.some((x) => x.cita === v.cita)) {
        otrosVersiculosRaw.push({ cita: v.cita.trim(), texto: v.texto ? v.texto.trim() : '' })
      }
    }
  }
  if (Array.isArray(data.desarrollo_progresivo)) {
    for (const p of data.desarrollo_progresivo) {
      for (const v of p.versiculos || []) {
        if (v?.cita && v.cita.trim().toLowerCase() !== citaPrincipal && !otrosVersiculosRaw.some((x) => x.cita === v.cita)) {
          otrosVersiculosRaw.push({ cita: v.cita.trim(), texto: v.texto ? v.texto.trim() : '' })
        }
      }
    }
  }
  if (Array.isArray(info.conexiones_biblicas)) {
    for (const c of info.conexiones_biblicas) {
      if (c?.cita && c.cita.trim().toLowerCase() !== citaPrincipal && !otrosVersiculosRaw.some((x) => x.cita === c.cita)) {
        otrosVersiculosRaw.push({ cita: c.cita.trim(), texto: c.texto ? c.texto.trim() : '' })
      }
    }
  }
  const otrosVersiculos = otrosVersiculosRaw.filter((v) => v.cita).slice(0, 2)

  // Extraer enseñanzas doctrinales reales
  const doctrinasRaw: { sobre: string; ensenanza: string }[] = []
  if (Array.isArray(data.ensenanzas)) {
    for (const e of data.ensenanzas) {
      if (e?.ensenanza) {
        doctrinasRaw.push({ sobre: e.sobre || 'Doctrina', ensenanza: e.ensenanza.trim() })
      }
    }
  }
  if (doctrinasRaw.length === 0 && Array.isArray(data.conceptos_teologicos)) {
    for (const c of data.conceptos_teologicos) {
      if (c?.concepto && c?.significado) {
        doctrinasRaw.push({ sobre: c.concepto.trim(), ensenanza: c.significado.trim() })
      }
    }
  }

  const conceptos = (info.palabras_clave?.length
    ? info.palabras_clave
    : (data.conceptos_clave || []).slice(0, 6)
  ).filter(Boolean)

  return {
    titulo: data.titulo || 'Análisis Bíblico',
    tema: data.tema_principal || 'Doctrina y Vida Cristiana',
    mensajeCentral: info.mensaje_central || data.idea_principal || '',
    pasaje,
    textoClave,
    verdadPrincipal: info.verdad_principal || data.tema_principal || '',
    contextoBreve: info.contexto_breve || data.contexto_biblico || data.contexto_historico || '',
    puntos,
    otrosVersiculos,
    doctrinas: doctrinasRaw.slice(0, 2),
    conceptos,
    conexiones: (info.conexiones_biblicas || []).slice(0, 4),
    fraseRecordar: info.frase_recordar || info.frase_corta || data.conclusion || '',
  }
}

export function planInfografia(data: InfografiaData) {
  const entrada = construirEntrada(data)
  const plan = planificarComposicion(entrada)
  return {
    ...plan,
    paginas: [plan.puntos],
    modo: 'unico' as const,
  }
}

// ---------------------------------------------------------------------------
// Componente de Infografía Editorial 9:16 (1080×1920)
// Con retícula estructurada estilo Carbon, balance completo sin vacíos
// ---------------------------------------------------------------------------
export default function Infografia({ data }: { data: InfografiaData; pagina?: number }) {
  const entrada = construirEntrada(data)
  const plan = planificarComposicion(entrada)
  const palIndex = hashColor(entrada.titulo + entrada.tema, PALETAS.length)
  const pal = PALETAS[palIndex]

  const semillaIlustracion = `${entrada.titulo} ${entrada.tema} ${entrada.mensajeCentral} ${entrada.pasaje} ${entrada.conceptos.join(' ')}`
  const ilustracionId: IlustracionId = elegirIlustracion(semillaIlustracion)
  const categoriaTema = categoriaIlustracion(ilustracionId)
  const fechaHoy = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })

  const { arquetipo, puntos, escala, versiculosApoyo, doctrinas, mostrarVersiculosApoyo, mostrarDoctrina } = plan

  return (
    <div
      style={{
        width: CANVAS_W,
        height: CANVAS_H,
        boxSizing: 'border-box',
        backgroundColor: '#161616', // Carbon Gray 100 base
        backgroundImage: 'radial-gradient(circle at 80% 10%, #1f293d 0%, #161616 60%), radial-gradient(circle at 20% 90%, #1a2233 0%, #161616 55%)',
        color: '#f4f4f4',
        fontFamily: 'var(--font-plex), system-ui, -apple-system, sans-serif',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* ================= RETÍCULA ESTRUCTURADA CARBON ================= */}
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <svg width="100%" height="100%" viewBox="0 0 1080 1920" preserveAspectRatio="none">
          <defs>
            {/* Grid Carbon de 64 px con líneas delgadas */}
            <pattern id="carbon-grid" width="64" height="64" patternUnits="userSpaceOnUse">
              <path d="M 64 0 L 0 0 0 64" fill="none" stroke="rgba(255, 255, 255, 0.03)" strokeWidth="1" />
            </pattern>
            <radialGradient id="glow-ambient" cx="50%" cy="25%" r="45%">
              <stop offset="0%" stopColor={pal.accent} stopOpacity="0.14" />
              <stop offset="100%" stopColor="#161616" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#carbon-grid)" />
          <circle cx="540" cy="500" r="500" fill="url(#glow-ambient)" />

          {/* Guías estructurales Carbon (reglas de acento precisas) */}
          <line x1={SAFE_LATERAL} y1={SAFE_TOP} x2={CANVAS_W - SAFE_LATERAL} y2={SAFE_TOP} stroke={pal.accent} strokeWidth="2" strokeOpacity="0.4" />
          <line x1={SAFE_LATERAL} y1={CANVAS_H - SAFE_BOTTOM} x2={CANVAS_W - SAFE_LATERAL} y2={CANVAS_H - SAFE_BOTTOM} stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
          
          {/* Marcadores de cruce en esquinas estilo Carbon (+) */}
          <path d={`M ${SAFE_LATERAL - 8} ${SAFE_TOP} H ${SAFE_LATERAL + 8} M ${SAFE_LATERAL} ${SAFE_TOP - 8} V ${SAFE_TOP + 8}`} stroke={pal.accent} strokeWidth="1.5" />
          <path d={`M ${CANVAS_W - SAFE_LATERAL - 8} ${SAFE_TOP} H ${CANVAS_W - SAFE_LATERAL + 8} M ${CANVAS_W - SAFE_LATERAL} ${SAFE_TOP - 8} V ${SAFE_TOP + 8}`} stroke={pal.accent} strokeWidth="1.5" />
          <path d={`M ${SAFE_LATERAL - 8} ${CANVAS_H - SAFE_BOTTOM} H ${SAFE_LATERAL + 8} M ${SAFE_LATERAL} ${CANVAS_H - SAFE_BOTTOM - 8} V ${CANVAS_H - SAFE_BOTTOM + 8}`} stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
          <path d={`M ${CANVAS_W - SAFE_LATERAL - 8} ${CANVAS_H - SAFE_BOTTOM} H ${CANVAS_W - SAFE_LATERAL + 8} M ${CANVAS_W - SAFE_LATERAL} ${CANVAS_H - SAFE_BOTTOM - 8} V ${CANVAS_H - SAFE_BOTTOM + 8}`} stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
        </svg>
      </div>

      {/* ================= CONTENIDO ESTRUCTURADO CONTINUO ================= */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          height: '100%',
          boxSizing: 'border-box',
          padding: `${SAFE_TOP}px ${SAFE_LATERAL}px ${SAFE_BOTTOM}px`,
          display: 'flex',
          flexDirection: 'column',
          gap: 14, // Ritmo visual continuo, sin espacios vacíos
        }}
      >
        {/* ---------------- 1. HEADER SHELL CARBON ---------------- */}
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingBottom: 12,
            borderBottom: '1px solid #393939',
            flexShrink: 0,
          }}
        >
          <TeoDocBadge color={pal.accent} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              style={{
                fontSize: 11,
                fontFamily: 'monospace',
                fontWeight: 700,
                color: pal.accent,
                background: '#262626',
                border: `1px solid ${pal.accent}66`,
                borderRadius: 2,
                padding: '3px 10px',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              {categoriaTema}
            </span>
            <span style={{ fontSize: 12, color: '#a8a8a8', fontFamily: 'monospace', letterSpacing: '0.05em' }}>
              {fechaHoy}
            </span>
            <span style={{ fontSize: 11, color: '#6f6f6f', fontFamily: 'monospace' }}>
              [ 1080×1920 ]
            </span>
          </div>
        </header>

        {/* ---------------- 2. HERO: TÍTULO & IDEA PRINCIPAL ---------------- */}
        <section style={{ flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: pal.accent }}>
              // TEMA PRINCIPAL
            </span>
            <span style={{ fontSize: 11, color: '#6f6f6f' }}>•</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#c6c6c6' }}>
              {entrada.tema}
            </span>
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: escala.display,
              fontWeight: 800,
              lineHeight: 1.08,
              letterSpacing: '-0.02em',
              color: '#ffffff',
              overflowWrap: 'break-word',
            }}
          >
            {entrada.titulo}
          </h1>

          {entrada.mensajeCentral ? (
            <div
              style={{
                marginTop: 10,
                background: '#262626',
                borderLeft: `4px solid ${pal.accent}`,
                borderTop: '1px solid #393939',
                borderRight: '1px solid #393939',
                borderBottom: '1px solid #393939',
                borderRadius: 2,
                padding: '12px 18px',
              }}
            >
              <div style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: pal.accent, marginBottom: 3 }}>
                IDEA CENTRAL DEL EXPOSITOR
              </div>
              <p
                style={{
                  margin: 0,
                  fontSize: escala.subtitulo,
                  fontWeight: 500,
                  lineHeight: 1.34,
                  color: '#e0e0e0',
                }}
              >
                {resumirEditorial(entrada.mensajeCentral, 240)}
              </p>
            </div>
          ) : null}
        </section>

        {/* ---------------- 3. SPOTLIGHT BÍBLICO PRINCIPAL ---------------- */}
        {entrada.textoClave || entrada.pasaje ? (
          <section
            style={{
              flexShrink: 0,
              background: '#1f1f1f',
              border: '1px solid #393939',
              borderTop: `2px solid ${pal.accent}`,
              borderRadius: 2,
              padding: '14px 18px',
              position: 'relative',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: pal.accent }}>
                  PASO BÍBLICO FUNDAMENTAL
                </span>
              </div>
              {entrada.pasaje ? (
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 800,
                    fontFamily: 'monospace',
                    letterSpacing: '0.06em',
                    color: '#ffffff',
                    background: '#262626',
                    border: '1px solid #525252',
                    padding: '2px 8px',
                    borderRadius: 2,
                  }}
                >
                  {entrada.pasaje}
                </span>
              ) : null}
            </div>

            {entrada.textoClave ? (
              <p
                style={{
                  margin: 0,
                  fontSize: escala.biblia,
                  fontStyle: 'italic',
                  fontWeight: 400,
                  lineHeight: 1.38,
                  color: '#f4f4f4',
                }}
              >
                “{resumirEditorial(entrada.textoClave, 280)}”
              </p>
            ) : null}
          </section>
        ) : null}

        {/* ---------------- 4. NUEVO: PASAJES BÍBLICOS DE APOYO (RELLENO REAL) ---------------- */}
        {mostrarVersiculosApoyo && versiculosApoyo.length > 0 ? (
          <section style={{ flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <span style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#a8a8a8' }}>
                // PASAJES BÍBLICOS RELACIONADOS
              </span>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: versiculosApoyo.length > 1 ? '1fr 1fr' : '1fr',
                gap: 10,
              }}
            >
              {versiculosApoyo.map((v, i) => (
                <div
                  key={i}
                  style={{
                    background: '#262626',
                    border: '1px solid #393939',
                    borderLeft: `3px solid ${pal.secondary}`,
                    borderRadius: 2,
                    padding: '8px 12px',
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 800, color: pal.accent, fontFamily: 'monospace', marginBottom: 2 }}>
                    {v.cita}
                  </div>
                  {v.texto ? (
                    <p style={{ margin: 0, fontSize: 13, color: '#c6c6c6', fontStyle: 'italic', lineHeight: 1.3 }}>
                      “{v.texto}”
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {/* ---------------- 5. DESARROLLO: GRANDES ENSEÑANZAS (ESTILO CARBON TILE) ---------------- */}
        <section style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, flexShrink: 0 }}>
            <span style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: pal.accent }}>
              // ENSEÑANZAS Y ESTRUCTURA TEOLÓGICA ({puntos.length} PUNTOS)
            </span>
            <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#6f6f6f' }}>
              CARBON GRID 2-COL
            </span>
          </div>

          {arquetipo === 'breve' ? (
            /* ===== ARQUETIPO BREVE: PUNTOS AMPLIOS + ILUSTRACIÓN HERO LATERAL ===== */
            <div style={{ display: 'flex', gap: 14, height: '100%', alignItems: 'stretch' }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, justifyContent: 'center' }}>
                {puntos.map((p) => (
                  <div
                    key={p.numeral}
                    style={{
                      background: '#262626',
                      border: '1px solid #393939',
                      borderTop: `2px solid ${pal.accent}`,
                      borderRadius: 2,
                      padding: '12px 16px',
                      position: 'relative',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 4 }}>
                      <span style={{ fontSize: escala.numeral, fontWeight: 800, fontFamily: 'monospace', color: pal.accent, lineHeight: 1 }}>
                        {p.numeral}
                      </span>
                      <h3 style={{ margin: 0, fontSize: escala.tituloPunto, fontWeight: 700, color: '#ffffff', lineHeight: 1.25 }}>
                        {p.titulo}
                      </h3>
                    </div>
                    {p.detalle ? (
                      <p style={{ margin: 0, fontSize: escala.cuerpoPunto, color: '#c6c6c6', lineHeight: 1.4 }}>
                        {p.detalle}
                      </p>
                    ) : null}
                    {p.versiculo ? (
                      <span style={{ display: 'inline-block', marginTop: 6, fontSize: 11, fontFamily: 'monospace', fontWeight: 700, color: pal.glow }}>
                        [{p.versiculo}]
                      </span>
                    ) : null}
                  </div>
                ))}
              </div>

              {/* Marco técnico Carbon para la ilustración */}
              <div
                style={{
                  width: 280,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#1f1f1f',
                  border: '1px solid #393939',
                  borderRadius: 2,
                  padding: 12,
                  boxSizing: 'border-box',
                  position: 'relative',
                }}
              >
                <div style={{ position: 'absolute', top: 8, left: 10, fontSize: 9, fontFamily: 'monospace', color: '#6f6f6f' }}>
                  SIMBOLOGÍA BÍBLICA
                </div>
                <IlustracionEditorial id={ilustracionId} size={220} pal={pal} modo="hero" />
                <div style={{ marginTop: 8, textAlign: 'center' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, fontFamily: 'monospace', color: pal.accent, textTransform: 'uppercase' }}>
                    {categoriaTema}
                  </span>
                </div>
              </div>
            </div>
          ) : arquetipo === 'medio' ? (
            /* ===== ARQUETIPO MEDIO: GRID 2 COLUMNAS + ILUSTRACIÓN COMPACTA ===== */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, height: '100%', justifyContent: 'center' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {puntos.slice(0, 4).map((p) => (
                  <div
                    key={p.numeral}
                    style={{
                      background: '#262626',
                      border: '1px solid #393939',
                      borderTop: `2px solid ${pal.accent}`,
                      borderRadius: 2,
                      padding: '10px 14px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'flex-start',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                      <span style={{ fontSize: escala.numeral, fontWeight: 800, fontFamily: 'monospace', color: pal.accent, lineHeight: 1 }}>
                        {p.numeral}
                      </span>
                      <h3 style={{ margin: 0, fontSize: escala.tituloPunto, fontWeight: 700, color: '#ffffff', lineHeight: 1.2 }}>
                        {p.titulo}
                      </h3>
                    </div>
                    {p.detalle ? (
                      <p style={{ margin: 0, fontSize: escala.cuerpoPunto, color: '#c6c6c6', lineHeight: 1.35 }}>
                        {p.detalle}
                      </p>
                    ) : null}
                    {p.versiculo ? (
                      <span style={{ marginTop: 4, fontSize: 10, fontFamily: 'monospace', fontWeight: 700, color: pal.glow }}>
                        [{p.versiculo}]
                      </span>
                    ) : null}
                  </div>
                ))}
              </div>

              {/* Fila con el 5to punto + ilustración Carbon */}
              <div style={{ display: 'grid', gridTemplateColumns: puntos[4] ? '1.4fr 1fr' : '1fr', gap: 10, alignItems: 'center' }}>
                {puntos[4] ? (
                  <div
                    style={{
                      background: '#262626',
                      border: '1px solid #393939',
                      borderTop: `2px solid ${pal.accent}`,
                      borderRadius: 2,
                      padding: '10px 14px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                      <span style={{ fontSize: escala.numeral, fontWeight: 800, fontFamily: 'monospace', color: pal.accent, lineHeight: 1 }}>
                        {puntos[4].numeral}
                      </span>
                      <h3 style={{ margin: 0, fontSize: escala.tituloPunto, fontWeight: 700, color: '#ffffff', lineHeight: 1.2 }}>
                        {puntos[4].titulo}
                      </h3>
                    </div>
                    {puntos[4].detalle ? (
                      <p style={{ margin: 0, fontSize: escala.cuerpoPunto, color: '#c6c6c6', lineHeight: 1.35 }}>
                        {puntos[4].detalle}
                      </p>
                    ) : null}
                  </div>
                ) : null}

                <div
                  style={{
                    height: 100,
                    borderRadius: 2,
                    background: '#1f1f1f',
                    border: '1px solid #393939',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                  }}
                >
                  <IlustracionEditorial id={ilustracionId} size={110} pal={pal} modo="medio" />
                </div>
              </div>
            </div>
          ) : (
            /* ===== ARQUETIPO EXTENSO: GRID DENSO DE 2 COLUMNAS (HASTA 10 PUNTOS) ===== */
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 8,
                height: '100%',
                alignContent: 'center',
              }}
            >
              {puntos.map((p) => (
                <div
                  key={p.numeral}
                  style={{
                    background: '#262626',
                    border: '1px solid #393939',
                    borderLeft: `3px solid ${pal.accent}`,
                    borderRadius: 2,
                    padding: '8px 12px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <span style={{ fontSize: escala.numeral, fontWeight: 800, fontFamily: 'monospace', color: pal.accent, lineHeight: 1 }}>
                      {p.numeral}
                    </span>
                    <h3 style={{ margin: 0, fontSize: escala.tituloPunto, fontWeight: 700, color: '#ffffff', lineHeight: 1.18 }}>
                      {p.titulo}
                    </h3>
                  </div>
                  {p.detalle ? (
                    <p style={{ margin: 0, fontSize: escala.cuerpoPunto, color: '#a8a8a8', lineHeight: 1.3 }}>
                      {p.detalle}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ---------------- 6. NUEVO: BLOQUE DOCTRINAL / TEOLÓGICO (CARBON TILE) ---------------- */}
        {mostrarDoctrina && doctrinas.length > 0 ? (
          <section
            style={{
              flexShrink: 0,
              background: '#262626',
              border: '1px solid #393939',
              borderLeft: `4px solid ${pal.glow}`,
              borderRadius: 2,
              padding: '10px 16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
              <span style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: pal.accent }}>
                // ENSEÑANZA DOCTRINAL: {doctrinas[0].sobre}
              </span>
            </div>
            <p style={{ margin: 0, fontSize: 14, color: '#e0e0e0', lineHeight: 1.35 }}>
              {resumirEditorial(doctrinas[0].ensenanza, 190)}
            </p>
          </section>
        ) : null}

        {/* ---------------- 7. CONCEPTOS CLAVE (TAGS CARBON) ---------------- */}
        {entrada.conceptos.length > 0 ? (
          <section
            style={{
              flexShrink: 0,
              display: 'flex',
              flexWrap: 'wrap',
              gap: 6,
              alignItems: 'center',
            }}
          >
            <span style={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 800, color: '#8d8d8d', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              CONCEPTOS CLAVE:
            </span>
            {entrada.conceptos.map((c, i) => (
              <span
                key={i}
                style={{
                  fontSize: 12,
                  fontFamily: 'monospace',
                  fontWeight: 600,
                  color: '#f4f4f4',
                  background: '#262626',
                  border: '1px solid #525252',
                  borderRadius: 2,
                  padding: '2px 8px',
                }}
              >
                #{c}
              </span>
            ))}
          </section>
        ) : null}

        {/* ---------------- 8. CIERRE / VERDAD PARA RECORDAR ---------------- */}
        <footer
          style={{
            flexShrink: 0,
            background: '#1f1f1f',
            border: '1px solid #393939',
            borderLeft: `5px solid ${pal.accent}`,
            borderRadius: 2,
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: pal.accent }}>
              VERDAD PARA RECORDAR // CONCLUSIÓN
            </span>
            <p
              style={{
                margin: '3px 0 0',
                fontSize: arquetipo === 'extenso' ? 17 : 20,
                fontWeight: 600,
                fontStyle: 'italic',
                color: '#ffffff',
                lineHeight: 1.3,
              }}
            >
              “{resumirEditorial(entrada.fraseRecordar || entrada.verdadPrincipal || entrada.mensajeCentral, 200)}”
            </p>
          </div>

          <div style={{ flexShrink: 0 }}>
            <TeoDocBadge color={pal.accent} />
          </div>
        </footer>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Exportación PNG (Siempre 1 Sola Imagen PNG, 1080×1920 real, compatible iOS)
// ---------------------------------------------------------------------------
function asegurarPng(blob: Blob | null | undefined): Blob {
  if (!blob) throw new Error('La exportación no devolvió imagen')
  if (blob.type === 'image/png') return blob
  return new Blob([blob], { type: 'image/png' })
}

export async function exportarInfografiaBlob(node: HTMLElement): Promise<Blob> {
  const { default: domtoimage } = await import('dom-to-image-more')
  const ancho = node.offsetWidth || CANVAS_W
  const alto = node.offsetHeight || CANVAS_H
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
    bgcolor: '#161616',
  })

  let blob: Blob
  try {
    blob = await domtoimage.toBlob(node, opciones(escala))
  } catch {
    blob = await domtoimage.toBlob(node, opciones(Math.max(0.4, escala * 0.65)))
  }
  return asegurarPng(blob)
}

export async function exportarInfografiaPng(node: HTMLElement): Promise<string> {
  const { default: domtoimage } = await import('dom-to-image-more')
  const ancho = node.offsetWidth || CANVAS_W
  const alto = node.offsetHeight || CANVAS_H
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
    bgcolor: '#161616',
  })

  try {
    return await domtoimage.toPng(node, opciones(escala))
  } catch {
    return await domtoimage.toPng(node, opciones(Math.max(0.4, escala * 0.65)))
  }
}

export async function exportarInfografiaFile(node: HTMLElement, nombre: string): Promise<File> {
  const blob = await exportarInfografiaBlob(node)
  const base = (nombre || 'teodoc-infografia').replace(/[.]+$/, '')
  const conExtension = base.toLowerCase().endsWith('.png') ? base : `${base}.png`
  return new File([blob], conExtension, { type: 'image/png' })
}

// ---------------------------------------------------------------------------
// Visualización Responsive (Escala limpia del lienzo 1080×1920 en 1 sola lámina)
// ---------------------------------------------------------------------------
export function ResponsiveInfografia({ data }: { data: InfografiaData }) {
  const hostRef = useRef<HTMLDivElement>(null)
  const [hostW, setHostW] = useState(0)

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
    <div ref={hostRef} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div
        style={{
          width: '100%',
          maxWidth: CANVAS_W,
          height: altoEscalado || undefined,
          overflow: 'hidden',
          borderRadius: 4,
          boxShadow: '0 24px 60px rgba(0,0,0,0.65)',
          border: '1px solid #393939',
        }}
      >
        <div
          style={{
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            width: CANVAS_W,
            height: CANVAS_H,
          }}
        >
          <Infografia data={data} />
        </div>
      </div>
      <p style={{ marginTop: 12, fontSize: 13, color: '#8d8d8d', textAlign: 'center', fontFamily: 'monospace' }}>
        INFOGRAFÍA EDITORIAL 9:16 (1080×1920) · SISTEMA DE DISEÑO CARBON · ALTA DEFINICIÓN
      </p>
    </div>
  )
}
