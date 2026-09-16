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

// Geometría canónica TeoDoc (Márgenes de Argollado y Encuadernación)
const margin = 98; // Izquierdo (~35 mm para anillado/perforación seguro)
const marginR = 54; // Derecho
const marginT = 60; // Superior
const marginB = 64; // Inferior
const contentW = pageW - margin - marginR; // ~443.28 pt
const bottomY = pageH - marginB;

// Paleta IBM Carbon
const C = {
  ink: [22, 22, 22],        // #161616 Carbon Gray 100
  secondary: [82, 82, 82],  // #525252 Carbon Gray 70
  muted: [110, 110, 110],   // Carbon Gray 60
  accent: [15, 98, 254],    // #0F62FE Carbon Blue 60
  accentLight: [120, 169, 255], // #78A9FF Carbon Blue 40
  surface: [244, 244, 244], // #F4F4F4 Carbon Gray 10
  surfaceDark: [230, 230, 230],
  cardBorder: [224, 224, 224], // #E0E0E0
  success: [36, 161, 72],   // #24A148 Green 60
  warning: [241, 194, 27],  // #F1C21B Yellow 30
  white: [255, 255, 255],
};

const setText = (c) => doc.setTextColor(c[0], c[1], c[2]);
const setFill = (c) => doc.setFillColor(c[0], c[1], c[2]);
const setStroke = (c) => doc.setDrawColor(c[0], c[1], c[2]);

let y = marginT;

function dibujarBandaSuperior() {
  setFill(C.accent);
  doc.rect(0, 0, pageW, 6, 'F');
}

function nuevaPagina() {
  doc.addPage();
  dibujarBandaSuperior();
  y = marginT + 10;
}

function ensure(needed) {
  if (y + needed > bottomY) {
    nuevaPagina();
  }
}

function parrafo(texto, opts = {}) {
  const size = opts.size ?? 9.5;
  const lead = opts.lead ?? 14;
  const color = opts.color ?? C.secondary;
  const font = opts.font ?? 'normal';
  const indent = opts.indent ?? 0;
  const maxW = contentW - indent;

  doc.setFont('helvetica', font);
  doc.setFontSize(size);
  setText(color);

  const lineas = doc.splitTextToSize(texto, maxW);
  if (lineas.length > 1) ensure(lead * 2);

  for (const l of lineas) {
    if (y + lead > bottomY) nuevaPagina();
    doc.text(l, margin + indent, y);
    y += lead;
  }
  y += opts.after ?? 4;
}

function encabezadoSeccion(numero, titulo) {
  ensure(55);
  y += 10;
  setFill(C.accent);
  doc.rect(margin, y, 4, 16, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  setText(C.accent);
  doc.text(`SECCIÓN ${numero}`, margin + 12, y + 5);

  doc.setFontSize(13);
  setText(C.ink);
  doc.text(titulo.toUpperCase(), margin + 12, y + 17);

  y += 24;
  setStroke(C.cardBorder);
  doc.setLineWidth(0.6);
  doc.line(margin, y, pageW - marginR, y);
  y += 12;
}

function subtitulo(titulo) {
  ensure(32);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  setText(C.ink);
  doc.text(titulo, margin, y);
  y += 14;
}

function callout(texto, tipo = 'info', titulo = '') {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const lineas = doc.splitTextToSize(texto, contentW - 28);
  const h = (titulo ? 16 : 0) + lineas.length * 13 + 16;
  ensure(h + 8);

  const top = y;
  setFill(C.surface);
  doc.rect(margin, top, contentW, h, 'F');

  const accentColor = tipo === 'success' ? C.success : tipo === 'warning' ? C.warning : C.accent;
  setFill(accentColor);
  doc.rect(margin, top, 3.5, h, 'F');

  let curY = top + 14;
  if (titulo) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    setText(accentColor);
    doc.text(titulo.toUpperCase(), margin + 14, curY);
    curY += 12;
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  setText(C.ink);
  for (const l of lineas) {
    doc.text(l, margin + 14, curY);
    curY += 13;
  }
  y = top + h + 10;
}

function tablaKeyValue(pares) {
  const hFila = 20;
  const wClave = 130;
  const wValor = contentW - wClave;
  const hTotal = pares.length * hFila;
  ensure(hTotal + 10);

  let curY = y;
  pares.forEach((p, idx) => {
    setFill(idx % 2 === 0 ? C.surface : C.white);
    doc.rect(margin, curY, contentW, hFila, 'F');
    setStroke(C.cardBorder);
    doc.setLineWidth(0.5);
    doc.line(margin, curY + hFila, pageW - marginR, curY + hFila);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    setText(C.ink);
    doc.text(p.clave, margin + 8, curY + 13);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    setText(C.secondary);
    doc.text(String(p.valor), margin + wClave + 8, curY + 13);

    curY += hFila;
  });
  y = curY + 10;
}

// -------------------------------------------------------------
// DIBUJOS VECTORIALES DE ARQUITECTURA
// -------------------------------------------------------------
function dibujarDiagramaFlujoPrincipal() {
  const hDiagrama = 150;
  ensure(hDiagrama + 15);

  const top = y;
  setFill(C.surface);
  doc.roundedRect(margin, top, contentW, hDiagrama, 4, 4, 'F');
  setStroke(C.cardBorder);
  doc.setLineWidth(0.8);
  doc.roundedRect(margin, top, contentW, hDiagrama, 4, 4, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  setText(C.accent);
  doc.text('DIAGRAMA DE ARQUITECTURA: PIPELINE END-TO-END', margin + 12, top + 16);

  // Cajas del flujo
  const nodos = [
    { x: margin + 15, y: top + 32, w: 90, h: 42, t1: '1. ENTRADA', t2: 'Audio / YouTube', sub: 'Chunks 20MB' },
    { x: margin + 122, y: top + 32, w: 92, h: 42, t1: '2. STT PROXY', t2: 'AssemblyAI', sub: 'nova-2 Fallback' },
    { x: margin + 230, y: top + 32, w: 92, h: 42, t1: '3. FAST-PATH', t2: 'Validación <1ms', sub: 'Canon Bíblico' },
    { x: margin + 338, y: top + 32, w: 90, h: 42, t1: '4. ANÁLISIS LLM', t2: 'Gemini Flash', sub: 'OpenR/DeepSeek' },
  ];

  nodos.forEach((n, i) => {
    setFill(C.white);
    doc.roundedRect(n.x, n.y, n.w, n.h, 3, 3, 'F');
    setStroke(C.cardBorder);
    doc.setLineWidth(0.6);
    doc.roundedRect(n.x, n.y, n.w, n.h, 3, 3, 'S');

    // Barra azul superior en cada caja
    setFill(C.accent);
    doc.rect(n.x, n.y, n.w, 2.5, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    setText(C.accent);
    doc.text(n.t1, n.x + 6, n.y + 12);

    doc.setFontSize(7.5);
    setText(C.ink);
    doc.text(n.t2, n.x + 6, n.y + 24);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    setText(C.muted);
    doc.text(n.sub, n.x + 6, n.y + 35);

    // Flecha conector hacia el siguiente nodo
    if (i < nodos.length - 1) {
      const next = nodos[i + 1];
      const ax1 = n.x + n.w + 2;
      const ax2 = next.x - 3;
      const ay = n.y + n.h / 2;
      setStroke(C.accent);
      doc.setLineWidth(1);
      doc.line(ax1, ay, ax2, ay);
      doc.line(ax2 - 3, ay - 2.5, ax2, ay);
      doc.line(ax2 - 3, ay + 2.5, ax2, ay);
    }
  });

  // Nivel inferior: Salidas
  const nodosSalida = [
    { x: margin + 40, y: top + 92, w: 165, h: 42, t1: 'ENTREGA EDITORIAL 9:16', t2: 'Infografía PNG 1080×1920', sub: 'Retícula 8px · Tema Claro / Oscuro' },
    { x: margin + 235, y: top + 92, w: 165, h: 42, t1: 'DOCUMENTO MAQUETADO A4', t2: 'Estudio Expositivo en PDF', sub: 'Margen Seguro 98pt Argollado' },
  ];

  nodosSalida.forEach((ns) => {
    setFill(C.white);
    doc.roundedRect(ns.x, ns.y, ns.w, ns.h, 3, 3, 'F');
    setStroke(C.cardBorder);
    doc.setLineWidth(0.6);
    doc.roundedRect(ns.x, ns.y, ns.w, ns.h, 3, 3, 'S');

    setFill(C.success);
    doc.rect(ns.x, ns.y, ns.w, 2.5, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    setText(C.success);
    doc.text(ns.t1, ns.x + 8, ns.y + 12);

    doc.setFontSize(7.8);
    setText(C.ink);
    doc.text(ns.t2, ns.x + 8, ns.y + 24);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    setText(C.muted);
    doc.text(ns.sub, ns.x + 8, ns.y + 35);
  });

  // Conectores hacia las salidas
  setStroke(C.accent);
  doc.setLineWidth(0.8);
  doc.line(margin + 383, top + 74, margin + 383, top + 84);
  doc.line(margin + 122, top + 84, margin + 383, top + 84);
  doc.line(margin + 122, top + 84, margin + 122, top + 92);
  doc.line(margin + 317, top + 84, margin + 317, top + 92);

  y = top + hDiagrama + 14;
}

function dibujarDiagramaResilienciaLLM() {
  const h = 100;
  ensure(h + 15);

  const top = y;
  setFill(C.surface);
  doc.roundedRect(margin, top, contentW, h, 4, 4, 'F');
  setStroke(C.cardBorder);
  doc.setLineWidth(0.8);
  doc.roundedRect(margin, top, contentW, h, 4, 4, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  setText(C.accent);
  doc.text('CADENA DE RESILIENCIA Y FAILOVER LLM (COSTO CERO A RESIDUAL)', margin + 12, top + 15);

  const tiers = [
    { x: margin + 15, y: top + 28, w: 120, h: 56, t: 'TIER 1 (PRINCIPAL)', m: 'Gemini 3.7 / 3.6 Flash', desc: 'JSON Schema estricto\nContexto 1M tokens · Costo $0', col: C.accent },
    { x: margin + 160, y: top + 28, w: 120, h: 56, t: 'TIER 2 (RESPALDO)', m: 'OpenRouter Free Pool', desc: 'gemini-2.0 / qwen-2.5\nCaché catálogo 30m · Costo $0', col: [217, 119, 6] },
    { x: margin + 305, y: top + 28, w: 122, h: 56, t: 'TIER 3 (CONTINGENCIA)', m: 'DeepSeek Chat (Pago)', desc: 'json_object · 8K tokens\nSalvaguarda final resiliente', col: C.success },
  ];

  tiers.forEach((tr, i) => {
    setFill(C.white);
    doc.roundedRect(tr.x, tr.y, tr.w, tr.h, 3, 3, 'F');
    setStroke(C.cardBorder);
    doc.setLineWidth(0.6);
    doc.roundedRect(tr.x, tr.y, tr.w, tr.h, 3, 3, 'S');

    setFill(tr.col);
    doc.rect(tr.x, tr.y, tr.w, 2.5, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    setText(tr.col);
    doc.text(tr.t, tr.x + 6, tr.y + 11);

    doc.setFontSize(7.5);
    setText(C.ink);
    doc.text(tr.m, tr.x + 6, tr.y + 22);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    setText(C.muted);
    const lns = doc.splitTextToSize(tr.desc, tr.w - 12);
    let ly = tr.y + 33;
    lns.forEach((l) => { doc.text(l, tr.x + 6, ly); ly += 9; });

    if (i < tiers.length - 1) {
      const ax1 = tr.x + tr.w + 2;
      const ax2 = tiers[i + 1].x - 3;
      const ay = tr.y + tr.h / 2;
      setStroke(tr.col);
      doc.setLineWidth(1);
      doc.line(ax1, ay, ax2, ay);
      doc.line(ax2 - 3, ay - 2.5, ax2, ay);
      doc.line(ax2 - 3, ay + 2.5, ax2, ay);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6);
      setText(tr.col);
      doc.text('429/503', ax1 + 2, ay - 4);
    }
  });

  y = top + h + 14;
}

// =========================================================================
// CONSTRUCCIÓN DEL CONTENIDO DEL MANUAL TÉCNICO
// =========================================================================

// --- PÁGINA 1: PORTADA TÉCNICA Y RESUMEN EJECUTIVO ---
dibujarBandaSuperior();

// Logo Oficial TeoDoc Embebido
if (logoBase64) {
  // Logo aspect ~3.55 -> w: 145 pt, h: 41 pt
  doc.addImage(logoBase64, 'PNG', margin, marginT + 2, 145, 41);
  y = marginT + 58;
} else {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  setText(C.accent);
  doc.text('TeoDoc', margin, marginT + 25);
  y = marginT + 40;
}

doc.setFont('helvetica', 'bold');
doc.setFontSize(8.5);
setText(C.accent);
doc.text('// MANUAL TÉCNICO DE ARQUITECTURA, METODOLOGÍAS Y OPERACIÓN', margin, y);
y += 16;

doc.setFont('helvetica', 'bold');
doc.setFontSize(22);
setText(C.ink);
const mastTitle = doc.splitTextToSize('Arquitectura Integral del Sistema y Pipeline Homilético', contentW);
doc.text(mastTitle, margin, y);
y += mastTitle.length * 24 + 6;

// Regla Carbon técnica
setStroke(C.accent);
doc.setLineWidth(2.5);
doc.line(margin, y, margin + 90, y);
setStroke(C.cardBorder);
doc.setLineWidth(0.6);
doc.line(margin + 90, y, pageW - marginR, y);
y += 18;

callout(
  'Este documento constituye la especificación de ingeniería definitiva de TeoDoc (v2.1). Describe la totalidad de flujos de datos, heurísticas algorítmicas, motores gráficos vectoriales y directrices de aseguramiento de calidad (QA) que permiten transformar audios orales en estudios teológicos rigurosos, respetando los estándares de diseño de IBM Carbon y el margen seguro de argollado de 98 pt.',
  'info',
  'Propósito del Documento'
);

encabezadoSeccion('01', 'Visión y Flujo Global de Datos');

parrafo(
  'TeoDoc opera como un orquestador híbrido entre cliente y servidor. El objetivo primordial de su arquitectura es la soberanía del contenido y la resiliencia absoluta bajo una premisa de "Costo Cero": se maximiza el aprovechamiento de cuotas gratuitas con transiciones imperceptibles para el usuario.',
  { font: 'normal' }
);

dibujarDiagramaFlujoPrincipal();

tablaKeyValue([
  { clave: 'Versión del Sistema', valor: 'TeoDoc v2.1.0 (Producción Septiembre 2026)' },
  { clave: 'Framework y Runtime', valor: 'Next.js 16.3.3 (App Router, Turbopack) + React 19.2.8' },
  { clave: 'Tipado e Invariantes', valor: 'TypeScript 5 + Suite de 40 pruebas automatizadas' },
  { clave: 'Sistema de Diseño', valor: 'IBM Carbon Design System + Estándares Impeccable' },
  { clave: 'Canon Bíblico Primario', valor: 'Reina-Valera 1960 (RV1960) estrictamente preservada' },
]);

// --- PÁGINA 2: INGESTA, STT Y FAST-PATH HEURÍSTICO ---
nuevaPagina();

encabezadoSeccion('02', 'Ingesta de Medios y Speech-to-Text');

subtitulo('2.1 Subida Fragmentada (Chunked Upload) a Cloudinary');
parrafo(
  'Para asegurar tolerancia ante cortes en redes móviles y respetar los estrictos presupuestos de memoria de Safari en iOS, el frontend no carga el archivo completo en RAM. El archivo se segmenta mediante file.slice() en bloques atómicos de 20 MB y se despacha a Cloudinary con cabeceras de rango (Content-Range). El navegador solo procesa el bloque activo.'
);

subtitulo('2.2 Pipeline de Transcripción con Failover');
parrafo(
  'El endpoint /api/transcribe recibe la URL segura generada. Invoca de forma primaria a AssemblyAI en idioma español. Si el proveedor experimenta saturación o cuota agotada, el proxy conmuta en tiempo de ejecución hacia Deepgram nova-2 con smart_format=true, retornando la transcripción puntuada sin intervención humana.'
);

encabezadoSeccion('03', 'Fast-Path de Validación y Clasificación');

parrafo(
  'En la versión 2.1 se introdujo un algoritmo determinista en /api/validate que elimina 2 a 4 segundos de latencia de red antes del análisis:'
);

callout(
  '1. Si el texto transcrito tiene menos de 12 palabras, se rechaza inmediatamente por contenido insuficiente ("corto").\n' +
  '2. Si el texto tiene >= 35 palabras y contiene referencias a libros bíblicos (Génesis...Apocalipsis) o vocabulario teológico evidente (Dios, Jesús, Evangelio, Salvación, etc.), se APRUEBA EN <1ms de forma instantánea sin llamar al LLM.\n' +
  '3. Para textos ambiguos o reflexiones devocionales muy breves, delega en Gemini Flash con un esquema JSON estricto.\n' +
  '4. Mecanismo Fail-Open: Ante cualquier error del validador, la plataforma aprueba la continuación para no bloquear al expositor.',
  'success',
  'Reglas Operativas del Fast-Path Heurístico'
);

encabezadoSeccion('04', 'Clasificador de Riqueza Homilética');
parrafo(
  'La función evaluarRiqueza() en lib/riqueza-contenido.ts analiza matemáticamente la relación entre volumen de palabras, duración estimada (~130 palabras por minuto) y densidad de referencias bíblicas explícitas para sugerir dinámicamente la profundidad del análisis:'
);

tablaKeyValue([
  { clave: 'Nivel BREVE (<1,800 palabras)', valor: '2 a 3 puntos principales · Ilustración Hero' },
  { clave: 'Nivel MEDIA (1,800 - 4,500 palabras)', valor: '3 a 6 puntos principales · Cuadrícula 2 columnas' },
  { clave: 'Nivel AMPLIA (4,500 - 9,000 palabras)', valor: '5 a 9 puntos principales · Versículos secundarios' },
  { clave: 'Nivel PROFUNDA (>9,000 palabras)', valor: '7 a 12 puntos principales · Alta densidad doctrinal' },
]);

// --- PÁGINA 3: CADENA DE RESILIENCIA LLM Y MOTOR EDITORIAL 9:16 ---
nuevaPagina();

encabezadoSeccion('05', 'Motor de Análisis y Cadena LLM Multi-Tier');

parrafo(
  'El núcleo teológico reside en /api/analyze/route.ts. Los modelos analizan la transcripción bajo directrices exegéticas de tradición evangélica, utilizando exclusivamente "el expositor" y la versión Reina-Valera 1960. La resiliencia está garantizada por tres escalones consecutivos:'
);

dibujarDiagramaResilienciaLLM();

subtitulo('5.1 Normalización Defensiva de Datos');
parrafo(
  'Para blindar la interfaz gráfica y los motores de exportación contra variaciones de formato o campos omitidos por los modelos, los datos atraviesan la función normalizarAnalisis():\n' +
  '• Si el modelo no devuelve "grandes_ensenanzas", el sistema las deriva del primer enunciado de cada punto de desarrollo.\n' +
  '• Los conceptos clave se sanean contra una lista de palabras vacías (stop words), garantizando términos de 1 a 3 palabras.\n' +
  '• El pasaje bíblico principal cuenta con fallback automático al primer versículo citado en la enseñanza.'
);

encabezadoSeccion('06', 'Motor de Composición Editorial 9:16');

parrafo(
  'Diseñado en lib/infografia-layout.ts y ejecutado en components/infografia.tsx. Resuelve el problema histórico de las infografías que crecían sin control vertical o se truncaban en Stories:'
);

callout(
  '• Lienzo Absoluto 9:16: Ancho exacto de 1080 px, alto inmutable de 1920 px (composición continua en 1 lámina).\n' +
  '• Retícula Base 8px: Todos los espaciados, alturas y márgenes son múltiplos rigurosos de 8 px (Carbon Grid).\n' +
  '• Zonas Seguras (Safe Zones): 64 px superior y 64 px inferior protegidos contra los controles nativos de WhatsApp e Instagram Stories; 48 px laterales de resguardo.\n' +
  '• Pisos de Legibilidad: Display >= 48px, Subtítulos >= 20px, Cuerpo >= 16px, Numerales >= 32px.\n' +
  '• Cero Recursos Remotos: 13 ilustraciones vectoriales y tipografías inline integradas para compatibilidad con Safari iOS.',
  'info',
  'Especificación de la Infografía TeoDoc'
);

// --- PÁGINA 4: MOTOR VECTORIAL PDF Y ENTREGA IN-APP EN SAFARI IOS ---
nuevaPagina();

encabezadoSeccion('07', 'Motor PDF Vectorial y Margen de Argollado');

parrafo(
  'El PDF se genera programáticamente mediante jsPDF en el navegador sin dependencias de servidor ni demoras de red. Sigue directrices editoriales avanzadas para uso en carpetas ministeriales y encuadernación de libros:'
);

callout(
  '• Margen de Argollado Izquierdo (98 pt / ~35 mm): Zona de seguridad absoluta. Permite perforar con taladros de 2 o 3 agujeros o instalar espirales metálicos sin cortar texto, numerales ni citas.\n' +
  '• Margen Exterior Derecho (54 pt / ~19 mm): Calibrado para balance estético asimétrico.\n' +
  '• Control Anti-Huérfanos (Keep-With-Next): Todo encabezado evalúa ensure(headerH + keep). Si el espacio remanente es insuficiente para el título y al menos dos líneas de cuerpo, traslada la sección a la siguiente página.\n' +
  '• Numerales y Títulos Sincronizados: El numeral y su desarrollo derivan de un mismo objeto estructural, eliminando cualquier riesgo de desfase vertical.',
  'success',
  'Especificación Editorial de Encuadernación PDF'
);

encabezadoSeccion('08', 'Arquitectura de Entrega In-App para iOS y Android');

parrafo(
  'En navegadores basados en WebKit (Safari en iPhone y iPad), las descargas programáticas tradicionales con tags <a> provocan la apertura de ventanas en blanco ("about:blank") y bloquean el guardado de archivos. TeoDoc resuelve esto con una metodología unificada de entrega:'
);

callout(
  '1. Detección Certera: Identifica iOS e iPadOS moderno (navigator.platform === "MacIntel" con maxTouchPoints > 1).\n' +
  '2. Cero Pestañas Fantasma: En iOS no se ejecuta a.click() programático. El archivo generado se monta en un objeto File y se almacena en memoria de la ventana actual.\n' +
  '3. Visor Modal In-App: El usuario previsualiza el PDF o PNG en un modal escalado a pantalla completa.\n' +
  '4. Guardado y Difusión Nativa: El botón "Guardar / Compartir" invoca navigator.share({ files: [file] }), abriendo la hoja nativa de iOS (Guardar en Archivos, AirDrop, WhatsApp) en un solo toque.',
  'info',
  'Metodología de Entrega In-App Multiplataforma'
);

encabezadoSeccion('09', 'Certificación de Calidad QA (40/40 Invariantes)');

tablaKeyValue([
  { clave: 'npm run test:logica (11 pruebas)', valor: 'Riqueza textual, duraciones estimadas, conteo de versículos' },
  { clave: 'npm run test:infografia (9 pruebas)', valor: 'Retícula Carbon 8px, safe zones, canvas fijo 1080×1920' },
  { clave: 'npm run test:entrega (20 pruebas)', valor: 'Entrega iOS, MIME types, margen 98pt, término "expositor"' },
  { clave: 'Compilación de Producción', valor: 'next build Turbopack: 0 errores, 0 warnings, TypeScript estricto' },
]);

// -------------------------------------------------------------
// ENCABEZADOS Y PIES DE PÁGINA FORMALES EN TODAS LAS HOJAS
// -------------------------------------------------------------
const totalPaginas = doc.internal.getNumberOfPages();

for (let p = 1; p <= totalPaginas; p++) {
  doc.setPage(p);

  // Encabezado sutil
  if (p > 1) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    setText(C.muted);
    doc.text('TEODOC · MANUAL TÉCNICO DE ARQUITECTURA Y METODOLOGÍAS', margin, marginT - 16);
    doc.setFont('helvetica', 'bold');
    setText(C.accent);
    doc.text('v2.1 PRODUCCIÓN', pageW - marginR - 80, marginT - 16);

    setStroke(C.cardBorder);
    doc.setLineWidth(0.5);
    doc.line(margin, marginT - 10, pageW - marginR, marginT - 10);
  }

  // Pie de página
  const pieY = pageH - marginB + 22;
  setStroke(C.cardBorder);
  doc.setLineWidth(0.5);
  doc.line(margin, pieY - 12, pageW - marginR, pieY - 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  setText(C.secondary);
  doc.text('© 2026 TeoDoc Ministerial · Sistema de Análisis Homilético y Exegético', margin, pieY);

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

console.log(`[Éxito] Manual PDF generado correctamente:`);
console.log(`  -> ${outPathRoot} (${pdfOutput.byteLength} bytes)`);
console.log(`  -> ${outPathPublic} (${pdfOutput.byteLength} bytes)`);
console.log(`Total de páginas generadas: ${totalPaginas}`);
