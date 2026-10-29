import { existsSync, mkdirSync, unlinkSync, readdirSync, statSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { tmpdir } from 'node:os';

export type EstadoTrabajo =
  | 'iniciado'
  | 'obteniendo_metadata'
  | 'descargando_video'
  | 'extrayendo_audio'
  | 'optimizando_audio'
  | 'completado'
  | 'error'
  | 'cancelado';

export interface MetadatosVideoInfo {
  titulo: string;
  duracionSegundos: number;
  duracionFormateada: string;
  autor?: string;
  miniatura?: string;
  formatosDisponibles: Array<{
    id: string;
    resolucion: string;
    extension: string;
    tamanoAproximado?: string;
    esSoloAudio?: boolean;
  }>;
}

export interface TrabajoMultimedia {
  id: string;
  tipo: 'extraer_audio' | 'descargar_video';
  url: string;
  estado: EstadoTrabajo;
  progreso: number; // 0 - 100
  mensaje: string;
  metadatos?: MetadatosVideoInfo;
  archivoResultado?: string;
  nombreDescarga?: string;
  tamanoBytes?: number;
  audioUrlPublica?: string; // Si se sube a Cloudinary o almacenamiento temporal
  error?: string;
  creadoEn: number;
  actualizadoEn: number;
}

export function obtenerDirectorioStaging(): string {
  const base = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME ? tmpdir() : resolve(process.cwd(), 'tmp');
  const dir = join(base, 'multimedia');
  if (!existsSync(dir)) {
    try {
      mkdirSync(dir, { recursive: true });
    } catch (err) {
      console.warn('[Multimedia] Directorio staging protegido o no creable:', err);
    }
  }
  return dir;
}

// Almacén en memoria de trabajos activos
const trabajos = new Map<string, TrabajoMultimedia>();
const TTL_TRABAJOS_MS = 30 * 60 * 1000; // 30 minutos

export function crearTrabajo(
  tipo: 'extraer_audio' | 'descargar_video',
  url: string,
): TrabajoMultimedia {
  limpiarTrabajosExpirados();
  const id = randomUUID();
  const trabajo: TrabajoMultimedia = {
    id,
    tipo,
    url,
    estado: 'iniciado',
    progreso: 5,
    mensaje: 'Inicializando tarea...',
    creadoEn: Date.now(),
    actualizadoEn: Date.now(),
  };
  trabajos.set(id, trabajo);
  return trabajo;
}

export function obtenerTrabajo(id: string): TrabajoMultimedia | undefined {
  return trabajos.get(id);
}

export function actualizarTrabajo(
  id: string,
  actualizaciones: Partial<TrabajoMultimedia>,
): TrabajoMultimedia | undefined {
  const trabajo = trabajos.get(id);
  if (!trabajo) return undefined;

  Object.assign(trabajo, actualizaciones, { actualizadoEn: Date.now() });
  return trabajo;
}

export function cancelarTrabajo(id: string): boolean {
  const trabajo = trabajos.get(id);
  if (!trabajo) return false;

  trabajo.estado = 'cancelado';
  trabajo.mensaje = 'Operación cancelada por el usuario.';
  trabajo.actualizadoEn = Date.now();

  if (trabajo.archivoResultado && existsSync(trabajo.archivoResultado)) {
    try {
      unlinkSync(trabajo.archivoResultado);
    } catch {}
  }
  return true;
}

export function eliminarTrabajo(id: string): boolean {
  const trabajo = trabajos.get(id);
  if (!trabajo) return false;

  if (trabajo.archivoResultado && existsSync(trabajo.archivoResultado)) {
    try {
      unlinkSync(trabajo.archivoResultado);
    } catch {}
  }
  trabajos.delete(id);
  return true;
}

export function limpiarTrabajosExpirados(): void {
  const ahora = Date.now();
  for (const [id, trabajo] of trabajos.entries()) {
    if (ahora - trabajo.actualizadoEn > TTL_TRABAJOS_MS) {
      if (trabajo.archivoResultado && existsSync(trabajo.archivoResultado)) {
        try {
          unlinkSync(trabajo.archivoResultado);
        } catch {}
      }
      trabajos.delete(id);
    }
  }

  // Limpieza física preventiva de archivos huérfanos en tmp/multimedia
  try {
    const stagingDir = obtenerDirectorioStaging();
    const archivos = readdirSync(stagingDir);
    for (const archivo of archivos) {
      const ruta = join(stagingDir, archivo);
      const stat = statSync(ruta);
      if (ahora - stat.mtimeMs > TTL_TRABAJOS_MS) {
        try {
          unlinkSync(ruta);
        } catch {}
      }
    }
  } catch {}
}

