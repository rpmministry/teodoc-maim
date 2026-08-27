import { AssemblyAI } from 'assemblyai';
import { NextRequest, NextResponse } from 'next/server';
import { writeFile, unlink, readFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { v4 as uuidv4 } from 'uuid';
import { AssemblyAI } from 'assemblyai';
import { NextRequest, NextResponse } from 'next/server';
import { writeFile, unlink, readFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { v4 as uuidv4 } from 'uuid';

// Agrega estas dos líneas para configurar Vercel
export const maxDuration = 60; // Extiende el límite de Vercel al máximo gratuito (60 segundos)
export const dynamic = 'force-dynamic';

const aai = new AssemblyAI({ apiKey: process.env.ASSEMBLYAI_API_KEY as string });
// ... (el resto de tu código se queda igual)

const aai = new AssemblyAI({ apiKey: process.env.ASSEMBLYAI_API_KEY as string });

export async function POST(req: NextRequest) {
  let tempFilePath = '';

  try {
    if (!process.env.ASSEMBLYAI_API_KEY && !process.env.DEEPGRAM_API_KEY) {
      return NextResponse.json({ error: 'Faltan llaves de transcripción en el servidor.' }, { status: 500 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No se recibió ningún archivo de audio.' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const uniqueFilename = `${uuidv4()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
    tempFilePath = join(tmpdir(), uniqueFilename);
    await writeFile(tempFilePath, buffer);

    let textoTranscrito = "";

    // Intentar con AssemblyAI
    try {
      const transcript = await aai.transcripts.transcribe({
        audio: tempFilePath,
        language_code: 'es'
      });
      if (transcript.status === 'error') throw new Error(transcript.error);
      textoTranscrito = transcript.text || "";
    } catch (aaiError: any) {
      console.warn('AssemblyAI falló, activando Deepgram de respaldo...');
      
      const fileBuffer = await readFile(tempFilePath);
      const dgResponse = await fetch('https://api.deepgram.com/v1/listen?model=nova-2&language=es&smart_format=true', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${process.env.DEEPGRAM_API_KEY}`,
          'Content-Type': 'application/octet-stream'
        },
        body: fileBuffer
      });

      if (!dgResponse.ok) throw new Error('Los servicios de transcripción están temporalmente saturados.');
      const dgData = await dgResponse.json();
      textoTranscrito = dgData.results?.channels[0]?.alternatives[0]?.transcript || "";
    }

    if (!textoTranscrito || textoTranscrito.trim().length === 0) {
      throw new Error('No se detectó voz o el archivo de audio está vacío.');
    }

    return NextResponse.json({ text: textoTranscrito });

  } catch (error: any) {
    console.error('Error crítico en transcripción:', error);
    return NextResponse.json({ error: error?.message || 'Error al transcribir el audio.' }, { status: 500 });
  } finally {
    if (tempFilePath) {
      try { await unlink(tempFilePath); } catch (e) {}
    }
  }
}