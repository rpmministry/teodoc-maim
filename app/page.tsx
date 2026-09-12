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
      const dataUrl = await domtoimage.toJpeg(node, { quality: 0.95, bgcolor: '#F8F5EE' });
      const link = document.createElement('a');
      link.download = `Infografia_${resultado?.titulo.replace(/\s+/g, '_')}.jpg`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      alert("No se pudo generar la imagen.");
    }
  };

  const generarPDF = async () => {
    if (!resultado) return;
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    const margin = 20; const pageWidth = doc.internal.pageSize.getWidth(); let y = margin;
    const colorPrimario = [44, 62, 80]; const colorSecundario = [127, 140, 141]; const colorAcento = [192, 57, 43]; 

    doc.setFont("helvetica", "bold"); doc.setFontSize(22); doc.setTextColor(colorPrimario[0], colorPrimario[1], colorPrimario[2]);
    const tituloLineas = doc.splitTextToSize(resultado.titulo.toUpperCase(), pageWidth - margin * 2);
    doc.text(tituloLineas, pageWidth / 2, y, { align: "center" }); y += tituloLineas.length * 10 + 5;

    doc.setFontSize(14); doc.setFont("helvetica", "italic"); doc.setTextColor(colorSecundario[0], colorSecundario[1], colorSecundario[2]);
    const ideaLineas = doc.splitTextToSize(`"${resultado.idea_principal}"`, pageWidth - margin * 2);
    doc.text(ideaLineas, pageWidth / 2, y, { align: "center" }); y += ideaLineas.length * 8 + 15;

    doc.setDrawColor(200); doc.setLineWidth(0.5); doc.line(margin, y, pageWidth - margin, y); y += 10;
    doc.setFont("helvetica", "bold"); doc.setFontSize(16); doc.setTextColor(colorPrimario[0], colorPrimario[1], colorPrimario[2]);
    doc.text("DESARROLLO BÍBLICO", margin, y); y += 10;

    resultado.desarrollo_progresivo.forEach((item, index) => {
      if (y > 260) { doc.addPage(); y = margin; }
      doc.setFont("helvetica", "bold"); doc.setFontSize(14); doc.setTextColor(colorPrimario[0], colorPrimario[1], colorPrimario[2]);
      const puntoLineas = doc.splitTextToSize(`${index + 1}. ${item.punto}`, pageWidth - margin * 2);
      doc.text(puntoLineas, margin, y); y += puntoLineas.length * 7 + 2;

      doc.setFont("helvetica", "normal"); doc.setFontSize(11); doc.setTextColor(0, 0, 0);
      const explLineas = doc.splitTextToSize(item.explicacion, pageWidth - margin * 2);
      doc.text(explLineas, margin, y); y += explLineas.length * 5 + 5;

      item.versiculos.forEach(v => {
        if (y > 270) { doc.addPage(); y = margin; }
        doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(colorAcento[0], colorAcento[1], colorAcento[2]);
        doc.text(v.cita, margin + 5, y); y += 5;
        doc.setFont("helvetica", "italic"); doc.setTextColor(80, 80, 80);
        const vTextoLineas = doc.splitTextToSize(`"${v.texto}"`, pageWidth - margin * 2 - 10);
        doc.text(vTextoLineas, margin + 5, y); y += vTextoLineas.length * 5 + 5;
      });
      y += 5;
    });

    doc.addPage(); y = margin;
    doc.setFont("helvetica", "bold"); doc.setFontSize(16); doc.setTextColor(colorPrimario[0], colorPrimario[1], colorPrimario[2]);
    doc.text("APLICACIÓN PRÁCTICA", margin, y); y += 10;
    doc.setFont("helvetica", "normal"); doc.setFontSize(12); doc.setTextColor(0, 0, 0);
    resultado.aplicacion.forEach(app => {
      const appLineas = doc.splitTextToSize(`• ${app}`, pageWidth - margin * 2);
      doc.text(appLineas, margin + 5, y); y += appLineas.length * 6 + 3;
    }); y += 15;

    doc.setFont("helvetica", "bold"); doc.setFontSize(16); doc.setTextColor(colorPrimario[0], colorPrimario[1], colorPrimario[2]);
    doc.text("ORACIÓN MINISTERIAL", margin, y); y += 10;
    doc.setFont("helvetica", "italic"); doc.setFontSize(12); doc.setTextColor(80, 80, 80);
    const oracionLineas = doc.splitTextToSize(`"${resultado.oracion}"`, pageWidth - margin * 2);
    doc.text(oracionLineas, margin, y);

    doc.save("Bosquejo_TeoDoc.pdf");
  };

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
        <div className="shell-container flex flex-col items-center justify-start py-6 sm:py-10">
        {/* HERO — Carbon */}
        {!resultado && (
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
          <div className="mt-8 sm:mt-10 w-full max-w-md">
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
          <div className="mt-7 sm:mt-9 w-full max-w-xl">
            <div key={versoIndex} className="verse-fade border-l-2 border-[#0f62fe] pl-4">
              <p className="text-fluid-quote italic text-[#e0e0e0] leading-relaxed">“{promesasBiblicas[versoIndex].texto}”</p>
              <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-[#78a9ff]">{promesasBiblicas[versoIndex].cita}</p>
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
                    {resultado.infografia && (
                      <button onClick={descargarInfografia} className="h-10 w-full sm:w-auto justify-center px-5 text-sm font-medium text-white bg-[#0f62fe] hover:bg-[#0353e9] transition-colors flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                        Infografía
                      </button>
                    )}
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

            {/* Vista previa póster */}
            {resultado.infografia && (
              <div className="w-full pt-6 sm:pt-10">
                <div className="text-center mb-6 sm:mb-8 px-4">
                  <h3 className="text-sm font-semibold text-[#f4f4f4] tracking-wider uppercase">Póster digital listo</h3>
                  <p className="text-xs sm:text-sm text-[#a8a8a8] mt-2 max-w-md mx-auto">
                    Exportación optimizada en alta resolución.
                  </p>
                </div>
                <div className="w-full px-2 sm:px-0">
                  <div 
                    ref={infografiaRef} 
                    style={{ backgroundColor: '#F8F5EE', color: '#2C3E50' }}
                    className="w-full max-w-3xl p-6 sm:p-10 md:p-14 rounded-xl relative border-[8px] sm:border-[12px] border-[#E8DFC8] font-serif overflow-hidden mx-auto shadow-2xl"
                  >
                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#8C7D64 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                    <div className="relative z-10 flex flex-col items-center">
                      <div style={{ backgroundColor: '#5B778A', borderColor: '#3A4D59' }} className="text-[#F8F5EE] py-6 px-4 sm:py-8 sm:px-10 rounded-xl mb-8 sm:mb-10 w-full text-center border-b-6 sm:border-b-8 relative">
                        <h1 className="text-2xl sm:text-4xl md:text-5xl font-black uppercase tracking-widest font-sans leading-tight">{resultado.titulo}</h1>
                      </div>
                      <div className="text-center mb-8 sm:mb-12 max-w-2xl px-2">
                        <p className="text-lg sm:text-2xl font-bold italic text-[#725439] leading-snug">"{resultado.infografia.frase_corta || resultado.idea_principal}"</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-8 sm:mb-12 w-full">
                        <div className="bg-white p-6 sm:p-8 rounded-xl border border-gray-200 border-t-[6px] border-t-[#5B778A]">
                          <h3 className="text-xs sm:text-sm font-black uppercase tracking-widest text-[#5B778A] mb-3 sm:mb-4 bg-[#EDF1F3] inline-block px-3 py-1.5 sm:px-4 sm:py-2 rounded">Contexto Histórico</h3>
                          <p className="text-gray-700 leading-relaxed text-sm sm:text-base">{resultado.infografia.contexto_breve}</p>
                        </div>
                        <div style={{ backgroundColor: '#F3EBE1' }} className="p-6 sm:p-8 rounded-xl border border-gray-200 border-l-[6px] border-l-[#D4AF37]">
                          <h3 className="text-xs sm:text-sm font-black uppercase tracking-widest text-[#725439] mb-3 sm:mb-4">📖 Texto Clave</h3>
                          <p className="text-[#2C3E50] font-medium italic text-base sm:text-lg leading-relaxed">"{resultado.infografia.texto_clave}"</p>
                        </div>
                      </div>
                      <div className="bg-white rounded-xl p-6 sm:p-10 border border-[#E8DFC8] w-full">
                        <div className="text-center mb-8 sm:mb-10">
                          <h3 className="text-lg sm:text-xl font-bold uppercase tracking-widest text-[#2C3E50] border-b-2 border-[#D4AF37] pb-2 sm:pb-3 inline-block">El Mensaje Central</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                          {resultado.desarrollo_progresivo.slice(0, 3).map((punto, i) => (
                            <div key={i} className="flex flex-col items-center text-center">
                              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full text-white flex items-center justify-center font-bold text-lg sm:text-xl mb-4 sm:mb-5 shrink-0" style={{ backgroundColor: '#D4AF37' }}>{i + 1}</div>
                              <h4 className="font-bold text-[#5B778A] text-sm sm:text-base uppercase mb-2 sm:mb-3 leading-tight">{punto.punto}</h4>
                              <p className="text-xs sm:text-sm text-gray-700 leading-relaxed text-center">{punto.explicacion}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="mt-8 sm:mt-10 text-[#A69B85] text-[10px] sm:text-xs font-bold tracking-widest flex items-center gap-2">
                        GENERADO POR TEODOC | RPM MINISTRY
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
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