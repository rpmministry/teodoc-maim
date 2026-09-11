/* eslint-disable @typescript-eslint/no-explicit-any */
import { GoogleGenAI, Type } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function extraerJSON(texto: string) {
  let limpio = texto.trim();
  if (limpio.startsWith('```json')) limpio = limpio.replace(/^```json/, '').replace(/```$/, '').trim();
  else if (limpio.startsWith('```')) limpio = limpio.replace(/^```/, '').replace(/```$/, '').trim();
  return JSON.parse(limpio);
}

const SYSTEM_PROMPT = `Eres un analista teológico conservador. Analiza la transcripción de la prédica y devuelve ÚNICAMENTE un objeto JSON válido (sin markdown fuera del JSON) con esta estructura exacta:
    {
      "titulo": "...",
      "idea_principal": "...",
      "infografia": { "frase_corta": "...", "texto_clave": "...", "contexto_breve": "..." },
      "desarrollo_progresivo": [ { "punto": "...", "explicacion": "...", "versiculos": [ { "cita": "...", "texto": "..." } ] } ],
      "aplicacion": ["...", "..."],
      "oracion": "..."
    }
    Usa Reina-Valera 1960 para todos los versículos bíblicos.`;

const MODELOS_GEMINI = ['gemini-3.7-flash', 'gemini-3.6-flash'];
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
  for (const modelo of MODELOS_GEMINI) {
    for (let i = 0; i < 2; i++) {
      try {
        const response = await ai.models.generateContent({
          model: modelo,
          contents: [{ text: `Analiza esta transcripción de prédica y extrae el desglose teológico completo en JSON:\n\n${text}` }],
          config: {
            systemInstruction: 'Eres un analista teológico conservador. Usa Reina-Valera 1960. Devuelve un JSON estrictamente estructurado.',
            responseMimeType: 'application/json',
            responseSchema: SCHEMA_CONFIG,
          },
        });
        if (response && response.text) return extraerJSON(response.text);
      } catch (err: any) {
        const msg = err?.message || '';
        console.warn(`[Gemini Falló - ${modelo}]:`, msg);
        if ((msg.includes('429') || msg.includes('503')) && i === 0) {
          await delay(1200);
          continue;
        }
        break; // pasa al siguiente modelo
      }
    }
  }
  return null;
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
