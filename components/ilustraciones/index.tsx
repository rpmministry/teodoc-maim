'use client'

import React from 'react'

// ---------------------------------------------------------------------------
// Biblioteca de Ilustraciones Editoriales TeoDoc
// Composiciones vectoriales SVG con profundidad, gradientes y estilo editorial
// moderno. Relacionadas temáticamente con el mensaje real.
// ---------------------------------------------------------------------------

export type IlustracionId =
  | 'batalla'    // David y Goliat, armadura de Dios, victoria
  | 'exodo'      // Éxodo, desierto, columna de nube/fuego, travesía
  | 'jesus'      // Jesús enseñando, maestro, sermón del monte
  | 'fe'         // La fe, el faro en la tormenta, el ancla, certeza
  | 'gracia'     // La cruz gloriosa, redención, perdón, sangre de Cristo
  | 'espiritu'   // Espíritu Santo, Pentecostés, llama viva, paloma
  | 'palabra'    // Biblia abierta, códice, sabiduría divina
  | 'pastor'     // El Buen Pastor, cayado, aguas de reposo
  | 'oracion'    // Oración, altar, clamor, manos levantadas
  | 'ciudad'     // Jerusalén celestial, reino, templo
  | 'semilla'    // Crecimiento, fruto, siembra, árbol de vida
  | 'camino'     // El sendero, brújula, pasos de obediencia
  | 'comunidad'  // La iglesia, unidad del cuerpo, amor fraternal

export type PaletaIlustracion = {
  primary: string
  secondary: string
  accent: string
  glow: string
}

const REGLAS_TEMATICAS: { id: IlustracionId; re: RegExp }[] = [
  { id: 'batalla', re: /(david|goliat|gigante|batalla|filisteo|escudo|armadura|espada|victoria|vencer|pelea|honda|enemigo|fortaleza)/i },
  { id: 'exodo', re: /(éxodo|exodo|desierto|mar rojo|egipto|sinaí|sinai|maná|mana|columna de fuego|nube|moisés|moises|travesía|travesia|peregrinaje|tierra prometida)/i },
  { id: 'jesus', re: /(jesús|jesus|cristo|mesías|mesias|sermón|sermon|bienaventuranz|galilea|parábola|parabola|maestro|discípulo|discipulo|nazaret|sanidad)/i },
  { id: 'gracia', re: /(gracia|cruz|calvario|redención|redencion|perdón|perdon|sacrificio|sangre|salvación|salvacion|expiación|expiacion|justificad)/i },
  { id: 'espiritu', re: /(espíritu santo|espiritu santo|pentecostés|pentecostes|fuego|llama|avivamiento|unción|uncion|consolador|viento)/i },
  { id: 'fe', re: /(fe|creer|confianza|fidelidad|certeza|convicción|conviccion|ancla|faro|esperanza|esperar)/i },
  { id: 'pastor', re: /(pastor|oveja|rebaño|rebano|salmo 23|cayado|vara|aguas de reposo|delicados pastos|verde pasto)/i },
  { id: 'oracion', re: /(oración|oracion|orar|clamor|súplica|suplica|intercesión|intercesion|altar|incienso|adoración|adoracion)/i },
  { id: 'ciudad', re: /(ciudad|jerusalén|jerusalen|sion|reino de dios|templo|muros|nueva jerusalén|cielo|celestial)/i },
  { id: 'semilla', re: /(semilla|sembrar|fruto|árbol|arbol|cosecha|raíz|raiz|crecimiento|resurrección|resurreccion|vida nueva)/i },
  { id: 'camino', re: /(camino|sendero|senda|pasos|dirección|direccion|brújula|brujula|guiar|guía|guia|rumbo|andar)/i },
  { id: 'comunidad', re: /(comunidad|iglesia|cuerpo|hermano|prójimo|projimo|comunión|comunion|unidad|servir|servicio|compartir)/i },
  { id: 'palabra', re: /(biblia|palabra|escritura|evangelio|versículo|versiculo|mandamiento|ley|profecía|profecia|revelación|revelacion)/i },
]

export function elegirIlustracion(texto: string): IlustracionId {
  const t = String(texto || '').toLowerCase()
  for (const regla of REGLAS_TEMATICAS) {
    if (regla.re.test(t)) return regla.id
  }
  return 'palabra'
}

export function categoriaIlustracion(id: IlustracionId): string {
  const nombres: Record<IlustracionId, string> = {
    batalla: 'Victoria y Fortaleza',
    exodo: 'Éxodo y Provisión',
    jesus: 'Enseñanza de Cristo',
    fe: 'Fe y Confianza',
    gracia: 'Gracia y Redención',
    espiritu: 'Poder del Espíritu',
    palabra: 'Sabiduría Bíblica',
    pastor: 'Cuidado Pastoral',
    oracion: 'Comunión y Oración',
    ciudad: 'Reino Celestial',
    semilla: 'Crecimiento Espiritual',
    camino: 'El Camino de Dios',
    comunidad: 'El Cuerpo de Cristo',
  }
  return nombres[id] || 'Estudio Bíblico'
}

// ---------------------------------------------------------------------------
// Vectores Editoriales Premium (viewBox 300×300)
// Estilizados, limpios, con capas de gradientes, geometrías y resplandor
// ---------------------------------------------------------------------------
function ArteVectorial({ id, pal }: { id: IlustracionId; pal: PaletaIlustracion }) {
  const { primary, secondary, accent, glow } = pal
  const gradId = `grad-${id}-${Math.floor(Math.random() * 1000)}`

  switch (id) {
    case 'batalla':
      return (
        <g>
          <defs>
            <linearGradient id={`${gradId}-shield`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={accent} />
              <stop offset="100%" stopColor={primary} />
            </linearGradient>
            <radialGradient id={`${gradId}-glow`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={glow} stopOpacity="0.4" />
              <stop offset="100%" stopColor={glow} stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="150" cy="150" r="140" fill={`url(#${gradId}-glow)`} />
          {/* Escudo de la fe */}
          <path
            d="M150 40 L220 70 V150 C220 210 150 250 150 250 C150 250 80 210 80 150 V70 Z"
            fill={`url(#${gradId}-shield)`}
            stroke="#ffffff"
            strokeWidth="4"
            opacity="0.9"
          />
          {/* Detalles heráldicos internos */}
          <path
            d="M150 60 L200 82 V145 C200 192 150 225 150 225 C150 225 100 192 100 145 V82 Z"
            fill="none"
            stroke="#ffffff"
            strokeWidth="2"
            opacity="0.5"
          />
          {/* Honda y corona */}
          <circle cx="150" cy="140" r="32" fill={secondary} opacity="0.85" />
          <path d="M135 135 L145 125 L150 135 L155 125 L165 135 V145 H135 Z" fill="#ffffff" />
          <circle cx="150" cy="180" r="6" fill="#ffffff" />
          <circle cx="136" cy="190" r="5" fill="#ffffff" opacity="0.8" />
          <circle cx="164" cy="190" r="5" fill="#ffffff" opacity="0.8" />
          {/* Rayos de victoria */}
          <line x1="150" y1="15" x2="150" y2="32" stroke={accent} strokeWidth="4" strokeLinecap="round" />
          <line x1="225" y1="45" x2="213" y2="57" stroke={accent} strokeWidth="3" strokeLinecap="round" />
          <line x1="75" y1="45" x2="87" y2="57" stroke={accent} strokeWidth="3" strokeLinecap="round" />
        </g>
      )

    case 'exodo':
      return (
        <g>
          <defs>
            <linearGradient id={`${gradId}-mount`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={accent} />
              <stop offset="100%" stopColor={primary} />
            </linearGradient>
            <radialGradient id={`${gradId}-sun`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="60%" stopColor={accent} stopOpacity="0.6" />
              <stop offset="100%" stopColor={primary} stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="150" cy="110" r="80" fill={`url(#${gradId}-sun)`} />
          {/* Montañas del Sinaí */}
          <polygon points="40,240 140,110 240,240" fill={`url(#${gradId}-mount)`} opacity="0.75" />
          <polygon points="120,240 200,90 280,240" fill={primary} opacity="0.9" />
          {/* Columna de fuego / resplandor */}
          <rect x="144" y="20" width="12" height="120" rx="6" fill="#ffffff" opacity="0.9" />
          <circle cx="150" cy="24" r="18" fill={accent} opacity="0.8" />
          {/* Sendero en el desierto */}
          <path d="M150 160 Q140 200 110 250" stroke="#ffffff" strokeWidth="4" fill="none" strokeDasharray="6 6" />
        </g>
      )

    case 'jesus':
      return (
        <g>
          <defs>
            <radialGradient id={`${gradId}-halo`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="50%" stopColor={accent} stopOpacity="0.8" />
              <stop offset="100%" stopColor={primary} stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="150" cy="130" r="95" fill={`url(#${gradId}-halo)`} opacity="0.6" />
          {/* Resplandor divino */}
          <circle cx="150" cy="115" r="48" fill="none" stroke="#ffffff" strokeWidth="3" strokeDasharray="8 6" />
          <circle cx="150" cy="115" r="32" fill={primary} />
          {/* Silueta de enseñanza noble */}
          <path d="M110 240 C110 185 130 160 150 160 C170 160 190 185 190 240 Z" fill={secondary} opacity="0.9" />
          {/* Espigas de trigo / Pan de vida */}
          <path d="M85 240 Q100 195 115 180" stroke={accent} strokeWidth="3" fill="none" />
          <path d="M215 240 Q200 195 185 180" stroke={accent} strokeWidth="3" fill="none" />
          <circle cx="150" cy="90" r="10" fill="#ffffff" />
        </g>
      )

    case 'fe':
      return (
        <g>
          <defs>
            <linearGradient id={`${gradId}-light`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
              <stop offset="100%" stopColor={accent} stopOpacity="0.05" />
            </linearGradient>
          </defs>
          {/* Haz de luz de la fe */}
          <polygon points="150,90 20,240 280,240" fill={`url(#${gradId}-light)`} />
          {/* Torre del faro / Roca de la fe */}
          <polygon points="140,240 160,240 156,90 144,90" fill={primary} />
          <rect x="138" y="76" width="24" height="14" rx="2" fill={secondary} />
          <circle cx="150" cy="83" r="7" fill="#ffffff" />
          {/* Cúpula */}
          <path d="M140 76 Q150 62 160 76 Z" fill={accent} />
          {/* Ancla estilizada al pie */}
          <circle cx="150" cy="180" r="12" fill="none" stroke="#ffffff" strokeWidth="3" />
          <line x1="150" y1="192" x2="150" y2="235" stroke="#ffffff" strokeWidth="4" />
          <path d="M125 215 Q150 245 175 215" fill="none" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" />
        </g>
      )

    case 'gracia':
      return (
        <g>
          <defs>
            <radialGradient id={`${gradId}-crossglow`} cx="50%" cy="45%" r="55%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
              <stop offset="40%" stopColor={accent} stopOpacity="0.7" />
              <stop offset="100%" stopColor={primary} stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="150" cy="135" r="110" fill={`url(#${gradId}-crossglow)`} />
          {/* La Cruz radiante */}
          <rect x="141" y="45" width="18" height="180" rx="4" fill="#ffffff" />
          <rect x="90" y="85" width="120" height="18" rx="4" fill="#ffffff" />
          {/* Círculo de la eternidad / corona de gloria */}
          <circle cx="150" cy="94" r="44" fill="none" stroke={accent} strokeWidth="3" strokeDasharray="4 4" />
          <circle cx="150" cy="94" r="62" fill="none" stroke="#ffffff" strokeWidth="1.5" opacity="0.5" />
          {/* Rayos expansivos */}
          <line x1="150" y1="20" x2="150" y2="35" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
          <line x1="225" y1="94" x2="240" y2="94" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
          <line x1="75" y1="94" x2="60" y2="94" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
        </g>
      )

    case 'espiritu':
      return (
        <g>
          <defs>
            <linearGradient id={`${gradId}-flame`} x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor={primary} />
              <stop offset="50%" stopColor={accent} />
              <stop offset="100%" stopColor="#ffffff" />
            </linearGradient>
          </defs>
          {/* Resplandor de Pentecostés */}
          <circle cx="150" cy="140" r="105" fill={glow} opacity="0.3" />
          {/* Llama exterior */}
          <path
            d="M150 40 C175 85 210 120 210 165 C210 210 180 240 150 240 C120 240 90 210 90 165 C90 120 125 85 150 40 Z"
            fill={`url(#${gradId}-flame)`}
            opacity="0.9"
          />
          {/* Llama interior */}
          <path
            d="M150 95 C165 125 185 150 185 178 C185 208 168 226 150 226 C132 226 115 208 115 178 C115 150 135 125 150 95 Z"
            fill="#ffffff"
            opacity="0.9"
          />
          {/* Paloma de luz */}
          <path
            d="M130 160 C142 150 158 150 170 160 C160 172 140 172 130 160 Z"
            fill={primary}
          />
        </g>
      )

    case 'pastor':
      return (
        <g>
          <defs>
            <linearGradient id={`${gradId}-hills`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={accent} />
              <stop offset="100%" stopColor={primary} />
            </linearGradient>
          </defs>
          <circle cx="150" cy="110" r="70" fill={glow} opacity="0.35" />
          {/* Colinas de reposo */}
          <path d="M40 240 Q100 180 180 240 Z" fill={`url(#${gradId}-hills)`} opacity="0.8" />
          <path d="M120 240 Q190 160 270 240 Z" fill={primary} opacity="0.9" />
          {/* Cayado del Buen Pastor */}
          <path
            d="M142 240 V105 C142 75 175 75 175 95 C175 105 165 110 158 105"
            fill="none"
            stroke="#ffffff"
            strokeWidth="7"
            strokeLinecap="round"
          />
          {/* Oveja / Manada */}
          <ellipse cx="95" cy="205" rx="14" ry="10" fill="#ffffff" />
          <circle cx="85" cy="202" r="6" fill="#ffffff" />
          <ellipse cx="205" cy="210" rx="16" ry="11" fill="#ffffff" opacity="0.9" />
        </g>
      )

    case 'palabra':
    default:
      return (
        <g>
          <defs>
            <linearGradient id={`${gradId}-book`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={accent} />
              <stop offset="100%" stopColor={primary} />
            </linearGradient>
            <radialGradient id={`${gradId}-glow`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
              <stop offset="50%" stopColor={accent} stopOpacity="0.4" />
              <stop offset="100%" stopColor={glow} stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="150" cy="140" r="115" fill={`url(#${gradId}-glow)`} />
          {/* Páginas abiertas de las Sagradas Escrituras */}
          <path
            d="M150 170 Q100 155 50 170 V85 Q100 70 150 85 Z"
            fill="#ffffff"
            stroke={primary}
            strokeWidth="3"
          />
          <path
            d="M150 170 Q200 155 250 170 V85 Q200 70 150 85 Z"
            fill="#ffffff"
            stroke={primary}
            strokeWidth="3"
          />
          {/* Encuadernación y solapas */}
          <path
            d="M46 174 Q100 158 150 174 Q200 158 254 174 L250 185 Q200 170 150 185 Q100 170 46 185 Z"
            fill={primary}
          />
          {/* Líneas de texto bíblico en las páginas */}
          <line x1="72" y1="102" x2="128" y2="95" stroke={accent} strokeWidth="2.5" strokeLinecap="round" />
          <line x1="72" y1="116" x2="128" y2="109" stroke={accent} strokeWidth="2.5" strokeLinecap="round" />
          <line x1="72" y1="130" x2="114" y2="123" stroke={accent} strokeWidth="2.5" strokeLinecap="round" />
          <line x1="172" y1="95" x2="228" y2="102" stroke={accent} strokeWidth="2.5" strokeLinecap="round" />
          <line x1="172" y1="109" x2="228" y2="116" stroke={accent} strokeWidth="2.5" strokeLinecap="round" />
          <line x1="172" y1="123" x2="214" y2="130" stroke={accent} strokeWidth="2.5" strokeLinecap="round" />
          {/* Resplandor central de sabiduría */}
          <circle cx="150" cy="70" r="12" fill={accent} />
          <line x1="150" y1="40" x2="150" y2="52" stroke={accent} strokeWidth="3" strokeLinecap="round" />
          <line x1="128" y1="48" x2="137" y2="57" stroke={accent} strokeWidth="2.5" strokeLinecap="round" />
          <line x1="172" y1="48" x2="163" y2="57" stroke={accent} strokeWidth="2.5" strokeLinecap="round" />
        </g>
      )
  }
}

export function IlustracionEditorial({
  id,
  size = 200,
  pal,
  modo = 'hero',
}: {
  id: IlustracionId
  size?: number
  pal: PaletaIlustracion
  modo?: 'hero' | 'medio' | 'banner' | 'icono'
}) {
  const w = size
  const h = modo === 'banner' ? Math.round(size * 0.45) : size

  return (
    <div
      style={{
        width: w,
        height: h,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        flexShrink: 0,
      }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 300 300"
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
        style={{ display: 'block', overflow: 'visible' }}
      >
        <ArteVectorial id={id} pal={pal} />
      </svg>
    </div>
  )
}

// Compatibilidad hacia atrás con imports de componentes antiguos si existen
export const Ilustracion = IlustracionEditorial
export function BarraProgreso({ total, colorActivo }: { total: number; colorActivo: string }) {
  return (
    <div style={{ display: 'flex', gap: 6, width: '100%' }}>
      {Array.from({ length: total }).map((_, i) => (
        <span key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: colorActivo, opacity: 0.8 }} />
      ))}
    </div>
  )
}
