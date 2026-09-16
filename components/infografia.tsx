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
// Paletas TeoDoc (Soberbias, ministeriales, alto contraste, sin estridencias)
// ---------------------------------------------------------------------------
const PALETAS: PaletaIlustracion[] = [
  // 0: Azul Canónico TeoDoc & Cian Tecnológico (Identidad oficial)
  { primary: '#0f62fe', secondary: '#0043ce', accent: '#38bdf8', glow: '#78a9ff' },
  // 1: Oro del Templo & Ámbar Sagrado (Cálido y solemne)
  { primary: '#d97706', secondary: '#92400e', accent: '#fbbf24', glow: '#fde68a' },
  // 2: Zafiro Real & Celeste Ministerial (Soberano, limpio y ministerial)
  { primary: '#2563eb', secondary: '#1d4ed8', accent: '#60a5fa', glow: '#bfdbfe' },
  // 3: Azul Marino Profundo & Aguamarina Exegética
  { primary: '#0284c7', secondary: '#0369a1', accent: '#38bdf8', glow: '#7dd3fc' },
  // 4: Esmeralda Bíblica & Verde Esperanza (Gracia de vida)
  { primary: '#059669', secondary: '#047857', accent: '#34d399', glow: '#a7f3d0' },
]

function hashColor(texto: string, max: number): number {
  let h = 0
  const s = texto || 'teodoc'
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return max > 0 ? h % max : 0
}

// Icono Oficial TeoDoc (Geometría canónica de Logotipos/logos svg/teodoc-icono.svg)
export function TeoDocOficialIcon({
  size = 40,
  bg = '#0f62fe',
  style,
}: {
  size?: number
  bg?: string
  style?: React.CSSProperties
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 256 256"
      style={{ display: 'block', flexShrink: 0, ...style }}
      aria-label="TeoDoc"
    >
      <rect x="0" y="0" width="256" height="256" rx="48" fill={bg} />
      <g transform="translate(128,128)">
        <rect x="-58" y="-40" width="116" height="80" fill="#ffffff" />
        <circle cx="-58" cy="0" r="12" fill="#ffffff" />
        <circle cx="58" cy="0" r="12" fill="#ffffff" />
        <rect x="-44" y="-20" width="58" height="6" fill={bg} />
        <rect x="-44" y="-4" width="58" height="6" fill={bg} />
        <rect x="-44" y="12" width="34" height="6" fill={bg} />
        <rect x="22" y="-24" width="5" height="12" fill={bg} />
        <rect x="32" y="-30" width="5" height="24" fill={bg} />
        <rect x="42" y="-20" width="5" height="12" fill={bg} />
      </g>
    </svg>
  )
}

// Miniatura temática para cajones
function IconoMiniPunto({ color }: { color: string }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 26,
        height: 26,
        borderRadius: 6,
        background: 'rgba(255, 255, 255, 0.08)',
        border: `1px solid ${color}44`,
        flexShrink: 0,
      }}
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    </span>
  )
}

export type TemaInfografia = 'oscuro' | 'claro'

// Badge de Marca TeoDoc con Icono Oficial
function TeoDocBadge({ color, tema = 'oscuro' }: { color?: string; tema?: TemaInfografia }) {
  const esClaro = tema === 'claro'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <TeoDocOficialIcon size={42} bg="#0f62fe" />
      <span
        style={{
          fontSize: 20,
          fontWeight: 800,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: esClaro ? '#161616' : '#ffffff',
          lineHeight: 1,
        }}
      >
        TEO<span style={{ color: esClaro ? '#0f62fe' : '#78a9ff' }}>DOC</span>
      </span>
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
export default function Infografia({
  data,
  pagina = 0,
  tema = 'oscuro',
}: {
  data: InfografiaData
  pagina?: number
  tema?: TemaInfografia
}) {
  const entrada = construirEntrada(data)
  const plan = planificarComposicion(entrada)
  const palIndex = hashColor(entrada.titulo + entrada.tema, PALETAS.length)
  const esClaro = tema === 'claro'
  const pal = esClaro
    ? { primary: '#0f62fe', secondary: '#0043ce', accent: '#0f62fe', glow: '#d0e2ff' }
    : PALETAS[palIndex]

  const semillaIlustracion = `${entrada.titulo} ${entrada.tema} ${entrada.mensajeCentral} ${entrada.pasaje} ${entrada.conceptos.join(' ')}`
  const ilustracionId: IlustracionId = elegirIlustracion(semillaIlustracion)
  const categoriaTema = categoriaIlustracion(ilustracionId)
  const fechaHoy = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })

  const { arquetipo, puntos, escala, versiculosApoyo, doctrinas, mostrarVersiculosApoyo, mostrarDoctrina } = plan

  // Tokens de estilo según el tema (Oscuro Obsidiana vs Claro Editorial)
  const theme = {
    bgLienzo: esClaro ? '#ffffff' : '#161616',
    bgGradiente: esClaro
      ? 'radial-gradient(circle at 85% 8%, rgba(15, 98, 254, 0.05) 0%, #ffffff 65%), radial-gradient(circle at 15% 92%, rgba(0, 67, 206, 0.03) 0%, #ffffff 60%)'
      : `radial-gradient(circle at 85% 8%, ${pal.primary}24 0%, #161616 65%), radial-gradient(circle at 15% 92%, ${pal.secondary}20 0%, #161616 60%)`,
    colorTextoPrincipal: esClaro ? '#161616' : '#ffffff',
    colorTextoCuerpo: esClaro ? '#393939' : '#c6c6c6',
    colorTextoMuted: esClaro ? '#6f6f6f' : '#8d8d8d',
    bordeSutil: esClaro ? '#e0e0e0' : 'rgba(255, 255, 255, 0.1)',
    cardBg: esClaro
      ? '#ffffff'
      : 'linear-gradient(135deg, rgba(255,255,255,0.045) 0%, rgba(255,255,255,0.015) 100%)',
    cardBoxShadow: esClaro ? '0 2px 8px rgba(15, 98, 254, 0.04)' : 'none',
    tagBg: esClaro ? 'rgba(15, 98, 254, 0.07)' : 'rgba(255, 255, 255, 0.08)',
    tagBorde: esClaro ? 'rgba(15, 98, 254, 0.2)' : 'rgba(255, 255, 255, 0.16)',
    tagColor: esClaro ? '#0043ce' : '#ffffff',
    vitrinaBg: esClaro
      ? 'radial-gradient(circle at center, rgba(15,98,254,0.07) 0%, rgba(15,98,254,0.01) 75%)'
      : 'radial-gradient(circle at center, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.015) 75%)',
    vitrinaBorde: esClaro ? '#e0e0e0' : 'rgba(255, 255, 255, 0.12)',
    footerBg: esClaro
      ? '#f4f4f4'
      : 'linear-gradient(90deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
    gridPatternStroke: esClaro ? 'rgba(15, 98, 254, 0.035)' : 'rgba(255, 255, 255, 0.024)',
    glowStopColor: esClaro ? '#0f62fe' : pal.accent,
    glowStopOpacity: esClaro ? '0.07' : '0.14',
    glowEndColor: esClaro ? '#ffffff' : '#161616',
    curveGradStop1: esClaro ? '#0f62fe' : pal.accent,
    curveGradStop2: esClaro ? '#0043ce' : pal.primary,
    curveGradStop3: esClaro ? '#0f62fe' : pal.accent,
    curveGradOpacity1: esClaro ? '0.45' : '0.6',
    curveGradOpacity2: esClaro ? '0.28' : '0.35',
    curveGradOpacity3: esClaro ? '0.5' : '0.7',
    curvaOpacity: esClaro ? '0.26' : '0.32',
    lineaSuperiorStroke: esClaro ? '#0f62fe' : pal.accent,
    lineaSuperiorOpacity: esClaro ? '0.25' : '0.38',
    lineaInferiorStroke: esClaro ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.14)',
    lineasLateralesStroke: esClaro ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.06)',
  }

  return (
    <div
      style={{
        width: CANVAS_W,
        height: CANVAS_H,
        boxSizing: 'border-box',
        backgroundColor: theme.bgLienzo,
        backgroundImage: theme.bgGradiente,
        color: theme.colorTextoPrincipal,
        fontFamily: 'var(--font-plex), system-ui, -apple-system, sans-serif',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* ================= RETÍCULA ESTRUCTURADA, GUÍAS Y CURVAS CONECTORAS ================= */}
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <svg width="100%" height="100%" viewBox="0 0 1080 1920" preserveAspectRatio="none">
          <defs>
            {/* Grid base de 64 px con líneas muy sutiles */}
            <pattern id={esClaro ? "carbon-grid-claro" : "carbon-grid-oscuro"} width="64" height="64" patternUnits="userSpaceOnUse">
              <path d="M 64 0 L 0 0 0 64" fill="none" stroke={theme.gridPatternStroke} strokeWidth="1" />
            </pattern>
            <radialGradient id={esClaro ? "glow-ambient-claro" : "glow-ambient-oscuro"} cx="50%" cy="26%" r="48%">
              <stop offset="0%" stopColor={theme.glowStopColor} stopOpacity={theme.glowStopOpacity} />
              <stop offset="100%" stopColor={theme.glowEndColor} stopOpacity="0" />
            </radialGradient>
            <linearGradient id={esClaro ? "curve-gradient-claro" : "curve-gradient-oscuro"} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={theme.curveGradStop1} stopOpacity={theme.curveGradOpacity1} />
              <stop offset="50%" stopColor={theme.curveGradStop2} stopOpacity={theme.curveGradOpacity2} />
              <stop offset="100%" stopColor={theme.curveGradStop3} stopOpacity={theme.curveGradOpacity3} />
            </linearGradient>
          </defs>
          <rect width="100%" height="100%" fill={`url(#${esClaro ? "carbon-grid-claro" : "carbon-grid-oscuro"})`} />
          <circle cx="540" cy="500" r="520" fill={`url(#${esClaro ? "glow-ambient-claro" : "glow-ambient-oscuro"})`} />

          {/* Guías estructurales y rieles en los márgenes de seguridad */}
          <line x1={SAFE_LATERAL} y1={SAFE_TOP} x2={CANVAS_W - SAFE_LATERAL} y2={SAFE_TOP} stroke={theme.lineaSuperiorStroke} strokeWidth="1.5" strokeOpacity={theme.lineaSuperiorOpacity} />
          <line x1={SAFE_LATERAL} y1={CANVAS_H - SAFE_BOTTOM} x2={CANVAS_W - SAFE_LATERAL} y2={CANVAS_H - SAFE_BOTTOM} stroke={theme.lineaInferiorStroke} strokeWidth="1" />
          <line x1={SAFE_LATERAL} y1={SAFE_TOP} x2={SAFE_LATERAL} y2={CANVAS_H - SAFE_BOTTOM} stroke={theme.lineasLateralesStroke} strokeWidth="1" />
          <line x1={CANVAS_W - SAFE_LATERAL} y1={SAFE_TOP} x2={CANVAS_W - SAFE_LATERAL} y2={CANVAS_H - SAFE_BOTTOM} stroke={theme.lineasLateralesStroke} strokeWidth="1" />

          {/* CURVA CONECTORA EDITORIAL ("HILO CONDUCTOR") QUE VINCULA LA ESTRUCTURA */}
          <path
            d="M 540 500 C 720 580, 880 720, 840 920 C 790 1120, 240 1180, 230 1380 C 220 1560, 480 1700, 540 1780"
            fill="none"
            stroke={`url(#${esClaro ? "curve-gradient-claro" : "curve-gradient-oscuro"})`}
            strokeWidth="2.5"
            strokeDasharray="6 10"
            strokeLinecap="round"
            opacity={theme.curvaOpacity}
          />
        </svg>
      </div>

      {/* ================= CONTENEDOR PRINCIPAL FLUIDO (SIN ESPACIOS VACÍOS) ================= */}
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
          gap: 14, // Ritmo visual continuo y cohesionado, sin abismos negros
        }}
      >
        {/* ---------------- 1. HEADER EDITORIAL CON LOGO OFICIAL ---------------- */}
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingBottom: 12,
            borderBottom: `1px solid ${theme.bordeSutil}`,
            flexShrink: 0,
          }}
        >
          <TeoDocBadge color={pal.accent} tema={tema} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <span
              style={{
                fontSize: 11,
                fontFamily: 'monospace',
                fontWeight: 800,
                color: theme.tagColor,
                background: theme.tagBg,
                border: `1px solid ${theme.tagBorde}`,
                borderRadius: 999,
                padding: '4px 12px',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
                lineHeight: 1.2,
                display: 'inline-flex',
                alignItems: 'center',
                flexShrink: 0,
              }}
            >
              {categoriaTema}
            </span>
            <span style={{ fontSize: 12, color: theme.colorTextoMuted, fontFamily: 'monospace', letterSpacing: '0.04em', whiteSpace: 'nowrap', flexShrink: 0 }}>
              {fechaHoy}
            </span>
          </div>
        </header>

        {/* ---------------- 2. HERO: TÍTULO & IDEA CENTRAL (PROTAGONISTA Y CERCANO) ---------------- */}
        <section style={{ flexShrink: 0 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 8,
              background: theme.tagBg,
              border: `1px solid ${theme.tagBorde}`,
              borderRadius: 6,
              padding: '4px 10px',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            <div style={{ width: 8, height: 8, backgroundColor: pal.accent, borderRadius: 999, flexShrink: 0 }} />
            <span style={{ fontSize: 12, fontFamily: 'monospace', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: theme.tagColor, whiteSpace: 'nowrap', lineHeight: 1.2 }}>
              {entrada.tema}
            </span>
          </div>

          <h1
            style={{
              margin: '0 0 10px',
              fontSize: escala.display,
              fontWeight: 800,
              lineHeight: 1.06,
              letterSpacing: '-0.02em',
              color: theme.colorTextoPrincipal,
              overflowWrap: 'break-word',
            }}
          >
            {entrada.titulo}
          </h1>

          {entrada.mensajeCentral ? (
            <div
              style={{
                background: theme.cardBg,
                border: `1px solid ${theme.bordeSutil}`,
                borderRadius: 10,
                padding: '12px 18px',
                boxShadow: theme.cardBoxShadow,
              }}
            >
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  background: theme.tagBg,
                  border: `1px solid ${theme.tagBorde}`,
                  borderRadius: 4,
                  padding: '4px 10px',
                  marginBottom: 8,
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                <span style={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: theme.tagColor, whiteSpace: 'nowrap', lineHeight: 1.2 }}>
                  IDEA CENTRAL DEL EXPOSITOR
                </span>
              </div>
              <p
                style={{
                  margin: 0,
                  fontSize: escala.subtitulo,
                  fontWeight: 500,
                  lineHeight: 1.35,
                  color: theme.colorTextoCuerpo,
                }}
              >
                {resumirEditorial(entrada.mensajeCentral, 280)}
              </p>
            </div>
          ) : null}
        </section>

        {/* ---------------- 3. SPOTLIGHT BÍBLICO PRINCIPAL ---------------- */}
        {entrada.textoClave || entrada.pasaje ? (
          <section
            style={{
              flexShrink: 0,
              background: theme.cardBg,
              border: `1px solid ${theme.bordeSutil}`,
              borderTop: `3px solid ${pal.accent}`,
              borderRadius: 12,
              padding: '14px 18px',
              position: 'relative',
              boxShadow: theme.cardBoxShadow,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, gap: 12 }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  background: theme.tagBg,
                  border: `1px solid ${theme.tagBorde}`,
                  borderRadius: 4,
                  padding: '4px 10px',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  boxSizing: 'border-box',
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    backgroundColor: pal.accent,
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: theme.tagColor, whiteSpace: 'nowrap', lineHeight: 1.2 }}>
                  TEXTO BÍBLICO CLAVE
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
                    background: pal.primary,
                    padding: '3px 10px',
                    borderRadius: 4,
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    lineHeight: 1.2,
                    display: 'inline-flex',
                    alignItems: 'center',
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
                  lineHeight: 1.36,
                  color: theme.colorTextoPrincipal,
                }}
              >
                “{resumirEditorial(entrada.textoClave, 280)}”
              </p>
            ) : null}
          </section>
        ) : null}

        {/* ---------------- 4. PASAJES BÍBLICOS DE APOYO (DATOS REALES) ---------------- */}
        {mostrarVersiculosApoyo && versiculosApoyo.length > 0 ? (
          <section style={{ flexShrink: 0 }}>
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
                    background: theme.cardBg,
                    border: `1px solid ${theme.bordeSutil}`,
                    borderRadius: 8,
                    padding: '8px 12px',
                    boxShadow: theme.cardBoxShadow,
                  }}
                >
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      background: theme.tagBg,
                      border: `1px solid ${theme.tagBorde}`,
                      borderRadius: 4,
                      padding: '3px 8px',
                      marginBottom: 6,
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}
                  >
                    <span style={{ fontSize: 11, fontWeight: 800, color: theme.tagColor, fontFamily: 'monospace', whiteSpace: 'nowrap', lineHeight: 1.2 }}>
                      {v.cita}
                    </span>
                  </div>
                  {v.texto ? (
                    <p style={{ margin: 0, fontSize: 12.5, color: theme.colorTextoCuerpo, fontStyle: 'italic', lineHeight: 1.3 }}>
                      “{v.texto}”
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {/* ---------------- 5. DESARROLLO TEOLÓGICO (OCUPA Y LLENA EL CUERPO PRINCIPAL) ---------------- */}
        <section style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, flexShrink: 0 }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: theme.tagBg,
                border: `1px solid ${theme.tagBorde}`,
                borderRadius: 4,
                padding: '4px 10px',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              <span style={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: theme.tagColor, whiteSpace: 'nowrap', lineHeight: 1.2 }}>
                ENSEÑANZAS Y ESTRUCTURA TEOLÓGICA ({puntos.length} PUNTOS)
              </span>
            </div>
          </div>

          {arquetipo === 'breve' ? (
            /* ===== ARQUETIPO BREVE: PUNTOS EXPANSIVOS + ILUSTRACIÓN HERO INTEGRADA ===== */
            <div style={{ display: 'flex', gap: 16, height: '100%', alignItems: 'stretch' }}>
              <div style={{ flex: 1.25, display: 'flex', flexDirection: 'column', gap: 10, justifyContent: 'space-between' }}>
                {puntos.map((p) => (
                  <div
                    key={p.numeral}
                    style={{
                      flex: 1,
                      background: theme.cardBg,
                      border: `1px solid ${theme.bordeSutil}`,
                      borderTop: `3px solid ${pal.accent}`,
                      borderRadius: 12,
                      padding: '14px 18px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      gap: 4,
                      boxShadow: theme.cardBoxShadow,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                        <span style={{ fontSize: 12, fontWeight: 800, fontFamily: 'monospace', color: '#ffffff', background: pal.primary, padding: '3px 8px', borderRadius: 4, whiteSpace: 'nowrap', lineHeight: 1.2, display: 'inline-flex', alignItems: 'center' }}>
                          {p.numeral}
                        </span>
                        <IconoMiniPunto color={pal.accent} />
                      </div>
                      {p.versiculo ? (
                        <span style={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 700, color: theme.tagColor, background: theme.tagBg, border: `1px solid ${theme.tagBorde}`, padding: '3px 8px', borderRadius: 4, whiteSpace: 'nowrap', flexShrink: 0, lineHeight: 1.2, display: 'inline-flex', alignItems: 'center' }}>
                          {p.versiculo}
                        </span>
                      ) : null}
                    </div>
                    <h3 style={{ margin: 0, fontSize: escala.tituloPunto, fontWeight: 700, color: theme.colorTextoPrincipal, lineHeight: 1.22 }}>
                      {p.titulo}
                    </h3>
                    {p.detalle ? (
                      <p style={{ margin: 0, fontSize: escala.cuerpoPunto, color: theme.colorTextoCuerpo, lineHeight: 1.4 }}>
                        {p.detalle}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>

              {/* Gran vitrina visual para la ilustración temática */}
              <div
                style={{
                  flex: 0.85,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: theme.vitrinaBg,
                  border: `1px solid ${theme.vitrinaBorde}`,
                  borderRadius: 16,
                  padding: 16,
                  boxSizing: 'border-box',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: 14,
                    left: 16,
                    display: 'inline-flex',
                    alignItems: 'center',
                    background: esClaro ? '#ffffff' : '#161616',
                    border: `1px solid ${theme.bordeSutil}`,
                    borderRadius: 4,
                    padding: '4px 10px',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  <span style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 800, letterSpacing: '0.1em', color: theme.tagColor, textTransform: 'uppercase', whiteSpace: 'nowrap', lineHeight: 1.2 }}>
                    SIMBOLOGÍA BÍBLICA
                  </span>
                </div>
                <IlustracionEditorial id={ilustracionId} size={250} pal={pal} modo="hero" />
                <div style={{ marginTop: 10, textAlign: 'center' }}>
                  <span style={{ fontSize: 12, fontWeight: 800, fontFamily: 'monospace', color: theme.tagColor, letterSpacing: '0.08em', textTransform: 'uppercase', background: theme.tagBg, border: `1px solid ${theme.tagBorde}`, padding: '4px 14px', borderRadius: 999, display: 'inline-flex', alignItems: 'center', whiteSpace: 'nowrap', lineHeight: 1.2 }}>
                    {categoriaTema}
                  </span>
                </div>
              </div>
            </div>
          ) : arquetipo === 'medio' ? (
            /* ===== ARQUETIPO MEDIO: GRID 2 COLUMNAS SUSTANCIOSO + ILUSTRACIÓN ===== */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, height: '100%', justifyContent: 'space-between' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, flex: 1 }}>
                {puntos.slice(0, 4).map((p) => (
                  <div
                    key={p.numeral}
                    style={{
                      background: theme.cardBg,
                      border: `1px solid ${theme.bordeSutil}`,
                      borderTop: `3px solid ${pal.accent}`,
                      borderRadius: 12,
                      padding: '12px 16px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      boxShadow: theme.cardBoxShadow,
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: 800, fontFamily: 'monospace', color: '#ffffff', background: pal.primary, padding: '3px 8px', borderRadius: 4, whiteSpace: 'nowrap', lineHeight: 1.2, display: 'inline-flex', alignItems: 'center' }}>
                          {p.numeral}
                        </span>
                        <IconoMiniPunto color={pal.accent} />
                      </div>
                      <h3 style={{ margin: '0 0 4px', fontSize: escala.tituloPunto, fontWeight: 700, color: theme.colorTextoPrincipal, lineHeight: 1.2 }}>
                        {p.titulo}
                      </h3>
                      {p.detalle ? (
                        <p style={{ margin: 0, fontSize: escala.cuerpoPunto, color: theme.colorTextoCuerpo, lineHeight: 1.36 }}>
                          {p.detalle}
                        </p>
                      ) : null}
                    </div>
                    {p.versiculo ? (
                      <span
                        style={{
                          alignSelf: 'flex-start',
                          marginTop: 4,
                          fontSize: 10.5,
                          fontFamily: 'monospace',
                          fontWeight: 700,
                          color: theme.tagColor,
                          background: theme.tagBg,
                          border: `1px solid ${theme.tagBorde}`,
                          padding: '3px 8px',
                          borderRadius: 4,
                          whiteSpace: 'nowrap',
                          lineHeight: 1.2,
                          display: 'inline-flex',
                          alignItems: 'center',
                        }}
                      >
                        {p.versiculo}
                      </span>
                    ) : null}
                  </div>
                ))}
              </div>

              {/* Fila inferior con el 5to punto + ilustración */}
              <div style={{ display: 'grid', gridTemplateColumns: puntos[4] ? '1.3fr 1fr' : '1fr', gap: 10, height: 120 }}>
                {puntos[4] ? (
                  <div
                    style={{
                      background: theme.cardBg,
                      border: `1px solid ${theme.bordeSutil}`,
                      borderTop: `3px solid ${pal.accent}`,
                      borderRadius: 12,
                      padding: '12px 16px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      boxShadow: theme.cardBoxShadow,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 800, fontFamily: 'monospace', color: '#ffffff', background: pal.primary, padding: '3px 8px', borderRadius: 4, whiteSpace: 'nowrap', lineHeight: 1.2, display: 'inline-flex', alignItems: 'center' }}>
                        {puntos[4].numeral}
                      </span>
                      <h3 style={{ margin: 0, fontSize: escala.tituloPunto, fontWeight: 700, color: theme.colorTextoPrincipal, lineHeight: 1.2 }}>
                        {puntos[4].titulo}
                      </h3>
                    </div>
                    {puntos[4].detalle ? (
                      <p style={{ margin: 0, fontSize: escala.cuerpoPunto, color: theme.colorTextoCuerpo, lineHeight: 1.34 }}>
                        {puntos[4].detalle}
                      </p>
                    ) : null}
                  </div>
                ) : null}

                <div
                  style={{
                    borderRadius: 12,
                    background: theme.vitrinaBg,
                    border: `1px solid ${theme.vitrinaBorde}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <IlustracionEditorial id={ilustracionId} size={116} pal={pal} modo="medio" />
                </div>
              </div>
            </div>
          ) : (
            /* ===== ARQUETIPO EXTENSO: GRID 2 COLUMNAS ARMONIOSO (HASTA 10 PUNTOS) ===== */
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 8,
                height: '100%',
                alignContent: 'stretch',
              }}
            >
              {puntos.map((p) => (
                <div
                  key={p.numeral}
                  style={{
                    background: theme.cardBg,
                    border: `1px solid ${theme.bordeSutil}`,
                    borderRadius: 10,
                    padding: '8px 12px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    boxShadow: theme.cardBoxShadow,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, fontFamily: 'monospace', color: '#ffffff', background: pal.primary, padding: '3px 7px', borderRadius: 4, lineHeight: 1.2, whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}>
                      {p.numeral}
                    </span>
                    <h3 style={{ margin: 0, fontSize: escala.tituloPunto, fontWeight: 700, color: theme.colorTextoPrincipal, lineHeight: 1.18 }}>
                      {p.titulo}
                    </h3>
                  </div>
                  {p.detalle ? (
                    <p style={{ margin: 0, fontSize: escala.cuerpoPunto, color: theme.colorTextoCuerpo, lineHeight: 1.3 }}>
                      {p.detalle}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ---------------- 6. BLOQUE DOCTRINAL / TEOLÓGICO ---------------- */}
        {mostrarDoctrina && doctrinas.length > 0 ? (
          <section
            style={{
              flexShrink: 0,
              background: theme.cardBg,
              border: `1px solid ${theme.bordeSutil}`,
              borderRadius: 10,
              padding: '10px 14px',
              boxShadow: theme.cardBoxShadow,
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: theme.tagBg,
                border: `1px solid ${theme.tagBorde}`,
                borderRadius: 4,
                padding: '4px 10px',
                marginBottom: 6,
                whiteSpace: 'nowrap',
                flexShrink: 0,
                maxWidth: '100%',
              }}
            >
              <span style={{ fontSize: 10.5, fontFamily: 'monospace', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: theme.tagColor, whiteSpace: 'nowrap', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                ENSEÑANZA DOCTRINAL: {doctrinas[0].sobre}
              </span>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: theme.colorTextoCuerpo, lineHeight: 1.34 }}>
              {resumirEditorial(doctrinas[0].ensenanza, 190)}
            </p>
          </section>
        ) : null}

        {/* ---------------- 7. CONCEPTOS CLAVE (TAGS ESTILIZADOS) ---------------- */}
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
            <span
              style={{
                fontSize: 10.5,
                fontFamily: 'monospace',
                fontWeight: 800,
                color: theme.tagColor,
                background: theme.tagBg,
                border: `1px solid ${theme.tagBorde}`,
                borderRadius: 4,
                padding: '4px 8px',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
                lineHeight: 1.2,
                display: 'inline-flex',
                alignItems: 'center',
                flexShrink: 0,
              }}
            >
              CONCEPTOS:
            </span>
            {entrada.conceptos.map((c, i) => (
              <span
                key={i}
                style={{
                  fontSize: 12,
                  fontFamily: 'monospace',
                  fontWeight: 600,
                  color: theme.colorTextoPrincipal,
                  background: esClaro ? '#ffffff' : 'rgba(255, 255, 255, 0.05)',
                  border: `1px solid ${theme.bordeSutil}`,
                  borderRadius: 4,
                  padding: '4px 8px',
                  whiteSpace: 'nowrap',
                  lineHeight: 1.2,
                  display: 'inline-flex',
                  alignItems: 'center',
                  flexShrink: 0,
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
            background: theme.footerBg,
            border: `1px solid ${theme.bordeSutil}`,
            borderRadius: 12,
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            boxShadow: theme.cardBoxShadow,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: theme.tagBg,
                border: `1px solid ${theme.tagBorde}`,
                borderRadius: 4,
                padding: '4px 10px',
                marginBottom: 6,
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              <span style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: theme.tagColor, whiteSpace: 'nowrap', lineHeight: 1.2 }}>
                VERDAD PARA RECORDAR // CONCLUSIÓN
              </span>
            </div>
            <p
              style={{
                margin: '3px 0 0',
                fontSize: arquetipo === 'extenso' ? 16 : 19,
                fontWeight: 600,
                fontStyle: 'italic',
                color: theme.colorTextoPrincipal,
                lineHeight: 1.3,
              }}
            >
              “{resumirEditorial(entrada.fraseRecordar || entrada.verdadPrincipal || entrada.mensajeCentral, 200)}”
            </p>
          </div>

          <div style={{ flexShrink: 0 }}>
            <TeoDocBadge color={pal.accent} tema={tema} />
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

export async function exportarInfografiaBlob(node: HTMLElement, tema: TemaInfografia = 'oscuro'): Promise<Blob> {
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
    bgcolor: tema === 'claro' ? '#ffffff' : '#070b14',
  })

  let blob: Blob
  try {
    blob = await domtoimage.toBlob(node, opciones(escala))
  } catch {
    blob = await domtoimage.toBlob(node, opciones(Math.max(0.4, escala * 0.65)))
  }
  return asegurarPng(blob)
}

export async function exportarInfografiaPng(node: HTMLElement, tema: TemaInfografia = 'oscuro'): Promise<string> {
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
    bgcolor: tema === 'claro' ? '#ffffff' : '#070b14',
  })

  try {
    return await domtoimage.toPng(node, opciones(escala))
  } catch {
    return await domtoimage.toPng(node, opciones(Math.max(0.4, escala * 0.65)))
  }
}

export async function exportarInfografiaFile(node: HTMLElement, nombre: string, tema: TemaInfografia = 'oscuro'): Promise<File> {
  const blob = await exportarInfografiaBlob(node, tema)
  const base = (nombre || 'teodoc-infografia').replace(/[.]+$/, '')
  const conExtension = base.toLowerCase().endsWith('.png') ? base : `${base}.png`
  return new File([blob], conExtension, { type: 'image/png' })
}

// ---------------------------------------------------------------------------
// Visualización Responsive (Escala limpia del lienzo 1080×1920 en 1 sola lámina)
// ---------------------------------------------------------------------------
export function ResponsiveInfografia({ data, tema = 'oscuro' }: { data: InfografiaData; tema?: TemaInfografia }) {
  const hostRef = useRef<HTMLDivElement>(null)
  const [hostW, setHostW] = useState(0)
  const esClaro = tema === 'claro'

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
          boxShadow: esClaro ? '0 16px 40px rgba(0,0,0,0.12)' : '0 24px 60px rgba(0,0,0,0.65)',
          border: esClaro ? '1px solid #e0e0e0' : '1px solid #393939',
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
          <Infografia data={data} tema={tema} />
        </div>
      </div>
    </div>
  )
}
