import assert from 'node:assert/strict';
import { crearResultadoDemo, metadatosDemo } from './fixtures/demo.ts';

interface Almacen {
  [clave: string]: string;
}
const memoria: Almacen = {};
const fakeWindow = {
  localStorage: {
    getItem: (clave: string) => memoria[clave] ?? null,
    setItem: (clave: string, valor: string) => { memoria[clave] = valor; },
    removeItem: (clave: string) => { delete memoria[clave]; },
    clear: () => { Object.keys(memoria).forEach((clave) => delete memoria[clave]); },
    key: (indice: number) => Object.keys(memoria)[indice] ?? null,
    get length() { return Object.keys(memoria).length; },
  } as Storage,
};
(globalThis as unknown as { window: typeof fakeWindow }).window = fakeWindow;
const biblioteca = await import('../lib/biblioteca.ts');

let pasadas = 0;
const pruebas: string[] = [];
function comprobar(nombre: string, fn: () => void) {
  fn();
  pasadas += 1;
  pruebas.push(`  ✓ ${nombre}`);
}

comprobar('Guarda el análisis general y agrega una especialidad sin borrar el anterior', () => {
  const general = crearResultadoDemo('general');
  const metaGeneral = metadatosDemo('general');
  biblioteca.guardarPredicacionConGeneral('Texto de prueba', metaGeneral, general);
  const grupos = crearResultadoDemo('grupos');
  const metaGrupos = metadatosDemo('grupos');
  const actualizada = biblioteca.guardarDocumento(metaGeneral.fechaAnalisis, 'Texto de prueba', { ...metaGrupos, fechaAnalisis: metaGeneral.fechaAnalisis }, grupos);
  const predicacion = biblioteca.getPredicacion(actualizada, metaGeneral.fechaAnalisis);
  assert.ok(predicacion);
  assert.ok(predicacion.documentos.general, 'Falta el análisis general');
  assert.ok(predicacion.documentos.grupos, 'Falta la guía de grupos');
  assert.equal(Object.keys(predicacion.documentos).length, 2);
});

comprobar('Recupera una predicación guardada y conserva sus metadatos', () => {
  const bibliotecaLeida = biblioteca.leerBiblioteca();
  assert.equal(bibliotecaLeida.length, 1);
  assert.equal(bibliotecaLeida[0].texto, 'Texto de prueba');
  assert.equal(bibliotecaLeida[0].predicador, 'Samuel Rojas');
});

comprobar('Una especialidad nueva no sobrescribe las demás', () => {
  const metaGeneral = metadatosDemo('general');
  const jovenes = crearResultadoDemo('jovenes');
  const actualizada = biblioteca.guardarDocumento(metaGeneral.fechaAnalisis, 'Texto de prueba', { ...metadatosDemo('jovenes'), fechaAnalisis: metaGeneral.fechaAnalisis }, jovenes);
  const predicacion = biblioteca.getPredicacion(actualizada, metaGeneral.fechaAnalisis);
  assert.ok(predicacion?.documentos.general && predicacion.documentos.grupos && predicacion.documentos.jovenes);
  assert.equal(Object.keys(predicacion.documentos).length, 3);
});

comprobar('Limita el historial y tolera almacenamiento vacío o corrupto', () => {
  memoria.teodoc_biblioteca_v1 = '{corrupto';
  assert.deepEqual(biblioteca.leerBiblioteca(), []);
  memoria.teodoc_biblioteca_v1 = JSON.stringify([]);
  assert.deepEqual(biblioteca.leerBiblioteca(), []);
});

console.log('Verificación de la biblioteca local de documentos');
console.log(pruebas.join('\n'));
console.log(`\n${pasadas} pruebas superadas.`);
