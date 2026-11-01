import type { MetadatosPredica, PlanDevocional, PredicaAnalisis } from '../tipos.ts';
import { DocumentoPDF, fechaDocumento, type RecursosPdf } from './base.ts';
import { fuentePredica, metadatosDocumento, referenciasUnicas } from './comunes.ts';

export function construirPdfAyuno(
  analisis: PredicaAnalisis,
  plan: PlanDevocional,
  metadatos: MetadatosPredica,
  recursos: RecursosPdf,
): Blob {
  const meta = metadatosDocumento(analisis, metadatos);
  const d = new DocumentoPDF(meta, 'Ayuno del Novio', recursos);
  d.portada({
    etiqueta: 'Ayuno del Novio',
    titulo: analisis.titulo,
    descripcion: 'Itinerario espiritual de tres jornadas de humillación, búsqueda ferviente, consagración y adoración al Señor.',
    fechaDocumento: fechaDocumento(meta),
  });

  d.tituloSeccion('Datos de la prédica', '01');
  d.ficha(fuentePredica(analisis, metadatos));

  d.tituloSeccion('Propósito del Ayuno del Novio', '02');
  if (plan.introduccion) d.parrafo(plan.introduccion, { tamano: 11, interlineado: 16 });
  if (plan.proposito) d.caja(plan.proposito, { etiqueta: 'Propósito espiritual del ayuno' });
  d.caja(
    'Dedica este tiempo a buscar el rostro de Dios con corazón humillado y ferviente. Cada jornada aborda una etapa de la búsqueda espiritual: humillación y arrepentimiento (Día 1), hambre por Su Presencia (Día 2) y rompimiento y consagración (Día 3).',
    { etiqueta: 'Cómo realizar este itinerario' },
  );

  if (plan.dias.length < 3) {
    d.caja(
      `Este plan contiene ${plan.dias.length} de las 3 jornadas previstas. El contenido disponible no permitió completar las restantes sin inventar. Revisa el material y continúa la búsqueda pastoralmente.`,
      { tono: 'crema', etiqueta: 'Nota editorial' },
    );
  }

  plan.dias.slice(0, 3).forEach((dia, indice) => {
    d.asegurar(300);
    d.etiquetaDia(dia.dia || indice + 1, dia.titulo || `Jornada ${indice + 1}`);
    if (dia.tema) d.parrafo(`Tema espiritual: ${dia.tema}`, { negrita: true, color: [181, 48, 59], despues: 6 });
    if (dia.lectura_principal.cita || dia.lectura_principal.texto) {
      d.subtitulo('Lectura bíblica principal');
      d.cita(dia.lectura_principal);
    }
    if (dia.lecturas_complementarias.length) {
      d.subtitulo('Lecturas complementarias');
      for (const versiculo of dia.lecturas_complementarias.slice(0, 3)) d.cita(versiculo, { compacta: true });
    }
    if (dia.contexto) {
      d.subtitulo('Contexto del pasaje');
      d.parrafo(dia.contexto);
    }
    if (dia.reflexion) {
      d.subtitulo('Reflexión para el ayuno');
      d.parrafo(dia.reflexion, { tamano: 11, interlineado: 16 });
    }
    if (dia.ensenanza_central) {
      d.caja(dia.ensenanza_central, { tono: 'crema', etiqueta: 'Enseñanza central' });
    }
    if (dia.pregunta_introspeccion) {
      d.caja(dia.pregunta_introspeccion, { tono: 'coral', etiqueta: 'Examen del alma en el ayuno' });
    }
    if (dia.aplicacion) {
      d.subtitulo('Aplicación espiritual');
      d.parrafo(dia.aplicacion);
    }
    if (dia.accion) {
      d.caja(dia.accion, { etiqueta: 'Disciplina y clamor de la jornada' });
    }
    if (dia.oracion) {
      d.asegurar(110);
      d.subtitulo('Oración guiada de clamor y entrega');
      d.caja(dia.oracion, { etiqueta: 'Clama con tus palabras ante el Señor' });
    }
    d.parrafo(`Jornada ${dia.dia} de 3 · Ayuno del Novio`, { tamano: 8.5, color: [122, 102, 98] });
  });

  d.nuevaPagina();
  d.tituloSeccion('Culminación del Ayuno del Novio', '04');
  d.parrafo(
    'Al culminar las tres jornadas del Ayuno del Novio, renueva tu consagración ante el Señor. Que la unción, el quebrantamiento y la revelación recibidas se traduzcan en una vida llena del Espíritu Santo y de testimonio constante.',
    { tamano: 11, interlineado: 16 },
  );
  const referencias = referenciasUnicas(analisis);
  if (referencias.length) {
    d.subtitulo('Referencias bíblicas del mensaje');
    d.chips(referencias);
  }
  d.caja(
    'Este itinerario espiritual distingue el texto bíblico, la reflexión interiorizada y la guía devocional para consagración de la congregación.',
    { tamano: 9, etiqueta: 'Nota institucional MAIM' },
  );

  return d.finalizar('Ayuno del Novio');
}

