import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import JSZip from 'jszip';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';

import {
  MODALIDADES,
  nombreArchivoPdf,
  nombreArchivoWord,
  obtenerModalidad,
  normalizarPredicador,
  normalizarTituloProporcionado,
  normalizarFechaISO,
} from '../lib/modalidades.ts';
import type { ModalidadId, PredicaAnalisis, MetadatosPredica, ResultadoAnalisis, EstudioCasa2, PlanDevocional } from '../lib/tipos.ts';
import { REGLAS_POR_MODALIDAD, ESQUEMAS_POR_MODALIDAD } from '../lib/ai/modalidades.ts';
import { MENSAJES_POR_MODALIDAD, ETAPAS_ANALISIS } from '../lib/analisis-progreso-tipos.ts';
import {
  normalizarEspecializado,
  especializadoTieneContenido,
  normalizarRespuesta,
  normalizarCasa2,
  normalizarAyuno,
} from '../lib/normalizar.ts';
import { construirPdfGeneral, construirPdfModalidad } from '../lib/pdf/index.ts';
import { construirWordGeneralDocumento, construirWordModalidad } from '../lib/docx/index.ts';
import { crearResultadoDemo, metadatosDemo } from './fixtures/demo.ts';

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dirSalida = resolve(raiz, 'tmp', 'auditoria');
mkdirSync(dirSalida, { recursive: true });

const base64 = (rel: string) => readFileSync(resolve(raiz, rel)).toString('base64');
const recursosPdf = {
  logoPortada: `data:image/jpeg;base64,${base64('public/institucional/maim-portada.jpg')}`,
  logoIcono: `data:image/jpeg;base64,${base64('public/institucional/maim-perfil.jpg')}`,
  formatoLogo: 'JPEG' as const,
  formatoIcono: 'JPEG' as const,
  fuentes: {
    regular: base64('public/fonts/IBMPlexSans-Regular.ttf'),
    bold: base64('public/fonts/IBMPlexSans-Bold.ttf'),
    italic: base64('public/fonts/IBMPlexSans-Italic.ttf'),
    boldItalic: base64('public/fonts/IBMPlexSans-BoldItalic.ttf'),
  },
};

let pasadas = 0;
let fallidas = 0;
const registroPruebas: Array<{ seccion: string; nombre: string; estado: 'OK' | 'FALLO'; detalle?: string }> = [];

function auditar(seccion: string, nombre: string, fn: () => void | Promise<void>) {
  return async () => {
    try {
      await fn();
      pasadas += 1;
      registroPruebas.push({ seccion, nombre, estado: 'OK' });
      console.log(`  ✓ [${seccion}] ${nombre}`);
    } catch (err: unknown) {
      fallidas += 1;
      const detalle = err instanceof Error ? err.stack || err.message : String(err);
      registroPruebas.push({ seccion, nombre, estado: 'FALLO', detalle });
      console.error(`  ✗ [${seccion}] ${nombre}\n      ${detalle}`);
    }
  };
}

// ==========================================
// SECCIÓN 2: INVENTARIO DE LAS 8 ESPECIALIDADES
// ==========================================
const testInventario = [
  auditar('Inventario', 'Existen exactamente ocho especialidades en el catálogo oficial', () => {
    assert.equal(MODALIDADES.length, 8, `Se esperaban 8 especialidades y se encontraron ${MODALIDADES.length}`);
  }),

  auditar('Inventario', 'Los nombres y descriptores corresponden con los requerimientos exactos', () => {
    const mapaEsperado: Record<ModalidadId, { nombre: string; nombreCorto: string }> = {
      general: { nombre: 'Análisis general', nombreCorto: 'General' },
      bosquejo: { nombre: 'Liderazgo', nombreCorto: 'Liderazgo' },
      grupos: { nombre: 'Altares', nombreCorto: 'Altares' },
      jovenes: { nombre: 'Fogata', nombreCorto: 'Fogata' },
      ninos: { nombre: 'Niños', nombreCorto: 'Niños' },
      devocionales: { nombre: 'Devocionales de siete días', nombreCorto: 'Devocionales' },
      casa2: { nombre: 'Casa2 — Matrimonios', nombreCorto: 'Casa2' },
      ayuno: { nombre: 'Ayuno del Novio', nombreCorto: 'Ayuno del Novio' },
    };

    for (const mod of MODALIDADES) {
      const esp = mapaEsperado[mod.id];
      assert.ok(esp, `Especialidad desconocida en catálogo: ${mod.id}`);
      assert.equal(mod.nombre, esp.nombre, `Nombre de ${mod.id} incorrecto: esperado "${esp.nombre}", obtenido "${mod.nombre}"`);
      assert.equal(mod.nombreCorto, esp.nombreCorto, `Nombre corto de ${mod.id} incorrecto: esperado "${esp.nombreCorto}", obtenido "${mod.nombreCorto}"`);
    }
  }),

  auditar('Inventario', 'Las especialidades originales 5 (Liderazgo) y 6 (Niños) permanecen intactas', () => {
    const liderazgo = obtenerModalidad('bosquejo');
    assert.equal(liderazgo.nombre, 'Liderazgo');
    assert.equal(liderazgo.id, 'bosquejo');

    const infantil = obtenerModalidad('ninos');
    assert.equal(infantil.nombre, 'Niños');
    assert.equal(infantil.id, 'ninos');
  }),

  auditar('Inventario', 'Cada especialidad tiene identificador único y no hay duplicados ni solapamiento', () => {
    const ids = new Set(MODALIDADES.map((m) => m.id));
    assert.equal(ids.size, 8, 'Los identificadores no son únicos');
    const nombres = new Set(MODALIDADES.map((m) => m.nombre));
    assert.equal(nombres.size, 8, 'Los nombres visibles no son únicos');
  }),

  auditar('Inventario', 'Nombres de archivos PDF y DOCX son únicos y normalizados sin caracteres inválidos', () => {
    const nombresPdf = MODALIDADES.map((m) => nombreArchivoPdf(m.id));
    const nombresDocx = MODALIDADES.map((m) => nombreArchivoWord(m.id));

    assert.equal(new Set(nombresPdf).size, 8);
    assert.equal(new Set(nombresDocx).size, 8);

    assert.ok(nombresPdf.includes('teodoc-maim-altares.pdf'), 'Falta teodoc-maim-altares.pdf');
    assert.ok(nombresPdf.includes('teodoc-maim-fogata.pdf'), 'Falta teodoc-maim-fogata.pdf');
    assert.ok(nombresPdf.includes('teodoc-maim-casa2.pdf'), 'Falta teodoc-maim-casa2.pdf');
    assert.ok(nombresPdf.includes('teodoc-maim-ayuno-del-novio.pdf'), 'Falta teodoc-maim-ayuno-del-novio.pdf');

    assert.ok(nombresDocx.includes('teodoc-maim-altares.docx'), 'Falta teodoc-maim-altares.docx');
    assert.ok(nombresDocx.includes('teodoc-maim-fogata.docx'), 'Falta teodoc-maim-fogata.docx');
    assert.ok(nombresDocx.includes('teodoc-maim-casa2.docx'), 'Falta teodoc-maim-casa2.docx');
    assert.ok(nombresDocx.includes('teodoc-maim-ayuno-del-novio.docx'), 'Falta teodoc-maim-ayuno-del-novio.docx');
  }),
];

// ==========================================
// SECCIÓN 3: PRUEBAS FUNCIONALES INDIVIDUALES
// ==========================================
const testFuncionales = [
  auditar('Funcional', 'Altares conserva la metodología de Grupos pequeños con el nuevo nombre', async () => {
    const demo = crearResultadoDemo('grupos');
    assert.ok(demo.especializado.grupos, 'Falta el objeto grupos');
    assert.ok(especializadoTieneContenido('grupos', demo.especializado), 'especializadoTieneContenido falló para Altares');

    const meta = metadatosDemo('grupos');
    const pdfBlob = construirPdfModalidad({ analisis: demo, metadatos: meta, recursos: recursosPdf });
    assert.ok(pdfBlob.size > 20_000, 'PDF de Altares demasiado pequeño');

    const docxBlob = await construirWordModalidad({ analisis: demo, metadatos: meta });
    assert.ok(docxBlob.size > 8_000, 'DOCX de Altares demasiado pequeño');

    const bufferDocx = Buffer.from(await docxBlob.arrayBuffer());
    const zip = await JSZip.loadAsync(bufferDocx);
    const xml = await zip.file('word/document.xml')?.async('string') || '';
    assert.ok(xml.includes('ALTARES') || xml.includes('Altares'), 'DOCX no incluye Altares');
    assert.ok(xml.includes('Agenda de la reunión'), 'DOCX de Altares perdió la agenda');
    assert.ok(xml.includes('Actividad grupal'), 'DOCX de Altares perdió la actividad');
  }),

  auditar('Funcional', 'Fogata conserva la metodología de Jóvenes con el nuevo nombre', async () => {
    const demo = crearResultadoDemo('jovenes');
    assert.ok(demo.especializado.jovenes, 'Falta el objeto jovenes');
    assert.ok(especializadoTieneContenido('jovenes', demo.especializado), 'especializadoTieneContenido falló para Fogata');

    const meta = metadatosDemo('jovenes');
    const pdfBlob = construirPdfModalidad({ analisis: demo, metadatos: meta, recursos: recursosPdf });
    assert.ok(pdfBlob.size > 20_000, 'PDF de Fogata demasiado pequeño');

    const docxBlob = await construirWordModalidad({ analisis: demo, metadatos: meta });
    assert.ok(docxBlob.size > 8_000, 'DOCX de Fogata demasiado pequeño');

    const bufferDocx = Buffer.from(await docxBlob.arrayBuffer());
    const zip = await JSZip.loadAsync(bufferDocx);
    const xml = await zip.file('word/document.xml')?.async('string') || '';
    assert.ok(xml.includes('FOGATA') || xml.includes('Fogata'), 'DOCX no incluye Fogata');
    assert.ok(xml.includes('Conceptos teológicos'), 'DOCX de Fogata perdió conceptos teológicos');
    assert.ok(xml.includes('Dinámica participativa'), 'DOCX de Fogata perdió la dinámica');
  }),

  auditar('Funcional', 'Liderazgo, Niños, Devocionales y General conservan su estructura íntegra', async () => {
    for (const mod of ['bosquejo', 'ninos', 'devocionales', 'general'] as ModalidadId[]) {
      const demo = crearResultadoDemo(mod);
      const meta = metadatosDemo(mod);
      const pdfBlob = mod === 'general'
        ? construirPdfGeneral(demo, meta, recursosPdf)
        : construirPdfModalidad({ analisis: demo, metadatos: meta, recursos: recursosPdf });
      assert.ok(pdfBlob.size > 15_000, `PDF de ${mod} demasiado pequeño`);

      const docxBlob = mod === 'general'
        ? await construirWordGeneralDocumento({ analisis: demo, metadatos: meta })
        : await construirWordModalidad({ analisis: demo, metadatos: meta });
      assert.ok(docxBlob.size > 7_000, `DOCX de ${mod} demasiado pequeño`);
    }
  }),
];

// ==========================================
// SECCIÓN 4: AUDITORÍA ESPECIALIZADA DE CASA2
// ==========================================
const testCasa2 = [
  auditar('Casa2', 'Estructura exhaustiva de los 12 puntos requeridos en Casa2', () => {
    const demo = crearResultadoDemo('casa2');
    const casa2 = demo.especializado.casa2!;
    assert.ok(casa2, 'No se pudo cargar el fixture de Casa2');

    // 1. Título y tema central
    assert.ok(casa2.titulo_tema.length > 5, 'Falta título y tema central');
    // 2. Idea central de la enseñanza
    assert.ok(casa2.idea_central.length > 15, 'Falta idea central');
    // 3. Fundamento bíblico (texto base, contexto, apoyo)
    assert.ok(casa2.fundamento_biblico.texto_base.cita, 'Falta cita de texto base');
    assert.ok(casa2.fundamento_biblico.texto_base.texto, 'Falta texto de versículo base');
    assert.ok(casa2.fundamento_biblico.contexto_matrimonial.length > 20, 'Falta contexto conyugal');
    assert.ok(casa2.fundamento_biblico.textos_apoyo && casa2.fundamento_biblico.textos_apoyo.length >= 1, 'Faltan versículos de apoyo');
    // 4. Aplicación matrimonial
    assert.ok(casa2.aplicacion_matrimonial.length >= 3, 'Se requieren al menos 3 aplicaciones matrimoniales');
    // 5. Fortalecimiento de la comunicación
    assert.ok(casa2.comunicacion.principios.length >= 3, 'Faltan principios de comunicación');
    assert.ok(casa2.comunicacion.ejercicio_dialogo.titulo, 'Falta título del ejercicio de diálogo');
    assert.ok(casa2.comunicacion.ejercicio_dialogo.pasos.length >= 3, 'Faltan pasos secuenciales en el ejercicio');
    // 6. Reflexión individual
    assert.ok(casa2.reflexion_individual.length >= 3, 'Faltan preguntas de reflexión individual');
    // 7. Reflexión en pareja
    assert.ok(casa2.reflexion_pareja.length >= 3, 'Faltan preguntas de conversación en pareja');
    // 8. Situaciones prácticas
    assert.ok(casa2.situaciones_practicas.length >= 2, 'Faltan situaciones prácticas');
    // 9. Actividad para realizar juntos
    assert.ok(casa2.actividad_juntos.titulo, 'Falta actividad en pareja');
    assert.ok(casa2.actividad_juntos.pasos.length >= 2, 'Faltan pasos en la actividad');
    // 10. Compromisos matrimoniales
    assert.ok(casa2.compromisos.length >= 3, 'Faltan compromisos matrimoniales');
    // 11. Oración en pareja
    assert.ok(casa2.oracion_pareja.length > 20, 'Falta oración en pareja');
    // 12. Conclusión y salvaguarda pastoral
    assert.ok(casa2.conclusion.length > 20, 'Falta conclusión');
    assert.ok(casa2.salvaguarda_pastoral && casa2.salvaguarda_pastoral.includes('No sustituye'), 'Falta salvaguarda pastoral ética');
  }),

  auditar('Casa2', 'Prueba de Pertinencia: adaptación de prédica no-matrimonial (Mayordomía)', () => {
    const rawNoMatrimonial = {
      titulo_tema: 'Mayordomía fiel en la administración del hogar y el pacto conyugal',
      idea_central: 'La administración de los recursos materiales y espirituales confiados por Dios debe gestionarse en mutuo acuerdo y transparencia conyugal.',
      fundamento_biblico: {
        texto_base: { cita: 'Lucas 16:10', texto: 'El que es fiel en lo muy poco, también en lo más es fiel.' },
        contexto_matrimonial: 'Jesús enseña que la fidelidad se prueba en lo cotidiano. En el matrimonio, la mayordomía no es un asunto individualista sino un ejercicio compartido de confianza y comunión.',
        textos_apoyo: [{ cita: '1 Corintios 4:2', texto: 'Ahora bien, se requiere de los administradores, que cada uno sea hallado fiel.' }],
      },
      aplicacion_matrimonial: [
        'Transparencia total en los ingresos y egresos familiares sin secretos financieros.',
        'Planificación del presupuesto mensual orando juntos por la provisión divina.',
        'Priorizar la generosidad y el sostenimiento del hogar por encima de gastos egoístas.',
      ],
      comunicacion: {
        principios: [
          'Hablar de dinero sin recriminaciones ni juicios por errores del pasado.',
          'Establecer acuerdos explícitos antes de realizar compras no esenciales.',
        ],
        ejercicio_dialogo: {
          titulo: 'Presupuesto en gracia: diálogo financiero de 15 minutos',
          objetivo: 'Revisar metas del hogar y validar acuerdos sin tensión.',
          pasos: ['Oren agradeciendo la provisión.', 'Compartan inquietudes con mansedumbre.', 'Definan prioridades conjuntas.'],
        },
      },
      reflexion_individual: [
        '¿He ocultado gastos o decisiones financieras a mi cónyuge por temor o independencia?',
        '¿Confío en la soberanía de Dios o descargo mi ansiedad económica en mi cónyuge?',
      ],
      reflexion_pareja: [
        '¿En qué decisiones económicas sentimos que necesitamos mayor alineación y unidad?',
        '¿Cómo podemos honrar a Dios juntos con nuestras finanzas este mes?',
      ],
      situaciones_practicas: [
        'Un imprevisto en el presupuesto del mes genera nerviosismo. En lugar de culparse, se unen en oración y ajustan los gastos no indispensables como un solo equipo.',
      ],
      actividad_juntos: {
        titulo: 'Diseño del plan financiero conyugal',
        objetivo: 'Elaborar un presupuesto transparente de bendición mutua.',
        pasos: ['Anotar metas comunes.', 'Asignar responsabilidades claras.', 'Sellar el acuerdo en oración.'],
      },
      compromisos: [
        'Revisar las finanzas quincenalmente en un clima de paz y diálogo.',
        'No incurrir en deudas individuales que comprometan la estabilidad del hogar.',
      ],
      oracion_pareja: 'Señor, te entregamos la mayordomía de nuestro hogar. Que el dinero nunca sea motivo de discordia, sino de gratitud y servicio mutuo en Cristo. Amén.',
      conclusion: 'La verdadera riqueza conyugal radica en la fidelidad mutua y la confianza compartida en la provisión de nuestro Padre celestial.',
      salvaguarda_pastoral: 'Este análisis conyugal ha sido elaborado con propósitos pastorales y de edificación espiritual. No sustituye la atención profesional o consejería financiera especializada.',
    };

    const normalizado = normalizarCasa2(rawNoMatrimonial);
    assert.ok(normalizado.titulo_tema.includes('Mayordomía'));
    assert.equal(normalizado.fundamento_biblico.texto_base.cita, 'Lucas 16:10');
    assert.ok(normalizado.aplicacion_matrimonial.length >= 3);
    assert.ok(especializadoTieneContenido('casa2', { casa2: normalizado }), 'Casa2 adaptado debe ser válido');
  }),

  auditar('Casa2', 'Generación de PDF y Word de Casa2 con formato y estructura completa', async () => {
    const demo = crearResultadoDemo('casa2');
    const meta = metadatosDemo('casa2');

    const pdfBlob = construirPdfModalidad({ analisis: demo, metadatos: meta, recursos: recursosPdf });
    const bufferPdf = Buffer.from(await pdfBlob.arrayBuffer());
    const docPdf = await pdfjs.getDocument({ data: new Uint8Array(bufferPdf), useSystemFonts: false, verbosity: 0 }).promise;
    assert.ok(docPdf.numPages >= 4, `El PDF de Casa2 debe tener al menos 4 páginas, tiene ${docPdf.numPages}`);

    let textoPdf = '';
    for (let p = 1; p <= docPdf.numPages; p++) {
      const page = await docPdf.getPage(p);
      const content = await page.getTextContent();
      textoPdf += content.items.map((it) => ('str' in it ? it.str : '')).join(' ') + '\n';
    }
    await docPdf.destroy();

    assert.ok(textoPdf.includes('CASA2') || textoPdf.includes('Casa2'), 'Falta marca Casa2 en PDF');
    assert.ok(textoPdf.includes('Aplicación a la vida matrimonial'), 'Falta sección de aplicación en PDF');
    assert.ok(textoPdf.includes('Fortalecimiento de la comunicación'), 'Falta sección de comunicación en PDF');
    assert.ok(textoPdf.includes('Compromisos matrimoniales'), 'Falta sección de compromisos en PDF');

    const docxBlob = await construirWordModalidad({ analisis: demo, metadatos: meta });
    const bufferDocx = Buffer.from(await docxBlob.arrayBuffer());
    const zip = await JSZip.loadAsync(bufferDocx);
    const xml = await zip.file('word/document.xml')?.async('string') || '';
    assert.ok(xml.includes('CASA2') || xml.includes('Casa2'), 'Falta Casa2 en Word');
    assert.ok(xml.includes('Fortalecimiento de la comunicación conyugal'), 'Falta comunicación en Word');
    assert.ok(xml.includes('Compromisos matrimoniales y oración'), 'Falta compromisos en Word');
  }),
];

// ==========================================
// SECCIÓN 5: AUDITORÍA ESPECIALIZADA DE AYUNO DEL NOVIO
// ==========================================
const testAyuno = [
  auditar('Ayuno', 'Contiene exactamente TRES (3) jornadas consecutivas y conectadas', () => {
    const demo = crearResultadoDemo('ayuno');
    const ayuno = demo.especializado.ayuno!;
    assert.ok(ayuno, 'No se pudo cargar el fixture de Ayuno del Novio');
    assert.equal(ayuno.dias.length, 3, `Ayuno del Novio debe tener exactamente 3 jornadas, tiene ${ayuno.dias.length}`);
    assert.equal(ayuno.dias[0].dia, 1);
    assert.equal(ayuno.dias[1].dia, 2);
    assert.equal(ayuno.dias[2].dia, 3);
  }),

  auditar('Ayuno', 'Progresión espiritual coherente en las 3 jornadas (Humillación -> Hambre -> Rompimiento)', () => {
    const demo = crearResultadoDemo('ayuno');
    const dias = demo.especializado.ayuno!.dias;

    const d1 = dias[0].tema.toLowerCase() + ' ' + dias[0].titulo.toLowerCase();
    const d2 = dias[1].tema.toLowerCase() + ' ' + dias[1].titulo.toLowerCase();
    const d3 = dias[2].tema.toLowerCase() + ' ' + dias[2].titulo.toLowerCase();

    assert.ok(d1.includes('humillación') || d1.includes('arrepentimiento') || d1.includes('examen'), 'Jornada 1 no refleja humillación o arrepentimiento');
    assert.ok(d2.includes('hambre') || d2.includes('presencia') || d2.includes('búsqueda') || d2.includes('intimidad'), 'Jornada 2 no refleja hambre espiritual o búsqueda');
    assert.ok(d3.includes('rompimiento') || d3.includes('consagración') || d3.includes('victoria') || d3.includes('unción'), 'Jornada 3 no refleja rompimiento o consagración');
  }),

  auditar('Ayuno', 'Cero referencias residuales a 7 días ni días adicionales', () => {
    const demo = crearResultadoDemo('ayuno');
    const serializado = JSON.stringify(demo.especializado.ayuno);
    assert.ok(!serializado.includes('7 días'), 'Se encontró mención residual de 7 días');
    assert.ok(!serializado.includes('siete días'), 'Se encontró mención residual de siete días');
    assert.ok(!serializado.includes('"dia":4'), 'Se encontró un día 4 espurio');
    assert.ok(!serializado.includes('"dia":7'), 'Se encontró un día 7 espurio');
  }),

  auditar('Ayuno', 'Cada jornada tiene desarrollo bíblico, reflexión, introspección, disciplina de ayuno y oración', () => {
    const dias = crearResultadoDemo('ayuno').especializado.ayuno!.dias;
    for (const dia of dias) {
      assert.ok(dia.titulo, `Falta título en jornada ${dia.dia}`);
      assert.ok(dia.lectura_principal.cita && dia.lectura_principal.texto, `Falta lectura en jornada ${dia.dia}`);
      assert.ok(dia.contexto && dia.contexto.length > 20, `Falta contexto en jornada ${dia.dia}`);
      assert.ok(dia.reflexion && dia.reflexion.length > 50, `Falta reflexión profunda en jornada ${dia.dia}`);
      assert.ok(dia.ensenanza_central, `Falta enseñanza central en jornada ${dia.dia}`);
      assert.ok(dia.pregunta_introspeccion, `Falta pregunta de introspección en jornada ${dia.dia}`);
      assert.ok(dia.aplicacion, `Falta aplicación en jornada ${dia.dia}`);
      assert.ok(dia.accion, `Falta disciplina o acción de ayuno en jornada ${dia.dia}`);
      assert.ok(dia.oracion, `Falta oración guiada en jornada ${dia.dia}`);
    }
  }),

  auditar('Ayuno', 'Normalizador recorta estrictamente a 3 días ante respuestas con jornadas excedentes', () => {
    const exceso = {
      introduccion: 'Llamado al ayuno',
      proposito: 'Consagración',
      dias: [
        { dia: 1, titulo: 'Día 1', lectura_principal: { cita: 'Mt 6:16', texto: 'Cuando ayunéis...' }, reflexion: 'Reflexión 1', ensenanza_central: 'E1', aplicacion: 'A1', accion: 'Ac1', oracion: 'O1' },
        { dia: 2, titulo: 'Día 2', lectura_principal: { cita: 'Mt 6:17', texto: 'Ungid vuestra cabeza...' }, reflexion: 'Reflexión 2', ensenanza_central: 'E2', aplicacion: 'A2', accion: 'Ac2', oracion: 'O2' },
        { dia: 3, titulo: 'Día 3', lectura_principal: { cita: 'Mt 6:18', texto: 'Tu Padre que ve...' }, reflexion: 'Reflexión 3', ensenanza_central: 'E3', aplicacion: 'A3', accion: 'Ac3', oracion: 'O3' },
        { dia: 4, titulo: 'Día 4 extra', lectura_principal: { cita: 'Mt 6:19', texto: 'No os hagáis tesoros...' }, reflexion: 'Reflexión 4', ensenanza_central: 'E4', aplicacion: 'A4', accion: 'Ac4', oracion: 'O4' },
        { dia: 5, titulo: 'Día 5 extra', lectura_principal: { cita: 'Mt 6:20', texto: 'Haced tesoros en el cielo...' }, reflexion: 'Reflexión 5', ensenanza_central: 'E5', aplicacion: 'A5', accion: 'Ac5', oracion: 'O5' },
      ],
    };
    const norm = normalizarAyuno(exceso);
    assert.equal(norm.dias.length, 3, 'El normalizador debió recortar estrictamente a 3 días');
    assert.equal(norm.dias[2].dia, 3);
  }),
];

// ==========================================
// SECCIÓN 6: AUDITORÍA DE GENERACIÓN MEDIANTE IA
// ==========================================
const testIa = [
  auditar('IA', 'Todas las 7 modalidades especializadas tienen reglas y esquemas JSON dedicados', () => {
    const especialidades: Array<Exclude<ModalidadId, 'general'>> = ['bosquejo', 'grupos', 'jovenes', 'ninos', 'devocionales', 'casa2', 'ayuno'];
    for (const esp of especialidades) {
      assert.ok(REGLAS_POR_MODALIDAD[esp], `Faltan reglas teológicas para ${esp}`);
      assert.ok(ESQUEMAS_POR_MODALIDAD[esp], `Falta esquema de salida estructurada para ${esp}`);
      assert.ok(REGLAS_POR_MODALIDAD[esp].length > 300, `Reglas para ${esp} son demasiado breves`);
    }
  }),

  auditar('IA', 'No hay contaminación cruzada de campos en los esquemas JSON de salida', () => {
    const esquemaCasa2: any = ESQUEMAS_POR_MODALIDAD.casa2;
    const esquemaAyuno: any = ESQUEMAS_POR_MODALIDAD.ayuno;
    const esquemaNinos: any = ESQUEMAS_POR_MODALIDAD.ninos;

    const propsCasa2 = esquemaCasa2.properties.especializado.properties.casa2.properties;
    const propsAyuno = esquemaAyuno.properties.especializado.properties.ayuno.properties;
    const propsNinos = esquemaNinos.properties.especializado.properties.ninos.properties;

    assert.ok(propsCasa2.comunicacion, 'Casa2 debe tener comunicación');
    assert.ok(!propsCasa2.dias, 'Casa2 no debe tener campo días');
    assert.ok(!propsCasa2.juego, 'Casa2 no debe tener campo juego');

    assert.ok(propsAyuno.dias, 'Ayuno debe tener campo días');
    assert.ok(!propsAyuno.comunicacion, 'Ayuno no debe tener comunicación');

    assert.ok(propsNinos.juego, 'Niños debe tener campo juego');
  }),

  auditar('IA', 'El monitor de progreso define etapas y mensajes contextuales para las 8 modalidades', () => {
    assert.ok(ETAPAS_ANALISIS.length >= 5, 'Deben existir al menos 5 etapas de análisis');
    for (const etapa of ETAPAS_ANALISIS) {
      assert.ok(etapa.pesoConAudio > 0 || etapa.pesoSinAudio > 0, `Peso inválido en etapa ${etapa.id}`);
      assert.ok(etapa.nombre.length > 3, `Nombre vacío en etapa ${etapa.id}`);
    }
    for (const mod of MODALIDADES) {
      const mensajes = MENSAJES_POR_MODALIDAD[mod.id];
      assert.ok(mensajes, `Faltan mensajes de progreso para ${mod.id}`);
      assert.ok(mensajes.validacion_preparacion, `Falta mensaje de validación para ${mod.id}`);
      assert.ok(mensajes.redaccion_especialidad, `Falta mensaje de redacción para ${mod.id}`);
      assert.ok(mensajes.completado, `Falta mensaje de completado para ${mod.id}`);
    }
  }),
];

// ==========================================
// SECCIÓN 7: AUDITORÍA DE DOCUMENTOS Y ALMACENAMIENTO
// ==========================================
const testDocumentos = [
  auditar('Documentos', 'Generación de los 8 documentos PDF y 8 documentos DOCX sin caracteres inválidos', async () => {
    for (const mod of MODALIDADES) {
      const demo = crearResultadoDemo(mod.id);
      const meta = metadatosDemo(mod.id);

      // PDF con recursos oficiales (fuentes y logos)
      const pdfBlob = mod.id === 'general'
        ? construirPdfGeneral(demo, meta, recursosPdf)
        : construirPdfModalidad({ analisis: demo, metadatos: meta, recursos: recursosPdf });
      assert.ok(pdfBlob.size > 20_000, `PDF ${mod.id} falló en tamaño`);
      writeFileSync(resolve(dirSalida, nombreArchivoPdf(mod.id)), Buffer.from(await pdfBlob.arrayBuffer()));

      // DOCX
      const docxBlob = mod.id === 'general'
        ? await construirWordGeneralDocumento({ analisis: demo, metadatos: meta })
        : await construirWordModalidad({ analisis: demo, metadatos: meta });
      assert.ok(docxBlob.size > 7_000, `DOCX ${mod.id} falló en tamaño`);
      writeFileSync(resolve(dirSalida, nombreArchivoWord(mod.id)), Buffer.from(await docxBlob.arrayBuffer()));
    }
  }),

  auditar('Documentos', 'Ciclo completo de almacenamiento en biblioteca local (localStorage simulado)', async () => {
    const memoriaLocal: Record<string, string> = {};
    const win = {
      localStorage: {
        getItem: (k: string) => memoriaLocal[k] ?? null,
        setItem: (k: string, v: string) => { memoriaLocal[k] = v; },
        removeItem: (k: string) => { delete memoriaLocal[k]; },
        clear: () => { Object.keys(memoriaLocal).forEach((k) => delete memoriaLocal[k]); },
        key: (idx: number) => Object.keys(memoriaLocal)[idx] ?? null,
        get length() { return Object.keys(memoriaLocal).length; },
      } as Storage,
    };
    (globalThis as unknown as { window: typeof win }).window = win;

    const biblio = await import('../lib/biblioteca.ts');
    const metaBase = metadatosDemo('general');
    const idPredica = metaBase.fechaAnalisis;
    const general = crearResultadoDemo('general');
    biblio.guardarPredicacionConGeneral('Texto de la prédica', metaBase, general);

    // Guardar Casa2
    const casa2 = crearResultadoDemo('casa2');
    biblio.guardarDocumento(idPredica, 'Texto', { ...metadatosDemo('casa2'), fechaAnalisis: idPredica }, casa2);

    // Guardar Ayuno
    const ayuno = crearResultadoDemo('ayuno');
    biblio.guardarDocumento(idPredica, 'Texto', { ...metadatosDemo('ayuno'), fechaAnalisis: idPredica }, ayuno);

    // Guardar Altares
    const altares = crearResultadoDemo('grupos');
    biblio.guardarDocumento(idPredica, 'Texto', { ...metadatosDemo('grupos'), fechaAnalisis: idPredica }, altares);

    const guardadas = biblio.leerBiblioteca();
    assert.equal(guardadas.length, 1, `Se esperaba 1 registro histórico y se encontraron ${guardadas.length}`);
    const docs = guardadas[0].documentos;
    assert.ok(docs.general, 'Falta general en biblioteca');
    assert.ok(docs.casa2, 'Falta Casa2 en biblioteca');
    assert.ok(docs.ayuno, 'Falta Ayuno en biblioteca');
    assert.ok(docs.grupos, 'Falta Altares en biblioteca');
    assert.equal(Object.keys(docs).length, 4, 'Deben existir 4 documentos guardados para esta prédica');
  }),
];

// ==========================================
// SECCIÓN 9 Y 10: SEGURIDAD, REGRESIÓN Y CALIDAD
// ==========================================
const testSeguridadYRegresion = [
  auditar('Seguridad', 'Saneamiento riguroso de metadatos evita espacios superfluos y desbordamientos', () => {
    assert.equal(normalizarPredicador('  Pastor Samuel Rojas  \n'), 'Pastor Samuel Rojas');
    assert.equal(normalizarPredicador('   '), undefined);
    assert.ok(normalizarPredicador('x'.repeat(300))!.length <= 120);
    assert.equal(normalizarTituloProporcionado('   '), undefined);
    assert.equal(normalizarFechaISO('fecha-invalida'), undefined);
    assert.equal(normalizarFechaISO('2026-10-18'), '2026-10-18');
  }),

  auditar('Regresión', 'Normalización general de respuestas mantiene compatibilidad con datos históricos', () => {
    const rawHistorico = {
      titulo: 'Título Histórico',
      idea_principal: 'Idea central histórica',
      tema_principal: 'Tema histórico',
      proposito: 'Propósito histórico',
      texto_biblico_principal: { cita: 'Salmos 23:1', texto: 'Jehová es mi pastor' },
      otros_textos: [],
      desarrollo_progresivo: [{ punto: 'Punto 1', explicacion: 'Explicación 1', versiculos: [] }],
      ensenanzas: ['E1', 'E2'],
      conceptos_clave: ['C1'],
      conceptos_teologicos: [],
      aplicacion: ['A1'],
      conclusion: 'Conclusión histórica',
      oracion: 'Oración histórica',
      especializado: {
        grupos: {
          objetivo: 'Obj',
          idea_central: 'Idea',
          agenda: [{ momento: 'M1', minutos: '10', descripcion: 'D1' }, { momento: 'M2', minutos: '20', descripcion: 'D2' }, { momento: 'M3', minutos: '30', descripcion: 'D3' }],
          materiales: ['B'],
          preguntas_inicio: ['P1', 'P2'],
          preguntas_comprension: ['P3', 'P4'],
          preguntas_reflexion: ['P5', 'P6'],
          actividad: { titulo: 'Act', objetivo: 'Obj', pasos: ['P1', 'P2'] },
          caso_practico: 'Caso',
          aplicaciones: ['A1', 'A2'],
          compromiso_semanal: 'Compromiso',
          motivos_oracion: ['M1'],
          oracion_final: 'Oración',
          orientaciones_lider: ['O1', 'O2'],
        },
      },
    };

    const norm = normalizarRespuesta(rawHistorico, metadatosDemo('grupos'));
    assert.equal(norm.titulo, 'La fe que transforma'); // preserva el proporcionado en metadatosDemo
    assert.ok(norm.especializado.grupos);
    assert.ok(especializadoTieneContenido('grupos', norm.especializado));
  }),
];

async function ejecutarAuditoria() {
  console.log('===============================================================');
  console.log('   AUDITORÍA TÉCNICA Y CONTROL DE CALIDAD QA — TEODOC MAIM     ');
  console.log('===============================================================\n');

  const todas = [
    ...testInventario,
    ...testFuncionales,
    ...testCasa2,
    ...testAyuno,
    ...testIa,
    ...testDocumentos,
    ...testSeguridadYRegresion,
  ];

  for (const prueba of todas) {
    await prueba();
  }

  console.log('\n===============================================================');
  console.log(`TOTAL DE PRUEBAS EJECUTADAS: ${todas.length}`);
  console.log(`PRUEBAS APROBADAS: ${pasadas}`);
  console.log(`PRUEBAS FALLIDAS: ${fallidas}`);
  console.log(`RESULTADO FINAL: ${fallidas === 0 ? 'AUDITORÍA SUPERADA CON ÉXITO' : 'SE DETECTARON FALLOS'}`);
  console.log('===============================================================\n');

  if (fallidas > 0) {
    process.exit(1);
  }
}

ejecutarAuditoria();
