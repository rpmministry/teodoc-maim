import type { MetadatosPredica, PlanDevocional, PredicaAnalisis } from '../tipos.ts';
import { DocumentoPDF, fechaDocumento, type RecursosPdf } from './base.ts';
import { NOTA_VERIFICACION } from '../referencias.ts';
import { fuentePredica, metadatosDocumento, referenciasUnicas } from './comunes.ts';

export function construirPdfDevocionales(
  analisis: PredicaAnalisis,
  plan: PlanDevocional,
  metadatos: MetadatosPredica,
  recursos: RecursosPdf,
): Blob {
  const meta = metadatosDocumento(analisis, metadatos);
  const d = new DocumentoPDF(meta, 'Devocionales', recursos);
  d.portada({
    etiqueta: 'Devocionales de siete días',
    titulo: analisis.titulo,
    descripcion: 'Un recorrido de siete jornadas para comprender, reflexionar, aplicar y consolidar el mensaje.',
    fechaDocumento: fechaDocumento(meta),
  });

  d.tituloSeccion('Datos de la prédica', '01');
  d.ficha(fuentePredica(analisis, metadatos));

  d.tituloSeccion('Introducción', '02');
  if (plan.introduccion) d.parrafo(plan.introduccion, { tamano: 11, interlineado: 16 });
  if (plan.proposito) d.caja(plan.proposito, { etiqueta: 'Propósito del plan' });
  d.caja(
    'Reserva un momento del día, en un lugar tranquilo. Lee el pasaje, subraya una frase, responde la pregunta de introspección y termina con la oración. Cada jornada se apoya en la anterior, pero también puede usarse de forma independiente.',
    { etiqueta: 'Cómo usar este plan' },
  );

  if (plan.dias.length < 7) {
    d.caja(
      `Este plan contiene ${plan.dias.length} de las 7 jornadas previstas. El contenido disponible no permitió completar las restantes sin inventar. Revisa el material y amplía el estudio con tu líder pastoral si es necesario.`,
      { tono: 'crema', etiqueta: 'Nota editorial' },
    );
  }

  plan.dias.forEach((dia, indice) => {
    d.asegurar(300);
    d.etiquetaDia(dia.dia || indice + 1, dia.titulo || `Jornada ${indice + 1}`);
    if (dia.tema) d.parrafo(`Tema: ${dia.tema}`, { negrita: true, color: [181, 48, 59], despues: 6 });
    if (dia.lectura_principal.cita || dia.lectura_principal.texto) {
      d.subtitulo('Lectura bíblica principal');
      d.cita(dia.lectura_principal);
    }
    if (dia.lecturas_complementarias.length) {
      d.subtitulo('Lecturas complementarias');
      for (const versiculo of dia.lecturas_complementarias.slice(0, 3)) d.cita(versiculo, { compacta: true });
    }
    if (dia.contexto) {
      d.subtitulo('Contexto del texto');
      d.parrafo(dia.contexto);
    }
    if (dia.reflexion) {
      d.subtitulo('Reflexión');
      d.parrafo(dia.reflexion, { tamano: 11, interlineado: 16 });
    }
    if (dia.ensenanza_central) {
      d.caja(dia.ensenanza_central, { tono: 'crema', etiqueta: 'Enseñanza central' });
    }
    if (dia.pregunta_introspeccion) {
      d.caja(dia.pregunta_introspeccion, { tono: 'coral', etiqueta: 'Pregunta para el corazón' });
    }
    if (dia.aplicacion) {
      d.subtitulo('Aplicación práctica');
      d.parrafo(dia.aplicacion);
    }
    if (dia.accion) {
      d.caja(dia.accion, { etiqueta: 'Acción o compromiso del día' });
    }
    if (dia.oracion) {
      d.asegurar(110);
      d.subtitulo('Oración sugerida');
      d.caja(dia.oracion, { etiqueta: 'Ora con tus palabras' });
    }
    d.parrafo(`Jornada ${dia.dia} de ${plan.dias.length}`, { tamano: 8.5, color: [122, 102, 98] });
  });

  d.nuevaPagina();
  d.tituloSeccion('Para cerrar el recorrido', '04');
  d.parrafo(
    'Al terminar los siete días, vuelve a leer la idea central de la prédica y anota lo que cambió en tu manera de comprenderla. Comparte tu aprendizaje con tu familia o grupo y da gracias a Dios por su Palabra.',
    { tamano: 11, interlineado: 16 },
  );
  const referencias = referenciasUnicas(analisis);
  if (referencias.length) {
    d.subtitulo('Referencias bíblicas del mensaje');
    d.chips(referencias);
  }
  d.caja(
    'Este plan distingue el texto bíblico, la reflexión editorial y la aplicación personal. Las referencias se detectaron a partir de la predicación y su texto debe verificarse con una traducción autorizada. No sustituye la lectura de la Biblia ni el acompañamiento pastoral.',
    { tamano: 9, etiqueta: 'Nota editorial' },
  );
  d.parrafo(NOTA_VERIFICACION, { tamano: 8.5, color: [122, 102, 98] });

  return d.finalizar('Devocionales de siete días');
}
