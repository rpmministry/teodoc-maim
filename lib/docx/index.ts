import type { MetadatosPredica, ResultadoAnalisis } from '../tipos.ts';
import { construirWordBosquejo } from './bosquejo.ts';
import { construirWordDevocionales } from './devocionales.ts';
import { construirWordGeneral } from './general.ts';
import { construirWordGrupos } from './grupos.ts';
import { construirWordJovenes } from './jovenes.ts';
import { construirWordNinos } from './ninos.ts';

export { construirWordBosquejo } from './bosquejo.ts';
export { construirWordGeneral } from './general.ts';
export { construirWordGrupos } from './grupos.ts';
export { construirWordJovenes } from './jovenes.ts';
export { construirWordNinos } from './ninos.ts';
export { construirWordDevocionales } from './devocionales.ts';

export interface SolicitudWord {
  analisis: ResultadoAnalisis;
  metadatos: MetadatosPredica;
}

export function construirWordGeneralDocumento({ analisis, metadatos }: SolicitudWord): Promise<Blob> {
  return construirWordGeneral(analisis, metadatos);
}

export function construirWordModalidad({ analisis, metadatos }: SolicitudWord): Promise<Blob> {
  const especializado = analisis.especializado;
  switch (metadatos.modalidad) {
    case 'general':
      return construirWordGeneral(analisis, metadatos);
    case 'bosquejo':
      if (!especializado.bosquejo) throw new Error('El bosquejo ministerial no está disponible.');
      return construirWordBosquejo(analisis, especializado.bosquejo, metadatos);
    case 'grupos':
      if (!especializado.grupos) throw new Error('El estudio para grupos no está disponible.');
      return construirWordGrupos(analisis, especializado.grupos, metadatos);
    case 'jovenes':
      if (!especializado.jovenes) throw new Error('El estudio para jóvenes no está disponible.');
      return construirWordJovenes(analisis, especializado.jovenes, metadatos);
    case 'ninos':
      if (!especializado.ninos) throw new Error('La clase infantil no está disponible.');
      return construirWordNinos(analisis, especializado.ninos, metadatos);
    case 'devocionales':
      if (!especializado.devocionales) throw new Error('El plan devocional no está disponible.');
      return construirWordDevocionales(analisis, especializado.devocionales, metadatos);
    default:
      return construirWordGeneral(analisis, metadatos);
  }
}
