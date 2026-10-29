import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  MODALIDADES,
  RANGOS_EDAD,
  esModalidad,
  esRangoEdad,
  fechaLarga,
  nombreArchivoPdf,
  normalizarFechaISO,
  normalizarPredicador,
  obtenerModalidad,
  obtenerRangoEdad,
} from '../lib/modalidades.ts';
import { especializadoTieneContenido, normalizarBosquejo, normalizarDevocionales, normalizarGrupos, normalizarJovenes, normalizarMetadatos, normalizarNinos, normalizarRespuesta } from '../lib/normalizar.ts';
import { REGLAS_POR_MODALIDAD, construirPromptEspecializado } from '../lib/ai/modalidades.ts';
import { crearResultadoDemo, metadatosDemo } from './fixtures/demo.ts';
import { construirReferencias } from '../lib/referencias.ts';
import type { ModalidadId } from '../lib/tipos.ts';

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (rel: string) => readFileSync(resolve(raiz, rel), 'utf8');

let pasadas = 0;
const pruebas: string[] = [];
function comprobar(nombre: string, fn: () => void) {
  fn();
  pasadas += 1;
  pruebas.push(`  ✓ ${nombre}`);
}

const IDS: ModalidadId[] = ['general', 'bosquejo', 'grupos', 'jovenes', 'ninos', 'devocionales'];
const NOMBRES_ESPERADOS: Record<ModalidadId, string> = {
  general: 'teodoc-maim-analisis-general.pdf',
  bosquejo: 'teodoc-maim-bosquejo-ministerial.pdf',
  grupos: 'teodoc-maim-grupos-pequenos.pdf',
  jovenes: 'teodoc-maim-jovenes.pdf',
  ninos: 'teodoc-maim-clase-infantil.pdf',
  devocionales: 'teodoc-maim-devocionales-7-dias.pdf',
};

comprobar('Existen exactamente seis modalidades con los identificadores requeridos', () => {
  assert.equal(MODALIDADES.length, 6);
  assert.deepEqual(MODALIDADES.map((m) => m.id).sort(), [...IDS].sort());
  for (const modalidad of MODALIDADES) {
    assert.ok(modalidad.nombre.length > 3, `Nombre vacío en ${modalidad.id}`);
    assert.ok(modalidad.descripcion.length > 20, `Descripción insuficiente en ${modalidad.id}`);
    assert.ok(modalidad.publico.length > 5, `Público vacío en ${modalidad.id}`);
  }
});

comprobar('Cada modalidad tiene un nombre de PDF único y exacto', () => {
  const nombres = new Set<string>();
  for (const modalidad of MODALIDADES) {
    const nombre = nombreArchivoPdf(modalidad.id);
    assert.equal(nombre, NOMBRES_ESPERADOS[modalidad.id]);
    assert.match(nombre, /^teodoc-maim-[a-z0-9-]+\.pdf$/);
    assert.ok(!nombres.has(nombre), `Nombre duplicado: ${nombre}`);
    nombres.add(nombre);
  }
  assert.equal(nombres.size, 6);
});

comprobar('La modalidad de niños exige edad y ofrece tres rangos', () => {
  assert.equal(RANGOS_EDAD.length, 3);
  assert.deepEqual(RANGOS_EDAD.map((r) => r.id), ['3-5', '6-8', '9-12']);
  assert.equal(obtenerRangoEdad('6-8'), '6 a 8 años');
  assert.ok(esRangoEdad('3-5') && esRangoEdad('9-12'));
  assert.ok(!esRangoEdad('0-2'));
});

comprobar('Validadores de modalidad rechazan valores arbitrarios', () => {
  for (const id of IDS) assert.ok(esModalidad(id));
  assert.ok(!esModalidad('sermones'));
  assert.ok(!esModalidad(null));
  assert.equal(obtenerModalidad('general').nombre, 'Análisis general');
});

comprobar('El nombre del predicador se sanea y se conserva como metadato separado', () => {
  const metadatos = metadatosDemo('grupos');
  assert.equal(metadatos.predicador, 'Samuel Rojas');
  assert.equal(normalizarPredicador('  Samuel   Rojas  '), 'Samuel Rojas');
  assert.equal(normalizarPredicador('   '), undefined);
  assert.ok(normalizarPredicador('x'.repeat(300))!.length <= 120);
  const resultado = crearResultadoDemo('grupos');
  assert.equal(resultado.metadatos.predicador, 'Samuel Rojas');
  assert.ok(!JSON.stringify(resultado.especializado).includes('Samuel Rojas'), 'El nombre no debe inventarse dentro del contenido generado');
});

comprobar('La fecha se valida y se presenta en español', () => {
  assert.equal(normalizarFechaISO('2026-10-18'), '2026-10-18');
  assert.equal(normalizarFechaISO('18/10/2026'), undefined);
  assert.equal(normalizarFechaISO('2026-02-31'), undefined);
  assert.match(fechaLarga('2026-10-18'), /18 de octubre de 2026/);
});

comprobar('Las seis modalidades normalizan contenido completo y utilizable', () => {
  for (const modalidad of IDS) {
    const resultado = crearResultadoDemo(modalidad);
    assert.equal(resultado.metadatos.modalidad, modalidad);
    assert.equal(resultado.titulo, 'La fe que transforma');
    assert.ok(resultado.idea_principal.length > 40);
    assert.ok(especializadoTieneContenido(modalidad, resultado.especializado), `Contenido vacío en ${modalidad}`);
    if (modalidad === 'general') assert.deepEqual(resultado.especializado, {});
    if (modalidad === 'bosquejo') assert.ok((resultado.especializado.bosquejo?.puntos_principales?.length || 0) >= 3);
    if (modalidad === 'grupos') assert.equal(resultado.especializado.grupos?.agenda.length, 6);
    if (modalidad === 'jovenes') assert.equal(resultado.especializado.jovenes?.casos_practicos.length, 3);
    if (modalidad === 'ninos') assert.equal(resultado.especializado.ninos?.relato.length, 4);
    if (modalidad === 'devocionales') assert.equal(resultado.especializado.devocionales?.dias.length, 7);
  }
});

comprobar('Una respuesta incompleta no se considera material válido para PDF', () => {
  assert.equal(especializadoTieneContenido('bosquejo', { bosquejo: normalizarBosquejo({ titulo: 'Solo un título' }) }), false);
  assert.equal(especializadoTieneContenido('grupos', { grupos: normalizarGrupos({ objetivo: 'Solo un objetivo' }) }), false);
  assert.equal(especializadoTieneContenido('jovenes', { jovenes: normalizarJovenes({ tema: 'Solo un tema' }) }), false);
  assert.equal(especializadoTieneContenido('ninos', { ninos: normalizarNinos({ objetivo_aprendizaje: 'Solo un objetivo' }) }), false);
  assert.equal(especializadoTieneContenido('devocionales', { devocionales: normalizarDevocionales({ dias: [{ dia: 1, titulo: 'Incompleto' }] }) }), false);
});
comprobar('El inventario de referencias es único y declara su estado de verificación', () => {
  const referencias = construirReferencias(crearResultadoDemo('general'));
  assert.ok(referencias.length >= 3);
  assert.equal(new Set(referencias.map((r) => r.cita.toLowerCase())).size, referencias.length);
  assert.ok(referencias.every((r) => r.estado === 'pendiente_de_verificacion'));
  assert.ok(referencias.every((r) => r.tipoUso === 'lectura_o_cita' || r.tipoUso === 'referencia_detectada'));
});
comprobar('El plan devocional conserva siete días ordenados y rechaza contenido vacío', () => {
  const plan = normalizarDevocionales({ introduccion: 'Intro', proposito: 'Propósito', dias: [
    { dia: 2, titulo: 'Dos', tema: 'Tema' },
    { dia: 1, titulo: 'Uno', tema: 'Tema' },
  ] });
  assert.equal(plan.dias.length, 2);
  assert.deepEqual(plan.dias.map((d) => d.dia), [1, 2]);
  assert.equal(plan.dias[0].titulo, 'Uno');
  const vacio = normalizarDevocionales({});
  assert.equal(vacio.dias.length, 0);
});

comprobar('La respuesta conserva el título proporcionado y no crea campos de infografía', () => {
  const crudo = {
    titulo: 'Título generado',
    idea_principal: 'Idea real del mensaje.',
    texto_biblico_principal: { cita: 'Juan 3:16', texto: 'Porque de tal manera amó Dios al mundo.' },
    desarrollo_progresivo: [{ punto: 'Punto', explicacion: 'Explicación', subtemas: [], versiculos: [] }],
    infografia: { frase_corta: 'No debe usarse' },
  };
  const metadatos = normalizarMetadatos({ ...metadatosDemo('general'), titulo: 'Título solicitado' });
  const resultado = normalizarRespuesta(crudo, metadatos);
  assert.equal(resultado.titulo, 'Título solicitado');
  assert.ok(!('infografia' in resultado));
  assert.deepEqual(resultado.especializado, {});
});

comprobar('Las reglas de cada modalidad exigen sus secciones distintivas', () => {
  const claves: Record<Exclude<ModalidadId, 'general'>, string[]> = {
    bosquejo: ['puntos_principales', 'tesis', 'aplicacion_liderazgo', 'desafio_final'],
    grupos: ['agenda', 'preguntas_inicio', 'compromiso_semanal', 'orientaciones_lider'],
    jovenes: ['dinamica', 'preguntas_grupales', 'casos_practicos', 'desafio_semanal'],
    ninos: ['relato', 'actividad', 'juego', 'recomendaciones_maestro'],
    devocionales: ['siete', 'lectura_principal', 'pregunta_introspeccion', 'oracion'],
  };
  for (const [modalidad, terminos] of Object.entries(claves)) {
    const reglas = REGLAS_POR_MODALIDAD[modalidad as Exclude<ModalidadId, 'general'>];
    assert.ok(reglas.length > 300, `Reglas demasiado breves para ${modalidad}`);
    for (const termino of terminos) assert.ok(reglas.includes(termino), `Falta ${termino} en ${modalidad}`);
    const prompt = construirPromptEspecializado(modalidad as Exclude<ModalidadId, 'general'>, modalidad === 'ninos' ? '6 a 8 años' : undefined);
    assert.ok(prompt.includes('No infieras la personalidad'), 'Falta la regla de no inventar biografía');
    assert.ok(prompt.includes('No inventes versículos'), 'Falta la regla de no inventar citas');
    if (modalidad === 'ninos') assert.ok(prompt.includes('6 a 8 años'), 'Falta el rango de edad en el prompt');
  }
});

comprobar('El texto no usa promesas de infografías ni biografías inventadas', () => {
  const archivos = ['app/page.tsx', 'app/api/analyze/route.ts', 'lib/tipos.ts', 'lib/normalizar.ts'];
  for (const archivo of archivos) {
    const contenido = leer(archivo).toLowerCase();
    assert.ok(!contenido.includes('infografia'), `Quedó una referencia a infografía en ${archivo}`);
  }
  const form = leer('components/formulario-analisis.tsx');
  assert.ok(form.includes('No se genera una biografía'), 'Falta la advertencia sobre biografías');
});

comprobar('El prompt general conserva la regla de proporcionalidad y el blindaje', () => {
  const analyze = leer('app/api/analyze/route.ts');
  assert.ok(analyze.includes('PROFUNDIDAD PROPORCIONAL AL CONTENIDO'));
  assert.ok(analyze.includes('NUNCA rellenes secciones'));
  assert.ok(analyze.includes('BLINDAJE DE SEGURIDAD Y CONFIDENCIALIDAD'));
  assert.ok(!analyze.includes('REGLA_INFOGRAFIA'));
  assert.ok(!analyze.includes('DATOS_INFOGRAFIA'));
});

console.log('Verificación de modalidades, metadatos y normalización');
console.log(pruebas.join('\n'));
console.log(`\n${pasadas} pruebas superadas.`);
