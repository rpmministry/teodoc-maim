import type { EstudioGrupos, MetadatosPredica, PredicaAnalisis } from '../tipos.ts';
import { DocumentoPDF, fechaDocumento, type RecursosPdf } from './base.ts';
import { fuentePredica, metadatosDocumento, referenciasUnicas } from './comunes.ts';

export function construirPdfGrupos(
  analisis: PredicaAnalisis,
  grupos: EstudioGrupos,
  metadatos: MetadatosPredica,
  recursos: RecursosPdf,
): Blob {
  const meta = metadatosDocumento(analisis, metadatos);
  const d = new DocumentoPDF(meta, 'Grupos pequeños', recursos);
  d.portada({
    etiqueta: 'Grupos pequeños, células y familias',
    titulo: analisis.titulo,
    descripcion: 'Guía lista para dirigir un encuentro participativo en un hogar o grupo pequeño.',
    fechaDocumento: fechaDocumento(meta),
  });

  d.tituloSeccion('Datos de la prédica', '01');
  d.ficha(fuentePredica(analisis, metadatos));

  d.tituloSeccion('Objetivo e idea central', '02');
  if (grupos.objetivo) d.caja(grupos.objetivo, { etiqueta: 'Objetivo espiritual y formativo', tamano: 11 });
  if (grupos.idea_central) d.parrafo(`Idea central: ${grupos.idea_central}`, { negrita: false });

  if (analisis.texto_biblico_principal.cita || grupos.contexto_pasaje) {
    d.tituloSeccion('Texto bíblico y contexto', '03');
    if (analisis.texto_biblico_principal.cita || analisis.texto_biblico_principal.texto) d.cita(analisis.texto_biblico_principal);
    if (grupos.contexto_pasaje) d.parrafo(grupos.contexto_pasaje);
    if (analisis.otros_textos.length) {
      d.subtitulo('Referencias complementarias');
      for (const versiculo of analisis.otros_textos.slice(0, 5)) d.cita(versiculo, { compacta: true });
    }
  }

  if (grupos.agenda.length) {
    d.tituloSeccion('Agenda del encuentro', '04');
    d.tablaAgenda(grupos.agenda);
    d.parrafo('Ajusta los tiempos según el tamaño y el ritmo del grupo. La oración y el cierre no deben omitirse.', { tamano: 9, color: [122, 102, 98] });
  }

  if (grupos.materiales.length) {
    d.tituloSeccion('Materiales necesarios', '05');
    d.lista(grupos.materiales);
  }

  if (grupos.preguntas_inicio.length) {
    d.tituloSeccion('Para comenzar', '06');
    d.parrafo('Preguntas abiertas para conectar al grupo con el tema antes de leer el pasaje.', { tamano: 9.5, color: [122, 102, 98] });
    d.lista(grupos.preguntas_inicio, { numerada: true });
  }

  if (grupos.preguntas_comprension.length) {
    d.tituloSeccion('Comprender el texto', '07');
    d.lista(grupos.preguntas_comprension, { numerada: true });
  }

  if (grupos.preguntas_reflexion.length) {
    d.tituloSeccion('Reflexión y aplicación', '08');
    d.lista(grupos.preguntas_reflexion, { numerada: true });
  }

  if (grupos.actividad.titulo || grupos.actividad.pasos.length) {
    d.tituloSeccion('Actividad grupal', '09');
    if (grupos.actividad.titulo) d.subtitulo(grupos.actividad.titulo, [181, 48, 59]);
    if (grupos.actividad.objetivo) d.caja(grupos.actividad.objetivo, { etiqueta: 'Objetivo de la actividad' });
    if (grupos.actividad.pasos.length) {
      d.subtitulo('Paso a paso');
      d.lista(grupos.actividad.pasos, { numerada: true });
    }
  }

  if (grupos.caso_practico) {
    d.tituloSeccion('Caso práctico para conversar', '10');
    d.caja(grupos.caso_practico, { tono: 'crema' });
  }

  if (grupos.aplicaciones.length) {
    d.tituloSeccion('Aplicaciones para la vida', '11');
    d.lista(grupos.aplicaciones);
  }

  if (grupos.compromiso_semanal) {
    d.tituloSeccion('Compromiso de la semana', '12');
    d.caja(grupos.compromiso_semanal, { tono: 'coral', etiqueta: 'Compromiso práctico' });
  }

  if (grupos.motivos_oracion.length || grupos.oracion_final) {
    d.tituloSeccion('Oración', '13');
    if (grupos.motivos_oracion.length) {
      d.subtitulo('Motivos de oración');
      d.lista(grupos.motivos_oracion);
    }
    if (grupos.oracion_final) d.caja(grupos.oracion_final, { etiqueta: 'Oración final sugerida' });
  }

  if (grupos.orientaciones_lider.length) {
    d.tituloSeccion('Orientaciones para el líder', '14');
    d.lista(grupos.orientaciones_lider, { numerada: true });
  }

  const referencias = referenciasUnicas(analisis);
  if (referencias.length) {
    d.tituloSeccion('Referencias bíblicas', '15');
    d.chips(referencias);
  }

  d.tituloSeccion('Nota para el facilitador', '16');
  d.parrafo(
    'Este estudio se basa en el contenido real de la prédica. No sustituye la lectura del pasaje ni la supervisión pastoral. Si alguna afirmación no se puede sostener con el texto bíblico, detén la conversación y consulta con tu líder.',
    { tamano: 9, color: [122, 102, 98] },
  );

  return d.finalizar('Grupos pequeños');
}
