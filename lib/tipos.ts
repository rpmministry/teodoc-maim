export type ModalidadId = 'general' | 'bosquejo' | 'grupos' | 'jovenes' | 'ninos' | 'devocionales';

export type RangoEdad = '3-5' | '6-8' | '9-12';

export interface Versiculo {
  cita: string;
  texto: string;
  traduccion?: string;
  licencia?: string;
  fuente?: string;
  estadoVerificacion?: 'verificada' | 'pendiente_de_verificacion';
}

export interface Subtema {
  titulo: string;
  desarrollo: string;
}

export interface PuntoDesarrollo {
  punto: string;
  explicacion: string;
  subtemas: Subtema[];
  versiculos: Versiculo[];
}

export interface Ensenanza {
  sobre: string;
  ensenanza: string;
}

export interface ConceptoTeologico {
  concepto: string;
  significado: string;
}

export interface PredicaAnalisis {
  titulo: string;
  idea_principal: string;
  tema_principal: string;
  proposito: string;
  contexto_general: string;
  texto_biblico_principal: Versiculo;
  otros_textos: Versiculo[];
  contexto_biblico: string;
  contexto_historico: string;
  contexto_literario: string;
  relacion_textos: string;
  interpretacion: string;
  desarrollo_progresivo: PuntoDesarrollo[];
  ensenanzas: Ensenanza[];
  conceptos_clave: string[];
  conceptos_teologicos: ConceptoTeologico[];
  aplicacion: string[];
  conclusion: string;
  oracion: string;
}

export interface MetadatosPredica {
  tituloProporcionado?: string;
  predicador?: string;
  fecha?: string;
  modalidad: ModalidadId;
  rangoEdad?: RangoEdad;
  fechaAnalisis: string;
}

// ---------------------------------------------------------------------------
// Modalidad: Bosquejo Ministerial (Liderazgo MAIM)
// ---------------------------------------------------------------------------

export interface SubpuntoBosquejo {
  letra: string; // "A", "B", "C"...
  titulo: string; // Enunciado del subpunto
  desarrollo: string; // Argumentación sólida y desglose de lo enseñado
  detalles?: string[]; // 1, 2, a, b: evidencias, conceptos o textos citados
  pasajes_apoyo?: string[]; // Pasajes bíblicos citados de apoyo
}

export interface PuntoPrincipalBosquejo {
  romano: string; // "I", "II", "III"...
  titulo: string; // Declaración homilética del punto principal
  cita: string; // Pasaje bíblico de apoyo
  texto_cita?: string; // Texto del versículo o pasaje
  exposicion: string; // Exégesis y desarrollo amplio de lo enseñado
  subpuntos: SubpuntoBosquejo[];
  ilustracion?: string; // Ilustración, metáfora o concepto clave citado por el expositor
  transicion?: string; // Oración de transición hacia el siguiente punto o conclusión
}

export interface IntroduccionBosquejo {
  gancho: string; // Captación de atención y necesidad real humana/espiritual
  contexto: string; // Contexto bíblico, histórico y literario del pasaje
  transicion: string; // Oración de transición hacia el primer punto principal
}

export interface ConclusionBosquejo {
  recapitulacion: string; // Síntesis integral de los puntos sin doctrinas nuevas
  climax: string; // Clímax espiritual y verdad cumbre que interpela al creyente
}

export interface ObjetivosBosquejo {
  cognitivo: string; // Qué debe comprender la congregación y el liderazgo
  afectivo: string; // Qué convicción o actitud espiritual debe producir
  volitivo: string; // Qué acción concreta exige Dios a partir de este mensaje
}

export interface DesafioFinalBosquejo {
  llamado: string; // Desafío práctico para la congregación y el liderazgo
  oracion_ministracion: string; // Oración guiada para ministración pastoral y congregacional
}

export interface EstudioBosquejo {
  titulo: string;
  tema_central: string;
  proposito_general: string;
  objetivos: ObjetivosBosquejo;
  tesis: string; // Proposición homilética / Idea central en una sola oración clara
  fundamento_doctrinal: string; // Síntesis doctrinal explícitamente fundamentada en la enseñanza
  texto_base: Versiculo;
  introduccion: IntroduccionBosquejo;
  puntos_principales: PuntoPrincipalBosquejo[];
  conclusion: ConclusionBosquejo;
  aplicacion_liderazgo: string[]; // Puntos de aplicación práctica y pastoral para el liderazgo de MAIM
  desafio_final: DesafioFinalBosquejo;
}

export interface AgendaGrupo {
  momento: string;
  minutos: string;
  descripcion: string;
}

export interface ActividadConPasos {
  titulo: string;
  objetivo: string;
  pasos: string[];
}

export interface EstudioGrupos {
  objetivo: string;
  idea_central: string;
  contexto_pasaje: string;
  agenda: AgendaGrupo[];
  materiales: string[];
  preguntas_inicio: string[];
  preguntas_comprension: string[];
  preguntas_reflexion: string[];
  actividad: ActividadConPasos;
  caso_practico: string;
  aplicaciones: string[];
  compromiso_semanal: string;
  motivos_oracion: string[];
  oracion_final: string;
  orientaciones_lider: string[];
}

export interface ConceptoJuvenil {
  concepto: string;
  explicacion: string;
}

export interface DinamicaJuvenil {
  titulo: string;
  objetivo: string;
  pasos: string[];
}

export interface EstudioJovenes {
  objetivo: string;
  tema: string;
  contexto_pasaje: string;
  conceptos: ConceptoJuvenil[];
  preguntas_reflexion: string[];
  preguntas_grupales: string[];
  casos_practicos: string[];
  dinamica: DinamicaJuvenil;
  aplicaciones: string[];
  desafio_semanal: string;
  motivos_oracion: string[];
  guia_lider: string[];
}

export interface RelatoInfantil {
  parte: string;
  titulo: string;
  texto: string;
}

export interface ActividadInfantil {
  titulo: string;
  objetivo: string;
  materiales: string[];
  pasos: string[];
}

export interface JuegoInfantil {
  titulo: string;
  materiales: string[];
  pasos: string[];
}

export interface ClaseNinos {
  objetivo_aprendizaje: string;
  relato: RelatoInfantil[];
  versiculo_clave: Versiculo;
  explicacion_versiculo: string;
  preguntas_comprension: string[];
  actividad: ActividadInfantil;
  juego: JuegoInfantil;
  aplicacion: string;
  actividad_familia: string;
  oracion_cierre: string;
  recomendaciones_maestro: string[];
  duracion_aproximada: string;
}

export interface DevocionalDia {
  dia: number;
  titulo: string;
  tema: string;
  lectura_principal: Versiculo;
  lecturas_complementarias: Versiculo[];
  contexto: string;
  reflexion: string;
  ensenanza_central: string;
  pregunta_introspeccion: string;
  aplicacion: string;
  accion: string;
  oracion: string;
}

export interface PlanDevocional {
  introduccion: string;
  proposito: string;
  dias: DevocionalDia[];
}

export interface ContenidoEspecializado {
  bosquejo?: EstudioBosquejo;
  grupos?: EstudioGrupos;
  jovenes?: EstudioJovenes;
  ninos?: ClaseNinos;
  devocionales?: PlanDevocional;
}

export interface ResultadoAnalisis extends PredicaAnalisis {
  metadatos: MetadatosPredica;
  especializado: ContenidoEspecializado;
  advertenciaEspecializado?: string;
}

export interface EntradaAnalisis {
  texto: string;
  modalidad: ModalidadId;
  rangoEdad?: RangoEdad;
  titulo?: string;
  predicador?: string;
  fecha?: string;
}

export interface RespuestaAnalisis extends PredicaAnalisis {
  metadatos: MetadatosPredica;
  especializado: ContenidoEspecializado;
  advertencia_especializado?: string;
}
