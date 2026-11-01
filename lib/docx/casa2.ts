import type { EstudioCasa2, MetadatosPredica, PredicaAnalisis } from '../tipos.ts';
import { DocumentoWord } from './base.ts';
import { fechaLarga } from '../modalidades.ts';

export function construirWordCasa2(
  analisis: PredicaAnalisis,
  casa2: EstudioCasa2,
  metadatos: MetadatosPredica,
): Promise<Blob> {
  const d = new DocumentoWord(
    metadatos,
    casa2.titulo_tema || analisis.titulo,
    'Casa2 — Matrimonios',
    'Análisis especializado para matrimonios: comunicación conyugal, acuerdos, reflexión y dinámicas prácticas.',
  );

  d.seccion('Ficha técnica y fundamento matrimonial')
    .parrafo(`Título de la enseñanza: ${analisis.titulo}`)
    .parrafo(metadatos.predicador ? `Predicador o expositor: ${metadatos.predicador}` : 'Predicador o expositor: no proporcionado.')
    .parrafo(metadatos.fecha ? `Fecha de la prédica: ${fechaLarga(metadatos.fecha)}` : 'Fecha de la prédica: no proporcionada.');

  if (casa2.idea_central) {
    d.caja('Idea central para el matrimonio', casa2.idea_central);
  }

  const textoBase = casa2.fundamento_biblico?.texto_base?.cita ? casa2.fundamento_biblico.texto_base : analisis.texto_biblico_principal;
  if (textoBase && (textoBase.cita || textoBase.texto)) {
    d.subtitulo('Pasaje bíblico central');
    d.cita(textoBase);
  }

  if (casa2.fundamento_biblico?.contexto_matrimonial) {
    d.subtitulo('Contexto y aplicación al pacto matrimonial').parrafo(casa2.fundamento_biblico.contexto_matrimonial);
  }

  if (casa2.fundamento_biblico?.textos_apoyo?.length) {
    d.subtitulo('Pasajes bíblicos complementarios');
    casa2.fundamento_biblico.textos_apoyo.forEach((v) => d.cita(v));
  }

  if (casa2.aplicacion_matrimonial.length) {
    d.seccion('Aplicación a la vida matrimonial').lista(casa2.aplicacion_matrimonial);
  }

  if (casa2.comunicacion) {
    d.seccion('Fortalecimiento de la comunicación conyugal');
    if (casa2.comunicacion.principios?.length) {
      d.subtitulo('Principios de diálogo y escucha activa').lista(casa2.comunicacion.principios);
    }
    if (casa2.comunicacion.ejercicio_dialogo?.titulo) {
      d.subtitulo(`Ejercicio de diálogo: ${casa2.comunicacion.ejercicio_dialogo.titulo}`);
      if (casa2.comunicacion.ejercicio_dialogo.objetivo) {
        d.caja('Objetivo de la conversación', casa2.comunicacion.ejercicio_dialogo.objetivo);
      }
      if (casa2.comunicacion.ejercicio_dialogo.pasos?.length) {
        d.lista(casa2.comunicacion.ejercicio_dialogo.pasos, true);
      }
    }
  }

  if (casa2.reflexion_individual.length || casa2.reflexion_pareja.length) {
    d.seccion('Preguntas de reflexión e introspección');
    if (casa2.reflexion_individual.length) {
      d.subtitulo('Reflexión individual (Examen del corazón)').lista(casa2.reflexion_individual, true);
    }
    if (casa2.reflexion_pareja.length) {
      d.subtitulo('Conversación en pareja (Diálogo honesto y acuerdos)').lista(casa2.reflexion_pareja, true);
    }
  }

  if (casa2.situaciones_practicas.length) {
    d.seccion('Situaciones prácticas del matrimonio');
    casa2.situaciones_practicas.forEach((situacion, idx) => {
      d.caja(`Situación cotidiana ${idx + 1}`, situacion);
    });
  }

  if (casa2.actividad_juntos?.titulo) {
    d.seccion('Actividad para realizar juntos');
    d.subtitulo(casa2.actividad_juntos.titulo);
    if (casa2.actividad_juntos.objetivo) {
      d.caja('Objetivo de la dinámica', casa2.actividad_juntos.objetivo);
    }
    if (casa2.actividad_juntos.materiales?.length) {
      d.subtitulo('Materiales sugeridos').lista(casa2.actividad_juntos.materiales);
    }
    if (casa2.actividad_juntos.pasos?.length) {
      d.subtitulo('Paso a paso').lista(casa2.actividad_juntos.pasos, true);
    }
  }

  if (casa2.compromisos.length || casa2.oracion_pareja) {
    d.seccion('Compromisos matrimoniales y oración');
    if (casa2.compromisos.length) {
      d.subtitulo('Compromisos prácticos de la semana').lista(casa2.compromisos);
    }
    if (casa2.oracion_pareja) {
      d.subtitulo('Guía de oración en pareja').caja('Oren juntos tomados de la mano', casa2.oracion_pareja);
    }
  }

  d.saltoPagina();
  d.seccion('Conclusión y salvaguarda pastoral');
  if (casa2.conclusion) {
    d.parrafo(casa2.conclusion);
  }
  const salvaguarda = casa2.salvaguarda_pastoral ||
    'Este análisis conyugal ha sido elaborado con propósitos pastorales y de edificación espiritual. No sustituye la atención profesional psicológica, médica o consejería especializada en situaciones de violencia o crisis severa.';
  d.caja('Salvaguarda pastoral', salvaguarda);

  return d.blob();
}

