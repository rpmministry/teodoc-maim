import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import JSZip from 'jszip';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import { construirPdfGeneralDocumento, construirPdfModalidad } from '../lib/pdf/index.ts';
import { construirWordGeneralDocumento, construirWordModalidad } from '../lib/docx/index.ts';
import { normalizarBosquejo, normalizarAnalisisGeneral } from '../lib/normalizar.ts';
import { nombreArchivoPdf, nombreArchivoWord } from '../lib/modalidades.ts';
import { crearResultadoDemo, metadatosDemo } from './fixtures/demo.ts';
import type { ModalidadId, MetadatosPredica, ResultadoAnalisis, EstudioBosquejo } from '../lib/tipos.ts';
import type { RecursosPdf } from '../lib/pdf/base.ts';

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const salidaPdf = resolve(raiz, 'tmp', 'pdf_modelos');
const salidaDocx = resolve(raiz, 'tmp', 'docx_modelos');
mkdirSync(salidaPdf, { recursive: true });
mkdirSync(salidaDocx, { recursive: true });

const base64 = (rel: string) => readFileSync(resolve(raiz, rel)).toString('base64');
const recursos: RecursosPdf = {
  logoPortada: `data:image/jpeg;base64,${base64('public/institucional/maim-portada.jpg')}`,
  logoIcono: `data:image/jpeg;base64,${base64('public/institucional/maim-perfil.jpg')}`,
  formatoLogo: 'JPEG',
  formatoIcono: 'JPEG',
  fuentes: {
    regular: base64('public/fonts/IBMPlexSans-Regular.ttf'),
    bold: base64('public/fonts/IBMPlexSans-Bold.ttf'),
    italic: base64('public/fonts/IBMPlexSans-Italic.ttf'),
    boldItalic: base64('public/fonts/IBMPlexSans-BoldItalic.ttf'),
  },
};

interface InspeccionPdf {
  paginas: number;
  texto: string;
  bytes: number;
}

async function inspeccionarPdf(blob: Blob): Promise<InspeccionPdf> {
  const buffer = Buffer.from(await blob.arrayBuffer());
  const documento = await pdfjs.getDocument({ data: new Uint8Array(buffer), useSystemFonts: false, verbosity: 0 }).promise;
  let texto = '';
  for (let numero = 1; numero <= documento.numPages; numero++) {
    const pagina = await documento.getPage(numero);
    const contenido = await pagina.getTextContent();
    texto += contenido.items.map((item) => ('str' in item ? item.str : '')).join(' ') + '\n';
  }
  const paginas = documento.numPages;
  await documento.destroy();
  return { paginas, texto, bytes: buffer.length };
}

interface InspeccionDocx {
  bytes: number;
  xml: string;
  texto: string;
}

async function inspeccionarDocx(blob: Blob): Promise<InspeccionDocx> {
  const buffer = Buffer.from(await blob.arrayBuffer());
  const zip = await JSZip.loadAsync(buffer);
  const xml = (await zip.file('word/document.xml')?.async('string')) || '';
  const texto = xml
    .replace(/<w:tab\/>/g, ' ')
    .replace(/<w:br\/>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
  return { bytes: buffer.length, xml, texto };
}

let pasadas = 0;
const pruebas: string[] = [];

async function comprobar(nombre: string, fn: () => Promise<void> | void) {
  await fn();
  pasadas += 1;
  pruebas.push(`  ✓ ${nombre}`);
}

console.log('=== SUITE DE VALIDACIÓN: MODELOS EDITORIALES DE LIDERAZGO MAIM ===\n');

// ============================================================================
// PRUEBA A: MODELO A (TEMÁTICO / DOCTRINAL — PENTECOSTÉS)
// ============================================================================
await comprobar('Prueba A: Modelo A (Pentecostés) genera documento editorial temático, doctrinal y con subsecciones', async () => {
  const rawModeloA = {
    titulo: 'ACTIVANDO UN PENTECOSTÉS DEL ESPÍRITU EN NUESTRAS VIDAS',
    tema_central: 'El derramamiento del Espíritu Santo, la comunión íntima y el reloj profético',
    epigrafe_biblico: {
      cita: 'Isaías 44:3',
      texto: 'Porque yo derramaré aguas sobre el sequedal, y ríos sobre la tierra árida; mi Espíritu derramaré sobre tu generación, y mi bendición sobre tus renuevos.',
    },
    introduccion: 'La promesa del derramamiento del Espíritu no es una metáfora poética sino una realidad espiritual determinante para el liderazgo de la iglesia en los últimos tiempos.',
    apartados: [
      {
        seccion: 'A',
        titulo: 'EL DERRAMAMIENTO DEL ESPÍRITU Y LA KOINONÍA CON EL PADRE',
        cita: 'Isaías 44:3; Joel 2:28-29',
        texto_cita: 'Y después de esto derramaré mi Espíritu sobre toda carne, y profetizarán vuestros hijos y vuestras hijas; vuestros ancianos soñarán sueños, y vuestros jóvenes verán visiones.',
        contenido: 'Cuando vivimos en KOINONIA (amistad, comunión íntima, sociedad) con el Espíritu Santo, experimentamos momentos de derramamiento o desbordamiento del Espíritu. El derramamiento del Espíritu Santo es cuando Él se manifiesta de manera sobrenatural, produciendo experiencias que nos marcan y activan, trayendo consecuencias y manifestaciones visibles. Está profetizado que en lo último de los tiempos el río de amor y verdad se enfriará; por eso Dios promete derramar de su Espíritu sobre toda carne. Cuando la Escritura dice SOBRE nosotros, se refiere al bautismo; cuando dice EN nosotros, a la regeneración.',
        termino_clave: {
          termino: 'KOINONIA',
          significado: 'Comunión íntima, sociedad y relación compartida.',
          aplicacion: 'No podemos liderar en el poder del Espíritu sin comunión diaria en el lugar secreto.',
        },
      },
      {
        seccion: 'B',
        titulo: 'EL BAUTISMO EN EL ESPÍRITU SANTO Y EL IMPULSO SOBRENATURAL',
        cita: 'Hechos 1:4-5',
        texto_cita: 'Juan ciertamente bautizó con agua, mas vosotros seréis bautizados con el Espíritu Santo dentro de no muchos días.',
        contenido: 'BAPTÍZO significa dejar abrumado, sumergir por completo, lavar en plenitud. El bautismo del Espíritu Santo es cuando Él toma el lugar en todo nuestro ser, y nos empodera para vivir en santidad y cumplir una misión trascendente. El Señor Jesús ordenó pedir obreros usando el verbo EKBÁLO: enviar o expulsar con santa violencia sin derecho a retorno. Clamen para que Dios produzca dentro nuestro un impulso sin retorno a vivir el evangelio.',
        termino_clave: {
          termino: 'BAPTÍZO',
          significado: 'Sumergir por completo, quedar abrumado bajo las aguas.',
          aplicacion: 'Ser inmersos en la santidad y poder del Espíritu Santo para la obra ministerial.',
        },
      },
      {
        seccion: 'C',
        titulo: 'UN VERDADERO PENTECOSTÉS Y LAS FIESTAS PROFÉTICAS',
        cita: 'Levítico 23; Hechos 2:1-4',
        texto_cita: 'Cuando llegó el día de Pentecostés, estaban todos unánimes juntos. Y de repente vino del cielo un estruendo...',
        contenido: 'Dios diseñó las siete fiestas solemnes como un reloj profético para su pueblo. El cumplimiento de Pentecostés marca el nacimiento y el combustible continuo de la iglesia del Señor.',
        subsecciones: [
          {
            titulo: '1. LAS FIESTAS DE PRIMAVERA',
            contenido: 'La Pascua revela el sacrificio perfecto del Cordero de Dios. Los Panes sin Levadura nos llaman a una vida santa y consagrada. Las Primicias celebran la resurrección gloriosa de Jesucristo. Y Pentecostés (Shavuot) derrama el Espíritu Santo como fuego consumidor para capacitar a los creyentes en testimonio vivo.',
          },
          {
            titulo: '2. LAS FIESTAS DE OTOÑO',
            contenido: 'Las Trompetas anuncian el despertar del pueblo de Dios ante el juicio venidero. El Día de la Expiación (Yom Kipur) convoca a un juicio interior y arrepentimiento sincero. Los Tabernáculos celebran la habitación perpetua de Dios con su pueblo redimido. Todo líder ministerial debe discernir los tiempos y sazones del calendario profético.',
          },
        ],
      },
    ],
    conclusion: 'El derramamiento, el bautismo y la vivencia de un verdadero Pentecostés nos equipan para el ministerio en estos tiempos finales. Clamamos por un mover sobrenatural en cada líder de MAIM.',
    desafio_final: {
      llamado: 'Buscar hoy una llenura fresca del Espíritu Santo.',
      oracion_ministracion: 'Señor Jesús, sumérgenos en la plenitud de tu Espíritu Santo y haznos obreros enviados con poder.',
    },
  };

  const normalizado = normalizarBosquejo(rawModeloA);
  assert.equal(normalizado.titulo, 'ACTIVANDO UN PENTECOSTÉS DEL ESPÍRITU EN NUESTRAS VIDAS');
  assert.ok(normalizado.apartados && normalizado.apartados.length === 3);
  assert.equal(normalizado.apartados[0].seccion, 'A');
  assert.equal(normalizado.apartados[1].seccion, 'B');
  assert.equal(normalizado.apartados[2].seccion, 'C');
  assert.equal(normalizado.apartados[2].subsecciones?.length, 2);

  const metadatos: MetadatosPredica = {
    tituloProporcionado: normalizado.titulo,
    fecha: '2026-10-29',
    modalidad: 'bosquejo',
    predicador: 'Pastor MAIM',
    fechaAnalisis: '2026-10-29T12:00:00Z',
  };

  const analisisGeneral = normalizarAnalisisGeneral({
    titulo: normalizado.titulo,
    pasaje_principal: 'Isaías 44:3; Hechos 2:1-4',
    tesis: 'El Espíritu Santo capacita sobrenaturalmente a los creyentes para el liderazgo.',
    puntos_principales: [
      { titulo: 'Derramamiento', cita: 'Isaías 44:3', explicacion: 'La promesa del Espíritu' },
    ],
    aplicacion: { personal: ['Buscar a Dios diariamente'] },
  });

  const resultadoCompleto: ResultadoAnalisis = {
    ...analisisGeneral,
    metadatos,
    especializado: {
      bosquejo: normalizado,
    },
  };

  // Generar PDF
  const pdfBlob = construirPdfModalidad({ analisis: resultadoCompleto, metadatos, recursos });
  const inspeccionPdf = await inspeccionarPdf(pdfBlob);
  writeFileSync(resolve(salidaPdf, 'modelo-a-pentecostes.pdf'), Buffer.from(await pdfBlob.arrayBuffer()));

  assert.ok(inspeccionPdf.paginas >= 3, `Debe ser multipágina (obtenidas: ${inspeccionPdf.paginas})`);
  assert.ok(inspeccionPdf.bytes > 20_000, `Tamaño insuficiente de PDF: ${inspeccionPdf.bytes}`);
  assert.ok(inspeccionPdf.texto.includes('ACTIVANDO UN PENTECOSTÉS'), 'Falta el título principal en el PDF');
  assert.ok(inspeccionPdf.texto.includes('EL DERRAMAMIENTO DEL ESPÍRITU'), 'Falta el apartado A en el PDF');
  assert.ok(inspeccionPdf.texto.includes('KOINONIA'), 'Falta el término KOINONIA');
  assert.ok(inspeccionPdf.texto.includes('BAPTÍZO'), 'Falta el término BAPTÍZO');
  assert.ok(inspeccionPdf.texto.includes('FIESTAS DE PRIMAVERA'), 'Falta la subsección Fiestas de Primavera');
  assert.ok(inspeccionPdf.texto.includes('FIESTAS DE OTOÑO'), 'Falta la subsección Fiestas de Otoño');

  // Verificar ausencia de etiquetas de formulario fragmentado
  assert.ok(!inspeccionPdf.texto.includes('01. Datos de la predicación'), 'No debe contener numeración de bloques obsoleta');
  assert.ok(!inspeccionPdf.texto.includes('02. Fundamento doctrinal'), 'No debe contener fundamento fragmentado');
  assert.ok(!inspeccionPdf.texto.includes('03. Objetivos'), 'No debe contener objetivos artificiales');
  assert.ok(!inspeccionPdf.texto.includes('05. Aplicación'), 'No debe contener aplicación en viñetas fragmentadas');

  // Generar DOCX
  const docxBlob = await construirWordModalidad({ analisis: resultadoCompleto, metadatos });
  const inspeccionDocx = await inspeccionarDocx(docxBlob);
  writeFileSync(resolve(salidaDocx, 'modelo-a-pentecostes.docx'), Buffer.from(await docxBlob.arrayBuffer()));

  assert.ok(inspeccionDocx.bytes > 8_000, 'Tamaño insuficiente de DOCX');
  assert.ok(inspeccionDocx.texto.includes('ACTIVANDO UN PENTECOSTÉS'), 'Falta el título en DOCX');
  assert.ok(inspeccionDocx.texto.includes('EL DERRAMAMIENTO DEL ESPÍRITU'), 'Falta apartado A en DOCX');
  assert.ok(inspeccionDocx.texto.includes('FIESTAS DE PRIMAVERA'), 'Faltan Fiestas de Primavera en DOCX');
});

// ============================================================================
// PRUEBA B: MODELO B (VIVENCIAL / ORGÁNICO / INSPIRADOR — DESBORDAMIENTO)
// ============================================================================
await comprobar('Prueba B: Modelo B (Desbordamiento) genera documento continuo, reflexivo, con epígrafe y clímax espiritual', async () => {
  const rawModeloB = {
    titulo: 'EL DESBORDAMIENTO DEL ESPÍRITU SANTO',
    tema_central: 'La urgencia de conocer al Consolador y vivir desbordando de su presencia viva',
    epigrafe_biblico: {
      cita: 'Juan 16:7',
      texto: 'Pero yo os digo la verdad: Os conviene que yo me vaya; porque si no me fuera, el Consolador no vendría a vosotros; mas si me fuere, os lo enviaré.',
    },
    introduccion: '¿Cómo es posible que a los discípulos les conviniera que Jesús se fuera físicamente? Esta declaración de Cristo es el mayor llamado de atención a un liderazgo que intenta operar en sus propias fuerzas. Si no conozco al Espíritu Santo, me estoy perdiendo el mayor regalo que Cristo prometió para mi ministerio.',
    apartados: [
      {
        seccion: '',
        titulo: 'EL DESAFÍO DE CONOCER ÍNTIMAMENTE AL CONSOLADOR',
        cita: 'Juan 16:7; 1 Corintios 2:9-10',
        texto_cita: 'Cosas que ojo no vio, ni oído oyó, ni han subido en corazón de hombre, son las que Dios ha preparado para los que le aman. Pero Dios nos las reveló a nosotros por el Espíritu.',
        contenido: 'Muchos líderes cristianos tienen una teología correcta sobre el Espíritu Santo, pero carecen de una relación viva y diaria con Él. Jesús no nos dejó solos ni huérfanos; nos envió a otro Consolador de la misma naturaleza. Necesito examinar mi tiempo devocional: ¿busco al Espíritu por sus dones o por su persona? La mayor tragedia ministerial es pretender liderar el pueblo de Dios sin la guía continua de su Santo Espíritu.',
      },
      {
        seccion: '',
        titulo: 'LLENURA CONTINUA Y DESBORDAMIENTO EN EL LIDERAZGO',
        cita: 'Efesios 5:18',
        texto_cita: 'No os embriaguéis con vino, en lo cual hay disolución; antes bien sed llenos del Espíritu.',
        contenido: 'El apóstol Pablo utiliza el tiempo presente continuo: sed llenos constantemente. El desbordamiento no es una bendición reservada para unos pocos místicos; es el estándar bíblico para todo creyente y especialmente para los pastores y líderes. No podemos apagar el fuego del altar. Cuando un líder está desbordado del Espíritu, sus palabras transmiten vida, su adoración rompe cadenas y su testimonio atrae a los perdidos a los pies de Cristo.',
      },
      {
        seccion: '',
        titulo: 'EL IMPULSO SOBRENATURAL HACIA LA MIES',
        cita: 'Mateo 9:38',
        texto_cita: 'Rogad, pues, al Señor de la mies, que envíe obreros a su mies.',
        contenido: 'Cuando Jesús nos manda orar al Señor de la mies para que "envíe" obreros, la palabra griega utilizada es EKBÁLO. No es una invitación pasiva ni una sugerencia suave: es una expulsión santa con ímpetu divino, lanzando al obrero a la cosecha sin boleto de regreso. El Espíritu Santo no nos llena para nuestro disfrute egocéntrico, sino para impulsarnos a servir, predicar y ganar almas con violencia santa.',
        termino_clave: {
          termino: 'EKBÁLO',
          significado: 'Expulsar o enviar con violencia santa e ímpetu irresistible sin derecho a retorno.',
          aplicacion: 'Vivir el evangelio con tal vehemencia que sea imposible mirar hacia atrás.',
        },
      },
    ],
    conclusion: 'Gastemos nuestras vidas hasta ver al Espíritu Santo llenando cristianos e impulsando a hombres y mujeres a la voluntad perfecta de Dios. MAIM debe ser una casa donde el Espíritu Santo no sea una doctrina teórica, sino un fuego vivo que quema en el corazón de cada líder.',
    desafio_final: {
      llamado: 'Rendir hoy todo control humano al Espíritu Santo.',
      oracion_ministracion: 'Espíritu de Dios, inunda nuestras vidas y arráncanos de la tibieza espiritual.',
    },
  };

  const normalizado = normalizarBosquejo(rawModeloB);
  assert.equal(normalizado.titulo, 'EL DESBORDAMIENTO DEL ESPÍRITU SANTO');
  assert.equal(normalizado.epigrafe_biblico?.cita, 'Juan 16:7');
  assert.ok(normalizado.apartados && normalizado.apartados.length === 3);

  const metadatos: MetadatosPredica = {
    tituloProporcionado: normalizado.titulo,
    fecha: '2026-10-29',
    modalidad: 'bosquejo',
    predicador: 'Pastor MAIM',
    fechaAnalisis: '2026-10-29T12:00:00Z',
  };

  const analisisGeneral = normalizarAnalisisGeneral({
    titulo: normalizado.titulo,
    pasaje_principal: 'Juan 16:7; Efesios 5:18',
    tesis: 'El desbordamiento del Espíritu es indispensable para la vida ministerial.',
    puntos_principales: [{ titulo: 'Consolador', cita: 'Juan 16:7', explicacion: 'La necesidad del Espíritu' }],
    aplicacion: { personal: ['Vivir en la llenura diaria'] },
  });

  const resultadoCompleto: ResultadoAnalisis = {
    ...analisisGeneral,
    metadatos,
    especializado: {
      bosquejo: normalizado,
    },
  };

  // Generar PDF
  const pdfBlob = construirPdfModalidad({ analisis: resultadoCompleto, metadatos, recursos });
  const inspeccionPdf = await inspeccionarPdf(pdfBlob);
  writeFileSync(resolve(salidaPdf, 'modelo-b-desbordamiento.pdf'), Buffer.from(await pdfBlob.arrayBuffer()));

  assert.ok(inspeccionPdf.paginas >= 3, `Debe ser multipágina (obtenidas: ${inspeccionPdf.paginas})`);
  assert.ok(inspeccionPdf.texto.includes('EL DESBORDAMIENTO DEL ESPÍRITU SANTO'), 'Falta el título principal en PDF');
  assert.ok(inspeccionPdf.texto.includes('Juan 16:7'), 'Falta la cita del epígrafe bíblico en PDF');
  assert.ok(inspeccionPdf.texto.includes('Os conviene que yo me vaya'), 'Falta el texto de Juan 16:7 en PDF');
  assert.ok(inspeccionPdf.texto.includes('EKBÁLO'), 'Falta el término EKBÁLO en PDF');
  assert.ok(inspeccionPdf.texto.includes('Gastemos nuestras vidas'), 'Falta el clímax final en PDF');

  // Generar DOCX
  const docxBlob = await construirWordModalidad({ analisis: resultadoCompleto, metadatos });
  const inspeccionDocx = await inspeccionarDocx(docxBlob);
  writeFileSync(resolve(salidaDocx, 'modelo-b-desbordamiento.docx'), Buffer.from(await docxBlob.arrayBuffer()));

  assert.ok(inspeccionDocx.bytes > 8_000, 'Tamaño insuficiente de DOCX');
  assert.ok(inspeccionDocx.texto.includes('EL DESBORDAMIENTO DEL ESPÍRITU SANTO'), 'Falta el título en DOCX');
  assert.ok(inspeccionDocx.texto.includes('Juan 16:7'), 'Falta el epígrafe en DOCX');
  assert.ok(inspeccionDocx.texto.includes('EKBÁLO'), 'Falta EKBÁLO en DOCX');
});

// ============================================================================
// PRUEBA C: DEMOSTRACIÓN GENERAL SANTIAGO ("La fe que transforma")
// ============================================================================
await comprobar('Prueba C: Prédica estándar de demostración Santiago se renderiza como documento editorial', async () => {
  const metadatos = metadatosDemo('bosquejo');
  const demoResultado = crearResultadoDemo('bosquejo');

  const pdfBlob = construirPdfModalidad({ analisis: demoResultado, metadatos, recursos });
  const inspeccionPdf = await inspeccionarPdf(pdfBlob);
  writeFileSync(resolve(salidaPdf, 'demo-santiago-liderazgo.pdf'), Buffer.from(await pdfBlob.arrayBuffer()));

  assert.ok(inspeccionPdf.paginas >= 2, 'Debe ser multipágina');
  assert.ok(inspeccionPdf.texto.includes('La fe que transforma'), 'Falta título de Santiago');
  assert.ok(inspeccionPdf.texto.includes('DOCUMENTO EDITORIAL DE FORMACIÓN MINISTERIAL'), 'Falta subtítulo editorial');

  const docxBlob = await construirWordModalidad({ analisis: demoResultado, metadatos });
  const inspeccionDocx = await inspeccionarDocx(docxBlob);
  writeFileSync(resolve(salidaDocx, 'demo-santiago-liderazgo.docx'), Buffer.from(await docxBlob.arrayBuffer()));

  assert.ok(inspeccionDocx.texto.includes('La fe que transforma'), 'Falta título en DOCX');
});

// ============================================================================
// PRUEBA D: NO REGRESIÓN DE LAS OTRAS 5 MODALIDADES
// ============================================================================
await comprobar('Prueba D: No regresión de las otras 5 modalidades (general, grupos, jovenes, ninos, devocionales)', async () => {
  const otrasModalidades: ModalidadId[] = ['general', 'grupos', 'jovenes', 'ninos', 'devocionales'];

  for (const mod of otrasModalidades) {
    const meta = metadatosDemo(mod);
    const demo = crearResultadoDemo(mod);

    const pdfBlob = construirPdfModalidad({ analisis: demo, metadatos: meta, recursos });
    const docxBlob = await construirWordModalidad({ analisis: demo, metadatos: meta });

    assert.ok(pdfBlob.size > 15_000, `PDF de ${mod} debe tener tamaño suficiente`);
    assert.ok(docxBlob.size > 5_000, `DOCX de ${mod} debe tener tamaño suficiente`);

    const pdfInsp = await inspeccionarPdf(pdfBlob);
    const docxInsp = await inspeccionarDocx(docxBlob);

    if (mod === 'grupos') {
      assert.ok(pdfInsp.texto.includes('Agenda del encuentro') || pdfInsp.texto.includes('Momento'), 'Grupos debe tener agenda');
      assert.ok(docxInsp.texto.includes('Agenda del encuentro') || docxInsp.texto.includes('Momento'), 'Grupos debe tener agenda en Word');
    } else if (mod === 'jovenes') {
      assert.ok(pdfInsp.texto.includes('Pasaje y conceptos fundamentales') || pdfInsp.texto.includes('Desafío de la semana'), 'Jóvenes debe tener sus secciones');
    } else if (mod === 'ninos') {
      assert.ok(pdfInsp.texto.includes('El relato bíblico') || pdfInsp.texto.includes('Actividad didáctica'), 'Niños debe tener sus secciones');
    } else if (mod === 'devocionales') {
      assert.ok(pdfInsp.texto.includes('Una fe que escucha') || pdfInsp.texto.includes('CÓMO USAR ESTE PLAN'), 'Devocionales debe incluir jornadas');
    }
  }
});

// ============================================================================
// PRUEBA E: INTEGRIDAD DE DESCARGAS Y ASIGNACIÓN DE NOMBRES
// ============================================================================
await comprobar('Prueba E: Nombres de archivo, metadatos y consistencia de descargas', () => {
  assert.equal(nombreArchivoPdf('bosquejo'), 'teodoc-maim-liderazgo.pdf');
  assert.equal(nombreArchivoWord('bosquejo'), 'teodoc-maim-liderazgo.docx');
  assert.equal(nombreArchivoPdf('general'), 'teodoc-maim-analisis-general.pdf');
  assert.equal(nombreArchivoWord('general'), 'teodoc-maim-analisis-general.docx');
});

console.log(`\n=======================================================`);
console.log(`Resultados: ${pasadas} de 5 pruebas de validación editorial superadas.`);
console.log(`=======================================================\n`);
pruebas.forEach((p) => console.log(p));
