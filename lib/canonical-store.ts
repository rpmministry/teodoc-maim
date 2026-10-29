import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync, unlinkSync, readdirSync, statSync } from 'node:fs';
import { resolve, join } from 'node:path';
import type { ModalidadId } from './tipos.ts';

export type TipoFuenteCanonica = 'url' | 'archivo_audio' | 'archivo_video' | 'documento' | 'texto';
export type EstadoTranscripcionCanonica = 'en_proceso' | 'completada' | 'incompleta' | 'error';

export interface SegmentoTranscripcion {
  inicio: number;
  fin: number;
  texto: string;
  hablante?: string;
}

export interface RegistroContenidoCanonico {
  huella: string; // Hash SHA-256 canónico
  tipo: TipoFuenteCanonica;
  fuente: string; // URL normalizada, nombre de archivo o etiqueta
  titulo?: string;
  autor?: string;
  duracionSegundos?: number;
  estado: EstadoTranscripcionCanonica;
  texto: string; // Texto íntegro y verídico (NUNCA un resumen)
  caracteres: number;
  palabras: number;
  segmentos?: SegmentoTranscripcion[];
  idioma: string;
  proveedor?: string; // 'deepgram' | 'assemblyai' | 'documento' | 'directo'
  modelo?: string;
  creadoEn: number;
  actualizadoEn: number;
  expiraEn: number;
  usuarioId?: string; // Alcance de autorización / espacio de trabajo
  advertencias?: string[];
  error?: string;
  metadatosAdicionales?: Record<string, unknown>;
  analisisCheados?: Partial<Record<ModalidadId, unknown>>;
}

const DIRECTORIO_CANONICO = resolve(process.cwd(), 'tmp', 'canonical');

// TTL por defecto: 24 horas (ajustable por variable de entorno)
const TTL_HORAS_POR_DEFECTO = Number(process.env.CANONICAL_TTL_HOURS) || 24;
export const TTL_CANONICO_MS = TTL_HORAS_POR_DEFECTO * 60 * 60 * 1000;

function asegurarDirectorio(): string {
  if (!existsSync(DIRECTORIO_CANONICO)) {
    mkdirSync(DIRECTORIO_CANONICO, { recursive: true });
  }
  return DIRECTORIO_CANONICO;
}

// Almacén en memoria para acceso ultra-rápido (<1ms) durante la vida del proceso
const cacheMemoria = new Map<string, RegistroContenidoCanonico>();

// Bloqueo de concurrencia: promesas en vuelo para solicitudes simultáneas de la misma huella
const promesasEnVuelo = new Map<string, Promise<RegistroContenidoCanonico>>();

/**
 * Normaliza una URL eliminando tokens de rastreo efímeros para producir una huella canónica determinista.
 */
export function normalizarUrlCanonica(urlStr: string): string {
  try {
    const u = new URL(urlStr.trim());
    const host = u.hostname.toLowerCase().replace(/^www\./, '');

    // YouTube: canonizar a videoId
    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtu.be') {
      let videoId = '';
      if (host === 'youtu.be') {
        videoId = u.pathname.slice(1).split('/')[0];
      } else if (u.pathname === '/watch') {
        videoId = u.searchParams.get('v') || '';
      } else if (u.pathname.startsWith('/live/') || u.pathname.startsWith('/embed/') || u.pathname.startsWith('/shorts/')) {
        videoId = u.pathname.split('/')[2] || '';
      }
      if (videoId) {
        return `youtube:${videoId}`;
      }
    }

    // Facebook: limpiar parámetros efímeros de tracking
    if (host.includes('facebook.com') || host.includes('fb.watch')) {
      const fbParams = ['v', 'video_id', 'story_fbid'];
      for (const p of fbParams) {
        const val = u.searchParams.get(p);
        if (val) return `facebook:${val}`;
      }
    }

    // Limpieza general de parámetros UTM y tracking
    const paramsBorrar = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'fbclid', 'si', 'feature', 'app'];
    for (const p of paramsBorrar) {
      u.searchParams.delete(p);
    }

    return `${host}${u.pathname.replace(/\/+$/, '')}${u.search ? u.search : ''}`;
  } catch {
    return urlStr.trim().toLowerCase();
  }
}

/**
 * Genera huella SHA-256 a partir del texto limpio y normalizado.
 */
export function calcularHuellaTexto(texto: string): string {
  const normalizado = texto.replace(/\r\n/g, '\n').replace(/[ \t]+/g, ' ').trim();
  return createHash('sha256').update(normalizado, 'utf8').digest('hex');
}

/**
 * Genera huella SHA-256 para archivos binarios (audio, video, PDF, Word).
 */
export function calcularHuellaBuffer(buffer: Uint8Array | Buffer): string {
  return createHash('sha256').update(buffer).digest('hex');
}

/**
 * Genera huella SHA-256 para una URL remota.
 */
export function calcularHuellaUrl(url: string): string {
  const canonica = normalizarUrlCanonica(url);
  return createHash('sha256').update(`url:${canonica}`, 'utf8').digest('hex');
}

function rutaArchivo(huella: string): string {
  return join(asegurarDirectorio(), `${huella}.json`);
}

/**
 * Recupera un registro canónico por su huella digital criptográfica.
 * Comprueba tanto el caché en memoria como el almacenamiento seguro en disco.
 */
export function obtenerContenidoCanonico(
  huella: string,
  usuarioId?: string,
): RegistroContenidoCanonico | null {
  limpiarContenidosExpirados();

  // 1. Verificar caché en memoria
  let registro = cacheMemoria.get(huella);

  // 2. Si no está en memoria, leer del disco
  if (!registro) {
    const ruta = rutaArchivo(huella);
    if (existsSync(ruta)) {
      try {
        const contenidoRaw = readFileSync(ruta, 'utf8');
        registro = JSON.parse(contenidoRaw) as RegistroContenidoCanonico;
        cacheMemoria.set(huella, registro);
      } catch (err) {
        console.warn(`[Canónico] No se pudo leer el archivo ${ruta}:`, err);
        return null;
      }
    }
  }

  if (!registro) return null;

  // 3. Verificar expiración (TTL)
  if (Date.now() > registro.expiraEn) {
    eliminarContenidoCanonico(huella);
    return null;
  }

  // 4. Aislamiento de seguridad por usuario/espacio de trabajo (si está configurado)
  if (registro.usuarioId && usuarioId && registro.usuarioId !== usuarioId) {
    console.warn(`[Canónico] Intento de acceso no autorizado al registro ${huella}`);
    return null;
  }

  return registro;
}

/**
 * Guarda o actualiza un registro canónico de forma atómica en memoria y disco.
 */
export function guardarContenidoCanonico(registro: RegistroContenidoCanonico): void {
  asegurarDirectorio();
  registro.actualizadoEn = Date.now();
  if (!registro.expiraEn) {
    registro.expiraEn = Date.now() + TTL_CANONICO_MS;
  }
  if (!registro.caracteres && registro.texto) {
    registro.caracteres = registro.texto.length;
  }
  if (!registro.palabras && registro.texto) {
    registro.palabras = registro.texto.trim().split(/\s+/).filter(Boolean).length;
  }

  // Guardar en memoria
  cacheMemoria.set(registro.huella, registro);

  // Guardar en disco de forma segura
  const ruta = rutaArchivo(registro.huella);
  try {
    writeFileSync(ruta, JSON.stringify(registro, null, 2), 'utf8');
  } catch (err) {
    console.error(`[Canónico] Error al escribir en disco para huella ${registro.huella}:`, err);
  }
}

/**
 * Actualiza parcialmente un registro canónico existente.
 */
export function actualizarContenidoCanonico(
  huella: string,
  parcial: Partial<RegistroContenidoCanonico>,
): RegistroContenidoCanonico | null {
  const existente = obtenerContenidoCanonico(huella);
  if (!existente) return null;

  const actualizado: RegistroContenidoCanonico = {
    ...existente,
    ...parcial,
    actualizadoEn: Date.now(),
  };

  if (parcial.texto) {
    actualizado.caracteres = parcial.texto.length;
    actualizado.palabras = parcial.texto.trim().split(/\s+/).filter(Boolean).length;
  }

  guardarContenidoCanonico(actualizado);
  return actualizado;
}

/**
 * Almacena el resultado de un análisis (General, Liderazgo, Grupos, etc.) dentro del registro canónico.
 * Esto evita recalcular el mismo análisis para la misma prédica.
 */
export function guardarAnalisisEnCanonico(
  huella: string,
  modalidad: ModalidadId,
  analisis: unknown,
): void {
  const registro = obtenerContenidoCanonico(huella);
  if (!registro) return;

  if (!registro.analisisCheados) {
    registro.analisisCheados = {};
  }
  registro.analisisCheados[modalidad] = analisis;
  guardarContenidoCanonico(registro);
}

/**
 * Recupera un análisis previamente generado y asociado a la huella canónica.
 */
export function obtenerAnalisisDeCanonico<T>(
  huella: string,
  modalidad: ModalidadId,
): T | null {
  const registro = obtenerContenidoCanonico(huella);
  if (!registro?.analisisCheados?.[modalidad]) return null;
  return registro.analisisCheados[modalidad] as T;
}

/**
 * Elimina un registro canónico de la memoria y del disco.
 * Regla de seguridad: Esto NO afecta los documentos permanentes del usuario en la biblioteca ni en descargas.
 */
export function eliminarContenidoCanonico(huella: string): boolean {
  cacheMemoria.delete(huella);
  const ruta = rutaArchivo(huella);
  if (existsSync(ruta)) {
    try {
      unlinkSync(ruta);
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * Ejecuta una operación de extracción/transcripción garantizando unicidad:
 * Si dos o más solicitudes simultáneas intentan procesar la misma huella,
 * comparten la misma promesa en curso y NO duplican la operación ni las llamadas externas a IA/STT.
 */
export async function ejecutarConBloqueoCanonico(
  huella: string,
  ejecutor: () => Promise<RegistroContenidoCanonico>,
): Promise<RegistroContenidoCanonico> {
  // 1. Si ya existe completado en el almacén, devolverlo de inmediato
  const existente = obtenerContenidoCanonico(huella);
  if (existente && existente.estado === 'completada') {
    return existente;
  }

  // 2. Si ya hay una promesa en vuelo para esta misma huella, esperar a que termine
  const promesaExistente = promesasEnVuelo.get(huella);
  if (promesaExistente) {
    console.info(`[Canónico] Concurrencia detectada para huella ${huella.slice(0, 8)}. Esperando tarea activa...`);
    return await promesaExistente;
  }

  // 3. Crear promesa y registrarla en el mapa de promesas en vuelo
  const nuevaPromesa = (async () => {
    try {
      const resultado = await ejecutor();
      guardarContenidoCanonico(resultado);
      return resultado;
    } finally {
      promesasEnVuelo.delete(huella);
    }
  })();

  promesasEnVuelo.set(huella, nuevaPromesa);
  return await nuevaPromesa;
}

/**
 * Limpieza automática de registros expirados.
 * Se ejecuta de manera transparente al consultar o guardar.
 */
let ultimoBarridoLimpieza = 0;
const INTERVALO_BARRIDO_MS = 10 * 60 * 1000; // cada 10 minutos como máximo

export function limpiarContenidosExpirados(): number {
  const ahora = Date.now();
  if (ahora - ultimoBarridoLimpieza < INTERVALO_BARRIDO_MS) {
    return 0;
  }
  ultimoBarridoLimpieza = ahora;

  let eliminados = 0;

  // Limpiar memoria
  for (const [huella, reg] of cacheMemoria.entries()) {
    if (ahora > reg.expiraEn) {
      cacheMemoria.delete(huella);
      eliminados++;
    }
  }

  // Limpiar disco
  const dir = asegurarDirectorio();
  try {
    const archivos = readdirSync(dir);
    for (const archivo of archivos) {
      if (!archivo.endsWith('.json')) continue;
      const ruta = join(dir, archivo);
      try {
        const stats = statSync(ruta);
        // Si el archivo físico tiene más de TTL_CANONICO_MS de antigüedad
        if (ahora - stats.mtimeMs > TTL_CANONICO_MS) {
          unlinkSync(ruta);
          eliminados++;
        }
      } catch {
        // Ignorar errores de archivo individual
      }
    }
  } catch (err) {
    console.warn('[Canónico] Error durante la limpieza de expirados:', err);
  }

  if (eliminados > 0) {
    console.info(`[Canónico] Limpieza completada: se eliminaron ${eliminados} registros temporales expirados.`);
  }

  return eliminados;
}

