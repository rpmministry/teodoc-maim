import type { EstudioJovenes, MetadatosPredica, PredicaAnalisis } from '../tipos.ts';
import { DocumentoWord } from './base.ts';
import { NOTA_VERIFICACION } from '../referencias.ts';
import { fechaLarga } from '../modalidades.ts';

export function construirWordJovenes(analisis: PredicaAnalisis, datos: EstudioJovenes, metadatos: MetadatosPredica): Promise<Blob> {
  const d = new DocumentoWord(metadatos, analisis.titulo, 'Encuentro para jóvenes', 'Encuentro bíblico participativo para adolescentes y jóvenes.');
  d.seccion('Ficha del encuentro')
    .parrafo(`Título: ${analisis.titulo}`)
    .parrafo(metadatos.predicador ? `Predicador o expositor: ${metadatos.predicador}` : 'Predicador o expositor: no proporcionado.')
    .parrafo(metadatos.fecha ? `Fecha de la prédica: ${fechaLarga(metadatos.fecha)}` : 'Fecha de la prédica: no proporcionada.')
    .parrafo(`Texto bíblico principal: ${analisis.texto_biblico_principal.cita || 'No identificado.'}`);
  if (datos.objetivo) d.caja('Objetivo de aprendizaje', datos.objetivo);
  if (datos.tema) d.parrafo(`Tema: ${datos.tema}`);

  d.seccion('Lectura bíblica y contexto');
  d.cita(analisis.texto_biblico_principal);
  if (datos.contexto_pasaje) d.parrafo(datos.contexto_pasaje);

  if (datos.conceptos.length) {
    d.seccion('Conceptos teológicos necesarios');
    datos.conceptos.forEach((concepto) => d.parrafo(`${concepto.concepto}: ${concepto.explicacion}`));
  }

  if (datos.preguntas_reflexion.length) d.seccion('Preguntas de reflexión profunda').lista(datos.preguntas_reflexion, true);
  if (datos.preguntas_grupales.length) d.seccion('Conversación grupal').lista(datos.preguntas_grupales, true);

  if (datos.casos_practicos.length) {
    d.seccion('Casos prácticos hipotéticos');
    datos.casos_practicos.forEach((caso, indice) => d.caja(`Caso ${indice + 1}`, caso));
  }

  if (datos.dinamica.titulo) {
    d.seccion('Dinámica participativa');
    d.subtitulo(datos.dinamica.titulo);
    if (datos.dinamica.objetivo) d.caja('Objetivo', datos.dinamica.objetivo);
    if (datos.dinamica.pasos.length) d.lista(datos.dinamica.pasos, true);
  }

  if (datos.aplicaciones.length) d.seccion('Aplicación personal').lista(datos.aplicaciones);
  if (datos.desafio_semanal) d.seccion('Compromiso de la semana').caja('Desafío semanal', datos.desafio_semanal);
  if (datos.motivos_oracion.length || analisis.oracion) {
    d.seccion('Oración');
    if (datos.motivos_oracion.length) d.lista(datos.motivos_oracion);
    if (analisis.oracion) d.caja('Oración sugerida', analisis.oracion);
  }
  if (datos.guia_lider.length) d.seccion('Guía breve para el líder juvenil').lista(datos.guia_lider, true);
  d.seccion('Nota de cuidado').parrafo(
    'No fuerces a nadie a compartir experiencias personales. Trata los temas sensibles con respeto y deriva a un adulto de confianza o a un profesional cuando sea necesario. Los casos son hipotéticos y no representan a personas reales.',
    { color: '7A6662' },
  ).parrafo(NOTA_VERIFICACION, { color: '7A6662' });
  return d.blob();
}
