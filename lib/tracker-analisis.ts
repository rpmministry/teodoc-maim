import { useEffect, useRef, useState, useCallback } from 'react';
import type { ModalidadId, ResultadoAnalisis } from './tipos.ts';
import type { EtapaAnalisisId, EstadoTrabajoAnalisis } from './analisis-progreso-tipos.ts';

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

export interface UseTrackerAnalisisProps {
  onCompletado?: (resultado: ResultadoAnalisis) => void;
  onError?: (mensaje: string) => void;
}

export function useTrackerAnalisis({ onCompletado, onError }: UseTrackerAnalisisProps = {}) {
  const [trabajo, setTrabajo] = useState<SnapshotTrabajo | null>(null);
  const [minimizado, setMinimizado] = useState(false);
  const [reconectando, setReconectando] = useState(false);
  const [notificacionMostrada, setNotificacionMostrada] = useState(false);

  const eventSourceRef = useRef<EventSource | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onCompletadoRef = useRef(onCompletado);
  const onErrorRef = useRef(onError);

  onCompletadoRef.current = onCompletado;
  onErrorRef.current = onError;

  const cerrarConexiones = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const aplicarActualizacion = useCallback((data: SnapshotTrabajo) => {
    setTrabajo(data);
    setReconectando(false);

    if (data.estado === 'completado') {
      cerrarConexiones();
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
      cerrarConexiones();
      limpiarTrabajoActivoLocal();
      if (data.error) {
        onErrorRef.current?.(data.error);
      }
    }
  }, [cerrarConexiones]);

  const iniciarPollingFallback = useCallback((jobId: string) => {
    if (pollingRef.current) clearInterval(pollingRef.current);

    const consultar = async () => {
      try {
        const res = await fetch(`/api/analyze/job?id=${encodeURIComponent(jobId)}`);
        if (!res.ok) {
          if (res.status === 404) {
            // El trabajo no existe o expiró
            cerrarConexiones();
            limpiarTrabajoActivoLocal();
            setTrabajo(null);
          }
          return;
        }
        const json = await res.json();
        if (json?.trabajo) {
          aplicarActualizacion(json.trabajo);
        }
      } catch {
        setReconectando(true);
      }
    };

    void consultar();
    pollingRef.current = setInterval(consultar, 2500);
  }, [aplicarActualizacion, cerrarConexiones]);

  const suscribirATrabajo = useCallback((jobId: string, infoInicial?: Partial<SnapshotTrabajo>) => {
    cerrarConexiones();

    if (infoInicial) {
      setTrabajo((prev) => ({
        id: jobId,
        modalidad: infoInicial.modalidad || 'general',
        titulo: infoInicial.titulo || 'Estudio de la Palabra',
        estado: infoInicial.estado || 'procesando',
        etapaActual: infoInicial.etapaActual || 'validacion_preparacion',
        etapasCompletadas: infoInicial.etapasCompletadas || [],
        progreso: infoInicial.progreso ?? 10,
        esEstimado: true,
        mensaje: infoInicial.mensaje || 'Iniciando el análisis…',
        tiempoTranscurridoSegundos: infoInicial.tiempoTranscurridoSegundos || 0,
        tiempoEstimadoRestanteSegundos: infoInicial.tiempoEstimadoRestanteSegundos || 45,
        ...prev,
      }));
    }

    // Intentar SSE en primer lugar
    if (typeof window !== 'undefined' && 'EventSource' in window) {
      try {
        const es = new EventSource(`/api/analyze/job/stream?id=${encodeURIComponent(jobId)}`);
        eventSourceRef.current = es;

        es.onmessage = (event) => {
          try {
            const data: SnapshotTrabajo = JSON.parse(event.data);
            aplicarActualizacion(data);
          } catch {}
        };

        es.onerror = () => {
          // SSE falló o desconectó; activar fallback a polling
          if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
          }
          setReconectando(true);
          iniciarPollingFallback(jobId);
        };

        return;
      } catch {
        // Fallback inmediato a polling si EventSource falla al instanciarse
      }
    }

    iniciarPollingFallback(jobId);
  }, [aplicarActualizacion, cerrarConexiones, iniciarPollingFallback]);

  // Al montar el componente, recuperar trabajo activo si existe
  useEffect(() => {
    const activo = obtenerTrabajoActivoLocal();
    if (activo && activo.id) {
      const ahora = Date.now();
      // Si el trabajo tiene menos de 45 minutos, reconectar
      if (ahora - activo.inicio < 45 * 60 * 1000) {
        suscribirATrabajo(activo.id, {
          modalidad: activo.modalidad,
          titulo: activo.titulo,
          estado: 'procesando',
        });
      } else {
        limpiarTrabajoActivoLocal();
      }
    }

    return () => {
      cerrarConexiones();
    };
  }, [cerrarConexiones, suscribirATrabajo]);

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

      const res = await fetch('/api/analyze/job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(opciones),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.jobId) {
        throw new Error(data?.error || 'No se pudo iniciar el trabajo de análisis.');
      }

      const jobId = data.jobId as string;
      const initialJob = data.trabajo as SnapshotTrabajo | undefined;

      guardarTrabajoActivoLocal({
        id: jobId,
        modalidad: opciones.modalidad,
        titulo: opciones.titulo || 'Estudio de la Palabra',
        inicio: Date.now(),
      });

      suscribirATrabajo(jobId, initialJob);
      return initialJob || { id: jobId };
    },
    [cerrarConexiones, suscribirATrabajo],
  );

  const cancelarTrabajo = useCallback(async () => {
    if (!trabajo?.id) return;
    try {
      await fetch(`/api/analyze/job?id=${encodeURIComponent(trabajo.id)}`, {
        method: 'DELETE',
      });
    } catch {}
    cerrarConexiones();
    limpiarTrabajoActivoLocal();
    setTrabajo(null);
  }, [cerrarConexiones, trabajo?.id]);

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
