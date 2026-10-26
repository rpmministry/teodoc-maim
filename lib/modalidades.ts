import type { ModalidadId, RangoEdad } from './tipos.ts';

export interface Modalidad {
  id: ModalidadId;
  nombre: string;
  nombreCorto: string;
  descripcion: string;
  publico: string;
  archivoPdf: string;
  icono: 'libro' | 'grupo' | 'jovenes' | 'ninos' | 'devocional';
}

export const MODALIDADES: Modalidad[] = [
  {
    id: 'general',
    nombre: 'Análisis general',
    nombreCorto: 'General',
    descripcion: 'Estructura teológica completa del mensaje: idea central, desarrollo, textos bíblicos y aplicaciones.',
    publico: 'Predicadores, líderes y estudiantes de la Biblia',
    archivoPdf: 'teodoc-maim-analisis-general.pdf',
    icono: 'libro',
  },
  {
    id: 'grupos',
    nombre: 'Grupos pequeños, células y familias',
    nombreCorto: 'Grupos pequeños',
    descripcion: 'Guía participativa con agenda, preguntas, actividad, compromiso y oración para dirigir un encuentro en casa.',
    publico: 'Líderes de células, grupos pequeños y familias',
    archivoPdf: 'teodoc-maim-grupos-pequenos.pdf',
    icono: 'grupo',
  },
  {
    id: 'jovenes',
    nombre: 'Jóvenes',
    nombreCorto: 'Jóvenes',
    descripcion: 'Encuentro con lenguaje claro, preguntas de reflexión, casos prácticos y una dinámica participativa.',
    publico: 'Adolescentes, jóvenes y líderes juveniles',
    archivoPdf: 'teodoc-maim-jovenes.pdf',
    icono: 'jovenes',
  },
  {
    id: 'ninos',
    nombre: 'Niños',
    nombreCorto: 'Niños',
    descripcion: 'Clase bíblica adaptada por edad, con relato, actividad, juego, aplicación y guía para el maestro.',
    publico: 'Maestros de escuela dominical y familias',
    archivoPdf: 'teodoc-maim-clase-infantil.pdf',
    icono: 'ninos',
  },
  {
    id: 'devocionales',
    nombre: 'Devocionales de siete días',
    nombreCorto: 'Devocionales',
    descripcion: 'Plan de siete jornadas con lectura, contexto, reflexión, aplicación, acción y oración.',
    publico: 'Creyentes y familias que desean meditar durante la semana',
    archivoPdf: 'teodoc-maim-devocionales-7-dias.pdf',
    icono: 'devocional',
  },
];

export const RANGOS_EDAD: Array<{ id: RangoEdad; etiqueta: string; descripcion: string }> = [
  { id: '3-5', etiqueta: '3 a 5 años', descripcion: 'Primera infancia' },
  { id: '6-8', etiqueta: '6 a 8 años', descripcion: 'Niños pequeños' },
  { id: '9-12', etiqueta: '9 a 12 años', descripcion: 'Niños mayores' },
];

const IDS = new Set<ModalidadId>(MODALIDADES.map((modalidad) => modalidad.id));
const EDADES = new Set<RangoEdad>(RANGOS_EDAD.map((rango) => rango.id));

export function esModalidad(valor: unknown): valor is ModalidadId {
  return typeof valor === 'string' && IDS.has(valor as ModalidadId);
}

export function esRangoEdad(valor: unknown): valor is RangoEdad {
  return typeof valor === 'string' && EDADES.has(valor as RangoEdad);
}

export function obtenerModalidad(id: ModalidadId): Modalidad {
  return MODALIDADES.find((modalidad) => modalidad.id === id) || MODALIDADES[0];
}

export function obtenerRangoEdad(id: RangoEdad | undefined): string {
  return RANGOS_EDAD.find((rango) => rango.id === id)?.etiqueta || '';
}

export function nombreArchivoPdf(id: ModalidadId): string {
  return obtenerModalidad(id).archivoPdf;
}

export function nombreArchivoWord(id: ModalidadId): string {
  return nombreArchivoPdf(id).replace(/\.pdf$/, '.docx');
}

export function normalizarEspacios(valor: unknown): string {
  return String(valor ?? '').replace(/\s+/g, ' ').trim();
}

export function normalizarPredicador(valor: unknown): string | undefined {
  const limpio = normalizarEspacios(valor).slice(0, 120);
  return limpio || undefined;
}

export function normalizarTituloProporcionado(valor: unknown): string | undefined {
  const limpio = normalizarEspacios(valor).slice(0, 180);
  return limpio || undefined;
}

export function normalizarFechaISO(valor: unknown): string | undefined {
  if (typeof valor !== 'string') return undefined;
  const limpio = valor.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(limpio)) return undefined;
  const [anio, mes, dia] = limpio.split('-').map(Number);
  const fecha = new Date(Date.UTC(anio, mes - 1, dia));
  if (fecha.getUTCFullYear() !== anio || fecha.getUTCMonth() !== mes - 1 || fecha.getUTCDate() !== dia) return undefined;
  return limpio;
}

export function fechaLarga(fechaISO?: string): string {
  if (!fechaISO) return '';
  const fecha = new Date(`${fechaISO}T12:00:00`);
  if (Number.isNaN(fecha.getTime())) return '';
  return fecha.toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' });
}

export function fechaAnalisisLarga(fechaISO: string): string {
  const fecha = new Date(fechaISO);
  if (Number.isNaN(fecha.getTime())) return '';
  return fecha.toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' });
}

export function slugSeguro(valor: string): string {
  return normalizarEspacios(valor)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .toLowerCase();
}

export function nombreArchivoPersonalizado(id: ModalidadId, predicador?: string): string {
  const base = nombreArchivoPdf(id).replace(/\.pdf$/, '');
  const slug = predicador ? slugSeguro(predicador) : '';
  return slug ? `${base}-${slug}.pdf` : `${base}.pdf`;
}

export function etiquetaModalidad(id: ModalidadId): string {
  return obtenerModalidad(id).nombre;
}
