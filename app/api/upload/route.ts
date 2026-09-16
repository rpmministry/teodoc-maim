/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { verificarRateLimit } from '@/lib/rate-limit';

// Permite hasta 5 minutos (300 segundos) para que Vercel termine la operación
export const maxDuration = 300;

// Límite de seguridad: máximo 150 MB por archivo
const MAX_AUDIO_SIZE_BYTES = 150 * 1024 * 1024;

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: Request) {
  try {
    // 1. Control de tasa (Rate Limiting) por IP
    const rate = verificarRateLimit(req, 'upload', 15, 60_000);
    if (!rate.permitido) {
      console.warn('[Seguridad] Límite de tasa excedido en /api/upload');
      return NextResponse.json(
        { error: 'Demasiadas solicitudes de subida. Por favor espera un momento antes de reintentar.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(rate.resetMs / 1000)) } }
      );
    }

    const formData = await req.formData();
    const file = formData.get('audio') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No se recibió ningún archivo de audio válido en el servidor.' },
        { status: 400 }
      );
    }

    // 2. Validación de tamaño de archivo (Anti-Abuso de Almacenamiento)
    if (file.size > MAX_AUDIO_SIZE_BYTES) {
      return NextResponse.json(
        { error: 'El archivo excede el tamaño máximo permitido de 150 MB.' },
        { status: 413 }
      );
    }

    // 3. Validación de Tipo MIME
    const tipo = file.type?.toLowerCase() || '';
    const esTipoValido =
      tipo.startsWith('audio/') ||
      tipo.startsWith('video/') ||
      tipo.includes('octet-stream') ||
      /\.(mp3|wav|m4a|aac|ogg|mp4|webm|flac)$/i.test(file.name);

    if (!esTipoValido) {
      return NextResponse.json(
        { error: 'Formato de archivo no admitido. Solo se permiten audios o videos.' },
        { status: 415 }
      );
    }

    console.log('[Backend] Archivo verificado en /api/upload:', {
      name: file.name,
      type: file.type,
      size: file.size,
    });

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploadResult = await new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'teodoc_audios',
          resource_type: 'video', // Audio se procesa como video en Cloudinary
        },
        (error, result) => {
          if (error) {
            console.error('[Backend] Error en Cloudinary:', error);
            reject(error);
          } else {
            resolve(result);
          }
        }
      );

      uploadStream.end(buffer);
    });

    console.log('[Backend] Subida exitosa a Cloudinary. URL:', uploadResult.secure_url);

    return NextResponse.json({
      audioUrl: uploadResult.secure_url,
      publicId: uploadResult.public_id,
    });
  } catch (error: any) {
    console.error('[Backend] Error crítico procesando archivo:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno al procesar el archivo en el servidor.' },
      { status: 500 }
    );
  }
}