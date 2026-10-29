'use client';

import { useState, useRef, useEffect, type ReactNode } from 'react';
import { MODALIDADES, RANGOS_EDAD } from '@/lib/modalidades';
import type { ModalidadId, RangoEdad } from '@/lib/tipos';
import {
  IconoAudio,
  IconoCheck,
  IconoFlecha,
  IconoModalidad,
  IconoVideo,
  IconoDocumento,
  IconoDescarga,
} from './marca';
import EditorTextoPegar from './editor-texto-pegar';
import { guardarTranscripcionPendiente } from '@/lib/analisis-storage';
import { adquirirPantallaActiva, liberarPantallaActiva } from '@/lib/wake-lock';
import type { MetadatosVideoInfo } from '@/lib/multimedia/job-manager';

export interface ValoresFormulario {
  titulo: string;
  predicador: string;
  fecha: string;
  texto: string;
  modalidad: ModalidadId;
  rangoEdad: RangoEdad;
}

export interface EstadoAudioFormulario {
  activo: boolean;
  progreso: number;
  mensaje?: string;
  error?: string;
  nombre?: string;
}

interface Props {
  valores: ValoresFormulario;
  onCambio: (cambio: Partial<ValoresFormulario>) => void;
  onArchivo: (archivo: File) => void;
  onAnalizar: () => void;
  onAnalizarConTexto?: (texto: string, tituloSugerido?: string) => void;
  cargando: boolean;
  estadoAudio: EstadoAudioFormulario;
  errores: string[];
}

type TabOrigen = 'enlace' | 'archivo' | 'documento';

function Seccion({
  numero,
  titulo,
  descripcion,
  children,
}: {
  numero: string;
  titulo: string;
  descripcion?: string;
  children: ReactNode;
}) {
  return (
    <section className="border-t border-[var(--linea)] py-7 first:border-t-0 first:pt-0">
      <div className="mb-5 flex items-start gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--coralOscuro)] text-[11px] font-bold text-white">
          {numero}
        </span>
        <div>
          <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-[var(--tinta)]">{titulo}</h2>
          {descripcion && <p className="mt-1 max-w-2xl text-[12.5px] leading-relaxed text-[var(--muted)]">{descripcion}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

export default function FormularioAnalisis({
  valores,
  onCambio,
  onArchivo,
  onAnalizar,
  onAnalizarConTexto,
  cargando,
  estadoAudio,
  errores,
}: Props) {
  // Pestañas de origen de material
  const [tabOrigen, setTabOrigen] = useState<TabOrigen>('enlace');
  const [arrastrandoAudio, setArrastrandoAudio] = useState(false);
  const [arrastrandoDoc, setArrastrandoDoc] = useState(false);

  // Estado para pestaña "Video por enlace"
  const [urlVideo, setUrlVideo] = useState('');
  const [explorandoVideo, setExplorandoVideo] = useState(false);
  const [metadatosVideo, setMetadatosVideo] = useState<MetadatosVideoInfo | null>(null);
  const [errorVideo, setErrorVideo] = useState<string | null>(null);
  const [avisoVideo, setAvisoVideo] = useState<string | null>(null);
  const [calidadSeleccionada, setCalidadSeleccionada] = useState('best');
  const [procesandoOperacion, setProcesandoOperacion] = useState<'descarga' | 'audio' | null>(null);
  const [progresoOperacion, setProgresoOperacion] = useState(0);
  const [mensajeOperacion, setMensajeOperacion] = useState('');
  const [urlDescargaDirecta, setUrlDescargaDirecta] = useState<string | null>(null);

  // Estado para pestaña "Documento o texto"
  const [submodoDoc, setSubmodoDoc] = useState<'subir' | 'pegar'>('subir');
  const [procesandoDoc, setProcesandoDoc] = useState(false);
  const [errorDoc, setErrorDoc] = useState<string | null>(null);
  const [avisoDoc, setAvisoDoc] = useState<string | null>(null);
  const [mostrarEditorTexto, setMostrarEditorTexto] = useState(false);

  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutExplorarRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (timeoutExplorarRef.current) clearTimeout(timeoutExplorarRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  const caracteres = valores.texto.trim().length;
  const palabras = valores.texto ? valores.texto.trim().split(/\s+/).filter(Boolean).length : 0;
  const transcripcionLista = caracteres >= 120 && !estadoAudio.activo && !estadoAudio.error;
  const selectorDeshabilitado = cargando || estadoAudio.activo || Boolean(procesandoOperacion) || procesandoDoc;

  const aceptarArchivo = (archivo: File | undefined) => {
    if (archivo) onArchivo(archivo);
  };

  // Normaliza y extrae una URL limpia, reparando duplicaciones accidentales o falta de protocolo http/https
  const normalizarUrl = (url: string): string => {
    let limpia = url.trim();
    if (!limpia) return '';
    limpia = limpia.replace(/^[<"']+|[>"']+$/g, '');

    // Reparar duplicación accidental de pegado en el portapapeles: https://...https://...
    const matchDoble = limpia.match(/(https?:\/\/[^\s"'<>]+?)https?:\/\//i);
    if (matchDoble && matchDoble[1]) {
      limpia = matchDoble[1];
    } else {
      const matchPrimera = limpia.match(/https?:\/\/[^\s"'<>]+/i);
      if (matchPrimera) {
        limpia = matchPrimera[0];
      }
    }

    if (!/^https?:\/\//i.test(limpia)) {
      if (/^(www\.)?(youtube\.com|youtu\.be|facebook\.com|fb\.watch|vimeo\.com|instagram\.com)/i.test(limpia)) {
        limpia = `https://${limpia}`;
      }
    }

    return limpia;
  };

  // --- Manejador: Explorar Video por Enlace con URL específica ---
  const explorarVideoConUrl = async (urlAExplorar: string) => {
    const urlLimpia = normalizarUrl(urlAExplorar);
    if (!urlLimpia) return;

    if (!urlLimpia.startsWith('http://') && !urlLimpia.startsWith('https://')) {
      setErrorVideo('Por favor ingresa un enlace web válido (ejemplo: YouTube, Vimeo o Facebook).');
      return;
    }

    setExplorandoVideo(true);
    setErrorVideo(null);
    setAvisoVideo(null);
    setUrlDescargaDirecta(null);

    // Cancelar cualquier probe anterior pendiente para evitar race conditions
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      const res = await fetch('/api/multimedia/probe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlLimpia }),
        signal: abortControllerRef.current.signal,
      });
      const data = await res.json().catch(() => null);
      if (data?.metadatos) {
        setMetadatosVideo(data.metadatos);
        if (!valores.titulo && data.metadatos?.titulo && data.metadatos.titulo !== 'Enlace multimedia listo para procesar') {
          onCambio({ titulo: data.metadatos.titulo });
        }
      } else {
        // Fallback resiliente: asegurar que siempre haya metadatos para que el usuario pueda accionar de inmediato
        setMetadatosVideo({
          titulo: 'Video / Prédica lista para análisis',
          duracionSegundos: 0,
          duracionFormateada: 'Detectada al procesar',
          formatosDisponibles: [
            { id: 'best', resolucion: 'Mejor calidad disponible', extension: 'mp4' },
            { id: '720p', resolucion: '720p (HD)', extension: 'mp4' },
            { id: 'audio_mp3', resolucion: 'Solo audio', extension: 'mp3', esSoloAudio: true },
          ],
        });
      }
      if (data?.aviso) {
        setAvisoVideo(data.aviso);
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      // Silenciosamente habilitamos metadatos de contingencia sin mostrar un error rojo al usuario
      setMetadatosVideo({
        titulo: 'Video / Prédica lista para análisis',
        duracionSegundos: 0,
        duracionFormateada: 'Detectada al procesar',
        formatosDisponibles: [
          { id: 'best', resolucion: 'Mejor calidad disponible', extension: 'mp4' },
          { id: '720p', resolucion: '720p (HD)', extension: 'mp4' },
          { id: 'audio_mp3', resolucion: 'Solo audio', extension: 'mp3', esSoloAudio: true },
        ],
      });
    } finally {
      setExplorandoVideo(false);
    }
  };

  const explorarVideo = () => {
    void explorarVideoConUrl(urlVideo);
  };

  const manejarPegadoUrl = (e: React.ClipboardEvent<HTMLInputElement>) => {
    // CRÍTICO: Prevenir la inserción por defecto del navegador que duplicaba la URL
    // al concatenar la acción nativa con el estado controlado de React.
    e.preventDefault();
    const textoPegado = e.clipboardData.getData('text');
    const urlLimpia = normalizarUrl(textoPegado);
    if (urlLimpia) {
      setUrlVideo(urlLimpia);
      setErrorVideo(null);
      setAvisoVideo(null);
      if (timeoutExplorarRef.current) clearTimeout(timeoutExplorarRef.current);
      timeoutExplorarRef.current = setTimeout(() => {
        void explorarVideoConUrl(urlLimpia);
      }, 100);
    }
  };

  // --- Manejador: Ejecutar Operación A (Descargar Video) u Operación B (Extraer Audio) ---
  const ejecutarOperacionVideo = async (operacion: 'descargar_video' | 'extraer_audio') => {
    const urlLimpia = normalizarUrl(urlVideo);
    if (!urlLimpia) return;
    setProcesandoOperacion(operacion === 'descargar_video' ? 'descarga' : 'audio');
    setProgresoOperacion(5);
    setMensajeOperacion(operacion === 'descargar_video' ? 'Iniciando descarga de video...' : 'Extrayendo audio del video...');
    setErrorVideo(null);
    setAvisoVideo(null);
    void adquirirPantallaActiva();

    try {
      const res = await fetch('/api/multimedia/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: urlLimpia,
          operacion,
          calidad: calidadSeleccionada,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok || !data.jobId) {
        throw new Error(data?.error || 'No se pudo iniciar la tarea multimedia.');
      }

      const jobId = data.jobId;

      // Sondeo del estado
      await new Promise<void>((resolvePromise, rejectPromise) => {
        pollIntervalRef.current = setInterval(async () => {
          try {
            const statusRes = await fetch(`/api/multimedia/status?jobId=${jobId}`);
            const statusData = await statusRes.json().catch(() => null);
            if (!statusRes.ok || !statusData?.ok) return;

            const t = statusData.trabajo;
            setProgresoOperacion(t.progreso);
            setMensajeOperacion(t.mensaje);

            if (t.estado === 'completado') {
              if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

              if (operacion === 'descargar_video') {
                const urlDescarga = `/api/multimedia/download?jobId=${jobId}`;
                setUrlDescargaDirecta(urlDescarga);
                const link = document.createElement('a');
                link.href = urlDescarga;
                link.download = t.nombreDescarga || 'video.mp4';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                setProcesandoOperacion(null);
                resolvePromise();
              } else {
                // Operación B: Extrajo audio -> transcribir
                if (t.audioUrlPublica) {
                  setMensajeOperacion('Transcribiendo el audio con IA...');
                  setProgresoOperacion(85);
                  const transcribeRes = await fetch('/api/transcribe', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ audioUrl: t.audioUrlPublica }),
                  });
                  const transcribeData = await transcribeRes.json().catch(() => null);
                  if (!transcribeRes.ok || !transcribeData?.text) {
                    throw new Error(transcribeData?.error || 'No se pudo transcribir el audio extraído.');
                  }
                  const textoTranscrito = transcribeData.text.trim();
                  onCambio({ texto: textoTranscrito });
                  guardarTranscripcionPendiente(textoTranscrito);
                  const tituloFinal = metadatosVideo?.titulo || valores.titulo;
                  if (tituloFinal && !valores.titulo) {
                    onCambio({ titulo: tituloFinal });
                  }
                  setMensajeOperacion('¡Transcripción completada con éxito!');
                  setProgresoOperacion(100);
                  setProcesandoOperacion(null);
                  resolvePromise();

                  // Activar automáticamente el análisis con la experiencia de progreso y espera
                  if (onAnalizarConTexto) {
                    onAnalizarConTexto(textoTranscrito, tituloFinal);
                  } else {
                    onAnalizar();
                  }
                } else {
                  throw new Error('No se generó la URL de audio para transcribir.');
                }
              }
            } else if (t.estado === 'error' || t.estado === 'cancelado') {
              if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
              rejectPromise(new Error(t.error || t.mensaje || 'Error en el procesamiento.'));
            }
          } catch (pollErr) {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            rejectPromise(pollErr);
          }
        }, 1500);
      });
    } catch (err: unknown) {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      setErrorVideo(err instanceof Error ? err.message : 'Error al procesar el video.');
      setProcesandoOperacion(null);
    } finally {
      void liberarPantallaActiva();
    }
  };

  // --- Manejador: Subir y Extraer Documento (DOCX / PDF / TXT) ---
  const procesarArchivoDocumento = async (file: File) => {
    setProcesandoDoc(true);
    setErrorDoc(null);
    setAvisoDoc(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/document/extract', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || 'No se pudo extraer el texto del documento.');
      }

      onCambio({ texto: data.texto });
      guardarTranscripcionPendiente(data.texto);

      if (data.tituloSugerido && !valores.titulo) {
        onCambio({ titulo: data.tituloSugerido });
      }

      if (data.advertencia) {
        setAvisoDoc(data.advertencia);
      }
    } catch (err: unknown) {
      setErrorDoc(err instanceof Error ? err.message : 'Error al procesar el documento.');
    } finally {
      setProcesandoDoc(false);
    }
  };

  return (
    <form
      id="formulario-analisis"
      className="scroll-mt-24 rounded-[20px] border border-[var(--linea)] bg-[#fffdf8] p-5 shadow-[0_20px_60px_rgba(76,43,36,0.08)] sm:p-8"
      onSubmit={(event) => {
        event.preventDefault();
        onAnalizar();
      }}
      aria-label="Formulario para generar un análisis bíblico"
    >
      {errores.length > 0 && (
        <div className="mb-6 rounded-[12px] border border-[#e8b4b8] bg-[#fff4f4] px-4 py-3" role="alert">
          <p className="text-[12px] font-semibold text-[#8f2830]">Revisa antes de continuar</p>
          <ul className="mt-1.5 list-disc space-y-1 pl-4 text-[12px] leading-relaxed text-[#7a3036]">
            {errores.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* SECCIÓN 1: IDENTIFICACIÓN DEL MENSAJE */}
      <Seccion numero="1" titulo="Identifica el mensaje" descripcion="Opcional. El nombre solo identifica la fuente.">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="mb-1.5 block text-[12px] font-semibold text-[var(--tinta)]">Título del mensaje</span>
            <input
              type="text"
              className="campo"
              value={valores.titulo}
              maxLength={180}
              onChange={(event) => onCambio({ titulo: event.target.value })}
              placeholder="Se sugiere a partir de la transcripción o documento"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[12px] font-semibold text-[var(--tinta)]">Predicador o expositor</span>
            <input
              type="text"
              className="campo"
              value={valores.predicador}
              maxLength={120}
              onChange={(event) => onCambio({ predicador: event.target.value })}
              placeholder="Ej. Pastor Juan Pérez"
              autoComplete="name"
            />
            <span className="mt-1.5 block text-[11px] leading-relaxed text-[var(--muted)]">Solo identifica la fuente. No se genera una biografía.</span>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[12px] font-semibold text-[var(--tinta)]">Fecha de la prédica</span>
            <input
              type="date"
              className="campo"
              value={valores.fecha}
              onChange={(event) => onCambio({ fecha: event.target.value })}
            />
            <span className="mt-1.5 block text-[11px] leading-relaxed text-[var(--muted)]">Opcional.</span>
          </label>
        </div>
      </Seccion>

      {/* SECCIÓN 2: MODALIDAD DE ANÁLISIS */}
      <Seccion numero="2" titulo="Elige la modalidad" descripcion="El análisis general siempre se incluye.">
        <fieldset>
          <legend className="sr-only">Modalidad del análisis</legend>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {MODALIDADES.map((modalidad) => {
              const activa = valores.modalidad === modalidad.id;
              return (
                <label
                  key={modalidad.id}
                  className={`group relative flex cursor-pointer flex-col rounded-[14px] border p-4 transition focus-within:ring-2 focus-within:ring-[var(--coral)] focus-within:ring-offset-2 focus-within:ring-offset-[#fffdf8] ${
                    activa
                      ? 'border-[var(--coral)] bg-[#fff4ef] shadow-[0_6px_20px_rgba(240,78,89,0.12)]'
                      : 'border-[var(--linea)] bg-white hover:border-[#d8b4a8] hover:bg-[#fffaf1]'
                  }`}
                >
                  <input
                    type="radio"
                    name="modalidad"
                    value={modalidad.id}
                    checked={activa}
                    onChange={() => onCambio({ modalidad: modalidad.id })}
                    className="sr-only"
                    disabled={cargando}
                  />
                  <span className="mb-3 flex items-start justify-between gap-2">
                    <span
                      className={`flex h-9 w-9 items-center justify-center rounded-full ${
                        activa ? 'bg-[var(--coralOscuro)] text-white' : 'bg-[#f7eee2] text-[var(--coralOscuro)]'
                      }`}
                    >
                      <IconoModalidad tipo={modalidad.icono} />
                    </span>
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                        activa ? 'border-[var(--coral)] bg-[var(--coralOscuro)] text-white' : 'border-[#d8c4b8] text-transparent'
                      }`}
                    >
                      <IconoCheck className="h-3.5 w-3.5" />
                    </span>
                  </span>
                  <span className="text-[12.5px] font-semibold leading-snug text-[var(--tinta)]">{modalidad.nombre}</span>
                  <span className="mt-1.5 text-[11px] leading-relaxed text-[var(--muted)]">{modalidad.descripcion}</span>
                </label>
              );
            })}
          </div>
        </fieldset>

        {valores.modalidad === 'ninos' && (
          <fieldset className="mt-4 rounded-[14px] border border-[#efd3c8] bg-[#fff8ef] p-4">
            <legend className="px-1 text-[12px] font-semibold text-[var(--tinta)]">Rango de edad de los niños</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {RANGOS_EDAD.map((rango) => {
                const activo = valores.rangoEdad === rango.id;
                return (
                  <label
                    key={rango.id}
                    className={`cursor-pointer rounded-full border px-4 py-2 text-[12px] font-medium transition focus-within:ring-2 focus-within:ring-[var(--coral)] focus-within:ring-offset-2 focus-within:ring-offset-[#fffdf8] ${
                      activo
                        ? 'border-[var(--coral)] bg-[var(--coralOscuro)] text-white'
                        : 'border-[#dfc7bb] bg-white text-[var(--texto)] hover:border-[var(--coral)]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="rangoEdad"
                      value={rango.id}
                      checked={activo}
                      onChange={() => onCambio({ rangoEdad: rango.id })}
                      className="sr-only"
                    />
                    {rango.etiqueta}
                  </label>
                );
              })}
            </div>
          </fieldset>
        )}
      </Seccion>

      {/* SECCIÓN 3: VENTANA UNIFICADA (SUBE EL AUDIO, VIDEO O DOCUMENTO) */}
      <Seccion
        numero="3"
        titulo="Sube el audio o material del mensaje"
        descripcion="Introduce tu prédica: enlace de video, archivo multimedia o documento Word/PDF/texto."
      >
        {/* Selector de pestañas de origen */}
        <div className="mb-5 grid grid-cols-1 sm:grid-cols-3 gap-1.5 rounded-[12px] border border-[#e5d5c8] bg-[#f7eee3] p-1 w-full max-w-full">
          <button
            type="button"
            onClick={() => setTabOrigen('enlace')}
            className={`flex items-center justify-center gap-2 rounded-[9px] py-2.5 text-[12px] font-semibold transition ${
              tabOrigen === 'enlace'
                ? 'bg-white text-[var(--coralOscuro)] shadow-sm'
                : 'text-[var(--muted)] hover:text-[var(--tinta)]'
            }`}
          >
            <IconoVideo className="h-4 w-4 shrink-0" />
            <span className="truncate">Video por enlace</span>
          </button>
          <button
            type="button"
            onClick={() => setTabOrigen('archivo')}
            className={`flex items-center justify-center gap-2 rounded-[9px] py-2.5 text-[12px] font-semibold transition ${
              tabOrigen === 'archivo'
                ? 'bg-white text-[var(--coralOscuro)] shadow-sm'
                : 'text-[var(--muted)] hover:text-[var(--tinta)]'
            }`}
          >
            <IconoAudio className="h-4 w-4 shrink-0" />
            <span className="truncate">Archivo multimedia</span>
          </button>
          <button
            type="button"
            onClick={() => setTabOrigen('documento')}
            className={`flex items-center justify-center gap-2 rounded-[9px] py-2.5 text-[12px] font-semibold transition ${
              tabOrigen === 'documento'
                ? 'bg-white text-[var(--coralOscuro)] shadow-sm'
                : 'text-[var(--muted)] hover:text-[var(--tinta)]'
            }`}
          >
            <IconoDocumento className="h-4 w-4 shrink-0" />
            <span className="truncate">Documento o texto</span>
          </button>
        </div>

        {/* --- PESTAÑA A: VIDEO MEDIANTE ENLACE --- */}
        {tabOrigen === 'enlace' && (
          <div className="rounded-[16px] border border-[#dfc7bb] bg-[#fbf5ed] p-4 sm:p-5 w-full max-w-full overflow-hidden">
            <label className="block w-full max-w-full">
              <span className="mb-2 block text-[12.5px] font-semibold text-[var(--tinta)]">
                Pega el enlace del video (YouTube, Vimeo, Facebook, enlace directo MP4/HLS)
              </span>
              <div className="flex flex-col gap-2 sm:flex-row w-full max-w-full">
                <input
                  type="url"
                  className="campo flex-1 min-w-0 w-full"
                  value={urlVideo}
                  onChange={(e) => {
                    const rawVal = e.target.value;
                    setUrlVideo(rawVal);
                    setErrorVideo(null);
                    setAvisoVideo(null);
                    const urlLimpia = normalizarUrl(rawVal);
                    if (urlLimpia.startsWith('http://') || urlLimpia.startsWith('https://')) {
                      if (timeoutExplorarRef.current) clearTimeout(timeoutExplorarRef.current);
                      timeoutExplorarRef.current = setTimeout(() => {
                        void explorarVideoConUrl(urlLimpia);
                      }, 700);
                    }
                  }}
                  onPaste={manejarPegadoUrl}
                  placeholder="https://www.youtube.com/watch?v=... o https://vimeo.com/..."
                  disabled={Boolean(procesandoOperacion)}
                />
                <button
                  type="button"
                  onClick={explorarVideo}
                  disabled={!urlVideo.trim() || explorandoVideo || Boolean(procesandoOperacion)}
                  className="btn-secundario shrink-0 justify-center w-full sm:w-auto"
                >
                  {explorandoVideo ? 'Explorando…' : 'Comprobar video'}
                </button>
              </div>
            </label>

            {errorVideo && (
              <div className="mt-3 rounded-[10px] bg-[#fff2f2] p-3 text-[11.5px] font-medium text-[#8f2830] break-words" role="alert">
                <p>{errorVideo}</p>
              </div>
            )}

            {avisoVideo && (
              <div className="mt-3 rounded-[10px] bg-[#fff8e7] p-3 text-[11.5px] font-medium text-[#8a5b14]" role="status">
                {avisoVideo}
              </div>
            )}

            {/* Tarjeta de previsualización y acciones del video (disponible si hay metadatos o si se pegó una URL) */}
            {(metadatosVideo || urlVideo.trim().length > 10) && (
              <div className="mt-4 rounded-[14px] border border-[#e3d1c4] bg-white p-4 shadow-sm w-full max-w-full overflow-hidden">
                {metadatosVideo ? (
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center w-full max-w-full">
                    {metadatosVideo.miniatura && (
                      <img
                        src={metadatosVideo.miniatura}
                        alt={metadatosVideo.titulo}
                        className="h-20 w-32 shrink-0 rounded-[8px] object-cover border border-[#ebd8cb]"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-[13.5px] font-bold text-[var(--tinta)] leading-snug break-words">{metadatosVideo.titulo}</p>
                      <p className="mt-1 text-[11.5px] text-[var(--muted)] break-words">
                        {metadatosVideo.autor && <span>{metadatosVideo.autor} · </span>}
                        <span>Duración: {metadatosVideo.duracionFormateada}</span>
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 text-[12px] text-[var(--muted)]">
                    <IconoVideo className="h-5 w-5 text-[var(--coralOscuro)] shrink-0" />
                    <span className="break-words">
                      Enlace preparado: <strong className="text-[var(--tinta)]">{urlVideo.trim()}</strong>
                    </span>
                  </div>
                )}

                {/* Acciones del video: Operación A (Descargar) vs Operación B (Extraer Audio) */}
                <div className="mt-4 flex flex-col gap-3 border-t border-[#f2e6dc] pt-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between w-full max-w-full">
                  <div className="flex flex-wrap items-center gap-2 min-w-0">
                    <label htmlFor="calidad-select" className="text-[11.5px] font-semibold text-[var(--muted)] shrink-0">
                      Calidad de descarga:
                    </label>
                    <select
                      id="calidad-select"
                      className="rounded-[8px] border border-[#d8c4b8] bg-[#fbf5ed] px-2.5 py-1.5 text-[11.5px] font-medium text-[var(--tinta)] max-w-full"
                      value={calidadSeleccionada}
                      onChange={(e) => setCalidadSeleccionada(e.target.value)}
                      disabled={Boolean(procesandoOperacion)}
                    >
                      {(metadatosVideo?.formatosDisponibles || [
                        { id: 'best', resolucion: 'Mejor calidad disponible', extension: 'mp4' },
                        { id: '720p', resolucion: '720p (HD)', extension: 'mp4' },
                        { id: 'audio_mp3', resolucion: 'Solo audio', extension: 'mp3' },
                      ]).map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.resolucion} ({f.extension.toUpperCase()})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => void ejecutarOperacionVideo('descargar_video')}
                      disabled={Boolean(procesandoOperacion) || explorandoVideo}
                      className="btn-secundario text-[12px] py-2 px-3 gap-1.5 flex-1 sm:flex-initial justify-center"
                    >
                      <IconoDescarga className="h-3.5 w-3.5 shrink-0" />
                      <span>Descargar video</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => void ejecutarOperacionVideo('extraer_audio')}
                      disabled={Boolean(procesandoOperacion)}
                      className="btn-primario text-[12px] py-2 px-3 gap-1.5 flex-1 sm:flex-initial justify-center"
                    >
                      <span>⚡ Extraer audio y analizar</span>
                    </button>
                  </div>
                </div>

                {/* Barra de progreso de la operación multimedia */}
                {procesandoOperacion && (
                  <div className="mt-4 border-t border-[#f2e6dc] pt-3">
                    <div className="flex items-center justify-between text-[11.5px] font-medium text-[var(--coralOscuro)] mb-1.5">
                      <span>{mensajeOperacion}</span>
                      <span>{progresoOperacion}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[#f0e3d5]">
                      <div
                        className="h-full rounded-full bg-[var(--coral)] transition-all duration-500"
                        style={{ width: `${Math.max(5, progresoOperacion)}%` }}
                      />
                    </div>
                  </div>
                )}

                {urlDescargaDirecta && (
                  <div className="mt-3 flex items-center justify-between rounded-[10px] bg-[#e8f5e9] p-3 text-[12px] font-semibold text-[#276738]">
                    <span>✓ Video listo para descargar en tu equipo</span>
                    <a href={urlDescargaDirecta} download className="underline font-bold hover:text-[#1b4b27]">
                      Descargar archivo
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* --- PESTAÑA B: ARCHIVO MULTIMEDIA (AUDIO / VIDEO LOCAL) --- */}
        {tabOrigen === 'archivo' && (
          <div
            className={`rounded-[14px] border border-dashed p-5 transition ${
              arrastrandoAudio ? 'border-[var(--coral)] bg-[#fff3ed]' : 'border-[#d9bfb3] bg-[#fbf4e9]'
            }`}
            onDragOver={(event) => {
              event.preventDefault();
              setArrastrandoAudio(true);
            }}
            onDragLeave={() => setArrastrandoAudio(false)}
            onDrop={(event) => {
              event.preventDefault();
              setArrastrandoAudio(false);
              aceptarArchivo(event.dataTransfer.files?.[0]);
            }}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[var(--coralOscuro)] shadow-sm">
                  <IconoAudio />
                </span>
                <div>
                  <p className="text-[13px] font-semibold text-[var(--tinta)]">
                    {estadoAudio.activo ? estadoAudio.mensaje || 'Procesando audio…' : 'Audio del mensaje'}
                  </p>
                  <p id="audio-help" className="mt-0.5 text-[11.5px] leading-relaxed text-[var(--muted)]">
                    MP3, M4A, WAV, OGG, OPUS, FLAC, MP4 o MOV. Hasta 500 MB.
                  </p>
                  {estadoAudio.nombre && !estadoAudio.error && (
                    <p className="mt-1 text-[11px] font-medium text-[var(--coralOscuro)]">{estadoAudio.nombre}</p>
                  )}
                  {transcripcionLista && (
                    <div
                      className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[#e8f5e9] px-3 py-1 text-[11.5px] font-semibold text-[#276738]"
                      role="status"
                    >
                      <IconoCheck className="h-3.5 w-3.5 shrink-0" />
                      <span>Transcripción lista · {caracteres.toLocaleString('es-CO')} caracteres</span>
                    </div>
                  )}
                  {!estadoAudio.activo && !estadoAudio.error && !valores.texto && (
                    <p className="mt-1 text-[11.5px] text-[var(--muted)]">Aún no has subido un audio.</p>
                  )}
                  {estadoAudio.error && (
                    <p className="mt-1 text-[11.5px] text-[#9d2c34]" role="alert">
                      {estadoAudio.error}
                    </p>
                  )}
                </div>
              </div>
              <label
                htmlFor="audio-file-input"
                className={`btn-secundario relative min-h-[48px] shrink-0 touch-manipulation justify-center focus-within:ring-2 focus-within:ring-[var(--coral)] focus-within:ring-offset-2 focus-within:ring-offset-[#fffdf8] ${
                  selectorDeshabilitado ? 'pointer-events-none cursor-not-allowed opacity-50' : 'cursor-pointer'
                }`}
                aria-disabled={selectorDeshabilitado}
              >
                <input
                  id="audio-file-input"
                  type="file"
                  accept="audio/*,video/mp4,video/quicktime,video/webm,.mp3,.m4a,.wav,.aac,.ogg,.oga,.opus,.flac,.mp4,.mov"
                  className="sr-only"
                  onChange={(event) => {
                    aceptarArchivo(event.target.files?.[0]);
                    event.target.value = '';
                  }}
                  disabled={selectorDeshabilitado}
                  aria-label="Seleccionar archivo de audio del mensaje"
                  aria-describedby="audio-help"
                />
                <span>{estadoAudio.activo ? 'Procesando…' : estadoAudio.nombre ? 'Cambiar audio' : 'Elegir audio'}</span>
              </label>
            </div>
            {estadoAudio.activo && (
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white">
                <div
                  className="h-full rounded-full bg-[var(--coral)] transition-all duration-500"
                  style={{ width: `${Math.max(4, estadoAudio.progreso)}%` }}
                />
              </div>
            )}
          </div>
        )}

        {/* --- PESTAÑA C: DOCUMENTO O TEXTO DIRECTO --- */}
        {tabOrigen === 'documento' && (
          <div className="rounded-[16px] border border-[#dfc7bb] bg-[#fbf5ed] p-5">
            {/* Sub-selector: Cargar Documento vs Pegar Texto */}
            <div className="mb-4 flex gap-2 border-b border-[#e9ded3] pb-3">
              <button
                type="button"
                onClick={() => setSubmodoDoc('subir')}
                className={`rounded-full px-3.5 py-1.5 text-[11.5px] font-semibold transition ${
                  submodoDoc === 'subir'
                    ? 'bg-[var(--coralOscuro)] text-white shadow-sm'
                    : 'bg-white text-[var(--muted)] hover:text-[var(--tinta)]'
                }`}
              >
                Cargar archivo (Word, PDF o TXT)
              </button>
              <button
                type="button"
                onClick={() => setSubmodoDoc('pegar')}
                className={`rounded-full px-3.5 py-1.5 text-[11.5px] font-semibold transition ${
                  submodoDoc === 'pegar'
                    ? 'bg-[var(--coralOscuro)] text-white shadow-sm'
                    : 'bg-white text-[var(--muted)] hover:text-[var(--tinta)]'
                }`}
              >
                Pegar texto directamente
              </button>
            </div>

            {submodoDoc === 'subir' ? (
              <div>
                <div
                  className={`rounded-[14px] border border-dashed p-6 text-center transition ${
                    arrastrandoDoc ? 'border-[var(--coral)] bg-[#fff3ed]' : 'border-[#d9bfb3] bg-white'
                  }`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setArrastrandoDoc(true);
                  }}
                  onDragLeave={() => setArrastrandoDoc(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setArrastrandoDoc(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) procesarArchivoDocumento(file);
                  }}
                >
                  <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#fbf4e9] text-[var(--coralOscuro)]">
                    <IconoDocumento className="h-6 w-6" />
                  </span>
                  <p className="mt-3 text-[13px] font-semibold text-[var(--tinta)]">
                    {procesandoDoc ? 'Extrayendo contenido del documento...' : 'Arrastra tu documento aquí o selecciónalo'}
                  </p>
                  <p className="mt-1 text-[11.5px] text-[var(--muted)]">
                    Soporta Word (.docx), PDF con texto seleccionable, OpenDocument (.odt), RTF y TXT.
                  </p>

                  <label className="btn-secundario mt-4 inline-flex cursor-pointer text-[12px]">
                    <input
                      type="file"
                      accept=".docx,.pdf,.odt,.rtf,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                      className="sr-only"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) procesarArchivoDocumento(file);
                        e.target.value = '';
                      }}
                      disabled={procesandoDoc}
                    />
                    <span>{procesandoDoc ? 'Procesando…' : 'Seleccionar documento'}</span>
                  </label>
                </div>

                {errorDoc && (
                  <div className="mt-3 rounded-[10px] bg-[#fff2f2] p-3 text-[11.5px] font-medium text-[#8f2830]" role="alert">
                    {errorDoc}
                  </div>
                )}
                {avisoDoc && (
                  <div className="mt-3 rounded-[10px] bg-[#fff8e7] p-3 text-[11.5px] font-medium text-[#8a5b14]" role="status">
                    {avisoDoc}
                  </div>
                )}
              </div>
            ) : (
              <EditorTextoPegar
                texto={valores.texto}
                onTexto={(nuevo) => {
                  onCambio({ texto: nuevo });
                  guardarTranscripcionPendiente(nuevo);
                }}
                onDetectarEnlaceVideo={(url) => {
                  setTabOrigen('enlace');
                  const urlLimpia = normalizarUrl(url);
                  setUrlVideo(urlLimpia);
                  void explorarVideoConUrl(urlLimpia);
                }}
                disabled={cargando}
              />
            )}
          </div>
        )}

        {/* --- TARJETA DE CONFIRMACIÓN DE CONTENIDO LISTO --- */}
        {valores.texto.trim().length >= 120 && (
          <div className="mt-5 flex flex-col gap-3 rounded-[14px] border border-[#cbe4cf] bg-[#eef8f0] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#276738] text-white">
                <IconoCheck className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[13px] font-bold text-[#1f572f]">
                  Contenido preparado para análisis ministerial
                </p>
                <p className="text-[11.5px] text-[#2c723f]">
                  {palabras.toLocaleString('es-CO')} palabras · {caracteres.toLocaleString('es-CO')} caracteres listos para procesar.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setMostrarEditorTexto(!mostrarEditorTexto)}
              className="btn-secundario text-[11.5px] py-1.5 px-3 self-start sm:self-auto"
            >
              {mostrarEditorTexto ? 'Ocultar texto' : 'Ver / Editar texto'}
            </button>
          </div>
        )}

        {mostrarEditorTexto && valores.texto.trim() && (
          <div className="mt-3 rounded-[14px] border border-[#d8c4b8] bg-white p-4">
            <EditorTextoPegar
              texto={valores.texto}
              onTexto={(nuevo) => {
                onCambio({ texto: nuevo });
                guardarTranscripcionPendiente(nuevo);
              }}
              disabled={cargando}
            />
          </div>
        )}
      </Seccion>

      {/* BOTÓN FINAL DE GENERACIÓN */}
      <div className="flex flex-col gap-3 border-t border-[var(--linea)] pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-md text-[12px] leading-relaxed text-[var(--muted)]">
          {valores.texto.trim() ? (
            <span className="font-medium text-[#276738]">
              ✓ Contenido cargado. Listo para generar el estudio bíblico y los documentos PDF/Word.
            </span>
          ) : (
            'Ingresa un video, audio o documento para continuar.'
          )}
        </p>
        <button
          type="submit"
          className={`btn-primario w-full sm:w-auto transition-all ${
            valores.texto.trim() && !cargando ? 'shadow-[0_8px_24px_rgba(240,78,89,0.3)] ring-2 ring-[var(--coral)] ring-offset-2' : ''
          }`}
          disabled={cargando || !valores.texto.trim()}
        >
          {cargando ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />
              Generando análisis…
            </>
          ) : (
            <>
              Generar análisis y PDF
              <IconoFlecha />
            </>
          )}
        </button>
      </div>
    </form>
  );
}
