'use client'

import React from 'react'

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

// ---------------------------------------------------------------------------
// Utilidad de resumen (exportada: el PDF la reutiliza)
// ---------------------------------------------------------------------------
export function resumir(texto: string, max: number): string {
  const t = (texto || '').replace(/\s+/g, ' ').trim()
  return t.length > max ? `${t.slice(0, max).trimEnd()}…` : t
}

// ---------------------------------------------------------------------------
// Iconografía dibujada a mano (trazo de tinta + acento azul)
// ---------------------------------------------------------------------------
const ICON = { fill: 'none', stroke: '#161616', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' } as const

const IcoCross = (
  <svg width="22" height="22" viewBox="0 0 24 24" {...ICON}><path d="M12 3.5v17M6.5 9h11" /></svg>
)
const IcoBible = (
  <svg width="24" height="24" viewBox="0 0 24 24" {...ICON}>
    <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H19v15H6.5A2.5 2.5 0 0 0 4 20.5z" />
    <path d="M4 5.5v15" stroke="#0F62FE" />
    <path d="M11.5 7v5M9 9.5h5" />
  </svg>
)
const IcoScroll = (
  <svg width="24" height="24" viewBox="0 0 24 24" {...ICON}>
    <path d="M6 4h11a2 2 0 0 1 2 2v12H8a2 2 0 0 0-2 2z" />
    <path d="M6 4a2 2 0 0 0-2 2v1h2" stroke="#0F62FE" />
    <path d="M9 9h7M9 12h7" />
  </svg>
)
const IcoLamp = (
  <svg width="24" height="24" viewBox="0 0 24 24" {...ICON}>
    <path d="M9 18h6M10 21h4" />
    <path d="M12 3a6 6 0 0 0-3.5 10.9c.7.5 1 1.2 1 2.1h5c0-.9.3-1.6 1-2.1A6 6 0 0 0 12 3z" />
    <path d="M12 11v1.5" stroke="#0F62FE" />
  </svg>
)
const IcoPath = (
  <svg width="24" height="24" viewBox="0 0 24 24" {...ICON}>
    <path d="M5 19c6 0 4-7 9-7s5-5 5-9" />
    <circle cx="5" cy="19" r="1.6" stroke="#0F62FE" />
    <path d="M19 3l-2.2 3h4.4z" fill="#0F62FE" stroke="none" />
  </svg>
)
const IcoSeed = (
  <svg width="24" height="24" viewBox="0 0 24 24" {...ICON}>
    <path d="M12 21c0-6 3-10 8-11-1 6-4 10-8 11z" stroke="#0F62FE" />
    <path d="M12 21c0-6-3-10-8-11 1 6 4 10 8 11z" />
    <path d="M12 21v-6" />
  </svg>
)
const IcoHeart = (
  <svg width="24" height="24" viewBox="0 0 24 24" {...ICON}>
    <path d="M12 21c-1.6-1.3-7-5.1-7-9.3A3.9 3.9 0 0 1 12 9a3.9 3.9 0 0 1 7-2.3c0 4.2-5.4 8-7 14.3z" stroke="#0F62FE" />
  </svg>
)
const IcoPray = (
  <svg width="26" height="26" viewBox="0 0 24 24" {...ICON}>
    <path d="M12 3c1.6 2.2 2.4 4.6 2.4 8.2V19a2.4 2.4 0 0 1-4.8 0v-7.8C9.6 7.6 10.4 5.2 12 3z" />
    <path d="M12 10.5v6" stroke="#0F62FE" />
  </svg>
)
const IcoSteps = (
  <svg width="24" height="24" viewBox="0 0 24 24" {...ICON}>
    <path d="M5 19h4v-4h4v-4h4V7" />
    <path d="M14 7l2.5-2.5L19 7" stroke="#0F62FE" />
  </svg>
)
const IcoCheck = (
  <svg width="18" height="18" viewBox="0 0 24 24" style={{ flexShrink: 0, marginTop: 1 }}>
    <rect x="2.5" y="2.5" width="19" height="19" rx="4" fill="#FFFFFF" stroke="#161616" strokeWidth="2" />
    <path d="M6.5 12.5 L10.5 16.5 L17.5 7.5" fill="none" stroke="#0F62FE" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const POINT_ICONS = [IcoLamp, IcoSeed, IcoPath, IcoHeart, IcoCross]

function SectionTitle({ label, icon, size = 25 }: { label: string; icon: React.ReactNode; size?: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 7 }}>
      <span style={{ display: 'inline-flex', alignItems: 'center' }}>{icon}</span>
      <span className="font-hand" style={{ fontSize: size, fontWeight: 700, lineHeight: 1 }}>{label}</span>
      <span style={{ flex: 1, height: 2, background: '#0F62FE', opacity: 0.35, borderRadius: 2 }} />
    </div>
  )
}

function HandArrow({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size * 0.6} viewBox="0 0 40 24" style={{ display: 'block', margin: '3px auto' }}>
      <path d="M9 2 C 27 6, 27 13, 21 19" fill="none" stroke="#0F62FE" strokeWidth="3.4" strokeLinecap="round" />
      <path d="M14 15 L21 22 L28 14" fill="none" stroke="#0F62FE" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Composición de la infografía (independiente del contenedor)
// variant 'wide'  -> artboard de exportación y desktop
// variant 'compact' -> lectura vertical en móvil (reordena a una columna)
// ---------------------------------------------------------------------------
export default function Infografia({ data, variant = 'wide' }: { data: InfografiaData; variant?: 'wide' | 'compact' }) {
  const wide = variant === 'wide'

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
  const puntos = (data.desarrollo_progresivo || []).slice(0, 5)
  const aplicaciones = (data.aplicacion || []).slice(0, 6)
  const palabrasClave = Array.from(new Set(
    (data.desarrollo_progresivo || [])
      .map((p) => (p.punto || '').split(/\s+/).slice(0, 2).join(' ').replace(/[.,;:]+$/, '').trim())
      .filter((k) => k.length > 2),
  )).slice(0, 6)
  const fecha = new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })

  const cols2 = wide ? '1fr 1fr' : '1fr'
  const gap = wide ? 12 : 10
  const bodySize = wide ? 11 : 13
  const smallSize = wide ? 10 : 11.5
  const titleSize = wide ? 42 : 30
  const h2Size = wide ? 25 : 21
  const pad = wide ? 44 : 20

  const panel: React.CSSProperties = { border: '2px solid #161616', borderRadius: 10, padding: wide ? '8px 10px' : '10px 12px', background: '#FFFFFF' }
  const panelLabel: React.CSSProperties = { fontSize: smallSize - 1.5, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#525252', marginBottom: 3 }

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        color: '#161616',
        padding: pad,
        fontFamily: 'var(--font-plex), system-ui, sans-serif',
        border: wide ? '1px solid #E0E0E0' : '1px solid #E0E0E0',
        position: 'relative',
      }}
    >
      <div style={{ position: 'absolute', inset: 0, opacity: 0.5, backgroundImage: 'radial-gradient(#E0E0E0 0.9px, transparent 0.9px)', backgroundSize: '20px 20px', pointerEvents: 'none' }} />

      {/* ENCABEZADO */}
      <div style={{ position: 'relative', textAlign: 'center', marginBottom: wide ? 12 : 14 }}>
        <div style={{ fontSize: smallSize - 0.5, letterSpacing: '0.3em', color: '#525252', textTransform: 'uppercase' }}>Estudio bíblico visual</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 2 }}>
          <span style={{ display: 'inline-flex' }}>{IcoCross}</span>
          <span className="font-hand" style={{ fontSize: titleSize, fontWeight: 700, lineHeight: 1 }}>Análisis de la Prédica</span>
        </div>
        <svg width={wide ? 300 : 220} height="12" viewBox="0 0 300 12" style={{ display: 'block', margin: '0 auto' }}>
          <path d="M4 7 C 60 1, 120 12, 180 6 S 270 1, 296 7" fill="none" stroke="#0F62FE" strokeWidth="3.4" strokeLinecap="round" />
        </svg>
        <div style={{ fontSize: wide ? 18 : 16, fontWeight: 700, marginTop: 8, lineHeight: 1.2 }}>{resumir(data.titulo || 'Prédica', 90)}</div>
        <div style={{ fontSize: bodySize, fontStyle: 'italic', color: '#525252', marginTop: 3 }}>“{resumir(data.idea_principal || '', 180)}”</div>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', marginTop: 7, fontSize: smallSize, color: '#525252' }}>
          {pasaje ? <span style={{ color: '#0F62FE', fontWeight: 700 }}>{pasaje}</span> : null}
          <span>Generado el {fecha}</span>
        </div>
      </div>

      {/* 1. DESARROLLO BÍBLICO */}
      <SectionTitle label="Desarrollo bíblico" icon={IcoBible} size={h2Size} />
      <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: contexto ? cols2 : '1fr', gap, marginBottom: 8 }}>
        <div style={panel}>
          <div style={panelLabel}>Pasaje principal</div>
          <div className="font-hand" style={{ fontSize: wide ? 21 : 19, color: '#0F62FE', lineHeight: 1.05 }}>{pasaje || '—'}</div>
          {textoPasaje ? <div style={{ fontSize: bodySize, color: '#525252', fontStyle: 'italic', marginTop: 3, lineHeight: 1.35 }}>“{resumir(textoPasaje, 130)}”</div> : null}
        </div>
        {contexto ? (
          <div style={panel}>
            <div style={panelLabel}>Contexto</div>
            <div style={{ fontSize: bodySize, color: '#525252', lineHeight: 1.4 }}>{resumir(contexto, 200)}</div>
          </div>
        ) : null}
      </div>
      <div style={{ position: 'relative', borderLeft: '3px solid #0F62FE', paddingLeft: 10, marginBottom: 8 }}>
        <div style={panelLabel}>Idea central</div>
        <div style={{ fontSize: bodySize + 1.5, fontWeight: 600, lineHeight: 1.35 }}>{resumir(data.idea_principal || '', 190)}</div>
      </div>
      {palabrasClave.length > 0 && (
        <div style={{ position: 'relative', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {palabrasClave.map((k, i) => (
            <span key={i} className="font-hand" style={{ fontSize: wide ? 16 : 17, lineHeight: 1, color: '#0F62FE', border: '1.5px solid #0F62FE', borderRadius: 999, padding: '3px 10px' }}>{k}</span>
          ))}
        </div>
      )}

      <HandArrow size={wide ? 40 : 34} />

      {/* 2. PUNTOS CLAVE (cantidad dinámica) */}
      <SectionTitle label={`${puntos.length} puntos clave`} icon={IcoScroll} size={h2Size} />
      <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: cols2, gap: wide ? 9 : 10 }}>
        {puntos.map((p, i) => (
          <div key={i} style={{ border: '2px solid #161616', borderRadius: 10, padding: wide ? '8px 10px' : '10px 12px', boxShadow: '3px 3px 0 #E0E0E0', background: '#FFFFFF' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="font-hand" style={{ fontSize: wide ? 28 : 30, color: '#0F62FE', lineHeight: 1 }}>{i + 1}</span>
              <span className="font-hand" style={{ fontSize: wide ? 19 : 21, lineHeight: 1.05 }}>{resumir(p.punto, 44)}</span>
            </div>
            <div style={{ fontSize: bodySize, color: '#525252', lineHeight: 1.35, marginTop: 3 }}>{resumir(p.explicacion, 130)}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, color: '#0F62FE' }}>
              <span style={{ display: 'inline-flex', transform: 'scale(0.8)', transformOrigin: 'left center' }}>{POINT_ICONS[i % POINT_ICONS.length]}</span>
              <span style={{ fontSize: smallSize - 1, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Clave {i + 1}</span>
            </div>
          </div>
        ))}
      </div>

      <HandArrow size={wide ? 40 : 34} />

      {/* 3. APLICACIÓN PRÁCTICA */}
      <SectionTitle label="Aplicación práctica" icon={IcoSteps} size={h2Size} />
      <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: cols2, gap: wide ? '7px 16px' : '8px 12px' }}>
        {aplicaciones.map((a, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            {IcoCheck}
            <span style={{ fontSize: bodySize, lineHeight: 1.35 }}>{resumir(a, 110)}</span>
          </div>
        ))}
      </div>

      <HandArrow size={wide ? 40 : 34} />

      {/* 4. ORACIÓN MINISTERIAL */}
      <SectionTitle label="Oración ministerial" icon={IcoPray} size={h2Size} />
      <div style={{ position: 'relative', border: '2px solid #0F62FE', borderRadius: 12, background: '#F4F4F4', padding: wide ? '11px 14px' : '12px 14px' }}>
        <div style={{ fontSize: bodySize, fontStyle: 'italic', lineHeight: 1.5, color: '#161616' }}>{resumir(data.oracion || '', 420)}</div>
      </div>

      {/* PIE */}
      <div style={{ position: 'relative', marginTop: wide ? 16 : 14, borderTop: '2px solid #E0E0E0', paddingTop: 6, display: 'flex', justifyContent: 'space-between', fontSize: smallSize - 1.5, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#525252' }}>
        <span>TeoDoc · Análisis Ministerial</span>
        <span>RPM Ministry</span>
      </div>
    </div>
  )
}
