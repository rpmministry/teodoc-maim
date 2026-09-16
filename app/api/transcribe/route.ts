/* eslint-disable @typescript-eslint/no-explicit-any */
import { AssemblyAI } from 'assemblyai';
import { NextRequest, NextResponse } from 'next/server';
import { verificarRateLimit } from '@/lib/rate-limit';

export const maxDuration = 60; // Extiende límite de Vercel
export const dynamic = 'force-dynamic';

const aai = new AssemblyAI({ apiKey: process.env.ASSEMBLYAI_API_KEY as string });

/**
 * Filtro defensivo anti-SSRF:
 * Asegura que la URL sea HTTPS legítima y bloquea peticiones hacia direcciones IP internas o de metadatos.
 */
function esUrlAudioSegura(urlString: string): boolean {
  try {
    const parsed = new URL(urlString);
    if (parsed.protocol !== 'https:') return false;
    const hostname = parsed.hostname.toLowerCase();

    // Bloquear loopback, rangos privados y metadatos de proveedores cloud
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '::1' ||
      hostname.startsWith('10.') ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('169.254.') ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname)
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    // 1. Control de tasa (Rate Limiting) por IP
    const rate = verificarRateLimit(req, 'transcribe', 15, 60_000);
    if (!rate.permitido) {
      console.warn('[Seguridad] Límite de tasa excedido en /api/transcribe');
      return NextResponse.json(
        { error: 'Demasiadas solicitudes de transcripción. Por favor espera un momento.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(rate.resetMs / 1000)) } }
      );
    }

    const body = await req.json();
    const { audioUrl } = body;

    if (!audioUrl || typeof audioUrl !== 'string') {
      return NextResponse.json({ error: 'No se recibió la ruta del audio.' }, { status: 400 });
    }

    // 2. Validación anti-SSRF
    if (!esUrlAudioSegura(audioUrl)) {
      console.warn(`[Seguridad] Intento de SSRF bloqueado en /api/transcribe: ${audioUrl}`);
      return NextResponse.json({ error: 'La URL del audio no es válida o no está permitida.' }, { status: 400 });
    }

    let textoTranscrito = '';

    // Intentar con AssemblyAI (usando el enlace directamente)
    try {
      const transcript = await aai.transcripts.transcribe({
        audio: audioUrl,
        language_code: 'es',
      });
      if (transcript.status === 'error') throw new Error(transcript.error);
      textoTranscrito = transcript.text || '';
    } catch (aaiError: any) {
      console.warn('AssemblyAI falló, activando Deepgram de respaldo...', aaiError?.message || aaiError);

      // Respaldo con Deepgram (también usando el enlace)
      const dgResponse = await fetch('https://api.deepgram.com/v1/listen?model=nova-2&language=es&smart_format=true', {
        method: 'POST',
        headers: {
          Authorization: `Token ${process.env.DEEPGRAM_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: audioUrl }),
      });

      if (!dgResponse.ok) throw new Error('Los servicios de transcripción están temporalmente saturados.');
      const dgData = await dgResponse.json();
      textoTranscrito = dgData.results?.channels[0]?.alternatives[0]?.transcript || '';
    }

    if (!textoTranscrito || textoTranscrito.trim().length === 0) {
      throw new Error('No se detectó voz o el archivo está vacío.');
    }

    return NextResponse.json({ text: textoTranscrito });
  } catch (error: any) {
    console.error('Error crítico en transcripción:', error?.message || error);
    return NextResponse.json({ error: error?.message || 'Error al transcribir el audio.' }, { status: 500 });
  }
}