import type { ApartadoLiderazgo, EstudioBosquejo, MetadatosPredica, PredicaAnalisis } from '../tipos.ts';
import { DocumentoPDF, fechaDocumento, type RecursosPdf } from './base.ts';
import { metadatosDocumento, referenciasUnicas } from './comunes.ts';

export function construirPdfBosquejo(
  analisis: PredicaAnalisis,
  bosquejo: EstudioBosquejo,
  metadatos: MetadatosPredica,
  recursos: RecursosPdf,
): Blob {
  const meta = metadatosDocumento(analisis, metadatos);
  const d = new DocumentoPDF(meta, 'Liderazgo', recursos);

  // Portada institucional MAIM
  d.portada({
    etiqueta: 'Liderazgo MAIM · Documento Editorial Ministerial',
    titulo: bosquejo.titulo || analisis.titulo,
    descripcion: 'Formación doctrinal, estudio expositivo y aplicación pastoral para el liderazgo ministerial de MAIM.',
    fechaDocumento: fechaDocumento(meta),
  });

  // Cabecera editorial del documento
  d.tituloSeccion('DOCUMENTO EDITORIAL DE FORMACIÓN MINISTERIAL', 'MAIM');

  // Pasaje bíblico de cabecera / Epígrafe bíblico
  const pasajeCabecera =
    bosquejo.epigrafe_biblico && (bosquejo.epigrafe_biblico.cita || bosquejo.epigrafe_biblico.texto)
      ? bosquejo.epigrafe_biblico
      : bosquejo.texto_base && (bosquejo.texto_base.cita || bosquejo.texto_base.texto)
        ? bosquejo.texto_base
        : analisis.texto_biblico_principal;

  if (pasajeCabecera && (pasajeCabecera.cita || pasajeCabecera.texto)) {
    d.cita(pasajeCabecera, { compacta: false });
  }

  // Introducción editorial integrada (cuando aplica)
  const intro =
    bosquejo.introduccion_editorial ||
    (typeof bosquejo.introduccion === 'string' ? bosquejo.introduccion : '') ||
    [bosquejo.introduccion?.gancho, bosquejo.introduccion?.contexto, bosquejo.introduccion?.transicion]
      .filter(Boolean)
      .join('\n\n');

  if (intro) {
    const parrafosIntro = intro
      .split(/\n+/)
      .map((p) => p.trim())
      .filter(Boolean);
    for (const p of parrafosIntro) {
      d.parrafo(p, { despues: 8, tamano: 10.5, interlineado: 15.5 });
    }
    d.separador();
  }

  // Apartados principales (Desarrollo temático o vivencial)
  const apartados: ApartadoLiderazgo[] =
    bosquejo.apartados && bosquejo.apartados.length > 0
      ? bosquejo.apartados
      : (bosquejo.puntos_principales || []).map((p, idx): ApartadoLiderazgo => ({
          seccion: p.romano || String.fromCharCode(65 + idx),
          titulo: p.titulo,
          cita: p.cita,
          texto_cita: p.texto_cita,
          contenido: [p.exposicion, ...(p.subpuntos || []).map((s) => `${s.titulo}: ${s.desarrollo}`)]
            .filter(Boolean)
            .join('\n\n'),
        }));

  if (apartados.length > 0) {
    apartados.forEach((apartado, idx) => {
      d.asegurar(130);
      const prefijo = apartado.seccion ? `${apartado.seccion}. ` : '';
      const encabezado = `${prefijo}${apartado.titulo}`;
      d.subtitulo(encabezado, [181, 48, 59]);

      // Pasaje bíblico vinculado al apartado
      if (apartado.texto_cita) {
        d.cita({ cita: apartado.cita || '', texto: apartado.texto_cita }, { compacta: false });
      }

      // Desarrollo editorial en párrafos continuos
      if (apartado.contenido) {
        const parrafos = apartado.contenido
          .split(/\n+/)
          .map((p) => p.trim())
          .filter(Boolean);
        for (const parrafo of parrafos) {
          d.parrafo(parrafo, { despues: 8, tamano: 10.5, interlineado: 15.5 });
        }
      }

      // Subsecciones cuando hay agrupaciones temáticas
      if (apartado.subsecciones?.length) {
        apartado.subsecciones.forEach((sub) => {
          d.asegurar(80);
          d.subtitulo(sub.titulo, [43, 31, 30]);
          const subParrafos = sub.contenido
            .split(/\n+/)
            .map((p) => p.trim())
            .filter(Boolean);
          for (const sp of subParrafos) {
            d.parrafo(sp, { despues: 7, tamano: 10, interlineado: 15 });
          }
        });
      }

      // Término en idioma original (griego / hebreo) con tipografía sobria
      if (apartado.termino_clave?.termino) {
        d.parrafo(
          `Término original: ${apartado.termino_clave.termino} — ${apartado.termino_clave.significado}. ${apartado.termino_clave.aplicacion}`,
          { cursiva: true, color: [122, 102, 98], despues: 6, sangria: 8 },
        );
      }

      // Aplicación pastoral integrada
      if (apartado.aplicacion_pastoral) {
        d.parrafo(apartado.aplicacion_pastoral, { sangria: 8, despues: 6, color: [75, 55, 53] });
      }

      if (idx < apartados.length - 1) {
        d.separador();
      }
    });
  }

  // Conclusión ministerial y exhortación pastoral
  const conclusion =
    bosquejo.conclusion_editorial ||
    (typeof bosquejo.conclusion === 'string' ? bosquejo.conclusion : '') ||
    [bosquejo.conclusion?.recapitulacion, bosquejo.conclusion?.climax].filter(Boolean).join('\n\n') ||
    bosquejo.desafio_final?.llamado;

  if (conclusion) {
    d.asegurar(100);
    d.subtitulo('CONCLUSIÓN Y EXHORTACIÓN MINISTERIAL', [181, 48, 59]);
    const parrafosConc = conclusion
      .split(/\n+/)
      .map((p) => p.trim())
      .filter(Boolean);
    for (const pc of parrafosConc) {
      d.parrafo(pc, { despues: 8, tamano: 10.5, interlineado: 15.5 });
    }
  }

  // Oración de consagración ministerial
  if (bosquejo.desafio_final?.oracion_ministracion) {
    d.asegurar(80);
    d.subtitulo('Oración de consagración ministerial', [43, 31, 30]);
    d.parrafo(bosquejo.desafio_final.oracion_ministracion, {
      cursiva: true,
      color: [75, 55, 53],
      despues: 8,
      sangria: 8,
    });
  }

  // Referencias bíblicas detectadas (como pie documental sobrio)
  const referencias = referenciasUnicas(analisis);
  if (referencias.length) {
    d.asegurar(50);
    d.parrafo('Referencias bíblicas expuestas en la enseñanza:', {
      tamano: 9,
      negrita: true,
      color: [122, 102, 98],
      despues: 4,
    });
    d.chips(referencias);
  }

  return d.finalizar('Liderazgo MAIM');
}
