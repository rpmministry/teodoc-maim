import type { PredicaAnalisis, Versiculo } from './tipos.ts';

export interface ReferenciaDetectada {
  cita: string;
  texto: string;
  tipoUso: 'lectura_o_cita' | 'referencia_detectada';
  confianza: 'media' | 'baja';
  estado: 'verificada' | 'pendiente_de_verificacion';
  traduccion: string;
  licencia?: string;
  fuente: string;
}

export const NOTA_VERIFICACION = '';

export function notaReferencias(referencias: ReferenciaDetectada[]): string {
  const verificadas = referencias.filter((referencia) => referencia.estado === 'verificada').length;
  if (!verificadas) return '';
  if (verificadas === referencias.length) {
    const primera = referencias[0];
    return `Referencias verificadas con ${primera.traduccion}${primera.licencia ? ` (${primera.licencia})` : ''}. El texto se conserva según la fuente consultada.`;
  }
  return `Se verificaron ${verificadas} de ${referencias.length} referencias.`;
}

export function construirReferencias(analisis: PredicaAnalisis): ReferenciaDetectada[] {
  const fuentes: Array<{ versiculo: Versiculo; tipoUso: ReferenciaDetectada['tipoUso']; confianza: ReferenciaDetectada['confianza'] }> = [
    { versiculo: analisis.texto_biblico_principal, tipoUso: 'lectura_o_cita', confianza: 'media' },
    ...analisis.otros_textos.map((versiculo) => ({ versiculo, tipoUso: 'referencia_detectada' as const, confianza: 'media' as const })),
    ...analisis.desarrollo_progresivo.flatMap((punto) =>
      punto.versiculos.map((versiculo) => ({ versiculo, tipoUso: 'referencia_detectada' as const, confianza: 'baja' as const })),
    ),
  ];

  const indice = new Map<string, ReferenciaDetectada>();
  for (const { versiculo, tipoUso, confianza } of fuentes) {
    const cita = versiculo.cita.trim();
    if (!cita) continue;
    const clave = cita.toLowerCase();
    const existente = indice.get(clave);
    if (existente && existente.estado === 'verificada') continue;
    indice.set(clave, {
      cita,
      texto: versiculo.texto,
      tipoUso,
      confianza,
      estado: versiculo.estadoVerificacion || 'pendiente_de_verificacion',
      traduccion: versiculo.traduccion || 'No identificada en la transcripción',
      licencia: versiculo.licencia,
      fuente: versiculo.fuente || 'Análisis de la transcripción',
    });
  }
  return Array.from(indice.values());
}
