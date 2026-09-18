import { jsPDF } from 'jspdf';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const raiz = path.resolve(__dirname, '..');

// Cargar Logo Oficial TeoDoc
const logoPath = path.resolve(raiz, 'Logotipos/logos png/teodoc-logo-horizontal-800.png');
let logoBase64 = null;
if (fs.existsSync(logoPath)) {
  const logoBuf = fs.readFileSync(logoPath);
  logoBase64 = `data:image/png;base64,${logoBuf.toString('base64')}`;
}

const doc = new jsPDF({ unit: 'pt', format: 'a4' });
const pageW = doc.internal.pageSize.getWidth(); // ~595.28 pt
const pageH = doc.internal.pageSize.getHeight(); // ~841.89 pt

// Geometría canónica TeoDoc (Márgenes de Argollado y Encuadernación de Libros)
const margin = 98;  // Margen interior izquierdo (~35 mm para perforación / anillado seguro)
const marginR = 54; // Margen exterior derecho
const marginT = 50; // Margen superior
const marginB = 56; // Margen inferior
const contentW = pageW - margin - marginR; // ~443.28 pt
const bottomY = pageH - marginB;

// Paleta Oficial IBM Carbon Design System
const C = {
  ink: [22, 22, 22],            // #161616 Carbon Gray 100
  secondary: [60, 60, 60],      // #3C3C3C Carbon Gray 80
  muted: [110, 110, 110],       // #6E6E6E Carbon Gray 60
  accent: [15, 98, 254],        // #0F62FE Carbon Blue 60
  accentLight: [120, 169, 255], // #78A9FF Carbon Blue 40
  surface: [246, 246, 248],     // #F6F6F8 Carbon Cool Gray 10
  cardBorder: [220, 224, 230],  // #DCE0E6 Carbon Gray 20
  success: [36, 161, 72],       // #24A148 Green 60
  warning: [180, 115, 0],       // Ámbar equilibrado
  white: [255, 255, 255],
};

const setText = (c) => doc.setTextColor(c[0], c[1], c[2]);
const setFill = (c) => doc.setFillColor(c[0], c[1], c[2]);
const setStroke = (c) => doc.setDrawColor(c[0], c[1], c[2]);

let y = marginT;

function dibujarBandaSuperior() {
  setFill(C.accent);
  doc.rect(0, 0, pageW, 5, 'F');
}

function iniciarPagina() {
  dibujarBandaSuperior();
  y = marginT + 12;
}

function saltarPagina() {
  doc.addPage();
  iniciarPagina();
}

function ensure(needed) {
  if (y + needed > bottomY) {
    saltarPagina();
  }
}

/**
 * Renderizado de párrafos con espaciado editorial Impeccable.
 * Interlineado proporcional y respiración inferior generosa.
 */
function parrafo(texto, opts = {}) {
  const size = opts.size ?? 9.5;
  const lead = opts.lead ?? 14.6;
  const color = opts.color ?? C.secondary;
  const font = opts.font ?? 'normal';
  const indent = opts.indent ?? 0;
  const after = opts.after ?? 12;
  const maxW = contentW - indent;

  doc.setFont('helvetica', font);
  doc.setFontSize(size);
  setText(color);

  const lineas = doc.splitTextToSize(texto, maxW);
  for (const l of lineas) {
    if (y + lead > bottomY) saltarPagina();
    doc.text(l, margin + indent, y);
    y += lead;
  }
  y += after;
}

/**
 * Encabezado de sección con arquitectura Carbon:
 * Separación vertical generosa previa (26 pt), acento lateral,
 * jerarquía nítida con badge y línea divisoria con resguardo de 18 pt.
 */
function encabezadoSeccion(numero, titulo, esInicioDePagina = false) {
  if (!esInicioDePagina) {
    ensure(78);
    y += 24; // Separación generosa del bloque precedente
  }
  const top = y;

  // Barra de acento vertical Carbon
  setFill(C.accent);
  doc.rect(margin, top, 3.5, 30, 'F');

  // Badge superior de metadato técnico
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  setText(C.accent);
  doc.text(`// SECCIÓN ${numero}`, margin + 12, top + 10);

  // Título principal de la sección
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  setText(C.ink);
  doc.text(titulo.toUpperCase(), margin + 12, top + 25);

  // Línea divisoria estructural
  const lineY = top + 36;
  setStroke(C.cardBorder);
  doc.setLineWidth(0.6);
  doc.line(margin, lineY, pageW - marginR, lineY);

  // Distancia limpia y amplia antes del primer elemento de contenido
  y = lineY + 18;
}

/**
 * Subtítulos de nivel 2 (H3) con separación superior e inferior calibrada según Impeccable.
 * Prohíbe solapamientos y otorga 8 pt de aire visible entre descenders y ascenders.
 */
function subtitulo(titulo) {
  ensure(45);
  y += 20; // Aire superior distintivo frente al texto previo
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  setText(C.ink);
  doc.text(titulo, margin, y);
  y += 18; // Distancia amplia hasta el primer renglón del cuerpo
}

/**
 * Cajas de llamada (Callouts) de alta precisión editorial.
 * Padding perimetral generoso, interlineado cómodo y margen exterior de 18 pt.
 */
function callout(texto, tipo = 'info', titulo = '') {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.8);

  const bloques = texto.split('\n').filter((b) => b.trim().length > 0);
  const itemsProcesados = [];
  const leadLine = 13.5;
  const gapItem = 6;
  let altoContenido = 0;

  bloques.forEach((bloque) => {
    const esBullet = bloque.startsWith('•') || /^\d+\./.test(bloque);
    const lineas = doc.splitTextToSize(bloque, contentW - 32);
    itemsProcesados.push({ lineas, esBullet });
    altoContenido += lineas.length * leadLine + (esBullet ? gapItem : gapItem / 2);
  });

  const padTop = 13;
  const padBottom = 12;
  const altoTitulo = titulo ? 16 : 0;
  const h = padTop + altoTitulo + altoContenido + padBottom;

  ensure(h + 12);
  const top = y;

  // Fondo y borde perimetral sutil
  setFill(C.surface);
  doc.roundedRect(margin, top, contentW, h, 3, 3, 'F');
  setStroke(C.cardBorder);
  doc.setLineWidth(0.6);
  doc.roundedRect(margin, top, contentW, h, 3, 3, 'S');

  // Acento lateral cromático
  const accentColor = tipo === 'success' ? C.success : tipo === 'warning' ? C.warning : C.accent;
  setFill(accentColor);
  doc.rect(margin, top, 3.5, h, 'F');

  let curY = top + padTop;

  // Título del callout
  if (titulo) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    setText(accentColor);
    doc.text(titulo.toUpperCase(), margin + 15, curY);
    curY += 15;
  }

  // Contenido de párrafos / viñetas
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.8);
  setText(C.ink);

  itemsProcesados.forEach((item) => {
    item.lineas.forEach((l) => {
      doc.text(l, margin + 15, curY);
      curY += leadLine;
    });
    curY += item.esBullet ? gapItem : gapItem / 2;
  });

  y = top + h + 18; // Resguardo generoso tras la caja
}

/**
 * Tablas clave-valor con altura de celda ampliada y ritmo de lectura holgado.
 */
function tablaKeyValue(pares) {
  const wClave = 142;
  const wValor = contentW - wClave;
  const padX = 10;
  const padY = 7.5;
  const lineH = 12.5;

  doc.setFontSize(8.5);
  const filas = pares.map((p) => {
    doc.setFont('helvetica', 'bold');
    const lClave = doc.splitTextToSize(p.clave, wClave - padX * 2);
    doc.setFont('helvetica', 'normal');
    const lValor = doc.splitTextToSize(String(p.valor), wValor - padX * 2);
    const maxL = Math.max(lClave.length, lValor.length);
    const h = padY * 2 + maxL * lineH;
    return { lClave, lValor, h };
  });

  const hTotal = filas.reduce((acc, f) => acc + f.h, 0);
  ensure(hTotal + 15);
  const top = y;
  let curY = top;

  filas.forEach((f, idx) => {
    setFill(idx % 2 === 0 ? C.surface : C.white);
    doc.rect(margin, curY, contentW, f.h, 'F');

    setStroke(C.cardBorder);
    doc.setLineWidth(0.5);
    doc.line(margin, curY + f.h, pageW - marginR, curY + f.h);

    // Clave
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.4);
    setText(C.ink);
    let ty = curY + padY + 9;
    f.lClave.forEach((l) => {
      doc.text(l, margin + padX, ty);
      ty += lineH;
    });

    // Valor
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.4);
    setText(C.secondary);
    ty = curY + padY + 9;
    f.lValor.forEach((l) => {
      doc.text(l, margin + wClave + padX, ty);
      ty += lineH;
    });

    curY += f.h;
  });

  setStroke(C.cardBorder);
  doc.setLineWidth(0.6);
  doc.rect(margin, top, contentW, hTotal, 'S');

  y = curY + 20; // Resguardo amplio tras la tabla
}

// -------------------------------------------------------------
// DIBUJOS VECTORIALES DE ARQUITECTURA
// -------------------------------------------------------------
function dibujarDiagramaFlujoPrincipal() {
  const hDiagrama = 142;
  ensure(hDiagrama + 16);
  const top = y;

  setFill(C.surface);
  doc.roundedRect(margin, top, contentW, hDiagrama, 4, 4, 'F');
  setStroke(C.cardBorder);
  doc.setLineWidth(0.8);
  doc.roundedRect(margin, top, contentW, hDiagrama, 4, 4, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.8);
  setText(C.accent);
  doc.text('DIAGRAMA DE ARQUITECTURA: PIPELINE END-TO-END', margin + 12, top + 15);

  const wNodo = 94;
  const hNodo = 41;
  const gapNodo = 14;
  const startX = margin + 12;

  const nodos = [
    { x: startX, y: top + 26, w: wNodo, h: hNodo, t1: '1. ENTRADA', t2: 'Audio / YouTube', sub: 'Chunks 20 MB' },
    { x: startX + (wNodo + gapNodo), y: top + 26, w: wNodo, h: hNodo, t1: '2. STT PROXY', t2: 'AssemblyAI', sub: 'nova-2 Fallback' },
    { x: startX + (wNodo + gapNodo) * 2, y: top + 26, w: wNodo, h: hNodo, t1: '3. FAST-PATH', t2: 'Validación <1ms', sub: 'Canon Bíblico' },
    { x: startX + (wNodo + gapNodo) * 3, y: top + 26, w: wNodo, h: hNodo, t1: '4. ANÁLISIS', t2: 'Gemini Flash', sub: 'OpenR / DeepSeek' },
  ];

  nodos.forEach((n, i) => {
    setFill(C.white);
    doc.roundedRect(n.x, n.y, n.w, n.h, 3, 3, 'F');
    setStroke(C.cardBorder);
    doc.setLineWidth(0.6);
    doc.roundedRect(n.x, n.y, n.w, n.h, 3, 3, 'S');

    setFill(C.accent);
    doc.rect(n.x, n.y, n.w, 2, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    setText(C.accent);
    doc.text(n.t1, n.x + 6, n.y + 11);

    doc.setFontSize(7.2);
    setText(C.ink);
    doc.text(n.t2, n.x + 6, n.y + 22);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.2);
    setText(C.muted);
    doc.text(n.sub, n.x + 6, n.y + 33);

    if (i < nodos.length - 1) {
      const ax1 = n.x + n.w + 2;
      const ax2 = n.x + n.w + gapNodo - 2;
      const ay = n.y + n.h / 2;
      setStroke(C.accent);
      doc.setLineWidth(1);
      doc.line(ax1, ay, ax2, ay);
      doc.line(ax2 - 3, ay - 2.5, ax2, ay);
      doc.line(ax2 - 3, ay + 2.5, ax2, ay);
    }
  });

  // Fila inferior: Salidas editoriales
  const wSalida = 180;
  const hSalida = 40;
  const nodosSalida = [
    { x: margin + 26, y: top + 86, w: wSalida, h: hSalida, t1: 'SALIDA EDITORIAL 9:16', t2: 'Infografía PNG 1080×1920 px', sub: 'Retícula Carbon 8px · Tema Claro/Oscuro' },
    { x: margin + 238, y: top + 86, w: wSalida, h: hSalida, t1: 'DOCUMENTO IMPRESO A4', t2: 'Estudio Expositivo en PDF', sub: 'Margen Seguro 98 pt para Argollado' },
  ];

  nodosSalida.forEach((ns) => {
    setFill(C.white);
    doc.roundedRect(ns.x, ns.y, ns.w, ns.h, 3, 3, 'F');
    setStroke(C.cardBorder);
    doc.setLineWidth(0.6);
    doc.roundedRect(ns.x, ns.y, ns.w, ns.h, 3, 3, 'S');

    setFill(C.success);
    doc.rect(ns.x, ns.y, ns.w, 2, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    setText(C.success);
    doc.text(ns.t1, ns.x + 8, ns.y + 11);

    doc.setFontSize(7.5);
    setText(C.ink);
    doc.text(ns.t2, ns.x + 8, ns.y + 22);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    setText(C.muted);
    doc.text(ns.sub, ns.x + 8, ns.y + 33);
  });

  const origenX = nodos[3].x + nodos[3].w / 2;
  setStroke(C.accent);
  doc.setLineWidth(0.8);
  doc.line(origenX, top + 67, origenX, top + 77);
  doc.line(nodosSalida[0].x + wSalida / 2, top + 77, origenX, top + 77);
  doc.line(nodosSalida[0].x + wSalida / 2, top + 77, nodosSalida[0].x + wSalida / 2, top + 86);
  doc.line(nodosSalida[1].x + wSalida / 2, top + 77, nodosSalida[1].x + wSalida / 2, top + 86);

  y = top + hDiagrama + 20;
}

function dibujarDiagramaResilienciaLLM() {
  const h = 100;
  ensure(h + 16);
  const top = y;

  setFill(C.surface);
  doc.roundedRect(margin, top, contentW, h, 4, 4, 'F');
  setStroke(C.cardBorder);
  doc.setLineWidth(0.8);
  doc.roundedRect(margin, top, contentW, h, 4, 4, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.8);
  setText(C.accent);
  doc.text('CADENA DE RESILIENCIA Y FAILOVER LLM (COSTO CERO A RESIDUAL)', margin + 12, top + 14);

  const wTier = 124;
  const hTier = 58;
  const gapTier = 20;
  const startX = margin + 12;

  const tiers = [
    { x: startX, y: top + 26, w: wTier, h: hTier, t: 'TIER 1 (PRINCIPAL)', m: 'Gemini 3.7 / 3.6 Flash', desc: 'JSON Schema estricto\nContexto 1M tokens · Costo $0', col: C.accent },
    { x: startX + (wTier + gapTier), y: top + 26, w: wTier, h: hTier, t: 'TIER 2 (RESPALDO)', m: 'OpenRouter Free Pool', desc: 'gemini-2.0 / qwen-2.5\nCaché catálogo 30m · Costo $0', col: [200, 100, 0] },
    { x: startX + (wTier + gapTier) * 2, y: top + 26, w: wTier, h: hTier, t: 'TIER 3 (CONTINGENCIA)', m: 'DeepSeek Chat (Pago)', desc: 'json_object · 8K tokens\nSalvaguarda final resiliente', col: C.success },
  ];

  tiers.forEach((tr, i) => {
    setFill(C.white);
    doc.roundedRect(tr.x, tr.y, tr.w, tr.h, 3, 3, 'F');
    setStroke(C.cardBorder);
    doc.setLineWidth(0.6);
    doc.roundedRect(tr.x, tr.y, tr.w, tr.h, 3, 3, 'S');

    setFill(tr.col);
    doc.rect(tr.x, tr.y, tr.w, 2, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    setText(tr.col);
    doc.text(tr.t, tr.x + 6, tr.y + 11);

    doc.setFontSize(7.5);
    setText(C.ink);
    doc.text(tr.m, tr.x + 6, tr.y + 23);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.2);
    setText(C.muted);
    const lns = doc.splitTextToSize(tr.desc, tr.w - 12);
    let ly = tr.y + 34;
    lns.forEach((l) => { doc.text(l, tr.x + 6, ly); ly += 9; });

    if (i < tiers.length - 1) {
      const ax1 = tr.x + tr.w + 2;
      const ax2 = tr.x + tr.w + gapTier - 2;
      const ay = tr.y + tr.h / 2;
      setStroke(tr.col);
      doc.setLineWidth(1);
      doc.line(ax1, ay, ax2, ay);
      doc.line(ax2 - 3, ay - 2.5, ax2, ay);
      doc.line(ax2 - 3, ay + 2.5, ax2, ay);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(5.8);
      setText(tr.col);
      doc.text('429/503', ax1 + 2, ay - 4);
    }
  });

  y = top + h + 20;
}

// =========================================================================
// CONSTRUCCIÓN EXACTA DE 5 PÁGINAS DE ALTA FIDELIDAD EDITORIAL
// =========================================================================

// ======================= PÁGINA 1: PORTADA & ARQUITECTURA GENERAL =======================
iniciarPagina();

// Logo Oficial TeoDoc Embebido
if (logoBase64) {
  doc.addImage(logoBase64, 'PNG', margin, marginT + 2, 138, 39);
  y = marginT + 58;
} else {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  setText(C.accent);
  doc.text('TeoDoc', margin, marginT + 26);
  y = marginT + 44;
}

// Eyebrow / Metadato superior
doc.setFont('helvetica', 'bold');
doc.setFontSize(8.2);
setText(C.accent);
doc.text('// ESPECIFICACIÓN DE INGENIERÍA · v2.1 PRODUCCIÓN', margin, y);
y += 20;

// Título Principal
doc.setFont('helvetica', 'bold');
doc.setFontSize(20);
setText(C.ink);
const mastTitle = doc.splitTextToSize('Arquitectura Integral del Sistema y Pipeline Homilético', contentW);
mastTitle.forEach((line) => {
  doc.text(line, margin, y);
  y += 25;
});
y += 4;

// Regla técnica Carbon
setStroke(C.accent);
doc.setLineWidth(2.5);
doc.line(margin, y, margin + 75, y);
setStroke(C.cardBorder);
doc.setLineWidth(0.6);
doc.line(margin + 75, y, pageW - marginR, y);
y += 18;

callout(
  'Este documento constituye la especificación de ingeniería definitiva de TeoDoc (v2.1). Describe la totalidad de flujos de datos, heurísticas algorítmicas, motores gráficos vectoriales y directrices de aseguramiento de calidad (QA) que permiten transformar audios orales en estudios teológicos rigurosos, respetando los estándares de diseño de IBM Carbon y el margen seguro de argollado de 98 pt.',
  'info',
  'Propósito del Documento y Rigor Exegético'
);

encabezadoSeccion('01', 'Visión y Flujo Global de Datos');

parrafo(
  'TeoDoc opera como un orquestador híbrido entre cliente y servidor. El objetivo primordial de su arquitectura es la soberanía del contenido y la resiliencia absoluta bajo una premisa de "Costo Cero": se maximiza el aprovechamiento de cuotas gratuitas con transiciones imperceptibles para el usuario.',
  { font: 'normal', after: 12 }
);

dibujarDiagramaFlujoPrincipal();

tablaKeyValue([
  { clave: 'Versión del Sistema', valor: 'TeoDoc v2.1.0 (Producción Septiembre 2026)' },
  { clave: 'Framework y Runtime', valor: 'Next.js 16.3.3 (App Router, Turbopack) + React 19.2.8' },
  { clave: 'Tipado e Invariantes', valor: 'TypeScript 5 + Suite de 40 pruebas automatizadas' },
  { clave: 'Sistema de Diseño', valor: 'IBM Carbon Design System + Estándares Impeccable' },
  { clave: 'Canon Bíblico Primario', valor: 'Reina-Valera 1960 (RV1960) estrictamente preservada' },
]);

// ======================= PÁGINA 2: INGESTA, STT Y FAST-PATH =======================
saltarPagina();

encabezadoSeccion('02', 'Ingesta de Medios y Speech-to-Text', true);

subtitulo('2.1 Subida Fragmentada (Chunked Upload) a Cloudinary');
parrafo(
  'Para asegurar tolerancia ante cortes en redes móviles y respetar los estrictos presupuestos de memoria de Safari en iOS, el frontend no carga el archivo completo en RAM. El archivo se segmenta mediante file.slice() en bloques atómicos de 20 MB y se despacha a Cloudinary con cabeceras de rango (Content-Range). El navegador solo procesa el bloque activo en cada instante.'
);

subtitulo('2.2 Pipeline de Transcripción con Failover Automático');
parrafo(
  'El endpoint /api/transcribe recibe la URL segura generada. Invoca de forma primaria a AssemblyAI en idioma español. Si el proveedor experimenta saturación o cuota agotada, el proxy conmuta en tiempo de ejecución hacia Deepgram nova-2 con smart_format=true, retornando la transcripción puntuada sin intervención humana.'
);

encabezadoSeccion('03', 'Fast-Path de Validación y Clasificación');

parrafo(
  'En la versión 2.1 se introdujo un algoritmo determinista en /api/validate que elimina 2 a 4 segundos de latencia de red antes del análisis homilético:'
);

callout(
  '• Contenido Insuficiente (<12 palabras): Rechazo inmediato por audio accidental o silencio ("corto").\n' +
  '• Aprobación Instantánea (<1ms): Si el texto tiene >= 35 palabras y contiene referencias bíblicas o términos teológicos manifiestos, se aprueba de inmediato sin llamada LLM.\n' +
  '• Evaluación Amable con IA: Para reflexiones devocionales breves o ambiguas, delega en Gemini Flash con JSON Schema estricto.\n' +
  '• Tolerancia a Fallos (Fail-Open): Ante cualquier error del validador, la plataforma aprueba la continuación para no bloquear al expositor.',
  'success',
  'Reglas Operativas del Fast-Path Heurístico (<1ms)'
);

// ======================= PÁGINA 3: RIQUEZA HOMILÉTICA Y LLM MULTI-TIER =======================
saltarPagina();

encabezadoSeccion('04', 'Clasificador de Riqueza Homilética', true);

parrafo(
  'La función evaluarRiqueza() en lib/riqueza-contenido.ts analiza matemáticamente la relación entre volumen de palabras, duración estimada (~130 palabras por minuto) y densidad de referencias bíblicas explícitas para sugerir dinámicamente la profundidad del análisis:'
);

tablaKeyValue([
  { clave: 'Nivel BREVE (<1,800 palabras)', valor: '2 a 3 puntos principales · Arquetipo Hero con ilustración' },
  { clave: 'Nivel MEDIA (1,800 - 4,500 palabras)', valor: '3 a 6 puntos principales · Cuadrícula editorial 2 columnas' },
  { clave: 'Nivel AMPLIA (4,500 - 9,000 palabras)', valor: '5 a 9 puntos principales · Versículos secundarios enlazados' },
  { clave: 'Nivel PROFUNDA (>9,000 palabras)', valor: '7 a 12 puntos principales · Alta densidad y rigor doctrinal' },
]);

encabezadoSeccion('05', 'Motor de Análisis y Cadena LLM Multi-Tier');

parrafo(
  'El núcleo teológico reside en /api/analyze/route.ts. Los modelos analizan la transcripción bajo directrices exegéticas de tradición evangélica, utilizando exclusivamente "el expositor" y la versión Reina-Valera 1960. La resiliencia está garantizada por tres escalones consecutivos:'
);

dibujarDiagramaResilienciaLLM();

subtitulo('5.1 Normalización Defensiva de Datos Homiléticos');
parrafo(
  'Para blindar la interfaz gráfica y los motores de exportación contra variaciones de formato o campos omitidos por los modelos, los datos atraviesan la función normalizarAnalisis():\n' +
  '• Derivación de Enseñanzas: Si el modelo no devuelve "grandes_ensenanzas", se generan del primer enunciado de cada punto.\n' +
  '• Sanitización Doctrinal: Los conceptos clave se sanean contra palabras vacías (stop words), garantizando términos de 1 a 3 palabras.\n' +
  '• Respaldo Bíblico: Si el pasaje principal no fue devuelto, se enlaza al primer versículo citado en la enseñanza.'
);

// ======================= PÁGINA 4: MOTORES EDITORIALES 9:16 Y PDF =======================
saltarPagina();

encabezadoSeccion('06', 'Motor de Composición Editorial 9:16', true);

parrafo(
  'Diseñado en lib/infografia-layout.ts y ejecutado en components/infografia.tsx. Resuelve el problema histórico de las infografías que crecían sin control vertical o se truncaban en Stories:'
);

callout(
  '• Lienzo Fijo 9:16: Ancho de 1080 px y alto inmutable de 1920 px en una sola lámina continua.\n' +
  '• Retícula Base 8px: Todos los espaciados, alturas y márgenes son múltiplos rigurosos de 8 px (Carbon Grid).\n' +
  '• Zonas Seguras (Safe Zones): 64 px superior e inferior resguardados contra controles de redes; 48 px laterales.\n' +
  '• Pisos de Legibilidad: Display >= 48px, Subtítulos >= 20px, Cuerpo >= 16px, Numerales >= 32px.\n' +
  '• Cero Recursos Remotos: 13 ilustraciones vectoriales temáticas inline compatibles con Safari iOS.',
  'info',
  'Especificación de la Infografía TeoDoc'
);

encabezadoSeccion('07', 'Motor PDF Vectorial y Margen de Argollado');

parrafo(
  'El PDF se genera programáticamente mediante jsPDF en el navegador sin dependencias de servidor ni demoras de red. Sigue directrices editoriales avanzadas para uso en carpetas ministeriales y encuadernación de libros:'
);

callout(
  '• Margen de Argollado Izquierdo (98 pt / ~35 mm): Zona de seguridad absoluta. Permite perforar con taladros de 2 o 3 orificios o encuadernar con espirales metálicos sin perforar texto ni numerales.\n' +
  '• Margen Exterior Derecho (54 pt / ~19 mm): Diseñado para equilibrio visual asimétrico en lectura natural.\n' +
  '• Control Anti-Huérfanos (Keep-With-Next): Todo encabezado evalúa el espacio remanente antes de imprimir, trasladando secciones completas a la página siguiente si no caben al menos dos líneas de cuerpo.\n' +
  '• Sincronización Estructural: Numerales y párrafos derivan del mismo objeto, imposibilitando desfases de numeración.',
  'success',
  'Especificación Editorial de Encuadernación PDF (98 pt)'
);

// ======================= PÁGINA 5: IOS IN-APP & CERTIFICACIÓN QA =======================
saltarPagina();

encabezadoSeccion('08', 'Arquitectura de Entrega In-App para iOS y Android', true);

parrafo(
  'En navegadores basados en WebKit (Safari en iPhone y iPad), las descargas programáticas tradicionales con tags <a> provocan la apertura de ventanas en blanco ("about:blank") y bloquean el guardado de archivos. TeoDoc resuelve esto con una metodología unificada de entrega:'
);

callout(
  '• Detección Certera: Identifica iOS e iPadOS moderno mediante navigator.platform y maxTouchPoints > 1.\n' +
  '• Cero Pestañas Fantasma: En iOS no se ejecuta a.click() programático. El archivo se monta en memoria de la ventana actual.\n' +
  '• Visor Modal In-App: El usuario previsualiza el PDF o PNG en un modal escalado a pantalla completa.\n' +
  '• Guardado y Difusión Nativa: El botón "Guardar / Compartir" invoca navigator.share({ files: [file] }), abriendo la hoja nativa de iOS en un solo toque.',
  'info',
  'Metodología de Entrega In-App Multiplataforma'
);

encabezadoSeccion('09', 'Resiliencia ante Pantalla Apagada y Persistencia');

parrafo(
  'Para resolver la suspensión prematura del navegador en móviles cuando la pantalla se apaga automáticamente por inactividad, TeoDoc implementa una arquitectura de doble nivel:'
);

callout(
  '• Screen Wake Lock API (lib/wake-lock.ts): Solicita al sistema operativo mantener la pantalla activa durante la subida y el análisis. Compatible nativamente con iOS Safari 16.4+ y Android Chrome.\n' +
  '• Re-adquisición Reactiva: Escucha el evento visibilitychange para reconectar el bloqueo si el usuario alternó de aplicación y regresó a TeoDoc.\n' +
  '• Persistencia en Cliente con TTL (lib/analisis-storage.ts): Guarda el análisis en localStorage con TTL de 48 horas y la transcripción en sessionStorage. Si el sistema operativo recarga la pestaña, el análisis se recupera de inmediato.\n' +
  '• Feedback IBM Carbon: Badge interactivo "Pantalla activa" en la barra de progreso y vibración háptica al finalizar en segundo plano.',
  'info',
  'Mecanismo de Prevención de Suspensión y Persistencia'
);

// ======================= PÁGINA 6: BLINDAJE Y CERTIFICACIÓN QA =======================
saltarPagina();

encabezadoSeccion('10', 'Blindaje de Seguridad Integral en 5 Capas', true);

parrafo(
  'Para resguardar la propiedad intelectual del software, las directrices doctrinales y la infraestructura backend contra abusos o intrusiones, TeoDoc implementa una arquitectura de Defensa en Profundidad:'
);

callout(
  '• Capa 1: Compilación Ofuscada (next.config.mjs): productionBrowserSourceMaps en false suprime los archivos .map. poweredByHeader en false elimina huellas del framework.\n' +
  '• Capa 2: Cabeceras Perimetrales Estrictas: Inyección de CSP estricto, HSTS de 2 años, X-Frame-Options: DENY (anti-clickjacking) y X-Content-Type-Options: nosniff.\n' +
  '• Capa 3: Gateway Perimetral (proxy.ts): Interceptor Next.js 16 para rutas /api/* que exige validación Same-Origin en métodos mutantes, bloqueando CSRF y scraping no autorizado.\n' +
  '• Capa 4: Endurecimiento de Rutas API: Rate limiting aislado por IP y endpoint (lib/rate-limit.ts con recolección de basura), filtro anti-SSRF de audioUrl y techos estrictos (150 MB / 250k chars).\n' +
  '• Capa 5: Blindaje Doctrinal LLM (lib/ai-gemini.ts): Delimitadores herméticos, cláusula anti-prompt injection y preservación inalterada de gemini-3.7-flash y gemini-3.6-flash.',
  'info',
  'Arquitectura de Blindaje en Profundidad (5 Capas)'
);

encabezadoSeccion('11', 'Certificación QA y Suite de Invariantes (58/58)');

parrafo(
  'Para garantizar que ninguna actualización altere los flujos ministeriales, exponga el código fuente ni pierda análisis al suspenderse la pantalla en móviles, el sistema ejecuta 58 pruebas automatizadas:'
);

tablaKeyValue([
  { clave: 'test:logica (11 pruebas)', valor: 'Riqueza textual, duraciones estimadas, conteo de versículos' },
  { clave: 'test:infografia (9 pruebas)', valor: 'Retícula Carbon 8px, safe zones, canvas fijo 1080×1920 px' },
  { clave: 'test:entrega (20 pruebas)', valor: 'Entrega iOS, MIME types, margen 98pt, término "expositor"' },
  { clave: 'test:seguridad (9 pruebas)', valor: 'Sin source maps, CSP estricto, proxy.ts, anti-SSRF y rate limit' },
  { clave: 'test:resiliencia (9 pruebas)', valor: 'Screen Wake Lock API, persistencia cliente 48h, auto-recuperación' },
]);

callout(
  'TeoDoc v2.1 se entrega auditado y certificado bajo los más altos estándares editoriales de IBM Carbon Design e Impeccable. Todas las funciones de exportación y análisis homilético han sido verificadas en entornos de escritorio y dispositivos móviles Apple iOS / Android, garantizando total soberanía de datos y fidelidad doctrinal permanente para pastores y expositores.',
  'success',
  'Garantía de Calidad y Disponibilidad Ministerial'
);

// -------------------------------------------------------------
// ENCABEZADOS Y PIES DE PÁGINA FORMALES EN TODAS LAS HOJAS
// -------------------------------------------------------------
const totalPaginas = doc.internal.getNumberOfPages();

for (let p = 1; p <= totalPaginas; p++) {
  doc.setPage(p);

  // Encabezado formal en páginas subsecuentes
  if (p > 1) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    setText(C.muted);
    doc.text('TEODOC · MANUAL TÉCNICO DE ARQUITECTURA Y METODOLOGÍAS', margin, marginT - 18);
    doc.setFont('helvetica', 'bold');
    setText(C.accent);
    doc.text('v2.1 PRODUCCIÓN', pageW - marginR - 78, marginT - 18);

    setStroke(C.cardBorder);
    doc.setLineWidth(0.5);
    doc.line(margin, marginT - 11, pageW - marginR, marginT - 11);
  }

  // Pie de página formal
  const pieY = pageH - marginB + 20;
  setStroke(C.cardBorder);
  doc.setLineWidth(0.5);
  doc.line(margin, pieY - 12, pageW - marginR, pieY - 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  setText(C.secondary);
  const piePrefijo = 'Versión 1 · Desarrollado por ';
  doc.text(piePrefijo, margin, pieY);
  const anchoPrefijo = doc.getTextWidth(piePrefijo);
  setText(C.accent);
  doc.setFont('helvetica', 'bold');
  doc.textWithLink('AlsizTech · www.alsiztech.com', margin + anchoPrefijo, pieY, { url: 'https://www.alsiztech.com' });

  doc.setFont('helvetica', 'bold');
  setText(C.accent);
  doc.text(`Página ${p} de ${totalPaginas}`, pageW - marginR - 65, pieY);
}

// Guardar archivo PDF en public y raíz
const outPathRoot = path.resolve(raiz, 'MANUAL_TECNICO_TEODOC.pdf');
const outPathPublic = path.resolve(raiz, 'public/MANUAL_TECNICO_TEODOC.pdf');

const pdfOutput = doc.output('arraybuffer');
fs.writeFileSync(outPathRoot, Buffer.from(pdfOutput));
fs.writeFileSync(outPathPublic, Buffer.from(pdfOutput));

console.log(`[Éxito] Manual PDF generado con estándares editoriales Impeccable:`);
console.log(`  -> ${outPathRoot} (${pdfOutput.byteLength} bytes)`);
console.log(`  -> ${outPathPublic} (${pdfOutput.byteLength} bytes)`);
console.log(`Total de páginas generadas: ${totalPaginas}`);
