import { GoogleGenAI, Type } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function extraerJSON(texto: string) {
  let limpio = texto.trim();
  if (limpio.startsWith('```json')) limpio = limpio.replace(/^```json/, '').replace(/```$/, '').trim();
  else if (limpio.startsWith('```')) limpio = limpio.replace(/^```/, '').replace(/```$/, '').trim();
  return JSON.parse(limpio);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text } = body;

    if (!text || text.trim().length === 0) {
      return NextResponse.json({ error: 'No se recibió texto para analizar.' }, { status: 400 });
    }

    console.log(`[Análisis] Texto recibido (${text.length} caracteres)`);

    let jsonResult: any = null;
    let exito = false;

    const systemPrompt = `Eres un analista teológico conservador. Analiza la transcripción de la prédica y devuelve ÚNICAMENTE un objeto JSON válido (sin markdown fuera del JSON) con esta estructura exacta:
    {
      "titulo": "...",
      "idea_principal": "...",
      "infografia": { "frase_corta": "...", "texto_clave": "...", "contexto_breve": "..." },
      "desarrollo_progresivo": [ { "punto": "...", "explicacion": "...", "versiculos": [ { "cita": "...", "texto": "..." } ] } ],
      "aplicacion": ["...", "..."],
      "oracion": "..."
    }
    Usa Reina-Valera 1960 para todos los versículos bíblicos.`;

    let modelosGratuitos = ['google/gemini-2.0-flash-exp:free', 'qwen/qwen-2.5-72b-instruct:free'];

    try {
      const resModels = await fetch('https://openrouter.ai/api/v1/models');
      if (resModels.ok) {
        const dataModels = await resModels.json();
        const vigentes = dataModels.data
          .filter((m: any) => m.id.endsWith(':free') && m.context_length >= 40000)
          .map((m: any) => m.id);
        if (vigentes.length > 0) modelosGratuitos = vigentes.slice(0, 2);
      }
    } catch (e) {
      console.warn('No se pudo obtener la lista dinámica, usando defaults.');
    }

    for (const modelo of modelosGratuitos) {
      if (exito) break;
      let intentosOR = 2;
      let esperaBaseOR = 1500;

      for (let i = 0; i < intentosOR; i++) {
        try {
          const responseOR = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': 'http://localhost:3000', 
              'X-Title': 'TeoDoc Ministerial'
            },
            body: JSON.stringify({
              model: modelo,
              messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: `Transcripción:\n\n${text}` }],
              temperature: 0.3
            })
          });

          if (!responseOR.ok) {
            const dataError = await responseOR.json().catch(() => ({}));
            const status = responseOR.status;
            
            if (status === 429 || status === 503) {
              const retryAfter = responseOR.headers.get('Retry-After');
              let tiempoEspera = esperaBaseOR * Math.pow(2, i);

              if (retryAfter) {
                const retrySeconds = parseInt(retryAfter, 10);
                if (!isNaN(retrySeconds) && retrySeconds > 0 && retrySeconds <= 15) tiempoEspera = retrySeconds * 1000;
              }
              
              if (i < intentosOR - 1) {
                await delay(tiempoEspera);
                continue;
              }
            }
            throw new Error(dataError.error?.message || `Error HTTP: ${status}`);
          }

          const dataOR = await responseOR.json();
          const content = dataOR.choices?.[0]?.message?.content;
          
          if (content) {
            jsonResult = extraerJSON(content);
            exito = true;
            break;
          }
        } catch (orErr: any) {
          console.warn(`[OpenRouter Falló - ${modelo}]:`, orErr?.message || orErr);
          break;
        }
      }
    }

    if (!exito) {
      // Modelos Gemini vigentes. Se prueban en orden para que, si uno está
      // saturado, el respaldo use el otro.
      const modelosGemini = ['gemini-3.7-flash', 'gemini-3.6-flash'];
      const intentosGemini = 2;
      const esperaBaseGemini = 3000;

      const schemaConfig = {
        type: Type.OBJECT,
        properties: {
          titulo: { type: Type.STRING },
          idea_principal: { type: Type.STRING },
          infografia: { type: Type.OBJECT, properties: { frase_corta: { type: Type.STRING }, texto_clave: { type: Type.STRING }, contexto_breve: { type: Type.STRING } }, required: ["frase_corta", "texto_clave", "contexto_breve"] },
          desarrollo_progresivo: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { punto: { type: Type.STRING }, explicacion: { type: Type.STRING }, versiculos: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { cita: { type: Type.STRING }, texto: { type: Type.STRING } }, required: ["cita", "texto"] } } }, required: ["punto", "explicacion", "versiculos"] } },
          aplicacion: { type: Type.ARRAY, items: { type: Type.STRING } },
          oracion: { type: Type.STRING }
        },
        required: ['titulo', 'idea_principal', 'infografia', 'desarrollo_progresivo', 'aplicacion', 'oracion']
      };

      for (const modeloGemini of modelosGemini) {
        if (exito) break;
        for (let i = 0; i < intentosGemini; i++) {
          try {
            const response = await ai.models.generateContent({
              model: modeloGemini,
              contents: [{ text: `Analiza esta transcripción de prédica y extrae el desglose teológico completo en JSON:\n\n${text}` }],
              config: { systemInstruction: 'Eres un analista teológico conservador. Usa Reina-Valera 1960. Devuelve un JSON estrictamente estructurado.', responseMimeType: 'application/json', responseSchema: schemaConfig }
            });

            if (response && response.text) {
              jsonResult = extraerJSON(response.text);
              exito = true;
              break;
            }
          } catch (err: any) {
            const errMsg = err?.message || '';
            console.warn(`[Gemini Falló - ${modeloGemini}]:`, errMsg);
            if (errMsg.includes('Quota exceeded') && errMsg.includes('generativelanguage.googleapis.com')) throw new Error('Has alcanzado el límite gratuito diario.');
            if (errMsg.includes('429') || errMsg.includes('503')) {
              let tiempoEspera = esperaBaseGemini * Math.pow(2, i);
              const retryMatch = errMsg.match(/retry in (\d+)/i);
              if (retryMatch && retryMatch[1]) tiempoEspera = parseInt(retryMatch[1], 10) * 1000;
              if (i < intentosGemini - 1) { await delay(tiempoEspera); continue; }
            }
            break; // pasa al siguiente modelo
          }
        }
      }
    }

    if (!exito || !jsonResult) return NextResponse.json({ error: 'Todos los servidores están saturados o sin cuota.' }, { status: 500 });
    return NextResponse.json(jsonResult);

  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Error al procesar el análisis teológico.' }, { status: 500 });
  }
}