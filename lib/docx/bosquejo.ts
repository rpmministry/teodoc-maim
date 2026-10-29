import type { ApartadoLiderazgo, EstudioBosquejo, MetadatosPredica, PredicaAnalisis } from '../tipos.ts';
import { DocumentoWord } from './base.ts';

export function construirWordBosquejo(
  analisis: PredicaAnalisis,
  datos: EstudioBosquejo,
  metadatos: MetadatosPredica,
): Promise<Blob> {
  const d = new DocumentoWord(
    metadatos,
    datos.titulo || analisis.titulo,
    'Liderazgo MAIM · Documento Editorial Ministerial',
    'Documento editorial de formación doctrinal, estudio expositivo y aplicación pastoral para el liderazgo de MAIM.',
  );

  // Pasaje bíblico de cabecera / Epígrafe
  const pasajeCabecera =
    datos.epigrafe_biblico && (datos.epigrafe_biblico.cita || datos.epigrafe_biblico.texto)
      ? datos.epigrafe_biblico
      : datos.texto_base && (datos.texto_base.cita || datos.texto_base.texto)
        ? datos.texto_base
        : analisis.texto_biblico_principal;

  if (pasajeCabecera && (pasajeCabecera.cita || pasajeCabecera.texto)) {
    d.cita(pasajeCabecera);
  }

  // Introducción editorial integrada
  const intro =
    datos.introduccion_editorial ||
    (typeof datos.introduccion === 'string' ? datos.introduccion : '') ||
    [datos.introduccion?.gancho, datos.introduccion?.contexto, datos.introduccion?.transicion]
      .filter(Boolean)
      .join('\n\n');

  if (intro) {
    const parrafosIntro = intro
      .split(/\n+/)
      .map((p) => p.trim())
      .filter(Boolean);
    for (const p of parrafosIntro) {
      d.parrafo(p);
    }
  }

  // Apartados principales
  const apartados: ApartadoLiderazgo[] =
    datos.apartados && datos.apartados.length > 0
      ? datos.apartados
      : (datos.puntos_principales || []).map((p, idx): ApartadoLiderazgo => ({
          seccion: p.romano || String.fromCharCode(65 + idx),
          titulo: p.titulo,
          cita: p.cita,
          texto_cita: p.texto_cita,
          contenido: [p.exposicion, ...(p.subpuntos || []).map((s) => `${s.titulo}: ${s.desarrollo}`)]
            .filter(Boolean)
            .join('\n\n'),
        }));

  if (apartados.length > 0) {
    apartados.forEach((apartado) => {
      const prefijo = apartado.seccion ? `${apartado.seccion}. ` : '';
      d.seccion(`${prefijo}${apartado.titulo}`);

      if (apartado.texto_cita) {
        d.cita({ cita: apartado.cita || '', texto: apartado.texto_cita });
      }

      if (apartado.contenido) {
        const parrafos = apartado.contenido
          .split(/\n+/)
          .map((p) => p.trim())
          .filter(Boolean);
        for (const p of parrafos) {
          d.parrafo(p);
        }
      }

      if (apartado.subsecciones?.length) {
        apartado.subsecciones.forEach((sub) => {
          d.subtitulo(sub.titulo);
          const subParrafos = sub.contenido
            .split(/\n+/)
            .map((p) => p.trim())
            .filter(Boolean);
          for (const sp of subParrafos) {
            d.parrafo(sp);
          }
        });
      }

      if (apartado.termino_clave?.termino) {
        d.parrafo(
          `Término original: ${apartado.termino_clave.termino} — ${apartado.termino_clave.significado}. Aplicación ministerial: ${apartado.termino_clave.aplicacion}`,
          { cursiva: true, color: '7A6662' },
        );
      }

      if (apartado.aplicacion_pastoral) {
        d.parrafo(apartado.aplicacion_pastoral, { cursiva: true });
      }
    });
  }

  // Conclusión ministerial
  const conclusion =
    datos.conclusion_editorial ||
    (typeof datos.conclusion === 'string' ? datos.conclusion : '') ||
    [datos.conclusion?.recapitulacion, datos.conclusion?.climax].filter(Boolean).join('\n\n') ||
    datos.desafio_final?.llamado;

  if (conclusion) {
    d.seccion('CONCLUSIÓN Y EXHORTACIÓN MINISTERIAL');
    const parrafosConc = conclusion
      .split(/\n+/)
      .map((p) => p.trim())
      .filter(Boolean);
    for (const pc of parrafosConc) {
      d.parrafo(pc);
    }
  }

  if (datos.desafio_final?.oracion_ministracion) {
    d.subtitulo('Oración de consagración ministerial');
    d.parrafo(datos.desafio_final.oracion_ministracion, { cursiva: true });
  }

  return d.blob();
}
