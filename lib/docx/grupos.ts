import type { EstudioGrupos, MetadatosPredica, PredicaAnalisis } from '../tipos.ts';
import { DocumentoWord } from './base.ts';
import { fechaLarga } from '../modalidades.ts';

export function construirWordGrupos(analisis: PredicaAnalisis, datos: EstudioGrupos, metadatos: MetadatosPredica): Promise<Blob> {
  const d = new DocumentoWord(metadatos, analisis.titulo, 'Grupos pequeños, células y familias', 'Guía lista para dirigir un encuentro participativo.');
  d.seccion('Preparación del facilitador')
    .parrafo(`Título: ${analisis.titulo}`)
    .parrafo(metadatos.predicador ? `Predicador o expositor: ${metadatos.predicador}` : 'Predicador o expositor: no proporcionado.')
    .parrafo(metadatos.fecha ? `Fecha de la prédica: ${fechaLarga(metadatos.fecha)}` : 'Fecha de la prédica: no proporcionada.')
    .parrafo(`Texto bíblico principal: ${analisis.texto_biblico_principal.cita || 'No identificado.'}`)
    .parrafo(`Duración total: ${datos.agenda.reduce((total, fila) => total + (Number.parseInt(fila.minutos, 10) || 0), 0)} minutos`);
  if (datos.objetivo) d.caja('Objetivo del encuentro', datos.objetivo);
  if (datos.idea_central) d.parrafo(`Idea central: ${datos.idea_central}`);
  if (datos.materiales.length) d.subtitulo('Materiales').lista(datos.materiales);
  if (datos.orientaciones_lider.length) d.subtitulo('Preparación y recomendaciones al líder').lista(datos.orientaciones_lider);

  d.seccion('Texto y contexto');
  d.cita(analisis.texto_biblico_principal);
  if (datos.contexto_pasaje) d.parrafo(datos.contexto_pasaje);

  if (datos.agenda.length) {
    d.seccion('Agenda de la reunión');
    d.tablaAgenda(datos.agenda);
  }

  if (datos.preguntas_inicio.length) d.seccion('Para comenzar').lista(datos.preguntas_inicio, true);
  if (datos.preguntas_comprension.length) d.seccion('Observación del texto').lista(datos.preguntas_comprension, true);
  if (datos.preguntas_reflexion.length) d.seccion('Interpretación, reflexión y aplicación').lista(datos.preguntas_reflexion, true);

  if (datos.actividad.titulo) {
    d.seccion('Actividad grupal');
    d.subtitulo(datos.actividad.titulo);
    if (datos.actividad.objetivo) d.caja('Objetivo de la actividad', datos.actividad.objetivo);
    if (datos.actividad.pasos.length) d.lista(datos.actividad.pasos, true);
  }

  if (datos.caso_practico) d.seccion('Caso práctico').caja('Para conversar en grupo', datos.caso_practico);
  if (datos.aplicaciones.length) d.seccion('Aplicaciones para la vida').lista(datos.aplicaciones);
  if (datos.compromiso_semanal) d.seccion('Compromiso de la semana').caja('Compromiso práctico', datos.compromiso_semanal);
  if (datos.motivos_oracion.length || datos.oracion_final) {
    d.seccion('Oración');
    if (datos.motivos_oracion.length) d.subtitulo('Motivos de oración').lista(datos.motivos_oracion);
    if (datos.oracion_final) d.caja('Oración final sugerida', datos.oracion_final);
  }
  d.seccion('Nota para el facilitador').parrafo(
    'Escucha antes de corregir, cuida la confidencialidad y no fuerces a nadie a compartir experiencias privadas. Este material debe revisarse pastoralmente antes de enseñarse.',
    { color: '7A6662' },
  );
  return d.blob();
}
