import type { MetadatosPredica, PlanDevocional, PredicaAnalisis } from '../tipos.ts';
import { DocumentoWord } from './base.ts';
import { NOTA_VERIFICACION } from '../referencias.ts';
import { fechaLarga } from '../modalidades.ts';

export function construirWordDevocionales(analisis: PredicaAnalisis, plan: PlanDevocional, metadatos: MetadatosPredica): Promise<Blob> {
  const d = new DocumentoWord(metadatos, analisis.titulo, 'Devocional de siete días', 'Un recorrido de siete jornadas para meditar y aplicar el mensaje.');
  d.seccion('Introducción general')
    .parrafo(`Título: ${analisis.titulo}`)
    .parrafo(metadatos.predicador ? `Predicador o expositor: ${metadatos.predicador}` : 'Predicador o expositor: no proporcionado.')
    .parrafo(metadatos.fecha ? `Fecha de la prédica: ${fechaLarga(metadatos.fecha)}` : 'Fecha de la prédica: no proporcionada.');
  if (plan.introduccion) d.parrafo(plan.introduccion);
  if (plan.proposito) d.caja('Propósito del itinerario', plan.proposito);
  d.parrafo('Tiempo diario sugerido: 15 a 20 minutos. Lee el pasaje, responde la pregunta de examen personal y termina con la oración.', { color: '7A6662' });

  if (plan.dias.length < 7) {
    d.parrafo(`Este plan contiene ${plan.dias.length} de las 7 jornadas previstas. El contenido disponible no permitió completar las restantes sin inventar.`, { color: '7A6662' });
  }

  plan.dias.forEach((dia) => {
    d.saltoPagina();
    d.seccion(`Día ${dia.dia} · ${dia.titulo || 'Jornada'}`);
    if (dia.tema) d.parrafo(`Tema: ${dia.tema}`, { negrita: true });
    if (dia.lectura_principal.cita || dia.lectura_principal.texto) d.cita(dia.lectura_principal);
    if (dia.lecturas_complementarias.length) {
      d.subtitulo('Lecturas complementarias');
      dia.lecturas_complementarias.forEach((versiculo) => d.cita(versiculo));
    }
    if (dia.contexto) d.subtitulo('Contexto del pasaje').parrafo(dia.contexto);
    if (dia.reflexion) d.subtitulo('Reflexión').parrafo(dia.reflexion);
    if (dia.ensenanza_central) d.caja('Enseñanza central', dia.ensenanza_central);
    if (dia.pregunta_introspeccion) d.caja('Pregunta de examen personal', dia.pregunta_introspeccion);
    if (dia.aplicacion) d.subtitulo('Aplicación práctica').parrafo(dia.aplicacion);
    if (dia.accion) d.caja('Acción concreta del día', dia.accion);
    if (dia.oracion) d.subtitulo('Oración sugerida').caja('Ora con tus palabras', dia.oracion);
  });

  d.saltoPagina();
  d.seccion('Cierre del itinerario').parrafo(
    'Al terminar los siete días, vuelve a leer la idea central y anota lo que cambió en tu comprensión. Comparte tu aprendizaje con tu familia o grupo y da gracias a Dios por su Palabra.',
  );
  d.parrafo('Las referencias se detectaron a partir de la predicación. Su texto debe verificarse con una traducción autorizada antes de reproducirlo.', { color: '7A6662' });
  d.parrafo(NOTA_VERIFICACION, { color: '7A6662' });
  return d.blob();
}
