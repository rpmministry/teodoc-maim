'use client';
import { useState, useRef, useEffect } from 'react';
import LiquidOrb from '@/components/liquid-orb';

interface Versiculo { cita: string; texto: string; }
interface PuntoDesarrollo { punto: string; explicacion: string; versiculos: Versiculo[]; }
interface DatosInfografia { frase_corta: string; texto_clave: string; contexto_breve: string; }
interface PredicaAnalisis {
  titulo: string; idea_principal: string;
  infografia?: DatosInfografia;
  desarrollo_progresivo: PuntoDesarrollo[];
  aplicacion: string[]; oracion: string;
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

// --- Infografía: iconografía dibujada a mano (trazo de tinta + acento azul) ---
const ICON = { fill: 'none', stroke: '#161616', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

const IcoCross = (
  <svg width="22" height="22" viewBox="0 0 24 24" {...ICON}><path d="M12 3.5v17M6.5 9h11" /></svg>
);
const IcoBible = (
  <svg width="24" height="24" viewBox="0 0 24 24" {...ICON}>
    <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H19v15H6.5A2.5 2.5 0 0 0 4 20.5z" />
    <path d="M4 5.5v15" stroke="#0F62FE" />
    <path d="M11.5 7v5M9 9.5h5" />
  </svg>
);
const IcoScroll = (
  <svg width="24" height="24" viewBox="0 0 24 24" {...ICON}>
    <path d="M6 4h11a2 2 0 0 1 2 2v12H8a2 2 0 0 0-2 2z" />
    <path d="M6 4a2 2 0 0 0-2 2v1h2" stroke="#0F62FE" />
    <path d="M9 9h7M9 12h7" />
  </svg>
);
const IcoLamp = (
  <svg width="24" height="24" viewBox="0 0 24 24" {...ICON}>
    <path d="M9 18h6M10 21h4" />
    <path d="M12 3a6 6 0 0 0-3.5 10.9c.7.5 1 1.2 1 2.1h5c0-.9.3-1.6 1-2.1A6 6 0 0 0 12 3z" />
    <path d="M12 11v1.5" stroke="#0F62FE" />
  </svg>
);
const IcoPath = (
  <svg width="24" height="24" viewBox="0 0 24 24" {...ICON}>
    <path d="M5 19c6 0 4-7 9-7s5-5 5-9" />
    <circle cx="5" cy="19" r="1.6" stroke="#0F62FE" />
    <path d="M19 3l-2.2 3h4.4z" fill="#0F62FE" stroke="none" />
  </svg>
);
const IcoSeed = (
  <svg width="24" height="24" viewBox="0 0 24 24" {...ICON}>
    <path d="M12 21c0-6 3-10 8-11-1 6-4 10-8 11z" stroke="#0F62FE" />
    <path d="M12 21c0-6-3-10-8-11 1 6 4 10 8 11z" />
    <path d="M12 21v-6" />
  </svg>
);
const IcoHeart = (
  <svg width="24" height="24" viewBox="0 0 24 24" {...ICON}>
    <path d="M12 21c-1.6-1.3-7-5.1-7-9.3A3.9 3.9 0 0 1 12 9a3.9 3.9 0 0 1 7-2.3c0 4.2-5.4 8-7 14.3z" stroke="#0F62FE" />
  </svg>
);
const IcoPray = (
  <svg width="26" height="26" viewBox="0 0 24 24" {...ICON}>
    <path d="M12 3c1.6 2.2 2.4 4.6 2.4 8.2V19a2.4 2.4 0 0 1-4.8 0v-7.8C9.6 7.6 10.4 5.2 12 3z" />
    <path d="M12 10.5v6" stroke="#0F62FE" />
  </svg>
);
const IcoSteps = (
  <svg width="24" height="24" viewBox="0 0 24 24" {...ICON}>
    <path d="M5 19h4v-4h4v-4h4V7" />
    <path d="M14 7l2.5-2.5L19 7" stroke="#0F62FE" />
  </svg>
);
const IcoCheck = (
  <svg width="18" height="18" viewBox="0 0 24 24" style={{ flexShrink: 0, marginTop: 1 }}>
    <rect x="2.5" y="2.5" width="19" height="19" rx="4" fill="#FFFFFF" stroke="#161616" strokeWidth="2" />
    <path d="M6.5 12.5 L10.5 16.5 L17.5 7.5" fill="none" stroke="#0F62FE" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const POINT_ICONS = [IcoLamp, IcoSeed, IcoPath, IcoHeart, IcoCross];

function resumir(texto: string, max: number): string {
  const t = (texto || '').replace(/\s+/g, ' ').trim();
  return t.length > max ? `${t.slice(0, max).trimEnd()}…` : t;
}

const PANEL: React.CSSProperties = { border: '2px solid #161616', borderRadius: 10, padding: '8px 10px', background: '#FFFFFF' };
const PANEL_LABEL: React.CSSProperties = { fontSize: 9.5, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#525252', marginBottom: 3 };

function SectionTitle({ label, icon }: { label: string; icon: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 7 }}>
      <span style={{ display: 'inline-flex', alignItems: 'center' }}>{icon}</span>
      <span className="font-hand" style={{ fontSize: 25, fontWeight: 700, lineHeight: 1 }}>{label}</span>
      <span style={{ flex: 1, height: 2, background: '#0F62FE', opacity: 0.35, borderRadius: 2 }} />
    </div>
  );
}

function HandArrow() {
  return (
    <svg width="40" height="24" viewBox="0 0 40 24" style={{ display: 'block', margin: '3px auto' }}>
      <path d="M9 2 C 27 6, 27 13, 21 19" fill="none" stroke="#0F62FE" strokeWidth="3.4" strokeLinecap="round" />
      <path d="M14 15 L21 22 L28 14" fill="none" stroke="#0F62FE" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

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

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const [resultado, setResultado] = useState<PredicaAnalisis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [versoIndex, setVersoIndex] = useState(0);

  const infografiaRef = useRef<HTMLDivElement>(null);

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

  const startAnalysisPipeline = async (audioUrl: string) => {
    let timerTranscribe: ReturnType<typeof setInterval> | undefined;
    let timerAnalyze: ReturnType<typeof setInterval> | undefined;
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
      const textoTranscrito = dataTranscribe.text;
      
      setProgress(50);
      timerAnalyze = setInterval(() => {
        setProgress((prev) => prev >= 98 ? 98 : prev + Math.max(1, Math.floor((99 - prev) * 0.05)));
      }, 1000);

      const resAnalyze = await fetch('/api/analyze', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: textoTranscrito })
      });
      clearInterval(timerAnalyze); timerAnalyze = undefined;

      if (!resAnalyze.ok) {
        throw new Error('La IA tiene muchas solicitudes en este momento. Vuelve a intentarlo en unos segundos.');
      }
      const dataAnalyze = await resAnalyze.json();

      setProgress(100);
      setTimeout(() => {
        setResultado(dataAnalyze);
        setLoading(false);
      }, 500);

    } catch (err: any) {
      setError(err?.message || 'La IA tiene muchas solicitudes en este momento. Vuelve a intentarlo en unos segundos.');
      setLoading(false);
      setProgress(0);
    } finally {
      if (timerTranscribe) clearInterval(timerTranscribe);
      if (timerAnalyze) clearInterval(timerAnalyze);
    }
  };

  const nuevoAnalisis = () => {
    setResultado(null);
    setError(null);
    setProgress(0);
    setLoading(false);
  };

  const descargarInfografia = async () => {
    if (!infografiaRef.current) return;
    try {
      const { default: domtoimage } = await import('dom-to-image-more');
      const node = infografiaRef.current;
      // PNG a 2x para impresión en A4 vertical.
      const dataUrl = await domtoimage.toPng(node, {
        quality: 1,
        bgcolor: '#FFFFFF',
        width: node.offsetWidth * 2,
        height: node.offsetHeight * 2,
      });
      const link = document.createElement('a');
      link.download = `Infografia_${(resultado?.titulo || 'predica').replace(/\s+/g, '_')}.png`;
      link.href = dataUrl;
      link.click();
    } catch {
      alert('No se pudo generar la imagen.');
    }
  };

  const generarPDF = async () => {
    if (!resultado) return;
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 54; // ~19 mm
    const contentW = pageW - margin * 2;
    const bottomY = pageH - margin - 26;

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

    const listaPuntos = Array.isArray(resultado.desarrollo_progresivo) ? resultado.desarrollo_progresivo : [];
    const listaAplicaciones = Array.isArray(resultado.aplicacion) ? resultado.aplicacion : [];
    const pv = (() => {
      for (const p of listaPuntos) {
        const v = (p.versiculos || [])[0];
        if (v?.cita) return v;
      }
      return null;
    })();
    const pdfPasaje = pv?.cita || '';
    const pdfTextoPasaje = pv?.texto || resultado.infografia?.texto_clave || '';
    const pdfContexto = resultado.infografia?.contexto_breve || '';
    const fechaTxt = new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' });

    let y = 0;
    const ensure = (needed: number) => {
      if (y + needed > bottomY) { doc.addPage(); y = margin + 6; }
    };

    // ------------------ ENCABEZADO COMPACTO (masthead, mismo flujo) ------------------
    setFill(C.accent); doc.rect(0, 0, pageW, 6, 'F');
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); setText(C.sub);
    doc.text('ANÁLISIS DE PRÉDICA', margin, margin + 2);

    doc.setFont('helvetica', 'bold'); doc.setFontSize(26); setText(C.ink);
    const mastTitle = doc.splitTextToSize(resultado.titulo || 'Prédica', contentW);
    doc.text(mastTitle, margin, margin + 34);
    y = margin + 34 + mastTitle.length * 30;

    setStroke(C.accent); doc.setLineWidth(4); doc.line(margin, y, margin + 80, y);
    y += 20;

    if (resultado.idea_principal) {
      doc.setFont('helvetica', 'italic'); doc.setFontSize(12.5); setText(C.sub);
      const ideaLines = doc.splitTextToSize(`“${resumir(resultado.idea_principal, 260)}”`, contentW);
      doc.text(ideaLines, margin, y);
      y += ideaLines.length * 17 + 10;
    }

    if (pdfPasaje) {
      doc.setFont('helvetica', 'bold'); doc.setFontSize(10); setText(C.accent);
      doc.text(`Texto bíblico principal: ${pdfPasaje}`, margin, y);
      y += 16;
    }
    y += 8;

    // Título de sección que se mantiene junto al inicio de su contenido (sin huérfanos).
    const heading = (label: string, keep = 64) => {
      ensure(keep);
      setFill(C.accent); doc.rect(margin, y - 10, 3.5, 14, 'F');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(12.5); setText(C.ink);
      doc.text(label.toUpperCase(), margin + 11, y + 1);
      y += 20;
      setStroke(C.rule); doc.setLineWidth(0.6); doc.line(margin, y, pageW - margin, y);
      y += 12;
    };

    // Párrafos que FLUYEN entre páginas: llenan el espacio disponible y evitan
    // fragmentos aislados en una página nueva.
    const paragraph = (txt: string, opts?: { size?: number; lead?: number; color?: RGB; italic?: boolean; bold?: boolean; max?: number; indent?: number }) => {
      const size = opts?.size ?? 10.5;
      const lead = opts?.lead ?? 15;
      const font = opts?.italic ? 'italic' : opts?.bold ? 'bold' : 'normal';
      const indent = opts?.indent ?? 0;
      doc.setFont('helvetica', font); doc.setFontSize(size); setText(opts?.color ?? C.sub);
      const lines = doc.splitTextToSize(resumir(txt, opts?.max ?? 900), contentW - indent);
      for (const line of lines) {
        if (y + lead > bottomY) { doc.addPage(); y = margin + 6; }
        doc.text(line, margin + indent, y);
        y += lead;
      }
      y += 5;
    };

    const quoteBlock = (cita: string, texto: string) => {
      doc.setFont('helvetica', 'italic'); doc.setFontSize(9.8);
      const body = doc.splitTextToSize(`“${resumir(texto, 240)}”`, contentW - 30);
      const h = 12 + 15 + body.length * 13 + 10;
      ensure(h + 6);
      setFill(C.surface); doc.rect(margin, y - 11, contentW, h, 'F');
      setFill(C.accent); doc.rect(margin, y - 11, 3, h, 'F');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5); setText(C.accent);
      doc.text(cita || '', margin + 15, y); y += 16;
      doc.setFont('helvetica', 'italic'); doc.setFontSize(9.8); setText(C.sub);
      doc.text(body, margin + 15, y); y += body.length * 13 + 10;
    };

    const bullet = (txt: string) => {
      doc.setFont('helvetica', 'normal'); doc.setFontSize(10.5);
      const lines = doc.splitTextToSize(txt, contentW - 16);
      ensure(lines.length * 15 + 5);
      setFill(C.accent); doc.circle(margin + 3, y - 3, 1.7, 'F');
      setText(C.sub); doc.text(lines, margin + 14, y);
      y += lines.length * 15 + 6;
    };

    const metaRow = (label: string, value: string) => {
      doc.setFont('helvetica', 'normal'); doc.setFontSize(10.5);
      const lines = doc.splitTextToSize(value, contentW - 110);
      ensure(lines.length * 14 + 7);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9); setText(C.sub);
      doc.text(label.toUpperCase(), margin, y);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(10.5); setText(C.ink);
      doc.text(lines, margin + 100, y);
      y += lines.length * 14 + 7;
    };

    const chips = (items: string[]) => {
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
      const h = 20; const padX = 10; const gap = 8; let x = margin;
      ensure(h + 6);
      items.forEach((label) => {
        const txt = label.toUpperCase();
        const w = doc.getTextWidth(txt) + padX * 2;
        if (x + w > pageW - margin) { x = margin; y += h + 6; ensure(h + 6); }
        setStroke(C.accent); doc.setLineWidth(1); doc.roundedRect(x, y - 13, w, h, 10, 10, 'S');
        setText(C.accent); doc.text(txt, x + padX, y + 1);
        x += w + gap;
      });
      y += h + 12;
    };

    // 1. Información de la prédica
    heading('Información de la prédica');
    metaRow('Título', resultado.titulo || '—');
    if (pdfPasaje) metaRow('Texto bíblico', pdfPasaje);
    if (resultado.idea_principal) metaRow('Idea central', resumir(resultado.idea_principal, 200));
    metaRow('Fecha de análisis', fechaTxt);

    // 2. Resumen
    heading('Resumen de la prédica');
    paragraph(resumir(resultado.idea_principal, 420), { size: 11, lead: 16, color: C.ink });

    // 3. Desarrollo bíblico
    heading('Desarrollo bíblico', 130);
    if (pdfTextoPasaje) quoteBlock(pdfPasaje, pdfTextoPasaje);
    if (pdfContexto) paragraph(pdfContexto, { max: 320 });
    if (resultado.idea_principal) paragraph(resumir(resultado.idea_principal, 280), { italic: true, color: C.ink });
    const referencias = Array.from(new Set(
      listaPuntos.flatMap((p) => (p.versiculos || []).map((v) => v.cita)).filter(Boolean),
    )).slice(0, 12);
    if (referencias.length) {
      paragraph('Referencias bíblicas', { size: 9, color: C.sub });
      chips(referencias);
    }

    // 4. Puntos principales (cantidad dinámica)
    const nPuntos = listaPuntos.length;
    heading(`${nPuntos} ${nPuntos === 1 ? 'punto principal' : 'puntos principales'}`, 96);
    listaPuntos.forEach((p, idx) => {
      const num = String(idx + 1).padStart(2, '0');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(14);
      const titleLines = doc.splitTextToSize(resumir(p.punto || '', 90), contentW - 48);
      const headerH = Math.max(28, titleLines.length * 17);
      ensure(headerH + 40);
      setFill(C.accent); doc.rect(margin, y - 16, 28, 28, 'F');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.setTextColor(255, 255, 255);
      doc.text(num, margin + 14, y + 2, { align: 'center' });
      doc.setFont('helvetica', 'bold'); doc.setFontSize(14); setText(C.ink);
      doc.text(titleLines, margin + 44, y - 2);
      y += headerH + 6;
      doc.setFont('helvetica', 'normal'); doc.setFontSize(10.5);
      const expl = doc.splitTextToSize(resumir(p.explicacion || '', 320), contentW);
      ensure(expl.length * 14 + 8);
      setText(C.sub); doc.text(expl, margin, y); y += expl.length * 14 + 8;
      (p.versiculos || []).slice(0, 3).forEach((v) => quoteBlock(v.cita || '', v.texto || ''));
      y += 6;
      setStroke(C.rule); doc.setLineWidth(0.5); doc.line(margin, y, pageW - margin, y); y += 14;
    });

    // 5. Conceptos clave
    const conceptos = Array.from(new Set(
      listaPuntos
        .map((p) => (p.punto || '').split(/\s+/).slice(0, 2).join(' ').replace(/[.,;:]+$/, '').trim())
        .filter((k) => k.length > 2),
    )).slice(0, 8);
    if (conceptos.length) {
      heading('Conceptos clave');
      chips(conceptos);
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

    // 8. Oración ministerial
    heading('Oración ministerial');
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
      const body = doc.splitTextToSize(`“${resumir(resultado.oracion, 420)}”`, contentW - 30);
      const h = body.length * 14 + 26;
      ensure(h + 8);
      setFill(C.surface); doc.rect(margin, y - 10, contentW, h, 'F');
      setFill(C.accent); doc.rect(margin, y - 10, 3, h, 'F');
      doc.setFont('helvetica', 'italic'); doc.setFontSize(10.5); setText(C.ink);
      doc.text(body, margin + 15, y + 8);
      y += h + 6;
    }

    // -------------------- ENCABEZADO Y PIE (dos pasadas) --------------------
    const total = doc.getNumberOfPages();
    for (let i = 1; i <= total; i++) {
      doc.setPage(i);
      setStroke(C.rule); doc.setLineWidth(0.7);
      if (i > 1) {
        doc.line(margin, margin - 20, pageW - margin, margin - 20);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8); setText(C.sub);
        doc.text(resumir(resultado.titulo || 'Análisis de prédica', 64), margin, margin - 28);
        doc.text('TeoDoc', pageW - margin, margin - 28, { align: 'right' });
      }
      doc.line(margin, pageH - margin + 14, pageW - margin, pageH - margin + 14);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8); setText(C.sub);
      doc.text('TeoDoc · Análisis Ministerial', margin, pageH - margin + 25);
      doc.text(`Página ${i} de ${total}`, pageW - margin, pageH - margin + 25, { align: 'right' });
    }

    const safe = (resultado.titulo || 'analisis').replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 60);
    doc.save(`TeoDoc_${safe || 'analisis'}.pdf`);
  };

  // --- Datos derivados para la infografía (solo lo que existe en el análisis) ---
  const primerVersiculo = (() => {
    for (const punto of resultado?.desarrollo_progresivo || []) {
      const v = (punto.versiculos || [])[0];
      if (v?.cita) return v;
    }
    return null;
  })();
  const pasajePrincipal = primerVersiculo?.cita || '';
  const textoPasaje = primerVersiculo?.texto || resultado?.infografia?.texto_clave || '';
  const contexto = resultado?.infografia?.contexto_breve || '';
  const puntos = (resultado?.desarrollo_progresivo || []).slice(0, 5);
  const aplicaciones = (resultado?.aplicacion || []).slice(0, 6);
  const palabrasClave = Array.from(new Set(
    (resultado?.desarrollo_progresivo || [])
      .map((p) => (p.punto || '').split(/\s+/).slice(0, 2).join(' ').replace(/[.,;:]+$/, '').trim())
      .filter((k) => k.length > 2),
  )).slice(0, 6);
  const fechaHoy = new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <div className="app-shell bg-[#161616] text-[#f4f4f4] font-sans flex flex-col relative">
      {/* HEADER — IBM Carbon */}
      <header className="shrink-0 w-full bg-[#161616] border-b border-[#393939] z-20 relative" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="shell-container h-12 flex items-center justify-between">
        <button
          type="button"
          onClick={nuevoAnalisis}
          className="flex items-center gap-3 min-w-0 hover:opacity-80 transition-opacity"
          aria-label="Volver al inicio"
        >
          <svg viewBox="0 0 64 64" className="w-6 h-6 shrink-0" aria-hidden="true">
            <defs>
              <radialGradient id="tdOrb" cx="50%" cy="36%" r="68%">
                <stop offset="0%" stopColor="#a6c8ff" />
                <stop offset="52%" stopColor="#0f62fe" />
                <stop offset="100%" stopColor="#002d9c" />
              </radialGradient>
            </defs>
            <circle cx="32" cy="32" r="22" fill="url(#tdOrb)" />
            <path d="M14 34.5c5.4-3.2 10.3-3.2 15.6 0 5.2 3.1 9.7 1.6 13.4-1.2" stroke="#ffffff" strokeOpacity="0.9" strokeWidth="2.4" strokeLinecap="round" fill="none" />
          </svg>
          <span className="text-sm font-semibold tracking-wide text-[#f4f4f4] truncate">TeoDoc</span>
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
            <h2 className="text-fluid-sub mt-3 font-normal text-[#c6c6c6]">Analiza tus prédicas.</h2>
            <p className="text-fluid-body mt-4 text-[#a8a8a8] max-w-xl mx-auto">
              Transcripción y extracción de estructura teológica impulsada por IA.
            </p>
          </div>
        )}

        {/* ORBE — único punto de interacción */}
        {!resultado && (
          <div className="z-20 relative">
            <LiquidOrb
              state={loading ? 'thinking' : 'idle'}
              progress={progress}
              disabled={loading}
              onFile={procesarArchivo}
            />
          </div>
        )}

        {/* BARRA DE PROGRESO — IBM Carbon */}
        {loading && (
          <div className="mt-5 sm:mt-6 w-full max-w-md">
            <div className="mb-2">
              <span className="text-xs text-[#c6c6c6]">Procesando prédica</span>
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
              <p className="mt-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#78a9ff]">{promesasBiblicas[versoIndex].cita}</p>
            </div>
          </div>
        )}

        {/* AVISO — Carbon inline notification */}
        {!loading && !resultado && error && (
          <div className="mt-8 w-full max-w-md border-l-4 border-[#0f62fe] bg-[#262626] px-4 py-3 text-sm text-[#f4f4f4]">
            <p className="font-semibold mb-1">🕊️ Un momento</p>
            <p className="text-[#c6c6c6]">{error}</p>
          </div>
        )}

        {/* CONTENEDOR DE RESULTADOS */}
        {resultado && (
          <div className="w-full mt-6 md:mt-10 mb-12 sm:mb-16 space-y-10 sm:space-y-16 animate-fade-in z-20 relative">
            <div className="bg-[#262626] border border-[#393939] overflow-hidden">
              <div className="p-6 sm:p-8 md:p-12 border-b border-[#393939] relative overflow-hidden">

                <div className="flex flex-col md:flex-row justify-between items-center md:items-start mb-8 sm:mb-10 gap-5 relative z-10">
                  <div className="flex flex-col items-center md:items-start text-center md:text-left">
                    <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#a6c8ff] uppercase tracking-wider mb-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#0f62fe]" aria-hidden="true" />
                      Análisis IA completado
                    </span>
                    <span className="text-[#a8a8a8] text-sm font-normal">Estructura teológica extraída.</span>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row flex-wrap justify-center md:justify-end gap-2 w-full md:w-auto">
                    <button onClick={nuevoAnalisis} className="h-10 w-full sm:w-auto justify-center px-5 text-sm font-medium text-[#f4f4f4] border border-[#6f6f6f] hover:bg-[#353535] transition-colors flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                      Nuevo
                    </button>
                    <button onClick={generarPDF} className="h-10 w-full sm:w-auto justify-center px-5 text-sm font-medium text-[#f4f4f4] border border-[#6f6f6f] hover:bg-[#353535] transition-colors flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4-4m0 0l-4-4m4 4V4"></path></svg>
                      PDF
                    </button>
                    <button onClick={descargarInfografia} className="h-10 w-full sm:w-auto justify-center px-5 text-sm font-medium text-white bg-[#0f62fe] hover:bg-[#0353e9] transition-colors flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                      Infografía
                    </button>
                  </div>
                </div>

                <div className="text-center relative z-10">
                  <h2 className="text-2xl sm:text-4xl md:text-5xl font-light text-[#f4f4f4] mb-5 leading-tight tracking-tight">{resultado.titulo}</h2>
                  <p className="text-[#c6c6c6] text-base sm:text-lg md:text-xl italic max-w-3xl mx-auto font-light leading-relaxed">"{resultado.idea_principal}"</p>
                </div>
              </div>
              
              <div className="p-6 sm:p-8 md:p-12 space-y-10 sm:space-y-16">
                <section>
                  <h3 className="text-sm font-semibold text-[#f4f4f4] mb-6 sm:mb-8 uppercase tracking-wider border-l-4 border-[#0f62fe] pl-3">
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
                          {item.versiculos.length > 0 && (
                            <div className="grid gap-3">
                              {item.versiculos.map((v, vIdx) => (
                                <div key={vIdx} className="bg-[#1f1f1f] p-4 border-l-2 border-[#0f62fe]">
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
                      Oración Ministerial
                    </h3>
                    <p className="text-[#c6c6c6] italic leading-relaxed font-normal text-sm sm:text-base">"{resultado.oracion}"</p>
                  </section>
                </div>
              </div>
            </div>

            {/* Infografía — mapa de estudio bíblico (A4, lettering a mano) */}
            <div className="w-full pt-6 sm:pt-10">
              <div className="text-center mb-6 sm:mb-8 px-4">
                <h3 className="text-sm font-semibold text-[#f4f4f4] tracking-wider uppercase">Infografía lista · v3</h3>
                <p className="text-xs sm:text-sm text-[#a8a8a8] mt-2 max-w-md mx-auto">
                  Mapa de estudio bíblico en A4 vertical. Descárgala en PNG para verla, leerla o imprimirla.
                </p>
              </div>
              <div className="w-full overflow-x-auto">
                <div
                  ref={infografiaRef}
                  className="mx-auto"
                  style={{ width: 794, height: 1123, backgroundColor: '#FFFFFF', color: '#161616', padding: '46px 48px', fontFamily: 'var(--font-plex), system-ui, sans-serif', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}
                >
                  <div style={{ position: 'absolute', inset: 0, opacity: 0.5, backgroundImage: 'radial-gradient(#E0E0E0 0.9px, transparent 0.9px)', backgroundSize: '20px 20px', pointerEvents: 'none' }} />

                  {/* Encabezado */}
                  <div style={{ position: 'relative', textAlign: 'center', marginBottom: 12 }}>
                    <div style={{ fontSize: 10, letterSpacing: '0.3em', color: '#525252', textTransform: 'uppercase' }}>Estudio bíblico visual</div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 2 }}>
                      <span style={{ display: 'inline-flex' }}>{IcoCross}</span>
                      <span className="font-hand" style={{ fontSize: 42, fontWeight: 700, lineHeight: 1 }}>Análisis de la Prédica</span>
                    </div>
                    <svg width="300" height="12" viewBox="0 0 300 12" style={{ display: 'block', margin: '0 auto' }}>
                      <path d="M4 7 C 60 1, 120 12, 180 6 S 270 1, 296 7" fill="none" stroke="#0F62FE" strokeWidth="3.4" strokeLinecap="round" />
                    </svg>
                    <div style={{ fontSize: 18, fontWeight: 700, marginTop: 8, lineHeight: 1.2 }}>{resumir(resultado.titulo || 'Prédica', 80)}</div>
                    <div style={{ fontSize: 12, fontStyle: 'italic', color: '#525252', marginTop: 3, maxWidth: 600, marginLeft: 'auto', marginRight: 'auto' }}>“{resumir(resultado.idea_principal, 160)}”</div>
                    <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 7, fontSize: 10.5, color: '#525252' }}>
                      {pasajePrincipal ? <span style={{ color: '#0F62FE', fontWeight: 700 }}>{pasajePrincipal}</span> : null}
                      <span>Generado el {fechaHoy}</span>
                    </div>
                  </div>

                  {/* 1. DESARROLLO BÍBLICO */}
                  <SectionTitle label="Desarrollo bíblico" icon={IcoBible} />
                  <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: contexto ? '1fr 1fr' : '1fr', gap: 10, marginBottom: 8 }}>
                    <div style={PANEL}>
                      <div style={PANEL_LABEL}>Pasaje principal</div>
                      <div className="font-hand" style={{ fontSize: 21, color: '#0F62FE', lineHeight: 1.05 }}>{pasajePrincipal || '—'}</div>
                      {textoPasaje ? <div style={{ fontSize: 11, color: '#525252', fontStyle: 'italic', marginTop: 3, lineHeight: 1.35 }}>“{resumir(textoPasaje, 120)}”</div> : null}
                    </div>
                    {contexto ? (
                      <div style={PANEL}>
                        <div style={PANEL_LABEL}>Contexto</div>
                        <div style={{ fontSize: 11, color: '#525252', lineHeight: 1.4 }}>{resumir(contexto, 190)}</div>
                      </div>
                    ) : null}
                  </div>
                  <div style={{ position: 'relative', borderLeft: '3px solid #0F62FE', paddingLeft: 10, marginBottom: 8 }}>
                    <div style={PANEL_LABEL}>Idea central</div>
                    <div style={{ fontSize: 12.5, fontWeight: 600, lineHeight: 1.35 }}>{resumir(resultado.idea_principal, 180)}</div>
                  </div>
                  {palabrasClave.length > 0 && (
                    <div style={{ position: 'relative', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {palabrasClave.map((k, i) => (
                        <span key={i} className="font-hand" style={{ fontSize: 16, lineHeight: 1, color: '#0F62FE', border: '1.5px solid #0F62FE', borderRadius: 999, padding: '3px 10px' }}>{k}</span>
                      ))}
                    </div>
                  )}

                  <HandArrow />

                  {/* 2. PUNTOS CLAVE */}
                  <SectionTitle label={`${puntos.length} puntos clave`} icon={IcoScroll} />
                  <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
                    {puntos.map((p, i) => (
                      <div key={i} style={{ border: '2px solid #161616', borderRadius: 10, padding: '8px 10px', boxShadow: '3px 3px 0 #E0E0E0', background: '#FFFFFF' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span className="font-hand" style={{ fontSize: 28, color: '#0F62FE', lineHeight: 1 }}>{i + 1}</span>
                          <span className="font-hand" style={{ fontSize: 19, lineHeight: 1.05 }}>{resumir(p.punto, 40)}</span>
                        </div>
                        <div style={{ fontSize: 11, color: '#525252', lineHeight: 1.35, marginTop: 3 }}>{resumir(p.explicacion, 120)}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, color: '#0F62FE' }}>
                          <span style={{ display: 'inline-flex', transform: 'scale(0.8)', transformOrigin: 'left center' }}>{POINT_ICONS[i % POINT_ICONS.length]}</span>
                          <span style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Clave {i + 1}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <HandArrow />

                  {/* 3. APLICACIÓN PRÁCTICA */}
                  <SectionTitle label="Aplicación práctica" icon={IcoSteps} />
                  <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '7px 16px' }}>
                    {aplicaciones.map((a, i) => (
                      <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                        {IcoCheck}
                        <span style={{ fontSize: 11, lineHeight: 1.35 }}>{resumir(a, 100)}</span>
                      </div>
                    ))}
                  </div>

                  <HandArrow />

                  {/* 4. ORACIÓN MINISTERIAL */}
                  <SectionTitle label="Oración ministerial" icon={IcoPray} />
                  <div style={{ position: 'relative', border: '2px solid #0F62FE', borderRadius: 12, background: '#F4F4F4', padding: '11px 14px' }}>
                    <div style={{ fontSize: 11.5, fontStyle: 'italic', lineHeight: 1.5, color: '#161616' }}>{resumir(resultado.oracion, 340)}</div>
                  </div>

                  {/* Pie */}
                  <div style={{ position: 'relative', marginTop: 'auto', borderTop: '2px solid #E0E0E0', paddingTop: 6, display: 'flex', justifyContent: 'space-between', fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#525252' }}>
                    <span>TeoDoc · Análisis Ministerial</span>
                    <span>RPM Ministry</span>
                  </div>
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

      {/* FOOTER PERFECTAMENTE VISIBLE Y ELEVADO */}
      <footer className="shrink-0 w-full border-t border-[#393939] bg-[#161616] z-20">
        <div className="shell-container shell-safe-bottom flex flex-col items-center justify-center pt-6 text-[11px] text-[#a8a8a8] font-normal tracking-wide gap-1">
          <p className="text-[#c6c6c6]">Versión 1.1 Beta</p>
          <p>Desarrollado por Mauricio Andrade Luna</p>
        </div>
      </footer>
    </div>
  );
}