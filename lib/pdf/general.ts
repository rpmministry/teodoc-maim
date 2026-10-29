import type { MetadatosPredica, PredicaAnalisis } from '../tipos.ts';
import { DocumentoPDF, fechaDocumento, type RecursosPdf } from './base.ts';
import { fuentePredica, metadatosDocumento, referenciasUnicas } from './comunes.ts';
import { preguntasReflexion } from '../reflexion.ts';

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

  // Párrafo unificado de contexto y propósito espiritual sin fragmentación
  const partesIntro: string[] = [];
  if (analisis.tema_principal) partesIntro.push(`Tema principal: ${analisis.tema_principal}.`);
  if (analisis.proposito) partesIntro.push(`Propósito espiritual: ${analisis.proposito}`);
  if (analisis.contexto_general) partesIntro.push(`Contexto general: ${analisis.contexto_general}`);
  if (partesIntro.length) {
    d.parrafo(partesIntro.join(' '), { despues: 6 });
  }

  const tieneTexto = Boolean(analisis.texto_biblico_principal?.cita || analisis.texto_biblico_principal?.texto);
  if (
    tieneTexto ||
    analisis.contexto_biblico ||
    analisis.contexto_historico ||
    analisis.contexto_literario ||
    analisis.relacion_textos ||
    analisis.interpretacion
  ) {
    d.subtitulo('Fundamento bíblico');
    if (tieneTexto) d.cita(analisis.texto_biblico_principal);

    // Integración fluida de contextos en párrafos analíticos continuos
    const contextosDetallados = [
      analisis.contexto_biblico ? `Contexto del pasaje: ${analisis.contexto_biblico}` : '',
      analisis.contexto_historico ? `Contexto histórico: ${analisis.contexto_historico}` : '',
      analisis.contexto_literario ? `Contexto literario: ${analisis.contexto_literario}` : '',
      analisis.relacion_textos ? `Relación entre los textos: ${analisis.relacion_textos}` : '',
    ]
      .filter(Boolean)
      .join(' ');

    if (contextosDetallados) {
      d.parrafo(contextosDetallados, { sangria: 4, despues: 6 });
    }

    if (analisis.interpretacion) {
      d.subtitulo('Lectura y significado doctrinal');
      d.parrafo(analisis.interpretacion, { cursiva: true, color: [75, 55, 53], despues: 6 });
    }

    if (analisis.otros_textos.length) {
      d.subtitulo('Otros textos citados');
      for (const versiculo of analisis.otros_textos.slice(0, 8)) {
        d.cita(versiculo, { compacta: true });
      }
    }
  }

  // 02. CUERPO Y DESARROLLO DEL MENSAJE (Enseñanza profunda y párrafos continuos estilo MAIM)
  d.tituloSeccion('Cuerpo y desarrollo del mensaje', '02');
  if (analisis.desarrollo_progresivo.length) {
    d.subtitulo('Desarrollo del mensaje');
    analisis.desarrollo_progresivo.forEach((punto, indice) => {
      const letra = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'][indice] || String(indice + 1);
      d.asegurar(100);
      d.subtitulo(`${letra}. ${punto.punto}`, [181, 48, 59]);

      // Versículos de apoyo citados de forma destacada
      for (const versiculo of punto.versiculos.slice(0, 4)) {
        d.cita(versiculo, { compacta: true });
      }

      // Exposición amplia y analítica en primera persona
      if (punto.explicacion) {
        d.parrafo(punto.explicacion, { despues: 6 });
      }

      // Subtemas desarrollados en flujo continuo
      for (const subtema of punto.subtemas) {
        if (subtema.titulo || subtema.desarrollo) {
          const encabezadoSub = subtema.titulo ? `${subtema.titulo}: ` : '';
          d.parrafo(`${encabezadoSub}${subtema.desarrollo}`, {
            sangria: 8,
            despues: 5,
            color: [43, 31, 30],
          });
        }
      }

      if (indice < analisis.desarrollo_progresivo.length - 1) {
        d.separador();
      }
    });
  }

  if (analisis.ensenanzas.length) {
    d.subtitulo('Enseñanzas principales');
    for (const ensenanza of analisis.ensenanzas) {
      const prefijo = ensenanza.sobre ? `Sobre ${ensenanza.sobre}: ` : '';
      d.parrafo(`${prefijo}${ensenanza.ensenanza}`, { despues: 5 });
    }
  }

  if (analisis.conceptos_clave.length || analisis.conceptos_teologicos.length) {
    d.subtitulo('Conceptos clave');
    if (analisis.conceptos_clave.length) d.chips(analisis.conceptos_clave);
    for (const concepto of analisis.conceptos_teologicos) {
      d.parrafo(`${concepto.concepto}: ${concepto.significado}`, { despues: 4 });
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
    d.caja(analisis.oracion, { tono: 'coral', etiqueta: 'Oración de consagración', tamano: 11 });
  }

  // APÉNDICE R. INVENTARIO DE REFERENCIAS BÍBLICAS
  const referencias = referenciasUnicas(analisis);
  if (referencias.length) {
    d.tituloSeccion('Inventario de referencias bíblicas', 'R');
    d.chips(referencias);
  }

  return d.finalizar('Análisis general');
}
