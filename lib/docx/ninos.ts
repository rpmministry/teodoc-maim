import type { ClaseNinos, MetadatosPredica, PredicaAnalisis } from '../tipos.ts';
import { DocumentoWord } from './base.ts';
import { NOTA_VERIFICACION } from '../referencias.ts';
import { fechaLarga, obtenerRangoEdad } from '../modalidades.ts';

export function construirWordNinos(analisis: PredicaAnalisis, datos: ClaseNinos, metadatos: MetadatosPredica): Promise<Blob> {
  const edad = obtenerRangoEdad(metadatos.rangoEdad);
  const d = new DocumentoWord(metadatos, analisis.titulo, 'Clase bíblica infantil', `Clase bíblica adaptada${edad ? ` para niños de ${edad}` : ''}.`);
  d.seccion('Ficha del maestro')
    .parrafo(`Título: ${analisis.titulo}`)
    .parrafo(edad ? `Edad objetivo: ${edad}` : 'Edad objetivo: no especificada.')
    .parrafo(datos.duracion_aproximada ? `Duración: ${datos.duracion_aproximada}` : 'Duración: no especificada.')
    .parrafo(metadatos.predicador ? `Predicador o expositor: ${metadatos.predicador}` : 'Predicador o expositor: no proporcionado.')
    .parrafo(metadatos.fecha ? `Fecha de la prédica: ${fechaLarga(metadatos.fecha)}` : 'Fecha de la prédica: no proporcionada.')
    .parrafo(`Texto bíblico principal: ${analisis.texto_biblico_principal.cita || 'No identificado.'}`);
  if (datos.objetivo_aprendizaje) d.caja('Objetivo de aprendizaje', datos.objetivo_aprendizaje);

  d.seccion('Enseñanza');
  d.cita(analisis.texto_biblico_principal);
  if (datos.versiculo_clave.cita || datos.versiculo_clave.texto) {
    d.subtitulo('Versículo para memorizar');
    d.cita(datos.versiculo_clave);
  }
  if (datos.explicacion_versiculo) d.parrafo(datos.explicacion_versiculo);
  if (datos.relato.length) {
    d.subtitulo('Relato bíblico');
    datos.relato.forEach((parte) => {
      d.parrafo(`${parte.parte}${parte.titulo ? ` · ${parte.titulo}` : ''}`, { negrita: true, color: 'B5303B' });
      if (parte.texto) d.parrafo(parte.texto);
    });
  }
  if (datos.preguntas_comprension.length) d.seccion('Preguntas para comprender').lista(datos.preguntas_comprension, true);

  if (datos.actividad.titulo) {
    d.seccion('Actividad central');
    d.subtitulo(datos.actividad.titulo);
    if (datos.actividad.objetivo) d.caja('Para el maestro: objetivo', datos.actividad.objetivo);
    if (datos.actividad.materiales.length) d.lista(datos.actividad.materiales);
    if (datos.actividad.pasos.length) d.lista(datos.actividad.pasos, true);
  }
  if (datos.juego.titulo) {
    d.seccion('Juego o dinámica');
    d.subtitulo(datos.juego.titulo);
    if (datos.juego.materiales.length) d.lista(datos.juego.materiales);
    if (datos.juego.pasos.length) d.lista(datos.juego.pasos, true);
  }

  if (datos.aplicacion) d.seccion('Aplicación para el niño').caja('Lo que puedo vivir hoy', datos.aplicacion);
  if (datos.actividad_familia) d.seccion('Actividad para la familia').caja('Para compartir en casa', datos.actividad_familia);
  if (datos.oracion_cierre) d.seccion('Cierre').caja('Oración adaptada a la edad', datos.oracion_cierre);
  if (datos.recomendaciones_maestro.length) d.seccion('Guion y recomendaciones para el maestro').lista(datos.recomendaciones_maestro, true);
  d.seccion('Salvaguardas infantiles').parrafo(
    'No se sugieren actividades peligrosas, costosas, humillantes ni mensajes que generen miedo o culpa desproporcionada. Verifica los materiales y adapta la clase a las capacidades de los niños. Un adulto responsable debe supervisar la actividad.',
    { color: '7A6662' },
  ).parrafo(NOTA_VERIFICACION, { color: '7A6662' });
  return d.blob();
}
