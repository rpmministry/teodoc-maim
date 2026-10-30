import { NextRequest, NextResponse } from 'next/server';
import { extractYouTubeVideoId } from '@/lib/youtube/extract-video-id.ts';
import { resolveTranscriptProvider } from '@/lib/youtube/index.ts';
import { TranscriptError, type TranscriptErrorCode, type TranscriptResult } from '@/lib/youtube/transcript-provider.ts';
import { verificarRateLimit } from '@/lib/rate-limit.ts';
import {
  calcularHuellaUrl,
  obtenerContenidoCanonico,
  guardarContenidoCanonico,
} from '@/lib/canonical-store.ts';

// Margen para la extracción de audio y transcripción neuronal en Vercel
export const maxDuration = 180;
export const dynamic = 'force-dynamic';

const MENSAJES: Record<TranscriptErrorCode, string> = {
  url_invalida: 'El enlace no parece ser de YouTube. Revisa que sea un enlace válido del video.',
  sin_subtitulos:
    'No encontramos subtítulos ni pista de audio accesible en este video. Puedes probar con otro enlace o subir la grabación de audio (.mp3 o .m4a) en la pestaña "Archivo multimedia".',
  sin_transcripcion:
    'No encontramos subtítulos ni pista de audio accesible en este video. Puedes probar con otro enlace o subir la grabación de audio (.mp3 o .m4a) en la pestaña "Archivo multimedia".',
  bloqueado:
    'YouTube limitó temporalmente las consultas desde esta red. Puedes esperar un minuto y reintentar, o subir directamente el audio de la prédica.',
  video_no_disponible:
    'Este video no está disponible, es privado o requiere inicio de sesión en YouTube. Si tienes el archivo de audio o video, puedes subirlo directamente en la pestaña "Archivo multimedia".',
  desconocido:
    'No pudimos obtener la transcripción de este video en este momento. Te recomendamos subir la grabación de audio directamente en la pestaña "Archivo multimedia".',
};

export async function POST(req: NextRequest) {
  try {
    const rate = verificarRateLimit(req, 'youtube', 15, 60_000);
    if (!rate.permitido) {
      console.warn('[Seguridad] Límite de tasa excedido en /api/youtube');
      return NextResponse.json(
        { ok: false, code: 'desconocido', message: 'Demasiadas solicitudes. Por favor espera un momento.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(rate.resetMs / 1000)) } },
      );
    }

    const body = await req.json().catch(() => null);
    const url = typeof body?.url === 'string' ? body.url.trim() : '';
    const quiereStream = Boolean(body?.stream) || req.headers.get('accept') === 'text/event-stream';
    const videoId = extractYouTubeVideoId(url);

    if (!videoId) {
      return NextResponse.json(
        { ok: false, code: 'url_invalida', message: MENSAJES.url_invalida },
        { status: 400 },
      );
    }

    const urlNormalizada = `https://www.youtube.com/watch?v=${videoId}`;
    const huella = calcularHuellaUrl(urlNormalizada);

    // 1. Comprobar si ya existe en el almacén canónico reutilizable
    const registroPrevio = obtenerContenidoCanonico(huella);
    if (registroPrevio && registroPrevio.estado === 'completada' && registroPrevio.texto) {
      console.info(`[YouTube] Reutilizando transcripción canónica en caché para video ${videoId}`);
      const respuestaCache = {
        ok: true,
        cached: true,
        provider: registroPrevio.proveedor || 'cache-canonico',
        method: (registroPrevio.metadatosAdicionales?.method as any) || 'subtitulos',
        text: registroPrevio.texto,
        meta: {
          source: 'youtube',
          videoId,
          url: urlNormalizada,
          language: registroPrevio.idioma || 'es',
          title: registroPrevio.titulo || 'Prédica de YouTube',
          providerName: registroPrevio.proveedor || 'cache-canonico',
          method: (registroPrevio.metadatosAdicionales?.method as any) || 'subtitulos',
        },
        segments: (registroPrevio.metadatosAdicionales?.segments as any[]) || [
          { text: registroPrevio.texto, start: 0, duration: 0 },
        ],
      };

      if (quiereStream) {
        return new Response(
          `data: ${JSON.stringify({
            etapa: 'completado',
            progreso: 100,
            mensaje: 'Transcripción canónica recuperada de inmediato.',
            resultado: respuestaCache,
          })}\n\n`,
          {
            headers: {
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache, no-transform',
              Connection: 'keep-alive',
            },
          },
        );
      }

      return NextResponse.json(respuestaCache);
    }

    // 2. Si se solicitó stream en tiempo real con SSE
    if (quiereStream) {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          const emitir = (evento: {
            etapa: string;
            progreso: number;
            mensaje: string;
            resultado?: any;
            error?: string;
          }) => {
            try {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(evento)}\n\n`));
            } catch {
              // Conexión abortada por el cliente
            }
          };

          try {
            emitir({
              etapa: 'validando',
              progreso: 15,
              mensaje: 'Conectando con YouTube y verificando permisos...',
            });

            emitir({
              etapa: 'subtitulos',
              progreso: 35,
              mensaje: 'Consultando subtítulos oficiales y transcripción existente...',
            });

            const provider = resolveTranscriptProvider();
            const result: TranscriptResult = await provider.fetchTranscript(videoId);

            // Guardar en almacén canónico
            guardarContenidoCanonico({
              huella,
              tipo: 'url',
              fuente: urlNormalizada,
              titulo: result.meta.title,
              estado: 'completada',
              texto: result.text,
              caracteres: result.text.length,
              palabras: result.text.split(/\s+/).filter(Boolean).length,
              idioma: result.meta.language || 'es',
              proveedor: result.meta.providerName || provider.name,
              creadoEn: Date.now(),
              actualizadoEn: Date.now(),
              expiraEn: 0,
              metadatosAdicionales: {
                method: result.meta.method || 'subtitulos',
                segments: result.segments,
              },
            });

            emitir({
              etapa: 'completado',
              progreso: 100,
              mensaje:
                result.meta.method === 'audio_stt'
                  ? '¡Transcripción generada por IA con éxito!'
                  : '¡Transcripción oficial obtenida con éxito!',
              resultado: {
                ok: true,
                provider: result.meta.providerName || provider.name,
                method: result.meta.method || 'subtitulos',
                text: result.text,
                meta: result.meta,
                segments: result.segments,
              },
            });

            controller.close();
          } catch (err) {
            const code: TranscriptErrorCode = err instanceof TranscriptError ? err.code : 'desconocido';
            emitir({
              etapa: 'error',
              progreso: 0,
              mensaje: MENSAJES[code] || MENSAJES.desconocido,
              error: (err as Error)?.message,
            });
            controller.close();
          }
        },
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache, no-transform',
          Connection: 'keep-alive',
        },
      });
    }

    // 3. Flujo síncrono estándar JSON (compatible con toda la app)
    try {
      const provider = resolveTranscriptProvider();
      const result = await provider.fetchTranscript(videoId);

      console.log(
        `[YouTube] Transcripción vía ${result.meta.providerName || provider.name} (${videoId}): ${result.segments.length} segmentos, ${result.text.length} caracteres. Método: ${result.meta.method || 'subtitulos'}.`,
      );

      // Guardar en almacén canónico
      guardarContenidoCanonico({
        huella,
        tipo: 'url',
        fuente: urlNormalizada,
        titulo: result.meta.title,
        estado: 'completada',
        texto: result.text,
        caracteres: result.text.length,
        palabras: result.text.split(/\s+/).filter(Boolean).length,
        idioma: result.meta.language || 'es',
        proveedor: result.meta.providerName || provider.name,
        creadoEn: Date.now(),
        actualizadoEn: Date.now(),
        expiraEn: 0,
        metadatosAdicionales: {
          method: result.meta.method || 'subtitulos',
          segments: result.segments,
        },
      });

      return NextResponse.json({
        ok: true,
        provider: result.meta.providerName || provider.name,
        method: result.meta.method || 'subtitulos',
        text: result.text,
        meta: result.meta,
        segments: result.segments,
      });
    } catch (err) {
      const code: TranscriptErrorCode = err instanceof TranscriptError ? err.code : 'desconocido';
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
