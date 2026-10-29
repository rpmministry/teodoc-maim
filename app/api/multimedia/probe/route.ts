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
      return NextResponse.json({ ok: false, error: msg }, { status: 422 });
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error inesperado.';
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

