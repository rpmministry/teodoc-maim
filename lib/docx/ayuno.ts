import type { MetadatosPredica, PlanDevocional, PredicaAnalisis } from '../tipos.ts';
import { DocumentoWord } from './base.ts';
import { fechaLarga } from '../modalidades.ts';

export function construirWordAyuno(analisis: PredicaAnalisis, plan: PlanDevocional, metadatos: MetadatosPredica): Promise<Blob> {
  const d = new DocumentoWord(metadatos, analisis.titulo, 'Ayuno del Novio', 'Itinerario espiritual de tres jornadas de humillación, búsqueda ferviente y adoración.');
  d.seccion('Propósito espiritual del Ayuno del Novio')
    .parrafo(`Título de la enseñanza: ${analisis.titulo}`)
    .parrafo(metadatos.predicador ? `Predicador o expositor: ${metadatos.predicador}` : 'Predicador o expositor: no proporcionado.')
    .parrafo(metadatos.fecha ? `Fecha de la prédica: ${fechaLarga(metadatos.fecha)}` : 'Fecha de la prédica: no proporcionada.');
  if (plan.introduccion) d.parrafo(plan.introduccion);
  if (plan.proposito) d.caja('Propósito espiritual del ayuno', plan.proposito);
  d.parrafo('Itinerario de 3 jornadas de búsqueda espiritual con lectura bíblica, reflexión, introspección, acción práctica y oración.', { color: '7A6662' });

  if (plan.dias.length < 3) {
    d.parrafo(`Este plan contiene ${plan.dias.length} de las 3 jornadas previstas. El contenido disponible no permitió completar las restantes sin inventar.`, { color: '7A6662' });
  }

  plan.dias.slice(0, 3).forEach((dia) => {
    d.saltoPagina();
    d.seccion(`Jornada ${dia.dia} de 3 · ${dia.titulo || 'Ayuno del Novio'}`);
    if (dia.tema) d.parrafo(`Tema espiritual: ${dia.tema}`, { negrita: true });
    if (dia.lectura_principal.cita || dia.lectura_principal.texto) d.cita(dia.lectura_principal);
    if (dia.lecturas_complementarias.length) {
      d.subtitulo('Lecturas bíblicas complementarias');
      dia.lecturas_complementarias.forEach((versiculo) => d.cita(versiculo));
    }
    if (dia.contexto) d.subtitulo('Contexto del pasaje').parrafo(dia.contexto);
    if (dia.reflexion) d.subtitulo('Reflexión para el ayuno').parrafo(dia.reflexion);
    if (dia.ensenanza_central) d.caja('Enseñanza central', dia.ensenanza_central);
    if (dia.pregunta_introspeccion) d.caja('Examen del alma en el ayuno', dia.pregunta_introspeccion);
    if (dia.aplicacion) d.subtitulo('Aplicación espiritual').parrafo(dia.aplicacion);
    if (dia.accion) d.caja('Disciplina y clamor de la jornada', dia.accion);
    if (dia.oracion) d.subtitulo('Oración guiada').caja('Clama con tus palabras', dia.oracion);
  });

  d.saltoPagina();
  d.seccion('Culminación del Ayuno del Novio').parrafo(
    'Al culminar las tres jornadas del Ayuno del Novio, renueva tu consagración ante el Señor. Que la unción, el quebrantamiento y la revelación recibidas se traduzcan en una vida llena del Espíritu Santo y de testimonio constante.',
  );
  return d.blob();
}

