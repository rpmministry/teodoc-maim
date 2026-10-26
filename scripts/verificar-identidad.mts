import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { IDENTIDAD_MAIM } from '../lib/institucional.ts';

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (rel: string) => readFileSync(resolve(raiz, rel), 'utf8');
const dimensionesPng = (rel: string) => {
  const bytes = readFileSync(resolve(raiz, rel));
  assert.deepEqual([...bytes.subarray(0, 8)], [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], `${rel} no es PNG`);
  return { ancho: bytes.readUInt32BE(16), alto: bytes.readUInt32BE(20) };
};

let pasadas = 0;
const pruebas: string[] = [];
function comprobar(nombre: string, fn: () => void) {
  fn();
  pasadas += 1;
  pruebas.push(`  ✓ ${nombre}`);
}

comprobar('La identidad institucional coincide con la fuente oficial verificada', () => {
  assert.equal(IDENTIDAD_MAIM.nombre, 'MAIM Casa de Oración');
  assert.equal(IDENTIDAD_MAIM.nombreCorto, 'MAIM');
  assert.equal(IDENTIDAD_MAIM.categoria, 'Organización religiosa');
  assert.match(IDENTIDAD_MAIM.urlOficial, /^https:\/\/www\.facebook\.com\/casamaialasnaciones\/?$/);
  assert.equal(IDENTIDAD_MAIM.consultado, '26 de octubre de 2026');
  assert.match(IDENTIDAD_MAIM.descripcion, /Movimiento de Adoración e Intercesión/);
  assert.match(IDENTIDAD_MAIM.descripcion, /Maranatha/);
  assert.match(IDENTIDAD_MAIM.descripcion, /evangelismo y discipulado en las naciones/);
});

comprobar('Los activos institucionales oficiales están presentes y no se alteraron', () => {
  assert.ok(existsSync(resolve(raiz, 'public/institucional/maim-portada.jpg')));
  assert.ok(existsSync(resolve(raiz, 'public/institucional/maim-perfil.jpg')));
  assert.ok(readFileSync(resolve(raiz, 'public/institucional/maim-portada.jpg')).length > 5_000);
  assert.ok(readFileSync(resolve(raiz, 'public/institucional/maim-perfil.jpg')).length > 2_000);
  const icono = dimensionesPng('app/icon.png');
  const iconoApple = dimensionesPng('app/apple-icon.png');
  assert.ok(icono.ancho >= 180 && icono.alto >= 180, 'El icono es demasiado pequeño');
  assert.deepEqual(icono, iconoApple);
  assert.ok(!readFileSync(resolve(raiz, 'app/icon.png')).equals(readFileSync(resolve(raiz, 'public/institucional/maim-perfil.jpg'))));
  assert.ok(!existsSync(resolve(raiz, 'app/favicon.ico')), 'El favicon anterior debe haberse retirado');
  assert.ok(!existsSync(resolve(raiz, 'app/icon.svg')), 'El icono anterior debe haberse retirado');
});

comprobar('Los colores de la interfaz se tomaron del logotipo oficial', () => {
  const css = leer('app/globals.css');
  assert.ok(css.includes('--coral: #f04e59'), 'Falta el coral oficial');
  assert.ok(css.includes('--cremaOficial: #ffefb4'), 'Falta el crema oficial');
  assert.ok(css.includes('--tinta: #2b1f1e'), 'Falta el color de texto principal');
});

comprobar('El producto conserva el nombre verificado y no inventa una denominación', () => {
  const page = leer('app/page.tsx');
  const pdf = leer('lib/pdf/base.ts');
  const marca = leer('components/marca.tsx');
  assert.ok(marca.includes('maim-portada.jpg'));
  assert.ok(pdf.includes('IDENTIDAD_MAIM.nombre'));
  assert.ok(leer('lib/institucional.ts').includes("nombre: 'MAIM Casa de Oración'"));
  assert.ok(!page.includes('Iglesia MAIM Casa de Oración'), 'Se añadió un título no verificado');
  assert.ok(!page.includes('Misión de la iglesia'), 'Se inventó una declaración misional');
  assert.ok(!page.includes('Visión de la iglesia'), 'Se inventó una declaración de visión');
  assert.ok(!page.includes('doctrina oficial'), 'Se atribuyó una doctrina no verificada');
});

comprobar('El contenido editorial no atribuye biografías ni cargos al expositor', () => {
  const page = leer('app/page.tsx');
  const form = leer('components/formulario-analisis.tsx');
  const prompt = leer('app/api/analyze/route.ts');
  assert.ok(page.includes('Sin inventar biografías'));
  assert.ok(form.includes('No se genera una biografía'));
  assert.ok(prompt.includes('no asumas su nombre, biografía ni cargos'));
  assert.ok(!prompt.includes('biografía del predicador'), 'El prompt debe evitar generar biografías');
});

comprobar('No quedan marcas ni imágenes de la versión anterior', () => {
  const page = leer('app/page.tsx');
  const layout = leer('app/layout.tsx');
  assert.ok(!page.includes('Analizador Ministerial'));
  assert.ok(!layout.includes('Analizador Ministerial'));
  assert.ok(!page.includes('teodoc-logo-horizontal'));
  assert.ok(!page.includes('infografia'));
});

comprobar('La documentación declara la fuente y el alcance de la verificación', () => {
  const readme = leer('README.md');
  assert.match(readme, /MAIM Casa de Oración/);
  assert.match(readme, /casamaialasnaciones/);
  assert.match(readme, /26 de octubre de 2026/);
  assert.match(readme, /no se inventa/i);
});

comprobar('Las fuentes PDF tienen licencia incluida', () => {
  const licencia = leer('public/fonts/OFL.txt');
  assert.match(licencia, /SIL Open Font License/);
  assert.match(licencia, /IBM Corp/);
});

console.log('Verificación de identidad institucional y activos de marca');
console.log(pruebas.join('\n'));
console.log(`\n${pasadas} pruebas superadas.`);
