import { NextRequest, NextResponse } from 'next/server';
import { extractYouTubeVideoId } from '@/lib/youtube/extract-video-id';
import { resolveTranscriptProvider } from '@/lib/youtube';
import { TranscriptError, type TranscriptErrorCode } from '@/lib/youtube/transcript-provider';
import { verificarRateLimit } from '@/lib/rate-limit';

// Margen para la generación por IA de videos sin subtítulos (jobs).
export const maxDuration = 180;
export const dynamic = 'force-dynamic';

// Mensajes siempre amigables: nunca se expone el detalle técnico al usuario.
const MENSAJES: Record<TranscriptErrorCode, string> = {
  url_invalida: 'El enlace no parece ser de YouTube. Revisa que sea un enlace válido del video.',
  sin_subtitulos:
    'No encontramos una transcripción disponible para este video. Puedes intentar con otro mensaje o subir directamente el audio a TeoDoc.',
  sin_transcripcion:
    'No encontramos una transcripción disponible para este video. Puedes intentar con otro mensaje o subir directamente el audio a TeoDoc.',
  bloqueado:
    'No pudimos obtener la transcripción de este video en este momento. Puedes probar con otro video o subir directamente el audio.',
  video_no_disponible: 'Este video no está disponible o es privado. Prueba con otro enlace.',
  desconocido:
    'No pudimos obtener la transcripción de este video en este momento. Puedes probar con otro video o subir directamente el audio.',
};

export async function POST(req: NextRequest) {
  try {
    const rate = verificarRateLimit(req, 'youtube', 15, 60_000);
    if (!rate.permitido) {
      console.warn('[Seguridad] Límite de tasa excedido en /api/youtube');
      return NextResponse.json(
        { ok: false, code: 'desconocido', message: 'Demasiadas solicitudes. Por favor espera un momento.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(rate.resetMs / 1000)) } }
      );
    }

    const body = await req.json().catch(() => null);
    const url = typeof body?.url === 'string' ? body.url : '';
    const videoId = extractYouTubeVideoId(url);

    if (!videoId) {
      return NextResponse.json(
        { ok: false, code: 'url_invalida', message: MENSAJES.url_invalida },
        { status: 400 },
      );
    }

    try {
      const provider = resolveTranscriptProvider();
      const result = await provider.fetchTranscript(videoId);
      console.log(
        `[YouTube] Transcripción vía ${result.meta.providerName || provider.name} (${videoId}): ${result.segments.length} segmentos, ${result.text.length} caracteres.`,
      );
      return NextResponse.json({
        ok: true,
        provider: result.meta.providerName || provider.name,
        text: result.text,
        meta: result.meta,
        segments: result.segments,
      });
    } catch (err) {
      const code: TranscriptErrorCode = err instanceof TranscriptError ? err.code : 'desconocido';
      // Detalle técnico solo para debugging en servidor.
      console.warn(`[YouTube] ${code}:`, (err as Error)?.message);
      const status =
        code === 'sin_transcripcion' || code === 'sin_subtitulos'
          ? 422
          : code === 'url_invalida'
            ? 400
            : code === 'video_no_disponible'
              ? 404
              : 502;
      return NextResponse.json({ ok: false, code, message: MENSAJES[code] }, { status });
    }
  } catch (error) {
    console.warn('[YouTube] Error inesperado:', (error as Error)?.message);
    return NextResponse.json(
      { ok: false, code: 'desconocido', message: MENSAJES.desconocido },
      { status: 500 },
    );
  }
}
