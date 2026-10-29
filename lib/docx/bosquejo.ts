import type { EstudioBosquejo, MetadatosPredica, PredicaAnalisis } from '../tipos.ts';
import { DocumentoWord } from './base.ts';
import { NOTA_VERIFICACION } from '../referencias.ts';
import { fechaLarga } from '../modalidades.ts';

export function construirWordBosquejo(
  analisis: PredicaAnalisis,
  datos: EstudioBosquejo,
  metadatos: MetadatosPredica,
): Promise<Blob> {
  const d = new DocumentoWord(
    metadatos,
    datos.titulo || analisis.titulo,
    'Bosquejo ministerial y homilético',
    'Bosquejo expositivo y ministerial estructurado para la predicación, enseñanza y dirección pastoral.',
  );

  d.seccion('Datos de la enseñanza y fundamento doctrinal')
    .parrafo(`Título: ${datos.titulo || analisis.titulo}`)
    .parrafo(metadatos.predicador ? `Predicador o expositor: ${metadatos.predicador}` : 'Predicador o expositor: no proporcionado.')
    .parrafo(metadatos.fecha ? `Fecha de la prédica: ${fechaLarga(metadatos.fecha)}` : 'Fecha de la prédica: no proporcionada.')
    .parrafo(`Tema central: ${datos.tema_central || analisis.tema_principal || 'No definido.'}`)
    .parrafo(`Propósito general: ${datos.proposito_general || analisis.proposito || 'No definido.'}`);

  if (datos.tesis) d.caja('Tesis / Idea central', datos.tesis);
  if (datos.fundamento_doctrinal) d.caja('Fundamento doctrinal', datos.fundamento_doctrinal);

  if (datos.objetivos) {
    d.seccion('Objetivos de aprendizaje y ministración');
    if (datos.objetivos.cognitivo) d.parrafo(`• Cognitivo (Saber): ${datos.objetivos.cognitivo}`);
    if (datos.objetivos.afectivo) d.parrafo(`• Afectivo (Sentir): ${datos.objetivos.afectivo}`);
    if (datos.objetivos.volitivo) d.parrafo(`• Volitivo (Hacer): ${datos.objetivos.volitivo}`);
  }

  const textoBase = (datos.texto_base && (datos.texto_base.cita || datos.texto_base.texto))
    ? datos.texto_base
    : analisis.texto_biblico_principal;
  if (textoBase.cita || textoBase.texto) {
    d.seccion('Texto bíblico base');
    d.cita(textoBase);
  }

  if (datos.introduccion) {
    d.seccion('Introducción homilética');
    if (datos.introduccion.gancho) {
      d.subtitulo('Gancho / Captación de atención');
      d.parrafo(datos.introduccion.gancho);
    }
    if (datos.introduccion.contexto) {
      d.subtitulo('Contexto bíblico e histórico');
      d.parrafo(datos.introduccion.contexto);
    }
    if (datos.introduccion.transicion) {
      d.caja('Transición hacia el cuerpo del mensaje', datos.introduccion.transicion);
    }
  }

  if (datos.puntos_principales?.length) {
    d.seccion('Cuerpo y desarrollo homilético');
    datos.puntos_principales.forEach((punto, idx) => {
      const romano = punto.romano || `PUNTO ${idx + 1}`;
      d.subtitulo(`${romano}. ${punto.titulo}${punto.cita ? ` (${punto.cita})` : ''}`);
      if (punto.texto_cita) {
        d.cita({ cita: punto.cita, texto: punto.texto_cita });
      }
      if (punto.exposicion) {
        d.parrafo(punto.exposicion);
      }
      if (punto.subpuntos?.length) {
        punto.subpuntos.forEach((sub) => {
          const letra = sub.letra || '•';
          d.parrafo(`${letra}. ${sub.titulo}`, { negrita: true });
          if (sub.desarrollo) d.parrafo(sub.desarrollo);
          if (sub.detalles?.length) d.lista(sub.detalles);
          if (sub.pasajes_apoyo?.length) {
            d.parrafo(`Pasajes bíblicos de apoyo: ${sub.pasajes_apoyo.join(', ')}`, { cursiva: true, color: '7A6662' });
          }
        });
      }
      if (punto.ilustracion) {
        d.caja(`Ilustración / Metáfora (${romano})`, punto.ilustracion);
      }
      if (punto.transicion) {
        d.parrafo(`Transición: ${punto.transicion}`, { cursiva: true, color: '7A6662' });
      }
    });
  }

  if (datos.conclusion) {
    d.seccion('Conclusión');
    if (datos.conclusion.recapitulacion) {
      d.subtitulo('Recapitulación');
      d.parrafo(datos.conclusion.recapitulacion);
    }
    if (datos.conclusion.climax) {
      d.caja('Clímax espiritual y llamado', datos.conclusion.climax);
    }
  }

  if (datos.aplicacion_liderazgo?.length) {
    d.seccion('Aplicación pastoral para el liderazgo de MAIM');
    d.lista(datos.aplicacion_liderazgo, true);
  }

  if (datos.desafio_final) {
    d.seccion('Desafío final y ministración');
    if (datos.desafio_final.llamado) {
      d.parrafo(datos.desafio_final.llamado);
    }
    if (datos.desafio_final.oracion_ministracion) {
      d.caja('Oración de ministración pastoral', datos.desafio_final.oracion_ministracion);
    }
  }

  d.seccion('Nota de fidelidad pastoral').parrafo(
    'Este bosquejo ministerial ha sido estructurado en fidelidad estricta al contenido de la enseñanza recibida, sin añadir doctrinas ajenas. Todo el contenido es una guía para el liderazgo de MAIM Casa de Oración.',
    { color: '7A6662' },
  ).parrafo(NOTA_VERIFICACION, { color: '7A6662' });

  return d.blob();
}
