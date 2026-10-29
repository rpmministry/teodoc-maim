import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { extraerTextoDeArchivo, normalizarTextoExtraido, sugerirTituloDeTexto } from '../lib/documentos/extractor.ts';
import { validarUrlMultimedia, esIpORedPrivada } from '../lib/multimedia/detector.ts';
import { crearTrabajo, obtenerTrabajo, actualizarTrabajo, cancelarTrabajo } from '../lib/multimedia/job-manager.ts';
import { obtenerRutaFfmpeg, obtenerRutaYtDlp, obtenerRutaFfprobe } from '../lib/multimedia/extractor.ts';
import { REGLAS_CALIDAD_MODALIDAD, REGLAS_BOSQUEJO } from '../lib/ai/modalidades.ts';

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');

let pasadas = 0;
const pruebas: string[] = [];
function comprobar(nombre: string, fn: () => void | Promise<void>) {
  const res = fn();
  if (res instanceof Promise) {
    throw new Error('comprobar no soporta funciones asíncronas directas, usa comprobarAsync');
  }
  pasadas += 1;
  pruebas.push(`  ✓ ${nombre}`);
}

async function comprobarAsync(nombre: string, fn: () => Promise<void>) {
  await fn();
  pasadas += 1;
  pruebas.push(`  ✓ ${nombre}`);
}

console.log('Verificación del motor multimedia, extracción documental y bosquejos MAIM:');

// 1. Extracción de documentos Word (DOCX) reales de MAIM
await comprobarAsync('Extracción DOCX: Modelo 1 (Pentecostés) extrae texto, citas y términos originales', async () => {
  const rutaDocx1 = resolve(raiz, 'docs/referencias_maim/ACTIVANDO UN PENTECOSTES DEL ESPIRITU EN NUESTRAS VIDAS.docx');
  assert.ok(existsSync(rutaDocx1), 'No existe el archivo docx de referencia 1');
  const buffer = readFileSync(rutaDocx1);

  const res = await extraerTextoDeArchivo(buffer, 'ACTIVANDO UN PENTECOSTES.docx');
  assert.ok(res.ok, `Fallo extracción: ${res.error}`);
  assert.equal(res.tipo, 'docx');
  assert.ok(res.caracteres > 3_000, `Caracteres insuficientes: ${res.caracteres}`);
  assert.ok(res.palabras > 500, `Palabras insuficientes: ${res.palabras}`);

  // Verificar términos doctrinales y griegos del modelo
  assert.ok(res.texto.includes('KOINONIA'), 'Falta el término KOINONIA');
  assert.ok(res.texto.includes('BAPTÍZO') || res.texto.includes('BAPT'), 'Falta el término BAPTÍZO');
  assert.ok(res.texto.includes('Isaías 44:3') || res.texto.includes('Joel 2:28'), 'Faltan citas bíblicas clave');
  assert.ok(res.texto.includes('EL DERRAMAMIENTO DEL ESPÍRITU') || res.texto.includes('DERRAMAMIENTO'), 'Faltan apartados');
});

await comprobarAsync('Extracción DOCX: Modelo 2 (Desbordamiento) extrae tono vivencial y palabra griega EKBALO', async () => {
  const rutaDocx2 = resolve(raiz, 'docs/referencias_maim/EL DESBORDAMIENTO DEL ESPIRITU SANTO.docx');
  assert.ok(existsSync(rutaDocx2), 'No existe el archivo docx de referencia 2');
  const buffer = readFileSync(rutaDocx2);

  const res = await extraerTextoDeArchivo(buffer, 'EL DESBORDAMIENTO.docx');
  assert.ok(res.ok, `Fallo extracción: ${res.error}`);
  assert.equal(res.tipo, 'docx');
  assert.ok(res.texto.includes('Juan 16:7'), 'Falta versículo base Juan 16:7');
  assert.ok(res.texto.includes('EKBALO'), 'Falta término EKBALO');
  assert.ok(res.texto.includes('Consolador'), 'Falta mención al Consolador');
});

// 2. Extracción de documentos PDF reales
await comprobarAsync('Extracción PDF: Extrae texto seleccionable página por página', async () => {
  const rutaPdf = resolve(raiz, 'tmp/downloads/teodoc-maim-analisis-general.pdf');
  if (existsSync(rutaPdf)) {
    const buffer = readFileSync(rutaPdf);
    const res = await extraerTextoDeArchivo(buffer, 'analisis-general.pdf');
    assert.ok(res.ok, 'Fallo al extraer PDF');
    assert.equal(res.tipo, 'pdf');
    assert.ok(res.caracteres > 2_000, 'Caracteres de PDF insuficientes');
    assert.ok(!res.esEscaneado, 'No debe marcarse como escaneado un PDF con texto');
  }
});

// 3. Detección de PDF escaneado (simulación de PDF sin texto)
await comprobarAsync('Extracción PDF: Detecta documentos escaneados o sin capa de texto', async () => {
  // Creamos un PDF mínimo sin texto
  const pdfVacioSimulado = Buffer.from('%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>\nendobj\nxref\n0 4\n0000000000 65535 f\n0000000010 00000 n\n0000000060 00000 n\n0000000117 00000 n\ntrailer\n<< /Size 4 /Root 1 0 R >>\nstartxref\n198\n%%EOF');
  const res = await extraerTextoDeArchivo(pdfVacioSimulado, 'escaneado.pdf');
  assert.ok(res.esEscaneado || !res.ok, 'Debe detectar PDF escaneado o vacío');
});

// 4. Extracción de TXT plano
await comprobarAsync('Extracción TXT: Normaliza texto y sugiere título', async () => {
  const textoPrueba = `ACTIVANDO EL PODER DE LA ORACIÓN EN LA FAMILIA\n\nSantiago 5:16 nos enseña que la oración eficaz del justo puede mucho.\nCuando oramos con un corazón sincero y alineado a la voluntad del Padre, experimentamos su paz.\nNo podemos caminar en autosuficiencia; necesitamos depender diariamente de su presencia y gracia.`;
  const buffer = Buffer.from(textoPrueba, 'utf-8');

  const res = await extraerTextoDeArchivo(buffer, 'oracion.txt');
  assert.ok(res.ok);
  assert.equal(res.tipo, 'txt');
  assert.equal(res.tituloSugerido, 'ACTIVANDO EL PODER DE LA ORACIÓN EN LA FAMILIA');
  assert.ok(res.palabras > 30);
});

// 5. Blindaje de seguridad perimetral anti-SSRF en enlaces de video
comprobar('Seguridad Anti-SSRF: Bloquea direcciones privadas, locales y de metadatos de nube', () => {
  const ipsPeligrosas = [
    'localhost',
    '127.0.0.1',
    '::1',
    '10.0.0.1',
    '192.168.1.100',
    '172.16.0.5',
    '172.31.255.255',
    '169.254.169.254', // Cloud metadata
    '0.0.0.0',
    'server.local',
    'internal.lan',
  ];

  for (const ip of ipsPeligrosas) {
    assert.ok(esIpORedPrivada(ip), `Debería bloquear: ${ip}`);
    const res = validarUrlMultimedia(`http://${ip}/video.mp4`);
    assert.equal(res.esValida, false, `No bloqueó URL privada: http://${ip}/video.mp4`);
  }
});

comprobar('Seguridad Anti-SSRF: Rechaza protocolos no seguros y credenciales embebidas', () => {
  assert.equal(validarUrlMultimedia('file:///etc/passwd').esValida, false);
  assert.equal(validarUrlMultimedia('ftp://servidor.com/video.mp4').esValida, false);
  assert.equal(validarUrlMultimedia('https://usuario:clave@ejemplo.com/video.mp4').esValida, false);
});

comprobar('Detector de video: Identifica proveedores autorizados (YouTube, Vimeo, Facebook, Directo)', () => {
  const yt = validarUrlMultimedia('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  assert.equal(yt.esValida, true);
  assert.equal(yt.proveedor, 'youtube');

  const vimeo = validarUrlMultimedia('https://vimeo.com/123456789');
  assert.equal(vimeo.esValida, true);
  assert.equal(vimeo.proveedor, 'vimeo');

  const fb = validarUrlMultimedia('https://www.facebook.com/watch/?v=987654321');
  assert.equal(fb.esValida, true);
  assert.equal(fb.proveedor, 'facebook');

  const directo = validarUrlMultimedia('https://cdn.ejemplo.com/predicas/mensaje-2026.mp4');
  assert.equal(directo.esValida, true);
  assert.equal(directo.proveedor, 'stream_directo');
});

// 6. Gestor de tareas multimedia (Job Manager)
comprobar('Job Manager: Ciclo de vida de tareas, progreso y cancelación', () => {
  const job = crearTrabajo('extraer_audio', 'https://www.youtube.com/watch?v=test');
  assert.ok(job.id, 'Falta id de trabajo');
  assert.equal(job.estado, 'iniciado');

  const consultado = obtenerTrabajo(job.id);
  assert.equal(consultado?.id, job.id);

  actualizarTrabajo(job.id, {
    estado: 'extrayendo_audio',
    progreso: 50,
    mensaje: 'Extrayendo audio...',
  });
  assert.equal(obtenerTrabajo(job.id)?.progreso, 50);

  const cancelado = cancelarTrabajo(job.id);
  assert.equal(cancelado, true);
  assert.equal(obtenerTrabajo(job.id)?.estado, 'cancelado');
});

// 7. Verificación de binarios de motor multimedia (FFmpeg, FFprobe y yt-dlp)
comprobar('Motor Multimedia: Localiza ejecutables de FFmpeg, FFprobe y yt-dlp', () => {
  const ffmpegPath = obtenerRutaFfmpeg();
  assert.ok(ffmpegPath, 'No se encontró ruta de ffmpeg');

  const ffprobePath = obtenerRutaFfprobe();
  assert.ok(ffprobePath, 'No se encontró ruta de ffprobe');

  const ytdlpPath = obtenerRutaYtDlp();
  assert.ok(ytdlpPath, 'No se encontró ruta de yt-dlp');
});

// 8. Calidad editorial y prompt MAIM (Menos secciones, párrafos desarrollados y primera persona)
comprobar('Calidad Editorial MAIM: Prompts exigen párrafos amplios y primera persona', () => {
  assert.ok(REGLAS_CALIDAD_MODALIDAD.includes('primera persona'), 'Falta regla de primera persona');
  assert.ok(REGLAS_CALIDAD_MODALIDAD.includes('PROHIBIDO usar expresiones como «el orador dice»'), 'Falta prohibición de narrador externo');
  assert.ok(REGLAS_CALIDAD_MODALIDAD.includes('Menos Divisiones, Textos Continuos'), 'Falta instrucción de textos continuos');
  assert.ok(REGLAS_CALIDAD_MODALIDAD.includes('150 a 350 palabras'), 'Falta rango de longitud por párrafo');

  assert.ok(REGLAS_BOSQUEJO.includes('ESTILO A — TEMÁTICO'), 'Falta estilo A temático');
  assert.ok(REGLAS_BOSQUEJO.includes('ESTILO B — VIVENCIAL'), 'Falta estilo B vivencial');
  assert.ok(REGLAS_BOSQUEJO.includes('KOINONIA'), 'Falta término griego KOINONIA');
  assert.ok(REGLAS_BOSQUEJO.includes('EKBALO'), 'Falta término griego EKBALO');
  assert.ok(REGLAS_BOSQUEJO.includes('puntos_principales'), 'Falta estructura de puntos principales');
});

console.log(pruebas.join('\n'));
console.log(`\n${pasadas} pruebas de multimedia, documentos y bosquejos superadas exitosamente.`);

