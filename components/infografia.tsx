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
  GRID_BASE,
  SAFE_TOP,
  SAFE_BOTTOM,
  SAFE_LATERAL,
  ANCHO_UTIL,
  planificarComposicion,
  resumirEditorial,
  metricasCanvas,
  type EntradaInfografia,
  type PlanEditorial,
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
  conclusion?: string
}

export function resumir(texto: string, max: number): string {
  return resumirEditorial(texto, max)
}

// ---------------------------------------------------------------------------
// Paletas de Color TeoDoc (Identidad propia: Tecnológica + Bíblica + Premium)
// ---------------------------------------------------------------------------
const PALETAS: PaletaIlustracion[] = [
  // 0: Azul Celestial & Cian
  { primary: '#1d4ed8', secondary: '#0284c7', accent: '#38bdf8', glow: '#60a5fa' },
  // 1: Ámbar & Oro del Templo
  { primary: '#b45309', secondary: '#d97706', accent: '#fbbf24', glow: '#fef08a' },
  // 2: Púrpura Real & Gracia
  { primary: '#6d28d9', secondary: '#7c3aed', accent: '#c084fc', glow: '#e9d5ff' },
  // 3: Esmeralda & Esperanza
  { primary: '#047857', secondary: '#059669', accent: '#34d399', glow: '#a7f3d0' },
  // 4: Coral Cálido & Avivamiento
  { primary: '#c2410c', secondary: '#ea580c', accent: '#fb923c', glow: '#ffedd5' },
  // 5: Zafiro & Índigo
  { primary: '#4338ca', secondary: '#4f46e5', accent: '#818cf8', glow: '#c7d2fe' },
]

function hashColor(texto: string, max: number): number {
  let h = 0
  const s = texto || 'teodoc'
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return max > 0 ? h % max : 0
}

// Isotipo TeoDoc: minimalista, nítido y geométrico (sin wordmark borroso)
function TeoDocBadge({ color }: { color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <svg width={28} height={28} viewBox="0 0 100 100" aria-label="TeoDoc">
        <rect x="8" y="8" width="84" height="84" rx="20" fill="none" stroke={color} strokeWidth="7" />
        <rect x="24" y="26" width="52" height="8" rx="4" fill="#ffffff" />
        <rect x="24" y="44" width="36" height="8" rx="4" fill="#ffffff" />
        <rect x="24" y="62" width="46" height="8" rx="4" fill={color} />
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#ffffff' }}>
          TEODOC
        </span>
        <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: color }}>
          ESTUDIO MINISTERIAL
        </span>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Extracción Normalizada de Entrada
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
    contextoBreve: info.contexto_breve || data.contexto_biblico || '',
    puntos,
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
    paginas: [plan.puntos], // compatibilidad con pruebas e invariantes
    modo: 'unico' as const,
  }
}

// ---------------------------------------------------------------------------
// Componente de Infografía Editorial 9:16 (1080×1920)
// ---------------------------------------------------------------------------
export default function Infografia({ data }: { data: InfografiaData; pagina?: number }) {
  const entrada = construirEntrada(data)
  const plan = planificarComposicion(entrada)
  const palIndex = hashColor(entrada.titulo + entrada.tema, PALETAS.length)
  const pal = PALETAS[palIndex]

  // Búsqueda temática de ilustración
  const semillaIlustracion = `${entrada.titulo} ${entrada.tema} ${entrada.mensajeCentral} ${entrada.pasaje} ${entrada.conceptos.join(' ')}`
  const ilustracionId: IlustracionId = elegirIlustracion(semillaIlustracion)
  const categoriaTema = categoriaIlustracion(ilustracionId)
  const fechaHoy = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })

  const { arquetipo, puntos, escala } = plan

  return (
    <div
      style={{
        width: CANVAS_W,
        height: CANVAS_H,
        boxSizing: 'border-box',
        backgroundColor: '#070b14',
        backgroundImage: 'radial-gradient(ellipse 90% 70% at 50% -10%, #172554 0%, #070b14 70%)',
        color: '#f8fafc',
        fontFamily: 'var(--font-plex), system-ui, -apple-system, sans-serif',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* ================= FONDO EDITORIAL RETICULADO ================= */}
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        {/* Retícula matemática sutil de 64 px (Carbon blueprint) */}
        <svg width="100%" height="100%" viewBox="0 0 1080 1920" preserveAspectRatio="none">
          <defs>
            <pattern id="grid-pattern" width="64" height="64" patternUnits="userSpaceOnUse">
              <path d="M 64 0 L 0 0 0 64" fill="none" stroke="rgba(255, 255, 255, 0.024)" strokeWidth="1" />
            </pattern>
            <radialGradient id="glow-hero" cx="50%" cy="20%" r="45%">
              <stop offset="0%" stopColor={pal.glow} stopOpacity="0.18" />
              <stop offset="100%" stopColor="#070b14" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="glow-bottom" cx="80%" cy="85%" r="40%">
              <stop offset="0%" stopColor={pal.accent} stopOpacity="0.12" />
              <stop offset="100%" stopColor="#070b14" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid-pattern)" />
          <circle cx="540" cy="400" r="450" fill="url(#glow-hero)" />
          <circle cx="850" cy="1500" r="400" fill="url(#glow-bottom)" />
          {/* Líneas geométricas de acento */}
          <line x1={SAFE_LATERAL} y1={SAFE_TOP} x2={CANVAS_W - SAFE_LATERAL} y2={SAFE_TOP} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
          <line x1={SAFE_LATERAL} y1={CANVAS_H - SAFE_BOTTOM} x2={CANVAS_W - SAFE_LATERAL} y2={CANVAS_H - SAFE_BOTTOM} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
        </svg>
      </div>

      {/* ================= CONTENEDOR PRINCIPAL (DENTRO DE SAFE AREA) ================= */}
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
          justifyContent: 'space-between',
        }}
      >
        {/* ---------------- 1. HEADER EDITORIAL ---------------- */}
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingBottom: 16,
            borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
            flexShrink: 0,
          }}
        >
          <TeoDocBadge color={pal.accent} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: pal.accent,
                background: 'rgba(255, 255, 255, 0.05)',
                border: `1px solid ${pal.accent}44`,
                borderRadius: 999,
                padding: '4px 14px',
              }}
            >
              {categoriaTema}
            </span>
            <span style={{ fontSize: 13, color: '#94a3b8', fontWeight: 500, letterSpacing: '0.04em' }}>
              {fechaHoy}
            </span>
          </div>
        </header>

        {/* ---------------- 2. HERO: TÍTULO & MENSAJE CENTRAL ---------------- */}
        <section style={{ marginTop: 20, marginBottom: 16, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <div style={{ width: 28, height: 3, backgroundColor: pal.accent, borderRadius: 2 }} />
            <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: pal.accent }}>
              {entrada.tema}
            </span>
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: escala.display,
              fontWeight: 800,
              lineHeight: 1.06,
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
                marginTop: 14,
                paddingLeft: 18,
                borderLeft: `3px solid ${pal.accent}`,
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: escala.subtitulo,
                  fontWeight: 500,
                  lineHeight: 1.35,
                  color: '#cbd5e1',
                }}
              >
                {resumirEditorial(entrada.mensajeCentral, 260)}
              </p>
            </div>
          ) : null}
        </section>

        {/* ---------------- 3. BLOQUE BÍBLICO PROTAGONISTA ---------------- */}
        {entrada.textoClave || entrada.pasaje ? (
          <section
            style={{
              flexShrink: 0,
              marginBottom: 18,
              background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.14)',
              borderRadius: 16,
              padding: '16px 22px',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: pal.accent,
                    boxShadow: `0 0 10px ${pal.accent}`,
                  }}
                />
                <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: pal.accent }}>
                  TEXTO BÍBLICO CLAVE
                </span>
              </div>
              {entrada.pasaje ? (
                <span style={{ fontSize: 15, fontWeight: 800, color: '#ffffff', letterSpacing: '0.04em' }}>
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
                  color: '#f1f5f9',
                }}
              >
                “{resumirEditorial(entrada.textoClave, 320)}”
              </p>
            ) : null}
          </section>
        ) : null}

        {/* ---------------- 4. DESARROLLO EDITORIAL (ARQUETIPOS BREVE / MEDIO / EXTENSO) ---------------- */}
        <section style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {arquetipo === 'breve' ? (
            /* ===== ARQUETIPO BREVE (1-3 PUNTOS): HERO VISUAL + PUNTOS AMPLIOS ===== */
            <div style={{ display: 'flex', gap: 24, alignItems: 'center', height: '100%' }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16, justifyContent: 'center' }}>
                {puntos.map((p) => (
                  <div
                    key={p.numeral}
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: 14,
                      padding: '16px 20px',
                      position: 'relative',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 4 }}>
                      <span style={{ fontSize: escala.numeral, fontWeight: 800, color: pal.accent, lineHeight: 1 }}>
                        {p.numeral}
                      </span>
                      <h3 style={{ margin: 0, fontSize: escala.tituloPunto, fontWeight: 700, color: '#ffffff', lineHeight: 1.25 }}>
                        {p.titulo}
                      </h3>
                    </div>
                    {p.detalle ? (
                      <p style={{ margin: 0, fontSize: escala.cuerpoPunto, color: '#94a3b8', lineHeight: 1.45, paddingLeft: 4 }}>
                        {p.detalle}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>

              {/* Gran ilustración protagonista integrada */}
              <div
                style={{
                  width: 290,
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'radial-gradient(circle at center, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.01) 70%)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 20,
                  boxSizing: 'border-box',
                  padding: 16,
                }}
              >
                <IlustracionEditorial id={ilustracionId} size={250} pal={pal} modo="hero" />
              </div>
            </div>
          ) : arquetipo === 'medio' ? (
            /* ===== ARQUETIPO MEDIO (4-5 PUNTOS): GRID 2 COLUMNAS + ILUSTRACIÓN CENTRAL ===== */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, height: '100%', justifyContent: 'center' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                {puntos.slice(0, 4).map((p) => (
                  <div
                    key={p.numeral}
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: 14,
                      padding: '14px 16px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'flex-start',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: escala.numeral, fontWeight: 800, color: pal.accent, lineHeight: 1 }}>
                        {p.numeral}
                      </span>
                      <h3 style={{ margin: 0, fontSize: escala.tituloPunto, fontWeight: 700, color: '#ffffff', lineHeight: 1.2 }}>
                        {p.titulo}
                      </h3>
                    </div>
                    {p.detalle ? (
                      <p style={{ margin: 0, fontSize: escala.cuerpoPunto, color: '#94a3b8', lineHeight: 1.4 }}>
                        {p.detalle}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>

              {/* Fila inferior con el 5to punto + ilustración integrada */}
              <div style={{ display: 'grid', gridTemplateColumns: puntos[4] ? '1.4fr 1fr' : '1fr', gap: 14, alignItems: 'center' }}>
                {puntos[4] ? (
                  <div
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: 14,
                      padding: '14px 16px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: escala.numeral, fontWeight: 800, color: pal.accent, lineHeight: 1 }}>
                        {puntos[4].numeral}
                      </span>
                      <h3 style={{ margin: 0, fontSize: escala.tituloPunto, fontWeight: 700, color: '#ffffff', lineHeight: 1.2 }}>
                        {puntos[4].titulo}
                      </h3>
                    </div>
                    {puntos[4].detalle ? (
                      <p style={{ margin: 0, fontSize: escala.cuerpoPunto, color: '#94a3b8', lineHeight: 1.4 }}>
                        {puntos[4].detalle}
                      </p>
                    ) : null}
                  </div>
                ) : null}

                <div
                  style={{
                    height: 110,
                    borderRadius: 14,
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <IlustracionEditorial id={ilustracionId} size={130} pal={pal} modo="medio" />
                </div>
              </div>
            </div>
          ) : (
            /* ===== ARQUETIPO EXTENSO (6-10 PUNTOS): GRID EDITORIAL DENSO 2 COLUMNAS ===== */
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 12,
                height: '100%',
                alignContent: 'center',
              }}
            >
              {puntos.map((p) => (
                <div
                  key={p.numeral}
                  style={{
                    background: 'rgba(255, 255, 255, 0.025)',
                    border: '1px solid rgba(255, 255, 255, 0.09)',
                    borderRadius: 12,
                    padding: '10px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <span style={{ fontSize: escala.numeral, fontWeight: 800, color: pal.accent, lineHeight: 1 }}>
                      {p.numeral}
                    </span>
                    <h3 style={{ margin: 0, fontSize: escala.tituloPunto, fontWeight: 700, color: '#ffffff', lineHeight: 1.18 }}>
                      {p.titulo}
                    </h3>
                  </div>
                  {p.detalle ? (
                    <p style={{ margin: 0, fontSize: escala.cuerpoPunto, color: '#94a3b8', lineHeight: 1.35 }}>
                      {p.detalle}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ---------------- 5. CONCEPTOS TEOLÓGICOS / TAGS ---------------- */}
        {entrada.conceptos.length > 0 ? (
          <section
            style={{
              flexShrink: 0,
              marginTop: 14,
              marginBottom: 14,
              display: 'flex',
              flexWrap: 'wrap',
              gap: 8,
              alignItems: 'center',
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 800, color: '#64748b', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              CONCEPTOS:
            </span>
            {entrada.conceptos.map((c, i) => (
              <span
                key={i}
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#e2e8f0',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: 6,
                  padding: '3px 10px',
                }}
              >
                {c}
              </span>
            ))}
          </section>
        ) : null}

        {/* ---------------- 6. CIERRE / FRASE PARA RECORDAR ---------------- */}
        <footer
          style={{
            flexShrink: 0,
            background: `linear-gradient(90deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)`,
            border: `1px solid ${pal.accent}33`,
            borderLeft: `5px solid ${pal.accent}`,
            borderRadius: 14,
            padding: '14px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: pal.accent }}>
              VERDAD PARA RECORDAR
            </span>
            <p
              style={{
                margin: '2px 0 0',
                fontSize: arquetipo === 'extenso' ? 18 : 21,
                fontWeight: 600,
                fontStyle: 'italic',
                color: '#ffffff',
                lineHeight: 1.3,
              }}
            >
              “{resumirEditorial(entrada.fraseRecordar || entrada.verdadPrincipal || entrada.mensajeCentral, 200)}”
            </p>
          </div>

          <div style={{ flexShrink: 0, opacity: 0.9 }}>
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
    bgcolor: '#070b14',
  })

  let blob: Blob
  try {
    blob = await domtoimage.toBlob(node, opciones(escala))
  } catch {
    // Respaldo de escala segura para dispositivos con menor RAM (Safari iOS)
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
    bgcolor: '#070b14',
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
          borderRadius: 16,
          boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
          border: '1px solid rgba(255,255,255,0.1)',
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
      <p style={{ marginTop: 12, fontSize: 13, color: '#94a3b8', textAlign: 'center', fontWeight: 500 }}>
        Infografía Editorial 9:16 (1080×1920 px) · Composición Única en Alta Definición
      </p>
    </div>
  )
}
