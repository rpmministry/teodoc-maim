import { AssemblyAI } from 'assemblyai';
import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60; // Extiende límite de Vercel
export const dynamic = 'force-dynamic';

const aai = new AssemblyAI({ apiKey: process.env.ASSEMBLYAI_API_KEY as string });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { audioUrl } = body;

    if (!audioUrl) {
      return NextResponse.json({ error: 'No se recibió la ruta del audio.' }, { status: 400 });
    }

    let textoTranscrito = "";

    // Intentar con AssemblyAI (usando el enlace directamente)
    try {
      const transcript = await aai.transcripts.transcribe({
        audio: audioUrl,
        language_code: 'es'
      });
      if (transcript.status === 'error') throw new Error(transcript.error);
      textoTranscrito = transcript.text || "";
    } catch (aaiError: any) {
      console.warn('AssemblyAI falló, activando Deepgram de respaldo...');
      
      // Respaldo con Deepgram (también usando el enlace)
      const dgResponse = await fetch('https://api.deepgram.com/v1/listen?model=nova-2&language=es&smart_format=true', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${process.env.DEEPGRAM_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url: audioUrl })
      });

      if (!dgResponse.ok) throw new Error('Los servicios de transcripción están temporalmente saturados.');
      const dgData = await dgResponse.json();
      textoTranscrito = dgData.results?.channels[0]?.alternatives[0]?.transcript || "";
    }

    if (!textoTranscrito || textoTranscrito.trim().length === 0) {
      throw new Error('No se detectó voz o el archivo está vacío.');
    }

    return NextResponse.json({ text: textoTranscrito });

  } catch (error: any) {
    console.error('Error crítico en transcripción:', error);
    return NextResponse.json({ error: error?.message || 'Error al transcribir el audio.' }, { status: 500 });
  }
}