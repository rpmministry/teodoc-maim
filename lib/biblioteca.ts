import type { MetadatosPredica, ModalidadId, ResultadoAnalisis } from './tipos.ts';

export interface PredicacionBiblioteca {
  id: string;
  titulo: string;
  predicador?: string;
  fecha?: string;
  texto: string;
  metadatos: MetadatosPredica;
  documentos: Partial<Record<ModalidadId, ResultadoAnalisis>>;
  creado: string;
  actualizado: string;
}

const CLAVE = 'teodoc_biblioteca_v1';
const MAX_PREDICACIONES = 6;
const MAX_EDAD_MS = 30 * 24 * 60 * 60 * 1000;

function puedeUsarStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function leerBiblioteca(): PredicacionBiblioteca[] {
  if (!puedeUsarStorage()) return [];
  try {
    const crudo = window.localStorage.getItem(CLAVE);
    if (!crudo) return [];
    const datos = JSON.parse(crudo);
    if (!Array.isArray(datos)) return [];
    const ahora = Date.now();
    return datos
      .filter((item): item is PredicacionBiblioteca => Boolean(item && typeof item.id === 'string' && item.documentos && typeof item.documentos === 'object'))
      .filter((item) => {
        const fecha = new Date(item.actualizado).getTime();
        return Number.isFinite(fecha) && ahora - fecha < MAX_EDAD_MS;
      })
      .sort((a, b) => new Date(b.actualizado).getTime() - new Date(a.actualizado).getTime())
      .slice(0, MAX_PREDICACIONES);
  } catch {
    return [];
  }
}

function escribirBiblioteca(predicaciones: PredicacionBiblioteca[]) {
  if (!puedeUsarStorage()) return;
  try {
    window.localStorage.setItem(CLAVE, JSON.stringify(predicaciones.slice(0, MAX_PREDICACIONES)));
  } catch {
    const reducidas = predicaciones.slice(0, 3);
    try {
      window.localStorage.setItem(CLAVE, JSON.stringify(reducidas));
    } catch {}
  }
}

export function guardarDocumento(
  id: string,
  texto: string,
  metadatos: MetadatosPredica,
  resultado: ResultadoAnalisis,
): PredicacionBiblioteca[] {
  if (!id) return leerBiblioteca();
  const biblioteca = leerBiblioteca();
  const ahora = new Date().toISOString();
  const existente = biblioteca.find((item) => item.id === id);
  const documentos = { ...(existente?.documentos || {}), [resultado.metadatos.modalidad]: resultado };
  const actualizada: PredicacionBiblioteca = {
    id,
    titulo: metadatos.tituloProporcionado || resultado.titulo,
    predicador: metadatos.predicador,
    fecha: metadatos.fecha,
    texto,
    metadatos: { ...metadatos, modalidad: resultado.metadatos.modalidad },
    documentos,
    creado: existente?.creado || ahora,
    actualizado: ahora,
  };
  const siguiente = [actualizada, ...biblioteca.filter((item) => item.id !== id)].slice(0, MAX_PREDICACIONES);
  escribirBiblioteca(siguiente);
  return siguiente;
}

export function guardarPredicacionConGeneral(
  texto: string,
  metadatos: MetadatosPredica,
  resultado: ResultadoAnalisis,
): PredicacionBiblioteca[] {
  const id = metadatos.fechaAnalisis;
  const general: ResultadoAnalisis = {
    ...resultado,
    metadatos: { ...resultado.metadatos, modalidad: 'general', rangoEdad: undefined },
    especializado: {},
  };
  let biblioteca = guardarDocumento(id, texto, { ...metadatos, modalidad: 'general' }, general);
  if (resultado.metadatos.modalidad !== 'general') {
    const seleccionado = { ...resultado, metadatos: { ...resultado.metadatos } };
    biblioteca = guardarDocumento(id, texto, metadatos, seleccionado);
  }
  return biblioteca;
}

export function getPredicacion(biblioteca: PredicacionBiblioteca[], id: string | null): PredicacionBiblioteca | undefined {
  return id ? biblioteca.find((item) => item.id === id) : biblioteca[0];
}

export function eliminarPredicacion(id: string): PredicacionBiblioteca[] {
  const siguiente = leerBiblioteca().filter((item) => item.id !== id);
  escribirBiblioteca(siguiente);
  return siguiente;
}

export function limpiarBiblioteca(): void {
  if (!puedeUsarStorage()) return;
  try {
    window.localStorage.removeItem(CLAVE);
  } catch {}
}
