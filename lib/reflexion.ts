import type { PredicaAnalisis } from './tipos.ts';

export function preguntasReflexion(analisis: PredicaAnalisis): string[] {
  const preguntas: string[] = [];
  for (const punto of analisis.desarrollo_progresivo.slice(0, 3)) {
    if (punto.punto) {
      preguntas.push(`¿Cómo se hace visible en mi vida la verdad sobre «${punto.punto}»?`);
    }
  }
  for (const aplicacion of analisis.aplicacion.slice(0, 3)) {
    if (aplicacion) {
      preguntas.push(`¿Qué haré esta semana para vivir lo que he comprendido: «${aplicacion}»?`);
    }
  }
  return Array.from(new Set(preguntas)).slice(0, 6);
}
