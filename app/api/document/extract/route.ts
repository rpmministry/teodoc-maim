import { NextRequest, NextResponse } from 'next/server';
import { verificarRateLimit } from '@/lib/rate-limit';
import { extraerTextoDeArchivo } from '@/lib/documentos/extractor';
import {
  calcularHuellaBuffer,
  obtenerContenidoCanonico,
  guardarContenidoCanonico,
} from '@/lib/canonical-store';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const rate = verificarRateLimit(req, 'doc_extract', 30, 60_000);
    if (!rate.permitido) {
      return NextResponse.json(
        { ok: false, error: 'Demasiadas solicitudes de extracción. Por favor espera unos momentos.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(rate.resetMs / 1000)) } },
      );
    }

    const formData = await req.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { ok: false, error: 'No se recibió ningún archivo válido para procesar.' },
        { status: 400 },
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const huella = calcularHuellaBuffer(buffer);

    const previo = obtenerContenidoCanonico(huella);
    if (previo && previo.estado === 'completada' && previo.texto) {
      console.info(`[DocumentExtract] Reutilizando texto canónico (${previo.palabras} palabras) para huella ${huella.slice(0, 8)}`);
      return NextResponse.json({
        ok: true,
        texto: previo.texto,
        tituloSugerido: previo.titulo,
        tipo: (previo.proveedor?.replace('documento_', '') as any) || 'desconocido',
        caracteres: previo.caracteres,
        palabras: previo.palabras,
        cached: true,
        huella,
      }, { status: 200 });
    }

    const resultado = await extraerTextoDeArchivo(buffer, file.name, file.type);

    if (!resultado.ok) {
      return NextResponse.json(resultado, { status: 422 });
    }

    guardarContenidoCanonico({
      huella,
      tipo: 'documento',
      fuente: file.name,
      titulo: resultado.tituloSugerido,
      estado: 'completada',
      texto: resultado.texto,
      caracteres: resultado.caracteres,
      palabras: resultado.palabras,
      idioma: 'es',
      proveedor: `documento_${resultado.tipo}`,
      creadoEn: Date.now(),
      actualizadoEn: Date.now(),
      expiraEn: 0,
      advertencias: resultado.advertencia ? [resultado.advertencia] : undefined,
    });

    return NextResponse.json({ ...resultado, huella, cached: false }, { status: 200 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error interno al procesar el archivo.';
    console.error('[DocumentExtract] Error:', msg);
    return NextResponse.json(
      { ok: false, error: `Error al procesar el documento: ${msg}` },
      { status: 500 },
    );
  }
}

