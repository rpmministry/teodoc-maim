/* eslint-disable @typescript-eslint/no-explicit-any */
import { Type } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';
import { delay, extraerJSON, generarJsonConGemini } from '@/lib/ai-gemini';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const REGLA_PUNTOS = `REGLA DE LOS PUNTOS PRINCIPALES (campo "desarrollo_progresivo"):
- La cantidad de puntos debe surgir del CONTENIDO REAL: identifica cuántas ideas o movimientos principales enseña verdaderamente la prédica.
- Puede haber 2, 3, 4, 5, 6, 7 o más puntos según el contenido. NO asumas 3 y NO fuerces una cantidad fija.
- NO agregues puntos para completar un número. NO dividas una misma idea para tener más. NO fusiones ideas distintas para tener menos.
- La duración del audio NO determina el número de puntos; lo determina la cantidad de ideas principales.
- Cada punto debe ser una idea sustantiva, distinta y fiel a la enseñanza.`;

const SYSTEM_PROMPT = `Eres un analista teológico conservador. Analiza la transcripción de la prédica y devuelve ÚNICAMENTE un objeto JSON válido (sin markdown fuera del JSON) con esta estructura exacta:
    {
      "titulo": "...",
      "idea_principal": "...",
      "infografia": { "frase_corta": "...", "texto_clave": "...", "contexto_breve": "..." },
      "desarrollo_progresivo": [ { "punto": "...", "explicacion": "...", "versiculos": [ { "cita": "...", "texto": "..." } ] } ],
      "aplicacion": ["...", "..."],
      "oracion": "..."
    }
    Usa Reina-Valera 1960 para todos los versículos bíblicos.
    ${REGLA_PUNTOS}`;

const MODELOS_OPENROUTER_DEFAULT = ['google/gemini-2.0-flash-exp:free', 'qwen/qwen-2.5-72b-instruct:free'];

const SCHEMA_CONFIG = {
  type: Type.OBJECT,
  properties: {
    titulo: { type: Type.STRING },
    idea_principal: { type: Type.STRING },
    infografia: { type: Type.OBJECT, properties: { frase_corta: { type: Type.STRING }, texto_clave: { type: Type.STRING }, contexto_breve: { type: Type.STRING } }, required: ['frase_corta', 'texto_clave', 'contexto_breve'] },
    desarrollo_progresivo: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { punto: { type: Type.STRING }, explicacion: { type: Type.STRING }, versiculos: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { cita: { type: Type.STRING }, texto: { type: Type.STRING } }, required: ['cita', 'texto'] } } }, required: ['punto', 'explicacion', 'versiculos'] } },
    aplicacion: { type: Type.ARRAY, items: { type: Type.STRING } },
    oracion: { type: Type.STRING },
  },
  required: ['titulo', 'idea_principal', 'infografia', 'desarrollo_progresivo', 'aplicacion', 'oracion'],
};

// Motor principal: Gemini (contexto amplio y respuesta rápida con salida JSON).
async function analizarConGemini(text: string): Promise<any | null> {
  return generarJsonConGemini({
    contents: `Analiza esta transcripción de prédica y extrae el desglose teológico completo en JSON:\n\n${text}`,
    systemInstruction: `Eres un analista teológico conservador. Usa Reina-Valera 1960. Devuelve un JSON estrictamente estructurado. ${REGLA_PUNTOS}`,
    responseSchema: SCHEMA_CONFIG,
    retryDelayMs: 1200,
    onError: (modelo, msg) => console.warn(`[Gemini Falló - ${modelo}]:`, msg),
  });
}

// Respaldo: OpenRouter con modelos gratuitos.
async function analizarConOpenRouter(text: string): Promise<any | null> {
  let modelos = MODELOS_OPENROUTER_DEFAULT;
  try {
    const resModels = await fetch('https://openrouter.ai/api/v1/models');
    if (resModels.ok) {
      const dataModels = await resModels.json();
      const vigentes = dataModels.data
        .filter((m: any) => m.id.endsWith(':free') && m.context_length >= 40000)
        .map((m: any) => m.id);
      if (vigentes.length > 0) modelos = vigentes.slice(0, 2);
    }
  } catch {
    console.warn('No se pudo obtener la lista dinámica, usando defaults.');
  }

  for (const modelo of modelos) {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://teodoc.app',
          'X-Title': 'TeoDoc Ministerial',
        },
        body: JSON.stringify({
          model: modelo,
          messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: `Transcripción:\n\n${text}` }],
          temperature: 0.3,
        }),
      });
      if (!response.ok) {
        if (response.status === 429 || response.status === 503) await delay(1200);
        continue;
      }
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (content) return extraerJSON(content);
    } catch (orErr: any) {
      console.warn(`[OpenRouter Falló - ${modelo}]:`, orErr?.message || orErr);
    }
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const text = body?.text;

    if (!text || text.trim().length === 0) {
      return NextResponse.json({ error: 'No se recibió texto para analizar.' }, { status: 400 });
    }

    console.log(`[Análisis] Texto recibido (${text.length} caracteres)`);

    let jsonResult = await analizarConGemini(text);
    if (!jsonResult) jsonResult = await analizarConOpenRouter(text);
    if (!jsonResult) {
      // 503 = transitorio: la app lo traduce a un mensaje amigable.
      return NextResponse.json({ error: 'busy' }, { status: 503 });
    }
    return NextResponse.json(jsonResult);
  } catch (error: any) {
    console.error('[Análisis] Error:', error?.message || error);
    return NextResponse.json({ error: 'busy' }, { status: 503 });
  }
}
