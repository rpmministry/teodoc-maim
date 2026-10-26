'use client';

import { useEffect, useRef, useState } from 'react';
import FormularioAnalisis, { type EstadoAudioFormulario, type ValoresFormulario } from '@/components/formulario-analisis';
import PanelResultados from '@/components/resultados/panel';
import { IconoCheck, IconoDescarga, IconoFlecha, LogoMaim, MarcaProducto } from '@/components/marca';
import { nombreArchivoPdf, normalizarPredicador, normalizarTituloProporcionado } from '@/lib/modalidades';
import { normalizarMetadatos, normalizarRespuesta } from '@/lib/normalizar';
import type { ResultadoAnalisis } from '@/lib/tipos';
import { guardarUltimoAnalisis, obtenerUltimoAnalisis, limpiarUltimoAnalisis, guardarTranscripcionPendiente, obtenerTranscripcionPendiente, limpiarTranscripcionPendiente } from '@/lib/analisis-storage';
import { adquirirPantallaActiva, liberarPantallaActiva } from '@/lib/wake-lock';
import { subirAudio, validarArchivo } from '@/lib/audio-upload';
import { compartirArchivo, crearArchivo, descargarArchivo, puedeCompartirArchivos } from '@/lib/entrega';
import { validarFormulario } from '@/lib/validacion-formulario';
import { IDENTIDAD_MAIM } from '@/lib/institucional';

const FORMULARIO_INICIAL: ValoresFormulario = {
  titulo: '',
  predicador: '',
  fecha: '',
  texto: '',
  modalidad: 'general',
  rangoEdad: '6-8',
};

const TITULO_BASE = 'TeoDoc MAIM — Análisis bíblico y materiales de estudio';

interface ArchivoListo {
  nombre: string;
  file: File;
  url: string;
}

interface Aviso {
  tipo: 'ok' | 'error';
  mensaje: string;
}

export default function Inicio() {
  const [formulario, setFormulario] = useState<ValoresFormulario>(FORMULARIO_INICIAL);
  const [resultado, setResultado] = useState<ResultadoAnalisis | null>(null);
  const [cargando, setCargando] = useState(false);
  const [progreso, setProgreso] = useState(0);
  const [errores, setErrores] = useState<string[]>([]);
  const [errorServicio, setErrorServicio] = useState<string | null>(null);
  const [advertenciaValidacion, setAdvertenciaValidacion] = useState<string | null>(null);
  const [textoPendiente, setTextoPendiente] = useState<string | null>(null);
  const [estadoAudio, setEstadoAudio] = useState<EstadoAudioFormulario>({ activo: false, progreso: 0 });
  const [descargando, setDescargando] = useState<'general' | 'modalidad' | null>(null);
  const [ultimoArchivo, setUltimoArchivo] = useState<ArchivoListo | null>(null);
  const [mostrarPreview, setMostrarPreview] = useState(false);
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const archivoUrlRef = useRef<string | null>(null);

  const detenerProgreso = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const iniciarProgreso = (desde: number) => {
    detenerProgreso();
    setProgreso(desde);
    timerRef.current = setInterval(() => {
      setProgreso((valor) => (valor >= 96 ? 96 : valor + Math.max(1, Math.floor((97 - valor) * 0.06))));
    }, 1000);
  };

  useEffect(() => {
    const temporizador = window.setTimeout(() => {
      const previo = obtenerUltimoAnalisis<Record<string, unknown>>();
      if (previo && typeof previo === 'object') {
        const metadatos = normalizarMetadatos(previo.metadatos);
        setResultado(normalizarRespuesta(previo, metadatos));
      }
      const pendiente = obtenerTranscripcionPendiente();
      if (pendiente) {
        setFormulario((valor) => ({ ...valor, texto: pendiente }));
        setTextoPendiente(pendiente);
      }
    }, 0);
    return () => {
      window.clearTimeout(temporizador);
      detenerProgreso();
      void liberarPantallaActiva();
    };
  }, []);

  useEffect(() => {
    if (!aviso || aviso.tipo !== 'ok') return;
    const temporizador = window.setTimeout(() => setAviso(null), 12_000);
    return () => window.clearTimeout(temporizador);
  }, [aviso]);

  useEffect(() => {
    if (!mostrarPreview) return;
    const alPresionar = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMostrarPreview(false);
    };
    window.addEventListener('keydown', alPresionar);
    return () => window.removeEventListener('keydown', alPresionar);
  }, [mostrarPreview]);

  useEffect(() => {
    if (!ultimoArchivo) return;
    return () => {
      URL.revokeObjectURL(ultimoArchivo.url);
    };
  }, [ultimoArchivo]);

  const cambiarFormulario = (cambio: Partial<ValoresFormulario>) => {
    setFormulario((valor) => ({ ...valor, ...cambio }));
    setErrores([]);
    setErrorServicio(null);
    setAdvertenciaValidacion(null);
  };

  const procesarAudio = async (archivo: File) => {
    setErrores([]);
    setErrorServicio(null);
    setAdvertenciaValidacion(null);
    const errorFormato = validarArchivo(archivo);
    if (errorFormato) {
      setEstadoAudio({ activo: false, progreso: 0, nombre: archivo.name, error: errorFormato });
      return;
    }

    setCargando(true);
    setProgreso(6);
    setEstadoAudio({ activo: true, progreso: 6, nombre: archivo.name, mensaje: 'Subiendo audio…' });
    void adquirirPantallaActiva();

    try {
      const { audioUrl } = await subirAudio(archivo, (porcentaje) => {
        setEstadoAudio((valor) => ({ ...valor, activo: true, progreso: porcentaje, mensaje: 'Subiendo audio…' }));
        setProgreso(Math.max(6, Math.min(38, porcentaje)));
      });

      setEstadoAudio((valor) => ({ ...valor, activo: true, progreso: 52, mensaje: 'Transcribiendo el mensaje…' }));
      setProgreso(48);
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 150_000);
      let data: { text?: string; error?: string } | null = null;
      try {
        const respuesta = await fetch('/api/transcribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ audioUrl }),
          signal: controller.signal,
        });
        data = await respuesta.json().catch(() => null);
        if (!respuesta.ok || !data?.text) {
          throw new Error(data?.error || 'No se pudo transcribir el audio. Intenta de nuevo o pega la transcripción.');
        }
      } catch (error) {
        if ((error as { name?: string })?.name === 'AbortError') {
          throw new Error('La transcripción tardó más de lo permitido. Puedes intentar con un audio más corto o pegar el texto.');
        }
        throw error;
      } finally {
        window.clearTimeout(timeout);
      }

      setFormulario((valor) => ({ ...valor, texto: data?.text || '' }));
      guardarTranscripcionPendiente(data.text || '');
      setTextoPendiente(data.text || '');
      setEstadoAudio({ activo: false, progreso: 100, nombre: archivo.name, mensaje: 'Transcripción lista. Revísala y corrige nombres o citas antes de generar el estudio.' });
      setProgreso(100);
      setErrores([]);
    } catch (error) {
      setEstadoAudio({
        activo: false,
        progreso: 0,
        nombre: archivo.name,
        error: error instanceof Error ? error.message : 'No se pudo procesar el audio. Revisa tu conexión o intenta con un MP3 más liviano.',
      });
      setProgreso(0);
    } finally {
      setCargando(false);
      void liberarPantallaActiva();
    }
  };

  const analizar = async (opciones: { texto?: string; forzar?: boolean; reintento?: boolean } = {}) => {
    if (cargando) return;
    const texto = (opciones.texto ?? formulario.texto).trim();
    const validacion = validarFormulario({ ...formulario, texto });
    if (!validacion.valido) {
      setErrores(validacion.errores);
      setErrorServicio(null);
      if (!resultado) document.getElementById('formulario-analisis')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    setErrores([]);
    setErrorServicio(null);
    setAdvertenciaValidacion(null);
    if (opciones.texto && opciones.texto !== formulario.texto) {
      setFormulario((valor) => ({ ...valor, texto }));
    }
    if (!opciones.reintento) setResultado(null);
    setCargando(true);
    setProgreso(10);
    void adquirirPantallaActiva();
    document.title = 'Generando análisis… · TeoDoc MAIM';

    try {
      if (!opciones.forzar) {
        try {
          const controlValida = new AbortController();
          const timeoutValida = window.setTimeout(() => controlValida.abort(), 25_000);
          const respuestaValida = await fetch('/api/validate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: texto }),
            signal: controlValida.signal,
          });
          window.clearTimeout(timeoutValida);
          if (respuestaValida.ok) {
            const dataValida = await respuestaValida.json().catch(() => null);
            if (dataValida && dataValida.valido === false) {
              const motivo = dataValida.motivo === 'no_relacionado'
                ? 'El contenido no parece una enseñanza cristiana analizable. Puedes continuar si consideras que es un mensaje válido.'
                : 'La transcripción parece demasiado corta o incompleta para un análisis responsable. Puedes añadir más contenido o continuar bajo tu criterio.';
              setAdvertenciaValidacion(motivo);
              setCargando(false);
              setProgreso(0);
              void liberarPantallaActiva();
              document.title = TITULO_BASE;
              return;
            }
          }
        } catch {}
      }

      iniciarProgreso(42);
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 295_000);
      let respuesta: Response;
      try {
        respuesta = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: texto,
            modalidad: formulario.modalidad,
            rangoEdad: formulario.modalidad === 'ninos' ? formulario.rangoEdad : undefined,
            titulo: normalizarTituloProporcionado(formulario.titulo),
            predicador: normalizarPredicador(formulario.predicador),
            fecha: formulario.fecha,
          }),
          signal: controller.signal,
        });
      } catch (error) {
        if ((error as { name?: string })?.name === 'AbortError') {
          throw new Error('El análisis tardó más de lo permitido. Puedes reintentar con la transcripción ya cargada.');
        }
        throw error;
      } finally {
        window.clearTimeout(timeout);
      }

      const data = await respuesta.json().catch(() => null);
      if (!respuesta.ok) {
        if (respuesta.status === 429) throw new Error('Hay demasiadas solicitudes en este momento. Espera un minuto y vuelve a intentarlo.');
        if (respuesta.status === 413) throw new Error('La transcripción supera el tamaño permitido. Reduce el texto antes de continuar.');
        if (respuesta.status === 400 && data?.error) throw new Error(data.error);
        if (data?.error === 'busy' || respuesta.status === 503) {
          throw new Error('No se pudo completar el análisis porque el servicio está ocupado. Verifica la configuración de los proveedores de IA o intenta de nuevo más tarde.');
        }
        throw new Error(data?.error || 'No se pudo completar el análisis. Intenta de nuevo.');
      }
      if (!data || typeof data !== 'object') throw new Error('El servidor devolvió una respuesta vacía. Intenta de nuevo.');

      detenerProgreso();
      setProgreso(98);
      const metadatos = normalizarMetadatos({
        modalidad: formulario.modalidad,
        rangoEdad: formulario.modalidad === 'ninos' ? formulario.rangoEdad : undefined,
        predicador: normalizarPredicador(formulario.predicador),
        titulo: normalizarTituloProporcionado(formulario.titulo),
        fecha: formulario.fecha,
        fechaAnalisis: (data.metadatos as { fechaAnalisis?: string } | undefined)?.fechaAnalisis,
      });
      const normalizado = normalizarRespuesta(data, metadatos);
      const tituloFinal = normalizarTituloProporcionado(formulario.titulo);
      if (tituloFinal) normalizado.titulo = tituloFinal;
      normalizado.metadatos = {
        ...normalizado.metadatos,
        ...metadatos,
        tituloProporcionado: tituloFinal || undefined,
      };

      guardarUltimoAnalisis(normalizado);
      guardarTranscripcionPendiente(texto);
      setTextoPendiente(texto);
      setResultado(normalizado);
      setProgreso(100);
      setCargando(false);
      document.title = TITULO_BASE;
      if (document.hidden) {
        document.title = 'Análisis listo · TeoDoc MAIM';
        try { navigator.vibrate?.([100, 50, 100]); } catch {}
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      detenerProgreso();
      setProgreso(0);
      setTextoPendiente(texto);
      setErrorServicio(error instanceof Error ? error.message : 'No se pudo completar el análisis. Intenta de nuevo.');
      setCargando(false);
      document.title = TITULO_BASE;
    } finally {
      detenerProgreso();
      void liberarPantallaActiva();
    }
  };

  const nuevoAnalisis = () => {
    limpiarUltimoAnalisis();
    limpiarTranscripcionPendiente();
    void liberarPantallaActiva();
    setResultado(null);
    setErrores([]);
    setErrorServicio(null);
    setAdvertenciaValidacion(null);
    setTextoPendiente(null);
    setFormulario(FORMULARIO_INICIAL);
    setEstadoAudio({ activo: false, progreso: 0 });
    setProgreso(0);
    setDescargando(null);
    setMostrarPreview(false);
    setUltimoArchivo(null);
    setAviso(null);
    document.title = TITULO_BASE;
    window.setTimeout(() => document.getElementById('crear')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  };

  const limpiarDatosLocales = () => {
    nuevoAnalisis();
    setAviso({ tipo: 'ok', mensaje: 'Se borraron los datos guardados en este navegador.' });
  };

  const descargar = async (tipo: 'general' | 'modalidad') => {
    if (!resultado || descargando) return;
    setDescargando(tipo);
    setAviso(null);
    try {
      const pdf = await import('@/lib/pdf');
      const recursos = await pdf.cargarRecursosPdf();
      const metadatos = tipo === 'general'
        ? { ...resultado.metadatos, modalidad: 'general' as const, rangoEdad: undefined, tituloProporcionado: resultado.titulo }
        : { ...resultado.metadatos, tituloProporcionado: resultado.titulo };
      const analisis = { ...resultado, metadatos };
      const blob = tipo === 'general'
        ? pdf.construirPdfGeneralDocumento({ analisis, metadatos, recursos })
        : pdf.construirPdfModalidad({ analisis, metadatos, recursos });
      const nombre = tipo === 'general' ? nombreArchivoPdf('general') : nombreArchivoPdf(resultado.metadatos.modalidad);
      descargarArchivo(blob, nombre);
      if (archivoUrlRef.current) URL.revokeObjectURL(archivoUrlRef.current);
      const url = URL.createObjectURL(blob);
      archivoUrlRef.current = url;
      setUltimoArchivo({ nombre, file: crearArchivo(blob, nombre), url });
      setAviso({ tipo: 'ok', mensaje: `PDF listo: ${nombre}` });
    } catch (error) {
      setAviso({ tipo: 'error', mensaje: error instanceof Error ? error.message : 'No se pudo generar el PDF.' });
    } finally {
      setDescargando(null);
    }
  };

  const compartirUltimo = async () => {
    if (!ultimoArchivo) return;
    const compartido = await compartirArchivo(ultimoArchivo.file, ultimoArchivo.nombre);
    setAviso({
      tipo: compartido ? 'ok' : 'error',
      mensaje: compartido ? 'Archivo enviado al panel de compartir.' : 'Tu navegador no pudo abrir el panel de compartir. Usa la vista previa para guardar el PDF.',
    });
  };

  const reintentarModalidad = () => {
    if (!formulario.texto.trim()) {
      setErrorServicio('La transcripción de esta sesión ya no está disponible. Vuelve a cargar el texto para regenerar la modalidad.');
      setResultado(null);
      window.setTimeout(() => document.getElementById('crear')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
      return;
    }
    void analizar({ texto: formulario.texto, forzar: true, reintento: true });
  };

  const mensajeProgreso = estadoAudio.activo
    ? estadoAudio.mensaje || 'Procesando el audio…'
    : progreso < 25
      ? 'Preparando la solicitud…'
      : progreso < 50
        ? 'Validando el contenido…'
        : progreso < 72
          ? 'Analizando la enseñanza…'
          : progreso < 92
            ? 'Redactando el material especializado…'
            : 'Finalizando el documento…';

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-[var(--linea)] bg-[rgba(255,248,232,0.9)] backdrop-blur-md">
        <div className="contenedor flex h-[74px] items-center justify-between gap-4">
          <a href="#inicio" className="flex items-center gap-2.5" aria-label="TeoDoc MAIM, ir al inicio">
            <LogoMaim tamano="pequeno" />
            <span className="hidden h-8 w-px bg-[#ddc8ba] sm:block" aria-hidden="true" />
            <span className="hidden sm:block"><MarcaProducto compacta /></span>
            <span className="text-[16px] font-semibold tracking-[-0.02em] text-[var(--tinta)] sm:hidden">TeoDoc <span className="text-[var(--coralOscuro)]">MAIM</span></span>
          </a>
          <nav className="flex items-center gap-1 text-[12px] font-medium text-[var(--texto)]" aria-label="Navegación principal">
            <a href="#como-funciona" className="hidden rounded-full px-3 py-2 transition hover:bg-white/70 hover:text-[var(--tinta)] md:block">Cómo funciona</a>
            <a href="#identidad" className="hidden rounded-full px-3 py-2 transition hover:bg-white/70 hover:text-[var(--tinta)] md:block">Identidad</a>
            <a href="#privacidad" className="hidden rounded-full px-3 py-2 transition hover:bg-white/70 hover:text-[var(--tinta)] lg:block">Privacidad</a>
            {resultado ? (
              <button type="button" onClick={nuevoAnalisis} className="btn-primario ml-2 px-4 py-2 text-[12px]">Nuevo estudio</button>
            ) : (
              <a href="#crear" className="btn-primario ml-2 px-4 py-2 text-[12px]">Crear estudio</a>
            )}
          </nav>
        </div>
      </header>

      <main>
        {!resultado && (
          <section id="inicio" className="contenedor grid gap-10 pb-12 pt-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:pb-16 lg:pt-16">
            <div>
              <p className="flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.17em] text-[var(--coralOscuro)]">
                <span className="h-px w-8 bg-[var(--coral)]" aria-hidden="true" />
                Análisis bíblico para el ministerio
              </p>
              <h1 className="mt-5 max-w-2xl text-[clamp(2.5rem,1.6rem+3.4vw,4.35rem)] font-semibold leading-[1.02] tracking-[-0.045em] text-[var(--tinta)]">
                De la prédica al <span className="text-[var(--coralOscuro)]">estudio que transforma.</span>
              </h1>
              <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-[var(--texto)] sm:text-[16px]">
                Convierte la transcripción de un mensaje en un análisis fiel y en materiales listos para enseñar. Cinco modalidades, un mismo contenido real y un PDF preparado para tu equipo.
              </p>
              <div className="mt-7 flex flex-wrap gap-2">
                {['Análisis general', 'Grupos pequeños', 'Jóvenes', 'Niños', 'Devocionales de 7 días'].map((etiqueta) => (
                  <span key={etiqueta} className="rounded-full border border-[#e1c9bb] bg-white/60 px-3 py-1.5 text-[10.5px] font-semibold text-[var(--texto)]">{etiqueta}</span>
                ))}
              </div>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <a href="#crear" className="btn-primario justify-center px-5 py-3 text-[13px]">
                  Preparar mi estudio <IconoFlecha />
                </a>
                <a href="#como-funciona" className="btn-secundario justify-center px-5 py-3 text-[13px]">Ver cómo funciona</a>
              </div>
              <p className="mt-4 flex items-center gap-1.5 text-[11px] text-[var(--muted)]">
                <IconoCheck className="h-3.5 w-3.5 text-[var(--coralOscuro)]" />
                Sin inventar biografías, citas ni doctrina. El contenido se basa en la transcripción.
              </p>
            </div>

            <aside className="relative overflow-hidden rounded-[22px] border border-[#e6cdbf] bg-[#fffdf8] p-6 shadow-[0_24px_70px_rgba(76,43,36,0.1)] sm:p-7">
              <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[var(--cremaOficial)] opacity-60" aria-hidden="true" />
              <div className="relative">
                <LogoMaim tamano="mediano" />
                <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--coralOscuro)]">Identidad institucional verificada</p>
                <h2 className="mt-1.5 text-[20px] font-semibold leading-tight tracking-[-0.02em] text-[var(--tinta)]">{IDENTIDAD_MAIM.nombre}</h2>
                <p className="mt-3 text-[12.5px] leading-relaxed text-[var(--texto)]">{IDENTIDAD_MAIM.descripcion}</p>
                <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-[var(--linea)] pt-4 text-[10.5px] text-[var(--muted)]">
                  <span className="rounded-full bg-[var(--superficie)] px-2.5 py-1 font-semibold text-[var(--coralOscuro)]">Organización religiosa</span>
                  <a href={IDENTIDAD_MAIM.urlOficial} target="_blank" rel="noopener noreferrer" className="font-semibold underline decoration-[#d7b8aa] underline-offset-4 hover:text-[var(--coralOscuro)]">Página oficial</a>
                </div>
                <p className="mt-2 text-[10px] text-[var(--muted)]">Fuente consultada el {IDENTIDAD_MAIM.consultado}.</p>
              </div>
            </aside>
          </section>
        )}

        <section id="crear" className="contenedor scroll-mt-24 pb-12">
          {!resultado && (
            <div className="mb-7 max-w-2xl">
              <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-[var(--coralOscuro)]">Crea el material</p>
              <h2 className="mt-2 text-[clamp(1.75rem,1.3rem+1.4vw,2.5rem)] font-semibold tracking-[-0.035em] text-[var(--tinta)]">Prepara tu estudio en tres decisiones.</h2>
              <p className="mt-2 text-[13.5px] leading-relaxed text-[var(--muted)]">Aporta el contenido real, elige cómo lo vas a enseñar y descarga el documento. El análisis general siempre queda incluido.</p>
            </div>
          )}

          {errorServicio && (
            <div className="mb-5 rounded-[12px] border border-[#e8b4b8] bg-[#fff4f4] px-4 py-3.5" role="alert">
              <p className="text-[12px] font-semibold text-[#8f2830]">No se pudo completar la operación</p>
              <p className="mt-1 text-[12px] leading-relaxed text-[#7a3036]">{errorServicio}</p>
              {textoPendiente && (
                <button type="button" onClick={() => void analizar({ texto: textoPendiente, forzar: true, reintento: Boolean(resultado) })} className="mt-2.5 text-[12px] font-semibold text-[var(--coralOscuro)] underline underline-offset-4">
                  Reintentar con la transcripción cargada
                </button>
              )}
            </div>
          )}

          {advertenciaValidacion && (
            <div className="mb-5 rounded-[12px] border border-[#e5c49c] bg-[#fff8ec] px-4 py-3.5" role="alert">
              <p className="text-[12px] font-semibold text-[#6f4b22]">La validación no reconoció un mensaje completo</p>
              <p className="mt-1 text-[12px] leading-relaxed text-[#6f4b22]">{advertenciaValidacion}</p>
              <button type="button" onClick={() => void analizar({ forzar: true })} className="mt-2.5 text-[12px] font-semibold text-[var(--coralOscuro)] underline underline-offset-4">
                Continuar de todos modos
              </button>
            </div>
          )}

          {resultado ? (
            <div className="animar-entrada">
              <PanelResultados
                resultado={resultado}
                descargando={descargando}
                onNuevo={nuevoAnalisis}
                onDescargarGeneral={() => void descargar('general')}
                onDescargarModalidad={() => void descargar('modalidad')}
                onReintentarModalidad={reintentarModalidad}
              />
            </div>
          ) : (
            <FormularioAnalisis
              valores={formulario}
              onCambio={cambiarFormulario}
              onArchivo={(archivo) => void procesarAudio(archivo)}
              onAnalizar={() => void analizar()}
              cargando={cargando}
              estadoAudio={estadoAudio}
              errores={errores}
            />
          )}
        </section>

        <section id="como-funciona" className="contenedor scroll-mt-24 pb-16">
          <div className="rounded-[22px] border border-[var(--linea)] bg-[#fffdf8] p-6 sm:p-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-[var(--coralOscuro)]">Cómo funciona</p>
                <h2 className="mt-2 text-[28px] font-semibold tracking-[-0.03em] text-[var(--tinta)]">Del audio al material, sin atajos.</h2>
              </div>
              <p className="max-w-md text-[12px] leading-relaxed text-[var(--muted)]">Cada etapa conserva la trazabilidad del contenido. No se generan datos que la prédica no sostenga.</p>
            </div>
            <div className="mt-7 grid gap-4 md:grid-cols-3">
              {[
                { numero: '01', titulo: 'Aporta el contenido real', texto: 'Escribe, pega la transcripción o sube el audio. TeoDoc transcribe y tú revisas antes de continuar.' },
                { numero: '02', titulo: 'Elige la modalidad', texto: 'El análisis general se mantiene. La modalidad añade el desarrollo específico para el público que vas a acompañar.' },
                { numero: '03', titulo: 'Descarga y enseña', texto: 'Obtén un PDF con portada institucional, contenido completo y numeración. Revísalo pastoralmente antes de usarlo.' },
              ].map((paso) => (
                <div key={paso.numero} className="rounded-[14px] bg-[var(--superficie)] p-5">
                  <span className="text-[11px] font-bold tracking-[0.1em] text-[var(--coralOscuro)]">{paso.numero}</span>
                  <h3 className="mt-3 text-[15px] font-semibold text-[var(--tinta)]">{paso.titulo}</h3>
                  <p className="mt-2 text-[12.5px] leading-relaxed text-[var(--texto)]">{paso.texto}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="identidad" className="contenedor scroll-mt-24 pb-16">
          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-[22px] border border-[#e6cdbf] bg-[#fffdf8] p-6 sm:p-8">
              <div className="flex flex-wrap items-center gap-3">
                <LogoMaim tamano="pequeno" />
                <div>
                  <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-[var(--coralOscuro)]">Identidad institucional</p>
                  <h2 className="text-[22px] font-semibold tracking-[-0.025em] text-[var(--tinta)]">{IDENTIDAD_MAIM.nombre}</h2>
                </div>
              </div>
              <p className="mt-5 text-[14px] leading-[1.8] text-[var(--texto)]">{IDENTIDAD_MAIM.descripcion}</p>
              <dl className="mt-6 grid gap-4 border-t border-[var(--linea)] pt-5 sm:grid-cols-2">
                <div><dt className="text-[9.5px] font-bold uppercase tracking-[0.11em] text-[var(--muted)]">Categoría pública</dt><dd className="mt-1 text-[12.5px] text-[var(--tinta)]">{IDENTIDAD_MAIM.categoria}</dd></div>
                <div><dt className="text-[9.5px] font-bold uppercase tracking-[0.11em] text-[var(--muted)]">Fuente</dt><dd className="mt-1 text-[12.5px] text-[var(--tinta)]"><a href={IDENTIDAD_MAIM.urlOficial} target="_blank" rel="noopener noreferrer" className="underline decoration-[#d7b8aa] underline-offset-4 hover:text-[var(--coralOscuro)]">{IDENTIDAD_MAIM.fuente}</a></dd></div>
                <div><dt className="text-[9.5px] font-bold uppercase tracking-[0.11em] text-[var(--muted)]">Fecha de consulta</dt><dd className="mt-1 text-[12.5px] text-[var(--tinta)]">{IDENTIDAD_MAIM.consultado}</dd></div>
                <div><dt className="text-[9.5px] font-bold uppercase tracking-[0.11em] text-[var(--muted)]">Color institucional</dt><dd className="mt-1 flex items-center gap-2 text-[12.5px] text-[var(--tinta)]"><span className="h-3.5 w-3.5 rounded-full border border-white/60 bg-[var(--coral)]" />Coral y crema del logotipo oficial</dd></div>
              </dl>
            </div>
            <div className="flex flex-col gap-4">
              <div className="rounded-[22px] bg-[var(--tinta)] p-6 text-white sm:p-8">
                <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#ffd8a8]">Criterio editorial</p>
                <h2 className="mt-2 text-[21px] font-semibold tracking-[-0.02em]">Fidelidad antes que relleno.</h2>
                <ul className="mt-4 space-y-3 text-[12.5px] leading-relaxed text-white/80">
                  <li className="flex gap-2"><IconoCheck className="mt-0.5 h-4 w-4 shrink-0 text-[var(--coral)]" />El nombre del expositor se usa solo para identificar la fuente. No se genera una biografía.</li>
                  <li className="flex gap-2"><IconoCheck className="mt-0.5 h-4 w-4 shrink-0 text-[var(--coral)]" />No se inventan citas, versículos, autores ni doctrina que la transcripción no sostenga.</li>
                  <li className="flex gap-2"><IconoCheck className="mt-0.5 h-4 w-4 shrink-0 text-[var(--coral)]" />El material es un apoyo: debe revisarse a la luz de la Biblia y con acompañamiento pastoral.</li>
                </ul>
              </div>
              <div className="rounded-[22px] border border-[var(--linea)] bg-[#f7eee2] p-5 text-[12px] leading-relaxed text-[var(--texto)]">
                <p className="font-semibold text-[var(--tinta)]">Sobre el logotipo y los colores</p>
                <p className="mt-1.5">Se usan los materiales oficiales publicados por {IDENTIDAD_MAIM.nombre} en su página de Facebook. No se redibujó ni se alteró el logotipo. Los colores se tomaron de esos archivos.</p>
              </div>
            </div>
          </div>
        </section>

        <section id="privacidad" className="contenedor scroll-mt-24 pb-20">
          <div className="rounded-[22px] border border-[var(--linea)] bg-[#fbf4e9] p-6 sm:p-8">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-[var(--coralOscuro)]">Privacidad y cuidado</p>
            <div className="mt-3 grid gap-6 md:grid-cols-[1.1fr_0.9fr]">
              <div>
                <h2 className="text-[24px] font-semibold tracking-[-0.03em] text-[var(--tinta)]">Tu transcripción no se queda en el servidor.</h2>
                <p className="mt-2 max-w-2xl text-[12.5px] leading-relaxed text-[var(--texto)]">TeoDoc procesa el contenido para generar el estudio. El último resultado se guarda en este navegador durante 48 horas para recuperarlo ante una recarga o bloqueo de pantalla. Si subes audio, este se envía a Cloudinary y al proveedor de transcripción configurado.</p>
              </div>
              <div className="flex flex-col justify-between gap-4">
                <ul className="space-y-2 text-[12px] leading-relaxed text-[var(--texto)]">
                  <li>No publiques datos personales sensibles en la transcripción.</li>
                  <li>Verifica siempre las citas bíblicas y las afirmaciones antes de enseñar.</li>
                  <li>Puedes borrar el resultado local en cualquier momento.</li>
                </ul>
                <button type="button" onClick={limpiarDatosLocales} className="btn-secundario w-fit">Borrar datos de este navegador</button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--linea)] bg-[#fffdf8]">
        <div className="contenedor flex flex-col gap-5 py-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <LogoMaim tamano="pequeno" />
            <div>
              <MarcaProducto compacta />
              <p className="mt-1 text-[10.5px] text-[var(--muted)]">Análisis bíblico y materiales para el ministerio</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-[var(--muted)]">
            <a href={IDENTIDAD_MAIM.urlOficial} target="_blank" rel="noopener noreferrer" className="hover:text-[var(--coralOscuro)]">Facebook oficial</a>
            <a href="#identidad" className="hover:text-[var(--coralOscuro)]">Identidad</a>
            <a href="#privacidad" className="hover:text-[var(--coralOscuro)]">Privacidad</a>
            <span>© {new Date().getFullYear()} TeoDoc MAIM</span>
          </div>
        </div>
      </footer>

      {cargando && (
        <div className="fixed bottom-4 left-1/2 z-40 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-[14px] border border-white/10 bg-[var(--tinta)] px-4 py-3.5 text-white shadow-[0_20px_60px_rgba(43,31,30,0.35)]" aria-live="polite">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[12px] font-medium">{mensajeProgreso}</p>
            <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-white/10 px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.08em] text-white/80"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#8be3b0]" />Pantalla activa</span>
          </div>
          <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white/15">
            <div className="h-full rounded-full bg-[var(--coral)] transition-all duration-500" style={{ width: `${Math.max(4, Math.min(100, progreso))}%` }} />
          </div>
        </div>
      )}

      {aviso && (
        <div className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-xl rounded-[14px] border border-[#e2c9b9] bg-[#fffdf8] p-4 shadow-[0_20px_60px_rgba(76,43,36,0.22)]" role="status">
          <div className="flex items-start gap-3">
            <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${aviso.tipo === 'ok' ? 'bg-[#e8f5e9] text-[#2f6b3a]' : 'bg-[#fff0f0] text-[#8f2830]'}`}>
              {aviso.tipo === 'ok' ? <IconoCheck /> : <span className="text-lg leading-none">!</span>}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[12.5px] font-semibold text-[var(--tinta)]">{aviso.tipo === 'ok' ? 'Archivo disponible' : 'No se pudo completar'}</p>
              <p className="mt-0.5 break-words text-[11.5px] leading-relaxed text-[var(--texto)]">{aviso.mensaje}</p>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-[11.5px] font-semibold text-[var(--coralOscuro)]">
                {aviso.tipo === 'ok' && ultimoArchivo && (
                  <>
                    <button type="button" onClick={() => setMostrarPreview(true)} className="underline underline-offset-4">Ver PDF</button>
                    {puedeCompartirArchivos() && <button type="button" onClick={() => void compartirUltimo()} className="underline underline-offset-4">Compartir</button>}
                    <button type="button" onClick={() => descargarArchivo(ultimoArchivo.file, ultimoArchivo.nombre)} className="inline-flex items-center gap-1 underline underline-offset-4"><IconoDescarga className="h-3.5 w-3.5" />Descargar de nuevo</button>
                  </>
                )}
                <button type="button" onClick={() => setAviso(null)} className="text-[var(--muted)] underline underline-offset-4">Cerrar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {mostrarPreview && ultimoArchivo && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#1c1110]/70 p-3 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="preview-title" onClick={() => setMostrarPreview(false)}>
          <div className="flex max-h-[94vh] w-full max-w-4xl flex-col overflow-hidden rounded-[18px] bg-[var(--crema)] shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between gap-3 border-b border-[var(--linea)] px-4 py-3">
              <div>
                <p className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-[var(--coralOscuro)]">Vista previa</p>
                <h3 id="preview-title" className="text-[13px] font-semibold text-[var(--tinta)]">{ultimoArchivo.nombre}</h3>
              </div>
              <button type="button" onClick={() => setMostrarPreview(false)} className="rounded-full border border-[var(--linea)] px-3 py-1.5 text-[11px] font-semibold text-[var(--texto)] hover:bg-white">Cerrar</button>
            </div>
            <div className="min-h-[50vh] flex-1 bg-[#e8dfd3] p-2">
              <iframe src={`${ultimoArchivo.url}#toolbar=1&navpanes=0`} title={`Vista previa de ${ultimoArchivo.nombre}`} className="h-[68vh] w-full rounded-[10px] bg-white" />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--linea)] px-4 py-3">
              <a href={ultimoArchivo.url} target="_blank" rel="noopener noreferrer" className="text-[11px] font-semibold text-[var(--coralOscuro)] underline underline-offset-4">Si el visor no carga, abrir el PDF</a>
              <div className="flex gap-2">
                {puedeCompartirArchivos() && <button type="button" onClick={() => void compartirUltimo()} className="btn-secundario">Compartir</button>}
                <button type="button" onClick={() => descargarArchivo(ultimoArchivo.file, ultimoArchivo.nombre)} className="btn-primario"><IconoDescarga />Descargar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
