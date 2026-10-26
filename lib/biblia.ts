import type { PredicaAnalisis, Versiculo } from './tipos.ts';

type Proveedor = 'getbible' | 'api-bible';

const PROVEEDOR: Proveedor = process.env.BIBLE_PROVIDER === 'api-bible' ? 'api-bible' : 'getbible';
const API_KEY = process.env.BIBLE_API_KEY?.trim();
const BIBLE_ID = process.env.BIBLE_TRANSLATION_ID?.trim();
const BASE = (process.env.BIBLE_API_BASE || (PROVEEDOR === 'api-bible' ? 'https://api.scripture.api.bible/v1' : 'https://query.getbible.net/v2')).replace(/\/$/, '');
const TRADUCCION = process.env.BIBLE_TRANSLATION || 'sse';
const NOMBRE_TRADUCCION = process.env.BIBLE_TRANSLATION_NAME || (PROVEEDOR === 'api-bible' ? 'Traducción autorizada' : 'Sagradas Escrituras (1569)');
const LICENCIA = process.env.BIBLE_TRANSLATION_LICENSE || (PROVEEDOR === 'api-bible' ? 'Uso autorizado por el proveedor' : 'Dominio público');
const HABILITADO = process.env.BIBLE_VERIFY !== 'false';
const FALLBACK_ABIERTO = process.env.BIBLE_FALLBACK_OPEN === 'true';
const TIMEOUT_MS = 6000;

const LIBROS: Record<string, string> = {
  gen: 'Génesis', genesis: 'Génesis', gn: 'Génesis',
  ex: 'Éxodo', exodo: 'Éxodo',
  lv: 'Levítico', lev: 'Levítico', levitico: 'Levítico',
  nm: 'Números', num: 'Números', numeros: 'Números',
  dt: 'Deuteronomio', deut: 'Deuteronomio', deuteronomio: 'Deuteronomio',
  jos: 'Josué', josue: 'Josué',
  jue: 'Jueces', jc: 'Jueces', jueces: 'Jueces',
  rt: 'Rut', rut: 'Rut',
  '1 s': '1 Samuel', '1 sam': '1 Samuel', '1 samuel': '1 Samuel',
  '2 s': '2 Samuel', '2 sam': '2 Samuel', '2 samuel': '2 Samuel',
  '1 r': '1 Reyes', '1 re': '1 Reyes', '1 reyes': '1 Reyes',
  '2 r': '2 Reyes', '2 re': '2 Reyes', '2 reyes': '2 Reyes',
  '1 cr': '1 Crónicas', '1 cron': '1 Crónicas', '1 cronicas': '1 Crónicas',
  '2 cr': '2 Crónicas', '2 cron': '2 Crónicas', '2 cronicas': '2 Crónicas',
  esd: 'Esdras', esdras: 'Esdras',
  neh: 'Nehemías', nehemias: 'Nehemías',
  est: 'Ester', ester: 'Ester',
  job: 'Job',
  sal: 'Salmos', salmo: 'Salmos', salmos: 'Salmos', ps: 'Salmos', psa: 'Salmos',
  pr: 'Proverbios', prov: 'Proverbios', proverbios: 'Proverbios',
  ec: 'Eclesiastés', ecl: 'Eclesiastés', eclesiastes: 'Eclesiastés',
  cnt: 'Cantares', cant: 'Cantares', cantares: 'Cantares',
  is: 'Isaías', isa: 'Isaías', isaias: 'Isaías',
  jer: 'Jeremías', jeremias: 'Jeremías',
  lm: 'Lamentaciones', lam: 'Lamentaciones', lamentaciones: 'Lamentaciones',
  ez: 'Ezequiel', eze: 'Ezequiel', ezequiel: 'Ezequiel',
  dn: 'Daniel', dan: 'Daniel', daniel: 'Daniel',
  os: 'Oseas', ose: 'Oseas', oseas: 'Oseas',
  jl: 'Joel', joel: 'Joel',
  am: 'Amós', amo: 'Amós', amos: 'Amós',
  abd: 'Abdías', abdas: 'Abdías', abdias: 'Abdías',
  jon: 'Jonás', jonas: 'Jonás',
  miq: 'Miqueas', miqueas: 'Miqueas',
  nah: 'Nahúm', nahum: 'Nahúm',
  hab: 'Habacuc', habacuc: 'Habacuc',
  sof: 'Sofonías', sofonias: 'Sofonías',
  hag: 'Hageo', hageo: 'Hageo',
  zac: 'Zacarías', zacarias: 'Zacarías',
  mal: 'Malaquías', malaquias: 'Malaquías',
  mt: 'Mateo', mateo: 'Mateo',
  mc: 'Marcos', marcos: 'Marcos',
  lc: 'Lucas', lucas: 'Lucas',
  jn: 'Juan', juan: 'Juan',
  hch: 'Hechos', hechos: 'Hechos',
  ro: 'Romanos', rom: 'Romanos', romanos: 'Romanos',
  '1 co': '1 Corintios', '1 cor': '1 Corintios', '1 corintios': '1 Corintios',
  '2 co': '2 Corintios', '2 cor': '2 Corintios', '2 corintios': '2 Corintios',
  ga: 'Gálatas', gal: 'Gálatas', galatas: 'Gálatas',
  ef: 'Efesios', efesios: 'Efesios',
  fil: 'Filipenses', filipenses: 'Filipenses',
  col: 'Colosenses', colosenses: 'Colosenses',
  '1 ts': '1 Tesalonicenses', '1 tes': '1 Tesalonicenses', '1 tesalonicenses': '1 Tesalonicenses',
  '2 ts': '2 Tesalonicenses', '2 tes': '2 Tesalonicenses', '2 tesalonicenses': '2 Tesalonicenses',
  '1 ti': '1 Timoteo', '1 tim': '1 Timoteo', '1 timoteo': '1 Timoteo',
  '2 ti': '2 Timoteo', '2 tim': '2 Timoteo', '2 timoteo': '2 Timoteo',
  tit: 'Tito', tito: 'Tito',
  flm: 'Filemón', filemon: 'Filemón',
  heb: 'Hebreos', hebreos: 'Hebreos',
  stg: 'Santiago', sant: 'Santiago', santiago: 'Santiago',
  '1 p': '1 Pedro', '1 ped': '1 Pedro', '1 pedro': '1 Pedro',
  '2 p': '2 Pedro', '2 ped': '2 Pedro', '2 pedro': '2 Pedro',
  '1 jn': '1 Juan', '1 juan': '1 Juan',
  '2 jn': '2 Juan', '2 juan': '2 Juan',
  '3 jn': '3 Juan', '3 juan': '3 Juan',
  jud: 'Judas', judas: 'Judas',
  ap: 'Apocalipsis', apoc: 'Apocalipsis', apocalipsis: 'Apocalipsis',
};

const OSIS: Record<string, string> = {
  'Génesis': 'GEN', 'Éxodo': 'EXO', 'Levítico': 'LEV', 'Números': 'NUM', 'Deuteronomio': 'DEU',
  'Josué': 'JOS', 'Jueces': 'JDG', 'Rut': 'RUT', '1 Samuel': '1SA', '2 Samuel': '2SA',
  '1 Reyes': '1KI', '2 Reyes': '2KI', '1 Crónicas': '1CH', '2 Crónicas': '2CH',
  'Esdras': 'EZR', 'Nehemías': 'NEH', 'Ester': 'EST', 'Job': 'JOB', 'Salmos': 'PSA',
  'Proverbios': 'PRO', 'Eclesiastés': 'ECC', 'Cantares': 'SNG', 'Isaías': 'ISA',
  'Jeremías': 'JER', 'Lamentaciones': 'LAM', 'Ezequiel': 'EZK', 'Daniel': 'DAN',
  'Oseas': 'HOS', 'Joel': 'JOL', 'Amós': 'AMO', 'Abdías': 'OBA', 'Jonás': 'JON',
  'Miqueas': 'MIC', 'Nahúm': 'NAM', 'Habacuc': 'HAB', 'Sofonías': 'ZEP', 'Hageo': 'HAG',
  'Zacarías': 'ZEC', 'Malaquías': 'MAL', 'Mateo': 'MAT', 'Marcos': 'MRK', 'Lucas': 'LUK',
  'Juan': 'JHN', 'Hechos': 'ACT', 'Romanos': 'ROM', '1 Corintios': '1CO', '2 Corintios': '2CO',
  'Gálatas': 'GAL', 'Efesios': 'EPH', 'Filipenses': 'PHP', 'Colosenses': 'COL',
  '1 Tesalonicenses': '1TH', '2 Tesalonicenses': '2TH', '1 Timoteo': '1TI', '2 Timoteo': '2TI',
  'Tito': 'TIT', 'Filemón': 'PHM', 'Hebreos': 'HEB', 'Santiago': 'JAS', '1 Pedro': '1PE',
  '2 Pedro': '2PE', '1 Juan': '1JN', '2 Juan': '2JN', '3 Juan': '3JN', 'Judas': 'JUD',
  'Apocalipsis': 'REV',
};

export interface VerificacionBiblica {
  texto: string;
  traduccion: string;
  licencia: string;
  fuente: string;
}

const cache = new Map<string, { valor?: VerificacionBiblica; expira: number }>();
const CACHE_MS = 60 * 60 * 1000;

function sinAcentos(valor: string): string {
  return valor.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function normalizarCita(cita: string): string | null {
  const limpia = cita
    .replace(/[–—]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^([1-3])\s*([a-zA-Záéíóúüñ])/, '$1 $2');
  const coincidencia = limpia.match(/^((?:[1-3]\s*)?[^\d]+?)\s+(\d+):\s*([\d,\-]+)/);
  if (!coincidencia) return null;
  const libroCrudo = coincidencia[1].trim();
  const capitulo = coincidencia[2];
  const versiculos = coincidencia[3];
  const clave = sinAcentos(libroCrudo).toLowerCase().replace(/\s+/g, ' ').trim();
  const libro = LIBROS[clave] || libroCrudo.replace(/\s+/g, ' ').trim();
  return `${libro} ${capitulo}:${versiculos}`;
}

export function normalizarCitaOsis(cita: string): string | null {
  const normalizada = normalizarCita(cita);
  if (!normalizada) return null;
  const coincidencia = normalizada.match(/^(.+?)\s+(\d+):([\d,\-]+)$/);
  if (!coincidencia) return null;
  const osis = OSIS[coincidencia[1]] || '';
  if (!osis) return null;
  return `${osis}.${coincidencia[2]}.${coincidencia[3]}`;
}

function extraerGetBible(datos: unknown, fuente: string): VerificacionBiblica | null {
  if (!datos || typeof datos !== 'object') return null;
  for (const valor of Object.values(datos as Record<string, unknown>)) {
    if (!valor || typeof valor !== 'object') continue;
    const registro = valor as { verses?: Array<{ text?: unknown }> };
    if (!Array.isArray(registro.verses) || !registro.verses.length) continue;
    const texto = registro.verses.map((versiculo) => (typeof versiculo?.text === 'string' ? versiculo.text.trim() : '')).filter(Boolean).join(' ');
    if (texto) return { texto, traduccion: NOMBRE_TRADUCCION, licencia: LICENCIA, fuente };
  }
  return null;
}

function extraerApiBible(datos: unknown, fuente: string): VerificacionBiblica | null {
  if (!datos || typeof datos !== 'object') return null;
  const data = (datos as { data?: { content?: unknown; copyright?: unknown } }).data;
  if (!data || typeof data.content !== 'string') return null;
  const texto = data.content
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
  if (!texto) return null;
  const copyright = typeof data.copyright === 'string' ? data.copyright.trim().slice(0, 240) : '';
  return { texto, traduccion: NOMBRE_TRADUCCION, licencia: copyright || LICENCIA, fuente };
}

async function consultarGetBible(cita: string): Promise<VerificacionBiblica | null> {
  const normalizada = normalizarCita(cita);
  if (!normalizada) return null;
  const fuente = `${BASE}/${TRADUCCION}/${encodeURIComponent(normalizada)}`;
  const respuesta = await fetch(fuente, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!respuesta.ok) return null;
  return extraerGetBible(await respuesta.json(), fuente);
}

async function consultarApiBible(cita: string): Promise<VerificacionBiblica | null> {
  if (!API_KEY || !BIBLE_ID) return null;
  const osis = normalizarCitaOsis(cita);
  if (!osis) return null;
  const fuente = `${BASE}/bibles/${encodeURIComponent(BIBLE_ID)}/passages/${encodeURIComponent(osis)}?content-type=text&include-notes=false&include-titles=false&include-chapter-numbers=false&include-verse-numbers=false&include-verse-spans=false`;
  const respuesta = await fetch(fuente, { headers: { 'api-key': API_KEY }, signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!respuesta.ok) return null;
  return extraerApiBible(await respuesta.json(), fuente);
}

async function verificarUna(cita: string): Promise<VerificacionBiblica | null> {
  const normalizada = normalizarCita(cita);
  if (!normalizada) return null;
  const clave = `${PROVEEDOR}:${BIBLE_ID || TRADUCCION}:${normalizada.toLowerCase()}`;
  const enCache = cache.get(clave);
  if (enCache && enCache.expira > Date.now()) return enCache.valor || null;
  try {
    let resultado = PROVEEDOR === 'api-bible' ? await consultarApiBible(cita) : await consultarGetBible(cita);
    if (!resultado && PROVEEDOR === 'api-bible' && FALLBACK_ABIERTO) {
      resultado = await consultarGetBible(cita);
    }
    cache.set(clave, { valor: resultado || undefined, expira: Date.now() + (resultado ? CACHE_MS : 5 * 60 * 1000) });
    return resultado;
  } catch {
    cache.set(clave, { expira: Date.now() + 5 * 60 * 1000 });
    return null;
  }
}

function versiculosDe(analisis: PredicaAnalisis): Versiculo[] {
  return [
    analisis.texto_biblico_principal,
    ...analisis.otros_textos,
    ...analisis.desarrollo_progresivo.flatMap((punto) => punto.versiculos),
  ].filter((versiculo) => Boolean(versiculo.cita));
}

export async function verificarReferencias(analisis: PredicaAnalisis): Promise<PredicaAnalisis> {
  if (!HABILITADO) return analisis;
  if (PROVEEDOR === 'api-bible' && (!API_KEY || !BIBLE_ID)) {
    console.warn('[Biblia] BIBLE_PROVIDER=api-bible requiere BIBLE_API_KEY y BIBLE_TRANSLATION_ID. Las referencias quedan pendientes.');
    for (const versiculo of versiculosDe(analisis)) versiculo.estadoVerificacion = 'pendiente_de_verificacion';
    return analisis;
  }
  const versiculos = versiculosDe(analisis);
  const citas = Array.from(new Set(versiculos.map((versiculo) => versiculo.cita.trim()).filter(Boolean))).slice(0, 16);
  if (!citas.length) return analisis;

  const resultados = new Map<string, VerificacionBiblica>();
  for (let indice = 0; indice < citas.length; indice += 5) {
    const lote = citas.slice(indice, indice + 5);
    const pares = await Promise.all(lote.map(async (cita) => [cita, await verificarUna(cita)] as const));
    for (const [cita, resultado] of pares) if (resultado) resultados.set(cita, resultado);
  }

  for (const versiculo of versiculos) {
    const resultado = resultados.get(versiculo.cita.trim());
    if (resultado) {
      versiculo.texto = resultado.texto;
      versiculo.traduccion = resultado.traduccion;
      versiculo.licencia = resultado.licencia;
      versiculo.fuente = resultado.fuente;
      versiculo.estadoVerificacion = 'verificada';
    } else {
      versiculo.estadoVerificacion = 'pendiente_de_verificacion';
    }
  }
  return analisis;
}
