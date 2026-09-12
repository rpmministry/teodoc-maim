/* eslint-disable @typescript-eslint/no-explicit-any */
import { GoogleGenAI } from '@google/genai';

export const MODELOS_GEMINI = ['gemini-3.7-flash', 'gemini-3.6-flash'];

export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Extrae JSON válido de una respuesta que puede venir envuelta en ```json. */
export function extraerJSON(texto: string) {
  let limpio = texto.trim();
  if (limpio.startsWith('```json')) limpio = limpio.replace(/^```json/, '').replace(/```$/, '').trim();
  else if (limpio.startsWith('```')) limpio = limpio.replace(/^```/, '').replace(/```$/, '').trim();
  return JSON.parse(limpio);
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
  onError?: (modelo: string, mensaje: string) => void;
};

/**
 * Llama a Gemini con reintento ante 429/503 y fallback entre modelos.
 * Devuelve el JSON parseado o null. Lógica compartida por analyze y validate.
 */
export async function generarJsonConGemini(opts: OpcionesGemini): Promise<any | null> {
  const modelos = opts.modelos ?? MODELOS_GEMINI;
  const ai = gemini();
  for (const modelo of modelos) {
    for (let i = 0; i < 2; i++) {
      try {
        const response = await ai.models.generateContent({
          model: modelo,
          contents: [{ text: opts.contents }],
          config: {
            systemInstruction: opts.systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: opts.responseSchema,
          },
        });
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
