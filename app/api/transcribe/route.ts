import { AssemblyAI } from 'assemblyai';
import { NextRequest, NextResponse } from 'next/server';
import { verificarRateLimit } from '@/lib/rate-limit';
import {
  calcularHuellaUrl,
  obtenerContenidoCanonico,
  guardarContenidoCanonico,
  ejecutarConBloqueoCanonico,
} from '@/lib/canonical-store';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

const assemblyApiKey = process.env.ASSEMBLYAI_API_KEY?.trim();
const deepgramApiKey = process.env.DEEPGRAM_API_KEY?.trim();
const aai = assemblyApiKey ? new AssemblyAI({ apiKey: assemblyApiKey }) : null;

function esUrlAudioSegura(urlString: string): boolean {
  try {
    const parsed = new URL(urlString);
    if (parsed.protocol !== 'https:') return false;
    const hostname = parsed.hostname.toLowerCase();
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '::1' ||
      hostname.startsWith('10.') ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('169.254.') ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname)
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

function errorDeepgram(status: number): string {
  if (status === 401 || status === 403) return 'La clave de Deepgram no es válida o no tiene permisos para transcribir.';
  if (status === 429) return 'Deepgram alcanzó temporalmente su límite de uso. Intenta de nuevo en unos minutos.';
  if (status === 402) return 'La cuenta de Deepgram no tiene saldo o crédito disponible.';
  if (status === 413) return 'El audio es demasiado grande para Deepgram. Usa un archivo más liviano.';
  return `Deepgram no pudo transcribir el audio (HTTP ${status}). Revisa la consola de Deepgram.`;
}

export async function POST(req: NextRequest) {
  try {
    const rate = verificarRateLimit(req, 'transcribe', 15, 60_000);
    if (!rate.permitido) {
      console.warn('[Seguridad] Límite de tasa excedido en /api/transcribe');
      return NextResponse.json(
        { error: 'Demasiadas solicitudes de transcripción. Por favor espera un momento.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(rate.resetMs / 1000)) } },
      );
    }

    const body = (await req.json().catch(() => null)) as {
      audioUrl?: unknown;
      huella?: unknown;
      urlOriginal?: unknown;
    } | null;
    const audioUrl = typeof body?.audioUrl === 'string' ? body.audioUrl : '';
    const huellaParam = typeof body?.huella === 'string' ? body.huella : '';
    const urlOriginal = typeof body?.urlOriginal === 'string' ? body.urlOriginal : '';

    if (!audioUrl) {
      return NextResponse.json({ error: 'No se recibió la ruta del audio.' }, { status: 400 });
    }

    const huella = huellaParam || (urlOriginal ? calcularHuellaUrl(urlOriginal) : calcularHuellaUrl(audioUrl));
    const registroExistente = obtenerContenidoCanonico(huella);
    if (registroExistente && registroExistente.estado === 'completada' && registroExistente.texto) {
      console.info(`[Transcripción] Reutilizando transcripción canónica (${registroExistente.palabras} palabras) para huella ${huella.slice(0, 8)}.`);
      return NextResponse.json({
        text: registroExistente.texto,
        huella: registroExistente.huella,
        cached: true,
        proveedor: registroExistente.proveedor,
      });
    }

    if (!esUrlAudioSegura(audioUrl)) {
      console.warn('[Seguridad] Intento de SSRF bloqueado en /api/transcribe');
      return NextResponse.json({ error: 'La URL del audio no es válida o no está permitida.' }, { status: 400 });
    }

    if (!aai && !deepgramApiKey) {
      console.error('[Transcripción] No hay ASSEMBLYAI_API_KEY ni DEEPGRAM_API_KEY configuradas.');
      return NextResponse.json(
        {
          error: 'No hay proveedor de transcripción configurado. Agrega ASSEMBLYAI_API_KEY o DEEPGRAM_API_KEY en .env.local o en las variables de Vercel, y reinicia el servidor.',
        },
        { status: 503 },
      );
    }

    let textoTranscrito = '';
    let proveedorUsado = '';
    let falloDeepgram = '';
    let falloAssembly = '';

    const orden = (process.env.TRANSCRIPT_PROVIDER_ORDER || 'deepgram,assemblyai')
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);

    for (const proveedor of orden) {
      if (textoTranscrito) break;

      if (proveedor === 'deepgram' && deepgramApiKey) {
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 60_000);
          const respuesta = await fetch(
            'https://api.deepgram.com/v1/listen?model=nova-2&language=es&smart_format=true&punctuate=true',
            {
              method: 'POST',
              headers: {
                Authorization: `Token ${deepgramApiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ url: audioUrl }),
              signal: controller.signal,
            },
          );
          clearTimeout(timeout);

          if (!respuesta.ok) {
            falloDeepgram = errorDeepgram(respuesta.status);
            console.warn(`[Transcripción] Deepgram falló con HTTP ${respuesta.status}: ${falloDeepgram}`);
            continue;
          }

          const datos = (await respuesta.json()) as {
            results?: {
              channels?: Array<{
                alternatives?: Array<{
                  transcript?: string;
                  paragraphs?: { transcript?: string };
                }>;
              }>;
            };
          };
          const alt = datos.results?.channels?.[0]?.alternatives?.[0];
          const texto = alt?.paragraphs?.transcript || alt?.transcript || '';
          if (texto.trim()) {
            textoTranscrito = texto.trim();
            proveedorUsado = 'deepgram';
            console.info(`[Transcripción] Exitosa con Deepgram (${textoTranscrito.length} caracteres)`);
            break;
          }
        } catch (error) {
          falloDeepgram = error instanceof Error ? error.message : 'Deepgram no respondió.';
          console.warn('[Transcripción] Deepgram falló:', falloDeepgram.slice(0, 180));
        }
      }

      if (proveedor === 'assemblyai' && aai) {
        try {
          console.info('[Transcripción] Intentando con AssemblyAI…');
          const transcript = await aai.transcripts.transcribe({
            audio: audioUrl,
            language_code: 'es',
          });
          if (transcript.status === 'error') {
            throw new Error(transcript.error || 'AssemblyAI devolvió un error.');
          }
          const texto = (transcript.text || '').trim();
          if (texto) {
            textoTranscrito = texto;
            proveedorUsado = 'assemblyai';
            console.info(`[Transcripción] Exitosa con AssemblyAI (${textoTranscrito.length} caracteres)`);
            break;
          }
        } catch (error) {
          falloAssembly = error instanceof Error ? error.message : 'AssemblyAI no respondió.';
          console.warn('[Transcripción] AssemblyAI falló:', falloAssembly.slice(0, 180));
        }
      }
    }

    if (!textoTranscrito) {
      const errores = [falloDeepgram, falloAssembly].filter(Boolean).join(' | ');
      if (errores) {
        throw new Error(`No se pudo transcribir el audio: ${errores}`);
      }
      throw new Error('No se detectó voz clara en el audio o el archivo está vacío. Prueba con otro archivo o revisa el volumen.');
    }

    guardarContenidoCanonico({
      huella,
      tipo: 'archivo_audio',
      fuente: urlOriginal || audioUrl,
      estado: 'completada',
      texto: textoTranscrito,
      caracteres: textoTranscrito.length,
      palabras: textoTranscrito.split(/\s+/).filter(Boolean).length,
      idioma: 'es',
      proveedor: proveedorUsado || 'desconocido',
      creadoEn: Date.now(),
      actualizadoEn: Date.now(),
      expiraEn: 0,
    });

    return NextResponse.json({
      text: textoTranscrito,
      huella,
      cached: false,
      proveedor: proveedorUsado,
    });
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : 'Error al transcribir el audio.';
    console.error('[Transcripción] Error:', mensaje);
    return NextResponse.json({ error: mensaje }, { status: 500 });
  }
}
