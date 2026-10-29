import { NextRequest } from 'next/server';
import {
  obtenerTrabajoAnalisis,
  obtenerEmisorTrabajo,
  type TrabajoAnalisis,
} from '@/lib/analisis-job-manager';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return new Response(JSON.stringify({ error: 'Falta el id del trabajo.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const trabajoInicial = obtenerTrabajoAnalisis(id);
  if (!trabajoInicial) {
    return new Response(JSON.stringify({ error: 'Trabajo no encontrado.', estado: 'no_encontrado' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const emisor = obtenerEmisorTrabajo(id);
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const serializar = (t: TrabajoAnalisis) => {
        return `data: ${JSON.stringify({
          id: t.id,
          estado: t.estado,
          etapaActual: t.etapaActual,
          etapasCompletadas: t.etapasCompletadas,
          progreso: t.progreso,
          esEstimado: t.esEstimado,
          mensaje: t.mensaje,
          tiempoTranscurridoSegundos: t.tiempoTranscurridoSegundos,
          tiempoEstimadoRestanteSegundos: t.tiempoEstimadoRestanteSegundos,
          resultado: t.resultado,
          error: t.error,
        })}\n\n`;
      };

      // 1. Emitir snapshot inicial inmediatamente
      controller.enqueue(encoder.encode(serializar(trabajoInicial)));

      // Si ya está terminado o con error, cerrar stream tras emitir snapshot
      if (['completado', 'error', 'cancelado'].includes(trabajoInicial.estado)) {
        controller.close();
        return;
      }

      // 2. Escuchar actualizaciones en tiempo real
      const alActualizar = (t: TrabajoAnalisis) => {
        try {
          controller.enqueue(encoder.encode(serializar(t)));
          if (['completado', 'error', 'cancelado'].includes(t.estado)) {
            controller.close();
            emisor.off('actualizacion', alActualizar);
          }
        } catch {
          emisor.off('actualizacion', alActualizar);
        }
      };

      emisor.on('actualizacion', alActualizar);

      // 3. Ping keep-alive cada 15 segundos para evitar timeouts de proxies
      const intervaloPing = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': ping\n\n'));
        } catch {
          clearInterval(intervaloPing);
          emisor.off('actualizacion', alActualizar);
        }
      }, 15_000);

      req.signal.addEventListener('abort', () => {
        clearInterval(intervaloPing);
        emisor.off('actualizacion', alActualizar);
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}

