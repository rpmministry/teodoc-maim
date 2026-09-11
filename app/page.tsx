'use client';
import { useState, useRef, useEffect } from 'react';
import FluidOrb from '@/components/fluid-orb';

interface Versiculo { cita: string; texto: string; }
interface PuntoDesarrollo { punto: string; explicacion: string; versiculos: Versiculo[]; }
interface DatosInfografia { frase_corta: string; texto_clave: string; contexto_breve: string; }
interface PredicaAnalisis {
  titulo: string; idea_principal: string;
  infografia?: DatosInfografia;
  desarrollo_progresivo: PuntoDesarrollo[];
  aplicacion: string[]; oracion: string;
}

const promesasBiblicas = [
  { cita: "Isaías 41:10", texto: "No temas, porque yo estoy contigo; no desmayes..." },
  { cita: "Jeremías 29:11", texto: "Porque yo sé los pensamientos que tengo acerca de vosotros..." },
  { cita: "Romanos 8:28", texto: "Y sabemos que a los que aman a Dios, todas las cosas les ayudan a bien..." },
  { cita: "Josué 1:9", texto: "Mira que te mando que te esfuerces y seas valiente..." }
];

const ALLOWED_EXTENSIONS = ['.mp3', '.wav', '.m4a', '.m4b', '.aac', '.flac', '.ogg', '.oga', '.opus', '.wma', '.amr', '.webm', '.mp4', '.mov', '.aiff', '.aif', '.caf', '.3gp'];
const MAX_FILE_SIZE = 500 * 1024 * 1024;

// Estilo de texto degradado explícito (sRGB + prefijo -webkit-) para que se
// vea en iOS 15 / Safari 15, donde `background-clip:text` sin prefijo y los
// degradados con `in oklab` de Tailwind v4 no se aplican.
function gradStyle(gradient: string): React.CSSProperties {
  return {
    backgroundImage: gradient,
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    color: 'transparent',
    WebkitTextFillColor: 'transparent',
  };
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState<string>('');
  
  const [resultado, setResultado] = useState<PredicaAnalisis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [versoIndex, setVersoIndex] = useState(0);
  
  const infografiaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Último File procesado: evita procesar dos veces cuando 'change', 'focus' y
  // 'visibilitychange' disparan por la misma selección.
  const ultimoArchivoRef = useRef<File | null>(null);

  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [feedbackStatus, setFeedbackStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  useEffect(() => {
    let intervaloVerso: NodeJS.Timeout;
    if (loading) {
      intervaloVerso = setInterval(() => setVersoIndex((prev) => (prev + 1) % promesasBiblicas.length), 7000);
    }
    return () => clearInterval(intervaloVerso);
  }, [loading]);

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

  const formatearTamaño = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Procesa el archivo SIN operaciones pesadas (nada de leer el blob ni
  // IndexedDB): solo valida y actualiza el estado. Leer el archivo entero aquí
  // es justo lo que colapsa la memoria de Safari en iPhone.
  const handleFileSelected = (file: File) => {
    if (!file) return;

    const errMsg = validarArchivo(file);
    if (errMsg) {
      setError(errMsg);
      return;
    }

    setError(null);
    setResultado(null);
    setSelectedFile(file);
  };

  // Captura el archivo por TRES vías, porque iOS es inconsistente:
  //  1) 'change' en el input (lo habitual).
  //  2) 'focus' de window: iOS lo dispara al cerrarse el selector de Archivos,
  //     incluso cuando no llega a emitir 'change'.
  //  3) 'visibilitychange': por si la pestaña se ocultó durante la selección.
  // El ref evita procesar el mismo File dos veces.
  useEffect(() => {
    const input = fileInputRef.current;
    if (!input) return;

    const procesar = () => {
      const file = input.files?.[0];
      if (!file || file === ultimoArchivoRef.current) return;
      ultimoArchivoRef.current = file;
      handleFileSelected(file);
    };
    // Reintentos diferidos: en iOS 'files' a veces se puebla después del change.
    const conReintentos = () => {
      procesar();
      setTimeout(procesar, 300);
      setTimeout(procesar, 1000);
    };
    const onVisibility = () => { if (document.visibilityState === 'visible') conReintentos(); };

    input.addEventListener('change', conReintentos);
    window.addEventListener('focus', conReintentos);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      input.removeEventListener('change', conReintentos);
      window.removeEventListener('focus', conReintentos);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  const handleCambiarArchivo = () => {
    setSelectedFile(null);
    ultimoArchivoRef.current = null;
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAnalizarClick = async () => {
    if (!selectedFile) {
      setError('Primero selecciona un archivo.');
      return;
    }

    // Advertencia sutil para WAV gigantescos
    if (selectedFile.name.toLowerCase().endsWith('.wav') && selectedFile.size > 100 * 1024 * 1024) {
      alert("⚠️ Tu archivo WAV pesa más de 100 MB. Si experimentas un error durante el análisis, te recomendamos convertirlo a MP3 o M4A para asegurar que el servidor lo procese correctamente.");
    }

    setError(null);
    setLoading(true);
    setProgress(5);
    setStatusText('Preparando archivo...');

    try {
      await uploadFileToCloudinary(selectedFile);
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
    setStatusText('Subiendo prédica a Cloudinary...');

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
        setStatusText(`Subiendo prédica... ${Math.round((end / totalBytes) * 100)}%`);

        start = end;
      }
    }

    if (!data?.secure_url) {
      throw new Error('Cloudinary no devolvió la URL segura del archivo.');
    }

    setProgress(30);
    setStatusText('Archivo recibido. Extrayendo transcripción...');
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
        const errBody = await resTranscribe.json().catch(() => null);
        throw new Error(errBody?.error || 'Error procesando la transcripción. El audio podría ser demasiado largo.');
      }
      const dataTranscribe = await resTranscribe.json();
      const textoTranscrito = dataTranscribe.text;
      
      setStatusText('Analizando estructura teológica profunda...');
      setProgress(50);
      timerAnalyze = setInterval(() => {
        setProgress((prev) => prev >= 98 ? 98 : prev + Math.max(1, Math.floor((99 - prev) * 0.05)));
      }, 1000);

      const resAnalyze = await fetch('/api/analyze', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: textoTranscrito })
      });
      clearInterval(timerAnalyze); timerAnalyze = undefined;

      if (!resAnalyze.ok) {
        const errBody = await resAnalyze.json().catch(() => null);
        throw new Error(errBody?.error || 'Error en el análisis teológico de la IA.');
      }
      const dataAnalyze = await resAnalyze.json();

      setProgress(100);
      setStatusText('¡Análisis teológico completado!');
      setTimeout(() => {
        setResultado(dataAnalyze);
        setLoading(false);
      }, 500);

    } catch (err: any) {
      setError(`❌ Fallo crítico en el pipeline: ${err.message || 'Ocurrió un error inesperado.'}`);
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
    setSelectedFile(null);
    ultimoArchivoRef.current = null;
    if (fileInputRef.current) fileInputRef.current.value = '';
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
    <div className="min-h-screen bg-[#07090E] text-white font-sans selection:bg-cyan-500/30 flex flex-col relative overflow-x-hidden">
      
      {/* FONDOS Y AURORAS NEÓN COMPATIBLES */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-purple-600/30 rounded-full blur-[100px]"></div>
        <div className="absolute top-1/3 right-[-10%] w-[500px] h-[500px] bg-cyan-600/20 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] left-1/4 w-[600px] h-[600px] bg-pink-600/15 rounded-full blur-[120px]"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIvPjwvc3ZnPg==')] opacity-40"></div>
      </div>

      {/* NAVBAR */}
      <nav className="w-full flex flex-wrap gap-4 justify-between items-center px-4 sm:px-8 py-4 sm:py-6 z-10 relative">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-br from-cyan-400 to-purple-600 rounded-xl flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(34,211,238,0.4)]">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 14v-4M8 18V6M12 22V2M16 18V6M20 14v-4"></path></svg>
          </div>
          <span className="font-extrabold text-lg sm:text-xl tracking-wide drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]"><span className="grad-text" style={gradStyle('linear-gradient(to right, #cffafe, #ffffff)')}>TeoDoc</span></span>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 justify-end">
          <button onClick={() => setShowFeedbackModal(true)} className="group flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white text-[10px] sm:text-sm font-medium transition-all backdrop-blur-md">
            <span className="hidden sm:inline">Sugerencias</span>
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
          </button>
          
          <a href="https://collection.cloudinary.com/antbfat3/ee4582aa2bac515291b5d02c058e9c4d" target="_blank" rel="noopener noreferrer" className="group flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 hover:text-cyan-200 text-[10px] sm:text-sm font-medium transition-all backdrop-blur-md">
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            <span className="hidden sm:inline">Manual</span>
          </a>

          <a href="https://www.paypal.com/ncp/payment/ZTLTVMRR95J2C" target="_blank" rel="noopener noreferrer" className="group flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-5 sm:py-2 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white text-[10px] sm:text-sm font-bold shadow-[0_0_15px_rgba(236,72,153,0.4)] transition-all hover:scale-105 border border-white/10">
            <span className="hidden lg:inline">Apoyar Proyecto</span>
            <span className="lg:hidden">Apoyar</span>
          </a>
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-start px-4 sm:px-6 lg:px-8 z-10 w-full max-w-5xl mx-auto pt-6 sm:pt-8 relative">
        
        {/* TÍTULO PRINCIPAL */}
        {!selectedFile && !loading && !resultado && (
          <div className="text-center space-y-1 sm:space-y-2 mb-8 sm:mb-10 animate-fade-in-up">
            <h1 className="text-6xl sm:text-7xl md:text-8xl font-black tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.4)] px-2 pb-1">
              <span className="grad-text" style={gradStyle('linear-gradient(to bottom right, #ffffff, #cffafe, #d1d5db)')}>TeoDoc</span>
            </h1>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight drop-shadow-[0_0_20px_rgba(168,85,247,0.4)] px-2 pb-2">
              <span className="grad-text" style={gradStyle('linear-gradient(to right, #22d3ee, #c084fc, #f472b6)')}>Analiza tus prédicas.</span>
            </h2>
            <p className="text-xs sm:text-sm md:text-base text-cyan-100/70 max-w-lg mx-auto font-medium px-4 mt-2">
              Transcripción y extracción de estructura teológica impulsada por IA.
            </p>
          </div>
        )}

        {/* ========================================================================= */}
        {/* FASE A: ESFERA DE CRISTAL REFINADA (Sin artefactos en Android) */}
        {/* ========================================================================= */}
        {/* FASE A: se mantiene MONTADA y sin cambiar su estilo mientras hay un
            archivo seleccionado (la FASE B la cubre con un overlay). Dato clave
            de iOS: ocultar el contenedor del <input type="file"> justo después
            de seleccionar descarta el archivo y el 'change' no se registra; por
            eso pdfguru nunca oculta su zona de carga. Solo se oculta cuando el
            pipeline arranca (loading) o ya hay resultado. */}
        <div className={`w-full max-w-md animate-fade-in ${loading || resultado ? 'absolute opacity-0 pointer-events-none -z-10' : ''}`}>
          <div className="relative group cursor-pointer block w-full aspect-square max-h-[400px] mx-auto">
            <input
              ref={fileInputRef}
              id="teodoc-file-input"
              type="file"
              accept=".mp3,.wav,.m4a,.m4b,.aac,.flac,.ogg,.oga,.opus,.wma,.amr,.webm,.mp4,.mov,.aiff,.aif,.caf,.3gp"
              aria-label="Seleccionar archivo de audio"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-30"
            />
              <div 
                className="absolute inset-0 rounded-full flex flex-col items-center justify-center transition-all duration-500 overflow-hidden"
                style={{
                  background: 'radial-gradient(circle at 50% 32%, rgba(38,52,74,0.92), rgba(13,17,26,0.97) 58%, rgba(7,9,14,1) 100%)',
                  border: '1px solid rgba(255,255,255,0.10)',
                  boxShadow: '0 0 60px -10px rgba(168,85,247,0.35), inset 0 0 60px rgba(34,211,238,0.08)',
                  clipPath: 'circle(50% at 50% 50%)',
                }}
              >
                {/* Anillos concéntricos animados */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute inset-0 m-auto w-full h-full orbe-spin-slow">
                    <svg viewBox="0 0 200 200" className="w-full h-full">
                      <defs>
                        <linearGradient id="orbARing1" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#22d3ee" />
                          <stop offset="50%" stopColor="#a855f7" />
                          <stop offset="100%" stopColor="#ec4899" />
                        </linearGradient>
                      </defs>
                      <circle cx="100" cy="100" r="96" fill="none" stroke="url(#orbARing1)" strokeWidth="1.4" strokeDasharray="4 12" strokeLinecap="round" opacity="0.5" />
                    </svg>
                  </div>
                  <div className="absolute inset-0 m-auto w-[84%] h-[84%] orbe-spin-medium" style={{ animationDirection: 'reverse' }}>
                    <svg viewBox="0 0 200 200" className="w-full h-full">
                      <defs>
                        <linearGradient id="orbARing2" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#a855f7" />
                          <stop offset="100%" stopColor="#22d3ee" />
                        </linearGradient>
                      </defs>
                      <circle cx="100" cy="100" r="94" fill="none" stroke="url(#orbARing2)" strokeWidth="2.4" strokeLinecap="round" strokeDasharray="60 330" opacity="0.7" />
                      <circle cx="100" cy="100" r="94" fill="none" stroke="url(#orbARing2)" strokeWidth="2.4" strokeLinecap="round" strokeDasharray="24 366" strokeDashoffset="180" opacity="0.4" />
                    </svg>
                  </div>
                </div>

                {/* Partículas orbitando */}
                {([
                  { s: 'w-3 h-3', a: 'orbe-spin-slow', d: '0s', c: '#22d3ee', r: 'normal' as const },
                  { s: 'w-2 h-2', a: 'orbe-spin-medium', d: '-0.9s', c: '#a855f7', r: 'reverse' as const },
                  { s: 'w-2.5 h-2.5', a: 'orbe-spin-slow', d: '-2.2s', c: '#ec4899', r: 'normal' as const },
                ]).map((p, i) => (
                  <div key={i} className={`absolute inset-0 m-auto w-[72%] h-[72%] pointer-events-none ${p.a}`} style={{ animationDelay: p.d, animationDirection: p.r }}>
                    <span className={`absolute left-1/2 top-0 -translate-x-1/2 ${p.s} rounded-full`} style={{ backgroundColor: p.c, boxShadow: `0 0 10px ${p.c}, 0 0 22px ${p.c}` }} />
                  </div>
                ))}

                <div 
                  className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-full overflow-hidden flex items-center justify-center z-10 group-hover:scale-110 transition-transform duration-500"
                  style={{
                    border: '1px solid rgba(34,211,238,0.35)',
                    boxShadow: 'inset 0 0 30px rgba(34,211,238,0.18), inset 0 -14px 40px rgba(168,85,247,0.22), 0 0 40px rgba(168,85,247,0.4)',
                    clipPath: 'circle(50% at 50% 50%)',
                  }}
                >
                  {!loading && !resultado && (
                    <FluidOrb className="absolute inset-0 w-full h-full pointer-events-none" color="#22d3ee" />
                  )}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{ background: 'radial-gradient(circle, rgba(7,9,14,0.5), rgba(7,9,14,0.08) 60%, rgba(0,0,0,0) 78%)' }}
                  />
                  
                  <svg className="relative z-20 w-14 h-14 sm:w-16 sm:h-16 text-cyan-300 drop-shadow-[0_0_15px_rgba(34,211,238,1)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 16V4m0 0L7 9m5-5 5 5M5 20h14" />
                  </svg>
                </div>

                <div className="mt-8 z-10 flex flex-col items-center">
                  <span className="text-white font-bold text-base sm:text-lg tracking-wide drop-shadow-md">Toca o arrastra aquí</span>
                  <span className="text-cyan-200/60 text-[10px] sm:text-xs mt-2 font-light text-center px-4 leading-relaxed">
                    Soporta: MP3, M4A, WAV, MP4, AAC, OGG, WEBM, OPUS, etc.
                  </span>
                </div>
                
                <div className="absolute bottom-6 flex items-end justify-center gap-1 opacity-70 z-10" style={{ height: '24px' }}>
                  {[2, 4, 3, 5, 2, 6, 3, 4, 2].map((h, i) => (
                    <span key={i} className="orbe-eq w-1 rounded-full" style={{ height: `${h * 3}px`, background: 'linear-gradient(to top, #22d3ee, #a855f7)', animationDelay: `${i * 0.12}s` }} />
                  ))}
                </div>
              </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* FASE B: ARCHIVO SELECCIONADO */}
        {/* ========================================================================= */}
        {selectedFile && !loading && !resultado && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#07090E]/95 backdrop-blur-sm px-4 py-6 overflow-y-auto">
          <div className="w-full max-w-lg animate-fade-in pb-6">
            <div className="bg-[#0D111A]/80 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 shadow-[0_0_40px_-10px_rgba(16,185,129,0.3)] backdrop-blur-xl relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

              <div className="flex items-center gap-4 relative z-10">
                <div className="relative w-14 h-14 rounded-full bg-[#0A0D14] border border-emerald-400/50 shadow-[0_0_20px_rgba(16,185,129,0.4)] flex items-center justify-center shrink-0 group" style={{ clipPath: 'circle(50% at 50% 50%)' }}>
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20"></div>
                  <svg className="w-7 h-7 text-emerald-400 relative z-10 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 14v-4M8 18V6M12 22V2M16 18V6M20 14v-4" />
                  </svg>
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-white font-bold text-base sm:text-lg truncate">
                    {selectedFile.name}
                  </p>
                  <p className="text-emerald-200/60 text-xs sm:text-sm mt-0.5">
                    {selectedFile.type || 'Audio'} · {formatearTamaño(selectedFile.size)}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCambiarArchivo}
                className="mt-5 text-gray-400 hover:text-white text-xs sm:text-sm transition-colors relative z-10 border-b border-transparent hover:border-white/30 pb-0.5"
              >
                Elegir otro archivo
              </button>

              <button
                type="button"
                onClick={handleAnalizarClick}
                className="mt-6 w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-black py-4 rounded-2xl shadow-[0_0_25px_rgba(16,185,129,0.5)] transition-all uppercase tracking-[0.2em] text-xs sm:text-sm flex items-center justify-center gap-2 border border-emerald-300/50 hover:scale-[1.02] relative z-10"
              >
                <span>Analizar Prédica</span>
                <svg className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
              </button>

              {error && (
                <div className="mt-4 px-4 py-3 bg-red-950/80 border border-red-500/50 rounded-xl text-red-200 text-xs relative z-10 break-all text-center">
                  🚨 {error}
                </div>
              )}

            </div>
          </div>
          </div>
        )}

        {/* ERROR DE VALIDACIÓN O SUBIDA */}
        {!loading && !resultado && error && (
          <div className="mt-6 px-5 py-4 bg-red-950/80 border border-red-500/50 rounded-2xl text-red-200 text-xs sm:text-sm w-full max-w-md shadow-[0_0_20px_rgba(239,68,68,0.3)] animate-fade-in space-y-2 text-center relative z-20 backdrop-blur-md">
            <p className="font-bold uppercase tracking-wider text-red-400">🚨 Error detectado:</p>
            <p className="font-mono bg-black/40 p-3 rounded-xl break-all border border-red-500/20">{error}</p>
          </div>
        )}

        {/* ========================================================================= */}
        {/* FASE C: ESTADO DE CARGA Y DIAGNÓSTICO */}
        {/* ========================================================================= */}
        {loading && (
          <div className="flex flex-col items-center text-center mt-4 w-full px-2 animate-fade-in z-20 relative">
            <div className="relative flex items-center justify-center mb-8 w-44 h-44 sm:w-52 sm:h-52">
              {/* Halo luminoso pulsante */}
              <div
                className="absolute inset-0 m-auto w-44 h-44 sm:w-52 sm:h-52 rounded-full blur-3xl orbe-glow"
                style={{ background: 'radial-gradient(circle, rgba(34,211,238,0.55), rgba(168,85,247,0.28) 55%, rgba(0,0,0,0) 72%)' }}
              />

              {/* Anillo exterior giratorio */}
              <div className="absolute inset-0 m-auto w-40 h-40 sm:w-44 sm:h-44 orbe-spin-slow">
                <svg viewBox="0 0 120 120" className="w-full h-full">
                  <defs>
                    <linearGradient id="orbeSpin" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#22d3ee" stopOpacity="0" />
                      <stop offset="55%" stopColor="#22d3ee" />
                      <stop offset="100%" stopColor="#ec4899" />
                    </linearGradient>
                  </defs>
                  <circle cx="60" cy="60" r="55" fill="none" stroke="url(#orbeSpin)" strokeWidth="3" strokeLinecap="round" strokeDasharray="70 275" />
                </svg>
              </div>

              {/* Anillo de progreso real */}
              <svg viewBox="0 0 120 120" className="absolute inset-0 m-auto w-36 h-36 sm:w-40 sm:h-40 -rotate-90">
                <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
                <circle
                  cx="60" cy="60" r="54" fill="none"
                  stroke="url(#orbeProgress)" strokeWidth="4" strokeLinecap="round"
                  strokeDasharray="339.292"
                  strokeDashoffset={339.292 * (1 - progress / 100)}
                  style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                />
                <defs>
                  <linearGradient id="orbeProgress" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#22d3ee" />
                    <stop offset="50%" stopColor="#a855f7" />
                    <stop offset="100%" stopColor="#ec4899" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Núcleo de cristal flotante con el porcentaje */}
              <div
                className="w-28 h-28 sm:w-32 sm:h-32 rounded-full relative overflow-hidden flex items-center justify-center orbe-float"
                style={{
                  boxShadow: 'inset 0 0 30px rgba(34,211,238,0.25), inset 0 -12px 30px rgba(168,85,247,0.25), 0 0 40px rgba(168,85,247,0.35)',
                  border: '1px solid rgba(34,211,238,0.35)',
                }}
              >
                <FluidOrb className="absolute inset-0 w-full h-full pointer-events-none" color="#22d3ee" />
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{ background: 'radial-gradient(circle, rgba(7,9,14,0.5), rgba(7,9,14,0.08) 60%, rgba(0,0,0,0) 78%)' }}
                />
                <span className="relative z-10 text-3xl sm:text-4xl font-black drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">
                  <span className="grad-text" style={gradStyle('linear-gradient(to bottom right, #67e8f9, #ffffff)')}>{progress}%</span>
                </span>
              </div>
            </div>
            
            <div className="text-cyan-300 font-bold mb-6 text-center">
              <span className="text-sm sm:text-base uppercase tracking-widest block mb-1 drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]">
                {statusText}
              </span>
              <span className="text-[10px] sm:text-xs text-cyan-100/50 font-medium tracking-wide">
                Servidor de IA en marcha...
              </span>
            </div>

            <div className="bg-[#0D111A]/80 border border-purple-500/20 rounded-2xl p-6 sm:p-8 shadow-[0_0_30px_rgba(168,85,247,0.15)] w-full max-w-md backdrop-blur-xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500"></div>
              <p className="text-white/90 text-sm sm:text-base font-medium italic mb-3 leading-relaxed drop-shadow-sm">"{promesasBiblicas[versoIndex].texto}"</p>
              <p className="text-cyan-400 font-bold text-xs sm:text-sm tracking-wide">— {promesasBiblicas[versoIndex].cita}</p>
            </div>
          </div>
        )}

        {/* CONTENEDOR DE RESULTADOS */}
        {resultado && (
          <div className="w-full mt-6 md:mt-10 mb-12 sm:mb-16 space-y-10 sm:space-y-16 animate-fade-in z-20 relative">
            <div className="bg-[#0D111A]/80 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-[0_0_50px_rgba(168,85,247,0.15)] overflow-hidden">
              <div className="bg-gradient-to-b from-[#1A1F2C]/80 to-transparent p-6 sm:p-8 md:p-12 border-b border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-[80px] pointer-events-none"></div>

                <div className="flex flex-col md:flex-row justify-between items-center md:items-start mb-8 sm:mb-10 gap-5 relative z-10">
                  <div className="flex flex-col items-center md:items-start text-center md:text-left">
                    <span className="text-[10px] sm:text-xs font-black text-cyan-400 uppercase tracking-[0.2em] mb-1.5 drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]">Análisis IA Completado</span>
                    <span className="text-white/50 text-xs sm:text-sm font-light">Estructura teológica extraída.</span>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row flex-wrap justify-center md:justify-end gap-3 w-full md:w-auto">
                    <button onClick={nuevoAnalisis} className="w-full sm:w-auto justify-center bg-white/5 hover:bg-white/10 border border-white/10 text-white px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all backdrop-blur-md flex items-center gap-2 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                      Nuevo
                    </button>
                    <button onClick={generarPDF} className="w-full sm:w-auto justify-center bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-200 px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all backdrop-blur-md flex items-center gap-2 hover:shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4-4m0 0l-4-4m4 4V4"></path></svg>
                      PDF
                    </button>
                    {resultado.infografia && (
                      <button onClick={descargarInfografia} className="w-full sm:w-auto justify-center bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all shadow-[0_0_20px_rgba(34,211,238,0.4)] flex items-center gap-2 hover:scale-[1.02]">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                        Infografía
                      </button>
                    )}
                  </div>
                </div>

                <div className="text-center relative z-10">
                  <h2 className="text-2xl sm:text-4xl md:text-5xl font-black grad-text mb-5 leading-tight tracking-tight" style={gradStyle('linear-gradient(to right, #ffffff, #9ca3af)')}>{resultado.titulo}</h2>
                  <p className="text-cyan-200/90 text-sm sm:text-lg md:text-xl italic max-w-3xl mx-auto font-light leading-relaxed drop-shadow-md">"{resultado.idea_principal}"</p>
                </div>
              </div>
              
              <div className="p-6 sm:p-8 md:p-12 space-y-10 sm:space-y-16">
                <section>
                  <h3 className="text-xs sm:text-sm font-black text-purple-400 mb-6 sm:mb-8 uppercase tracking-[0.2em] flex items-center gap-3 sm:gap-4 drop-shadow-[0_0_5px_rgba(168,85,247,0.5)]">
                    <span className="w-4 sm:w-10 h-[2px] bg-gradient-to-r from-transparent to-purple-500"></span>
                    Desarrollo Bíblico
                    <span className="flex-1 h-[1px] bg-gradient-to-r from-purple-500/50 to-transparent"></span>
                  </h3>
                  
                  <div className="grid gap-5 sm:gap-6">
                    {resultado.desarrollo_progresivo.map((item, idx) => (
                      <div key={idx} className="bg-white/5 p-5 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl border border-white/10 hover:border-cyan-500/30 hover:bg-white/[0.07] transition-colors backdrop-blur-sm">
                        <div className="flex gap-3 sm:gap-4 items-start mb-4">
                          <span className="text-cyan-400 bg-cyan-500/10 border border-cyan-400/30 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 text-sm font-bold mt-0.5 shadow-[0_0_10px_rgba(34,211,238,0.2)]">{idx + 1}</span>
                          <h4 className="text-lg sm:text-xl font-bold text-white pt-1 sm:pt-1.5 leading-tight">{item.punto}</h4>
                        </div>
                        <div className="pl-11 sm:pl-14">
                          <p className="text-gray-300 mb-5 leading-relaxed font-light text-sm sm:text-base">{item.explicacion}</p>
                          {item.versiculos.length > 0 && (
                            <div className="grid gap-3">
                              {item.versiculos.map((v, vIdx) => (
                                <div key={vIdx} className="bg-black/30 p-4 rounded-xl border-l-2 border-purple-500 shadow-inner">
                                  <p className="text-xs sm:text-sm font-bold text-purple-300 mb-1.5">{v.cita}</p>
                                  <p className="text-xs sm:text-sm text-gray-400 italic font-light leading-relaxed">"{v.texto}"</p>
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
                  <section className="bg-gradient-to-br from-cyan-900/20 to-blue-900/10 p-6 sm:p-8 rounded-3xl border border-cyan-500/20 shadow-[0_0_20px_rgba(34,211,238,0.05)] backdrop-blur-sm">
                    <h3 className="text-xs sm:text-sm font-black text-cyan-400 mb-5 sm:mb-6 uppercase tracking-[0.15em] flex items-center gap-3 drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]">
                      <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
                      Aplicación Práctica
                    </h3>
                    <ul className="space-y-4">
                      {resultado.aplicacion.map((app, idx) => (
                        <li key={idx} className="flex gap-4 text-cyan-50/80 font-light leading-relaxed text-sm sm:text-base">
                          <span className="text-cyan-500 mt-1 text-lg leading-none drop-shadow-[0_0_3px_rgba(34,211,238,0.8)]">•</span>
                          <span>{app}</span>
                        </li>
                      ))}
                    </ul>
                  </section>

                  <section className="bg-gradient-to-br from-pink-900/20 to-purple-900/10 p-6 sm:p-8 rounded-3xl border border-pink-500/20 shadow-[0_0_20px_rgba(236,72,153,0.05)] backdrop-blur-sm">
                    <h3 className="text-xs sm:text-sm font-black text-pink-400 mb-5 sm:mb-6 uppercase tracking-[0.15em] flex items-center gap-3 drop-shadow-[0_0_5px_rgba(236,72,153,0.5)]">
                      <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
                      Oración Ministerial
                    </h3>
                    <p className="text-pink-50/80 italic leading-relaxed font-light text-sm sm:text-base">"{resultado.oracion}"</p>
                  </section>
                </div>
              </div>
            </div>

            {/* Vista previa póster */}
            {resultado.infografia && (
              <div className="w-full pt-6 sm:pt-10">
                <div className="text-center mb-6 sm:mb-8 px-4">
                  <h3 className="text-lg sm:text-xl font-bold text-white tracking-widest uppercase drop-shadow-md">Póster Digital Listo</h3>
                  <p className="text-xs sm:text-sm text-cyan-200/60 mt-2 max-w-md mx-auto">
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
      </main>

      {/* MODAL DE SUGERENCIAS */}
      {showFeedbackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-[#0D111A] border border-cyan-500/30 rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-[0_0_40px_rgba(34,211,238,0.15)] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl"></div>
            <div className="flex justify-between items-center mb-6 relative z-10">
              <h3 className="text-xl font-black grad-text" style={gradStyle('linear-gradient(to right, #22d3ee, #c084fc)')}>Enviar Sugerencia</h3>
              <button onClick={() => setShowFeedbackModal(false)} className="text-white/50 hover:text-white transition-colors bg-white/5 p-2 rounded-full">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            
            {feedbackStatus === 'success' ? (
              <div className="text-cyan-400 text-center py-10 font-bold text-lg">
                ¡Gracias! Tu mensaje ha sido enviado.
              </div>
            ) : (
              <form onSubmit={enviarSugerencia} className="flex flex-col gap-5 relative z-10">
                <textarea
                  required
                  value={feedbackMsg}
                  onChange={(e) => setFeedbackMsg(e.target.value)}
                  placeholder="Escribe tu sugerencia o reporte aquí..."
                  className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 min-h-[120px] resize-none backdrop-blur-sm"
                ></textarea>
                {feedbackStatus === 'error' && <p className="text-red-400 text-xs font-medium">Error de conexión. Inténtalo de nuevo.</p>}
                <button
                  type="submit"
                  disabled={feedbackStatus === 'sending'}
                  className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-bold py-3.5 rounded-2xl text-sm transition-all shadow-[0_0_20px_rgba(168,85,247,0.3)] disabled:opacity-50 tracking-wider uppercase"
                >
                  {feedbackStatus === 'sending' ? 'Enviando...' : 'Enviar Mensaje'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* FOOTER PERFECTAMENTE VISIBLE Y ELEVADO */}
      <footer className="w-full flex flex-col items-center justify-center py-8 pb-12 sm:pb-10 text-[11px] sm:text-xs text-cyan-50/70 font-medium tracking-widest z-20 mt-auto px-4 space-y-2 uppercase bg-gradient-to-t from-black/80 to-transparent">
        <p className="drop-shadow-[0_0_8px_rgba(34,211,238,0.5)] font-bold text-cyan-300">Versión 1.1 Beta</p>
        <p className="text-cyan-50/50">Desarrollado por Mauricio Andrade Luna</p>
      </footer>
    </div>
  );
}