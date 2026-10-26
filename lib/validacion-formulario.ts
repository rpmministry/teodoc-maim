import { esModalidad, esRangoEdad, normalizarFechaISO, normalizarPredicador, normalizarTituloProporcionado } from './modalidades.ts';
import type { ModalidadId, RangoEdad } from './tipos.ts';

export interface EntradaFormulario {
  texto: string;
  modalidad: ModalidadId;
  rangoEdad: RangoEdad;
  titulo: string;
  predicador: string;
  fecha: string;
}

export interface ResultadoValidacionFormulario {
  valido: boolean;
  errores: string[];
}

export function validarFormulario(entrada: EntradaFormulario): ResultadoValidacionFormulario {
  const errores: string[] = [];
  const texto = entrada.texto.trim();
  if (!texto) {
    errores.push('Escribe o pega la transcripción, o sube un audio para transcribirlo.');
  } else if (texto.length < 120) {
    errores.push('La transcripción es demasiado corta para un análisis responsable. Añade al menos 120 caracteres de contenido.');
  } else if (texto.length > 250_000) {
    errores.push('La transcripción supera el máximo de 250,000 caracteres. Divide el mensaje o reduce el texto.');
  }
  if (!esModalidad(entrada.modalidad)) {
    errores.push('Selecciona una modalidad de análisis.');
  }
  if (entrada.modalidad === 'ninos' && !esRangoEdad(entrada.rangoEdad)) {
    errores.push('Selecciona un rango de edad para la clase infantil.');
  }
  if (entrada.predicador.trim() && !normalizarPredicador(entrada.predicador)) {
    errores.push('El nombre del predicador o expositor no es válido.');
  }
  if (entrada.titulo.trim() && !normalizarTituloProporcionado(entrada.titulo)) {
    errores.push('El título del mensaje no es válido.');
  }
  if (entrada.fecha.trim() && !normalizarFechaISO(entrada.fecha)) {
    errores.push('La fecha de la prédica no es válida.');
  }
  return { valido: errores.length === 0, errores };
}
