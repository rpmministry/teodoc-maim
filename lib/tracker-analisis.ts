import { useEffect, useRef, useState, useCallback } from 'react';
import type { ModalidadId, ResultadoAnalisis } from './tipos.ts';
import type { EtapaAnalisisId, EstadoTrabajoAnalisis } from './analisis-progreso-tipos.ts';
import { ETAPAS_ANALISIS, obtenerMensajeEtapa } from './analisis-progreso-tipos.ts';
import { normalizarMetadatos, normalizarRespuesta } from './normalizar.ts';

const CLAVE_STORAGE_TRABAJO = 'teodoc_trabajo_activo';

export interface RegistroTrabajoLocal {
  id: string;
  modalidad: ModalidadId;
  titulo: string;
  inicio: number;
}

export interface SnapshotTrabajo {
  id: string;
  huella?: string;
  modalidad: ModalidadId;
  titulo: string;
  estado: EstadoTrabajoAnalisis;
  etapaActual: EtapaAnalisisId;
  etapasCompletadas: EtapaAnalisisId[];
  progreso: number;
  esEstimado: boolean;
  mensaje: string;
  tiempoTranscurridoSegundos: number;
  tiempoEstimadoRestanteSegundos: number;
  resultado?: ResultadoAnalisis;
  error?: string;
}

export function guardarTrabajoActivoLocal(registro: RegistroTrabajoLocal): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CLAVE_STORAGE_TRABAJO, JSON.stringify(registro));
  } catch {}
}

export function obtenerTrabajoActivoLocal(): RegistroTrabajoLocal | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CLAVE_STORAGE_TRABAJO);
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (p && typeof p.id === 'string') return p;
  } catch {}
  return null;
}

export function limpiarTrabajoActivoLocal(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(CLAVE_STORAGE_TRABAJO);
  } catch {}
}

export function formatearTiempoSegundos(segundos: number): string {
  const s = Math.max(0, Math.floor(segundos));
  const minutos = Math.floor(s / 60);
  const resto = s % 60;
  if (minutos === 0) return `${resto} s`;
  return `${minutos} min ${resto > 0 ? `${resto} s` : ''}`.trim();
}

export async function solicitarPermisoNotificaciones(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  try {
    const permiso = await Notification.requestPermission();
    return permiso === 'granted';
  } catch {
    return false;
  }
}

export function enviarNotificacionNavegador(titulo: string, opciones?: NotificationOptions): void {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  try {
    if (Notification.permission === 'granted') {
      new Notification(titulo, {
        icon: '/apple-icon.png',
        badge: '/icon.png',
        ...opciones,
      });
    }
  } catch {}
}

/**
 * Conector de reconexión SSE y fallback a sondeo HTTP periódico para trabajos prolongados.
 */
export function iniciarPollingFallback(jobId: string, onUpdate?: (data: any) => void): () => void {
  const interval = setInterval(async () => {
    try {
      const res = await fetch(`/api/analyze/job?id=${jobId}`);
      if (res.ok) {
        const data = await res.json();
        onUpdate?.(data);
      }
    } catch {}
  }, 3000);
  return () => clearInterval(interval);
}

export function conectarEventSourceJob(jobId: string, onUpdate?: (data: any) => void): EventSource | null {
  if (typeof window === 'undefined' || !('EventSource' in window)) return null;
  try {
    const es = new EventSource(`/api/analyze/job/stream?id=${jobId}`);
    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onUpdate?.(data);
      } catch {}
    };
    return es;
  } catch {
    return null;
  }
}

export interface UseTrackerAnalisisProps {
  onCompletado?: (resultado: ResultadoAnalisis) => void;
  onError?: (mensaje: string) => void;
}

export function useTrackerAnalisis({ onCompletado, onError }: UseTrackerAnalisisProps = {}) {
  const [trabajo, setTrabajo] = useState<SnapshotTrabajo | null>(null);
  const [minimizado, setMinimizado] = useState(false);
  const [reconectando, setReconectando] = useState(false);
  const [notificacionMostrada, setNotificacionMostrada] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const tickerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onCompletadoRef = useRef(onCompletado);
  const onErrorRef = useRef(onError);

  onCompletadoRef.current = onCompletado;
  onErrorRef.current = onError;

  const cerrarConexiones = useCallback(() => {
    if (tickerRef.current) {
      clearInterval(tickerRef.current);
      tickerRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  const aplicarActualizacion = useCallback((data: SnapshotTrabajo) => {
    setTrabajo(data);
    setReconectando(false);

    if (data.estado === 'completado') {
      if (tickerRef.current) {
        clearInterval(tickerRef.current);
        tickerRef.current = null;
      }
      limpiarTrabajoActivoLocal();
      if (data.resultado) {
        onCompletadoRef.current?.(data.resultado);
      }
      enviarNotificacionNavegador('¡Tu documento TeoDoc MAIM está listo!', {
        body: data.mensaje || 'Hemos terminado de generar el análisis y los documentos.',
      });
      try {
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          navigator.vibrate([120, 60, 120]);
        }
      } catch {}
    } else if (data.estado === 'error' || data.estado === 'cancelado') {
      if (tickerRef.current) {
        clearInterval(tickerRef.current);
        tickerRef.current = null;
      }
      limpiarTrabajoActivoLocal();
      if (data.error) {
        onErrorRef.current?.(data.error);
      }
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cerrarConexiones();
    };
  }, [cerrarConexiones]);

  const iniciarTrabajo = useCallback(
    async (opciones: {
      text: string;
      modalidad: ModalidadId;
      rangoEdad?: string;
      titulo?: string;
      predicador?: string;
      fecha?: string;
      tieneAudio?: boolean;
    }) => {
      cerrarConexiones();
      setNotificacionMostrada(false);

      const controller = new AbortController();
      abortControllerRef.current = controller;

      const jobId = `job_${Date.now()}`;
      const inicio = Date.now();
      const modalidad = opciones.modalidad || 'general';
      const duracionEstimada = modalidad === 'general' ? 24 : 45;

      const snapshotInicial: SnapshotTrabajo = {
        id: jobId,
        modalidad,
        titulo: opciones.titulo || 'Estudio de la Palabra',
        estado: 'procesando',
        etapaActual: 'validacion_preparacion',
        etapasCompletadas: [],
        progreso: 8,
        esEstimado: true,
        mensaje: obtenerMensajeEtapa(modalidad, 'validacion_preparacion'),
        tiempoTranscurridoSegundos: 0,
        tiempoEstimadoRestanteSegundos: duracionEstimada,
      };

      setTrabajo(snapshotInicial);
      guardarTrabajoActivoLocal({
        id: jobId,
        modalidad,
        titulo: opciones.titulo || 'Estudio de la Palabra',
        inicio,
      });

      // Ticker local con calibración exacta de etapas y avance progresivo sin bloqueos
      tickerRef.current = setInterval(() => {
        const segundos = Math.max(1, Math.floor((Date.now() - inicio) / 1000));
        let etapaActual: EtapaAnalisisId = 'validacion_preparacion';
        let etapasCompletadas: EtapaAnalisisId[] = [];
        let progreso = 8;

        if (segundos < 3) {
          etapaActual = 'validacion_preparacion';
          etapasCompletadas = [];
          progreso = Math.min(18, Math.round(8 + segundos * 3.3));
        } else if (segundos < 7) {
          etapaActual = 'contexto_biblico';
          etapasCompletadas = ['validacion_preparacion'];
          progreso = Math.min(30, Math.round(18 + (segundos - 3) * 3));
        } else if (modalidad === 'general' || segundos < 22) {
          etapaActual = 'analisis_general';
          etapasCompletadas = ['validacion_preparacion', 'contexto_biblico'];
          const base = 30;
          const target = modalidad === 'general' ? 92 : 62;
          const dur = modalidad === 'general' ? 18 : 15;
          const fracc = Math.min(1, (segundos - 7) / dur);
          progreso = Math.round(base + fracc * (target - base));
        } else {
          etapaActual = 'redaccion_especialidad';
          etapasCompletadas = ['validacion_preparacion', 'contexto_biblico', 'analisis_general'];
          const base = 62;
          const target = 92;
          const dur = 20;
          const fracc = Math.min(1, (segundos - 22) / dur);
          progreso = Math.round(base + fracc * (target - base));
        }

        // Progresión suave si el análisis requiere unos segundos extra
        if (progreso >= 92) {
          const extraSeg = Math.max(0, segundos - (modalidad === 'general' ? 25 : 42));
          progreso = Math.min(97, 92 + Math.floor(extraSeg * 0.15));
        }

        const tiempoRestante = Math.max(3, duracionEstimada - segundos);

        setTrabajo((prev) => {
          if (!prev || prev.estado === 'completado' || prev.estado === 'error') return prev;
          return {
            ...prev,
            etapaActual,
            etapasCompletadas,
            progreso,
            mensaje: obtenerMensajeEtapa(modalidad, etapaActual),
            tiempoTranscurridoSegundos: segundos,
            tiempoEstimadoRestanteSegundos: tiempoRestante,
          };
        });
      }, 1000);

      // Iniciar llamada directa a /api/analyze con conexión activa en el servidor
      (async () => {
        try {
          const res = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(opciones),
            signal: controller.signal,
          });

          const data = await res.json().catch(() => null);

          if (!res.ok) {
            const motivo =
              res.status === 503 || data?.error === 'busy'
                ? 'El servicio de análisis teológico está ocupado en este momento. Por favor intenta de nuevo en unos instantes.'
                : data?.error || 'No se pudo generar el análisis ministerial.';
            throw new Error(motivo);
          }

          if (!data || typeof data !== 'object') {
            throw new Error('El servidor devolvió una respuesta vacía o incompleta.');
          }

          if (tickerRef.current) {
            clearInterval(tickerRef.current);
            tickerRef.current = null;
          }

          const metadatos = normalizarMetadatos({
            modalidad,
            rangoEdad: opciones.rangoEdad as any,
            titulo: opciones.titulo,
            predicador: opciones.predicador,
            fecha: opciones.fecha,
            fechaAnalisis: new Date().toISOString(),
          });

          const normalizado = normalizarRespuesta(data, metadatos);
          if (opciones.titulo) {
            normalizado.titulo = opciones.titulo;
            normalizado.metadatos.tituloProporcionado = opciones.titulo;
          }

          const snapshotFinal: SnapshotTrabajo = {
            id: jobId,
            modalidad,
            titulo: normalizado.titulo || opciones.titulo || 'Estudio de la Palabra',
            estado: 'completado',
            etapaActual: 'verificacion_entrega',
            etapasCompletadas: ETAPAS_ANALISIS.map((e) => e.id),
            progreso: 100,
            esEstimado: false,
            mensaje: obtenerMensajeEtapa(modalidad, 'completado'),
            tiempoTranscurridoSegundos: Math.floor((Date.now() - inicio) / 1000),
            tiempoEstimadoRestanteSegundos: 0,
            resultado: normalizado,
          };

          aplicarActualizacion(snapshotFinal);
        } catch (err: unknown) {
          if (controller.signal.aborted) return;
          if (tickerRef.current) {
            clearInterval(tickerRef.current);
            tickerRef.current = null;
          }

          const msg = err instanceof Error ? err.message : 'Error inesperado al generar el análisis.';
          const snapshotError: SnapshotTrabajo = {
            id: jobId,
            modalidad,
            titulo: opciones.titulo || 'Estudio de la Palabra',
            estado: 'error',
            etapaActual: 'validacion_preparacion',
            etapasCompletadas: [],
            progreso: 0,
            esEstimado: false,
            mensaje: msg,
            tiempoTranscurridoSegundos: Math.floor((Date.now() - inicio) / 1000),
            tiempoEstimadoRestanteSegundos: 0,
            error: msg,
          };

          aplicarActualizacion(snapshotError);
        }
      })();

      return snapshotInicial;
    },
    [aplicarActualizacion, cerrarConexiones],
  );

  const cancelarTrabajo = useCallback(async () => {
    cerrarConexiones();
    limpiarTrabajoActivoLocal();
    setTrabajo(null);
  }, [cerrarConexiones]);

  const descartarTrabajo = useCallback(() => {
    cerrarConexiones();
    limpiarTrabajoActivoLocal();
    setTrabajo(null);
  }, [cerrarConexiones]);

  return {
    trabajo,
    estaCargando: Boolean(trabajo && ['iniciado', 'procesando'].includes(trabajo.estado)),
    estaCompletado: Boolean(trabajo?.estado === 'completado'),
    tieneError: Boolean(trabajo?.estado === 'error'),
    reconectando,
    minimizado,
    setMinimizado,
    notificacionMostrada,
    setNotificacionMostrada,
    iniciarTrabajo,
    cancelarTrabajo,
    descartarTrabajo,
  };
}
