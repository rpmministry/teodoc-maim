import type { ClaseNinos, MetadatosPredica, PredicaAnalisis } from '../tipos.ts';
import { obtenerRangoEdad } from '../modalidades.ts';
import { DocumentoPDF, fechaDocumento, type RecursosPdf } from './base.ts';
import { fuentePredica, metadatosDocumento, referenciasUnicas } from './comunes.ts';

export function construirPdfNinos(
  analisis: PredicaAnalisis,
  ninos: ClaseNinos,
  metadatos: MetadatosPredica,
  recursos: RecursosPdf,
): Blob {
  const meta = metadatosDocumento(analisis, metadatos);
  const edad = obtenerRangoEdad(metadatos.rangoEdad);
  const d = new DocumentoPDF(meta, 'Clase infantil', recursos);
  d.portada({
    etiqueta: 'Clase bíblica infantil',
    titulo: analisis.titulo,
    descripcion: `Clase bíblica adaptada${edad ? ` para niños de ${edad}` : ''}, con relato, actividad, juego y guía para el maestro.`,
    fechaDocumento: fechaDocumento(meta),
    edad,
  });

  d.tituloSeccion('Datos de la clase', '01');
  d.ficha([
    ...fuentePredica(analisis, metadatos),
    ...(edad ? [{ etiqueta: 'Rango de edad', valor: edad }] : []),
    ...(ninos.duracion_aproximada ? [{ etiqueta: 'Duración aproximada', valor: ninos.duracion_aproximada }] : []),
  ]);
  if (ninos.objetivo_aprendizaje) {
    d.caja(ninos.objetivo_aprendizaje, { etiqueta: 'Objetivo de aprendizaje', tamano: 11.5 });
  }

  if (ninos.versiculo_clave.cita || ninos.versiculo_clave.texto || ninos.explicacion_versiculo) {
    d.tituloSeccion('El versículo que aprenderemos', '02');
    if (ninos.versiculo_clave.cita || ninos.versiculo_clave.texto) d.cita(ninos.versiculo_clave);
    if (ninos.explicacion_versiculo) {
      d.caja(ninos.explicacion_versiculo, { tono: 'crema', etiqueta: 'Explicación sencilla' });
    }
  }

  if (ninos.relato.length) {
    d.tituloSeccion('El relato bíblico', '03');
    d.parrafo('Para el maestro: narra con calma, usando tus propias palabras y manteniendo el sentido del texto bíblico. Las analogías son solo ayudas didácticas.', { tamano: 9, color: [122, 102, 98] });
    for (const parte of ninos.relato) {
      const etiqueta = [parte.parte, parte.titulo].filter(Boolean).join(' · ');
      if (etiqueta) d.subtitulo(etiqueta, [181, 48, 59]);
      if (parte.texto) d.parrafo(parte.texto, { tamano: 11.5, interlineado: 17 });
    }
  }

  if (ninos.preguntas_comprension.length) {
    d.tituloSeccion('Preguntas para comprender', '04');
    d.lista(ninos.preguntas_comprension, { numerada: true });
  }

  if (ninos.actividad.titulo || ninos.actividad.pasos.length) {
    d.tituloSeccion('Actividad didáctica', '05');
    if (ninos.actividad.titulo) d.subtitulo(ninos.actividad.titulo, [181, 48, 59]);
    if (ninos.actividad.objetivo) d.caja(ninos.actividad.objetivo, { tono: 'crema', etiqueta: 'Para el maestro: objetivo' });
    if (ninos.actividad.materiales.length) {
      d.subtitulo('Materiales');
      d.lista(ninos.actividad.materiales);
    }
    if (ninos.actividad.pasos.length) {
      d.subtitulo('Paso a paso');
      d.lista(ninos.actividad.pasos, { numerada: true });
    }
  }

  if (ninos.juego.titulo || ninos.juego.pasos.length) {
    d.tituloSeccion('Juego o dinámica', '06');
    if (ninos.juego.titulo) d.subtitulo(ninos.juego.titulo, [181, 48, 59]);
    if (ninos.juego.materiales.length) {
      d.subtitulo('Materiales');
      d.lista(ninos.juego.materiales);
    }
    if (ninos.juego.pasos.length) {
      d.subtitulo('Cómo jugar');
      d.lista(ninos.juego.pasos, { numerada: true });
    }
  }

  if (ninos.aplicacion) {
    d.tituloSeccion('Lo que puedo vivir hoy', '07');
    d.caja(ninos.aplicacion, { tono: 'coral', etiqueta: 'Aplicación para el niño', tamano: 11.5 });
  }

  if (ninos.actividad_familia) {
    d.tituloSeccion('Para compartir en familia', '08');
    d.caja(ninos.actividad_familia, { etiqueta: 'Actividad para la casa', tamano: 10.5 });
  }

  if (ninos.oracion_cierre) {
    d.tituloSeccion('Oración de cierre', '09');
    d.caja(ninos.oracion_cierre, { etiqueta: 'Oración sencilla', tamano: 11 });
  }

  if (ninos.recomendaciones_maestro.length) {
    d.tituloSeccion('Guía para el maestro', '10');
    d.parrafo('Estas orientaciones son para el adulto responsable, no para leerlas a los niños.', { tamano: 9, color: [122, 102, 98] });
    d.lista(ninos.recomendaciones_maestro, { numerada: true });
  }

  const referencias = referenciasUnicas(analisis);
  if (referencias.length) {
    d.tituloSeccion('Referencias bíblicas', '11');
    d.chips(referencias);
  }

  d.tituloSeccion('Nota de cuidado', '12');
  d.parrafo(
    'No se sugiere ningún material peligroso, dinámica humillante ni mensaje que genere miedo o culpa innecesaria. Verifica los materiales y adapta las actividades a las necesidades y edades de los niños. La clase debe acompañarse de supervisión de un adulto responsable.',
    { tamano: 9, color: [122, 102, 98] },
  );

  return d.finalizar('Clase infantil');
}
