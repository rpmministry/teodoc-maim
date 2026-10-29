import {
  calcularHuellaBuffer,
  calcularHuellaTexto,
  calcularHuellaUrl,
  ejecutarConBloqueoCanonico,
  guardarContenidoCanonico,
  obtenerContenidoCanonico,
} from './canonical-store.ts';
import type {
  RegistroContenidoCanonico,
  TipoFuenteCanonica,
} from './canonical-store.ts';
import { extraerTextoDeArchivo, normalizarTextoExtraido } from './documentos/extractor.ts';

export interface EntradaContenido {
  tipo: TipoFuenteCanonica;
  fuente: string;
  texto?: string;
  buffer?: Uint8Array | Buffer;
  url?: string;
  titulo?: string;
  autor?: string;
  duracionSegundos?: number;
  usuarioId?: string;
}

/**
 * Obtiene o procesa una fuente canónica garantizando que se procese UNA SOLA VEZ.
 * - Si es texto: calcula huella, almacena o devuelve el registro existente.
 * - Si es documento (Word, PDF, etc.): extrae el texto solo si no está en caché.
 * - Si es URL o audio: devuelve el registro canónico si ya existe y está completo.
 */
export async function procesarEntradaCanonica(
  entrada: EntradaContenido,
): Promise<RegistroContenidoCanonico> {
  let huella = '';

  if (entrada.tipo === 'texto' && entrada.texto) {
    huella = calcularHuellaTexto(entrada.texto);
  } else if (entrada.buffer) {
    huella = calcularHuellaBuffer(entrada.buffer);
  } else if (entrada.url) {
    huella = calcularHuellaUrl(entrada.url);
  } else {
    throw new Error('Entrada inválida para contenido canónico: no se proporcionó texto, archivo ni URL.');
  }

  // 1. Si ya existe completado en el almacén, retornar de inmediato
  const existente = obtenerContenidoCanonico(huella, entrada.usuarioId);
  if (existente && existente.estado === 'completada' && existente.texto) {
    console.info(`[Canónico] Contenido reutilizado de forma instantánea para huella ${huella.slice(0, 8)} (${existente.palabras} palabras).`);
    return existente;
  }

  // 2. Si es texto directo o pegado
  if (entrada.tipo === 'texto' && entrada.texto) {
    const textoNormalizado = normalizarTextoExtraido(entrada.texto);
    const registro: RegistroContenidoCanonico = {
      huella,
      tipo: 'texto',
      fuente: entrada.fuente || 'texto_pegado',
      titulo: entrada.titulo,
      autor: entrada.autor,
      estado: 'completada',
      texto: textoNormalizado,
      caracteres: textoNormalizado.length,
      palabras: textoNormalizado.split(/\s+/).filter(Boolean).length,
      idioma: 'es',
      proveedor: 'directo',
      creadoEn: Date.now(),
      actualizadoEn: Date.now(),
      expiraEn: 0, // Se asigna automáticamente con TTL en guardarContenidoCanonico
      usuarioId: entrada.usuarioId,
    };
    guardarContenidoCanonico(registro);
    return registro;
  }

  // 3. Si es un documento binario (DOCX, PDF, etc.)
  if (entrada.tipo === 'documento' && entrada.buffer) {
    return await ejecutarConBloqueoCanonico(huella, async () => {
      const res = await extraerTextoDeArchivo(entrada.buffer!, entrada.fuente);
      if (!res.ok || !res.texto) {
        throw new Error(res.error || 'No se pudo extraer texto del documento.');
      }
      const textoLimpio = normalizarTextoExtraido(res.texto);
      const registro: RegistroContenidoCanonico = {
        huella,
        tipo: 'documento',
        fuente: entrada.fuente,
        titulo: entrada.titulo || res.tituloSugerido,
        autor: entrada.autor,
        estado: 'completada',
        texto: textoLimpio,
        caracteres: textoLimpio.length,
        palabras: res.palabras || textoLimpio.split(/\s+/).filter(Boolean).length,
        idioma: 'es',
        proveedor: `documento_${res.tipo}`,
        creadoEn: Date.now(),
        actualizadoEn: Date.now(),
        expiraEn: 0,
        usuarioId: entrada.usuarioId,
        advertencias: res.advertencia ? [res.advertencia] : undefined,
      };
      return registro;
    });
  }

  // 4. Si es audio/video o URL, y no está completado, crear registro 'en_proceso' o retornar el existente
  if (existente) return existente;

  const enProceso: RegistroContenidoCanonico = {
    huella,
    tipo: entrada.tipo,
    fuente: entrada.fuente || entrada.url || 'archivo_multimedia',
    titulo: entrada.titulo,
    autor: entrada.autor,
    duracionSegundos: entrada.duracionSegundos,
    estado: 'en_proceso',
    texto: '',
    caracteres: 0,
    palabras: 0,
    idioma: 'es',
    creadoEn: Date.now(),
    actualizadoEn: Date.now(),
    expiraEn: 0,
    usuarioId: entrada.usuarioId,
  };
  guardarContenidoCanonico(enProceso);
  return enProceso;
}
