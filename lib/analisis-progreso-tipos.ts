import type { MetadatosPredica, ModalidadId, RangoEdad, ResultadoAnalisis } from './tipos.ts';

export type EstadoTrabajoAnalisis =
  | 'iniciado'
  | 'procesando'
  | 'completado'
  | 'error'
  | 'cancelado';

export type EtapaAnalisisId =
  | 'validacion_preparacion'
  | 'extraccion_transcripcion'
  | 'contexto_biblico'
  | 'analisis_general'
  | 'redaccion_especialidad'
  | 'verificacion_entrega';

export interface EtapaInfo {
  id: EtapaAnalisisId;
  nombre: string;
  descripcion: string;
  pesoConAudio: number;
  pesoSinAudio: number;
}

export const ETAPAS_ANALISIS: EtapaInfo[] = [
  {
    id: 'validacion_preparacion',
    nombre: 'Validación y preparación',
    descripcion: 'Validando el contenido y comprobando disponibilidad canónica',
    pesoConAudio: 5,
    pesoSinAudio: 10,
  },
  {
    id: 'extraccion_transcripcion',
    nombre: 'Transcripción y audio',
    descripcion: 'Transcribiendo el mensaje mediante reconocimiento de voz',
    pesoConAudio: 40,
    pesoSinAudio: 0,
  },
  {
    id: 'contexto_biblico',
    nombre: 'Contexto bíblico y teológico',
    descripcion: 'Identificando pasajes bíblicos y enriqueciendo el trasfondo exegético',
    pesoConAudio: 10,
    pesoSinAudio: 15,
  },
  {
    id: 'analisis_general',
    nombre: 'Análisis doctrinal y homilético',
    descripcion: 'Profundizando en las enseñanzas centrales, exégesis y aplicaciones',
    pesoConAudio: 20,
    pesoSinAudio: 35,
  },
  {
    id: 'redaccion_especialidad',
    nombre: 'Redacción ministerial especializada',
    descripcion: 'Desarrollando el documento de la especialidad solicitada',
    pesoConAudio: 20,
    pesoSinAudio: 35,
  },
  {
    id: 'verificacion_entrega',
    nombre: 'Finalización y verificación',
    descripcion: 'Normalizando el documento y preparando formatos descargables',
    pesoConAudio: 5,
    pesoSinAudio: 5,
  },
];

// Duraciones históricas calibradas (en segundos)
export const DURACIONES_HISTORICAS: Record<EtapaAnalisisId, number> = {
  validacion_preparacion: 2,
  extraccion_transcripcion: 70,
  contexto_biblico: 3,
  analisis_general: 22,
  redaccion_especialidad: 25,
  verificacion_entrega: 2,
};

export interface MensajesEtapa {
  [etapaId: string]: string;
}

export const MENSAJES_POR_MODALIDAD: Record<ModalidadId, MensajesEtapa> = {
  general: {
    validacion_preparacion: 'Estamos preparando el contenido de tu prédica para el análisis general…',
    extraccion_transcripcion: 'Convirtiendo el audio en texto para estudiar su contenido bíblico…',
    contexto_biblico: 'Verificando pasajes bíblicos y trasfondo histórico-literario del mensaje…',
    analisis_general: 'Desarrollando los puntos principales, exégesis doctrinal y aplicaciones…',
    redaccion_especialidad: 'Consolidando la síntesis teológica y conceptos clave…',
    verificacion_entrega: 'Verificando referencias bíblicas y preparando tu documento final…',
    completado: 'Tu análisis bíblico general está listo para consultar y descargar.',
  },
  bosquejo: {
    validacion_preparacion: 'Organizando el material para el documento de formación ministerial…',
    extraccion_transcripcion: 'Convirtiendo la prédica en texto para el estudio de liderazgo…',
    contexto_biblico: 'Identificando conexiones bíblicas, tipología y términos originales…',
    analisis_general: 'Estructurando las verdades doctrinales y el mensaje central…',
    redaccion_especialidad: 'Redactando el documento editorial de liderazgo en grandes bloques continuos…',
    verificacion_entrega: 'Revisando la presentación editorial, citas y oración de consagración…',
    completado: 'Tu documento editorial de Liderazgo MAIM está listo para estudiar y compartir.',
  },
  grupos: {
    validacion_preparacion: 'Preparando el contenido para el encuentro de grupos pequeños y células…',
    extraccion_transcripcion: 'Transcribiendo la enseñanza para diseñar el estudio comunitario…',
    contexto_biblico: 'Analizando el contexto del pasaje para la vida comunitaria y familiar…',
    analisis_general: 'Extrayendo las verdades bíblicas aplicables al día a día del creyente…',
    redaccion_especialidad: 'Diseñando la agenda del encuentro, preguntas de introspección y dinámicas…',
    verificacion_entrega: 'Estructurando el compromiso semanal y las orientaciones para el facilitador…',
    completado: 'La guía de estudio para grupos pequeños y familias está lista.',
  },
  jovenes: {
    validacion_preparacion: 'Preparando el material para el estudio formativo de jóvenes…',
    extraccion_transcripcion: 'Transcribiendo el mensaje para el estudio juvenil…',
    contexto_biblico: 'Conectando la verdad de la Escritura con la realidad y decisiones juveniles…',
    analisis_general: 'Profundizando en las enseñanzas con lenguaje claro, directo y reflexivo…',
    redaccion_especialidad: 'Elaborando conceptos clave, preguntas de debate grupal y el desafío semanal…',
    verificacion_entrega: 'Revisando las pautas para el líder juvenil y motivos de oración…',
    completado: 'El estudio formativo para jóvenes está listo para ministrar.',
  },
  ninos: {
    validacion_preparacion: 'Preparando el contenido para la clase bíblica infantil…',
    extraccion_transcripcion: 'Transcribiendo el mensaje para adaptar la enseñanza a los niños…',
    contexto_biblico: 'Seleccionando el versículo clave y el relato bíblico formativo…',
    analisis_general: 'Extrayendo la enseñanza central de manera tierna, luminosa y didáctica…',
    redaccion_especialidad: 'Estructurando el relato bíblico por partes, juegos y actividades creativas…',
    verificacion_entrega: 'Revisando las recomendaciones pedagógicas para los maestros de escuela bíblica…',
    completado: 'La clase bíblica infantil está lista para enseñar.',
  },
  devocionales: {
    validacion_preparacion: 'Organizando el material para el plan devocional de siete días…',
    extraccion_transcripcion: 'Transcribiendo la prédica para diseñar las jornadas devocionales…',
    contexto_biblico: 'Seleccionando lecturas complementarias y meditaciones para la semana…',
    analisis_general: 'Profundizando en los principios espirituales y transformadores del mensaje…',
    redaccion_especialidad: 'Desarrollando las siete jornadas diarias con reflexión, acción y oración…',
    verificacion_entrega: 'Revisando la progresión espiritual de la semana completa…',
    completado: 'Tu plan devocional de siete días está listo para bendecir tu tiempo con Dios.',
  },
};

export interface TrabajoAnalisis {
  id: string;
  huella: string;
  modalidad: ModalidadId;
  rangoEdad?: RangoEdad;
  titulo: string;
  predicador: string;
  fecha: string;
  texto: string;
  tieneAudio: boolean;
  estado: EstadoTrabajoAnalisis;
  etapaActual: EtapaAnalisisId;
  etapasCompletadas: EtapaAnalisisId[];
  progreso: number; // 0 a 100
  esEstimado: boolean;
  mensaje: string;
  tiempoInicio: number;
  tiempoActualizado: number;
  tiempoFin?: number;
  tiempoTranscurridoSegundos: number;
  tiempoEstimadoRestanteSegundos: number;
  resultado?: ResultadoAnalisis;
  error?: string;
}

export function calcularProgresoYEstimacion(
  etapaActual: EtapaAnalisisId,
  etapasCompletadas: EtapaAnalisisId[],
  tiempoEnEtapaSegundos: number,
  modalidad: ModalidadId,
  tieneAudio: boolean,
): { progreso: number; tiempoEstimadoRestanteSegundos: number; esEstimado: boolean } {
  const etapasActivas = ETAPAS_ANALISIS.filter((e) => {
    if (!tieneAudio && e.id === 'extraccion_transcripcion') return false;
    if (modalidad === 'general' && e.id === 'redaccion_especialidad') return false;
    return true;
  });

  const pesoTotal = etapasActivas.reduce(
    (sum, e) => sum + (tieneAudio ? e.pesoConAudio : e.pesoSinAudio),
    0,
  );

  let progresoAcumulado = 0;
  for (const etapa of etapasActivas) {
    const peso = tieneAudio ? etapa.pesoConAudio : etapa.pesoSinAudio;
    const pesoNormalizado = (peso / (pesoTotal || 100)) * 100;

    if (etapasCompletadas.includes(etapa.id)) {
      progresoAcumulado += pesoNormalizado;
    } else if (etapa.id === etapaActual) {
      const duracionEsperada = DURACIONES_HISTORICAS[etapa.id] || 20;
      const fraccion = Math.min(0.92, tiempoEnEtapaSegundos / duracionEsperada);
      progresoAcumulado += pesoNormalizado * fraccion;
    }
  }

  // Calcular tiempo restante estimado sumando duraciones esperadas de etapas pendientes
  let tiempoRestante = 0;
  for (const etapa of etapasActivas) {
    if (!etapasCompletadas.includes(etapa.id) && etapa.id !== etapaActual) {
      tiempoRestante += DURACIONES_HISTORICAS[etapa.id] || 20;
    } else if (etapa.id === etapaActual) {
      const duracionEsperada = DURACIONES_HISTORICAS[etapa.id] || 20;
      tiempoRestante += Math.max(3, duracionEsperada - tiempoEnEtapaSegundos);
    }
  }

  return {
    progreso: Math.min(98, Math.max(5, Math.round(progresoAcumulado))),
    tiempoEstimadoRestanteSegundos: Math.round(tiempoRestante),
    esEstimado: true,
  };
}

export function obtenerMensajeEtapa(modalidad: ModalidadId, etapa: EtapaAnalisisId | 'completado'): string {
  const mensajesModalidad = MENSAJES_POR_MODALIDAD[modalidad] || MENSAJES_POR_MODALIDAD.general;
  return mensajesModalidad[etapa] || MENSAJES_POR_MODALIDAD.general[etapa] || 'Procesando el análisis…';
}

