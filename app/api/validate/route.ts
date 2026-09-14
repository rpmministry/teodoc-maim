/* eslint-disable @typescript-eslint/no-explicit-any */
import { Type } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';
import { generarJsonConGemini } from '@/lib/ai-gemini';
import { permitirPeticion } from '@/lib/rate-limit';

export const maxDuration = 30;
export const dynamic = 'force-dynamic';

// Filtro duro MUY bajo: solo atrapa audios accidentales/silencio/palabras
// aisladas. No rechaza mensajes cortos o con pausas (eso lo decide la IA).
const MIN_PALABRAS = 12;
const MAX_CHARS_VALIDACION = 40_000;
const MAX_CONTENT_LENGTH = 1_000_000;

export type MotivoValidacion = 'valido' | 'corto' | 'no_relacionado';

function normalizar(texto: string): string {
  return (texto || '').replace(/\s+/g, ' ').trim();
}

function contarPalabras(texto: string): number {
  return normalizar(texto).split(' ').filter(Boolean).length;
}

const SCHEMA = {
  type: Type.OBJECT,
  properties: {
    valido: { type: Type.BOOLEAN },
    motivo: { type: Type.STRING },
    razon: { type: Type.STRING },
  },
  required: ['valido', 'motivo'],
};

const SYSTEM_PROMPT = `Eres un filtro de admisión amable y LENIENTE para TeoDoc, una app que analiza mensajes y enseñanzas cristianas evangélicas.
Decide si la transcripción recibida puede analizarse como un mensaje/enseñanza cristiana.

Marca valido=false SOLO en estos dos casos:
1) motivo="corto": casi no hay contenido útil. Ruido, silencio, audio accidental, frases inconexas o palabras aisladas sin un mensaje comprensible.
2) motivo="no_relacionado": el tema central es claramente ajeno al propósito cristiano evangélico (por ejemplo deportes, cocina, tecnología, publicidad, chistes sin contenido de fe) y no contiene enseñanza bíblica ni cristiana aprovechable.

Marca valido=true (motivo="valido") en cualquier otro caso. NO penalices por:
- ser corto o tener pocos minutos;
- tener pocas palabras;
- contener silencios, pausas o música;
- comenzar con introducción, saludos o anuncios;
- ser una reflexión breve o un devocional corto.
Ante duda razonable, responde valido=true.

Responde ÚNICAMENTE JSON: {"valido": boolean, "motivo": "valido"|"corto"|"no_relacionado", "razon": "breve"}`;

async function clasificarConGemini(text: string): Promise<{ valido: boolean; motivo: MotivoValidacion } | null> {
  const parsed = await generarJsonConGemini({
    contents: `Transcripción a evaluar:\n"""${text}"""`,
    systemInstruction: SYSTEM_PROMPT,
    responseSchema: SCHEMA,
    retryDelayMs: 1000,
    onError: (modelo, msg) => console.warn(`[Validación - Gemini ${modelo}]:`, msg),
  });
  if (!parsed) return null;

  // La decisión se basa en el booleano; el motivo solo elige el mensaje.
  const valido = parsed?.valido === true;
  const motivo: MotivoValidacion =
    parsed?.motivo === 'corto' || parsed?.motivo === 'no_relacionado' ? parsed.motivo : 'no_relacionado';
  return { valido, motivo: valido ? 'valido' : motivo };
}

export async function POST(req: NextRequest) {
  try {
    // Barrera anti-abuso para un endpoint con costo (fail-open para el usuario).
    if (!permitirPeticion(req, 20, 60_000)) {
      return NextResponse.json({ valido: true, motivo: 'valido' as MotivoValidacion });
    }

    // Cuerpo desmesurado: no lo procesamos (fail-open, no bloquea mensajes).
    const len = Number(req.headers.get('content-length') || 0);
    if (Number.isFinite(len) && len > MAX_CONTENT_LENGTH) {
      return NextResponse.json({ valido: true, motivo: 'valido' as MotivoValidacion });
    }

    const body = await req.json();
    const raw = typeof body?.text === 'string' ? body.text : '';
    // Acotamos ANTES de normalizar/contar para no procesar entradas enormes.
    const text = normalizar(raw.slice(0, MAX_CHARS_VALIDACION));

    if (!text || contarPalabras(text) < MIN_PALABRAS) {
      return NextResponse.json({ valido: false, motivo: 'corto' as MotivoValidacion });
    }

    // Evaluación de contenido (leniente). Si la IA falla, NO bloqueamos:
    // la prioridad es no rechazar un mensaje válido.
    const resultado = await clasificarConGemini(text.slice(0, 8000));
    if (!resultado) return NextResponse.json({ valido: true, motivo: 'valido' as MotivoValidacion });

    return NextResponse.json(resultado);
  } catch (error: any) {
    console.error('[Validación] Error:', error?.message || error);
    // Fail-open: ante cualquier error, permitimos continuar con el análisis.
    return NextResponse.json({ valido: true, motivo: 'valido' as MotivoValidacion });
  }
}
