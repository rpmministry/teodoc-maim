import { NextRequest, NextResponse } from 'next/server';
import { extractYouTubeVideoId } from '@/lib/youtube/extract-video-id';
import { youtubeTranscriptProvider } from '@/lib/youtube/youtube-transcript-provider';
import { TranscriptError, type TranscriptErrorCode } from '@/lib/youtube/transcript-provider';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

// Mensajes siempre amigables: nunca se expone el detalle técnico al usuario.
const MENSAJES: Record<TranscriptErrorCode, string> = {
  url_invalida: 'El enlace no parece ser de YouTube. Revisa que sea un enlace válido del video.',
  sin_transcripcion:
    'No encontramos una transcripción disponible para este video. Puedes intentar con otra prédica o subir directamente el audio a TeoDoc.',
  bloqueado:
    'No pudimos obtener la transcripción de este video en este momento. Puedes probar con otro video o subir directamente el audio.',
  video_no_disponible: 'Este video no está disponible o es privado. Prueba con otro enlace.',
  desconocido:
    'No pudimos obtener la transcripción de este video en este momento. Puedes probar con otro video o subir directamente el audio.',
};

export async function POST(req: NextRequest) {
  try {
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
      const result = await youtubeTranscriptProvider.fetchTranscript(videoId);
      return NextResponse.json({
        ok: true,
        text: result.text,
        meta: result.meta,
        segments: result.segments,
      });
    } catch (err) {
      const code: TranscriptErrorCode = err instanceof TranscriptError ? err.code : 'desconocido';
      // Detalle técnico solo para debugging en servidor.
      console.warn(`[YouTube] ${code}:`, (err as Error)?.message);
      const status = code === 'sin_transcripcion' ? 422 : code === 'url_invalida' ? 400 : 502;
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
