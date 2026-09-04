import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Permite hasta 5 minutos (300 segundos) para que Vercel termine la operación
export const maxDuration = 300;

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    
    // IMPORTANTE: El frontend ahora envía el campo como "audio", no "file"
    const file = formData.get('audio') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No se recibió ningún archivo de audio válido en el servidor.' },
        { status: 400 }
      );
    }

    console.log("[Backend] Archivo recibido en /api/upload:", {
      name: file.name,
      type: file.type,
      size: file.size
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
            console.error("[Backend] Error en Cloudinary:", error);
            reject(error);
          } else {
            resolve(result);
          }
        }
      );

      uploadStream.end(buffer);
    });

    console.log("[Backend] Subida exitosa a Cloudinary. URL:", uploadResult.secure_url);

    return NextResponse.json({
      audioUrl: uploadResult.secure_url,
      publicId: uploadResult.public_id
    });

  } catch (error: any) {
    console.error("[Backend] Error crítico procesando archivo:", error);
    return NextResponse.json(
      { error: error.message || 'Error interno al procesar el archivo en el servidor.' },
      { status: 500 }
    );
  }
}