import type { MetadatosPredica, PredicaAnalisis } from '../tipos.ts';
import { DocumentoWord } from './base.ts';
import { construirReferencias, notaReferencias } from '../referencias.ts';
import { preguntasReflexion } from '../reflexion.ts';
import { fechaLarga } from '../modalidades.ts';

export function construirWordGeneral(analisis: PredicaAnalisis, metadatos: MetadatosPredica): Promise<Blob> {
  const d = new DocumentoWord(metadatos, analisis.titulo, 'Análisis general', 'Análisis bíblico y teológico del mensaje.');
  d.seccion('Ficha técnica de la enseñanza')
    .parrafo(`Título: ${analisis.titulo}`)
    .parrafo(metadatos.predicador ? `Predicador o expositor: ${metadatos.predicador}` : 'Predicador o expositor: no proporcionado.')
    .parrafo(metadatos.fecha ? `Fecha de la prédica: ${fechaLarga(metadatos.fecha)}` : 'Fecha de la prédica: no proporcionada.')
    .parrafo(`Texto bíblico principal: ${analisis.texto_biblico_principal.cita || 'No identificado.'}`);

  d.seccion('Idea central y propósito');
  d.caja('Idea central', analisis.idea_principal || 'No se identificó una idea central explícita.');
  if (analisis.tema_principal) d.parrafo(`Tema: ${analisis.tema_principal}`);
  if (analisis.proposito) d.parrafo(`Propósito: ${analisis.proposito}`);
  if (analisis.contexto_general) d.parrafo(`Contexto general: ${analisis.contexto_general}`);

  d.seccion('Fundamento bíblico');
  d.cita(analisis.texto_biblico_principal);
  if (analisis.contexto_biblico) d.parrafo(`Contexto del pasaje: ${analisis.contexto_biblico}`);
  if (analisis.contexto_historico) d.parrafo(`Contexto histórico: ${analisis.contexto_historico}`);
  if (analisis.contexto_literario) d.parrafo(`Contexto literario: ${analisis.contexto_literario}`);
  if (analisis.relacion_textos) d.parrafo(`Relación entre los textos: ${analisis.relacion_textos}`);
  if (analisis.interpretacion) d.parrafo(`Lectura presentada por el expositor: ${analisis.interpretacion}`, { cursiva: true });
  if (analisis.otros_textos.length) {
    d.subtitulo('Otros textos citados');
    analisis.otros_textos.forEach((versiculo) => d.cita(versiculo));
  }

  if (analisis.desarrollo_progresivo.length) {
    d.seccion('Desarrollo completo del mensaje');
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
    d.seccion('Enseñanzas principales');
    analisis.ensenanzas.forEach((ensenanza) => d.parrafo(`${ensenanza.sobre ? `${ensenanza.sobre}: ` : ''}${ensenanza.ensenanza}`));
  }

  if (analisis.conceptos_clave.length || analisis.conceptos_teologicos.length) {
    d.seccion('Conceptos clave');
    if (analisis.conceptos_clave.length) d.parrafo(analisis.conceptos_clave.join(' · '));
    analisis.conceptos_teologicos.forEach((concepto) => d.parrafo(`${concepto.concepto}: ${concepto.significado}`));
  }

  if (analisis.aplicacion.length) {
    d.seccion('Aplicación práctica');
    d.lista(analisis.aplicacion, true);
  }

  const preguntas = preguntasReflexion(analisis);
  if (preguntas.length) {
    d.seccion('Preguntas para estudio y reflexión personal');
    d.lista(preguntas, true);
  }

  const referencias = construirReferencias(analisis);
  if (referencias.length) {
    d.seccion('Inventario de referencias bíblicas');
    d.tablaReferencias(referencias);
    d.parrafo(notaReferencias(referencias), { color: '7A6662' });
  }

  if (analisis.conclusion) d.seccion('Conclusión').parrafo(analisis.conclusion);
  if (analisis.oracion) d.seccion('Oración').caja('Oración sugerida', analisis.oracion);
  d.seccion('Nota de fidelidad').parrafo('Las referencias verificadas se toman de la fuente abierta configurada; las pendientes deben revisarse con una fuente bíblica autorizada.', { color: '7A6662' });
  return d.blob();
}
