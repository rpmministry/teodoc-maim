'use client';
import { useState, useRef, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import domtoimage from 'dom-to-image-more';

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
  { cita: "Isaías 41:10", texto: "No temas, porque yo estoy contigo; no desmayes, porque yo soy tu Dios que te esfuerzo..." },
  { cita: "Jeremías 29:11", texto: "Porque yo sé los pensamientos que tengo acerca de vosotros, dice Jehová, pensamientos de paz..." },
  { cita: "Romanos 8:28", texto: "Y sabemos que a los que aman a Dios, todas las cosas les ayudan a bien..." },
  { cita: "Josué 1:9", texto: "Mira que te mando que te esfuerces y seas valiente; no temas ni desmayes..." }
];

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultado, setResultado] = useState<PredicaAnalisis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [versoIndex, setVersoIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const infografiaRef = useRef<HTMLDivElement>(null);

  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [feedbackStatus, setFeedbackStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  useEffect(() => {
    let intervaloVerso: NodeJS.Timeout;
    if (loading) {
      intervaloVerso = setInterval(() => {
        setVersoIndex((prev) => (prev + 1) % promesasBiblicas.length);
      }, 7000);
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
        body: JSON.stringify({
          _subject: "💡 Nueva Sugerencia - TeoDoc",
          mensaje: feedbackMsg
        })
      });
      if (res.ok) {
        setFeedbackStatus('success');
        setTimeout(() => {
          setShowFeedbackModal(false);
          setFeedbackStatus('idle');
          setFeedbackMsg('');
        }, 3000);
      } else {
        throw new Error("Error en servidor");
      }
    } catch (err) {
      setFeedbackStatus('error');
    }
  };

  const manejarAnalisis = async () => {
    // Leemos el archivo directo del DOM
    const archivoFinal = fileInputRef.current?.files?.[0] || file;

    if (!archivoFinal) {
      setError('Por favor, selecciona un archivo en el Paso 1 antes de iniciar el análisis.');
      return;
    }

    setFile(archivoFinal);
    setLoading(true);
    setProgress(5);
    setError(null);
    setResultado(null);
    setVersoIndex(0);

    try {
      const timerCloud = setInterval(() => {
        setProgress((prev) => (prev >= 25 ? 25 : prev + 1));
      }, 500);

      const formDataCloud = new FormData();
      formDataCloud.append('file', archivoFinal);
      formDataCloud.append('upload_preset', 'teodoc_preset');

      const resCloud = await fetch('https://api.cloudinary.com/v1_1/antbfat3/auto/upload', {
        method: 'POST',
        body: formDataCloud
      });
      clearInterval(timerCloud);

      if (!resCloud.ok) throw new Error('Error al subir el archivo a la nube de paso.');
      const cloudData = await resCloud.json();
      const audioUrl = cloudData.secure_url;

      setProgress(30);
      const timerTranscribe = setInterval(() => {
        setProgress((prev) => (prev >= 49 ? 49 : prev + 1));
      }, 800);

      const resTranscribe = await fetch('/api/transcribe', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audioUrl }) 
      });
      const rawTextTranscribe = await resTranscribe.text();
      clearInterval(timerTranscribe);

      let dataTranscribe;
      try { 
        dataTranscribe = JSON.parse(rawTextTranscribe); 
      } catch (e) { 
        throw new Error(`Error en el servidor de transcripción: ${rawTextTranscribe.substring(0, 100)}`); 
      }
      if (!resTranscribe.ok) throw new Error(dataTranscribe.error || 'Error en la transcripción.');
      
      const textoTranscrito = dataTranscribe.text;
      setProgress(50);

      const timerAnalyze = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 98) return 98;
          const restante = 99 - prev;
          return prev + Math.max(1, Math.floor(restante * 0.05));
        });
      }, 1000);

      const resAnalyze = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textoTranscrito })
      });
      const rawTextAnalyze = await resAnalyze.text();
      clearInterval(timerAnalyze);

      let dataAnalyze;
      try { 
        dataAnalyze = JSON.parse(rawTextAnalyze); 
      } catch (e) { 
        throw new Error('Error al interpretar el análisis teológico.'); 
      }
      if (!resAnalyze.ok) throw new Error(dataAnalyze.error || 'Error en el análisis.');

      setProgress(100);
      setTimeout(() => {
        setResultado(dataAnalyze);
        setLoading(false);
      }, 500);

    } catch (err: any) {
      setError(err.message || 'Ocurrió un error inesperado en el proceso. El archivo podría ser muy grande.');
      setLoading(false);
      setProgress(0);
    }
  };

  const nuevoAnalisis = () => {
    setFile(null); setResultado(null); setError(null); setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const descargarInfografia = async () => {
    if (!infografiaRef.current) return;
    try {
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

  const generarPDF = () => {
    if (!resultado) return;
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
    <div className="min-h-screen bg-[#0B0C10] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#1C1635] via-[#0B0C10] to-[#070709] text-white font-sans selection:bg-purple-500/30 flex flex-col relative overflow-x-hidden">
      
      <nav className="w-full flex flex-wrap gap-4 justify-between items-center px-4 sm:px-8 py-4 sm:py-6 z-10">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-tr from-purple-600 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30 border border-white/10 shrink-0">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
          </div>
          <span className="font-extrabold text-xl sm:text-2xl tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-gray-100 to-gray-400">TeoDoc</span>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 justify-end">
          <button onClick={() => setShowFeedbackModal(true)} className="group flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white text-[10px] sm:text-sm font-medium transition-all">
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
            <span>Sugerencias</span>
          </button>
          
          <a href="https://collection.cloudinary.com/antbfat3/ee4582aa2bac515291b5d02c058e9c4d" target="_blank" rel="noopener noreferrer" className="group flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-full bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-300 hover:text-blue-200 text-[10px] sm:text-sm font-medium transition-all">
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            <span>Manual</span>
          </a>

          <a href="https://www.paypal.com/ncp/payment/ZTLTVMRR95J2C" target="_blank" rel="noopener noreferrer" className="group flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 sm:px-5 sm:py-2 rounded-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white text-[10px] sm:text-sm font-bold shadow-lg shadow-pink-500/25 transition-all hover:scale-105 border border-white/10">
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:animate-pulse" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
            <span className="hidden lg:inline">Apoyar Proyecto</span>
            <span className="lg:hidden">Apoyar</span>
          </a>
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 z-10 w-full max-w-5xl mx-auto -mt-4 sm:-mt-6">
        
        {!loading && !resultado && (
          <div className="text-center space-y-3 sm:space-y-4 mb-8 sm:mb-12 animate-fade-in-up">
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-extrabold tracking-tight text-white drop-shadow-sm px-2">Analiza tus prédicas.</h1>
            <p className="text-xs sm:text-sm md:text-base text-gray-400 max-w-lg mx-auto font-medium px-4">Transcripción instantánea y extracción de estructura teológica impulsada por IA.</p>
          </div>
        )}

        {!resultado && (
          // Hemos eliminado el form que causaba el reinicio, volvemos a una caja normal div
          <div className="flex flex-col items-center gap-8 relative z-20 w-full">
            
            <div className="relative flex items-center justify-center">
              <div className={`absolute inset-0 rounded-full shadow-[0_0_40px_rgba(147,51,234,0.4)] transition-all duration-500 hover:shadow-[0_0_60px_rgba(147,51,234,0.6)]`}></div>
              
              <button
                type="button" 
                onClick={manejarAnalisis} // Ejecuta la función de manera segura
                disabled={loading}
                className={`relative flex flex-col items-center justify-center w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 rounded-full bg-gradient-to-br from-[#8E44AD] to-[#5B2C6F] shadow-[0_0_40px_rgba(147,51,234,0.4)] transition-all duration-300 z-10 ${loading ? 'cursor-default opacity-80' : 'cursor-pointer hover:scale-105 hover:shadow-[0_0_60px_rgba(147,51,234,0.6)]'}`}
              >
                {loading ? (
                  <div className="flex flex-col items-center justify-center animate-fade-in">
                    <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">{progress}%</span>
                    <span className="text-[9px] sm:text-[10px] uppercase tracking-widest text-purple-200/80 font-semibold mt-0.5">
                      {progress <= 50 ? 'Transcribiendo' : 'Analizando'}
                    </span>
                  </div>
                ) : (
                  // INDICADOR VISUAL NUEVO: Si hay un archivo cargado, el ícono se pintará de verde claro
                  <svg className={`w-8 h-8 sm:w-10 sm:h-10 transition-colors ${file ? 'text-green-400' : 'text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path>
                  </svg>
                )}
              </button>
            </div>

            {loading ? (
              <div className="flex flex-col items-center text-center mt-2 max-w-lg animate-fade-in w-full px-2">
                <span className="text-xs sm:text-sm font-bold text-purple-400 uppercase tracking-widest mb-4 sm:mb-6">
                  {progress <= 50 ? 'Paso 1/2: Subiendo y transcribiendo...' : 'Paso 2/2: Analizando teología y bosquejo...'}
                </span>
                <div className="bg-[#1A1D27]/90 border border-purple-500/20 rounded-2xl p-5 sm:p-6 shadow-xl transition-all duration-500 w-full">
                  <p className="text-gray-200 text-sm sm:text-base md:text-lg font-medium italic mb-3 sm:mb-4 leading-relaxed">"{promesasBiblicas[versoIndex].texto}"</p>
                  <p className="text-purple-400/80 font-bold text-xs sm:text-sm tracking-wide">— {promesasBiblicas[versoIndex].cita}</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-4 w-full px-4">
                
                <div className="text-center w-full flex flex-col items-center justify-center">
                  <span className="text-[11px] sm:text-xs md:text-sm font-bold tracking-widest text-gray-400 uppercase text-center block leading-relaxed">
                    1. Selecciona el archivo de audio <br /> 
                    2. Toca el círculo para iniciar
                  </span>
                </div>
                
                <div className="w-full max-w-[320px] bg-[#1A1C23] rounded-2xl border border-gray-700/50 p-1.5 shadow-lg mx-auto">
                  <input 
                    type="file" 
                    id="archivo-audio-nativo"
                    ref={fileInputRef}
                    accept=".mp3,.wav,.m4a,.aac,.caf,.ogg,.mp4,audio/*,video/*" 
                    className="block w-full text-xs sm:text-sm text-gray-300
                      file:mr-4 file:py-3 file:px-6
                      file:rounded-xl file:border-0
                      file:text-xs file:sm:text-sm file:font-bold file:tracking-wide
                      file:bg-gradient-to-r file:from-purple-600 file:to-indigo-600 file:text-white
                      hover:file:from-purple-500 hover:file:to-indigo-500 file:cursor-pointer file:transition-all
                      cursor-pointer focus:outline-none"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        setFile(e.target.files[0]);
                        setError(null);
                      }
                    }}
                  />
                </div>

              </div>
            )}
            {error && <div className="mt-2 sm:mt-4 px-4 py-2.5 bg-red-900/30 border border-red-500/50 rounded-lg text-red-200 text-xs sm:text-sm w-full max-w-sm text-center mx-auto">{error}</div>}
          </div>
        )}

        {resultado && (
          <div className="w-full mt-6 md:mt-10 mb-12 sm:mb-16 space-y-10 sm:space-y-16 animate-fade-in">
            <div className="bg-[#13161F]/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-gray-800 shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-b from-[#1C1E2A] to-[#13161F] p-5 sm:p-8 md:p-12 border-b border-gray-800">
                <div className="flex flex-col md:flex-row justify-between items-center md:items-start mb-8 sm:mb-10 gap-5 sm:gap-6">
                  
                  <div className="flex flex-col items-center md:items-start text-center md:text-left">
                    <span className="text-[10px] sm:text-xs font-bold text-purple-500 uppercase tracking-[0.2em] mb-1.5 sm:mb-2">Análisis Completado</span>
                    <span className="text-gray-400 text-xs sm:text-sm font-light">Estructura teológica extraída.</span>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row flex-wrap justify-center md:justify-end items-stretch sm:items-center gap-2.5 sm:gap-3 w-full md:w-auto mt-2 md:mt-0">
                    <button onClick={nuevoAnalisis} className="w-full sm:w-auto justify-center bg-transparent hover:bg-white/5 border border-purple-500/30 text-purple-300 hover:text-purple-200 px-4 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-medium transition-colors flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                      Nuevo Audio
                    </button>
                    <button onClick={generarPDF} className="w-full sm:w-auto justify-center bg-white/5 hover:bg-white/10 border border-white/10 text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-medium transition-colors flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4-4m0 0l-4-4m4 4V4"></path></svg>
                      Descargar PDF
                    </button>
                    {resultado.infografia && (
                      <button onClick={descargarInfografia} className="w-full sm:w-auto justify-center bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-medium transition-colors shadow-lg flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                        Exportar Infografía
                      </button>
                    )}
                  </div>

                </div>

                <div className="text-center">
                  <h2 className="text-2xl sm:text-3xl md:text-5xl font-extrabold text-white mb-4 sm:mb-6 leading-tight">{resultado.titulo}</h2>
                  <p className="text-purple-300/90 text-sm sm:text-lg md:text-xl italic max-w-3xl mx-auto font-light leading-relaxed">"{resultado.idea_principal}"</p>
                </div>
              </div>
              
              <div className="p-5 sm:p-8 md:p-12 space-y-8 sm:space-y-12">
                <section>
                  <h3 className="text-xs sm:text-sm font-bold text-gray-400 mb-6 sm:mb-8 uppercase tracking-[0.2em] flex items-center gap-3 sm:gap-4">
                    <span className="w-4 sm:w-8 h-[1px] bg-gray-700"></span>
                    Desarrollo Bíblico
                    <span className="flex-1 h-[1px] bg-gray-700/50"></span>
                  </h3>
                  
                  <div className="grid gap-4 sm:gap-6">
                    {resultado.desarrollo_progresivo.map((item, idx) => (
                      <div key={idx} className="bg-[#1A1D27] p-5 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl border border-gray-800/60 hover:border-purple-500/30 transition-colors">
                        
                        <div className="flex gap-3 sm:gap-4 items-start mb-3 sm:mb-4">
                          <span className="text-purple-400 bg-purple-500/10 border border-purple-500/20 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 text-xs sm:text-sm mt-0.5">{idx + 1}</span>
                          <h4 className="text-lg sm:text-xl font-bold text-gray-100 pt-1 sm:pt-1.5 leading-tight">{item.punto}</h4>
                        </div>
                        
                        <div className="pl-11 sm:pl-14">
                          <p className="text-gray-400 mb-4 sm:mb-6 leading-relaxed font-light text-sm sm:text-base">{item.explicacion}</p>
                          
                          {item.versiculos.length > 0 && (
                            <div className="grid gap-2.5 sm:gap-3">
                              {item.versiculos.map((v, vIdx) => (
                                <div key={vIdx} className="bg-[#141720] p-3.5 sm:p-4 rounded-lg sm:rounded-xl border-l-2 border-purple-500">
                                  <p className="text-xs sm:text-sm font-bold text-purple-400 mb-1 sm:mb-1.5">{v.cita}</p>
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
                  <section className="bg-blue-900/10 p-5 sm:p-8 rounded-xl sm:rounded-2xl border border-blue-900/30">
                    <h3 className="text-xs sm:text-sm font-bold text-blue-400 mb-4 sm:mb-6 uppercase tracking-[0.15em] flex items-center gap-2 sm:gap-3">
                      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
                      Aplicación Práctica
                    </h3>
                    <ul className="space-y-3 sm:space-y-4">
                      {resultado.aplicacion.map((app, idx) => (
                        <li key={idx} className="flex gap-3 sm:gap-4 text-gray-300 font-light leading-relaxed text-sm sm:text-base">
                          <span className="text-blue-500 mt-0.5 sm:mt-1 text-lg leading-none">•</span>
                          <span>{app}</span>
                        </li>
                      ))}
                    </ul>
                  </section>

                  <section className="bg-amber-900/10 p-5 sm:p-8 rounded-xl sm:rounded-2xl border border-amber-900/30">
                    <h3 className="text-xs sm:text-sm font-bold text-amber-400 mb-4 sm:mb-6 uppercase tracking-[0.15em] flex items-center gap-2 sm:gap-3">
                      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
                      Oración Ministerial
                    </h3>
                    <p className="text-gray-300 italic leading-relaxed font-light text-sm sm:text-base">"{resultado.oracion}"</p>
                  </section>
                </div>
              </div>
            </div>

            {resultado.infografia && (
              <div className="w-full pt-6 sm:pt-10 border-t border-gray-800">
                <div className="text-center mb-6 sm:mb-8 px-4">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-300 tracking-widest uppercase">Vista Previa: Póster Digital</h3>
                  <p className="text-xs sm:text-sm text-gray-500 mt-2 max-w-md mx-auto">
                    Diseño adaptativo para visualización y descarga en alta calidad.
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
                        <div className="absolute -left-2 sm:-left-3 top-3 bottom-3 sm:top-4 sm:bottom-4 w-2 sm:w-3" style={{ backgroundColor: '#D4AF37' }}></div>
                        <div className="absolute -right-2 sm:-right-3 top-3 bottom-3 sm:top-4 sm:bottom-4 w-2 sm:w-3" style={{ backgroundColor: '#D4AF37' }}></div>
                        <h1 className="text-2xl sm:text-4xl md:text-5xl font-black uppercase tracking-widest font-sans leading-tight">{resultado.titulo}</h1>
                      </div>

                      <div className="text-center mb-8 sm:mb-12 max-w-2xl px-2">
                        <p className="text-lg sm:text-2xl font-bold italic text-[#725439] leading-snug">
                          "{resultado.infografia.frase_corta || resultado.idea_principal}"
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-8 sm:mb-12 w-full">
                        <div className="bg-white p-6 sm:p-8 rounded-xl border border-gray-200 border-t-[6px] border-t-[#5B778A]">
                          <h3 className="text-xs sm:text-sm font-black uppercase tracking-widest text-[#5B778A] mb-3 sm:mb-4 bg-[#EDF1F3] inline-block px-3 py-1.5 sm:px-4 sm:py-2 rounded">Contexto Histórico</h3>
                          <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
                            {resultado.infografia.contexto_breve || "Enseñanza extraída de las escrituras."}
                          </p>
                        </div>

                        <div style={{ backgroundColor: '#F3EBE1' }} className="p-6 sm:p-8 rounded-xl border border-gray-200 border-l-[6px] border-l-[#D4AF37]">
                          <h3 className="text-xs sm:text-sm font-black uppercase tracking-widest text-[#725439] mb-3 sm:mb-4">📖 Texto Clave (RV1960)</h3>
                          <p className="text-[#2C3E50] font-medium italic text-base sm:text-lg leading-relaxed">
                            "{resultado.infografia.texto_clave || 'Lámpara es a mis pies tu palabra.'}"
                          </p>
                        </div>
                      </div>

                      <div className="bg-white rounded-xl p-6 sm:p-10 border border-[#E8DFC8] w-full">
                        <div className="text-center mb-8 sm:mb-10">
                          <h3 className="text-lg sm:text-xl font-bold uppercase tracking-widest text-[#2C3E50] border-b-2 border-[#D4AF37] pb-2 sm:pb-3 inline-block">El Mensaje Central</h3>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                          {resultado.desarrollo_progresivo.slice(0, 3).map((punto, i) => (
                            <div key={i} className="flex flex-col items-center text-center">
                              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full text-white flex items-center justify-center font-bold text-lg sm:text-xl mb-4 sm:mb-5 shrink-0" style={{ backgroundColor: '#D4AF37' }}>
                                {i + 1}
                              </div>
                              <h4 className="font-bold text-[#5B778A] text-sm sm:text-base uppercase mb-2 sm:mb-3 leading-tight">
                                {punto.punto}
                              </h4>
                              <p className="text-xs sm:text-sm text-gray-700 leading-relaxed text-center">
                                {punto.explicacion}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="mt-8 sm:mt-10 text-[#A69B85] text-[10px] sm:text-xs font-bold tracking-widest flex items-center gap-2">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd"></path></svg>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-[#1A1D27] border border-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">Enviar Sugerencia</h3>
              <button onClick={() => setShowFeedbackModal(false)} className="text-gray-400 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            
            {feedbackStatus === 'success' ? (
              <div className="text-green-400 text-center py-8 font-medium">
                ¡Gracias! Tu mensaje ha sido enviado correctamente.
              </div>
            ) : (
              <form onSubmit={enviarSugerencia} className="flex flex-col gap-4">
                <textarea
                  required
                  value={feedbackMsg}
                  onChange={(e) => setFeedbackMsg(e.target.value)}
                  placeholder="Escribe tu sugerencia, reporte de error o comentario aquí..."
                  className="w-full bg-[#13161F] border border-gray-700 rounded-xl p-3 text-sm text-gray-200 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 min-h-[120px] resize-none"
                ></textarea>
                {feedbackStatus === 'error' && <p className="text-red-400 text-xs">Ocurrió un error de conexión. Inténtalo de nuevo.</p>}
                <button
                  type="submit"
                  disabled={feedbackStatus === 'sending'}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-2.5 rounded-xl text-sm transition-all disabled:opacity-50"
                >
                  {feedbackStatus === 'sending' ? 'Enviando...' : 'Enviar Mensaje'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* FOOTER ACTUALIZADO */}
      <footer className="w-full text-center py-5 sm:py-6 text-[10px] sm:text-xs text-gray-500 font-medium tracking-wide z-10 mt-auto px-4 space-y-1">
        <p>Creado por RPM Ministry</p>
        <p>Diseño y desarrollo por Mauricio Andrade Luna</p>
      </footer>
    </div>
  );
}