import type { MetadatosPredica, PredicaAnalisis } from '../tipos.ts';
import { DocumentoPDF, fechaDocumento, type RecursosPdf } from './base.ts';
import { fuentePredica, metadatosDocumento } from './comunes.ts';
import { preguntasReflexion } from '../reflexion.ts';
import { construirReferencias, NOTA_VERIFICACION } from '../referencias.ts';

export function construirPdfGeneral(analisis: PredicaAnalisis, metadatos: MetadatosPredica, recursos: RecursosPdf): Blob {
  const meta = metadatosDocumento(analisis, metadatos);
  const d = new DocumentoPDF(meta, 'Análisis general', recursos);
  d.portada({
    etiqueta: 'Análisis general',
    titulo: analisis.titulo,
    descripcion: 'Análisis bíblico y teológico del mensaje, con su desarrollo, referencias y aplicaciones.',
    fechaDocumento: fechaDocumento(meta),
  });

  d.tituloSeccion('Identificación del mensaje', '01');
  d.ficha(fuentePredica(analisis, metadatos));

  d.tituloSeccion('Idea central y propósito', '02');
  if (analisis.idea_principal) {
    d.caja(analisis.idea_principal, { etiqueta: 'Idea central del mensaje', tamano: 11.5 });
  }
  if (analisis.tema_principal) d.parrafo(`Tema principal: ${analisis.tema_principal}`, { negrita: false });
  if (analisis.proposito) d.parrafo(`Propósito: ${analisis.proposito}`);
  if (analisis.contexto_general) d.parrafo(`Contexto general: ${analisis.contexto_general}`);

  const tieneTexto = analisis.texto_biblico_principal.cita || analisis.texto_biblico_principal.texto;
  if (tieneTexto || analisis.contexto_biblico || analisis.contexto_historico || analisis.contexto_literario || analisis.relacion_textos || analisis.interpretacion) {
    d.tituloSeccion('Fundamento bíblico', '03');
    if (tieneTexto) d.cita(analisis.texto_biblico_principal);
    if (analisis.contexto_biblico) {
      d.subtitulo('Contexto del pasaje');
      d.parrafo(analisis.contexto_biblico);
    }
    if (analisis.contexto_historico) {
      d.subtitulo('Contexto histórico');
      d.parrafo(analisis.contexto_historico);
    }
    if (analisis.contexto_literario) {
      d.subtitulo('Contexto literario');
      d.parrafo(analisis.contexto_literario);
    }
    if (analisis.relacion_textos) {
      d.subtitulo('Relación entre los textos');
      d.parrafo(analisis.relacion_textos);
    }
    if (analisis.interpretacion) {
      d.subtitulo('Lectura presentada por el expositor');
      d.parrafo(analisis.interpretacion, { cursiva: true, color: [75, 55, 53] });
    }
    if (analisis.otros_textos.length) {
      d.subtitulo('Otros textos citados');
      for (const versiculo of analisis.otros_textos.slice(0, 8)) d.cita(versiculo, { compacta: true });
    }
  }

  if (analisis.desarrollo_progresivo.length) {
    d.tituloSeccion('Desarrollo del mensaje', '04');
    analisis.desarrollo_progresivo.forEach((punto, indice) => {
      const numero = String(indice + 1).padStart(2, '0');
      d.asegurar(85);
      d.subtitulo(`${numero}. ${punto.punto}`, [181, 48, 59]);
      if (punto.explicacion) d.parrafo(punto.explicacion);
      for (const subtema of punto.subtemas) {
        if (subtema.titulo) d.parrafo(subtema.titulo, { negrita: true, color: [43, 31, 30], despues: 2 });
        if (subtema.desarrollo) d.parrafo(subtema.desarrollo, { sangria: 12, despues: 6 });
      }
      for (const versiculo of punto.versiculos.slice(0, 4)) d.cita(versiculo, { compacta: true });
      if (indice < analisis.desarrollo_progresivo.length - 1) d.separador();
    });
  }

  if (analisis.ensenanzas.length) {
    d.tituloSeccion('Enseñanzas principales', '05');
    for (const ensenanza of analisis.ensenanzas) {
      d.subtitulo(ensenanza.sobre ? `Sobre ${ensenanza.sobre}` : 'Enseñanza', [181, 48, 59]);
      d.parrafo(ensenanza.ensenanza);
    }
  }

  if (analisis.conceptos_clave.length || analisis.conceptos_teologicos.length) {
    d.tituloSeccion('Conceptos clave', '06');
    if (analisis.conceptos_clave.length) d.chips(analisis.conceptos_clave);
    for (const concepto of analisis.conceptos_teologicos) {
      d.parrafo(`${concepto.concepto}: ${concepto.significado}`);
    }
  }

  if (analisis.aplicacion.length) {
    d.tituloSeccion('Aplicación práctica', '07');
    d.lista(analisis.aplicacion, { numerada: true });
  }

  const preguntas = preguntasReflexion(analisis);
  if (preguntas.length) {
    d.tituloSeccion('Para reflexionar', '08');
    d.lista(preguntas, { numerada: true });
  }

  if (analisis.conclusion) {
    d.tituloSeccion('Conclusión del estudio', '09');
    d.caja(analisis.conclusion, { tono: 'crema', tamano: 11 });
  }

  if (analisis.oracion) {
    d.tituloSeccion('Oración', '10');
    d.caja(analisis.oracion, { tono: 'coral', etiqueta: 'Oración sugerida', tamano: 10.5 });
  }

  const referencias = construirReferencias(analisis);
  if (referencias.length) {
    d.tituloSeccion('Inventario de referencias bíblicas', '11');
    d.inventarioReferencias(referencias);
    d.parrafo(NOTA_VERIFICACION, { tamano: 8.5, color: [122, 102, 98] });
  }

  d.parrafo(
    'Este documento distingue el contenido de la prédica de las explicaciones y aplicaciones editoriales. Las afirmaciones deben revisarse pastoralmente antes de su uso.',
    { tamano: 8.5, color: [122, 102, 98] },
  );

  return d.finalizar('Análisis general');
}
