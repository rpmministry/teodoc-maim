import { NextRequest, NextResponse } from 'next/server';
import { verificarRateLimit } from '@/lib/rate-limit';
import { validarUrlMultimedia } from '@/lib/multimedia/detector';
import { obtenerMetadatosVideo } from '@/lib/multimedia/extractor';

export const maxDuration = 45;
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const rate = verificarRateLimit(req, 'multimedia_probe', 25, 60_000);
    if (!rate.permitido) {
      return NextResponse.json(
        { ok: false, error: 'Demasiadas consultas de video. Por favor espera un momento.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(rate.resetMs / 1000)) } },
      );
    }

    const body = await req.json().catch(() => null);
    const url = typeof body?.url === 'string' ? body.url.trim() : '';

    const validacion = validarUrlMultimedia(url);
    if (!validacion.esValida) {
      return NextResponse.json({ ok: false, error: validacion.error }, { status: 400 });
    }

    try {
      const metadatos = await obtenerMetadatosVideo(validacion.urlLimpia || url);
      return NextResponse.json({
        ok: true,
        proveedor: validacion.proveedor,
        url: validacion.urlLimpia || url,
        metadatos,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al explorar el video.';
      // Aún si no pudimos extraer los metadatos completos (ej: miniatura/título bloqueado por plataforma),
      // retornamos metadatos de contingencia para que el usuario NO quede bloqueado de extraer audio y analizar.
      return NextResponse.json({
        ok: true,
        proveedor: validacion.proveedor,
        url: validacion.urlLimpia || url,
        aviso: msg,
        metadatos: {
          titulo: 'Enlace multimedia listo para procesar',
          duracionSegundos: 0,
          duracionFormateada: 'Detectada al procesar',
          formatosDisponibles: [
            { id: 'best', resolucion: 'Mejor calidad disponible', extension: 'mp4' },
            { id: '720p', resolucion: '720p (HD)', extension: 'mp4' },
            { id: 'audio_mp3', resolucion: 'Solo audio', extension: 'mp3', esSoloAudio: true },
          ],
        },
      });
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error inesperado.';
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

