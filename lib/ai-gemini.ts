/* eslint-disable @typescript-eslint/no-explicit-any */
import { GoogleGenAI } from '@google/genai';

export const MODELOS_GEMINI = ['gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-flash-latest', 'gemini-3-flash-preview'];
const MODELOS_EFECTIVOS = ['gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-flash-latest', 'gemini-3-flash-preview'];

export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Extrae JSON válido de una respuesta que puede venir envuelta en markdown o con texto complementario. */
export function extraerJSON(texto: string): any {
  if (!texto || typeof texto !== 'string') return null;
  const limpio = texto.trim();

  // 1. Si viene en bloque de código markdown ```json ... ```
  const matchFenced = limpio.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (matchFenced && matchFenced[1]) {
    try {
      return JSON.parse(matchFenced[1].trim());
    } catch {}
  }

  // 2. Intento directo de JSON.parse
  try {
    return JSON.parse(limpio);
  } catch {}

  // 3. Extraer el objeto balanceado más externo { ... } o [ ... ]
  const firstBrace = limpio.indexOf('{');
  const firstBracket = limpio.indexOf('[');

  let startIdx = -1;
  let isObject = true;
  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    startIdx = firstBrace;
    isObject = true;
  } else if (firstBracket !== -1) {
    startIdx = firstBracket;
    isObject = false;
  }

  if (startIdx !== -1) {
    const openChar = isObject ? '{' : '[';
    const closeChar = isObject ? '}' : ']';
    let depth = 0;
    let inString = false;
    let escape = false;
    let endIdx = -1;

    for (let i = startIdx; i < limpio.length; i++) {
      const char = limpio[i];
      if (escape) {
        escape = false;
        continue;
      }
      if (char === '\\') {
        escape = true;
        continue;
      }
      if (char === '"') {
        inString = !inString;
        continue;
      }
      if (!inString) {
        if (char === openChar) depth++;
        else if (char === closeChar) {
          depth--;
          if (depth === 0) {
            endIdx = i;
            break;
          }
        }
      }
    }

    if (endIdx !== -1) {
      try {
        return JSON.parse(limpio.slice(startIdx, endIdx + 1));
      } catch {}
    }
  }

  // 4. Último recurso: cortar desde la primera { hasta la última }
  const lastBrace = limpio.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    try {
      return JSON.parse(limpio.slice(firstBrace, lastBrace + 1));
    } catch {}
  }

  throw new Error('No se pudo interpretar el formato JSON de la respuesta.');
}

let cliente: GoogleGenAI | null = null;
function gemini(): GoogleGenAI {
  if (!cliente) cliente = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return cliente;
}

type OpcionesGemini = {
  contents: string;
  systemInstruction: string;
  responseSchema: any;
  modelos?: string[];
  retryDelayMs?: number;
  /** Tiempo máximo por intento. Evita que un proveedor saturado bloquee el pipeline. */
  timeoutMs?: number;
  onError?: (modelo: string, mensaje: string) => void;
};

function conTiempoLimite<T>(promesa: Promise<T>, ms: number, etiqueta: string): Promise<T> {
  if (!ms || ms <= 0) return promesa;
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`${etiqueta}: tiempo de espera agotado`)), ms);
    promesa.then(
      (v) => { clearTimeout(t); resolve(v); },
      (e) => { clearTimeout(t); reject(e); },
    );
  });
}

/**
 * Llama a Gemini con reintento ante 429/503 y fallback entre modelos.
 * Devuelve el JSON parseado o null. Lógica compartida por analyze y validate.
 */
export async function generarJsonConGemini(opts: OpcionesGemini): Promise<any | null> {
  const modelos = opts.modelos ?? MODELOS_EFECTIVOS;
  const ai = gemini();
  for (const modelo of modelos) {
    for (let i = 0; i < 2; i++) {
      try {
        const response = await conTiempoLimite(
          ai.models.generateContent({
            model: modelo,
            contents: [{ text: opts.contents }],
            config: {
              systemInstruction: opts.systemInstruction,
              responseMimeType: 'application/json',
              responseSchema: opts.responseSchema,
              maxOutputTokens: 8192,
            },
          }),
          opts.timeoutMs ?? 0,
          `Gemini ${modelo}`,
        );
        if (response && response.text) return extraerJSON(response.text);
      } catch (err: any) {
        const msg = err?.message || '';
        opts.onError?.(modelo, msg);
        if ((msg.includes('429') || msg.includes('503')) && i === 0) {
          await delay(opts.retryDelayMs ?? 1200);
          continue;
        }
        break; // pasa al siguiente modelo
      }
    }
  }
  return null;
}
