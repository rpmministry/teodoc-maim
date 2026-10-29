import { randomUUID } from 'node:crypto';
import { EventEmitter } from 'node:events';
import {
  calcularHuellaTexto,
  obtenerContenidoCanonico,
  guardarContenidoCanonico,
  guardarAnalisisEnCanonico,
  obtenerAnalisisDeCanonico,
} from './canonical-store.ts';
import { obtenerContextoBaseVerificado, verificarReferencias } from './biblia.ts';
import { contextoRiqueza } from './riqueza-contenido.ts';
import { normalizarPredicador, normalizarTituloProporcionado, normalizarFechaISO, obtenerRangoEdad } from './modalidades.ts';
import { especializadoTieneContenido, normalizarAnalisisGeneral, normalizarEspecializado, normalizarMetadatos } from './normalizar.ts';
import { construirPromptEspecializado, ESQUEMAS_POR_MODALIDAD } from './ai/modalidades.ts';
import { Cronometro } from './timing.ts';
import type { MetadatosPredica, ModalidadId, PredicaAnalisis, RangoEdad, ResultadoAnalisis } from './tipos.ts';

import {
  type EstadoTrabajoAnalisis,
  type EtapaAnalisisId,
  type EtapaInfo,
  type MensajesEtapa,
  type TrabajoAnalisis,
  ETAPAS_ANALISIS,
  DURACIONES_HISTORICAS,
  MENSAJES_POR_MODALIDAD,
  calcularProgresoYEstimacion,
  obtenerMensajeEtapa,
} from './analisis-progreso-tipos.ts';

export {
  type EstadoTrabajoAnalisis,
  type EtapaAnalisisId,
  type EtapaInfo,
  type MensajesEtapa,
  type TrabajoAnalisis,
  ETAPAS_ANALISIS,
  DURACIONES_HISTORICAS,
  MENSAJES_POR_MODALIDAD,
  calcularProgresoYEstimacion,
  obtenerMensajeEtapa,
};

// Almacén en memoria de trabajos con TTL
const trabajos = new Map<string, TrabajoAnalisis>();
const emisoresTrabajo = new Map<string, EventEmitter>();
const TTL_TRABAJOS_MS = 60 * 60 * 1000; // 1 hora de persistencia

export function limpiarTrabajosExpirados(): void {
  const ahora = Date.now();
  for (const [id, t] of trabajos.entries()) {
    if (ahora - t.tiempoActualizado > TTL_TRABAJOS_MS) {
      trabajos.delete(id);
      emisoresTrabajo.delete(id);
    }
  }
}

export function obtenerEmisorTrabajo(id: string): EventEmitter {
  let emisor = emisoresTrabajo.get(id);
  if (!emisor) {
    emisor = new EventEmitter();
    emisor.setMaxListeners(50);
    emisoresTrabajo.set(id, emisor);
  }
  return emisor;
}

export function obtenerTrabajoAnalisis(id: string): TrabajoAnalisis | undefined {
  const t = trabajos.get(id);
  if (!t) return undefined;

  // Actualizar tiempo transcurrido en tiempo real al consultarlo
  if (t.estado === 'procesando' || t.estado === 'iniciado') {
    const ahora = Date.now();
    t.tiempoTranscurridoSegundos = Math.floor((ahora - t.tiempoInicio) / 1000);
    const tiempoEnEtapa = Math.floor((ahora - t.tiempoActualizado) / 1000);
    const calc = calcularProgresoYEstimacion(
      t.etapaActual,
      t.etapasCompletadas,
      tiempoEnEtapa,
      t.modalidad,
      t.tieneAudio,
    );
    t.progreso = calc.progreso;
    t.tiempoEstimadoRestanteSegundos = calc.tiempoEstimadoRestanteSegundos;
    t.esEstimado = calc.esEstimado;
  }
  return t;
}

export function actualizarTrabajoAnalisis(
  id: string,
  parche: Partial<TrabajoAnalisis>,
): TrabajoAnalisis | undefined {
  const t = trabajos.get(id);
  if (!t) return undefined;

  Object.assign(t, parche, { tiempoActualizado: Date.now() });
  t.tiempoTranscurridoSegundos = Math.floor((Date.now() - t.tiempoInicio) / 1000);

  const emisor = emisoresTrabajo.get(id);
  if (emisor) {
    emisor.emit('actualizacion', t);
  }
  return t;
}

export function buscarTrabajoActivoPorHuella(huella: string, modalidad: ModalidadId): TrabajoAnalisis | undefined {
  for (const t of trabajos.values()) {
    if (t.huella === huella && t.modalidad === modalidad && (t.estado === 'iniciado' || t.estado === 'procesando')) {
      return t;
    }
  }
  return undefined;
}

export interface OpcionesCrearTrabajo {
  text: string;
  modalidad: ModalidadId;
  rangoEdad?: RangoEdad;
  titulo?: string;
  predicador?: string;
  fecha?: string;
  tieneAudio?: boolean;
}

/**
 * Crea o enlaza un trabajo de análisis asíncrono.
 * Si ya existe en caché canónica, se completa de inmediato.
 * Si ya está en ejecución, reutiliza la tarea activa sin duplicar llamadas.
 */
export function crearTrabajoAnalisis(opciones: OpcionesCrearTrabajo): TrabajoAnalisis {
  limpiarTrabajosExpirados();

  const texto = opciones.text.trim();
  const modalidad = opciones.modalidad;
  const rangoEdad = opciones.rangoEdad;
  const titulo = normalizarTituloProporcionado(opciones.titulo) || 'Estudio de la Palabra';
  const predicador = normalizarPredicador(opciones.predicador) || '';
  const fecha = normalizarFechaISO(opciones.fecha) || new Date().toISOString().slice(0, 10);
  const tieneAudio = Boolean(opciones.tieneAudio);

  const huella = calcularHuellaTexto(texto);

  // 1. Detección de duplicado activo: si ya se está procesando, re-enlazar a la misma tarea
  const trabajoActivo = buscarTrabajoActivoPorHuella(huella, modalidad);
  if (trabajoActivo) {
    console.info(`[JobManager] Re-enlazando a trabajo en curso ${trabajoActivo.id} para huella ${huella.slice(0, 8)}`);
    return trabajoActivo;
  }

  const id = randomUUID();
  const ahora = Date.now();

  const trabajo: TrabajoAnalisis = {
    id,
    huella,
    modalidad,
    rangoEdad,
    titulo,
    predicador,
    fecha,
    texto,
    tieneAudio,
    estado: 'iniciado',
    etapaActual: 'validacion_preparacion',
    etapasCompletadas: [],
    progreso: 8,
    esEstimado: true,
    mensaje: obtenerMensajeEtapa(modalidad, 'validacion_preparacion'),
    tiempoInicio: ahora,
    tiempoActualizado: ahora,
    tiempoTranscurridoSegundos: 0,
    tiempoEstimadoRestanteSegundos: tieneAudio ? 120 : 45,
  };

  trabajos.set(id, trabajo);

  // 2. Verificar si ya existe en la caché canónica para entrega instantánea
  const enCache = obtenerAnalisisDeCanonico<ResultadoAnalisis>(huella, modalidad);
  if (enCache) {
    console.info(`[JobManager] Entrega inmediata desde caché canónica para trabajo ${id}`);
    trabajo.estado = 'completado';
    trabajo.etapaActual = 'verificacion_entrega';
    trabajo.etapasCompletadas = ETAPAS_ANALISIS.map((e) => e.id);
    trabajo.progreso = 100;
    trabajo.esEstimado = false;
    trabajo.mensaje = obtenerMensajeEtapa(modalidad, 'completado');
    trabajo.resultado = enCache;
    trabajo.tiempoFin = ahora;
    trabajo.tiempoEstimadoRestanteSegundos = 0;
    return trabajo;
  }

  // 3. Ejecutar el pipeline en segundo plano
  ejecutarPipelineEnSegundoPlano(id).catch((err) => {
    console.error(`[JobManager] Error en pipeline de trabajo ${id}:`, err);
    actualizarTrabajoAnalisis(id, {
      estado: 'error',
      progreso: 0,
      mensaje: 'Ocurrió un error al procesar el análisis.',
      error: err instanceof Error ? err.message : 'Error desconocido al generar el análisis.',
    });
  });

  return trabajo;
}

export function cancelarTrabajoAnalisis(id: string): boolean {
  const t = trabajos.get(id);
  if (!t) return false;
  t.estado = 'cancelado';
  t.mensaje = 'El análisis ha sido cancelado por el usuario.';
  t.tiempoActualizado = Date.now();
  const emisor = emisoresTrabajo.get(id);
  if (emisor) emisor.emit('actualizacion', t);
  return true;
}

function esTrabajoCancelado(id: string): boolean {
  const actual = trabajos.get(id);
  return !actual || actual.estado === 'cancelado';
}

/**
 * Worker en segundo plano que orquesta las etapas del análisis
 */
async function ejecutarPipelineEnSegundoPlano(jobId: string): Promise<void> {
  const t = trabajos.get(jobId);
  if (!t || t.estado === 'cancelado') return;

  const metadatos: MetadatosPredica = normalizarMetadatos({
    modalidad: t.modalidad,
    rangoEdad: t.rangoEdad,
    predicador: t.predicador,
    titulo: t.titulo,
    fecha: t.fecha,
    fechaAnalisis: new Date().toISOString(),
  });

  const cronometro = new Cronometro(`job_${jobId}_${t.modalidad}`);

  try {
    // ETAPA 1: Validación y preparación
    actualizarTrabajoAnalisis(jobId, {
      estado: 'procesando',
      etapaActual: 'validacion_preparacion',
      mensaje: obtenerMensajeEtapa(t.modalidad, 'validacion_preparacion'),
    });

    cronometro.iniciarEtapa('preparacion');
    let registroCanonico = obtenerContenidoCanonico(t.huella);
    if (!registroCanonico) {
      registroCanonico = {
        huella: t.huella,
        tipo: 'texto',
        fuente: t.titulo || 'texto_predica',
        titulo: t.titulo,
        autor: t.predicador,
        estado: 'completada',
        texto: t.texto,
        caracteres: t.texto.length,
        palabras: t.texto.split(/\s+/).filter(Boolean).length,
        idioma: 'es',
        proveedor: 'directo',
        creadoEn: Date.now(),
        actualizadoEn: Date.now(),
        expiraEn: 0,
      };
      guardarContenidoCanonico(registroCanonico);
    }
    cronometro.finalizarEtapa('preparacion');

    if (esTrabajoCancelado(jobId)) return;

    // ETAPA 2: Contexto bíblico y teológico
    actualizarTrabajoAnalisis(jobId, {
      etapaActual: 'contexto_biblico',
      etapasCompletadas: ['validacion_preparacion'],
      mensaje: obtenerMensajeEtapa(t.modalidad, 'contexto_biblico'),
    });

    cronometro.iniciarEtapa('contexto_biblico');
    const contextoBiblicoBase = await obtenerContextoBaseVerificado(t.texto);
    const contextoRiquezaTexto = contextoRiqueza(t.texto);
    const contextoBaseVerificado = [contextoBiblicoBase, contextoRiquezaTexto].filter(Boolean).join('\n\n');
    cronometro.finalizarEtapa('contexto_biblico');

    if (esTrabajoCancelado(jobId)) return;

    // ETAPA 3 & 4: Análisis general y especialidad con IA
    actualizarTrabajoAnalisis(jobId, {
      etapaActual: 'analisis_general',
      etapasCompletadas: ['validacion_preparacion', 'contexto_biblico'],
      mensaje: obtenerMensajeEtapa(t.modalidad, 'analisis_general'),
    });

    // Reutilizar análisis general previo si ya existe en la caché canónica
    let crudoGeneralReutilizado: Record<string, unknown> | null = null;
    const generalEnCache = obtenerAnalisisDeCanonico<PredicaAnalisis>(t.huella, 'general');
    if (generalEnCache) {
      crudoGeneralReutilizado = generalEnCache as unknown as Record<string, unknown>;
    }

    const { ejecutarCadena, SYSTEM_PROMPT_GENERAL, SCHEMA_GENERAL } = await import('../app/api/analyze/route.ts');

    cronometro.iniciarEtapa('generacion_ia');

    const tareaGeneral = crudoGeneralReutilizado
      ? Promise.resolve(crudoGeneralReutilizado)
      : ejecutarCadena(
          t.texto,
          contextoBaseVerificado,
          SYSTEM_PROMPT_GENERAL || 'Analiza la prédica en JSON con desarrollo amplio.',
          SCHEMA_GENERAL,
          'Devuelve el análisis general en JSON con desarrollo amplio y profundo.',
          40_000,
        );

    const tareaEspecializada = t.modalidad !== 'general'
      ? ejecutarCadena(
          t.texto,
          contextoBaseVerificado,
          construirPromptEspecializado(t.modalidad, obtenerRangoEdad(t.rangoEdad)),
          ESQUEMAS_POR_MODALIDAD[t.modalidad as keyof typeof ESQUEMAS_POR_MODALIDAD],
          `Devuelve el contenido especializado de la modalidad "${t.modalidad}" en JSON con desarrollo exhaustivo estilo MAIM.`,
          55_000,
        )
      : Promise.resolve(null);

    // Actualizar mensaje cuando pasa a especialidad
    if (t.modalidad !== 'general') {
      setTimeout(() => {
        const liveT = trabajos.get(jobId);
        if (liveT && liveT.estado === 'procesando' && liveT.etapaActual === 'analisis_general') {
          actualizarTrabajoAnalisis(jobId, {
            etapaActual: 'redaccion_especialidad',
            etapasCompletadas: ['validacion_preparacion', 'contexto_biblico', 'analisis_general'],
            mensaje: obtenerMensajeEtapa(t.modalidad, 'redaccion_especialidad'),
          });
        }
      }, 15_000);
    }

    const [resGeneral, resEspecializado] = await Promise.allSettled([tareaGeneral, tareaEspecializada]);
    cronometro.finalizarEtapa('generacion_ia');

    if (esTrabajoCancelado(jobId)) return;

    const crudoGeneral = resGeneral.status === 'fulfilled' ? resGeneral.value : null;
    const crudoEspecializado = resEspecializado.status === 'fulfilled' ? resEspecializado.value : null;

    if (!crudoGeneral) {
      throw new Error('No se pudo completar el análisis teológico. El servicio de IA está ocupado; intenta de nuevo.');
    }

    // ETAPA 5: Finalización y verificación
    actualizarTrabajoAnalisis(jobId, {
      etapaActual: 'verificacion_entrega',
      etapasCompletadas: ['validacion_preparacion', 'contexto_biblico', 'analisis_general', 'redaccion_especialidad'],
      mensaje: obtenerMensajeEtapa(t.modalidad, 'verificacion_entrega'),
    });

    cronometro.iniciarEtapa('verificacion_final');
    const analisisGeneral: PredicaAnalisis = normalizarAnalisisGeneral(crudoGeneral);
    await verificarReferencias(analisisGeneral);
    if (metadatos.tituloProporcionado) analisisGeneral.titulo = metadatos.tituloProporcionado;

    let resultadoFinal: ResultadoAnalisis;

    if (t.modalidad === 'general') {
      resultadoFinal = {
        ...analisisGeneral,
        metadatos,
        especializado: {},
        huellaCanonica: t.huella,
      };
      guardarAnalisisEnCanonico(t.huella, 'general', resultadoFinal);
    } else {
      let especializado = {};
      let advertencia: string | undefined;

      if (crudoEspecializado) {
        especializado = normalizarEspecializado(t.modalidad, crudoEspecializado.especializado ?? crudoEspecializado);
        if (!especializadoTieneContenido(t.modalidad, especializado)) {
          advertencia = 'El análisis general se completó, pero la modalidad devolvió contenido parcial. Puedes descargarlo o regenerarlo.';
        }
      } else {
        advertencia = 'El análisis general se completó, pero la especialidad no pudo generarse en este intento.';
      }

      resultadoFinal = {
        ...analisisGeneral,
        metadatos: { ...metadatos, rangoEdad: t.rangoEdad },
        especializado,
        huellaCanonica: t.huella,
        ...(advertencia ? { advertencia_especializado: advertencia } : {}),
      };

      guardarAnalisisEnCanonico(t.huella, t.modalidad, resultadoFinal);
      if (!generalEnCache) {
        guardarAnalisisEnCanonico(t.huella, 'general', {
          ...analisisGeneral,
          metadatos: { ...metadatos, modalidad: 'general' },
          especializado: {},
          huellaCanonica: t.huella,
        });
      }
    }

    cronometro.finalizarEtapa('verificacion_final');
    cronometro.imprimirResumen();

    // COMPLETADO: 100% real
    actualizarTrabajoAnalisis(jobId, {
      estado: 'completado',
      progreso: 100,
      esEstimado: false,
      mensaje: obtenerMensajeEtapa(t.modalidad, 'completado'),
      tiempoFin: Date.now(),
      tiempoEstimadoRestanteSegundos: 0,
      resultado: resultadoFinal,
    });

    console.info(`[JobManager] Trabajo ${jobId} completado con éxito en ${Math.floor((Date.now() - t.tiempoInicio) / 1000)}s`);
  } catch (error) {
    const err = error as { message?: string };
    console.error(`[JobManager] Error ejecutando pipeline ${jobId}:`, err?.message || err);
    actualizarTrabajoAnalisis(jobId, {
      estado: 'error',
      progreso: 0,
      esEstimado: false,
      mensaje: 'No se pudo completar el análisis en este intento.',
      error: err?.message || 'Error del servidor durante la generación del análisis.',
    });
  }
}
