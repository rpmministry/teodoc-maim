import type { Analisis, PuntoDesarrollo, Versiculo } from '@/lib/sample-analysis'

export type GeminiAnalisis = {
  titulo_estudio: string
  idea_principal: string
  desarrollo_progresivo: Array<{
    titulo_punto: string
    explicacion_resumida: string
    versiculos_citados: unknown
  }>
  aplicacion_practica: unknown
  oracion_final: string
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function mapVersiculo(value: unknown): Versiculo | null {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return null
    const split = trimmed.split(/\s+[—–-]\s+|:\s+(?=[A-ZÁÉÍÓÚ«"])/)
    if (split.length >= 2) {
      return { cita: split[0].trim(), texto: split.slice(1).join(' — ').trim() }
    }
    return { cita: trimmed, texto: trimmed }
  }

  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>
    const cita = asString(record.cita ?? record.referencia ?? record.versiculo)
    const texto = asString(record.texto ?? record.texto_rv1960)
    if (!cita && !texto) return null
    return { cita: cita || 'Escritura', texto: texto || cita }
  }

  return null
}

function mapAplicaciones(value: unknown): Analisis['aplicaciones'] {
  const list = Array.isArray(value) ? value : []
  return list.slice(0, 3).map((item, index) => {
    const texto =
      typeof item === 'string'
        ? item.trim()
        : asString(
            item && typeof item === 'object'
              ? (item as Record<string, unknown>).paso ??
                  (item as Record<string, unknown>).texto ??
                  (item as Record<string, unknown>).aplicacion
              : '',
          )
    return { id: `app-${index + 1}`, texto }
  })
}

export function mapGeminiToAnalisis(raw: GeminiAnalisis): Analisis {
  const desarrollo: PuntoDesarrollo[] = (raw.desarrollo_progresivo ?? []).map(
    (punto) => ({
      subtitulo: asString(punto.titulo_punto),
      explicacion: asString(punto.explicacion_resumida),
      versiculos: (Array.isArray(punto.versiculos_citados)
        ? punto.versiculos_citados
        : []
      )
        .map(mapVersiculo)
        .filter((v): v is Versiculo => v !== null),
    }),
  )

  return {
    titulo: asString(raw.titulo_estudio) || 'Estudio bíblico',
    subtitulo: 'Reporte generado a partir del audio de la enseñanza',
    ideaPrincipal: asString(raw.idea_principal),
    desarrollo,
    aplicaciones: mapAplicaciones(raw.aplicacion_practica),
    oracion: asString(raw.oracion_final),
  }
}

export function parseGeminiJson(text: string): GeminiAnalisis {
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()
  const parsed = JSON.parse(cleaned) as GeminiAnalisis
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('La respuesta de Gemini no es un JSON válido.')
  }
  return parsed
}
