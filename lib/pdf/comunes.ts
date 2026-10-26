import type { MetadatosPredica, PredicaAnalisis, Versiculo } from '../tipos.ts';
import { fechaLarga } from '../modalidades.ts';

export function metadatosDocumento(analisis: PredicaAnalisis, metadatos: MetadatosPredica): MetadatosPredica {
  return { ...metadatos, tituloProporcionado: analisis.titulo };
}

export function fuentePredica(analisis: PredicaAnalisis, metadatos: MetadatosPredica): Array<{ etiqueta: string; valor: string }> {
  const filas: Array<{ etiqueta: string; valor: string }> = [
    { etiqueta: 'Título de la prédica', valor: analisis.titulo },
  ];
  if (metadatos.predicador) filas.push({ etiqueta: 'Predicador o expositor', valor: metadatos.predicador });
  if (metadatos.fecha) filas.push({ etiqueta: 'Fecha de la prédica', valor: fechaLarga(metadatos.fecha) });
  filas.push({ etiqueta: 'Texto bíblico principal', valor: analisis.texto_biblico_principal.cita });
  return filas;
}

export function referenciasUnicas(analisis: PredicaAnalisis): string[] {
  const lista = [
    analisis.texto_biblico_principal.cita,
    ...analisis.otros_textos.map((v) => v.cita),
    ...analisis.desarrollo_progresivo.flatMap((p) => p.versiculos.map((v) => v.cita)),
  ].filter(Boolean);
  return Array.from(new Set(lista)).slice(0, 24);
}

export function versiculosComplementarios(analisis: PredicaAnalisis): Versiculo[] {
  const vistos = new Set<string>();
  const salida: Versiculo[] = [];
  for (const versiculo of [analisis.texto_biblico_principal, ...analisis.otros_textos]) {
    const clave = `${versiculo.cita}|${versiculo.texto}`;
    if ((!versiculo.cita && !versiculo.texto) || vistos.has(clave)) continue;
    vistos.add(clave);
    salida.push(versiculo);
  }
  return salida;
}

export function descripcionCorta(analisis: PredicaAnalisis): string {
  return analisis.idea_principal || analisis.tema_principal || analisis.proposito || 'Estudio elaborado a partir de una prédica.';
}
