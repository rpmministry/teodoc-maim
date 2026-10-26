import type { EstudioJovenes, MetadatosPredica, PredicaAnalisis } from '../tipos.ts';
import { DocumentoPDF, fechaDocumento, type RecursosPdf } from './base.ts';
import { fuentePredica, metadatosDocumento, referenciasUnicas } from './comunes.ts';

export function construirPdfJovenes(
  analisis: PredicaAnalisis,
  jovenes: EstudioJovenes,
  metadatos: MetadatosPredica,
  recursos: RecursosPdf,
): Blob {
  const meta = metadatosDocumento(analisis, metadatos);
  const d = new DocumentoPDF(meta, 'Jóvenes', recursos);
  d.portada({
    etiqueta: 'Estudio para jóvenes',
    titulo: analisis.titulo,
    descripcion: 'Encuentro bíblico participativo para adolescentes y jóvenes, con reflexión, conversación y acción.',
    fechaDocumento: fechaDocumento(meta),
  });

  d.tituloSeccion('Datos de la prédica', '01');
  d.ficha(fuentePredica(analisis, metadatos));

  d.tituloSeccion('Objetivo y tema del encuentro', '02');
  if (jovenes.objetivo) d.caja(jovenes.objetivo, { etiqueta: 'Objetivo del encuentro', tamano: 11 });
  if (jovenes.tema) d.parrafo(`Tema: ${jovenes.tema}`);

  if (analisis.texto_biblico_principal.cita || jovenes.contexto_pasaje || jovenes.conceptos.length) {
    d.tituloSeccion('Pasaje y conceptos fundamentales', '03');
    if (analisis.texto_biblico_principal.cita || analisis.texto_biblico_principal.texto) d.cita(analisis.texto_biblico_principal);
    if (jovenes.contexto_pasaje) {
      d.subtitulo('Contexto del pasaje');
      d.parrafo(jovenes.contexto_pasaje);
    }
    for (const concepto of jovenes.conceptos) {
      if (concepto.concepto) d.subtitulo(concepto.concepto, [181, 48, 59]);
      if (concepto.explicacion) d.parrafo(concepto.explicacion);
    }
    if (analisis.otros_textos.length) {
      d.subtitulo('Referencias complementarias');
      for (const versiculo of analisis.otros_textos.slice(0, 5)) d.cita(versiculo, { compacta: true });
    }
  }

  if (jovenes.preguntas_reflexion.length) {
    d.tituloSeccion('Reflexión individual', '04');
    d.lista(jovenes.preguntas_reflexion, { numerada: true });
  }

  if (jovenes.preguntas_grupales.length) {
    d.tituloSeccion('Conversación grupal', '05');
    d.lista(jovenes.preguntas_grupales, { numerada: true });
  }

  if (jovenes.casos_practicos.length) {
    d.tituloSeccion('Casos para conversar', '06');
    jovenes.casos_practicos.forEach((caso, indice) => {
      d.asegurar(110);
      d.subtitulo(`Caso ${indice + 1}`, [181, 48, 59]);
      d.caja(caso, { tono: 'crema' });
    });
  }

  if (jovenes.dinamica.titulo || jovenes.dinamica.pasos.length) {
    d.tituloSeccion('Dinámica participativa', '07');
    if (jovenes.dinamica.titulo) d.subtitulo(jovenes.dinamica.titulo, [181, 48, 59]);
    if (jovenes.dinamica.objetivo) d.caja(jovenes.dinamica.objetivo, { etiqueta: 'Objetivo de la dinámica' });
    if (jovenes.dinamica.pasos.length) {
      d.subtitulo('Paso a paso');
      d.lista(jovenes.dinamica.pasos, { numerada: true });
    }
  }

  if (jovenes.aplicaciones.length) {
    d.tituloSeccion('Aplicaciones cotidianas', '08');
    d.lista(jovenes.aplicaciones);
  }

  if (jovenes.desafio_semanal) {
    d.tituloSeccion('Desafío de la semana', '09');
    d.caja(jovenes.desafio_semanal, { tono: 'coral', etiqueta: 'Compromiso semanal' });
  }

  if (jovenes.motivos_oracion.length || analisis.oracion) {
    d.tituloSeccion('Oración', '10');
    if (jovenes.motivos_oracion.length) {
      d.subtitulo('Motivos de oración');
      d.lista(jovenes.motivos_oracion);
    }
    if (analisis.oracion) d.caja(analisis.oracion, { etiqueta: 'Oración sugerida' });
  }

  if (jovenes.guia_lider.length) {
    d.tituloSeccion('Guía para el líder juvenil', '11');
    d.lista(jovenes.guia_lider, { numerada: true });
  }

  const referencias = referenciasUnicas(analisis);
  if (referencias.length) {
    d.tituloSeccion('Referencias bíblicas', '12');
    d.chips(referencias);
  }

  d.tituloSeccion('Nota para el líder', '13');
  d.parrafo(
    'Escucha antes de corregir. No fuerces a nadie a compartir experiencias personales. Si surge una situación que requiera acompañamiento pastoral, acude a tu líder o pastor. Este material distingue el mensaje bíblico de las aplicaciones editoriales.',
    { tamano: 9, color: [122, 102, 98] },
  );

  return d.finalizar('Jóvenes');
}
