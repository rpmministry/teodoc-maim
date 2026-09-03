import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'antbfat3',
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('audio') as File;

    if (!file) {
      return NextResponse.json({ error: "No se recibió ningún archivo" }, { status: 400 });
    }

    console.log("Archivo recibido en backend:", { name: file.name, type: file.type, size: file.size });

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'teodoc_audios', resource_type: 'video' },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(buffer);
    });

    const cloudData = uploadResult as any;

    return NextResponse.json({
      success: true,
      audioUrl: cloudData.secure_url,
      name: file.name,
      type: file.type,
      size: file.size
    });

  } catch (error: any) {
    console.error("Error en /api/upload:", error);
    return NextResponse.json({ error: error.message || "Error al subir el archivo" }, { status: 500 });
  }
}
