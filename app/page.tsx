'use client';

import { useEffect, useRef, useState } from 'react';
import FormularioAnalisis, { type EstadoAudioFormulario, type ValoresFormulario } from '@/components/formulario-analisis';
import PanelResultados from '@/components/resultados/panel';
import BibliotecaDocumentos from '@/components/resultados/biblioteca';
import { IconoCheck, IconoDescarga, IconoFlecha, LogoMaim, MarcaProducto } from '@/components/marca';
import { MODALIDADES, nombreArchivoPdf, nombreArchivoWord, normalizarPredicador, normalizarTituloProporcionado, obtenerModalidad } from '@/lib/modalidades';
import { normalizarMetadatos, normalizarRespuesta } from '@/lib/normalizar';
import type { ResultadoAnalisis } from '@/lib/tipos';
import { guardarUltimoAnalisis, obtenerUltimoAnalisis, limpiarUltimoAnalisis, guardarTranscripcionPendiente, obtenerTranscripcionPendiente, limpiarTranscripcionPendiente } from '@/lib/analisis-storage';
import { adquirirPantallaActiva, liberarPantallaActiva } from '@/lib/wake-lock';
import { subirAudio, validarArchivo } from '@/lib/audio-upload';
import { compartirArchivo, crearArchivo, descargarArchivo, puedeCompartirArchivos } from '@/lib/entrega';
import { validarFormulario } from '@/lib/validacion-formulario';
import { guardarDocumento, guardarPredicacionConGeneral, getPredicacion, leerBiblioteca, type PredicacionBiblioteca } from '@/lib/biblioteca';
import type { ModalidadId } from '@/lib/tipos';
import ProgresoAnalisis from '@/components/progreso-analisis';
import { useTrackerAnalisis } from '@/lib/tracker-analisis';

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
  formato: 'pdf' | 'docx';
}

function formatearTiempo(segundos: number): string {
  const minutos = Math.floor(segundos / 60);
  const resto = segundos % 60;
  return `${minutos}:${String(resto).padStart(2, '0')}`;
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
  const [tiempo, setTiempo] = useState(0);
  const [errores, setErrores] = useState<string[]>([]);
  const [errorServicio, setErrorServicio] = useState<string | null>(null);
  const [advertenciaValidacion, setAdvertenciaValidacion] = useState<string | null>(null);
  const [textoPendiente, setTextoPendiente] = useState<string | null>(null);
  const [estadoAudio, setEstadoAudio] = useState<EstadoAudioFormulario>({ activo: false, progreso: 0 });
  const [descargando, setDescargando] = useState<'general' | 'modalidad' | null>(null);
  const [descargandoWord, setDescargandoWord] = useState<'general' | 'modalidad' | null>(null);
  const [biblioteca, setBiblioteca] = useState<PredicacionBiblioteca[]>([]);
  const [predicacionId, setPredicacionId] = useState<string | null>(null);
  const [generandoDoc, setGenerandoDoc] = useState<ModalidadId | 'todos' | null>(null);
  const [erroresDocs, setErroresDocs] = useState<Partial<Record<ModalidadId, string>>>({});
  const [ultimoArchivo, setUltimoArchivo] = useState<ArchivoListo | null>(null);
  const [mostrarPreview, setMostrarPreview] = useState(false);
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inicioProgresoRef = useRef(0);
  const archivoUrlRef = useRef<string | null>(null);

  const {
    trabajo: trabajoActivo,
    estaCargando: cargandoTracker,
    reconectando,
    minimizado,
    setMinimizado,
    iniciarTrabajo,
    cancelarTrabajo,
    descartarTrabajo,
  } = useTrackerAnalisis({
    onCompletado: (resultadoFinal) => {
      guardarUltimoAnalisis(resultadoFinal);
      const textoSermon = formulario.texto || textoPendiente || '';
      if (textoSermon) {
        guardarTranscripcionPendiente(textoSermon);
        setTextoPendiente(textoSermon);
        setBiblioteca(guardarPredicacionConGeneral(textoSermon, resultadoFinal.metadatos, resultadoFinal));
      }
      document.title = 'Análisis listo · TeoDoc MAIM';
      void liberarPantallaActiva();

      // Si está minimizado, actualizar el resultado de inmediato para que esté listo al abrir
      if (minimizado) {
        setResultado(resultadoFinal);
        setPredicacionId(resultadoFinal.metadatos.fechaAnalisis);
      } else {
        // Si el diálogo modal está abierto, permitir que el usuario observe el 100% completado
        // y transición suave automática tras 1.6s (o instantánea al pulsar "Ver documento completado")
        setTimeout(() => {
          setResultado(resultadoFinal);
          setPredicacionId(resultadoFinal.metadatos.fechaAnalisis);
        }, 1600);
      }
    },
    onError: (mensajeError) => {
      setErrorServicio(mensajeError);
      document.title = TITULO_BASE;
      void liberarPantallaActiva();
    },
  });

  const detenerProgreso = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const iniciarProgreso = (desde: number) => {
    detenerProgreso();
    inicioProgresoRef.current = Date.now();
    setTiempo(0);
    setProgreso(desde);
    timerRef.current = setInterval(() => {
      setTiempo(Math.floor((Date.now() - inicioProgresoRef.current) / 1000));
      setProgreso((valor) => (valor >= 96 ? 96 : valor + Math.max(1, Math.floor((97 - valor) * 0.06))));
    }, 1000);
  };

  useEffect(() => {
    const temporizador = window.setTimeout(() => {
      setBiblioteca(leerBiblioteca());
      const previo = obtenerUltimoAnalisis<Record<string, unknown>>();
      if (previo && typeof previo === 'object') {
        const metadatos = normalizarMetadatos(previo.metadatos);
        const normalizado = normalizarRespuesta(previo, metadatos);
        setResultado(normalizado);
        setPredicacionId(normalizado.metadatos.fechaAnalisis);
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

    setFormulario((valor) => ({ ...valor, texto: '' }));
    setTextoPendiente(null);
    setCargando(true);
    detenerProgreso();
    setProgreso(8);
    setEstadoAudio({ activo: true, progreso: 8, nombre: archivo.name, mensaje: 'Subiendo audio…' });
    void adquirirPantallaActiva();

    let intervaloTranscribe: ReturnType<typeof setInterval> | null = null;
    try {
      const { audioUrl } = await subirAudio(archivo, (porcentaje) => {
        const progresoCarga = Math.max(8, Math.min(48, Math.round(porcentaje * 0.48)));
        setEstadoAudio((valor) => ({ ...valor, activo: true, progreso: progresoCarga, mensaje: 'Subiendo audio…' }));
        setProgreso(progresoCarga);
      });

      setEstadoAudio((valor) => ({ ...valor, activo: true, progreso: 52, mensaje: 'Transcribiendo el mensaje…' }));
      setProgreso(52);

      // Progreso visual fluido durante la transcripción
      intervaloTranscribe = setInterval(() => {
        setEstadoAudio((valor) => ({
          ...valor,
          progreso: valor.progreso < 92 ? valor.progreso + 2 : 92,
          mensaje: 'Transcribiendo el mensaje…',
        }));
        setProgreso((p) => (p < 92 ? p + 2 : 92));
      }, 800);

      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 240_000);
      let data: { text?: string; error?: string } | null = null;
      try {
        const respuesta = await fetch('/api/transcribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ audioUrl }),
          signal: controller.signal,
        });
        if (intervaloTranscribe) clearInterval(intervaloTranscribe);
        data = await respuesta.json().catch(() => null);
        if (!respuesta.ok || !data?.text) {
          throw new Error(data?.error || 'No se pudo transcribir el audio. Intenta de nuevo.');
        }
      } catch (error) {
        if (intervaloTranscribe) clearInterval(intervaloTranscribe);
        if ((error as { name?: string })?.name === 'AbortError') {
          throw new Error('La transcripción tardó más de lo permitido. Intenta con un audio más corto.');
        }
        throw error;
      } finally {
        if (intervaloTranscribe) clearInterval(intervaloTranscribe);
        window.clearTimeout(timeout);
      }

      const transcripcion = (data?.text || '').trim();
      if (transcripcion.length < 120) {
        throw new Error('La transcripción es demasiado corta para generar un análisis. Prueba con un audio más completo.');
      }
      setFormulario((valor) => ({ ...valor, texto: transcripcion }));
      guardarTranscripcionPendiente(transcripcion);
      setTextoPendiente(transcripcion);
      detenerProgreso();
      setEstadoAudio({ activo: false, progreso: 100, nombre: archivo.name, mensaje: 'Transcripción lista.' });
      setProgreso(100);
      setErrores([]);
    } catch (error) {
      if (intervaloTranscribe) clearInterval(intervaloTranscribe);
      detenerProgreso();
      setEstadoAudio({
        activo: false,
        progreso: 0,
        nombre: archivo.name,
        error: error instanceof Error ? error.message : 'No se pudo procesar el audio. Revisa tu conexión o intenta con un MP3 más liviano.',
      });
      setProgreso(0);
    } finally {
      if (intervaloTranscribe) clearInterval(intervaloTranscribe);
      detenerProgreso();
      setCargando(false);
      void liberarPantallaActiva();
    }
  };

  const analizar = async (opciones: { texto?: string; titulo?: string; forzar?: boolean; reintento?: boolean } = {}) => {
    if (cargando || cargandoTracker) return;
    const texto = (opciones.texto ?? formulario.texto).trim();
    const titulo = opciones.titulo ?? formulario.titulo;
    const validacion = validarFormulario({ ...formulario, texto, titulo });
    if (!validacion.valido) {
      setErrores(validacion.errores);
      setErrorServicio(null);
      if (!resultado) document.getElementById('formulario-analisis')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    setErrores([]);
    setErrorServicio(null);
    setAdvertenciaValidacion(null);
    if ((opciones.texto && opciones.texto !== formulario.texto) || (opciones.titulo && opciones.titulo !== formulario.titulo)) {
      setFormulario((valor) => ({ ...valor, texto, titulo: titulo || valor.titulo }));
    }
    if (!opciones.reintento) setResultado(null);
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
              void liberarPantallaActiva();
              document.title = TITULO_BASE;
              return;
            }
          }
        } catch {}
      }

      await iniciarTrabajo({
        text: texto,
        modalidad: formulario.modalidad,
        rangoEdad: formulario.modalidad === 'ninos' ? formulario.rangoEdad : undefined,
        titulo: normalizarTituloProporcionado(titulo),
        predicador: normalizarPredicador(formulario.predicador),
        fecha: formulario.fecha,
      });
    } catch (error) {
      setTextoPendiente(texto);
      setErrorServicio(error instanceof Error ? error.message : 'No se pudo iniciar el análisis. Intenta de nuevo.');
      document.title = TITULO_BASE;
      void liberarPantallaActiva();
    }
  };

  const nuevoAnalisis = () => {
    limpiarUltimoAnalisis();
    limpiarTranscripcionPendiente();
    descartarTrabajo();
    void liberarPantallaActiva();
    setResultado(null);
    setErrores([]);
    setErrorServicio(null);
    setAdvertenciaValidacion(null);
    setTextoPendiente(null);
    setFormulario(FORMULARIO_INICIAL);
    setEstadoAudio({ activo: false, progreso: 0 });
    setProgreso(0);
    setTiempo(0);
    setDescargando(null);
    setDescargandoWord(null);
    setPredicacionId(null);
    setGenerandoDoc(null);
    setErroresDocs({});
    setMostrarPreview(false);
    setUltimoArchivo(null);
    setAviso(null);
    document.title = TITULO_BASE;
    window.setTimeout(() => document.getElementById('crear')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  };

  const entregarDocumento = async (documento: ResultadoAnalisis, formato: 'pdf' | 'word') => {
    try {
      const metadatos = { ...documento.metadatos, tituloProporcionado: documento.titulo };
      const analisis = { ...documento, metadatos };
      let blob: Blob;
      if (formato === 'pdf') {
        const pdf = await import('@/lib/pdf');
        const recursos = await pdf.cargarRecursosPdf();
        blob = metadatos.modalidad === 'general'
          ? pdf.construirPdfGeneralDocumento({ analisis, metadatos, recursos })
          : pdf.construirPdfModalidad({ analisis, metadatos, recursos });
      } else {
        const word = await import('@/lib/docx');
        blob = metadatos.modalidad === 'general'
          ? await word.construirWordGeneralDocumento({ analisis, metadatos })
          : await word.construirWordModalidad({ analisis, metadatos });
      }
      const nombre = formato === 'pdf' ? nombreArchivoPdf(metadatos.modalidad) : nombreArchivoWord(metadatos.modalidad);
      descargarArchivo(blob, nombre);
      if (archivoUrlRef.current) URL.revokeObjectURL(archivoUrlRef.current);
      const url = URL.createObjectURL(blob);
      archivoUrlRef.current = url;
      setUltimoArchivo({ nombre, file: crearArchivo(blob, nombre), url, formato: formato === 'pdf' ? 'pdf' : 'docx' });
      setAviso({ tipo: 'ok', mensaje: `${formato === 'pdf' ? 'PDF' : 'Word'} listo: ${nombre}` });
    } catch (error) {
      setAviso({ tipo: 'error', mensaje: error instanceof Error ? error.message : `No se pudo generar el ${formato === 'pdf' ? 'PDF' : 'Word'}.` });
    }
  };

  const descargar = async (tipo: 'general' | 'modalidad') => {
    if (!resultado || descargando) return;
    setDescargando(tipo);
    setAviso(null);
    try {
      const documento = tipo === 'general'
        ? { ...resultado, metadatos: { ...resultado.metadatos, modalidad: 'general' as const, rangoEdad: undefined, tituloProporcionado: resultado.titulo }, especializado: {} }
        : resultado;
      await entregarDocumento(documento, 'pdf');
    } finally {
      setDescargando(null);
    }
  };

  const descargarWord = async (tipo: 'general' | 'modalidad') => {
    if (!resultado || descargandoWord) return;
    setDescargandoWord(tipo);
    setAviso(null);
    try {
      const documento = tipo === 'general'
        ? { ...resultado, metadatos: { ...resultado.metadatos, modalidad: 'general' as const, rangoEdad: undefined, tituloProporcionado: resultado.titulo }, especializado: {} }
        : resultado;
      await entregarDocumento(documento, 'word');
    } finally {
      setDescargandoWord(null);
    }
  };

  const descargarBiblioteca = async (modalidad: ModalidadId, formato: 'pdf' | 'word') => {
    const actual = getPredicacion(biblioteca, predicacionId);
    const documento = actual?.documentos[modalidad];
    if (!documento) return;
    if (formato === 'pdf') {
      if (descargando) return;
      setDescargando('modalidad');
      try { await entregarDocumento(documento, 'pdf'); } finally { setDescargando(null); }
    } else {
      if (descargandoWord) return;
      setDescargandoWord('modalidad');
      try { await entregarDocumento(documento, 'word'); } finally { setDescargandoWord(null); }
    }
  };

  const solicitarDocumento = async (modalidad: ModalidadId, predicacion: PredicacionBiblioteca): Promise<ResultadoAnalisis> => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 295_000);
    try {
      const respuesta = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: predicacion.texto,
          modalidad,
          rangoEdad: modalidad === 'ninos' ? (predicacion.metadatos.rangoEdad || formulario.rangoEdad) : undefined,
          titulo: predicacion.titulo,
          predicador: predicacion.predicador,
          fecha: predicacion.fecha,
          analisisGeneralPrevio: predicacion.documentos?.general || undefined,
        }),
        signal: controller.signal,
      });
      const data = await respuesta.json().catch(() => null);
      if (!respuesta.ok) {
        if (respuesta.status === 503 || data?.error === 'busy') throw new Error('El servicio de análisis está ocupado. Intenta de nuevo en unos minutos.');
        throw new Error(data?.error || 'No se pudo generar este documento.');
      }
      if (!data || typeof data !== 'object') throw new Error('El servidor devolvió una respuesta vacía.');
      const metadatos = normalizarMetadatos({
        ...predicacion.metadatos,
        modalidad,
        rangoEdad: modalidad === 'ninos' ? (predicacion.metadatos.rangoEdad || formulario.rangoEdad) : undefined,
        titulo: predicacion.titulo,
        predicador: predicacion.predicador,
        fecha: predicacion.fecha,
        fechaAnalisis: predicacion.id,
      });
      const normalizado = normalizarRespuesta(data, metadatos);
      normalizado.titulo = predicacion.titulo;
      normalizado.metadatos = {
        ...normalizado.metadatos,
        ...metadatos,
        fechaAnalisis: predicacion.id,
        tituloProporcionado: predicacion.titulo,
      };
      return normalizado;
    } catch (error) {
      if ((error as { name?: string })?.name === 'AbortError') {
        throw new Error('La generación tardó más de lo permitido. Intenta de nuevo.');
      }
      throw error;
    } finally {
      window.clearTimeout(timeout);
    }
  };

  const generarDocumentoModalidad = async (modalidad: ModalidadId) => {
    const actual = getPredicacion(biblioteca, predicacionId);
    if (!actual) return;
    setGenerandoDoc(modalidad);
    iniciarProgreso(8);
    void adquirirPantallaActiva();
    setErroresDocs((previos) => {
      const siguiente = { ...previos };
      delete siguiente[modalidad];
      return siguiente;
    });
    try {
      const documento = await solicitarDocumento(modalidad, actual);
      const siguienteBiblioteca = guardarDocumento(actual.id, actual.texto, documento.metadatos, documento);
      setBiblioteca(siguienteBiblioteca);
      setPredicacionId(actual.id);
      detenerProgreso();
      setProgreso(100);
      setResultado(documento);
      setFormulario((valor) => ({ ...valor, texto: actual.texto, modalidad, rangoEdad: documento.metadatos.rangoEdad || valor.rangoEdad }));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      setProgreso(0);
      setErroresDocs((previos) => ({ ...previos, [modalidad]: error instanceof Error ? error.message : 'No se pudo generar este documento.' }));
    } finally {
      detenerProgreso();
      setGenerandoDoc(null);
      void liberarPantallaActiva();
    }
  };

  const generarTodosLosDocumentos = async () => {
    const actual = getPredicacion(biblioteca, predicacionId);
    if (!actual) return;
    const faltantes = MODALIDADES.filter((modalidad) => !actual.documentos[modalidad.id]).map((modalidad) => modalidad.id);
    if (!faltantes.length) return;
    setGenerandoDoc('todos');
    iniciarProgreso(5);
    void adquirirPantallaActiva();
    setErroresDocs({});
    let ultimo: ResultadoAnalisis | null = null;
    for (let indice = 0; indice < faltantes.length; indice++) {
      const modalidad = faltantes[indice];
      try {
        const documento = await solicitarDocumento(modalidad, actual);
        guardarDocumento(actual.id, actual.texto, documento.metadatos, documento);
        setBiblioteca(leerBiblioteca());
        setPredicacionId(actual.id);
        setProgreso(Math.min(94, Math.round(((indice + 1) / faltantes.length) * 90)));
        ultimo = documento;
      } catch (error) {
        setErroresDocs((previos) => ({ ...previos, [modalidad]: error instanceof Error ? error.message : 'No se pudo generar este documento.' }));
      }
    }
    if (ultimo) {
      setResultado(ultimo);
      setFormulario((valor) => ({ ...valor, texto: actual.texto, modalidad: ultimo!.metadatos.modalidad, rangoEdad: ultimo!.metadatos.rangoEdad || valor.rangoEdad }));
      setBiblioteca(leerBiblioteca());
    }
    detenerProgreso();
    setProgreso(100);
    setGenerandoDoc(null);
    void liberarPantallaActiva();
  };

  const verDocumento = (modalidad: ModalidadId) => {
    const actual = getPredicacion(biblioteca, predicacionId);
    const documento = actual?.documentos[modalidad];
    if (!actual || !documento) return;
    setResultado(documento);
    setFormulario((valor) => ({ ...valor, texto: actual.texto, modalidad, rangoEdad: documento.metadatos.rangoEdad || valor.rangoEdad }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const abrirPredicacion = (id: string) => {
    const predicacion = getPredicacion(biblioteca, id);
    if (!predicacion) return;
    const documento = predicacion.documentos[predicacion.metadatos.modalidad] || Object.values(predicacion.documentos)[0];
    if (!documento) return;
    setPredicacionId(predicacion.id);
    setResultado(documento);
    setFormulario((valor) => ({ ...valor, texto: predicacion.texto, modalidad: documento.metadatos.modalidad, rangoEdad: documento.metadatos.rangoEdad || valor.rangoEdad }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const compartirUltimo = async () => {
    if (!ultimoArchivo) return;
    const compartido = await compartirArchivo(ultimoArchivo.file, ultimoArchivo.nombre);
    setAviso({
      tipo: compartido ? 'ok' : 'error',
      mensaje: compartido ? 'Archivo enviado al panel de compartir.' : 'Tu navegador no pudo abrir el panel de compartir. Usa Descargar de nuevo.',
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
    : generandoDoc === 'todos'
      ? 'Generando los documentos pendientes…'
      : generandoDoc
        ? `Generando ${obtenerModalidad(generandoDoc).nombre}…`
        : progreso < 25
          ? 'Preparando la solicitud…'
          : progreso < 50
            ? 'Validando el contenido…'
            : progreso < 72
              ? 'Analizando la enseñanza…'
              : progreso < 92
                ? 'Redactando el material especializado…'
                : 'Finalizando el documento…';

  const porcentaje = Math.max(0, Math.min(100, Math.round(progreso)));

  const predicacionActual = getPredicacion(biblioteca, predicacionId);

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
          <section id="inicio" className="contenedor pb-12 pt-12 lg:pb-16 lg:pt-16">
            <div className="mx-auto max-w-3xl text-center">
              <p className="flex items-center justify-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.17em] text-[var(--coralOscuro)]">
                <span className="h-px w-8 bg-[var(--coral)]" aria-hidden="true" />
                Análisis bíblico para el ministerio
              </p>
              <h1 className="mx-auto mt-5 max-w-2xl text-[clamp(2.5rem,1.6rem+3.4vw,4.35rem)] font-semibold leading-[1.02] tracking-[-0.045em] text-[var(--tinta)]">
                De la prédica al <span className="text-[var(--coralOscuro)]">estudio que transforma.</span>
              </h1>
              <p className="mx-auto mt-6 max-w-xl text-[15px] leading-relaxed text-[var(--texto)] sm:text-[16px]">
                Introduce una prédica desde un enlace de video, archivo multimedia, documento Word/PDF o texto directo. Elige cómo la vas a enseñar y recibe un análisis fiel con sus documentos en PDF y Word listos para compartir.
              </p>
              <div className="mt-7 flex flex-wrap justify-center gap-2">
                {['Análisis general', 'Liderazgo', 'Grupos pequeños', 'Jóvenes', 'Niños', 'Devocionales de 7 días'].map((etiqueta) => (
                  <span key={etiqueta} className="rounded-full border border-[#e1c9bb] bg-white/60 px-3 py-1.5 text-[10.5px] font-semibold text-[var(--texto)]">{etiqueta}</span>
                ))}
              </div>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row sm:items-center">
                <a href="#crear" className="btn-primario justify-center px-5 py-3 text-[13px]">
                  Preparar mi estudio <IconoFlecha />
                </a>
                <a href="#como-funciona" className="btn-secundario justify-center px-5 py-3 text-[13px]">Ver cómo funciona</a>
              </div>
              <p className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-[var(--muted)]">
                <IconoCheck className="h-3.5 w-3.5 text-[var(--coralOscuro)]" />
                Sin inventar biografías, citas ni doctrina. El contenido se basa fielmente en la prédica o documento original.
              </p>
            </div>
          </section>
        )}

        <section id="crear" className="contenedor scroll-mt-24 pb-12 w-full max-w-full overflow-hidden">
          {/* Indicador de progreso y gestor de espera en segundo plano */}
          {trabajoActivo && (
            <ProgresoAnalisis
              trabajo={trabajoActivo}
              reconectando={reconectando}
              minimizado={minimizado}
              onMinimizar={setMinimizado}
              onCancelar={cancelarTrabajo}
              onVerResultado={() => {
                if (trabajoActivo.resultado) {
                  setResultado(trabajoActivo.resultado);
                  setPredicacionId(trabajoActivo.resultado.metadatos.fechaAnalisis);
                  setMinimizado(false);
                  descartarTrabajo();
                  window.setTimeout(() => document.getElementById('crear')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
                }
              }}
            />
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
            <div className="animar-entrada w-full max-w-full overflow-hidden">
              <PanelResultados
                resultado={resultado}
                descargando={descargando}
                descargandoWord={descargandoWord}
                onNuevo={nuevoAnalisis}
                onDescargarGeneral={() => void descargar('general')}
                onDescargarModalidad={() => void descargar('modalidad')}
                onDescargarWordGeneral={() => void descargarWord('general')}
                onDescargarWordModalidad={() => void descargarWord('modalidad')}
                onReintentarModalidad={reintentarModalidad}
              />
              {predicacionActual && (
                <BibliotecaDocumentos
                  predicacion={predicacionActual}
                  todas={biblioteca}
                  actual={resultado.metadatos.modalidad}
                  generando={generandoDoc}
                  errores={erroresDocs}
                  onVer={verDocumento}
                  onGenerar={(modalidad) => void generarDocumentoModalidad(modalidad)}
                  onGenerarTodos={() => void generarTodosLosDocumentos()}
                  onDescargar={(modalidad, formato) => void descargarBiblioteca(modalidad, formato)}
                  onAbrirPredicacion={abrirPredicacion}
                />
              )}
            </div>
          ) : (
            <FormularioAnalisis
              valores={formulario}
              onCambio={cambiarFormulario}
              onArchivo={(archivo) => void procesarAudio(archivo)}
              onAnalizar={() => void analizar()}
              onAnalizarConTexto={(textoExtraido, tituloSugerido) => void analizar({ texto: textoExtraido, titulo: tituloSugerido })}
              cargando={cargando || cargandoTracker}
              estadoAudio={estadoAudio}
              errores={errores}
            />
          )}

          {!resultado && biblioteca.length > 0 && (
            <details className="mt-5 rounded-[16px] border border-[var(--linea)] bg-[#fffdf8] p-4">
              <summary className="cursor-pointer text-[12px] font-semibold text-[var(--coralOscuro)]">
                Predicaciones guardadas ({biblioteca.length})
              </summary>
              <div className="mt-3 space-y-2">
                {biblioteca.map((item) => (
                  <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-[10px] bg-[#fbf2e6] px-3 py-2.5">
                    <div>
                      <p className="text-[12px] font-semibold text-[var(--tinta)]">{item.titulo}</p>
                      <p className="text-[10.5px] text-[var(--muted)]">
                        {[item.predicador, item.fecha, `${Object.keys(item.documentos).length} documentos`].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                    <button type="button" onClick={() => abrirPredicacion(item.id)} className="text-[11px] font-semibold text-[var(--coralOscuro)] underline underline-offset-4">Abrir</button>
                  </div>
                ))}
              </div>
            </details>
          )}
        </section>

        <section id="como-funciona" className="contenedor scroll-mt-24 pb-16">
          <div className="rounded-[22px] border border-[var(--linea)] bg-[#fffdf8] p-6 sm:p-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-[var(--coralOscuro)]">Cómo funciona</p>
                <h2 className="mt-2 text-[28px] font-semibold tracking-[-0.03em] text-[var(--tinta)]">De la prédica al material ministerial, sin atajos.</h2>
              </div>
              <p className="max-w-md text-[12px] leading-relaxed text-[var(--muted)]">Cada etapa conserva la trazabilidad y fidelidad del mensaje. Procesa videos, audios, documentos o texto directo sin generar afirmaciones que la enseñanza no sostenga.</p>
            </div>
            <div className="mt-7 grid gap-4 md:grid-cols-3">
              {[
                { numero: '01', titulo: 'Ingresa tu enseñanza', texto: 'Pega el enlace de un video (para descargarlo o extraer su audio), sube un archivo multimedia, carga un documento Word/PDF o pega el texto directamente.' },
                { numero: '02', titulo: 'Elige la especialidad', texto: 'Selecciona la modalidad para tu ministerio: análisis general, enseñanza para liderazgo, grupos pequeños, jóvenes, niños o devocionales de 7 días.' },
                { numero: '03', titulo: 'Descarga y ministra', texto: 'Obtén tus documentos en PDF y Word con diagramación institucional de MAIM Casa de Oración, referencias bíblicas verificadas y contenido listo para enseñar.' },
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
            <span>© {new Date().getFullYear()} TeoDoc MAIM</span>
          </div>
        </div>
      </footer>

      {(cargando || generandoDoc !== null) && (
        <div className="fixed bottom-4 left-1/2 z-40 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-[14px] border border-white/10 bg-[var(--tinta)] px-4 py-3.5 text-white shadow-[0_20px_60px_rgba(43,31,30,0.35)]" aria-live="polite">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[12px] font-medium">{mensajeProgreso}</p>
            <span className="shrink-0 text-[12px] font-semibold tabular-nums text-[#ffd8a8]">{porcentaje}% · {formatearTiempo(tiempo)}</span>
          </div>
          <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white/15" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={porcentaje} aria-label="Progreso estimado de la generación">
            <div className="h-full rounded-full bg-[var(--coral)] transition-all duration-500" style={{ width: `${Math.max(4, porcentaje)}%` }} />
          </div>
          <div className="mt-2 flex items-center justify-between text-[9px] font-semibold uppercase tracking-[0.08em] text-white/55">
            <span>Progreso estimado</span>
            <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#8be3b0]" />Pantalla activa</span>
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
                    {ultimoArchivo.formato === 'pdf' && <button type="button" onClick={() => setMostrarPreview(true)} className="underline underline-offset-4">Ver PDF</button>}
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

      {mostrarPreview && ultimoArchivo && ultimoArchivo.formato === 'pdf' && (
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
