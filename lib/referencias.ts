import type { PredicaAnalisis, Versiculo } from './tipos.ts';

export interface ReferenciaDetectada {
  cita: string;
  texto: string;
  tipoUso: 'lectura_o_cita' | 'referencia_detectada';
  confianza: 'media' | 'baja';
  estado: 'pendiente_de_verificacion';
  traduccion: string;
  fuente: string;
}

export const NOTA_VERIFICACION =
  'Las referencias se detectaron a partir del análisis de la transcripción. Su texto y su traducción deben verificarse con una fuente bíblica autorizada antes de su publicación o reproducción.';

export function construirReferencias(analisis: PredicaAnalisis): ReferenciaDetectada[] {
  const fuentes: Array<{ versiculo: Versiculo; tipoUso: ReferenciaDetectada['tipoUso']; confianza: ReferenciaDetectada['confianza'] }> = [
    { versiculo: analisis.texto_biblico_principal, tipoUso: 'lectura_o_cita', confianza: 'media' },
    ...analisis.otros_textos.map((versiculo) => ({ versiculo, tipoUso: 'referencia_detectada' as const, confianza: 'media' as const })),
    ...analisis.desarrollo_progresivo.flatMap((punto) =>
      punto.versiculos.map((versiculo) => ({ versiculo, tipoUso: 'referencia_detectada' as const, confianza: 'baja' as const })),
    ),
  ];

  const vistos = new Set<string>();
  const resultado: ReferenciaDetectada[] = [];
  for (const { versiculo, tipoUso, confianza } of fuentes) {
    const cita = versiculo.cita.trim();
    if (!cita) continue;
    const clave = cita.toLowerCase();
    if (vistos.has(clave)) continue;
    vistos.add(clave);
    resultado.push({
      cita,
      texto: versiculo.texto,
      tipoUso,
      confianza,
      estado: 'pendiente_de_verificacion',
      traduccion: 'No identificada en la transcripción',
      fuente: 'Análisis de la transcripción',
    });
  }
  return resultado;
}
