/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'node:fs';
import { v2 as cloudinary } from 'cloudinary';
import { verificarRateLimit } from '@/lib/rate-limit';
import { validarUrlMultimedia } from '@/lib/multimedia/detector';
import {
  crearTrabajo,
  actualizarTrabajo,
  obtenerTrabajo,
} from '@/lib/multimedia/job-manager';
import {
  calcularHuellaUrl,
  obtenerContenidoCanonico,
  guardarContenidoCanonico,
  actualizarContenidoCanonico,
} from '@/lib/canonical-store';
import {
  descargarVideo,
  extraerAudioDeVideo,
  obtenerMetadatosVideo,
  optimizarAudioParaStt,
} from '@/lib/multimedia/extractor';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function subirBufferACloudinary(buffer: Buffer, nombre: string): Promise<string> {
  if (!process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    throw new Error('No hay credenciales de Cloudinary configuradas en el servidor para almacenar el audio.');
  }

  return new Promise<string>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'teodoc_audios',
        resource_type: 'video',
        public_id: `audio_${Date.now()}_${nombre.replace(/[^a-zA-Z0-9]/g, '_')}`,
      },
      (error, result) => {
        if (error || !result?.secure_url) {
          reject(error || new Error('Cloudinary no devolvió URL segura.'));
        } else {
          resolve(result.secure_url);
        }
      },
    );
    stream.end(buffer);
  });
}

export async function POST(req: NextRequest) {
  try {
    const rate = verificarRateLimit(req, 'multimedia_process', 20, 60_000);
    if (!rate.permitido) {
      return NextResponse.json(
        { ok: false, error: 'Demasiadas solicitudes. Por favor espera un momento.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(rate.resetMs / 1000)) } },
      );
    }

    const body = await req.json().catch(() => null);
    const url = typeof body?.url === 'string' ? body.url.trim() : '';
    const operacion = body?.operacion === 'descargar_video' ? 'descargar_video' : 'extraer_audio';
    const calidad = typeof body?.calidad === 'string' ? body.calidad : 'best';

    const validacion = validarUrlMultimedia(url);
    if (!validacion.esValida) {
      return NextResponse.json({ ok: false, error: validacion.error }, { status: 400 });
    }

    const trabajo = crearTrabajo(operacion, validacion.urlLimpia || url);

    // Ejecución asíncrona de la tarea en segundo plano
    (async () => {
      try {
        actualizarTrabajo(trabajo.id, {
          estado: 'obteniendo_metadata',
          progreso: 15,
          mensaje: 'Obteniendo información del video...',
        });

        const metadata = await obtenerMetadatosVideo(trabajo.url).catch(() => undefined);
        if (metadata) {
          actualizarTrabajo(trabajo.id, { metadatos: metadata });
        }

        if (operacion === 'descargar_video') {
          actualizarTrabajo(trabajo.id, {
            estado: 'descargando_video',
            progreso: 25,
            mensaje: 'Iniciando descarga de video en la calidad seleccionada...',
          });

          const res = await descargarVideo(trabajo.url, calidad, (progreso, msg) => {
            actualizarTrabajo(trabajo.id, {
              progreso,
              mensaje: msg,
            });
          });

          actualizarTrabajo(trabajo.id, {
            estado: 'completado',
            progreso: 100,
            mensaje: 'Video descargado con éxito.',
            archivoResultado: res.rutaArchivo,
            nombreDescarga: metadata?.titulo
              ? `${metadata.titulo.replace(/[/\\?%*:|"<>]/g, '_').slice(0, 50)}.mp4`
              : res.nombreArchivo,
            tamanoBytes: res.tamanoBytes,
          });
        } else {
          // Operación B: Extraer audio y preparar para análisis
          const huellaUrl = calcularHuellaUrl(trabajo.url);
          const previo = obtenerContenidoCanonico(huellaUrl);

          const audioPrevia = (previo?.metadatosAdicionales?.audioUrlPublica as string) || '';
          if (previo && (previo.estado === 'completada' || audioPrevia)) {
            console.info(`[Multimedia] Reutilizando audio/transcripción canónica para ${trabajo.url}`);
            actualizarTrabajo(trabajo.id, {
              estado: 'completado',
              progreso: 100,
              mensaje: 'Audio y transcripción canónica recuperados del almacén reutilizable.',
              audioUrlPublica: audioPrevia,
              nombreDescarga: metadata?.titulo ? `${metadata.titulo.slice(0, 40)}.mp3` : 'audio_predica.mp3',
            });
            return;
          }

          actualizarTrabajo(trabajo.id, {
            estado: 'extrayendo_audio',
            progreso: 30,
            mensaje: 'Extrayendo pista de audio del video...',
          });

          const resAudio = await extraerAudioDeVideo(trabajo.url, (progreso, msg) => {
            actualizarTrabajo(trabajo.id, {
              progreso,
              mensaje: msg,
            });
          });

          // Optimizar para STT si ffmpeg está disponible
          let rutaFinal = resAudio.rutaArchivo;
          const rutaOptimizada = resAudio.rutaArchivo.replace(/\.mp3$/, '_stt.mp3');
          try {
            actualizarTrabajo(trabajo.id, {
              estado: 'optimizando_audio',
              progreso: 70,
              mensaje: 'Optimizando audio para máxima fidelidad de voz (16kHz mono)...',
            });
            await optimizarAudioParaStt(resAudio.rutaArchivo, rutaOptimizada);
            if (existsSync(rutaOptimizada)) {
              rutaFinal = rutaOptimizada;
            }
          } catch (optErr) {
            console.warn('[Multimedia] No se pudo optimizar con ffmpeg, usando audio original:', optErr);
          }

          // Subir a Cloudinary para transcripción
          actualizarTrabajo(trabajo.id, {
            progreso: 85,
            mensaje: 'Preparando audio para el motor de transcripción...',
          });

          const buffer = readFileSync(rutaFinal);
          let secureUrl = '';
          try {
            secureUrl = await subirBufferACloudinary(buffer, resAudio.nombreArchivo);
          } catch (cloudErr) {
            console.warn('[Multimedia] Cloudinary no completó la subida, intentando con AssemblyAI upload:', cloudErr);
            const assemblyApiKey = process.env.ASSEMBLYAI_API_KEY?.trim();
            if (assemblyApiKey) {
              const { AssemblyAI } = await import('assemblyai');
              const aai = new AssemblyAI({ apiKey: assemblyApiKey });
              secureUrl = await aai.files.upload(buffer);
            } else {
              throw cloudErr;
            }
          }

          guardarContenidoCanonico({
            huella: huellaUrl,
            tipo: 'url',
            fuente: trabajo.url,
            titulo: metadata?.titulo,
            duracionSegundos: metadata?.duracionSegundos,
            estado: 'en_proceso',
            texto: '',
            caracteres: 0,
            palabras: 0,
            idioma: 'es',
            creadoEn: Date.now(),
            actualizadoEn: Date.now(),
            expiraEn: 0,
            metadatosAdicionales: {
              audioUrlPublica: secureUrl,
              nombreArchivo: resAudio.nombreArchivo,
            },
          });

          actualizarTrabajo(trabajo.id, {
            estado: 'completado',
            progreso: 100,
            mensaje: 'Pista de audio lista para transcribir y analizar.',
            archivoResultado: rutaFinal,
            audioUrlPublica: secureUrl,
            nombreDescarga: resAudio.nombreArchivo,
            tamanoBytes: buffer.length,
          });
        }
      } catch (err: any) {
        console.error('[Multimedia] Error en proceso:', err);
        actualizarTrabajo(trabajo.id, {
          estado: 'error',
          mensaje: err?.message || 'Error durante el procesamiento multimedia.',
          error: err?.message || 'Error desconocido.',
        });
      }
    })();

    return NextResponse.json({
      ok: true,
      jobId: trabajo.id,
      estado: trabajo.estado,
      mensaje: trabajo.mensaje,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error inesperado.';
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

