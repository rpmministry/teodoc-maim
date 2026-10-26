import type {
  ActividadConPasos,
  ActividadInfantil,
  ClaseNinos,
  ConceptoJuvenil,
  ConceptoTeologico,
  ContenidoEspecializado,
  DevocionalDia,
  DinamicaJuvenil,
  Ensenanza,
  EstudioGrupos,
  EstudioJovenes,
  JuegoInfantil,
  MetadatosPredica,
  ModalidadId,
  PlanDevocional,
  PredicaAnalisis,
  PuntoDesarrollo,
  RangoEdad,
  RelatoInfantil,
  ResultadoAnalisis,
  Versiculo,
} from './tipos.ts';
import { esModalidad, esRangoEdad, normalizarEspacios, normalizarFechaISO, normalizarPredicador, normalizarTituloProporcionado } from './modalidades.ts';

type Registro = Record<string, unknown>;

function registro(valor: unknown): Registro {
  return valor && typeof valor === 'object' && !Array.isArray(valor) ? (valor as Registro) : {};
}

export function texto(valor: unknown): string {
  if (typeof valor === 'number') return String(valor);
  if (typeof valor !== 'string') return '';
  return valor.replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ').trim();
}

function textoMultilinea(valor: unknown): string {
  if (typeof valor !== 'string') return '';
  return valor.replace(/\u0000/g, '').replace(/\r\n/g, '\n').trim();
}

function listaTexto(valor: unknown, max = 30): string[] {
  if (!Array.isArray(valor)) return [];
  const salida: string[] = [];
  for (const item of valor) {
    const limpio = texto(item);
    if (!limpio) continue;
    if (salida.some((existente) => existente.toLowerCase() === limpio.toLowerCase())) continue;
    salida.push(limpio);
    if (salida.length >= max) break;
  }
  return salida;
}

function listaMultilinea(valor: unknown, max = 30): string[] {
  if (!Array.isArray(valor)) return [];
  return valor.map((item) => textoMultilinea(item)).filter(Boolean).slice(0, max);
}

function listaVersiculos(valor: unknown, max = 20): Versiculo[] {
  if (!Array.isArray(valor)) return [];
  return valor
    .map((item) => {
      const v = registro(item);
      return { cita: texto(v.cita), texto: texto(v.texto) };
    })
    .filter((v) => v.cita || v.texto)
    .slice(0, max);
}

function versiculo(valor: unknown): Versiculo {
  const v = registro(valor);
  if (typeof valor === 'string') return { cita: texto(valor), texto: '' };
  return { cita: texto(v.cita), texto: texto(v.texto) };
}

function pasos(valor: unknown, max = 20): string[] {
  if (Array.isArray(valor)) return listaMultilinea(valor, max);
  const unico = textoMultilinea(valor);
  return unico ? [unico] : [];
}

const PALABRAS_VACIAS = new Set([
  'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'de', 'del', 'al', 'a', 'en', 'y', 'o', 'u', 'que',
  'por', 'para', 'con', 'sin', 'su', 'sus', 'se', 'es', 'son', 'como', 'mas', 'más', 'punto', 'puntos',
  'principal', 'principales', 'tema', 'temas', 'cosa', 'cosas', 'sobre', 'este', 'esta', 'estos', 'estas',
]);

function concepto(valor: unknown): string {
  const base = texto(valor).replace(/^[\-*\u2022\d.)\s]+/, '').replace(/[.,;:]+$/, '').trim();
  if (!base || !/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/.test(base)) return '';
  const palabras = base.split(' ').filter(Boolean);
  if (!palabras.length || palabras.length > 3 || base.length > 32) return '';
  if (palabras.length === 1 && PALABRAS_VACIAS.has(base.toLowerCase())) return '';
  return base;
}

function listaConceptos(valor: unknown, max = 8): string[] {
  if (!Array.isArray(valor)) return [];
  const salida: string[] = [];
  for (const item of valor) {
    const limpio = concepto(item);
    if (!limpio) continue;
    if (salida.some((existente) => existente.toLowerCase() === limpio.toLowerCase())) continue;
    salida.push(limpio);
    if (salida.length >= max) break;
  }
  return salida;
}

function conceptosTeologicos(valor: unknown, max = 8): ConceptoTeologico[] {
  if (!Array.isArray(valor)) return [];
  const salida: ConceptoTeologico[] = [];
  for (const item of valor) {
    const c = registro(item);
    const nombre = concepto(c.concepto);
    if (!nombre) continue;
    if (salida.some((existente) => existente.concepto.toLowerCase() === nombre.toLowerCase())) continue;
    salida.push({ concepto: nombre, significado: texto(c.significado) });
    if (salida.length >= max) break;
  }
  return salida;
}

function derivarConceptos(datos: Registro): string[] {
  const puntos = Array.isArray(datos.desarrollo_progresivo) ? datos.desarrollo_progresivo : [];
  const fuente = [
    texto(datos.idea_principal),
    ...puntos.map((p) => texto(registro(p).punto)),
  ].join(' ');
  const conteo = new Map<string, number>();
  for (const palabra of fuente.toLowerCase().split(/[^a-záéíóúüñ]+/)) {
    if (palabra.length < 4 || PALABRAS_VACIAS.has(palabra)) continue;
    conteo.set(palabra, (conteo.get(palabra) || 0) + 1);
  }
  return Array.from(conteo.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([palabra]) => palabra.charAt(0).toUpperCase() + palabra.slice(1));
}

function normalizarPuntos(valor: unknown): PuntoDesarrollo[] {
  if (!Array.isArray(valor)) return [];
  return valor
    .map((item) => {
      const p = registro(item);
      return {
        punto: texto(p.punto),
        explicacion: texto(p.explicacion),
        subtemas: Array.isArray(p.subtemas)
          ? p.subtemas
              .map((sub) => {
                const s = registro(sub);
                return { titulo: texto(s.titulo), desarrollo: texto(s.desarrollo) };
              })
              .filter((sub) => sub.titulo || sub.desarrollo)
              .slice(0, 6)
          : [],
        versiculos: listaVersiculos(p.versiculos, 6),
      };
    })
    .filter((p) => p.punto || p.explicacion)
    .slice(0, 16);
}

function normalizarEnsenanzas(valor: unknown): Ensenanza[] {
  if (!Array.isArray(valor)) return [];
  return valor
    .map((item) => {
      const e = registro(item);
      return { sobre: texto(e.sobre), ensenanza: texto(e.ensenanza) };
    })
    .filter((e) => e.ensenanza)
    .slice(0, 12);
}

export function normalizarAnalisisGeneral(valor: unknown): PredicaAnalisis {
  const datos = registro(valor);
  const puntos = normalizarPuntos(datos.desarrollo_progresivo);
  const principal = versiculo(datos.texto_biblico_principal);
  const pasajeFallback = puntos.flatMap((p) => p.versiculos).find((v) => v.cita) || { cita: '', texto: '' };
  const principalFinal = principal.cita || principal.texto ? principal : pasajeFallback;
  const conceptos = listaConceptos(datos.conceptos_clave, 8);

  return {
    titulo: texto(datos.titulo).slice(0, 180) || 'Análisis del mensaje',
    idea_principal: texto(datos.idea_principal),
    tema_principal: texto(datos.tema_principal),
    proposito: texto(datos.proposito),
    contexto_general: texto(datos.contexto_general),
    texto_biblico_principal: principalFinal,
    otros_textos: listaVersiculos(datos.otros_textos, 20),
    contexto_biblico: texto(datos.contexto_biblico),
    contexto_historico: texto(datos.contexto_historico),
    contexto_literario: texto(datos.contexto_literario),
    relacion_textos: texto(datos.relacion_textos),
    interpretacion: texto(datos.interpretacion),
    desarrollo_progresivo: puntos,
    ensenanzas: normalizarEnsenanzas(datos.ensenanzas),
    conceptos_clave: conceptos.length ? conceptos : derivarConceptos(datos),
    conceptos_teologicos: conceptosTeologicos(datos.conceptos_teologicos),
    aplicacion: listaTexto(datos.aplicacion, 20),
    conclusion: texto(datos.conclusion),
    oracion: texto(datos.oracion),
  };
}

function normalizarActividad(valor: unknown): ActividadConPasos {
  const a = registro(valor);
  return {
    titulo: texto(a.titulo),
    objetivo: texto(a.objetivo) || texto(a.proposito),
    pasos: pasos(a.pasos, 20),
  };
}

export function normalizarGrupos(valor: unknown): EstudioGrupos {
  const d = registro(valor);
  return {
    objetivo: texto(d.objetivo),
    idea_central: texto(d.idea_central),
    contexto_pasaje: textoMultilinea(d.contexto_pasaje),
    agenda: Array.isArray(d.agenda)
      ? d.agenda
          .map((item) => {
            const a = registro(item);
            return { momento: texto(a.momento), minutos: texto(a.minutos), descripcion: texto(a.descripcion) };
          })
          .filter((a) => a.momento || a.descripcion)
          .slice(0, 16)
      : [],
    materiales: listaTexto(d.materiales, 20),
    preguntas_inicio: listaTexto(d.preguntas_inicio, 12),
    preguntas_comprension: listaTexto(d.preguntas_comprension, 12),
    preguntas_reflexion: listaTexto(d.preguntas_reflexion, 12),
    actividad: normalizarActividad(d.actividad),
    caso_practico: textoMultilinea(d.caso_practico),
    aplicaciones: listaTexto(d.aplicaciones, 12),
    compromiso_semanal: textoMultilinea(d.compromiso_semanal),
    motivos_oracion: listaTexto(d.motivos_oracion, 12),
    oracion_final: textoMultilinea(d.oracion_final),
    orientaciones_lider: listaTexto(d.orientaciones_lider, 16),
  };
}

function normalizarDinamica(valor: unknown): DinamicaJuvenil {
  const d = registro(valor);
  return {
    titulo: texto(d.titulo),
    objetivo: texto(d.objetivo),
    pasos: pasos(d.pasos, 20),
  };
}

export function normalizarJovenes(valor: unknown): EstudioJovenes {
  const d = registro(valor);
  const conceptos: ConceptoJuvenil[] = Array.isArray(d.conceptos)
    ? d.conceptos
        .map((item) => {
          const c = registro(item);
          return { concepto: texto(c.concepto), explicacion: texto(c.explicacion) };
        })
        .filter((c) => c.concepto || c.explicacion)
        .slice(0, 10)
    : [];
  return {
    objetivo: texto(d.objetivo),
    tema: texto(d.tema),
    contexto_pasaje: textoMultilinea(d.contexto_pasaje),
    conceptos,
    preguntas_reflexion: listaTexto(d.preguntas_reflexion, 15),
    preguntas_grupales: listaTexto(d.preguntas_grupales, 15),
    casos_practicos: listaTexto(d.casos_practicos, 8),
    dinamica: normalizarDinamica(d.dinamica),
    aplicaciones: listaTexto(d.aplicaciones, 12),
    desafio_semanal: textoMultilinea(d.desafio_semanal),
    motivos_oracion: listaTexto(d.motivos_oracion, 12),
    guia_lider: listaTexto(d.guia_lider, 16),
  };
}

function normalizarActividadInfantil(valor: unknown): ActividadInfantil {
  const a = registro(valor);
  return {
    titulo: texto(a.titulo),
    objetivo: texto(a.objetivo),
    materiales: listaTexto(a.materiales, 20),
    pasos: pasos(a.pasos, 24),
  };
}

function normalizarJuegoInfantil(valor: unknown): JuegoInfantil {
  const j = registro(valor);
  return {
    titulo: texto(j.titulo),
    materiales: listaTexto(j.materiales, 20),
    pasos: pasos(j.pasos, 24),
  };
}

export function normalizarNinos(valor: unknown): ClaseNinos {
  const d = registro(valor);
  const relato: RelatoInfantil[] = Array.isArray(d.relato)
    ? d.relato
        .map((item) => {
          const r = registro(item);
          return { parte: texto(r.parte), titulo: texto(r.titulo), texto: textoMultilinea(r.texto) };
        })
        .filter((r) => r.titulo || r.texto)
        .slice(0, 12)
    : [];
  return {
    objetivo_aprendizaje: texto(d.objetivo_aprendizaje),
    relato,
    versiculo_clave: versiculo(d.versiculo_clave),
    explicacion_versiculo: textoMultilinea(d.explicacion_versiculo),
    preguntas_comprension: listaTexto(d.preguntas_comprension, 15),
    actividad: normalizarActividadInfantil(d.actividad),
    juego: normalizarJuegoInfantil(d.juego),
    aplicacion: textoMultilinea(d.aplicacion),
    actividad_familia: textoMultilinea(d.actividad_familia),
    oracion_cierre: textoMultilinea(d.oracion_cierre),
    recomendaciones_maestro: listaTexto(d.recomendaciones_maestro, 16),
    duracion_aproximada: texto(d.duracion_aproximada),
  };
}

export function normalizarDevocionales(valor: unknown): PlanDevocional {
  const d = registro(valor);
  const dias: DevocionalDia[] = Array.isArray(d.dias)
    ? d.dias
        .map((item, indice) => {
          const dia = registro(item);
          const numero = Number(dia.dia);
          return {
            dia: Number.isFinite(numero) && numero > 0 ? Math.floor(numero) : indice + 1,
            titulo: texto(dia.titulo),
            tema: texto(dia.tema),
            lectura_principal: versiculo(dia.lectura_principal),
            lecturas_complementarias: listaVersiculos(dia.lecturas_complementarias, 6),
            contexto: textoMultilinea(dia.contexto),
            reflexion: textoMultilinea(dia.reflexion),
            ensenanza_central: textoMultilinea(dia.ensenanza_central),
            pregunta_introspeccion: texto(dia.pregunta_introspeccion),
            aplicacion: textoMultilinea(dia.aplicacion),
            accion: textoMultilinea(dia.accion),
            oracion: textoMultilinea(dia.oracion),
          };
        })
        .filter((dia) => dia.titulo || dia.reflexion || dia.ensenanza_central)
        .sort((a, b) => a.dia - b.dia)
        .slice(0, 7)
        .map((dia, indice) => ({ ...dia, dia: indice + 1 }))
    : [];
  return {
    introduccion: textoMultilinea(d.introduccion),
    proposito: textoMultilinea(d.proposito),
    dias,
  };
}

export function normalizarEspecializado(modalidad: ModalidadId, valor: unknown): ContenidoEspecializado {
  const datos = registro(valor);
  switch (modalidad) {
    case 'grupos':
      return { grupos: normalizarGrupos(datos.grupos ?? datos) };
    case 'jovenes':
      return { jovenes: normalizarJovenes(datos.jovenes ?? datos) };
    case 'ninos':
      return { ninos: normalizarNinos(datos.ninos ?? datos) };
    case 'devocionales':
      return { devocionales: normalizarDevocionales(datos.devocionales ?? datos) };
    default:
      return {};
  }
}

export function especializadoTieneContenido(modalidad: ModalidadId, contenido: ContenidoEspecializado): boolean {
  switch (modalidad) {
    case 'grupos': {
      const d = contenido.grupos;
      if (!d) return false;
      const preguntas = d.preguntas_inicio.length + d.preguntas_comprension.length + d.preguntas_reflexion.length;
      return Boolean(
        d.objetivo && d.idea_central && d.agenda.length >= 3 && preguntas >= 5 &&
        d.actividad.pasos.length >= 2 && d.aplicaciones.length >= 2 && d.compromiso_semanal &&
        d.oracion_final && d.orientaciones_lider.length >= 2,
      );
    }
    case 'jovenes': {
      const d = contenido.jovenes;
      if (!d) return false;
      const preguntas = d.preguntas_reflexion.length + d.preguntas_grupales.length;
      return Boolean(
        d.objetivo && d.tema && preguntas >= 5 && d.dinamica.pasos.length >= 2 &&
        d.aplicaciones.length >= 2 && d.desafio_semanal && d.motivos_oracion.length >= 2 &&
        d.guia_lider.length >= 2,
      );
    }
    case 'ninos': {
      const d = contenido.ninos;
      if (!d) return false;
      return Boolean(
        d.objetivo_aprendizaje && d.relato.length >= 2 && d.versiculo_clave.cita &&
        d.actividad.pasos.length >= 2 && d.juego.pasos.length >= 1 && d.aplicacion &&
        d.oracion_cierre && d.recomendaciones_maestro.length >= 2,
      );
    }
    case 'devocionales': {
      const d = contenido.devocionales;
      return Boolean(d && d.dias.length > 0 && d.dias.every((dia) => dia.lectura_principal.cita && dia.reflexion && dia.aplicacion && dia.oracion));
    }
    default:
      return true;
  }
}

export function normalizarMetadatos(valor: unknown, fechaAnalisis = new Date().toISOString()): MetadatosPredica {
  const d = registro(valor);
  const modalidad = esModalidad(d.modalidad) ? d.modalidad : 'general';
  const rangoEdad: RangoEdad | undefined = modalidad === 'ninos' && esRangoEdad(d.rangoEdad) ? d.rangoEdad : undefined;
  return {
    tituloProporcionado: normalizarTituloProporcionado(d.titulo ?? d.tituloProporcionado),
    predicador: normalizarPredicador(d.predicador),
    fecha: normalizarFechaISO(d.fecha),
    modalidad,
    rangoEdad,
    fechaAnalisis: typeof d.fechaAnalisis === 'string' && d.fechaAnalisis ? d.fechaAnalisis : fechaAnalisis,
  };
}

export function normalizarRespuesta(valor: unknown, metadatosBase?: MetadatosPredica): ResultadoAnalisis {
  const datos = registro(valor);
  const general = normalizarAnalisisGeneral(datos);
  const metadatos = normalizarMetadatos(
    datos.metadatos && typeof datos.metadatos === 'object' ? datos.metadatos : metadatosBase,
    metadatosBase?.fechaAnalisis,
  );
  const modalidad = metadatosBase?.modalidad ?? metadatos.modalidad;
  const metadatosFinales: MetadatosPredica = {
    ...metadatos,
    modalidad,
    rangoEdad: modalidad === 'ninos' ? (metadatos.rangoEdad ?? metadatosBase?.rangoEdad) : undefined,
    predicador: metadatos.predicador ?? metadatosBase?.predicador,
    tituloProporcionado: metadatos.tituloProporcionado ?? metadatosBase?.tituloProporcionado,
    fecha: metadatos.fecha ?? metadatosBase?.fecha,
  };
  if (metadatosFinales.tituloProporcionado) general.titulo = metadatosFinales.tituloProporcionado;
  const especializado = normalizarEspecializado(modalidad, datos.especializado);
  const advertencia = texto(datos.advertencia_especializado) || undefined;
  return {
    ...general,
    metadatos: metadatosFinales,
    especializado,
    advertenciaEspecializado: advertencia,
  };
}

export function resumenParaEspecialidad(analisis: PredicaAnalisis): string {
  const puntos = analisis.desarrollo_progresivo
    .map((punto, indice) => `${indice + 1}. ${punto.punto}: ${punto.explicacion}`)
    .join('\n');
  const referencias = [
    analisis.texto_biblico_principal.cita,
    ...analisis.otros_textos.map((v) => v.cita),
    ...analisis.desarrollo_progresivo.flatMap((p) => p.versiculos.map((v) => v.cita)),
  ].filter(Boolean);
  return [
    `Título sugerido: ${analisis.titulo}`,
    `Idea principal: ${analisis.idea_principal}`,
    `Tema: ${analisis.tema_principal}`,
    `Propósito: ${analisis.proposito}`,
    `Texto bíblico principal: ${analisis.texto_biblico_principal.cita}`,
    `Contexto bíblico: ${analisis.contexto_biblico}`,
    `Interpretación del expositor: ${analisis.interpretacion}`,
    `Enseñanzas: ${analisis.ensenanzas.map((e) => `${e.sobre}: ${e.ensenanza}`).join(' | ')}`,
    `Aplicaciones: ${analisis.aplicacion.join(' | ')}`,
    `Desarrollo:\n${puntos}`,
    `Referencias usadas: ${Array.from(new Set(referencias)).join(', ')}`,
  ].filter((linea) => !linea.endsWith(': ') && !linea.endsWith(':\n')).join('\n');
}

export function capitalizarOracion(valor: string): string {
  const limpio = normalizarEspacios(valor);
  if (!limpio) return '';
  return limpio.charAt(0).toUpperCase() + limpio.slice(1);
}
