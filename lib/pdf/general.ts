import type { MetadatosPredica, PredicaAnalisis } from '../tipos.ts';
import { DocumentoPDF, fechaDocumento, type RecursosPdf } from './base.ts';
import { fuentePredica, metadatosDocumento } from './comunes.ts';
import { preguntasReflexion } from '../reflexion.ts';
import { construirReferencias, notaReferencias } from '../referencias.ts';

export function construirPdfGeneral(analisis: PredicaAnalisis, metadatos: MetadatosPredica, recursos: RecursosPdf): Blob {
  const meta = metadatosDocumento(analisis, metadatos);
  const d = new DocumentoPDF(meta, 'Análisis general', recursos);
  d.portada({
    etiqueta: 'Análisis general',
    titulo: analisis.titulo,
    descripcion: 'Análisis bíblico y teológico del mensaje estructurado según los modelos de enseñanza y predicación de MAIM.',
    fechaDocumento: fechaDocumento(meta),
  });

  // 01. FUNDAMENTO BÍBLICO E IDEA CENTRAL
  d.tituloSeccion('Fundamento bíblico e idea central', '01');

  d.subtitulo('Identificación del mensaje');
  d.ficha(fuentePredica(analisis, metadatos));

  d.subtitulo('Idea central y propósito');
  if (analisis.idea_principal) {
    d.caja(analisis.idea_principal, { etiqueta: 'Idea central del mensaje', tamano: 11.5 });
  }
  if (analisis.tema_principal) d.parrafo(`Tema principal: ${analisis.tema_principal}`, { negrita: true, despues: 4 });
  if (analisis.proposito) d.parrafo(`Propósito espiritual: ${analisis.proposito}`, { despues: 4 });
  if (analisis.contexto_general) d.parrafo(`Contexto general: ${analisis.contexto_general}`, { despues: 8 });

  const tieneTexto = analisis.texto_biblico_principal.cita || analisis.texto_biblico_principal.texto;
  if (tieneTexto || analisis.contexto_biblico || analisis.contexto_historico || analisis.contexto_literario || analisis.relacion_textos || analisis.interpretacion) {
    d.subtitulo('Fundamento bíblico');
    if (tieneTexto) d.cita(analisis.texto_biblico_principal);
    if (analisis.contexto_biblico) {
      d.parrafo(`Contexto del pasaje: ${analisis.contexto_biblico}`, { sangria: 6 });
    }
    if (analisis.contexto_historico) {
      d.parrafo(`Contexto histórico: ${analisis.contexto_historico}`, { sangria: 6 });
    }
    if (analisis.contexto_literario) {
      d.parrafo(`Contexto literario: ${analisis.contexto_literario}`, { sangria: 6 });
    }
    if (analisis.relacion_textos) {
      d.parrafo(`Relación entre los textos: ${analisis.relacion_textos}`, { sangria: 6 });
    }
    if (analisis.interpretacion) {
      d.subtitulo('Lectura y significado doctrinal');
      d.parrafo(analisis.interpretacion, { cursiva: true, color: [75, 55, 53] });
    }
    if (analisis.otros_textos.length) {
      d.subtitulo('Otros textos citados');
      for (const versiculo of analisis.otros_textos.slice(0, 8)) d.cita(versiculo, { compacta: true });
    }
  }

  // 02. CUERPO Y DESARROLLO DEL MENSAJE
  d.tituloSeccion('Cuerpo y desarrollo del mensaje', '02');
  if (analisis.desarrollo_progresivo.length) {
    d.subtitulo('Desarrollo del mensaje');
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
    d.subtitulo('Enseñanzas principales');
    for (const ensenanza of analisis.ensenanzas) {
      d.subtitulo(ensenanza.sobre ? `Sobre ${ensenanza.sobre}` : 'Enseñanza', [181, 48, 59]);
      d.parrafo(ensenanza.ensenanza);
    }
  }

  if (analisis.conceptos_clave.length || analisis.conceptos_teologicos.length) {
    d.subtitulo('Conceptos clave');
    if (analisis.conceptos_clave.length) d.chips(analisis.conceptos_clave);
    for (const concepto of analisis.conceptos_teologicos) {
      d.parrafo(`${concepto.concepto}: ${concepto.significado}`);
    }
  }

  // 03. CIERRE, APLICACIÓN Y RESPUESTA PERSONAL
  d.tituloSeccion('Cierre, aplicación y respuesta personal', '03');

  if (analisis.aplicacion.length) {
    d.subtitulo('Aplicación práctica');
    d.lista(analisis.aplicacion, { numerada: true });
  }

  const preguntas = preguntasReflexion(analisis);
  if (preguntas.length) {
    d.subtitulo('Para reflexionar');
    d.lista(preguntas, { numerada: true });
  }

  if (analisis.conclusion) {
    d.subtitulo('Conclusión del estudio');
    d.caja(analisis.conclusion, { tono: 'crema', tamano: 11 });
  }

  if (analisis.oracion) {
    d.subtitulo('Oración');
    d.caja(analisis.oracion, { tono: 'coral', etiqueta: 'Oración sugerida', tamano: 10.5 });
  }

  // APÉNDICE: INVENTARIO DE REFERENCIAS
  const referencias = construirReferencias(analisis);
  if (referencias.length) {
    d.tituloSeccion('Inventario de referencias bíblicas', 'R');
    d.inventarioReferencias(referencias);
    d.parrafo(notaReferencias(referencias), { tamano: 8.5, color: [122, 102, 98] });
  }

  d.parrafo(
    'Este documento distingue el contenido de la prédica de las explicaciones y aplicaciones editoriales. Las afirmaciones deben revisarse pastoralmente antes de su uso.',
    { tamano: 8.5, color: [122, 102, 98] },
  );

  return d.finalizar('Análisis general');
}
