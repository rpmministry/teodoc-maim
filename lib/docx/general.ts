import type { MetadatosPredica, PredicaAnalisis } from '../tipos.ts';
import { DocumentoWord } from './base.ts';
import { construirReferencias } from '../referencias.ts';
import { preguntasReflexion } from '../reflexion.ts';
import { fechaLarga } from '../modalidades.ts';

export function construirWordGeneral(analisis: PredicaAnalisis, metadatos: MetadatosPredica): Promise<Blob> {
  const d = new DocumentoWord(metadatos, analisis.titulo, 'Análisis general', 'Análisis bíblico y teológico del mensaje estructurado según los modelos de MAIM.');

  // 01. FUNDAMENTO BÍBLICO E IDEA CENTRAL
  d.seccion('01. Fundamento bíblico e idea central');
  d.subtitulo('Ficha técnica de la enseñanza')
    .parrafo(`Título: ${analisis.titulo}`)
    .parrafo(metadatos.predicador ? `Predicador o expositor: ${metadatos.predicador}` : 'Predicador o expositor: no proporcionado.')
    .parrafo(metadatos.fecha ? `Fecha de la prédica: ${fechaLarga(metadatos.fecha)}` : 'Fecha de la prédica: no proporcionada.')
    .parrafo(`Texto bíblico principal: ${analisis.texto_biblico_principal.cita || 'No identificado.'}`);

  d.subtitulo('Idea central y propósito');
  d.caja('Idea central', analisis.idea_principal || 'No se identificó una idea central explícita.');
  if (analisis.tema_principal) d.parrafo(`Tema: ${analisis.tema_principal}`);
  if (analisis.proposito) d.parrafo(`Propósito: ${analisis.proposito}`);
  if (analisis.contexto_general) d.parrafo(`Contexto general: ${analisis.contexto_general}`);

  d.subtitulo('Fundamento bíblico');
  d.cita(analisis.texto_biblico_principal);
  if (analisis.contexto_biblico) d.parrafo(`Contexto del pasaje: ${analisis.contexto_biblico}`);
  if (analisis.contexto_historico) d.parrafo(`Contexto histórico: ${analisis.contexto_historico}`);
  if (analisis.contexto_literario) d.parrafo(`Contexto literario: ${analisis.contexto_literario}`);
  if (analisis.relacion_textos) d.parrafo(`Relación entre los textos: ${analisis.relacion_textos}`);
  if (analisis.interpretacion) d.parrafo(`Lectura doctrinal presentada: ${analisis.interpretacion}`, { cursiva: true });
  if (analisis.otros_textos.length) {
    d.subtitulo('Otros textos citados');
    analisis.otros_textos.forEach((versiculo) => d.cita(versiculo));
  }

  // 02. CUERPO Y DESARROLLO DEL MENSAJE
  d.seccion('02. Cuerpo y desarrollo del mensaje');
  if (analisis.desarrollo_progresivo.length) {
    d.subtitulo('Desarrollo completo del mensaje');
    analisis.desarrollo_progresivo.forEach((punto, indice) => {
      d.subtitulo(`${indice + 1}. ${punto.punto}`);
      if (punto.explicacion) d.parrafo(punto.explicacion);
      punto.subtemas.forEach((subtema) => {
        if (subtema.titulo) d.parrafo(subtema.titulo, { negrita: true, color: '2B1F1E' });
        if (subtema.desarrollo) d.parrafo(subtema.desarrollo);
      });
      punto.versiculos.forEach((versiculo) => d.cita(versiculo));
    });
  }

  if (analisis.ensenanzas.length) {
    d.subtitulo('Enseñanzas principales');
    analisis.ensenanzas.forEach((ensenanza) => d.parrafo(`${ensenanza.sobre ? `${ensenanza.sobre}: ` : ''}${ensenanza.ensenanza}`));
  }

  if (analisis.conceptos_clave.length || analisis.conceptos_teologicos.length) {
    d.subtitulo('Conceptos clave');
    if (analisis.conceptos_clave.length) d.parrafo(analisis.conceptos_clave.join(' · '));
    analisis.conceptos_teologicos.forEach((concepto) => d.parrafo(`${concepto.concepto}: ${concepto.significado}`));
  }

  // 03. CIERRE, APLICACIÓN Y RESPUESTA PERSONAL
  d.seccion('03. Cierre, aplicación y respuesta personal');
  if (analisis.aplicacion.length) {
    d.subtitulo('Aplicación práctica');
    d.lista(analisis.aplicacion, true);
  }

  const preguntas = preguntasReflexion(analisis);
  if (preguntas.length) {
    d.subtitulo('Preguntas para estudio y reflexión personal');
    d.lista(preguntas, true);
  }

  if (analisis.conclusion) {
    d.subtitulo('Conclusión del estudio');
    d.caja('Conclusión', analisis.conclusion);
  }
  if (analisis.oracion) {
    d.subtitulo('Oración');
    d.caja('Oración sugerida', analisis.oracion);
  }

  // APÉNDICE R
  const referencias = construirReferencias(analisis);
  if (referencias.length) {
    d.seccion('Inventario de referencias bíblicas');
    d.tablaReferencias(referencias);
  }

  return d.blob();
}
