import type { EstudioBosquejo, MetadatosPredica, PredicaAnalisis } from '../tipos.ts';
import { DocumentoPDF, fechaDocumento, type RecursosPdf } from './base.ts';
import { NOTA_VERIFICACION } from '../referencias.ts';
import { fuentePredica, metadatosDocumento, referenciasUnicas } from './comunes.ts';

export function construirPdfBosquejo(
  analisis: PredicaAnalisis,
  bosquejo: EstudioBosquejo,
  metadatos: MetadatosPredica,
  recursos: RecursosPdf,
): Blob {
  const meta = metadatosDocumento(analisis, metadatos);
  const d = new DocumentoPDF(meta, 'Bosquejo ministerial', recursos);
  d.portada({
    etiqueta: 'Bosquejo ministerial y homilético',
    titulo: bosquejo.titulo || analisis.titulo,
    descripcion: 'Estructura homilética y directrices de ministración para el liderazgo de MAIM.',
    fechaDocumento: fechaDocumento(meta),
  });

  // 01. Datos de la enseñanza
  d.tituloSeccion('Datos de la enseñanza', '01');
  d.ficha(fuentePredica(analisis, metadatos));

  // 02. Fundamento homilético y doctrinal
  d.tituloSeccion('Fundamento homilético y doctrinal', '02');
  if (bosquejo.tema_central) d.parrafo(`Tema central: ${bosquejo.tema_central}`, { negrita: true, despues: 6 });
  if (bosquejo.proposito_general) d.parrafo(`Propósito general: ${bosquejo.proposito_general}`, { despues: 8 });
  if (bosquejo.tesis) d.caja(bosquejo.tesis, { tono: 'coral', etiqueta: 'Tesis / Idea central' });
  if (bosquejo.fundamento_doctrinal) d.caja(bosquejo.fundamento_doctrinal, { tono: 'crema', etiqueta: 'Fundamento doctrinal' });

  // 03. Objetivos de aprendizaje y ministración
  d.tituloSeccion('Objetivos de aprendizaje y ministración', '03');
  if (bosquejo.objetivos) {
    if (bosquejo.objetivos.cognitivo) d.parrafo(`• Cognitivo (Saber): ${bosquejo.objetivos.cognitivo}`, { despues: 4 });
    if (bosquejo.objetivos.afectivo) d.parrafo(`• Afectivo (Sentir): ${bosquejo.objetivos.afectivo}`, { despues: 4 });
    if (bosquejo.objetivos.volitivo) d.parrafo(`• Volitivo (Hacer): ${bosquejo.objetivos.volitivo}`, { despues: 6 });
  }

  // 04. Texto bíblico base
  const textoBase = (bosquejo.texto_base && (bosquejo.texto_base.cita || bosquejo.texto_base.texto))
    ? bosquejo.texto_base
    : analisis.texto_biblico_principal;
  if (textoBase.cita || textoBase.texto) {
    d.tituloSeccion('Texto bíblico base', '04');
    d.cita(textoBase);
    if (analisis.otros_textos?.length) {
      d.subtitulo('Textos complementarios');
      for (const versiculo of analisis.otros_textos.slice(0, 6)) {
        d.cita(versiculo, { compacta: true });
      }
    }
  }

  // 05. Introducción homilética
  if (bosquejo.introduccion) {
    d.tituloSeccion('Introducción homilética', '05');
    if (bosquejo.introduccion.gancho) {
      d.subtitulo('Gancho y captación de atención');
      d.parrafo(bosquejo.introduccion.gancho);
    }
    if (bosquejo.introduccion.contexto) {
      d.subtitulo('Contexto bíblico e histórico');
      d.parrafo(bosquejo.introduccion.contexto);
    }
    if (bosquejo.introduccion.transicion) {
      d.caja(bosquejo.introduccion.transicion, { etiqueta: 'Transición hacia los puntos principales' });
    }
  }

  // 06. Cuerpo y desarrollo del mensaje
  if (bosquejo.puntos_principales?.length) {
    d.tituloSeccion('Cuerpo y desarrollo del mensaje', '06');
    bosquejo.puntos_principales.forEach((punto, idx) => {
      d.asegurar(200);
      const encabezado = `${punto.romano || `PUNTO ${idx + 1}`}. ${punto.titulo}${punto.cita ? ` (${punto.cita})` : ''}`;
      d.subtitulo(encabezado, [181, 48, 59]);

      if (punto.texto_cita) {
        d.cita({ cita: punto.cita, texto: punto.texto_cita }, { compacta: false });
      }

      if (punto.exposicion) {
        d.parrafo(punto.exposicion);
      }

      if (punto.subpuntos?.length) {
        punto.subpuntos.forEach((sub) => {
          d.asegurar(90);
          const subEncabezado = `  ${sub.letra || '•'}. ${sub.titulo}`;
          d.parrafo(subEncabezado, { negrita: true, sangria: 10, despues: 4 });
          if (sub.desarrollo) {
            d.parrafo(sub.desarrollo, { sangria: 16 });
          }
          if (sub.detalles?.length) {
            d.lista(sub.detalles, { sangria: 20 });
          }
          if (sub.pasajes_apoyo?.length) {
            d.parrafo(`Pasajes de apoyo: ${sub.pasajes_apoyo.join(', ')}`, {
              tamano: 9,
              cursiva: true,
              sangria: 16,
              color: [122, 102, 98],
            });
          }
        });
      }

      if (punto.ilustracion) {
        d.caja(punto.ilustracion, { etiqueta: `Ilustración / Metáfora (${punto.romano || idx + 1})` });
      }

      if (punto.transicion) {
        d.parrafo(`Transición: ${punto.transicion}`, { tamano: 9.5, cursiva: true, color: [122, 102, 98], sangria: 10 });
      }

      if (idx < bosquejo.puntos_principales.length - 1) {
        d.separador();
      }
    });
  }

  // 07. Conclusión homilética
  if (bosquejo.conclusion) {
    d.tituloSeccion('Conclusión homilética', '07');
    if (bosquejo.conclusion.recapitulacion) {
      d.subtitulo('Recapitulación del mensaje');
      d.parrafo(bosquejo.conclusion.recapitulacion);
    }
    if (bosquejo.conclusion.climax) {
      d.caja(bosquejo.conclusion.climax, { tono: 'coral', etiqueta: 'Clímax espiritual e interpelación' });
    }
  }

  // 08. Aplicación pastoral para el liderazgo MAIM
  if (bosquejo.aplicacion_liderazgo?.length) {
    d.tituloSeccion('Aplicación pastoral para el liderazgo MAIM', '08');
    d.parrafo('Directrices ministeriales y aplicación eclesial para pastores, líderes y facilitadores:', { tamano: 9.5, color: [122, 102, 98] });
    d.lista(bosquejo.aplicacion_liderazgo, { numerada: true });
  }

  // 09. Desafío final y ministración
  if (bosquejo.desafio_final) {
    d.tituloSeccion('Desafío final y ministración', '09');
    if (bosquejo.desafio_final.llamado) {
      d.subtitulo('Llamado y reto congregacional');
      d.parrafo(bosquejo.desafio_final.llamado);
    }
    if (bosquejo.desafio_final.oracion_ministracion) {
      d.caja(bosquejo.desafio_final.oracion_ministracion, { tono: 'crema', etiqueta: 'Oración de ministración y consagración' });
    }
  }

  // 10. Referencias bíblicas citadas
  const referencias = referenciasUnicas(analisis);
  if (referencias.length) {
    d.tituloSeccion('Referencias bíblicas citadas', '10');
    d.chips(referencias);
  }

  // 11. Nota de verificación pastoral
  d.tituloSeccion('Nota de verificación pastoral', '11');
  d.parrafo(
    'Este bosquejo ministerial ha sido estructurado en fidelidad estricta al contenido de la enseñanza recibida. Ninguna doctrina ajena ha sido añadida. Se recomienda al líder pastoral revisar y adaptar la ministración según la necesidad específica de su congregación.',
    { tamano: 9, color: [122, 102, 98] },
  );
  d.parrafo(NOTA_VERIFICACION, { tamano: 8.5, color: [122, 102, 98] });

  return d.finalizar('Bosquejo ministerial');
}
