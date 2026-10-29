import { NextRequest, NextResponse } from 'next/server';
import { existsSync, createReadStream, statSync } from 'node:fs';
import { Readable } from 'node:stream';
import { obtenerTrabajo } from '@/lib/multimedia/job-manager';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const jobId = searchParams.get('jobId');

  if (!jobId) {
    return new NextResponse('Falta el parámetro jobId.', { status: 400 });
  }

  const trabajo = obtenerTrabajo(jobId);
  if (!trabajo || !trabajo.archivoResultado || !existsSync(trabajo.archivoResultado)) {
    return new NextResponse('El archivo solicitado no existe o ha expirado.', { status: 404 });
  }

  const stat = statSync(trabajo.archivoResultado);
  const stream = createReadStream(trabajo.archivoResultado);
  const webStream = Readable.toWeb(stream) as ReadableStream<Uint8Array>;

  const nombreDescarga = (trabajo.nombreDescarga || 'descarga.mp4').replace(/[^\w\d_.-]/g, '_');
  const esMp4 = nombreDescarga.toLowerCase().endsWith('.mp4');
  const contentType = esMp4 ? 'video/mp4' : 'audio/mpeg';

  return new NextResponse(webStream, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Content-Length': String(stat.size),
      'Content-Disposition': `attachment; filename="${nombreDescarga}"`,
      'Cache-Control': 'no-store',
    },
  });
}

