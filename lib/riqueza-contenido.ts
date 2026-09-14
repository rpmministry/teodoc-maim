// ---------------------------------------------------------------------------
// Clasificador de riqueza del contenido (lógica PURA, sin dependencias).
// Es un indicador SECUNDARIO de profundidad: la duración y las métricas
// orientan a la IA, pero la cantidad real de ideas siempre manda.
// Se mantiene aislado y exportado para poder verificarlo con pruebas.
// ---------------------------------------------------------------------------

export const LIBROS_BIBLICOS =
  'Génesis|Éxodo|Levítico|Números|Deuteronomio|Josué|Jueces|Rut|Samuel|Reyes|Crónicas|Esdras|Nehemías|Ester|Job|Salmos|Salmo|Proverbios|Eclesiastés|Cantares|Isaías|Jeremías|Lamentaciones|Ezequiel|Daniel|Oseas|Joel|Amós|Abdías|Jonás|Miqueas|Nahúm|Habacuc|Sofonías|Ageo|Zacarías|Malaquías|Mateo|Marcos|Lucas|Juan|Hechos|Romanos|Corintios|Gálatas|Efesios|Filipenses|Colosenses|Tesalonicenses|Timoteo|Tito|Filemón|Hebreos|Santiago|Pedro|Judas|Apocalipsis';

export type NivelProfundidad = 'breve' | 'media' | 'amplia' | 'profunda';

export type Riqueza = {
  palabras: number;
  duracionMin: number;
  refs: number;
  nivel: NivelProfundidad;
};

// ~130 palabras por minuto como estimación conservadora en español.
export const PALABRAS_POR_MINUTO = 130;

export function evaluarRiqueza(text: string): Riqueza {
  const limpio = (text || '').replace(/\s+/g, ' ').trim();
  const palabras = limpio ? limpio.split(' ').filter(Boolean).length : 0;
  const duracionMin = palabras ? Math.max(1, Math.round(palabras / PALABRAS_POR_MINUTO)) : 0;
  const refs = (limpio.match(new RegExp(`\\b(?:${LIBROS_BIBLICOS})\\s+\\d{1,3}:\\d{1,3}`, 'gi')) || []).length;

  let nivel: NivelProfundidad;
  if (palabras < 1800 || duracionMin < 14) nivel = 'breve';
  else if (palabras < 4500 || duracionMin < 35) nivel = 'media';
  else if (palabras < 9000 || duracionMin < 70) nivel = 'amplia';
  else nivel = 'profunda';
  // Muchas referencias bíblicas indican densidad: sube un nivel (sin exceder).
  if (refs >= 15 && nivel === 'media') nivel = 'amplia';
  else if (refs >= 25 && nivel === 'amplia') nivel = 'profunda';

  return { palabras, duracionMin, refs, nivel };
}

// Rango orientativo de puntos principales según el nivel. Es una GUÍA, no una
// cuota: el contenido puede sostener menos o más y eso siempre prevalece.
export function rangoPuntosSugerido(nivel: NivelProfundidad): { min: number; max: number } {
  switch (nivel) {
    case 'breve':
      return { min: 2, max: 3 };
    case 'media':
      return { min: 3, max: 6 };
    case 'amplia':
      return { min: 5, max: 9 };
    case 'profunda':
      return { min: 7, max: 12 };
  }
}

export function contextoRiqueza(text: string): string {
  const r = evaluarRiqueza(text);
  const rango = rangoPuntosSugerido(r.nivel);
  return `CONTEXTO DE ESTA TRANSCRIPCIÓN (indicador SECUNDARIO de profundidad): ~${r.palabras} palabras (~${r.duracionMin} min estimados), ${r.refs} referencias bíblicas detectadas → nivel orientativo: ${r.nivel.toUpperCase()} (${rango.min} a ${rango.max} puntos como referencia).
Recuerda: el nivel es solo una guía; la cantidad de puntos y la profundidad las determina el contenido real y su densidad teológica.`;
}
