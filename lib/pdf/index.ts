import type { MetadatosPredica, ResultadoAnalisis } from '../tipos.ts';
import { construirPdfDevocionales } from './devocionales.ts';
import { construirPdfGeneral } from './general.ts';
import { construirPdfGrupos } from './grupos.ts';
import { construirPdfJovenes } from './jovenes.ts';
import { construirPdfNinos } from './ninos.ts';
import type { RecursosPdf } from './base.ts';

export type { RecursosPdf } from './base.ts';
export { cargarRecursosPdf } from './recursos.ts';

export interface SolicitudPdf {
  analisis: ResultadoAnalisis;
  metadatos: MetadatosPredica;
  recursos?: RecursosPdf;
}

export function construirPdfGeneralDocumento({ analisis, metadatos, recursos = {} }: SolicitudPdf): Blob {
  return construirPdfGeneral(analisis, metadatos, recursos);
}

export function construirPdfModalidad({ analisis, metadatos, recursos = {} }: SolicitudPdf): Blob {
  const especializado = analisis.especializado;
  switch (metadatos.modalidad) {
    case 'general':
      return construirPdfGeneral(analisis, metadatos, recursos);
    case 'grupos':
      if (!especializado.grupos) throw new Error('El estudio para grupos no está disponible.');
      return construirPdfGrupos(analisis, especializado.grupos, metadatos, recursos);
    case 'jovenes':
      if (!especializado.jovenes) throw new Error('El estudio para jóvenes no está disponible.');
      return construirPdfJovenes(analisis, especializado.jovenes, metadatos, recursos);
    case 'ninos':
      if (!especializado.ninos) throw new Error('La clase infantil no está disponible.');
      return construirPdfNinos(analisis, especializado.ninos, metadatos, recursos);
    case 'devocionales':
      if (!especializado.devocionales) throw new Error('El plan devocional no está disponible.');
      return construirPdfDevocionales(analisis, especializado.devocionales, metadatos, recursos);
    default:
      return construirPdfGeneral(analisis, metadatos, recursos);
  }
}
