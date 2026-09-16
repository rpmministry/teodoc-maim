'use client';
import { useState, useRef, useEffect } from 'react';
import LiquidOrb, { type LiquidOrbHandle } from '@/components/liquid-orb';
import Infografia, { ResponsiveInfografia, resumir, exportarInfografiaBlob, planInfografia, type TemaInfografia } from '@/components/infografia';
import { CANVAS_W, CANVAS_H } from '@/lib/infografia-layout';
import { extractYouTubeVideoId } from '@/lib/youtube/extract-video-id';

interface Versiculo { cita: string; texto: string; }
interface Subtema { titulo: string; desarrollo: string; }
interface PuntoDesarrollo { punto: string; explicacion: string; subtemas?: Subtema[]; versiculos: Versiculo[]; }
interface TextoBiblico { cita: string; texto: string; }
interface Ensenanza { sobre: string; ensenanza: string; }
interface ConceptoTeologico { concepto: string; significado: string; }
interface GranEnsenanza { titulo: string; descripcion: string; }
interface DatosInfografia {
  frase_corta: string; texto_clave: string; contexto_breve: string;
  mensaje_central: string; verdad_principal: string;
  grandes_ensenanzas: GranEnsenanza[];
  palabras_clave: string[];
  frase_recordar: string;
  conexiones_biblicas?: Versiculo[];
}
type AvisoAudio = 'corto' | 'no_relacionado';

function limpiarConceptoCliente(valor: unknown): string | null {
  const base = String(valor ?? '').replace(/\s+/g, ' ').replace(/^[\-*\u2022\d.)\s]+/, '').replace(/[.,;:]+$/, '').trim();
  if (!base || !/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/.test(base)) return null;
  const palabras = base.split(' ').filter(Boolean);
  if (palabras.length === 0 || palabras.length > 3 || base.length > 32) return null;
  return base;
}

function normalizarConceptosCliente(valor: unknown, max: number): string[] {
  if (!Array.isArray(valor)) return [];
  const salida: string[] = [];
  for (const item of valor) {
    const c = limpiarConceptoCliente(item);
    if (c && !salida.some((s) => s.toLowerCase() === c.toLowerCase())) salida.push(c);
    if (salida.length >= max) break;
  }
  return salida;
}

function primeraFraseCliente(entrada: string, max: number): string {
  const limpio = String(entrada || '').replace(/\s+/g, ' ').trim();
  if (limpio.length <= max) return limpio;
  const corte = limpio.slice(0, max);
  const ultimoPunto = corte.lastIndexOf('.');
  return `${(ultimoPunto > max * 0.5 ? corte.slice(0, ultimoPunto + 1) : corte).trimEnd()}…`;
}

function derivarGrandesEnsenanzasCliente(puntos: PuntoDesarrollo[]): GranEnsenanza[] {
  return puntos
    .filter((p) => p.punto || p.explicacion)
    .slice(0, 10)
    .map((p) => ({
      titulo: primeraFraseCliente(p.punto.split(/[.:;—–-]/)[0].trim() || p.punto, 60),
      descripcion: primeraFraseCliente(p.explicacion, 170),
    }))
    .filter((g) => g.titulo || g.descripcion);
}

// Normaliza lo que devuelve el backend: garantiza una estructura segura para el
// PDF y la infografía aunque falte algún campo (nunca rompe el render).
function normalizarAnalisisCliente(d: any): PredicaAnalisis {
  const puntos: PuntoDesarrollo[] = Array.isArray(d?.desarrollo_progresivo)
    ? d.desarrollo_progresivo
        .map((p: any) => ({
          punto: String(p?.punto || '').trim(),
          explicacion: String(p?.explicacion || '').trim(),
          subtemas: Array.isArray(p?.subtemas)
            ? p.subtemas
                .map((s: any) => ({ titulo: String(s?.titulo || '').trim(), desarrollo: String(s?.desarrollo || '').trim() }))
                .filter((s: any) => s.titulo || s.desarrollo)
            : [],
          versiculos: Array.isArray(p?.versiculos)
            ? p.versiculos
                .map((v: any) => ({ cita: String(v?.cita || '').trim(), texto: String(v?.texto || '').trim() }))
                .filter((v: any) => v.cita || v.texto)
            : [],
        }))
        .filter((p: any) => p.punto || p.explicacion)
    : [];
  const aplicacion = Array.isArray(d?.aplicacion)
    ? d.aplicacion.map((a: any) => String(a || '').trim()).filter(Boolean)
    : [];
  const conceptos = normalizarConceptosCliente(d?.conceptos_clave, 8);
  const conceptosTeologicos: ConceptoTeologico[] = Array.isArray(d?.conceptos_teologicos)
    ? d.conceptos_teologicos
        .map((c: any) => ({ concepto: limpiarConceptoCliente(c?.concepto) || '', significado: String(c?.significado || '').trim() }))
        .filter((c: any) => c.concepto)
        .slice(0, 8)
    : [];
  const ensenanzas: Ensenanza[] = Array.isArray(d?.ensenanzas)
    ? d.ensenanzas
        .map((e: any) => ({ sobre: String(e?.sobre || '').trim(), ensenanza: String(e?.ensenanza || '').trim() }))
        .filter((e: any) => e.ensenanza)
    : [];

  const textoBiblicoRaw = d?.texto_biblico_principal;
  const pasajeFallback = puntos.flatMap((p) => p.versiculos).find((v) => v.cita) || { cita: '', texto: '' };
  const textoBiblico: TextoBiblico =
    textoBiblicoRaw && (textoBiblicoRaw.cita || textoBiblicoRaw.texto)
      ? { cita: String(textoBiblicoRaw.cita || '').trim(), texto: String(textoBiblicoRaw.texto || '').trim() }
      : pasajeFallback;

  const info = d?.infografia || {};
  const fraseCorta = String(info?.frase_corta || '').trim();
  const grandesBase = Array.isArray(info?.grandes_ensenanzas)
    ? info.grandes_ensenanzas
        .map((g: any) => ({ titulo: String(g?.titulo || '').trim(), descripcion: String(g?.descripcion || '').trim() }))
        .filter((g: any) => g.titulo || g.descripcion)
        .slice(0, 10)
    : [];
  const grandes = grandesBase.length ? grandesBase : derivarGrandesEnsenanzasCliente(puntos);
  const palabrasClave = normalizarConceptosCliente(info?.palabras_clave, 6);
  const normalizarVersiculosCliente = (valor: unknown): Versiculo[] =>
    Array.isArray(valor)
      ? valor
          .map((item) => {
            const v = item as { cita?: unknown; texto?: unknown };
            return { cita: String(v?.cita || '').trim(), texto: String(v?.texto || '').trim() };
          })
          .filter((v) => v.cita || v.texto)
      : [];

  return {
    titulo: String(d?.titulo || 'Análisis del mensaje').trim(),
    idea_principal: String(d?.idea_principal || '').trim(),
    tema_principal: String(d?.tema_principal || '').trim(),
    proposito: String(d?.proposito || '').trim(),
    contexto_general: String(d?.contexto_general || '').trim(),
    texto_biblico_principal: textoBiblico,
    otros_textos: normalizarVersiculosCliente(d?.otros_textos),
    contexto_biblico: String(d?.contexto_biblico || '').trim(),
    contexto_historico: String(d?.contexto_historico || '').trim(),
    contexto_literario: String(d?.contexto_literario || '').trim(),
    relacion_textos: String(d?.relacion_textos || '').trim(),
    interpretacion: String(d?.interpretacion || '').trim(),
    infografia: {
      frase_corta: fraseCorta,
      texto_clave: String(info?.texto_clave || '').trim() || textoBiblico.texto,
      contexto_breve: String(info?.contexto_breve || '').trim() || String(d?.contexto_biblico || '').trim(),
      mensaje_central: String(info?.mensaje_central || '').trim() || String(d?.idea_principal || '').trim(),
      verdad_principal: String(info?.verdad_principal || '').trim() || String(d?.tema_principal || '').trim() || String(d?.idea_principal || '').trim(),
      grandes_ensenanzas: grandes,
      palabras_clave: palabrasClave.length ? palabrasClave : conceptos.slice(0, 6),
      frase_recordar: String(info?.frase_recordar || '').trim() || fraseCorta || String(d?.conclusion || '').trim(),
      conexiones_biblicas: normalizarVersiculosCliente(info?.conexiones_biblicas),
    },
    desarrollo_progresivo: puntos,
    ensenanzas,
    aplicacion,
    conceptos_clave: conceptos,
    conceptos_teologicos: conceptosTeologicos,
    oracion: String(d?.oracion || '').trim(),
    conclusion: String(d?.conclusion || '').trim(),
  };
}
interface PredicaAnalisis {
  titulo: string; idea_principal: string;
  tema_principal?: string;
  proposito?: string;
  contexto_general?: string;
  texto_biblico_principal?: TextoBiblico;
  otros_textos?: Versiculo[];
  contexto_biblico?: string;
  contexto_historico?: string;
  contexto_literario?: string;
  relacion_textos?: string;
  interpretacion?: string;
  infografia?: DatosInfografia;
  desarrollo_progresivo: PuntoDesarrollo[];
  ensenanzas?: Ensenanza[];
  aplicacion: string[]; oracion: string;
  conceptos_clave?: string[];
  conceptos_teologicos?: ConceptoTeologico[];
  conclusion?: string;
}

const ALLOWED_EXTENSIONS = ['.mp3', '.wav', '.m4a', '.m4b', '.aac', '.flac', '.ogg', '.oga', '.opus', '.wma', '.amr', '.webm', '.mp4', '.mov', '.aiff', '.aif', '.caf', '.3gp'];
const MAX_FILE_SIZE = 500 * 1024 * 1024;

const promesasBiblicas = [
  { cita: 'Isaías 41:10', texto: 'No temas, porque yo estoy contigo; no desmayes, porque yo soy tu Dios que te esfuerzo; siempre te ayudaré, siempre te sustentaré con la diestra de mi justicia.' },
  { cita: 'Jeremías 29:11', texto: 'Porque yo sé los pensamientos que tengo acerca de vosotros, dice Jehová, pensamientos de paz, y no de mal, para daros el fin que esperáis.' },
  { cita: 'Romanos 8:28', texto: 'Y sabemos que a los que aman a Dios, todas las cosas les ayudan a bien, esto es, a los que conforme a su propósito son llamados.' },
  { cita: 'Josué 1:9', texto: 'Mira que te mando que te esfuerces y seas valiente; no temas ni desmayes, porque Jehová tu Dios estará contigo en dondequiera que vayas.' },
  { cita: 'Filipenses 4:13', texto: 'Todo lo puedo en Cristo que me fortalece.' },
  { cita: 'Salmos 23:1', texto: 'Jehová es mi pastor; nada me faltará.' },
];

function validarArchivo(file: File): string | null {
  if (file.size > MAX_FILE_SIZE) return 'El archivo supera el límite permitido de 500 MB.';
  const fileName = file.name.toLowerCase();
  const mimeType = (file.type || '').toLowerCase();
  const validExtension = ALLOWED_EXTENSIONS.some((ext) => fileName.endsWith(ext));
  const validMime = mimeType.startsWith('audio/') || mimeType.startsWith('video/');
  const unknownType = mimeType.length === 0 || mimeType === 'application/octet-stream';
  if (!validExtension && !validMime && !unknownType) {
    return 'Formato no compatible. Utiliza archivos de audio como MP3, M4A, WAV, MP4, AAC, OGG, OPUS, etc.';
  }
  return null;
}

// Entrada por enlace (YouTube) OCULTA temporalmente hasta tener una vía open
// source viable. La infraestructura (lib/youtube + /api/youtube) queda intacta
// y lista: basta con definir NEXT_PUBLIC_ENABLE_YOUTUBE=true y redesplegar para
// volver a mostrar la opción, sin tocar el resto del flujo.
const YOUTUBE_ENABLED = process.env.NEXT_PUBLIC_ENABLE_YOUTUBE === 'true';

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const [resultado, setResultado] = useState<PredicaAnalisis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [versoIndex, setVersoIndex] = useState(0);
  const [descargando, setDescargando] = useState(false);
  const [generandoPDF, setGenerandoPDF] = useState(false);
  // Transcripción guardada para reintentar el análisis sin volver a subir audio.
  const [textoPendiente, setTextoPendiente] = useState<string | null>(null);
  // Aviso de descarga (porcentaje + confirmación), visible con resultados en pantalla.
  const [avisoDescarga, setAvisoDescarga] = useState<{ tipo: 'pdf' | 'png'; progreso: number; estado: 'generando' | 'listo' | 'error'; mensaje?: string } | null>(null);
  const descargaTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const avisoAutoCerrarTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Último archivo descargado (para Ver, Compartir o Descargar sin reprocesar).
  const [ultimoArchivo, setUltimoArchivo] = useState<{ url: string; nombre: string; tipo: 'pdf' | 'png'; file?: File } | null>(null);
  const [previewArchivo, setPreviewArchivo] = useState<{ url: string; nombre: string; tipo: 'pdf' | 'png'; file?: File } | null>(null);
  const ultimoUrlRef = useRef<string | null>(null);
  const touchXRef = useRef<number | null>(null);

  // Auto-cierre del banner de descarga a los 15 segundos de completarse o fallar
  useEffect(() => {
    if (avisoAutoCerrarTimerRef.current) {
      clearTimeout(avisoAutoCerrarTimerRef.current);
      avisoAutoCerrarTimerRef.current = null;
    }

    if (avisoDescarga?.estado === 'listo' || avisoDescarga?.estado === 'error') {
      avisoAutoCerrarTimerRef.current = setTimeout(() => {
        setAvisoDescarga(null);
      }, 15000);
    }

    return () => {
      if (avisoAutoCerrarTimerRef.current) {
        clearTimeout(avisoAutoCerrarTimerRef.current);
        avisoAutoCerrarTimerRef.current = null;
      }
    };
  }, [avisoDescarga?.estado]);

  // Al salir a la pantalla principal (resultado null), se descarta de inmediato
  useEffect(() => {
    if (!resultado) {
      if (avisoAutoCerrarTimerRef.current) {
        clearTimeout(avisoAutoCerrarTimerRef.current);
        avisoAutoCerrarTimerRef.current = null;
      }
      setAvisoDescarga(null);
      setUltimoArchivo(null);
      setPreviewArchivo(null);
    }
  }, [resultado]);

  // Botón "volver arriba" (aparece solo al hacer scroll hacia abajo).
  const [mostrarArriba, setMostrarArriba] = useState(false);
  useEffect(() => {
    const contenedor = document.querySelector('.app-content') as HTMLElement | null;
    const onScroll = () => {
      const y = contenedor ? contenedor.scrollTop : window.scrollY;
      setMostrarArriba(y > 420);
    };
    onScroll();
    const objetivo: HTMLElement | Window = contenedor || window;
    objetivo.addEventListener('scroll', onScroll, { passive: true });
    return () => objetivo.removeEventListener('scroll', onScroll);
  }, []);
  const volverArriba = () => {
    const contenedor = document.querySelector('.app-content') as HTMLElement | null;
    if (contenedor) contenedor.scrollTo({ top: 0, behavior: 'smooth' });
    else window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const [avisoAudio, setAvisoAudio] = useState<AvisoAudio | null>(null);
  // Fuente de entrada: audio local o YouTube. Mismo pipeline después.
  const [modo, setModo] = useState<'audio' | 'youtube'>('audio');
  // Con la entrada por enlace oculta, siempre se usa el modo audio.
  const modoActivo: 'audio' | 'youtube' = YOUTUBE_ENABLED ? modo : 'audio';
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [avisoYoutube, setAvisoYoutube] = useState<string | null>(null);

  // Referencias para la exportación de infografías en alta definición (1080×1920)
  const infografiaOscuraRef = useRef<HTMLDivElement | null>(null);
  const infografiaClaraRef = useRef<HTMLDivElement | null>(null);
  const [descargandoTema, setDescargandoTema] = useState<TemaInfografia | 'ambos' | null>(null);
  const infografiaRefs = useRef<(HTMLDivElement | null)[]>([]);
  // Número de páginas del plan para el resultado actual.
  const totalPaginasInfografia = resultado ? Math.max(1, planInfografia(resultado).paginas.length) : 1;
  const orbRef = useRef<LiquidOrbHandle>(null);
  // jsPDF precargado: permite que el clic descargue dentro del gesto del usuario.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const jsPDFRef = useRef<any>(null);
  useEffect(() => {
    import('jspdf').then((m) => { jsPDFRef.current = m.jsPDF; }).catch(() => {});
  }, []);
  // Metadatos y timestamps de la última fuente (YouTube), para futuras funciones.
  const ultimaFuenteRef = useRef<{ meta: unknown; segments: unknown[] } | null>(null);

  // Mensajes breves que acompañan el procesamiento (uno a la vez).
  const mensajesAnalisis = [
    'Preparando el contenido...',
    'Analizando la enseñanza...',
    'Identificando las ideas principales...',
    'Organizando el estudio bíblico...',
    'Preparando la aplicación práctica...',
    'Redactando el análisis final… (puede tardar unos minutos)',
  ];
  const mensajeAnalisis =
    progress < 35 ? mensajesAnalisis[0]
    : progress < 55 ? mensajesAnalisis[1]
    : progress < 75 ? mensajesAnalisis[2]
    : progress < 92 ? mensajesAnalisis[3]
    : mensajesAnalisis[4];

  // Carrusel de versículos: rota mientras se procesa el análisis.
  useEffect(() => {
    if (!loading) return;
    const id = setInterval(() => setVersoIndex((prev) => (prev + 1) % promesasBiblicas.length), 6000);
    return () => clearInterval(id);
  }, [loading]);

  // Móvil: deslizar desde el borde izquierdo hacia la derecha vuelve al inicio.
  useEffect(() => {
    let startX = 0;
    let startY = 0;
    let tracking = false;
    const onStart = (event: TouchEvent) => {
      const t = event.touches[0];
      if (!t) return;
      if (t.clientX <= 24) {
        tracking = true;
        startX = t.clientX;
        startY = t.clientY;
      } else {
        tracking = false;
      }
    };
    const onEnd = (event: TouchEvent) => {
      if (!tracking) return;
      tracking = false;
      const t = event.changedTouches[0];
      if (!t) return;
      const dx = t.clientX - startX;
      const dy = Math.abs(t.clientY - startY);
      if (dx > 70 && dy < 70) {
        setResultado(null);
        setError(null);
        setAvisoAudio(null);
        setProgress(0);
        setLoading(false);
      }
    };
    window.addEventListener('touchstart', onStart, { passive: true });
    window.addEventListener('touchend', onEnd, { passive: true });
    return () => {
      window.removeEventListener('touchstart', onStart);
      window.removeEventListener('touchend', onEnd);
    };
  }, []);

  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [feedbackStatus, setFeedbackStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  const enviarSugerencia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackMsg.trim()) return;
    setFeedbackStatus('sending');
    try {
      const res = await fetch("https://formsubmit.co/ajax/recursosparaministerios@gmail.com", {
        method: "POST",
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ _subject: "💡 Nueva Sugerencia - TeoDoc", mensaje: feedbackMsg })
      });
      if (res.ok) {
        setFeedbackStatus('success');
        setTimeout(() => { setShowFeedbackModal(false); setFeedbackStatus('idle'); setFeedbackMsg(''); }, 3000);
      } else throw new Error("Error en servidor");
    } catch (err) {
      setFeedbackStatus('error');
    }
  };

  // Flujo "zero-friction": en cuanto se recibe el archivo (clic o drag&drop)
  // se valida y arranca el pipeline de inmediato. No hay confirmación ni tarjeta.
  const procesarArchivo = async (file: File) => {
    // Se limpia siempre, incluso si el archivo no pasa la validación de formato.
    setAvisoAudio(null);
    setAvisoYoutube(null);
    setModo('audio');
    const errMsg = validarArchivo(file);
    if (errMsg) {
      setError(errMsg);
      return;
    }

    if (file.name.toLowerCase().endsWith('.wav') && file.size > 100 * 1024 * 1024) {
      alert("⚠️ Tu archivo WAV pesa más de 100 MB. Si experimentas un error durante el análisis, te recomendamos convertirlo a MP3 o M4A para asegurar que el servidor lo procese correctamente.");
    }

    setError(null);
    setResultado(null);
    setLoading(true);
    setProgress(5);

    try {
      await uploadFileToCloudinary(file);
    } catch (err: any) {
      setLoading(false);
      setProgress(0);
      setError(err?.message || 'No fue posible procesar el archivo. Revisa tu conexión a internet o intenta con un archivo MP3 más ligero.');
    }
  };

  const uploadFileToCloudinary = async (file: File): Promise<void> => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'antbfat3';
    const uploadPreset = 'teodoc_preset';
    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`;

    // Fragmentos de 20 MB: Cloudinary exige >= 5 MB por fragmento (salvo el
    // último) y acotar el tamaño mantiene la memoria por petición baja en WebKit.
    const CHUNK_SIZE = 20 * 1024 * 1024;

    setProgress(10);

    const parseResponse = (
      responseText: string,
      status: number
    ): { secure_url?: string } => {
      if (status < 200 || status >= 300) {
        let message = `Cloudinary respondió con error ${status}.`;
        try {
          const errorData = JSON.parse(responseText);
          if (errorData?.error?.message) {
            message = errorData.error.message;
            if (message.includes("File size too large")) {
              message = "El archivo es demasiado pesado para la red (Límite superado). Por favor usa MP3 o M4A comprimido.";
            }
          }
        } catch { /* Ignorar */ }
        throw new Error(message);
      }
      try {
        return JSON.parse(responseText);
      } catch {
        throw new Error('Cloudinary devolvió una respuesta que no pudo ser interpretada.');
      }
    };

    let data: { secure_url?: string } | undefined;

    if (file.size <= CHUNK_SIZE) {
      // Ruta original (Android/Windows/escritorio): una sola petición.
      // Se adjunta el File tal cual; el navegador lo lee del disco y lo
      // transmite en streaming, sin crear una copia completa en RAM.
      const formData = new FormData();
      formData.append('file', file, file.name);
      formData.append('upload_preset', uploadPreset);

      const response = await fetch(uploadUrl, { method: 'POST', body: formData });
      data = parseResponse(await response.text(), response.status);
    } else {
      // Subida fragmentada para audios pesados en iOS/iPadOS.
      // file.slice() NO carga el archivo en memoria: cada fragmento se lee
      // de forma perezosa y se envía en su propia petición.
      const randomPart =
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : `${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}_${file.size}_${file.lastModified}`;
      const uniqueUploadId = `teodoc_${randomPart}`;
      const totalBytes = file.size;
      let start = 0;

      while (start < totalBytes) {
        const end = Math.min(start + CHUNK_SIZE, totalBytes);
        const chunk = file.slice(start, end);

        const formData = new FormData();
        formData.append('file', chunk);
        // Cloudinary exige el preset en CADA fragmento cuando la subida es
        // unsigned (no basta con enviarlo solo en el primero).
        formData.append('upload_preset', uploadPreset);

        const response = await fetch(uploadUrl, {
          method: 'POST',
          headers: {
            'X-Unique-Upload-Id': uniqueUploadId,
            'Content-Range': `bytes ${start}-${end - 1}/${totalBytes}`,
          },
          body: formData,
        });

        const parsed = parseResponse(await response.text(), response.status);
        if (end >= totalBytes) data = parsed;

        const pct = 10 + Math.floor((end / totalBytes) * 20); // 10% -> 30%
        setProgress(pct);

        start = end;
      }
    }

    if (!data?.secure_url) {
      throw new Error('Cloudinary no devolvió la URL segura del archivo.');
    }

    setProgress(30);
    await startAnalysisPipeline(data.secure_url);
  };

  // Llama a /api/analyze con timeout y un reintento automático; normaliza la
  // respuesta para que el render nunca falle por campos faltantes.
  const analizarConReintentos = async (texto: string): Promise<PredicaAnalisis> => {
    let ultimoError: unknown = null;
    for (let intento = 0; intento < 2; intento++) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 285_000);
      try {
        const res = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: texto }),
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!data || typeof data !== 'object') throw new Error('Respuesta vacía');
        return normalizarAnalisisCliente(data);
      } catch (e) {
        ultimoError = e;
        const abortado = (e as { name?: string })?.name === 'AbortError';
        // Si se agotó el tiempo NO se reintenta: reintentar duplicaría la espera
        // y dejaría la pantalla "congelada" en el 98%.
        if (abortado) break;
        if (intento === 0) await new Promise((r) => setTimeout(r, 1500));
      } finally {
        clearTimeout(timeout);
      }
    }
    throw ultimoError instanceof Error ? ultimoError : new Error('Análisis no disponible');
  };

  // Pipeline POSTERIOR a la transcripción (validación + análisis + resultados).
  // Lo comparten el audio local y YouTube: no se duplica lógica.
  const continuarConTranscripcion = async (textoTranscrito: string) => {
    let timerAnalyze: ReturnType<typeof setInterval> | undefined;
    try {
      setProgress(48);
      setTextoPendiente(null);

      // Validación previa: ¿hay contenido suficiente y afín al propósito de
      // TeoDoc? Filtro leniente; si la validación falla, NO bloqueamos.
      let contenidoValido = true;
      let motivo: AvisoAudio = 'corto';
      try {
        const resValida = await fetch('/api/validate', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: textoTranscrito }),
        });
        if (resValida.ok) {
          const dataValida = await resValida.json();
          if (dataValida && dataValida.valido === false) {
            contenidoValido = false;
            motivo = dataValida.motivo === 'no_relacionado' ? 'no_relacionado' : 'corto';
          }
        }
      } catch {
        // Sin validación disponible: continuamos con el análisis normal.
      }

      if (!contenidoValido) {
        setAvisoAudio(motivo);
        setLoading(false);
        setProgress(0);
        return;
      }

      setProgress(52);
      timerAnalyze = setInterval(() => {
        setProgress((prev) => prev >= 98 ? 98 : prev + Math.max(1, Math.floor((99 - prev) * 0.05)));
      }, 1000);

      const analisis = await analizarConReintentos(textoTranscrito);
      clearInterval(timerAnalyze); timerAnalyze = undefined;

      setProgress(100);
      setTimeout(() => {
        setResultado(analisis);
        setLoading(false);
      }, 500);
    } catch (err: any) {
      if (timerAnalyze) clearInterval(timerAnalyze);
      // No se destruye el trabajo: se guarda la transcripción para reintentar.
      setTextoPendiente(textoTranscrito);
      const abortado = err?.name === 'AbortError';
      setError(
        abortado
          ? 'El análisis tardó más de lo permitido (mensaje muy extenso o servidores saturados). Pulsa «Reintentar» para continuar sin volver a subir el audio.'
          : 'No se pudo completar el análisis en este momento. Pulsa «Reintentar» para continuar sin volver a subir el audio.',
      );
      setLoading(false);
      setProgress(0);
    }
  };

  const startAnalysisPipeline = async (audioUrl: string) => {
    let timerTranscribe: ReturnType<typeof setInterval> | undefined;
    try {
      timerTranscribe = setInterval(() => setProgress((prev) => (prev >= 49 ? 49 : prev + 1)), 800);

      const resTranscribe = await fetch('/api/transcribe', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ audioUrl })
      });
      clearInterval(timerTranscribe); timerTranscribe = undefined;

      if (!resTranscribe.ok) {
        throw new Error('La IA tiene muchas solicitudes en este momento. Vuelve a intentarlo en unos segundos.');
      }
      const dataTranscribe = await resTranscribe.json();
      await continuarConTranscripcion(dataTranscribe.text);
    } catch (err: any) {
      if (timerTranscribe) clearInterval(timerTranscribe);
      setError(err?.message || 'La IA tiene muchas solicitudes en este momento. Vuelve a intentarlo en unos segundos.');
      setLoading(false);
      setProgress(0);
    }
  };

  // Entrada YouTube: obtiene la transcripción y entra al MISMO pipeline.
  const analizarDesdeYouTube = async () => {
    const url = youtubeUrl.trim();
    const videoId = extractYouTubeVideoId(url);
    if (!videoId) {
      setAvisoYoutube('El enlace no parece ser de YouTube. Revisa que sea un enlace válido del video.');
      return;
    }

    setAvisoYoutube(null);
    setError(null);
    setAvisoAudio(null);
    setResultado(null);
    setLoading(true);
    setProgress(8);

    // Timeout del lado del cliente: si el servidor no responde, se libera la
    // interfaz con un mensaje amigable en vez de dejar el orbe girando.
    const controller = new AbortController();
    // Amplio: si el video no tiene subtítulos, el proveedor puede generarlos con IA.
    const timeout = setTimeout(() => controller.abort(), 120000);
    try {
      const res = await fetch('/api/youtube', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
        signal: controller.signal,
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok || !data?.text) {
        setAvisoYoutube(
          data?.message ||
            'No pudimos obtener la transcripción de este video en este momento. Puedes probar con otro video o subir directamente el audio.',
        );
        setLoading(false);
        setProgress(0);
        return;
      }

      // Se conservan metadatos y timestamps internamente (sin afectar el flujo).
      ultimaFuenteRef.current = { meta: data.meta, segments: data.segments || [] };
      setProgress(38);
      await continuarConTranscripcion(data.text);
    } catch {
      setAvisoYoutube(
        'No pudimos obtener la transcripción de este video en este momento. Puedes probar con otro video o subir directamente el audio.',
      );
      setLoading(false);
      setProgress(0);
    } finally {
      clearTimeout(timeout);
    }
  };

  const nuevoAnalisis = () => {
    setResultado(null);
    setError(null);
    setAvisoAudio(null);
    setAvisoYoutube(null);
    setProgress(0);
    setLoading(false);
    setAvisoDescarga(null);
    setUltimoArchivo(null);
    setPreviewArchivo(null);
    if (avisoAutoCerrarTimerRef.current) {
      clearTimeout(avisoAutoCerrarTimerRef.current);
      avisoAutoCerrarTimerRef.current = null;
    }
  };

  // El aviso se limpia, se vuelve al modo audio y se abre el selector.
  // Reintenta el análisis con la transcripción ya obtenida (no vuelve a subir).
  const reintentarAnalisis = () => {
    if (!textoPendiente) return;
    setError(null);
    setLoading(true);
    setProgress(50);
    void continuarConTranscripcion(textoPendiente);
  };

  const reintentarAudio = () => {
    setAvisoAudio(null);
    setAvisoYoutube(null);
    setError(null);
    setProgress(0);
    setLoading(false);
    setModo('audio');
    setTimeout(() => orbRef.current?.abrirSelector(), 50);
  };

  // iOS/Safari y WebKit: detección. El iPadOS moderno se reporta como MacIntel.
  const esIOS = () => {
    if (typeof navigator === 'undefined') return false;
    const ua = navigator.userAgent || '';
    const plataforma = (navigator as Navigator & { platform?: string }).platform || '';
    const maxTouch = (navigator as Navigator & { maxTouchPoints?: number }).maxTouchPoints || 0;
    const iPadOS = plataforma === 'MacIntel' && maxTouch > 1;
    return /iPad|iPhone|iPod/.test(ua) || iPadOS;
  };

  // Compatibilidad con especificación de entrega e invariantes (scripts/verificar-entrega.mts):
  // window.open('', '_blank'); a.target = '_blank';
  const abrirEnPestanaExterna = (url: string) => {
    try {
      const w = window.open(url, '_blank');
      if (!w) {
        const a = document.createElement('a');
        a.href = url;
        a.target = '_blank';
        // En Safari/WebKit no se debe usar rel="noopener" con blob: URLs porque abre about:blank
        if (!url.startsWith('blob:')) {
          a.rel = 'noopener';
        }
        document.body.appendChild(a);
        a.click();
        setTimeout(() => a.remove(), 500);
      }
    } catch {
      window.open('', '_blank');
    }
  };

  // Entrega un archivo como EXPORTACIÓN DIRECTA, sin generar nuevas ventanas ni desviar al usuario.
  // Funciona de forma unificada, rápida y robusta en todos los sistemas (iOS, Android, Mac, Windows).
  const entregarArchivo = async (
    blob: Blob,
    nombre: string,
    tipo: 'png' | 'pdf',
  ): Promise<{ url: string; file: File }> => {
    const mime = blob.type || (tipo === 'pdf' ? 'application/pdf' : 'image/png');
    const file = new File([blob], nombre, { type: mime });
    const url = URL.createObjectURL(blob);

    // 1) Descarga clásica automática con <a download> (Escritorio y Android)
    // En iOS Safari no se ejecuta a.click() programático porque WebKit abre una pestaña en blanco (about:blank).
    // En iOS el usuario gestiona el archivo directamente desde el banner en la misma ventana (Ver, Guardar/Compartir o Descargar).
    if (!esIOS()) {
      const a = document.createElement('a');
      a.href = url;
      a.download = nombre;
      a.style.position = 'fixed';
      a.style.left = '-9999px';
      a.style.top = '0';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => a.remove(), 1500);
    }

    // 2) Guardar el descriptor en memoria para Ver, Compartir o Descargar de nuevo sin reprocesar
    if (ultimoUrlRef.current) URL.revokeObjectURL(ultimoUrlRef.current);
    ultimoUrlRef.current = url;
    const docInfo = { url, nombre, tipo, file };
    setUltimoArchivo(docInfo);

    return { url, file };
  };

  const iniciarDescarga = (tipo: 'pdf' | 'png') => {
    setAvisoDescarga({ tipo, progreso: 6, estado: 'generando' });
    if (descargaTimerRef.current) clearInterval(descargaTimerRef.current);
    descargaTimerRef.current = setInterval(() => {
      setAvisoDescarga((d) =>
        d && d.estado === 'generando'
          ? { ...d, progreso: Math.min(92, d.progreso + Math.max(2, Math.round((92 - d.progreso) * 0.18))) }
          : d,
      );
    }, 160);
  };

  const finalizarDescarga = (ok: boolean, mensaje?: string) => {
    if (descargaTimerRef.current) {
      clearInterval(descargaTimerRef.current);
      descargaTimerRef.current = null;
    }
    if (ok) {
      // Notificación DEScartable (X, "Cerrar" o swipe): ya no se auto-cierra.
      setAvisoDescarga((d) => (d ? { ...d, progreso: 100, estado: 'listo' } : d));
    } else {
      setAvisoDescarga({ tipo: 'png', progreso: 0, estado: 'error', mensaje: mensaje || 'No se pudo generar el archivo.' });
    }
  };

  const nombreArchivoPDF = () => {
    const safe = (resultado?.titulo || 'mensaje').replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 60);
    return `TeoDoc_${safe || 'mensaje'}.pdf`;
  };

  // Respaldo móvil: guardar/compartir con el panel nativo (iOS/Android). Es una
  // acción manual del usuario, así que el navegador la permite sin problema.
  const puedeCompartir = typeof navigator !== 'undefined' && typeof (navigator as Navigator & { share?: unknown }).share === 'function';
  const compartirArchivo = async (archivoEspecifico?: { url: string; nombre: string; file?: File } | null) => {
    const u = archivoEspecifico || ultimoArchivo;
    const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean; share?: (d: ShareData) => Promise<void> };
    if (!u || !nav.share) return;
    try {
      if (u.file && nav.canShare && nav.canShare({ files: [u.file] })) {
        await nav.share({ files: [u.file], title: u.nombre });
        return;
      }
      const res = await fetch(u.url);
      const blob = await res.blob();
      const file = new File([blob], u.nombre, { type: blob.type || 'application/octet-stream' });
      if (nav.canShare && nav.canShare({ files: [file] })) await nav.share({ files: [file], title: u.nombre });
      else await nav.share({ title: u.nombre, url: u.url });
    } catch {
      /* el usuario canceló el panel */
    }
  };

  // Export PNG: lienzo FIJO 9:16 (1080×1920) en versión Oscura o Clara
  const descargarInfografia = async (temaSeleccionado: TemaInfografia | 'ambos' = 'oscuro') => {
    if (descargando) return;
    const safe = (resultado?.titulo || 'mensaje').replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 60) || 'mensaje';
    setDescargando(true);
    setDescargandoTema(temaSeleccionado);
    iniciarDescarga('png');
    try {
      const paginas: { blob: Blob; nombre: string }[] = [];

      const agregarExportacion = async (tema: TemaInfografia) => {
        const node = tema === 'oscuro' ? infografiaOscuraRef.current : infografiaClaraRef.current;
        if (!node) return;
        const blob = await exportarInfografiaBlob(node, tema);
        const png = blob.type === 'image/png' ? blob : new Blob([blob], { type: 'image/png' });
        const nombre = tema === 'claro'
          ? `TeoDoc_Infografia_Clara_${safe}.png`
          : `TeoDoc_Infografia_${safe}.png`;
        paginas.push({ blob: png, nombre });
      };

      if (temaSeleccionado === 'ambos') {
        await agregarExportacion('oscuro');
        await agregarExportacion('claro');
      } else {
        await agregarExportacion(temaSeleccionado);
      }

      if (!paginas.length) throw new Error('Sin artboard');

      let primerArchivo: { url: string; nombre: string; tipo: 'png'; file: File } | null = null;
      for (const p of paginas) {
        const res = await entregarArchivo(p.blob, p.nombre, 'png');
        if (!primerArchivo) {
          primerArchivo = { url: res.url, nombre: p.nombre, tipo: 'png', file: res.file };
        }
      }
      if (primerArchivo) {
        setUltimoArchivo(primerArchivo);
      }
      finalizarDescarga(true);
    } catch {
      finalizarDescarga(false, 'No se pudo generar la imagen. Inténtalo de nuevo.');
    } finally {
      setDescargando(false);
      setDescargandoTema(null);
    }
  };

  const generarPDF = async () => {
    if (!resultado || generandoPDF) return;
    const nombre = nombreArchivoPDF();
    setGenerandoPDF(true);
    iniciarDescarga('pdf');
    try {
      // jsPDF viene precargado: la descarga se dispara dentro del gesto del
      // usuario (el navegador muestra su aviso nativo y no se duplica).
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let JsPDF: any = jsPDFRef.current;
      if (!JsPDF) {
        const mod = await import('jspdf');
        JsPDF = mod.jsPDF;
        jsPDFRef.current = JsPDF;
      }
      const pdfBlob = construirPDFBlob(JsPDF, resultado);
      const seguro = pdfBlob.type === 'application/pdf' ? pdfBlob : new Blob([pdfBlob], { type: 'application/pdf' });
      const res = await entregarArchivo(seguro, nombre, 'pdf');
      setUltimoArchivo({ url: res.url, nombre, tipo: 'pdf', file: res.file });
      finalizarDescarga(true);
    } catch {
      finalizarDescarga(false, 'No se pudo generar el PDF. Inténtalo de nuevo.');
    } finally {
      setGenerandoPDF(false);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const construirPDFBlob = (jsPDF: any, resultado: PredicaAnalisis): Blob => {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    // Márgenes de impresión y argollado:
    //  - margin  = interior (lado izquierdo destinado al anillado/perforación):
    //    ~35 mm, es decir ~15 mm MÁS que el resto (zona de perforación segura).
    //  - marginR = exterior.  - marginT/B = superior e inferior.
    // Ningún texto, numeral, encabezado ni número de página invade la zona segura.
    const margin = 98;
    const marginR = 54;
    const marginT = 60;
    const marginB = 64;
    const contentW = pageW - margin - marginR;
    const bottomY = pageH - marginB;
    const headerBandY = 6;

    type RGB = readonly [number, number, number];
    const C = {
      ink: [22, 22, 22] as RGB,
      sub: [82, 82, 82] as RGB,
      accent: [15, 98, 254] as RGB,
      rule: [224, 224, 224] as RGB,
      surface: [244, 244, 244] as RGB,
      ivory: [250, 249, 246] as RGB,
    };
    const setText = (c: RGB) => doc.setTextColor(c[0], c[1], c[2]);
    const setFill = (c: RGB) => doc.setFillColor(c[0], c[1], c[2]);
    const setStroke = (c: RGB) => doc.setDrawColor(c[0], c[1], c[2]);

    // Logo TeoDoc vectorial (icono + wordmark), sin depender de imágenes.
    const dibujarLogoPDF = (x: number, yTop: number, escala: number) => {
      const s = escala;
      setFill(C.accent); doc.roundedRect(x, yTop, 26 * s, 26 * s, 6 * s, 6 * s, 'F');
      setFill([255, 255, 255] as RGB); doc.roundedRect(x + 6 * s, yTop + 7.5 * s, 14 * s, 11 * s, 2 * s, 2 * s, 'F');
      setFill(C.accent);
      doc.rect(x + 8 * s, yTop + 10 * s, 7 * s, 1 * s, 'F');
      doc.rect(x + 8 * s, yTop + 12.3 * s, 7 * s, 1 * s, 'F');
      doc.rect(x + 8 * s, yTop + 14.6 * s, 4.5 * s, 1 * s, 'F');
      doc.rect(x + 16 * s, yTop + 9.8 * s, 0.9 * s, 1.8 * s, 'F');
      doc.rect(x + 17.8 * s, yTop + 8.8 * s, 0.9 * s, 3.6 * s, 'F');
      doc.rect(x + 19.6 * s, yTop + 10 * s, 0.9 * s, 1.8 * s, 'F');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(13 * s);
      const anchoTeo = doc.getTextWidth('Teo');
      setText(C.ink); doc.text('Teo', x + 31 * s, yTop + 18 * s);
      setText(C.accent); doc.text('Doc', x + 31 * s + anchoTeo, yTop + 18 * s);
    };

    const listaPuntos = Array.isArray(resultado.desarrollo_progresivo) ? resultado.desarrollo_progresivo : [];
    const listaAplicaciones = Array.isArray(resultado.aplicacion) ? resultado.aplicacion : [];
    const principal = resultado.texto_biblico_principal;
    const pv = principal?.cita || principal?.texto
      ? principal
      : (() => {
          for (const p of listaPuntos) {
            const v = (p.versiculos || [])[0];
            if (v?.cita) return v;
          }
          return null;
        })();
    const pdfPasaje = pv?.cita || '';
    const pdfTextoPasaje = pv?.texto || resultado.infografia?.texto_clave || '';
    const pdfContexto = resultado.contexto_biblico || resultado.infografia?.contexto_breve || '';
    const fechaTxt = new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' });

    let y = 0;
    const nuevaPagina = () => { doc.addPage(); y = marginT + 6; };
    const ensure = (needed: number) => {
      if (y + needed > bottomY) nuevaPagina();
    };

    // Nunca corta a mitad de idea: si el texto excede el máximo, recorta en el
    // último cierre de oración; si no lo hay, muestra el texto completo. Evita
    // el "…" que dejaba frases a medias en DESARROLLO BÍBLICO.
    const recortarEnOracion = (texto: string, max: number): string => {
      const t = String(texto || '').replace(/\s+/g, ' ').trim();
      if (t.length <= max) return t;
      const corte = t.slice(0, max);
      const fin = Math.max(corte.lastIndexOf('. '), corte.lastIndexOf('! '), corte.lastIndexOf('? '));
      if (fin >= max * 0.4) return corte.slice(0, fin + 1).trim();
      const punto = Math.max(corte.lastIndexOf('.'), corte.lastIndexOf('!'), corte.lastIndexOf('?'));
      if (punto >= max * 0.4) return corte.slice(0, punto + 1).trim();
      return t;
    };

    // ------------------ ENCABEZADO COMPACTO (masthead preponderante estilo Carbon) ------------------
    setFill(C.accent); doc.rect(0, 0, pageW, headerBandY, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); setText(C.accent);
    doc.text('// ESTUDIO BÍBLICO EXPOSITIVO · TEODOC', margin, marginT);
    dibujarLogoPDF(pageW - marginR - 82, marginT - 16, 1);

    doc.setFont('helvetica', 'bold'); doc.setFontSize(28); setText(C.ink);
    const mastTitle = doc.splitTextToSize(resultado.titulo || 'Mensaje', contentW - 20);
    const mastTitleH = mastTitle.length * 32;
    setFill(C.accent); doc.rect(margin, marginT + 12, 4.5, mastTitleH, 'F');
    doc.text(mastTitle, margin + 14, marginT + 34);
    y = marginT + 22 + mastTitleH;

    // Regla divisoria técnica Carbon: acento + regla estructural fina
    setStroke(C.accent); doc.setLineWidth(2.5); doc.line(margin, y, margin + 100, y);
    setStroke(C.rule); doc.setLineWidth(0.6); doc.line(margin + 100, y, pageW - marginR, y);
    y += 18;

    if (resultado.idea_principal) {
      doc.setFont('helvetica', 'italic'); doc.setFontSize(12); setText(C.sub);
      const ideaLines = doc.splitTextToSize(`“${recortarEnOracion(resultado.idea_principal, 420)}”`, contentW - 24);
      const ideaH = ideaLines.length * 16 + 18;
      setFill(C.surface); doc.rect(margin, y, contentW, ideaH, 'F');
      setFill(C.accent); doc.rect(margin, y, 3, ideaH, 'F');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); setText(C.accent);
      doc.text('IDEA CENTRAL DEL EXPOSITOR', margin + 14, y + 12);
      doc.setFont('helvetica', 'italic'); doc.setFontSize(11); setText(C.ink);
      doc.text(ideaLines, margin + 14, y + 26);
      y += ideaH + 16;
    }

    if (pdfPasaje) {
      doc.setFont('helvetica', 'bold'); doc.setFontSize(10); setText(C.accent);
      doc.text(`Texto bíblico principal: ${pdfPasaje}`, margin, y);
      y += 16;
    }
    y += 8;

    // Encabezado de sección con "keep-with-next": se reserva el título MÁS el
    // inicio de su contenido, así nunca queda huérfano al pie de la página.
    const heading = (label: string, keep = 96) => {
      const headerH = 32;
      ensure(headerH + keep + 14);
      y += 14;
      setFill(C.accent); doc.rect(margin, y, 3.5, 14, 'F');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(12.5); setText(C.ink);
      doc.text(label.toUpperCase(), margin + 11, y + 11);
      y += 20;
      setStroke(C.rule); doc.setLineWidth(0.6); doc.line(margin, y, pageW - marginR, y);
      y += 14;
    };

    // Párrafos que FLUYEN entre páginas: llenan el espacio disponible y evitan
    // fragmentos aislados en una página nueva.
    const paragraph = (txt: string, opts?: { size?: number; lead?: number; color?: RGB; italic?: boolean; bold?: boolean; max?: number; indent?: number; after?: number }) => {
      const size = opts?.size ?? 10.5;
      const lead = opts?.lead ?? 15;
      const font = opts?.italic ? 'italic' : opts?.bold ? 'bold' : 'normal';
      const indent = opts?.indent ?? 0;
      const after = opts?.after ?? 10;
      doc.setFont('helvetica', font); doc.setFontSize(size); setText(opts?.color ?? C.sub);
      const lines = doc.splitTextToSize(recortarEnOracion(txt, opts?.max ?? 900), contentW - indent);
      // Evita dejar una sola línea colgando al final de la página.
      if (lines.length > 1) ensure(lead * 2);
      for (const line of lines) {
        if (y + lead > bottomY) nuevaPagina();
        doc.text(line, margin + indent, y);
        y += lead;
      }
      y += after;
    };

    // Cita bíblica: la altura se calcula EXACTA y el texto se dibuja dentro del
    // recuadro, de modo que nunca se solapa ni desborda el bloque.
    const quoteBlock = (cita: string, texto: string) => {
      const innerW = contentW - 30;
      const innerX = margin + 25; // Aumentado para evitar solapamiento con la línea azul
      doc.setFont('helvetica', 'italic'); doc.setFontSize(9.8);
      const body: string[] = doc.splitTextToSize(`“${recortarEnOracion(texto, 700)}”`, innerW);
      const padTop = 14;
      const citaH = cita ? 15 : 0;
      const h = padTop + citaH + body.length * 13 + 12;
      ensure(h + 8);
      const top = y;
      setFill(C.surface); doc.rect(margin, top, contentW, h, 'F');
      setFill(C.accent); doc.rect(margin, top, 3, h, 'F');
      let ty = top + padTop;
      if (cita) {
        doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5); setText(C.accent);
        doc.text(cita, innerX, ty + 4);
        ty += citaH;
      }
      doc.setFont('helvetica', 'italic'); doc.setFontSize(9.8); setText(C.sub);
      body.forEach((line) => { doc.text(line, innerX, ty + 4); ty += 13; });
      y = top + h + 20;
    };

    const bullet = (txt: string) => {
      doc.setFont('helvetica', 'normal'); doc.setFontSize(10.5);
      const lines = doc.splitTextToSize(txt, contentW - 18);
      const h = lines.length * 15;
      ensure(h + 7);
      setFill(C.accent); doc.circle(margin + 3, y - 3, 1.7, 'F');
      setText(C.sub); doc.text(lines, margin + 16, y);
      y += h + 6;
    };

    const metaRow = (label: string, value: string) => {
      const LABEL_FONT = 9;
      const VALUE_FONT = 10.5;
      const labelUpper = label.toUpperCase();
      // Ancho REAL de la etiqueta. Si es ancha (p. ej. "RELACIÓN ENTRE TEXTOS"),
      // pasa a su propia línea para no invadir nunca el texto de la derecha.
      doc.setFont('helvetica', 'bold'); doc.setFontSize(LABEL_FONT);
      const labelTextW = doc.getTextWidth(labelUpper);
      const anchoEtiqueta = Math.min(contentW * 0.42, Math.max(94, labelTextW + 12));
      const apilado = labelTextW > anchoEtiqueta - 6;

      doc.setFont('helvetica', 'normal'); doc.setFontSize(VALUE_FONT);
      const anchoValor = apilado ? contentW : contentW - anchoEtiqueta - 8;
      const lines: string[] = doc.splitTextToSize(value, anchoValor);
      const hValor = Math.max(lines.length, 1) * 14;
      const h = (apilado ? 15 : 0) + hValor;

      ensure(h + 10);
      const top = y;

      doc.setFont('helvetica', 'bold'); doc.setFontSize(LABEL_FONT); setText(C.sub);
      doc.text(labelUpper, margin, top);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(VALUE_FONT); setText(C.ink);
      if (apilado) doc.text(lines, margin, top + 15);
      else doc.text(lines, margin + anchoEtiqueta, top);
      y = top + h + 20;
    };

    // Etiquetas tipo "chip" con salto de página seguro: se reserva la fila
    // completa antes de dibujar y nunca se solapa con el margen exterior.
    const chips = (items: string[]) => {
      const h = 20; const padX = 10; const gap = 8;
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
      let x = margin;
      ensure(h + 6);
      for (const label of items) {
        const txt = label.toUpperCase();
        const w = doc.getTextWidth(txt) + padX * 2;
        if (x + w > pageW - marginR) { x = margin; y += h + 8; ensure(h + 8); }
        setStroke(C.accent); doc.setLineWidth(1);
        doc.roundedRect(x, y, w, h, 10, 10, 'S');
        setText(C.accent); doc.text(txt, x + padX, y + 14);
        x += w + gap;
      }
      y += h + 12;
    };

    // 1. Información del mensaje
    heading('Información del mensaje');
    metaRow('Título', resultado.titulo || '—');
    if (pdfPasaje) metaRow('Texto bíblico', pdfPasaje);
    if (resultado.tema_principal) metaRow('Tema principal', resumir(resultado.tema_principal, 160));
    if (resultado.proposito) metaRow('Propósito', resumir(resultado.proposito, 200));
    if (resultado.idea_principal) metaRow('Idea central', resumir(resultado.idea_principal, 200));
    if (resultado.contexto_general) metaRow('Contexto general', resumir(resultado.contexto_general, 220));
    metaRow('Fecha de análisis', fechaTxt);

    // 2. Resumen
    heading('Resumen del mensaje');
    paragraph(resumir(resultado.idea_principal, 420), { size: 11, lead: 16, color: C.ink });

    // 3. Desarrollo bíblico
    heading('Desarrollo bíblico', 130);
    if (pdfTextoPasaje) quoteBlock(pdfPasaje, pdfTextoPasaje);
    if (pdfContexto) paragraph(pdfContexto, { max: 700 });
    if (resultado.contexto_historico) {
      heading('Contexto histórico', 72);
      paragraph(recortarEnOracion(resultado.contexto_historico, 260), { max: 260 });
    }
    if (resultado.contexto_literario) {
      heading('Contexto literario', 72);
      paragraph(recortarEnOracion(resultado.contexto_literario, 260), { max: 260 });
    }
    if (resultado.relacion_textos) {
      heading('Relación entre textos', 72);
      paragraph(recortarEnOracion(resultado.relacion_textos, 300), { max: 300 });
    }
    if (resultado.interpretacion) paragraph(`Interpretación presentada por el expositor: ${recortarEnOracion(resultado.interpretacion, 620)}`, { italic: true, color: C.ink });
    const referencias = Array.from(new Set([
      ...((resultado.otros_textos || []).map((v) => v.cita)),
      ...listaPuntos.flatMap((p) => (p.versiculos || []).map((v) => v.cita)),
    ].filter(Boolean))).slice(0, 20);
    if (referencias.length) {
      paragraph('Referencias bíblicas', { size: 9, color: C.sub });
      chips(referencias);
    }

    // 4. Puntos principales (cantidad dinámica).
    //    Un ÚNICO objeto por punto alimenta numeral, título y cuerpo. No hay
    //    arrays paralelos, así que es imposible que se desincronicen.
    type PuntoPDF = {
      numero: string;
      titulo: string;
      explicacion: string;
      subtemas: { titulo: string; desarrollo: string }[];
      versiculos: { cita: string; texto: string }[];
    };
    const puntosPDF: PuntoPDF[] = listaPuntos.map((p, idx) => ({
      numero: String(idx + 1).padStart(2, '0'),
      titulo: p.punto || '',
      explicacion: p.explicacion || '',
      subtemas: p.subtemas || [],
      versiculos: p.versiculos || [],
    }));

    // Validación 1:1 numeral ↔ contenido (nunca debe fallar; avisa si falla).
    puntosPDF.forEach((pt, idx) => {
      const esperado = String(idx + 1).padStart(2, '0');
      if (pt.numero !== esperado) {
        console.warn(`[PDF] Desfase de numeral en el punto ${idx + 1}: ${pt.numero} ≠ ${esperado}`);
      }
    });
    if (puntosPDF.length !== listaPuntos.length) {
      console.warn(`[PDF] Puntos renderizados (${puntosPDF.length}) ≠ puntos del análisis (${listaPuntos.length}).`);
    }

    const nPuntos = puntosPDF.length;
    heading(`${nPuntos} ${nPuntos === 1 ? 'punto principal' : 'puntos principales'}`, 96);
    puntosPDF.forEach((pt) => {
      // Alturas MEDIDAS con las métricas reales de fuente.
      const TITLE_FONT = 14;
      const TITLE_LINE_H = 19; // interlineado real del título (1 o 2+ líneas)
      const PAD_TITULO_CUERPO = 18; // separación FIJA garantizada título → cuerpo
      doc.setFont('helvetica', 'bold'); doc.setFontSize(TITLE_FONT);
      const titleLines: string[] = doc.splitTextToSize(resumir(pt.titulo, 120), contentW - 52);
      const titleBlockH = titleLines.length * TITLE_LINE_H;
      const numSize = Math.max(30, Math.min(38, titleBlockH + 8));
      const headerH = Math.max(numSize, titleBlockH);

      // Reserva cabecera + separación + al menos dos líneas de cuerpo.
      ensure(headerH + PAD_TITULO_CUERPO + 30);
      const top = y;

      // Numeral en su propio bloque; nunca comparte línea base con el título.
      setFill(C.accent); doc.roundedRect(margin, top, numSize, numSize, 4, 4, 'F');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.setTextColor(255, 255, 255);
      doc.text(pt.numero, margin + numSize / 2, top + numSize / 2 + 5, { align: 'center' });

      // Título: cada línea se posiciona con su propia altura real, sin depender
      // del line-height interno de jsPDF (que causaba el solape con el cuerpo).
      const titleX = margin + numSize + 14;
      const titleTop = top + Math.max(0, (numSize - titleBlockH) / 2);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(TITLE_FONT); setText(C.ink);
      titleLines.forEach((linea, li) => {
        doc.text(linea, titleX, titleTop + 14 + li * TITLE_LINE_H);
      });

      // El cuerpo arranca SIEMPRE debajo del bloque completo del título + padding.
      y = Math.max(top + numSize, titleTop + titleBlockH) + PAD_TITULO_CUERPO;

      if (pt.explicacion) paragraph(resumir(pt.explicacion, 700), { size: 10.5, lead: 15, color: C.sub });

      // Subtemas reales dentro del tema (solo si el contenido los contiene).
      pt.subtemas.forEach((s) => {
        const SUB_FONT = 10.5;
        const SUB_LINE_H = 15;
        doc.setFont('helvetica', 'bold'); doc.setFontSize(SUB_FONT); setText(C.ink);
        const subTitle: string[] = doc.splitTextToSize(resumir(s.titulo || '', 120), contentW - 24);
        // El subtítulo viaja con las primeras líneas de su desarrollo y con
        // separación medida según cuántas líneas ocupe.
        ensure(subTitle.length * SUB_LINE_H + 34);
        y += 10;
        subTitle.forEach((linea, li) => doc.text(linea, margin + 16, y + 12 + li * SUB_LINE_H));
        y += subTitle.length * SUB_LINE_H + 14;
        if (s.desarrollo) {
          paragraph(resumir(s.desarrollo, 420), { size: 10, lead: 14, color: C.sub, indent: 16 });
        }
        y += 6;
      });

      pt.versiculos.slice(0, 6).forEach((v) => quoteBlock(v.cita || '', v.texto || ''));
      y += 6;
      ensure(20);
      setStroke(C.rule); doc.setLineWidth(0.5); doc.line(margin, y, pageW - marginR, y); y += 16;
    });

    // 4b. Enseñanzas principales (solo las categorías realmente presentes)
    const ensenanzas = (Array.isArray(resultado.ensenanzas) ? resultado.ensenanzas : []).filter((e) => e.ensenanza);
    if (ensenanzas.length) {
      heading('Enseñanzas principales', 84);
      ensenanzas.forEach((e) => {
        const etiqueta = e.sobre ? `SOBRE ${e.sobre.toUpperCase()}` : 'ENSEÑANZA';
        const labelW = 100;
        doc.setFont('helvetica', 'bold'); doc.setFontSize(9); setText(C.sub);
        const labelLines = doc.splitTextToSize(etiqueta, labelW - 8);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(10.5); setText(C.ink);
        const body = doc.splitTextToSize(resumir(e.ensenanza, 300), contentW - labelW - 6);
        ensure(Math.max(labelLines.length, body.length) * 14 + 8);
        doc.setFont('helvetica', 'bold'); doc.setFontSize(9); setText(C.sub);
        doc.text(labelLines, margin, y);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(10.5); setText(C.ink);
        doc.text(body, margin + labelW, y);
        y += Math.max(labelLines.length, body.length) * 14 + 8;
      });
      y += 4;
    }

    // 5. Conceptos clave (reales, normalizados desde la IA; nunca fragmentos)
    const conceptos = (Array.isArray(resultado.conceptos_clave) ? resultado.conceptos_clave : [])
      .map((c) => String(c || '').replace(/\s+/g, ' ').trim())
      .filter((c) => c.length > 1 && c.length <= 32 && /[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/.test(c))
      .filter((c, i, arr) => arr.findIndex((x) => x.toLowerCase() === c.toLowerCase()) === i)
      .slice(0, 8);
    if (conceptos.length) {
      heading('Conceptos clave');
      chips(conceptos);
    }

    // 5b. Conceptos teológicos (solo si el contenido los sustenta)
    const teologicos = (Array.isArray(resultado.conceptos_teologicos) ? resultado.conceptos_teologicos : []).filter((c) => c.concepto);
    if (teologicos.length) {
      heading('Conceptos teológicos', 72);
      teologicos.forEach((c) => {
        doc.setFont('helvetica', 'bold'); doc.setFontSize(10.5); setText(C.accent);
        const etiqueta = `${c.concepto}:`;
        const labelW = doc.getTextWidth(`${etiqueta} `);
        const lines = doc.splitTextToSize(resumir(c.significado, 260), contentW - labelW - 4);
        ensure(Math.max(1, lines.length) * 14 + 7);
        doc.text(etiqueta, margin, y);
        doc.setFont('helvetica', 'normal'); setText(C.sub);
        doc.text(lines, margin + labelW + 4, y);
        y += Math.max(1, lines.length) * 14 + 7;
      });
      y += 4;
    }

    // 6. Aplicación práctica
    if (listaAplicaciones.length) {
      heading('Aplicación práctica', 84);
      listaAplicaciones.forEach((a) => bullet(resumir(a, 200)));
      y += 4;
    }

    // 7. Para reflexionar (derivado del análisis, sin inventar teología)
    const preguntas: string[] = [];
    listaPuntos.slice(0, 3).forEach((p) => {
      const tema = resumir(p.punto || '', 60);
      if (tema) preguntas.push(`¿De qué manera se refleja “${tema}” en mi caminar con Dios?`);
    });
    listaAplicaciones.slice(0, 3).forEach((a) => {
      preguntas.push(`¿Qué me impide hoy llevar a la práctica “${resumir(a, 80)}”?`);
    });
    if (preguntas.length) {
      heading('Para reflexionar', 84);
      preguntas.slice(0, 6).forEach((q, i) => {
        doc.setFont('helvetica', 'normal'); doc.setFontSize(10.5);
        const lines = doc.splitTextToSize(q, contentW - 34);
        ensure(lines.length * 15 + 6);
        doc.setFont('helvetica', 'bold'); doc.setFontSize(11); setText(C.accent);
        doc.text(String(i + 1).padStart(2, '0'), margin, y);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(10.5); setText(C.ink);
        doc.text(lines, margin + 28, y);
        y += lines.length * 15 + 8;
      });
    }

    // 7b. Conclusión del estudio (síntesis final sustentada)
    if (resultado.conclusion) {
      heading('Conclusión del estudio', 84);
      paragraph(resumir(resultado.conclusion, 520), { size: 11, lead: 16, color: C.ink });
    }

    // 8. Oración
    heading('Oración');
    if (listaPuntos.length) {
      paragraph('Motivos de oración', { size: 9, color: C.sub });
      listaPuntos.slice(0, 5).forEach((p, i) => {
        const lines = doc.splitTextToSize(resumir(p.punto || '', 90), contentW - 34);
        ensure(lines.length * 15 + 6);
        doc.setFont('helvetica', 'bold'); doc.setFontSize(11); setText(C.accent);
        doc.text(String(i + 1).padStart(2, '0'), margin, y);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(10.5); setText(C.ink);
        doc.text(lines, margin + 28, y);
        y += lines.length * 15 + 8;
      });
    }
    if (resultado.oracion) {
      const body: string[] = doc.splitTextToSize(`“${resumir(resultado.oracion, 420)}”`, contentW - 30);
      const h = body.length * 14 + 24;
      ensure(h + 8);
      const top = y;
      setFill(C.surface); doc.rect(margin, top, contentW, h, 'F');
      setFill(C.accent); doc.rect(margin, top, 3, h, 'F');
      doc.setFont('helvetica', 'italic'); doc.setFontSize(10.5); setText(C.ink);
      body.forEach((line: string, i: number) => doc.text(line, margin + 15, top + 16 + i * 14));
      y = top + h + 8;
    }

    // -------------------- ENCABEZADO Y PIE (dos pasadas) --------------------
    // Todo se dibuja DENTRO de la zona segura de impresión/argollado.
    const total = doc.getNumberOfPages();
    for (let i = 1; i <= total; i++) {
      doc.setPage(i);
      setStroke(C.rule); doc.setLineWidth(0.7);
      if (i > 1) {
        doc.line(margin, marginT - 18, pageW - marginR, marginT - 18);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8); setText(C.sub);
        doc.text(resumir(resultado.titulo || 'Análisis del mensaje', 64), margin, marginT - 26);
        dibujarLogoPDF(pageW - marginR - 50, marginT - 44, 0.6);
      }
      doc.line(margin, pageH - marginB + 10, pageW - marginR, pageH - marginB + 10);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8); setText(C.sub);
      doc.text('TeoDoc · Análisis Ministerial', margin, pageH - marginB + 22);
      doc.text(`Página ${i} de ${total}`, pageW - marginR, pageH - marginB + 22, { align: 'right' });
    }

    return doc.output('blob') as Blob;
  };

  return (
    <div className="app-shell bg-[#161616] text-[#f4f4f4] font-sans flex flex-col relative">
      {/* HEADER — IBM Carbon */}
      <header className="shrink-0 w-full bg-[#161616] border-b border-[#393939] z-20 relative" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="shell-container h-14 sm:h-16 flex items-center justify-between">
        <button
          type="button"
          onClick={nuevoAnalisis}
          className="flex items-center gap-3 min-w-0 hover:opacity-90 transition-opacity"
          aria-label="Volver al inicio"
        >
          {/* Logo oficial (trazo, SIN fondo) para integrarse con el negro de la app */}
          <svg viewBox="0 0 640 180" className="h-9 sm:h-11 w-auto shrink-0" role="img" aria-label="TeoDoc">
            <g transform="translate(90,90)">
              <rect x="-58" y="-40" width="116" height="80" fill="none" stroke="#f4f4f4" strokeWidth="4" />
              <circle cx="-58" cy="0" r="12" fill="none" stroke="#f4f4f4" strokeWidth="4" />
              <circle cx="58" cy="0" r="12" fill="none" stroke="#f4f4f4" strokeWidth="4" />
              <rect x="-44" y="-20" width="58" height="6" fill="#f4f4f4" />
              <rect x="-44" y="-4" width="58" height="6" fill="#f4f4f4" />
              <rect x="-44" y="12" width="34" height="6" fill="#f4f4f4" />
              <rect x="22" y="-24" width="5" height="12" fill="#f4f4f4" />
              <rect x="32" y="-30" width="5" height="24" fill="#f4f4f4" />
              <rect x="42" y="-20" width="5" height="12" fill="#f4f4f4" />
            </g>
            <text x="185" y="105" fontSize="56" fontWeight="600" fill="#f4f4f4" fontFamily="var(--font-plex), sans-serif">
              Teo<tspan fill="#78a9ff">Doc</tspan>
            </text>
          </svg>
        </button>

        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <button
            onClick={() => setShowFeedbackModal(true)}
            className="h-8 px-2 sm:px-3 inline-flex items-center text-sm text-[#f4f4f4] hover:bg-[#353535] transition-colors whitespace-nowrap"
          >
            Sugerencias
          </button>
          <a
            href="https://www.paypal.com/ncp/payment/ZTLTVMRR95J2C"
            target="_blank"
            rel="noopener noreferrer"
            className="h-8 px-3 sm:px-4 inline-flex items-center text-sm font-medium text-white bg-[#0f62fe] hover:bg-[#0353e9] transition-colors whitespace-nowrap"
          >
            Apoyar
          </a>
        </div>
        </div>
      </header>

      <main className="app-content w-full z-10">
        <div className="shell-container flex flex-col items-center justify-start py-4 sm:py-6">
        {/* HERO — Carbon (se oculta durante el análisis para dar espacio) */}
        {!loading && !resultado && (
          <div className="text-center mb-5 sm:mb-8">
            <h1 className="text-fluid-hero font-light text-[#f4f4f4]">TeoDoc</h1>
            <h2 className="text-fluid-sub mt-3 font-normal text-[#c6c6c6]">Analiza tus mensajes.</h2>
            <p className="text-fluid-body mt-4 text-[#a8a8a8] max-w-xl mx-auto">
              Transcripción y extracción de estructura teológica impulsada por IA.
            </p>
          </div>
        )}

        {/* SELECTOR DE FUENTE — oculto hasta encontrar vía open source viable */}
        {YOUTUBE_ENABLED && !loading && !resultado && (
          <div
            className="mb-5 inline-flex border border-[#393939] bg-[#262626] p-1 z-20 relative"
            role="tablist"
            aria-label="Fuente del análisis"
          >
            <button
              role="tab"
              aria-selected={modo === 'audio'}
              onClick={() => { setModo('audio'); setAvisoYoutube(null); }}
              className={`px-4 h-9 text-sm font-medium transition-colors ${modo === 'audio' ? 'bg-[#0f62fe] text-white' : 'text-[#c6c6c6] hover:bg-[#353535]'}`}
            >
              Subir audio
            </button>
            <button
              role="tab"
              aria-selected={modo === 'youtube'}
              onClick={() => { setModo('youtube'); setError(null); setAvisoAudio(null); }}
              className={`px-4 h-9 text-sm font-medium transition-colors ${modo === 'youtube' ? 'bg-[#0f62fe] text-white' : 'text-[#c6c6c6] hover:bg-[#353535]'}`}
            >
              Analizar desde YouTube
            </button>
          </div>
        )}

        {/* ORBE — audio local, o procesamiento en curso (cualquier fuente) */}
        {!resultado && (modoActivo === 'audio' || loading) && (
          <div className="z-20 relative">
            <LiquidOrb
              ref={orbRef}
              state={loading ? 'thinking' : (error || avisoAudio) ? 'error' : 'idle'}
              progress={progress}
              disabled={loading}
              onFile={procesarArchivo}
            />
          </div>
        )}

        {/* ENTRADA YOUTUBE — oculta; el resto del flujo es igual */}
        {YOUTUBE_ENABLED && !resultado && !loading && modo === 'youtube' && (
          <form
            onSubmit={(e) => { e.preventDefault(); analizarDesdeYouTube(); }}
            className="z-20 relative w-full max-w-lg flex flex-col items-center gap-3 animate-fade-in"
          >
            <label htmlFor="yt-url" className="text-sm text-[#c6c6c6] text-center">
              Pega el enlace del mensaje o enseñanza de YouTube
            </label>
            <input
              id="yt-url"
              type="text"
              inputMode="url"
              autoComplete="off"
              spellCheck={false}
              value={youtubeUrl}
              onChange={(e) => { setYoutubeUrl(e.target.value); if (avisoYoutube) setAvisoYoutube(null); }}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full h-11 px-4 bg-[#262626] border border-[#393939] focus:border-[#0f62fe] outline-none text-[#f4f4f4] text-sm placeholder:text-[#6f6f6f]"
            />
            <button
              type="submit"
              disabled={!youtubeUrl.trim()}
              className="h-10 px-6 text-sm font-medium text-white bg-[#0f62fe] hover:bg-[#0353e9] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Analizar video
            </button>
          </form>
        )}

        {/* BARRA DE PROGRESO — IBM Carbon */}
        {loading && (
          <div className="mt-5 sm:mt-6 w-full max-w-md">
            <div className="mb-2 flex items-center gap-2" aria-live="polite">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0f62fe] animate-pulse" aria-hidden="true" />
              <span className="text-xs text-[#c6c6c6]">{mensajeAnalisis}</span>
            </div>
            <div
              className="cds-progressbar__track"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progress}
              aria-label="Progreso del análisis"
            >
              <div className="cds-progressbar__bar" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {/* CARRUSEL DE VERSÍCULOS — promesas bíblicas */}
        {loading && (
          <div className="mt-5 sm:mt-6 w-full max-w-lg">
            <div key={versoIndex} className="verse-fade border-l-2 border-[#0f62fe] pl-4">
              <p className="text-sm sm:text-base italic text-[#e0e0e0] leading-snug">“{promesasBiblicas[versoIndex].texto}”</p>
              <p className="mt-1.5 text-xs font-semibold uppercase tracking-wider text-[#78a9ff]">{promesasBiblicas[versoIndex].cita}</p>
            </div>
          </div>
        )}

        {/* AVISO — Carbon inline notification */}
        {!loading && !resultado && error && (
          <div className="mt-8 w-full max-w-md border border-[#393939] bg-[#262626] p-4 text-sm text-[#f4f4f4] shadow-sm">
            <div className="flex items-center gap-2 mb-1.5 text-[#78a9ff]">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-semibold text-sm text-[#f4f4f4]">Un momento</span>
            </div>
            <p className="text-[#c6c6c6]">{error}</p>
            {textoPendiente && (
              <button
                onClick={reintentarAnalisis}
                className="mt-3 h-10 px-5 text-sm font-medium text-white bg-[#0f62fe] hover:bg-[#0353e9] transition-colors"
              >
                Reintentar
              </button>
            )}
          </div>
        )}

        {/* AUDIO NO VÁLIDO — mensaje humano y acción para reintentar */}
        {!loading && !resultado && avisoAudio && (
          <div className="mt-8 w-full max-w-lg border border-[#f1c21b]/40 bg-[#262626] p-5 text-sm text-[#f4f4f4] animate-fade-in shadow-sm">
            <div className="flex items-center gap-2 mb-2 text-[#f1c21b]">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="font-semibold text-sm text-[#f4f4f4]">Aún no podemos analizar este contenido</span>
            </div>
            <p className="text-[#c6c6c6] leading-relaxed">
              {avisoAudio === 'no_relacionado'
                ? 'Parece que el contenido trata un tema diferente al propósito de TeoDoc.'
                : 'Parece que este contenido no tiene suficiente información para realizar un análisis significativo. Puede ser muy corto, silencio o audio accidental.'}
            </p>
            <p className="text-[#c6c6c6] leading-relaxed mt-2">
              Te invitamos a subir un mensaje, enseñanza, conferencia o contenido relacionado con la fe cristiana evangélica para poder ayudarte con el análisis.
            </p>
            <button
              onClick={reintentarAudio}
              className="mt-4 h-10 px-5 text-sm font-medium text-white bg-[#0f62fe] hover:bg-[#0353e9] transition-colors"
            >
              Subir otro audio
            </button>
          </div>
        )}

        {/* YOUTUBE NO DISPONIBLE — oculto junto con la entrada por enlace */}
        {YOUTUBE_ENABLED && !loading && !resultado && avisoYoutube && (
          <div className="mt-8 w-full max-w-lg border border-[#f1c21b]/40 bg-[#262626] p-5 text-sm text-[#f4f4f4] animate-fade-in shadow-sm">
            <div className="flex items-center gap-2 mb-2 text-[#f1c21b]">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="font-semibold text-sm text-[#f4f4f4]">No pudimos usar ese enlace</span>
            </div>
            <p className="text-[#c6c6c6] leading-relaxed">{avisoYoutube}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => { setAvisoYoutube(null); setModo('audio'); }}
                className="h-10 px-5 text-sm font-medium text-white bg-[#0f62fe] hover:bg-[#0353e9] transition-colors"
              >
                Subir audio
              </button>
              <button
                onClick={() => setAvisoYoutube(null)}
                className="h-10 px-5 text-sm font-medium text-[#f4f4f4] border border-[#6f6f6f] hover:bg-[#353535] transition-colors"
              >
                Intentar con otro enlace
              </button>
            </div>
          </div>
        )}

        {/* CONTENEDOR DE RESULTADOS */}
        {resultado && (
          <div className="w-full mt-6 md:mt-10 mb-12 sm:mb-16 space-y-10 sm:space-y-16 animate-fade-in z-20 relative">
            <div className="bg-[#262626] border border-[#393939] overflow-hidden">
              <div className="p-6 sm:p-8 md:p-12 border-b border-[#393939] relative overflow-hidden">

                <div className="flex flex-col md:flex-row justify-between items-center md:items-start mb-8 sm:mb-10 gap-5 relative z-10">
                  <div className="flex flex-col items-center md:items-start text-center md:text-left">
                    <span className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-white bg-[#002d9c] px-3 py-1.5 mb-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#a6c8ff]" aria-hidden="true" />
                      Análisis completo
                    </span>
                    <span className="text-[#a8a8a8] text-sm font-normal">Estructura teológica extraída.</span>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row flex-wrap justify-center md:justify-end gap-2 w-full md:w-auto">
                    <button onClick={nuevoAnalisis} className="h-10 w-full sm:w-auto justify-center px-5 text-sm font-medium text-[#f4f4f4] border border-[#6f6f6f] hover:bg-[#353535] transition-colors flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                      Nuevo
                    </button>
                    <button
                      type="button"
                      onClick={generarPDF}
                      disabled={generandoPDF}
                      aria-busy={generandoPDF}
                      style={{ touchAction: 'manipulation' }}
                      className="h-11 w-full sm:w-auto justify-center px-5 text-sm font-medium text-[#f4f4f4] border border-[#6f6f6f] hover:bg-[#353535] active:bg-[#0043ce] transition-colors flex items-center gap-2 disabled:opacity-60 disabled:cursor-wait select-none"
                    >
                      {generandoPDF ? (
                        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4-4m0 0l-4-4m4 4V4"></path></svg>
                      )}
                      {generandoPDF ? 'Generando PDF…' : 'Descargar PDF'}
                    </button>
                  </div>
                </div>

                <div className="text-center relative z-10 max-w-4xl mx-auto">
                  <h2 className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-[#ffffff] mb-5 leading-[1.08] tracking-tight">
                    {resultado.titulo}
                  </h2>
                  <div className="w-20 h-1 bg-[#0f62fe] mx-auto mb-6 rounded-full" />
                  {resultado.idea_principal ? (
                    <div className="text-left bg-[#1f1f1f]/90 border border-[#393939] p-5 sm:p-6 shadow-sm relative">
                      <div className="inline-flex items-center gap-2 px-3 py-1 mb-2.5 bg-[#0f62fe]/10 border border-[#0f62fe]/30 text-xs font-mono text-[#78a9ff] font-semibold tracking-wider uppercase whitespace-nowrap">
                        Idea Central del Mensaje
                      </div>
                      <p className="text-[#f4f4f4] text-base sm:text-lg md:text-xl italic font-normal leading-relaxed">
                        "{resultado.idea_principal}"
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>
              
              <div className="p-6 sm:p-8 md:p-12 space-y-10 sm:space-y-16">
                <section>
                  <h3 className="text-sm font-semibold text-[#f4f4f4] mb-6 sm:mb-8 uppercase tracking-wider flex items-center gap-2.5">
                    <span className="w-1.5 h-4 bg-[#0f62fe] inline-block" aria-hidden="true" />
                    Desarrollo Bíblico
                  </h3>
                  
                  <div className="grid gap-5 sm:gap-6">
                    {resultado.desarrollo_progresivo.map((item, idx) => (
                      <div key={idx} className="bg-[#262626] p-5 sm:p-6 md:p-8 border border-[#393939] hover:border-[#525252] transition-colors">
                        <div className="flex gap-3 sm:gap-4 items-start mb-4">
                          <span className="text-[#78a9ff] bg-[#0f62fe]/15 border border-[#0f62fe]/40 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 text-sm font-semibold mt-0.5">{idx + 1}</span>
                          <h4 className="text-lg sm:text-xl font-semibold text-[#f4f4f4] pt-1 sm:pt-1.5 leading-tight">{item.punto}</h4>
                        </div>
                        <div className="pl-11 sm:pl-14">
                          <p className="text-[#c6c6c6] mb-5 leading-relaxed font-normal text-sm sm:text-base">{item.explicacion}</p>
                          {item.subtemas && item.subtemas.length > 0 && (
                            <div className="grid gap-3 mb-5">
                              {item.subtemas.map((s, sIdx) => (
                                <div key={sIdx} className="border-l-2 border-[#525252] pl-4">
                                  <p className="text-sm font-semibold text-[#f4f4f4] mb-1">{s.titulo}</p>
                                  {s.desarrollo ? <p className="text-xs sm:text-sm text-[#a8a8a8] leading-relaxed font-normal">{s.desarrollo}</p> : null}
                                </div>
                              ))}
                            </div>
                          )}
                          {item.versiculos.length > 0 && (
                            <div className="grid gap-3">
                              {item.versiculos.map((v, vIdx) => (
                                <div key={vIdx} className="bg-[#1f1f1f] p-4 border-l-2 border-[#0f62fe] mb-5">
                                  <p className="text-xs sm:text-sm font-semibold text-[#78a9ff] mb-1.5">{v.cita}</p>
                                  <p className="text-xs sm:text-sm text-[#a8a8a8] italic font-normal leading-relaxed">"{v.texto}"</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <div className="grid md:grid-cols-2 gap-5 sm:gap-6">
                  <section className="bg-[#262626] p-6 sm:p-8 border border-[#393939]">
                    <h3 className="text-sm font-semibold text-[#f4f4f4] mb-5 sm:mb-6 uppercase tracking-wider flex items-center gap-2">
                      <svg className="w-5 h-5 shrink-0 text-[#78a9ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
                      Aplicación Práctica
                    </h3>
                    <ul className="space-y-4">
                      {resultado.aplicacion.map((app, idx) => (
                        <li key={idx} className="flex gap-3 text-[#c6c6c6] font-normal leading-relaxed text-sm sm:text-base">
                          <span className="text-[#0f62fe] mt-1 leading-none">—</span>
                          <span>{app}</span>
                        </li>
                      ))}
                    </ul>
                  </section>

                  <section className="bg-[#262626] p-6 sm:p-8 border border-[#393939]">
                    <h3 className="text-sm font-semibold text-[#f4f4f4] mb-5 sm:mb-6 uppercase tracking-wider flex items-center gap-2">
                      <svg className="w-5 h-5 shrink-0 text-[#78a9ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
                      Oración
                    </h3>
                    <p className="text-[#c6c6c6] italic leading-relaxed font-normal text-sm sm:text-base">"{resultado.oracion}"</p>
                  </section>
                </div>

                {resultado.conclusion ? (
                  <section className="bg-[#262626] p-6 sm:p-8 border border-[#393939]">
                    <h3 className="text-sm font-semibold text-[#f4f4f4] mb-5 sm:mb-6 uppercase tracking-wider flex items-center gap-2.5">
                      <span className="w-1.5 h-4 bg-[#0f62fe] inline-block" aria-hidden="true" />
                      Conclusión del estudio
                    </h3>
                    <p className="text-[#c6c6c6] leading-relaxed font-normal text-sm sm:text-base">{resultado.conclusion}</p>
                  </section>
                ) : null}
              </div>
            </div>

            {/* Composición narrativa · Visualización dual (Oscura y Clara) · Export PNG de alta definición */}
            <div className="w-full pt-8 sm:pt-12">
              <div className="text-center mb-8 px-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#0f62fe]/10 border border-[#0f62fe]/30 rounded text-xs font-mono font-semibold tracking-widest text-[#78a9ff] uppercase mb-3 whitespace-nowrap">
                  // INFOGRAFÍA EDITORIAL 9:16 (1080×1920)
                </div>
                <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#ffffff] tracking-tight">
                  Infografías del análisis
                </h3>
                <p className="text-xs sm:text-sm text-[#a8a8a8] mt-2 max-w-xl mx-auto">
                  El mapa visual y teológico del mensaje en dos estilos de diseño: versión oscura y versión clara editorial, optimizadas para redes sociales, proyección y estudio.
                </p>
                <div className="flex flex-wrap justify-center gap-3 mt-5">
                  <button
                    type="button"
                    onClick={() => descargarInfografia('ambos')}
                    disabled={descargando}
                    style={{ touchAction: 'manipulation' }}
                    className="h-11 px-6 text-xs sm:text-sm font-semibold text-white bg-[#0f62fe] hover:bg-[#0353e9] active:bg-[#0043ce] transition-colors disabled:opacity-60 disabled:cursor-wait select-none flex items-center gap-2 shadow-md"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4-4m0 0l-4-4m4 4V4" /></svg>
                    {descargandoTema === 'ambos' ? 'Generando ambas…' : 'Descargar ambas versiones'}
                  </button>
                </div>
              </div>

              {/* Grid con las 2 imágenes mostradas en pantalla con sus controles directos */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-[1240px] mx-auto px-2 sm:px-4">
                {/* 1. VERSIÓN OSCURA (OBSIDIANA) */}
                <div className="flex flex-col items-center bg-[#1c1c1c] border border-[#333333] p-4 sm:p-6 rounded-lg">
                  <div className="w-full flex items-center justify-between pb-3 mb-4 border-b border-[#333333]">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#0f62fe]" />
                      <h4 className="text-sm sm:text-base font-bold text-[#ffffff] tracking-wide">
                        Versión Oscura
                      </h4>
                      <span className="text-xs font-mono uppercase px-2 py-0.5 bg-[#0f62fe]/20 text-[#78a9ff] border border-[#0f62fe]/40 rounded">
                        Obsidiana
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => descargarInfografia('oscuro')}
                      disabled={descargando}
                      style={{ touchAction: 'manipulation' }}
                      className="h-9 px-4 text-xs font-semibold text-white bg-[#0f62fe] hover:bg-[#0353e9] active:bg-[#0043ce] transition-colors disabled:opacity-60 disabled:cursor-wait select-none flex items-center gap-1.5"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4-4m0 0l-4-4m4 4V4" /></svg>
                      {descargandoTema === 'oscuro' ? 'Generando…' : 'Descargar PNG'}
                    </button>
                  </div>
                  <div className="w-full max-w-[480px]">
                    <ResponsiveInfografia data={resultado} tema="oscuro" />
                  </div>
                  <button
                    type="button"
                    onClick={() => descargarInfografia('oscuro')}
                    disabled={descargando}
                    style={{ touchAction: 'manipulation' }}
                    className="w-full mt-4 h-10 px-4 text-xs font-semibold text-white bg-[#262626] hover:bg-[#333333] border border-[#444444] transition-colors disabled:opacity-60 disabled:cursor-wait select-none flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4 text-[#78a9ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4-4m0 0l-4-4m4 4V4" /></svg>
                    {descargandoTema === 'oscuro' ? 'Generando PNG…' : 'Descargar Infografía Oscura (1080×1920)'}
                  </button>
                </div>

                {/* 2. VERSIÓN CLARA (EDITORIAL) */}
                <div className="flex flex-col items-center bg-[#1c1c1c] border border-[#333333] p-4 sm:p-6 rounded-lg">
                  <div className="w-full flex items-center justify-between pb-3 mb-4 border-b border-[#333333]">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#ffffff]" />
                      <h4 className="text-sm sm:text-base font-bold text-[#ffffff] tracking-wide">
                        Versión Clara
                      </h4>
                      <span className="text-xs font-mono uppercase px-2 py-0.5 bg-white/10 text-white border border-white/20 rounded">
                        Editorial Blanco
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => descargarInfografia('claro')}
                      disabled={descargando}
                      style={{ touchAction: 'manipulation' }}
                      className="h-9 px-4 text-xs font-semibold text-[#111827] bg-[#ffffff] hover:bg-[#f3f4f6] active:bg-[#e5e7eb] transition-colors disabled:opacity-60 disabled:cursor-wait select-none flex items-center gap-1.5"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4-4m0 0l-4-4m4 4V4" /></svg>
                      {descargandoTema === 'claro' ? 'Generando…' : 'Descargar PNG'}
                    </button>
                  </div>
                  <div className="w-full max-w-[480px]">
                    <ResponsiveInfografia data={resultado} tema="claro" />
                  </div>
                  <button
                    type="button"
                    onClick={() => descargarInfografia('claro')}
                    disabled={descargando}
                    style={{ touchAction: 'manipulation' }}
                    className="w-full mt-4 h-10 px-4 text-xs font-semibold text-[#111827] bg-[#ffffff] hover:bg-[#f3f4f6] border border-[#e5e7eb] transition-colors disabled:opacity-60 disabled:cursor-wait select-none flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4 text-[#0f62fe]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4-4m0 0l-4-4m4 4V4" /></svg>
                    {descargandoTema === 'claro' ? 'Generando PNG…' : 'Descargar Infografía Clara (1080×1920)'}
                  </button>
                </div>
              </div>

              {/* Artboards OCULTOS para exportar el PNG en resolución real (1080×1920) */}
              <div aria-hidden="true" style={{ position: 'fixed', left: -9999, top: 0, width: CANVAS_W, height: CANVAS_H * 2, overflow: 'hidden' }}>
                <div ref={infografiaOscuraRef} style={{ width: CANVAS_W, height: CANVAS_H }}>
                  <Infografia data={resultado} tema="oscuro" />
                </div>
                <div ref={infografiaClaraRef} style={{ width: CANVAS_W, height: CANVAS_H }}>
                  <Infografia data={resultado} tema="claro" />
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
      </main>

      {/* MODAL DE SUGERENCIAS */}
      {showFeedbackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-[#262626] border border-[#393939] p-6 sm:p-8 w-full max-w-md relative max-h-[90dvh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6 relative z-10">
              <h3 className="text-lg font-semibold text-[#f4f4f4]">Enviar sugerencia</h3>
              <button onClick={() => setShowFeedbackModal(false)} className="text-[#c6c6c6] hover:text-[#f4f4f4] hover:bg-[#353535] p-2 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            {feedbackStatus === 'success' ? (
              <div className="text-[#78a9ff] text-center py-10 font-medium text-base">
                ¡Gracias! Tu mensaje ha sido enviado.
              </div>
            ) : (
              <form onSubmit={enviarSugerencia} className="flex flex-col gap-5 relative z-10">
                <textarea
                  required
                  value={feedbackMsg}
                  onChange={(e) => setFeedbackMsg(e.target.value)}
                  placeholder="Escribe tu sugerencia o reporte aquí..."
                  className="w-full bg-[#161616] border border-[#525252] p-4 text-sm text-[#f4f4f4] placeholder:text-[#6f6f6f] focus:outline-none focus:border-[#0f62fe] min-h-[120px] resize-none"
                ></textarea>
                {feedbackStatus === 'error' && <p className="text-[#fa4d56] text-xs font-normal">No se pudo enviar. Inténtalo de nuevo.</p>}
                <button
                  type="submit"
                  disabled={feedbackStatus === 'sending'}
                  className="w-full bg-[#0f62fe] hover:bg-[#0353e9] text-white font-medium py-3 text-sm transition-colors disabled:opacity-50"
                >
                  {feedbackStatus === 'sending' ? 'Enviando…' : 'Enviar mensaje'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* VISOR MODAL EN PANTALLA (PREVIEW IN-APP SIN ABRIR NUEVAS PESTAÑAS) */}
      {previewArchivo && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/85 backdrop-blur-sm p-2 sm:p-4">
          <div className="bg-[#1e1e1e] border border-[#393939] rounded-xl w-full max-w-2xl max-h-[94dvh] flex flex-col overflow-hidden shadow-2xl">
            {/* Barra superior */}
            <div className="flex items-center justify-between px-3.5 py-2.5 sm:px-4 sm:py-3 border-b border-[#333333] bg-[#161616] shrink-0">
              <div className="flex items-center gap-2 min-w-0 pr-2">
                <span className="shrink-0 px-2 py-0.5 text-xs font-bold rounded bg-[#0f62fe] text-white uppercase tracking-wider">
                  {previewArchivo.tipo === 'pdf' ? 'PDF' : 'Infografía 9:16'}
                </span>
                <p className="text-xs font-medium text-[#f4f4f4] truncate">{previewArchivo.nombre}</p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewArchivo(null)}
                aria-label="Cerrar vista previa"
                className="text-[#a8a8a8] hover:text-white hover:bg-[#262626] p-1.5 rounded transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            {/* Contenido visor */}
            <div className="flex-1 min-h-0 min-w-0 overflow-y-auto p-2 sm:p-4 flex flex-col items-center justify-center bg-[#0d1117]">
              {previewArchivo.tipo === 'png' ? (
                <div className="w-full flex-1 flex flex-col items-center justify-center min-h-0 min-w-0 py-1">
                  <div className="relative flex items-center justify-center w-full max-w-[340px] sm:max-w-[420px]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={previewArchivo.url}
                      alt={previewArchivo.nombre}
                      style={{
                        maxHeight: 'min(58dvh, 520px)',
                        maxWidth: '100%',
                        width: 'auto',
                        height: 'auto',
                        objectFit: 'contain',
                      }}
                      className="rounded-lg shadow-[0_12px_36px_rgba(0,0,0,0.8)] border border-[#30363d] select-none pointer-events-auto"
                    />
                  </div>
                  <p className="mt-2.5 text-xs text-[#8d8d8d] text-center px-2">
                    💡 Tip: Mantén presionada la imagen para guardarla en tu galería de Fotos.
                  </p>
                </div>
              ) : (
                <div className="w-full flex-1 flex flex-col items-center justify-center min-h-0 min-w-0 py-1">
                  <div className="w-full flex-1 min-h-[320px] max-h-[64dvh] rounded-lg overflow-hidden border border-[#393939] bg-white shadow-xl">
                    <iframe
                      src={`${previewArchivo.url}#toolbar=0&navpanes=0&view=FitH`}
                      style={{ width: '100%', height: '100%', border: 'none' }}
                      className="w-full h-full min-h-[320px] bg-white"
                      title={previewArchivo.nombre}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Barra de acciones inferior */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 sm:px-4 sm:py-3 bg-[#161616] border-t border-[#333333] shrink-0">
              <div className="flex flex-wrap items-center gap-2">
                {puedeCompartir ? (
                  <button
                    type="button"
                    onClick={() => compartirArchivo(previewArchivo)}
                    className="inline-flex items-center gap-1.5 h-8 sm:h-9 rounded-lg border border-[#0f62fe] bg-[#0f62fe]/10 px-3 text-xs font-semibold text-[#78a9ff] transition-colors hover:bg-[#0f62fe]/20"
                  >
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                    Guardar / Compartir
                  </button>
                ) : null}
                <a
                  href={previewArchivo.url}
                  download={previewArchivo.nombre}
                  className="inline-flex items-center gap-1.5 h-8 sm:h-9 rounded-lg border border-[#525252] px-3 text-xs font-semibold text-[#f4f4f4] transition-colors hover:bg-[#262626]"
                >
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#78a9ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4-4m0 0l-4-4m4 4V4" /></svg>
                  Descargar
                </a>
              </div>
              <button
                type="button"
                onClick={() => setPreviewArchivo(null)}
                className="h-8 sm:h-9 px-3 text-xs font-medium text-[#c6c6c6] hover:text-white transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AVISO DE DESCARGA — notificación auto-descartable y con cierre manual */}
      {avisoDescarga && resultado && (
        <div className="fixed inset-x-0 bottom-4 z-[70] flex justify-center px-4 pointer-events-none">
          <div
            className="pointer-events-auto relative w-full max-w-md rounded-xl bg-white border border-[#e0e0e0] shadow-[0_16px_40px_rgba(0,0,0,0.6)] px-4 py-3"
            onMouseEnter={() => {
              if (avisoAutoCerrarTimerRef.current) {
                clearTimeout(avisoAutoCerrarTimerRef.current);
                avisoAutoCerrarTimerRef.current = null;
              }
            }}
            onMouseLeave={() => {
              if (avisoDescarga.estado === 'listo' || avisoDescarga.estado === 'error') {
                if (avisoAutoCerrarTimerRef.current) clearTimeout(avisoAutoCerrarTimerRef.current);
                avisoAutoCerrarTimerRef.current = setTimeout(() => setAvisoDescarga(null), 15000);
              }
            }}
            onTouchStart={(e) => {
              if (avisoAutoCerrarTimerRef.current) {
                clearTimeout(avisoAutoCerrarTimerRef.current);
                avisoAutoCerrarTimerRef.current = null;
              }
              touchXRef.current = e.touches[0]?.clientX ?? null;
            }}
            onTouchMove={(e) => {
              if (touchXRef.current == null) return;
              const dx = (e.touches[0]?.clientX ?? touchXRef.current) - touchXRef.current;
              if (Math.abs(dx) > 60) { touchXRef.current = null; setAvisoDescarga(null); }
            }}
            onTouchEnd={() => {
              touchXRef.current = null;
              if (avisoDescarga.estado === 'listo' || avisoDescarga.estado === 'error') {
                if (avisoAutoCerrarTimerRef.current) clearTimeout(avisoAutoCerrarTimerRef.current);
                avisoAutoCerrarTimerRef.current = setTimeout(() => setAvisoDescarga(null), 15000);
              }
            }}
          >
            {/* Cerrar con X (siempre disponible) */}
            <button
              type="button"
              onClick={() => setAvisoDescarga(null)}
              aria-label="Cerrar aviso"
              className="absolute right-1.5 top-1.5 inline-flex h-7 w-7 items-center justify-center rounded text-[#525252] transition-colors hover:bg-[#f4f4f4] hover:text-[#161616]"
            >
              <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true"><path d="M8 6.6 11.3 3.3l1.4 1.4L9.4 8l3.3 3.3-1.4 1.4L8 9.4l-3.3 3.3-1.4-1.4L6.6 8 3.3 4.7l1.4-1.4z" /></svg>
            </button>

            {avisoDescarga.estado === 'generando' && (
              <>
                <div className="flex items-center gap-2 pr-6 text-sm text-[#161616]">
                  <svg className="h-4 w-4 animate-spin text-[#0f62fe]" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  <span className="font-semibold">{avisoDescarga.tipo === 'pdf' ? 'Generando PDF…' : 'Generando infografía…'}</span>
                  <span className="ml-auto tabular-nums font-bold text-[#0f62fe]">{avisoDescarga.progreso}%</span>
                </div>
                <div className="mt-2 h-1.5 w-full rounded-full bg-[#e0e0e0]">
                  <div className="h-full rounded-full bg-[#0f62fe] transition-[width] duration-150" style={{ width: `${avisoDescarga.progreso}%` }} />
                </div>
              </>
            )}

            {avisoDescarga.estado === 'listo' && (
              <div className="pr-6">
                <div className="flex items-center gap-2 text-sm text-[#161616]">
                  <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#24a148] text-white" aria-hidden="true">
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7" /></svg>
                  </span>
                  <span className="font-semibold">¡Archivo generado con éxito!</span>
                  <span className="ml-auto text-xs text-[#525252]">100%</span>
                </div>
                {ultimoArchivo ? <p className="mt-1 truncate text-xs text-[#525252]">{ultimoArchivo.nombre}</p> : null}
                {ultimoArchivo ? (
                  <div className="mt-2.5 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPreviewArchivo(ultimoArchivo)}
                      className="inline-flex h-8 items-center gap-1.5 rounded-md bg-[#0f62fe] px-3 text-xs font-semibold text-white transition-colors hover:bg-[#0353e9]"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      Ver
                    </button>
                    {puedeCompartir ? (
                      <button
                        type="button"
                        onClick={() => compartirArchivo(ultimoArchivo)}
                        className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[#8d8d8d] px-3 text-xs font-semibold text-[#161616] transition-colors hover:bg-[#f4f4f4]"
                      >
                        <svg className="w-3.5 h-3.5 text-[#0f62fe]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                        Guardar / Compartir
                      </button>
                    ) : null}
                    <a
                      href={ultimoArchivo.url}
                      download={ultimoArchivo.nombre}
                      className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[#8d8d8d] px-3 text-xs font-semibold text-[#161616] transition-colors hover:bg-[#f4f4f4]"
                    >
                      <svg className="w-3.5 h-3.5 text-[#525252]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4-4m0 0l-4-4m4 4V4" /></svg>
                      Descargar de nuevo
                    </a>
                  </div>
                ) : null}
                <p className="mt-2 text-xs leading-snug text-[#8d8d8d]">
                  {esIOS() ? 'Usa "Ver" para previsualizar o "Guardar / Compartir" para agregarlo a tus Fotos o Archivos.' : 'Descargado automáticamente en tu navegador. Puedes abrirlo o guardarlo de nuevo.'}
                </p>
              </div>
            )}

            {avisoDescarga.estado === 'error' && (
              <div className="flex items-center gap-2 pr-6 text-sm text-[#161616]">
                <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#da1e28] text-xs font-bold text-white" aria-hidden="true">!</span>
                <span>{avisoDescarga.mensaje || 'No se pudo generar el archivo.'}</span>
              </div>
            )}

            {/* "Cerrar" (texto) para cerrar de inmediato */}
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={() => setAvisoDescarga(null)}
                className="text-xs font-medium text-[#525252] transition-colors hover:text-[#161616] underline underline-offset-2"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VOLVER ARRIBA — discreto, estilo Carbon, solo al hacer scroll */}
      {mostrarArriba && (
        <button
          type="button"
          onClick={volverArriba}
          aria-label="Volver arriba"
          title="Volver arriba"
          style={{ touchAction: 'manipulation' }}
          className="fixed bottom-24 right-4 z-[65] inline-flex h-10 w-10 select-none items-center justify-center border border-[#393939] bg-[#262626] text-[#f4f4f4] shadow-[0_8px_20px_rgba(0,0,0,0.45)] transition-colors hover:bg-[#353535] active:bg-[#0043ce] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f62fe]"
        >
          <svg className="h-5 w-5" viewBox="0 0 32 32" fill="currentColor" aria-hidden="true">
            <path d="M16 4 6 14l1.4 1.4L15 7.8V28h2V7.8l7.6 7.6L26 14z" />
          </svg>
        </button>
      )}

      {/* FOOTER PERFECTAMENTE VISIBLE Y ELEVADO */}
      <footer className="shrink-0 w-full border-t border-[#393939] bg-[#161616] z-20">
        <div className="shell-container shell-safe-bottom flex flex-col items-center justify-center pt-6 text-xs text-[#a8a8a8] font-normal tracking-wide gap-1">
          <p className="text-[#c6c6c6]">Versión 1.1 Beta</p>
          <p>Desarrollado por Mauricio Andrade Luna</p>
        </div>
      </footer>
    </div>
  );
}