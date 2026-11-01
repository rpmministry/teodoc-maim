import type { EstudioCasa2, MetadatosPredica, PredicaAnalisis } from '../tipos.ts';
import { DocumentoPDF, fechaDocumento, type RecursosPdf } from './base.ts';
import { fuentePredica, metadatosDocumento, referenciasUnicas } from './comunes.ts';

export function construirPdfCasa2(
  analisis: PredicaAnalisis,
  casa2: EstudioCasa2,
  metadatos: MetadatosPredica,
  recursos: RecursosPdf,
): Blob {
  const meta = metadatosDocumento(analisis, metadatos);
  const d = new DocumentoPDF(meta, 'Casa2', recursos);
  d.portada({
    etiqueta: 'Casa2 — Análisis especializado para matrimonios',
    titulo: casa2.titulo_tema || analisis.titulo,
    descripcion: 'Orientación bíblica, comunicación conyugal, preguntas de diálogo íntimo y herramientas prácticas para el matrimonio.',
    fechaDocumento: fechaDocumento(meta),
  });

  d.tituloSeccion('Datos de la prédica', '01');
  d.ficha(fuentePredica(analisis, metadatos));

  d.tituloSeccion('Fundamento bíblico y propósito de Casa2', '02');
  if (casa2.idea_central) {
    d.caja(casa2.idea_central, { etiqueta: 'Idea central para el matrimonio', tamano: 11 });
  }

  const textoBase = casa2.fundamento_biblico?.texto_base?.cita ? casa2.fundamento_biblico.texto_base : analisis.texto_biblico_principal;
  if (textoBase && (textoBase.cita || textoBase.texto)) {
    d.subtitulo('Pasaje bíblico central');
    d.cita(textoBase);
  }

  if (casa2.fundamento_biblico?.contexto_matrimonial) {
    d.subtitulo('Contexto y aplicación al pacto conyugal');
    d.parrafo(casa2.fundamento_biblico.contexto_matrimonial, { tamano: 11, interlineado: 16 });
  }

  if (casa2.fundamento_biblico?.textos_apoyo?.length) {
    d.subtitulo('Pasajes bíblicos complementarios');
    for (const v of casa2.fundamento_biblico.textos_apoyo) {
      d.cita(v, { compacta: true });
    }
  }

  if (casa2.aplicacion_matrimonial.length) {
    d.tituloSeccion('Aplicación a la vida matrimonial', '03');
    d.parrafo('Principios prácticos para conectar la enseñanza con la convivencia diaria:', { tamano: 9.5, color: [122, 102, 98] });
    d.lista(casa2.aplicacion_matrimonial);
  }

  if (casa2.comunicacion) {
    d.tituloSeccion('Fortalecimiento de la comunicación', '04');
    if (casa2.comunicacion.principios?.length) {
      d.subtitulo('Principios para el diálogo conyugal');
      d.lista(casa2.comunicacion.principios);
    }
    if (casa2.comunicacion.ejercicio_dialogo?.titulo) {
      d.asegurar(140);
      d.subtitulo(`Ejercicio de diálogo: ${casa2.comunicacion.ejercicio_dialogo.titulo}`);
      if (casa2.comunicacion.ejercicio_dialogo.objetivo) {
        d.caja(casa2.comunicacion.ejercicio_dialogo.objetivo, { tono: 'crema', etiqueta: 'Objetivo de la conversación' });
      }
      if (casa2.comunicacion.ejercicio_dialogo.pasos?.length) {
        d.lista(casa2.comunicacion.ejercicio_dialogo.pasos, { numerada: true });
      }
    }
  }

  if (casa2.reflexion_individual.length || casa2.reflexion_pareja.length) {
    d.tituloSeccion('Preguntas de reflexión e introspección', '05');
    if (casa2.reflexion_individual.length) {
      d.subtitulo('Reflexión individual (Examen del corazón)');
      d.parrafo('Preguntas para que cada cónyuge examine a solas su actitud y entrega:', { tamano: 9.5, color: [122, 102, 98] });
      d.lista(casa2.reflexion_individual, { numerada: true });
    }
    if (casa2.reflexion_pareja.length) {
      d.asegurar(120);
      d.subtitulo('Conversación en pareja (Diálogo honesto y vulnerable)');
      d.parrafo('Preguntas para dialogar juntos sin juzgar, buscando entenderse mutuamente:', { tamano: 9.5, color: [122, 102, 98] });
      d.lista(casa2.reflexion_pareja, { numerada: true });
    }
  }

  if (casa2.situaciones_practicas.length) {
    d.tituloSeccion('Situaciones prácticas del matrimonio', '06');
    d.parrafo('Casos y dilemas cotidianos del hogar y cómo abordarlos con gracia bíblica:', { tamano: 9.5, color: [122, 102, 98] });
    for (let i = 0; i < casa2.situaciones_practicas.length; i++) {
      d.caja(casa2.situaciones_practicas[i], { tono: 'blanco', etiqueta: `Situación conyugal ${i + 1}` });
    }
  }

  if (casa2.actividad_juntos?.titulo) {
    d.tituloSeccion('Actividad para realizar juntos', '07');
    d.subtitulo(casa2.actividad_juntos.titulo);
    if (casa2.actividad_juntos.objetivo) {
      d.caja(casa2.actividad_juntos.objetivo, { tono: 'crema', etiqueta: 'Propósito conyugal' });
    }
    if (casa2.actividad_juntos.materiales?.length) {
      d.subtitulo('Materiales necesarios');
      d.lista(casa2.actividad_juntos.materiales);
    }
    if (casa2.actividad_juntos.pasos?.length) {
      d.subtitulo('Pasos de la actividad');
      d.lista(casa2.actividad_juntos.pasos, { numerada: true });
    }
  }

  if (casa2.compromisos.length || casa2.oracion_pareja) {
    d.tituloSeccion('Compromisos matrimoniales y oración', '08');
    if (casa2.compromisos.length) {
      d.subtitulo('Acuerdos asumidos ante Dios para esta semana');
      d.lista(casa2.compromisos);
    }
    if (casa2.oracion_pareja) {
      d.asegurar(120);
      d.subtitulo('Guía de oración en pareja');
      d.caja(casa2.oracion_pareja, { tono: 'coral', etiqueta: 'Oren juntos tomados de la mano' });
    }
  }

  d.nuevaPagina();
  d.tituloSeccion('Conclusión y orientaciones', '09');
  if (casa2.conclusion) {
    d.parrafo(casa2.conclusion, { tamano: 11, interlineado: 16 });
  }

  const salvaguarda = casa2.salvaguarda_pastoral ||
    'Este análisis conyugal ha sido elaborado con propósitos pastorales y de edificación espiritual. No sustituye la atención profesional psicológica, médica o consejería especializada en situaciones de violencia o crisis severa.';
  d.caja(salvaguarda, { tono: 'crema', etiqueta: 'Salvaguarda y cuidado pastoral', tamano: 9 });

  const referencias = referenciasUnicas(analisis);
  if (referencias.length) {
    d.subtitulo('Referencias bíblicas del mensaje');
    d.chips(referencias);
  }

  return d.finalizar('Casa2');
}
