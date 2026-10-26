export type ModalidadId = 'general' | 'grupos' | 'jovenes' | 'ninos' | 'devocionales';

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
