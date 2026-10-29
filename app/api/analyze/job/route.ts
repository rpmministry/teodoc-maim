import { NextRequest, NextResponse } from 'next/server';
import { verificarRateLimit } from '@/lib/rate-limit';
import { esModalidad, esRangoEdad } from '@/lib/modalidades';
import {
  crearTrabajoAnalisis,
  obtenerTrabajoAnalisis,
  cancelarTrabajoAnalisis,
} from '@/lib/analisis-job-manager';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const limite = verificarRateLimit(req, 'analyze');
  if (!limite.permitido) {
    return NextResponse.json(
      { error: 'Demasiadas solicitudes en poco tiempo. Espera un momento.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(limite.resetMs / 1000)) } },
    );
  }

  try {
    const body = await req.json().catch(() => null);
    const text = typeof body?.text === 'string' ? body.text.trim() : '';

    if (!text || text.length < 120) {
      return NextResponse.json(
        { error: 'La transcripción es demasiado corta para un análisis responsable (mínimo 120 caracteres).' },
        { status: 400 },
      );
    }

    if (text.length > 250_000) {
      return NextResponse.json(
        { error: 'La transcripción supera el límite permitido de 250,000 caracteres.' },
        { status: 413 },
      );
    }

    const modalidad = esModalidad(body?.modalidad) ? body.modalidad : 'general';
    const rangoEdad = esRangoEdad(body?.rangoEdad) ? body.rangoEdad : undefined;

    const trabajo = crearTrabajoAnalisis({
      text,
      modalidad,
      rangoEdad,
      titulo: body?.titulo,
      predicador: body?.predicador,
      fecha: body?.fecha,
      tieneAudio: Boolean(body?.tieneAudio),
    });

    return NextResponse.json(
      {
        ok: true,
        jobId: trabajo.id,
        trabajo: {
          id: trabajo.id,
          estado: trabajo.estado,
          etapaActual: trabajo.etapaActual,
          etapasCompletadas: trabajo.etapasCompletadas,
          progreso: trabajo.progreso,
          esEstimado: trabajo.esEstimado,
          mensaje: trabajo.mensaje,
          tiempoTranscurridoSegundos: trabajo.tiempoTranscurridoSegundos,
          tiempoEstimadoRestanteSegundos: trabajo.tiempoEstimadoRestanteSegundos,
          resultado: trabajo.resultado,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('[API Job] Error creando trabajo:', error);
    return NextResponse.json(
      { error: 'No se pudo iniciar el trabajo de análisis. Intenta de nuevo.' },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Falta el parámetro id del trabajo.' }, { status: 400 });
  }

  const trabajo = obtenerTrabajoAnalisis(id);
  if (!trabajo) {
    return NextResponse.json(
      { error: 'Trabajo no encontrado o expirado.', estado: 'no_encontrado' },
      { status: 404 },
    );
  }

  return NextResponse.json({
    ok: true,
    trabajo: {
      id: trabajo.id,
      huella: trabajo.huella,
      modalidad: trabajo.modalidad,
      rangoEdad: trabajo.rangoEdad,
      titulo: trabajo.titulo,
      estado: trabajo.estado,
      etapaActual: trabajo.etapaActual,
      etapasCompletadas: trabajo.etapasCompletadas,
      progreso: trabajo.progreso,
      esEstimado: trabajo.esEstimado,
      mensaje: trabajo.mensaje,
      tiempoTranscurridoSegundos: trabajo.tiempoTranscurridoSegundos,
      tiempoEstimadoRestanteSegundos: trabajo.tiempoEstimadoRestanteSegundos,
      resultado: trabajo.resultado,
      error: trabajo.error,
    },
  });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Falta el parámetro id del trabajo.' }, { status: 400 });
  }

  const cancelado = cancelarTrabajoAnalisis(id);
  return NextResponse.json({ ok: cancelado });
}
