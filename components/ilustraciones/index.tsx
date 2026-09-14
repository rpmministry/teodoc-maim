'use client'

import React from 'react'

// ---------------------------------------------------------------------------
// Biblioteca de ilustraciones vectoriales temáticas (SVG inline, sin red, sin
// CORS, sin costo). Se eligen por palabras clave REALES del bloque, nunca al
// azar, para que la imagen complemente el contenido.
// ---------------------------------------------------------------------------

export type PaletaIlustracion = { base: string; dark: string; soft: string }

export type IlustracionId =
  // Hogar / hospitalidad
  | 'casa' | 'mesa' | 'vela'
  // Corazón / fe
  | 'corazon' | 'manos' | 'llama'
  // Decisión / camino
  | 'bifurcacion' | 'brujula' | 'huellas'
  // Milagro / resurrección
  | 'manantial' | 'semilla' | 'amanecer'
  // Bíblica genérica
  | 'rollo' | 'cayado' | 'paloma'
  // Refuerzos temáticos
  | 'biblia' | 'monte' | 'agua' | 'ciudad' | 'cruz'

// Orden importa: la primera categoría que coincida gana.
const REGLAS: { id: IlustracionId; re: RegExp }[] = [
  { id: 'casa', re: /(casa|hogar|hospitalidad|puerta|techo|morada|habitac|recibir)/ },
  { id: 'mesa', re: /(mesa|banquete|comida|pan|cena|convite|partir el pan|compartir)/ },
  { id: 'vela', re: /(vela|candelabro|candela|lámpara|lampara|antorcha|alumbrar)/ },
  { id: 'corazon', re: /(corazón|corazon|amor|amar|misericord|compasión|compasion)/ },
  { id: 'manos', re: /(manos|oración|oracion|orar|súplica|suplica|clamor|entrega)/ },
  { id: 'llama', re: /(fuego|llama|espíritu santo|espiritu santo|pentecost|arder|avivamiento)/ },
  { id: 'bifurcacion', re: /(decisión|decision|decidir|elegir|elección|eleccion|bifurc|dos caminos|encrucijada)/ },
  { id: 'brujula', re: /(brújula|brujula|dirección|direccion|guía|guia|rumbo|propósito|proposito|voluntad de dios)/ },
  { id: 'huellas', re: /(huellas|pasos|caminar|seguir|discipulado|sendero|andar)/ },
  { id: 'manantial', re: /(manantial|fuente|agua viva|río|rio|pozo|bautis|sanidad|sanar|limpia)/ },
  { id: 'semilla', re: /(semilla|sembrar|fruto|crecimiento|resurrección|resurreccion|vida nueva|renacer|brote)/ },
  { id: 'amanecer', re: /(amanecer|alba|nuevo día|nuevo dia|esperanza|aurora|madrugada|nuevo comienzo)/ },
  { id: 'rollo', re: /(rollo|pergamino|escritura|palabra de dios|profecía|profecia|la ley)/ },
  { id: 'cayado', re: /(cayado|pastor|oveja|rebaño|rebano|cordero|guía|guia)/ },
  { id: 'paloma', re: /(paloma|paz|espíritu|espiritu|cielo|bautismo|dove)/ },
  { id: 'monte', re: /(monte|montaña|montana|sinaí|sinai|sion|calvario|colina|cima)/ },
  { id: 'ciudad', re: /(ciudad|jerusalén|jerusalen|templo|muro|reino|nación|nacion)/ },
  { id: 'cruz', re: /(cruz|sacrificio|sangre|reden|expiaci|calvario|perdón|perdon)/ },
  { id: 'biblia', re: /(biblia|evangelio|versículo|versiculo|estudio|texto bíblico|texto biblico)/ },
  { id: 'agua', re: /(agua|mar|océano|oceano|lluvia|ola|tormenta|pesca)/ },
]

export function elegirIlustracion(semilla: string): IlustracionId {
  const s = (semilla || '').toLowerCase()
  for (const regla of REGLAS) if (regla.re.test(s)) return regla.id
  return 'biblia'
}

export function categoriaIlustracion(id: IlustracionId): string {
  if (['casa', 'mesa', 'vela'].includes(id)) return 'Hogar y hospitalidad'
  if (['corazon', 'manos', 'llama'].includes(id)) return 'Corazón y fe'
  if (['bifurcacion', 'brujula', 'huellas'].includes(id)) return 'Decisión y camino'
  if (['manantial', 'semilla', 'amanecer'].includes(id)) return 'Milagro y resurrección'
  if (['rollo', 'cayado', 'paloma'].includes(id)) return 'Bíblica'
  return 'Temática'
}

// ---------------------------------------------------------------------------
// Trazo de la ilustración (viewBox 120×120).
// ---------------------------------------------------------------------------
function figura(id: IlustracionId, base: string, dark: string, soft: string): React.ReactNode {
  const trazo = {
    fill: 'none',
    stroke: base,
    strokeWidth: 5,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }
  switch (id) {
    case 'casa':
      return (
        <>
          <path {...trazo} d="M26 60 60 32l34 28" />
          <path {...trazo} d="M34 58v34h52V58" />
          <rect x="53" y="72" width="16" height="20" rx="2" fill={dark} />
          <rect x="40" y="66" width="9" height="9" rx="1" fill={base} />
          <path {...trazo} d="M72 40v-9h7v15" />
        </>
      )
    case 'mesa':
      return (
        <>
          <path {...trazo} d="M30 66h60" />
          <path {...trazo} d="M36 66v22M84 66v22" />
          <ellipse cx="60" cy="56" rx="16" ry="7" fill={soft} stroke={base} strokeWidth="4" />
          <path {...trazo} d="M74 46v-8h10v8" />
          <path {...trazo} d="M40 46h8v10h-8z" fill={dark} />
        </>
      )
    case 'vela':
      return (
        <>
          <path {...trazo} d="M60 78v-30" />
          <ellipse cx="60" cy="92" rx="20" ry="6" fill={dark} />
          <path d="M60 26c8 8 12 14 12 20a12 12 0 0 1-24 0c0-6 4-12 12-20z" fill={base} opacity="0.85" />
          <path d="M60 36c4 5 6 8 6 11a6 6 0 0 1-12 0c0-3 2-6 6-11z" fill={soft} />
        </>
      )
    case 'corazon':
      return (
        <>
          <path d="M60 88C34 70 26 56 34 46a16 16 0 0 1 26-2 16 16 0 0 1 26 2c8 10 0 24-26 42z" fill={base} opacity="0.85" />
          <g stroke={dark} strokeWidth="4" strokeLinecap="round">
            <path d="M60 20v-8M38 26l-6-6M82 26l6-6" />
          </g>
        </>
      )
    case 'manos':
      return (
        <>
          <path {...trazo} d="M28 92c0-16 7-26 14-30M92 92c0-16-7-26-14-30" />
          <path d="M60 34c9 8 14 15 14 22a14 14 0 0 1-28 0c0-7 5-14 14-22z" fill={base} opacity="0.85" />
          <path {...trazo} d="M42 92h36" />
        </>
      )
    case 'llama':
      return (
        <>
          <path d="M60 22c14 16 22 26 22 36a22 22 0 0 1-44 0c0-10 8-20 22-36z" fill={base} opacity="0.85" />
          <path d="M60 44c7 9 11 15 11 21a11 11 0 0 1-22 0c0-6 4-12 11-21z" fill={soft} />
        </>
      )
    case 'bifurcacion':
      return (
        <>
          <path {...trazo} d="M60 96V60" />
          <path {...trazo} d="M60 60C60 44 44 42 36 30" />
          <path {...trazo} d="M60 60c0-16 16-18 24-30" />
          <path d="M36 30l-8-2 4 8z" fill={base} />
          <path d="M84 30l8-2-4 8z" fill={dark} />
        </>
      )
    case 'brujula':
      return (
        <>
          <circle cx="60" cy="60" r="34" {...trazo} />
          <path d="M60 60 78 42 66 66 42 78z" fill={base} opacity="0.85" />
          <circle cx="60" cy="60" r="4" fill={dark} />
          <path {...trazo} d="M60 18v8M60 94v8M18 60h8M94 60h8" />
        </>
      )
    case 'huellas':
      return (
        <>
          <ellipse cx="45" cy="46" rx="11" ry="16" fill={base} opacity="0.8" />
          <ellipse cx="76" cy="72" rx="11" ry="16" fill={dark} opacity="0.75" />
          <circle cx="45" cy="26" r="4" fill={base} />
          <circle cx="76" cy="52" r="4" fill={dark} />
        </>
      )
    case 'manantial':
      return (
        <>
          <path {...trazo} d="M28 96h64" />
          <path {...trazo} d="M40 96c0-14 8-22 20-22s20 8 20 22" />
          <path d="M60 30c8 8 12 14 12 20a12 12 0 0 1-24 0c0-6 4-12 12-20z" fill={base} opacity="0.85" />
          <path {...trazo} d="M30 62c8 6 14 6 22 0M68 62c8 6 14 6 22 0" />
        </>
      )
    case 'semilla':
      return (
        <>
          <path {...trazo} d="M34 92h52" />
          <path {...trazo} d="M60 92V66" />
          <path d="M60 66c-2-14-14-18-22-14 0 10 10 16 22 14z" fill={base} opacity="0.85" />
          <path d="M60 60c2-14 14-18 22-14 0 10-10 16-22 14z" fill={dark} opacity="0.8" />
          <circle cx="60" cy="26" r="12" fill={soft} stroke={base} strokeWidth="4" />
        </>
      )
    case 'amanecer':
      return (
        <>
          <path {...trazo} d="M24 86h72" />
          <path d="M60 86a24 24 0 0 1 48 0z" fill={base} opacity="0.8" transform="translate(-24 0)" />
          <g stroke={base} strokeWidth="4" strokeLinecap="round">
            <path d="M60 34v-12M36 44l-8-8M84 44l8-8" />
          </g>
        </>
      )
    case 'rollo':
      return (
        <>
          <path {...trazo} d="M34 30h52v60H34z" fill={soft} />
          <path {...trazo} d="M34 30h-8v60h8M86 30h8v60h-8" />
          <path {...trazo} d="M46 50h28M46 62h28M46 74h18" />
        </>
      )
    case 'cayado':
      return (
        <>
          <path {...trazo} d="M44 96V34" />
          <path {...trazo} d="M44 34c0-12 10-18 20-14" />
          <circle cx="80" cy="80" r="10" fill={base} opacity="0.8" />
          <circle cx="94" cy="88" r="8" fill={dark} opacity="0.7" />
          <path {...trazo} d="M70 92h20" />
        </>
      )
    case 'paloma':
      return (
        <>
          <path d="M34 70c14-6 22-18 30-34 6 12 14 18 26 22-10 6-16 14-18 26-14 0-28-4-38-14z" fill={base} opacity="0.8" />
          <path {...trazo} d="M34 70c-6 6-8 14-6 20" />
          <path {...trazo} d="M70 74c8 2 14 8 16 16" />
          <circle cx="72" cy="44" r="2.5" fill={dark} />
        </>
      )
    case 'monte':
      return (
        <>
          <path d="M18 92 48 44l30 48z" fill={base} opacity="0.75" />
          <path d="M54 92 84 52l22 40z" fill={dark} opacity="0.7" />
          <circle cx="86" cy="30" r="9" fill={soft} stroke={base} strokeWidth="4" />
        </>
      )
    case 'ciudad':
      return (
        <>
          <path {...trazo} d="M28 92V58h16v34M56 92V40h18v52M86 92V64h12v28" />
          <path {...trazo} d="M20 92h72" />
          <circle cx="65" cy="30" r="8" fill={base} opacity="0.75" />
        </>
      )
    case 'cruz':
      return (
        <>
          <path d="M56 22h8v22h18v8H64v46h-8V52H38v-8h18z" fill={dark} />
          <circle cx="60" cy="60" r="30" fill="none" stroke={base} strokeWidth="4" opacity="0.5" />
        </>
      )
    case 'agua':
      return (
        <>
          <path d="M18 62c10-8 20-8 30 0s20 8 30 0 20-8 30 0" fill="none" stroke={base} strokeWidth="6" strokeLinecap="round" />
          <path d="M18 78c10-8 20-8 30 0s20 8 30 0 20-8 30 0" fill="none" stroke={dark} strokeWidth="6" strokeLinecap="round" opacity="0.8" />
          <path d="M60 22c10 10 15 17 15 24a15 15 0 0 1-30 0c0-7 5-14 15-24z" fill={base} opacity="0.7" />
        </>
      )
    case 'biblia':
    default:
      return (
        <>
          <path d="M60 40c-12-9-28-9-38-4v50c10-5 26-5 38 4z" fill={soft} stroke={base} strokeWidth="5" />
          <path d="M60 40c12-9 28-9 38-4v50c-10-5-26-5-38 4z" fill={soft} stroke={base} strokeWidth="5" />
          <path {...trazo} d="M60 40v50" />
          <g stroke={base} strokeWidth="4" strokeLinecap="round" opacity="0.6">
            <path d="M34 54h14M34 66h14M72 54h14M72 66h14" />
          </g>
        </>
      )
  }
}

export function Ilustracion({
  id,
  size = 120,
  pal,
}: {
  id: IlustracionId
  size?: number
  pal: PaletaIlustracion
}) {
  const { base, dark, soft } = pal
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" aria-hidden="true" style={{ display: 'block' }}>
      <circle cx="60" cy="60" r="56" fill={soft} />
      {figura(id, base, dark, soft)}
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Conectores narrativos: flecha curva que une el nodo del timeline con su
// tarjeta cuando el contenido queda descentrado.
// ---------------------------------------------------------------------------
export function ConectorNodo({
  lado,
  ancho,
  alto,
  color,
  opacidad = 0.55,
}: {
  lado: 'left' | 'right'
  ancho: number
  alto: number
  color: string
  opacidad?: number
}) {
  const curva = Math.max(24, ancho * 0.5)
  const d =
    lado === 'right'
      ? `M2 ${alto * 0.5} C ${curva} ${alto * 0.5}, ${ancho - curva} ${alto * 0.5}, ${ancho - 8} ${alto * 0.5}`
      : `M${ancho - 2} ${alto * 0.5} C ${ancho - curva} ${alto * 0.5}, ${curva} ${alto * 0.5}, 8 ${alto * 0.5}`
  const punta = lado === 'right' ? `M${ancho - 14} ${alto * 0.5 - 6} L${ancho - 4} ${alto * 0.5} L${ancho - 14} ${alto * 0.5 + 6}`
    : `M14 ${alto * 0.5 - 6} L4 ${alto * 0.5} L14 ${alto * 0.5 + 6}`
  return (
    <svg width={ancho} height={alto} viewBox={`0 0 ${ancho} ${alto}`} aria-hidden="true" style={{ display: 'block' }}>
      <path d={d} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeDasharray="2 7" opacity={opacidad} />
      <path d={punta} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" opacity={opacidad} />
    </svg>
  )
}

// Micro-flecha / breadcrumb para listas largas (refuerza el orden de lectura).
export function Breadcrumb({ color, size = 14 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={{ display: 'block' }}>
      <path d="M6 9l6 6 6-6" fill="none" stroke={color} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
    </svg>
  )
}

// Barra de progreso segmentada: comunica "punto N de M" en composiciones largas.
export function BarraProgreso({
  total,
  colorActivo,
  colorInactivo,
  etiquetaColor,
  small,
}: {
  total: number
  colorActivo: string
  colorInactivo: string
  etiquetaColor: string
  small: number
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: Math.round(small * 0.4), width: '100%' }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <span
            style={{
              width: '100%',
              height: Math.max(4, Math.round(small * 0.32)),
              borderRadius: 999,
              background: i < total - 1 ? colorActivo : colorInactivo,
              opacity: 1 - i * (0.5 / Math.max(1, total)),
            }}
          />
          <span style={{ fontSize: small * 0.72, fontWeight: 800, color: etiquetaColor, letterSpacing: '0.04em' }}>
            {String(i + 1).padStart(2, '0')}
          </span>
        </div>
      ))}
    </div>
  )
}
