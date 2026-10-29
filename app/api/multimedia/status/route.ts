import { NextRequest, NextResponse } from 'next/server';
import { obtenerTrabajo } from '@/lib/multimedia/job-manager';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const jobId = searchParams.get('jobId');

  if (!jobId) {
    return NextResponse.json({ ok: false, error: 'Falta el parámetro jobId.' }, { status: 400 });
  }

  const trabajo = obtenerTrabajo(jobId);
  if (!trabajo) {
    return NextResponse.json({ ok: false, error: 'El trabajo no existe o ha expirado.' }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    trabajo: {
      id: trabajo.id,
      tipo: trabajo.tipo,
      estado: trabajo.estado,
      progreso: trabajo.progreso,
      mensaje: trabajo.mensaje,
      metadatos: trabajo.metadatos,
      nombreDescarga: trabajo.nombreDescarga,
      tamanoBytes: trabajo.tamanoBytes,
      audioUrlPublica: trabajo.audioUrlPublica,
      error: trabajo.error,
    },
  });
}

