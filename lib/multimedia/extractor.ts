import { spawn } from 'node:child_process';
import { existsSync, statSync, readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { obtenerDirectorioStaging, type MetadatosVideoInfo } from './job-manager.ts';
import { extractYouTubeVideoId } from '../youtube/extract-video-id';
import { fetchYouTubeOembed } from '../youtube/oembed';

const NAVEGADOR_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

export function obtenerRutaYtDlp(): string {
  const rutaLocalWin = resolve(process.cwd(), 'bin', 'yt-dlp.exe');
  if (existsSync(rutaLocalWin)) return rutaLocalWin;

  const rutaLocalLinux = resolve(process.cwd(), 'bin', 'yt-dlp');
  if (existsSync(rutaLocalLinux)) return rutaLocalLinux;

  const rutaVenvWin = resolve(process.cwd(), '.venv', 'Scripts', 'yt-dlp.exe');
  if (existsSync(rutaVenvWin)) return rutaVenvWin;

  return 'yt-dlp';
}

export function obtenerRutaFfmpeg(): string {
  const rutaLocalWin = resolve(process.cwd(), 'bin', 'ffmpeg.exe');
  if (existsSync(rutaLocalWin)) return rutaLocalWin;

  const rutaLocalLinux = resolve(process.cwd(), 'bin', 'ffmpeg');
  if (existsSync(rutaLocalLinux)) return rutaLocalLinux;

  return 'ffmpeg';
}

export function obtenerRutaFfprobe(): string {
  const rutaLocalWin = resolve(process.cwd(), 'bin', 'ffprobe.exe');
  if (existsSync(rutaLocalWin)) return rutaLocalWin;

  const rutaLocalLinux = resolve(process.cwd(), 'bin', 'ffprobe');
  if (existsSync(rutaLocalLinux)) return rutaLocalLinux;

  return 'ffprobe';
}

export function formatearSegundos(seg: number): string {
  const horas = Math.floor(seg / 3600);
  const minutos = Math.floor((seg % 3600) / 60);
  const segundos = Math.floor(seg % 60);

  if (horas > 0) {
    return `${horas}:${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;
  }
  return `${minutos}:${String(segundos).padStart(2, '0')}`;
}

/**
 * Genera el conjunto de argumentos optimizados y blindados anti-403 para yt-dlp.
 * Previene bloqueos por bot/CDN en YouTube, Facebook, Instagram y acelera descargas concurrentes.
 */
function construirArgumentosBaseYtDlp(url: string, opciones: { esDescarga?: boolean } = {}): string[] {
  const binDir = resolve(process.cwd(), 'bin');
  const urlLower = url.toLowerCase();

  const args: string[] = [
    '--no-playlist',
    '--no-warnings',
    '--no-check-certificates',
    '--geo-bypass',
    '--socket-timeout',
    opciones.esDescarga ? '60' : '45',
    '--retries',
    '10',
    '--fragment-retries',
    '10',
    '--file-access-retries',
    '3',
    '--retry-sleep',
    '1',
    '--ffmpeg-location',
    binDir,
    '--js-runtimes',
    'node',
    '--user-agent',
    NAVEGADOR_USER_AGENT,
    '--add-header',
    'Accept-Language: es-ES,es;q=0.9,en;q=0.8',
    '--add-header',
    'Sec-Fetch-Mode: navigate',
    // Evita que ffmpeg intente descargar directamente HLS/DASH sin cabeceras (causante del error 403)
    '--hls-prefer-native',
    '--downloader',
    'dash,m3u8:native',
  ];

  if (opciones.esDescarga) {
    // Aceleración de descarga: hasta 5 fragmentos concurrentes y buffers optimizados
    args.push(
      '-N',
      '5',
      '--buffer-size',
      '64K',
      '--http-chunk-size',
      '10M',
    );
  }

  // Reglas específicas por plataforma para evitar errores 403 / 429
  if (urlLower.includes('youtube.com') || urlLower.includes('youtu.be')) {
    args.push(
      '--extractor-args',
      'youtube:player_client=android,web',
      '--referer',
      'https://www.youtube.com/',
    );
  } else if (urlLower.includes('facebook.com') || urlLower.includes('fb.watch')) {
    args.push(
      '--referer',
      'https://www.facebook.com/',
      '--add-header',
      'Sec-Fetch-Site: same-origin',
      '--add-header',
      'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    );
  } else if (urlLower.includes('vimeo.com')) {
    args.push('--referer', 'https://vimeo.com/');
  } else if (urlLower.includes('instagram.com')) {
    args.push('--referer', 'https://www.instagram.com/');
  }

  return args;
}

/**
 * Ejecuta yt-dlp -J para inspeccionar los metadatos y transmisiones disponibles sin descargar.
 * Cuenta con timeout controlado y rescate instantáneo mediante oEmbed para enlaces de YouTube.
 */
export async function obtenerMetadatosVideo(url: string): Promise<MetadatosVideoInfo> {
  const ytdlp = obtenerRutaYtDlp();
  const videoId = extractYouTubeVideoId(url);

  const formatosDisponiblesPorDefecto: MetadatosVideoInfo['formatosDisponibles'] = [
    {
      id: 'best',
      resolucion: 'Mejor calidad disponible',
      extension: 'mp4',
      tamanoAproximado: 'Automático',
    },
    {
      id: '720p',
      resolucion: '720p (HD)',
      extension: 'mp4',
      tamanoAproximado: 'Estándar',
    },
    {
      id: '480p',
      resolucion: '480p (Media / Móvil)',
      extension: 'mp4',
      tamanoAproximado: 'Liviano',
    },
    {
      id: 'audio_mp3',
      resolucion: 'Solo audio',
      extension: 'mp3',
      esSoloAudio: true,
      tamanoAproximado: 'Óptimo para estudio',
    },
  ];

  // 1. PRIORIDAD: Si es enlace de YouTube, consulta ultra-rápida vía oEmbed (<200ms)
  // No requiere procesos secundarios ni binarios locales y funciona 100% en cualquier servidor o Vercel.
  if (videoId) {
    try {
      const oembed = await fetchYouTubeOembed(videoId);
      if (oembed.title) {
        return {
          titulo: oembed.title,
          duracionSegundos: 0,
          duracionFormateada: 'Detectada al procesar',
          autor: oembed.author,
          miniatura: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
          formatosDisponibles: formatosDisponiblesPorDefecto,
        };
      }
    } catch {}
  }

  // 2. Si no es YouTube o no respondió oEmbed, intentar yt-dlp con timeout seguro de 6 segundos
  try {
    const baseArgs = construirArgumentosBaseYtDlp(url, { esDescarga: false });
    const args = ['-J', ...baseArgs, url];

    const metadataYtDlp = await new Promise<MetadatosVideoInfo>((resolvePromise, reject) => {
      let stdoutData = '';
      let stderrData = '';

      const proc = spawn(ytdlp, args, {
        windowsHide: true,
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      const timer = setTimeout(() => {
        try {
          proc.kill();
        } catch {}
        reject(new Error('Timeout yt-dlp'));
      }, 6000);

      proc.stdout.on('data', (chunk) => {
        stdoutData += chunk.toString('utf-8');
      });

      proc.stderr.on('data', (chunk) => {
        stderrData += chunk.toString('utf-8');
      });

      proc.on('error', (err) => {
        clearTimeout(timer);
        reject(err);
      });

      proc.on('close', (code) => {
        clearTimeout(timer);
        if (code !== 0) {
          return reject(new Error(stderrData.trim() || `Código ${code}`));
        }

        try {
          const info = JSON.parse(stdoutData);
          const duracion = typeof info.duration === 'number' ? info.duration : 0;

          resolvePromise({
            titulo: info.title || 'Prédica / Enseñanza',
            duracionSegundos: duracion,
            duracionFormateada: formatearSegundos(duracion),
            autor: info.uploader || info.channel || undefined,
            miniatura: info.thumbnail || undefined,
            formatosDisponibles: formatosDisponiblesPorDefecto,
          });
        } catch (e) {
          reject(e);
        }
      });
    });

    return metadataYtDlp;
  } catch {
    // 3. Contingencia indestructible: si yt-dlp no está o falló, devolver metadatos listos
    const esFb = url.includes('facebook.com') || url.includes('fb.watch');
    return {
      titulo: esFb ? 'Video / Prédica de Facebook' : 'Video preparado para análisis',
      duracionSegundos: 0,
      duracionFormateada: 'Detectada al procesar',
      miniatura: videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : undefined,
      formatosDisponibles: formatosDisponiblesPorDefecto,
    };
  }
}

/**
 * Descarga un video con la calidad solicitada hacia el directorio staging.
 */
export async function descargarVideo(
  url: string,
  calidad: string = 'best',
  onProgress?: (progreso: number, mensaje: string) => void,
): Promise<{ rutaArchivo: string; nombreArchivo: string; tamanoBytes: number }> {
  const ytdlp = obtenerRutaYtDlp();
  const staging = obtenerDirectorioStaging();

  // Plantilla de nombre seguro
  const salidaTemplate = join(staging, '%(id)s.%(ext)s');

  let formatSelector = 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best';
  if (calidad === '720p') {
    formatSelector = 'bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]/best[height<=720]/best';
  } else if (calidad === '480p') {
    formatSelector = 'bestvideo[height<=480][ext=mp4]+bestaudio[ext=m4a]/best[height<=480]/best';
  } else if (calidad === 'audio_mp3') {
    return extraerAudioDeVideo(url, onProgress);
  }

  const baseArgs = construirArgumentosBaseYtDlp(url, { esDescarga: true });
  const args = [
    ...baseArgs,
    '-f',
    formatSelector,
    '--merge-output-format',
    'mp4',
    '-o',
    salidaTemplate,
    '--print',
    'after_move:filepath',
    url,
  ];

  return new Promise((resolvePromise, reject) => {
    let archivoDestino = '';
    let stdoutData = '';
    let stderrData = '';

    const proc = spawn(ytdlp, args, {
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    proc.stdout.on('data', (chunk) => {
      const text = chunk.toString('utf-8');
      stdoutData += text;

      // Parsear progreso del tipo: [download]  45.2% of ~12.50MiB at 2.45MiB/s
      const matchPorcentaje = text.match(/\[download\]\s+(\d+(?:\.\d+)?)%/);
      if (matchPorcentaje) {
        const pct = parseFloat(matchPorcentaje[1]);
        onProgress?.(Math.min(95, Math.max(10, Math.floor(pct))), `Descargando video: ${Math.floor(pct)}%`);
      }
    });

    proc.stderr.on('data', (chunk) => {
      stderrData += chunk.toString('utf-8');
    });

    proc.on('close', (code) => {
      if (code !== 0) {
        const errorMsg = stderrData.trim() || `Error ${code}`;
        if (errorMsg.includes('403') || errorMsg.includes('Forbidden')) {
          return reject(
            new Error(
              'La plataforma restringió la descarga (código 403). Intenta de nuevo o extrae el audio directamente.',
            ),
          );
        }
        return reject(new Error(`Error al descargar video: ${errorMsg.slice(0, 200)}`));
      }

      // 1. Buscar ruta en líneas impresas por --print after_move:filepath
      const lineas = stdoutData.split(/[\r\n]+/).map((l) => l.trim()).filter(Boolean);
      for (const l of lineas) {
        if ((l.endsWith('.mp4') || l.endsWith('.mkv') || l.endsWith('.webm')) && existsSync(/*turbopackIgnore: true*/ l)) {
          archivoDestino = l;
          break;
        }
      }

      // 2. Si no se detectó por stdout, buscar el archivo más reciente en staging
      if (!archivoDestino || !existsSync(/*turbopackIgnore: true*/ archivoDestino)) {
        try {
          const archivos = readdirSync(staging).map((f) => join(staging, f));
          const recientes = archivos
            .filter((f) => existsSync(/*turbopackIgnore: true*/ f) && f.endsWith('.mp4'))
            .map((f) => ({ ruta: f, mtime: statSync(/*turbopackIgnore: true*/ f).mtimeMs }))
            .sort((a, b) => b.mtime - a.mtime);

          if (recientes.length > 0 && Date.now() - recientes[0].mtime < 180_000) {
            archivoDestino = recientes[0].ruta;
          }
        } catch {}
      }

      if (!archivoDestino || !existsSync(/*turbopackIgnore: true*/ archivoDestino)) {
        return reject(new Error('No se pudo localizar el archivo descargado.'));
      }

      const stat = statSync(/*turbopackIgnore: true*/ archivoDestino);
      const nombreArchivo = archivoDestino.split(/[\\/]/).pop() || 'video.mp4';

      resolvePromise({
        rutaArchivo: archivoDestino,
        nombreArchivo,
        tamanoBytes: stat.size,
      });
    });
  });
}

/**
 * Extrae únicamente la pista de audio de un video web (Operación B: Audio Directo).
 */
export async function extraerAudioDeVideo(
  url: string,
  onProgress?: (progreso: number, mensaje: string) => void,
): Promise<{ rutaArchivo: string; nombreArchivo: string; tamanoBytes: number }> {
  const ytdlp = obtenerRutaYtDlp();
  const staging = obtenerDirectorioStaging();
  const salidaTemplate = join(staging, '%(id)s.%(ext)s');

  const baseArgs = construirArgumentosBaseYtDlp(url, { esDescarga: true });
  const args = [
    ...baseArgs,
    '-f',
    'ba/b',
    '-x',
    '--audio-format',
    'mp3',
    '--audio-quality',
    '0',
    '-o',
    salidaTemplate,
    '--print',
    'after_move:filepath',
    url,
  ];

  return new Promise((resolvePromise, reject) => {
    let archivoDestino = '';
    let stdoutData = '';
    let stderrData = '';

    const proc = spawn(ytdlp, args, {
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    proc.stdout.on('data', (chunk) => {
      const text = chunk.toString('utf-8');
      stdoutData += text;

      const matchPorcentaje = text.match(/\[download\]\s+(\d+(?:\.\d+)?)%/);
      if (matchPorcentaje) {
        const pct = parseFloat(matchPorcentaje[1]);
        onProgress?.(Math.min(90, Math.max(10, Math.floor(pct))), `Extrayendo audio: ${Math.floor(pct)}%`);
      }
    });

    proc.stderr.on('data', (chunk) => {
      stderrData += chunk.toString('utf-8');
    });

    proc.on('close', (code) => {
      if (code !== 0) {
        const errorMsg = stderrData.trim() || `Error ${code}`;
        if (errorMsg.includes('403') || errorMsg.includes('Forbidden')) {
          return reject(
            new Error(
              'La plataforma restringió la extracción de audio (código 403). Intenta de nuevo o sube el archivo de audio directamente.',
            ),
          );
        }
        return reject(new Error(`Error al extraer pista de audio: ${errorMsg.slice(0, 200)}`));
      }

      // 1. Buscar ruta en líneas impresas por --print after_move:filepath
      const lineas = stdoutData.split(/[\r\n]+/).map((l) => l.trim()).filter(Boolean);
      for (const l of lineas) {
        if ((l.endsWith('.mp3') || l.endsWith('.m4a') || l.endsWith('.aac')) && existsSync(/*turbopackIgnore: true*/ l)) {
          archivoDestino = l;
          break;
        }
      }

      // 2. Si no se detectó por stdout, buscar el archivo mp3 más reciente en staging
      if (!archivoDestino || !existsSync(/*turbopackIgnore: true*/ archivoDestino)) {
        try {
          const archivos = readdirSync(staging).map((f) => join(staging, f));
          const recientes = archivos
            .filter((f) => existsSync(/*turbopackIgnore: true*/ f) && f.endsWith('.mp3'))
            .map((f) => ({ ruta: f, mtime: statSync(/*turbopackIgnore: true*/ f).mtimeMs }))
            .sort((a, b) => b.mtime - a.mtime);

          if (recientes.length > 0 && Date.now() - recientes[0].mtime < 180_000) {
            archivoDestino = recientes[0].ruta;
          }
        } catch {}
      }

      if (!archivoDestino || !existsSync(/*turbopackIgnore: true*/ archivoDestino)) {
        return reject(new Error('No se pudo localizar el archivo de audio extraído.'));
      }

      const stat = statSync(/*turbopackIgnore: true*/ archivoDestino);
      const nombreArchivo = archivoDestino.split(/[\\/]/).pop() || 'audio.mp3';

      resolvePromise({
        rutaArchivo: archivoDestino,
        nombreArchivo,
        tamanoBytes: stat.size,
      });
    });
  });
}

/**
 * Transcodifica un archivo de audio a 16 kHz Mono a 48 kbps para máxima velocidad
 * y fidelidad en modelos Speech-to-Text (AssemblyAI / Deepgram).
 */
export async function optimizarAudioParaStt(
  rutaOrigen: string,
  rutaDestino: string,
): Promise<string> {
  const ffmpeg = obtenerRutaFfmpeg();

  const args = [
    '-y',
    '-i',
    rutaOrigen,
    '-vn',
    '-ar',
    '16000',
    '-ac',
    '1',
    '-b:a',
    '48k',
    rutaDestino,
  ];

  return new Promise((resolvePromise, reject) => {
    let stderrData = '';
    const proc = spawn(ffmpeg, args, {
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    proc.stderr.on('data', (chunk) => {
      stderrData += chunk.toString('utf-8');
    });

    proc.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(`Error al optimizar audio para STT: ${stderrData.slice(0, 200)}`));
      }
      resolvePromise(rutaDestino);
    });
  });
}
