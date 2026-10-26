'use client';

import { useState, type ReactNode } from 'react';
import { MODALIDADES, RANGOS_EDAD } from '@/lib/modalidades';
import type { ModalidadId, RangoEdad } from '@/lib/tipos';
import { IconoAudio, IconoCheck, IconoFlecha, IconoModalidad, IconoTexto } from './marca';

export interface ValoresFormulario {
  titulo: string;
  predicador: string;
  fecha: string;
  texto: string;
  modalidad: ModalidadId;
  rangoEdad: RangoEdad;
}

export interface EstadoAudioFormulario {
  activo: boolean;
  progreso: number;
  mensaje?: string;
  error?: string;
  nombre?: string;
}

interface Props {
  valores: ValoresFormulario;
  onCambio: (cambio: Partial<ValoresFormulario>) => void;
  onArchivo: (archivo: File) => void;
  onAnalizar: () => void;
  cargando: boolean;
  estadoAudio: EstadoAudioFormulario;
  errores: string[];
}

function Seccion({ numero, titulo, descripcion, children }: { numero: string; titulo: string; descripcion?: string; children: ReactNode }) {
  return (
    <section className="border-t border-[var(--linea)] py-7 first:border-t-0 first:pt-0">
      <div className="mb-5 flex items-start gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--coralOscuro)] text-[11px] font-bold text-white">{numero}</span>
        <div>
          <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-[var(--tinta)]">{titulo}</h2>
          {descripcion && <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-[var(--muted)]">{descripcion}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

export default function FormularioAnalisis({ valores, onCambio, onArchivo, onAnalizar, cargando, estadoAudio, errores }: Props) {
  const [arrastrando, setArrastrando] = useState(false);
  const [mostrarAyuda, setMostrarAyuda] = useState(false);
  const caracteres = valores.texto.trim().length;

  const aceptarArchivo = (archivo: File | undefined) => {
    if (!archivo) return;
    onArchivo(archivo);
  };

  return (
    <form
      id="formulario-analisis"
      className="scroll-mt-24 rounded-[20px] border border-[var(--linea)] bg-[#fffdf8] p-5 shadow-[0_20px_60px_rgba(76,43,36,0.08)] sm:p-8"
      onSubmit={(event) => {
        event.preventDefault();
        onAnalizar();
      }}
      aria-label="Formulario para generar un análisis bíblico"
    >
      {errores.length > 0 && (
        <div className="mb-6 rounded-[12px] border border-[#e8b4b8] bg-[#fff4f4] px-4 py-3" role="alert">
          <p className="text-[12px] font-semibold text-[#8f2830]">Revisa antes de continuar</p>
          <ul className="mt-1.5 list-disc space-y-1 pl-4 text-[12px] leading-relaxed text-[#7a3036]">
            {errores.map((error) => <li key={error}>{error}</li>)}
          </ul>
        </div>
      )}
      <Seccion numero="1" titulo="Identifica el mensaje" descripcion="Estos datos son opcionales. No se usan para inventar biografías ni atribuciones.">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="mb-1.5 block text-[12px] font-semibold text-[var(--tinta)]">Título del mensaje</span>
            <input
              type="text"
              className="campo"
              value={valores.titulo}
              maxLength={180}
              onChange={(event) => onCambio({ titulo: event.target.value })}
              placeholder="Si lo dejas vacío, se sugerirá a partir de la transcripción"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[12px] font-semibold text-[var(--tinta)]">Predicador o expositor</span>
            <input
              type="text"
              className="campo"
              value={valores.predicador}
              maxLength={120}
              onChange={(event) => onCambio({ predicador: event.target.value })}
              placeholder="Ej. Juan Pérez"
              autoComplete="name"
            />
            <span className="mt-1.5 block text-[11px] leading-relaxed text-[var(--muted)]">Solo identifica la fuente en el estudio y el PDF. No se genera una biografía.</span>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[12px] font-semibold text-[var(--tinta)]">Fecha de la prédica</span>
            <input
              type="date"
              className="campo"
              value={valores.fecha}
              onChange={(event) => onCambio({ fecha: event.target.value })}
            />
            <span className="mt-1.5 block text-[11px] leading-relaxed text-[var(--muted)]">Opcional. Se muestra en la portada y en el PDF.</span>
          </label>
        </div>
      </Seccion>

      <Seccion numero="2" titulo="Aporta el contenido real" descripcion="Escribe, pega la transcripción o sube el audio del mensaje. El análisis se basa exclusivamente en este contenido.">
        <div
          className={`relative mb-4 rounded-[14px] border border-dashed p-4 transition ${arrastrando ? 'border-[var(--coral)] bg-[#fff3ed]' : 'border-[#d9bfb3] bg-[#fbf4e9]'}`}
          onDragOver={(event) => {
            event.preventDefault();
            setArrastrando(true);
          }}
          onDragLeave={() => setArrastrando(false)}
          onDrop={(event) => {
            event.preventDefault();
            setArrastrando(false);
            aceptarArchivo(event.dataTransfer.files?.[0]);
          }}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[var(--coralOscuro)] shadow-sm">
                <IconoAudio />
              </span>
              <div>
                <p className="text-[13px] font-semibold text-[var(--tinta)]">
                  {estadoAudio.activo ? estadoAudio.mensaje || 'Procesando audio...' : 'Subir audio para transcribir'}
                </p>
                <p id="audio-help" className="mt-0.5 text-[11.5px] leading-relaxed text-[var(--muted)]">
                  MP3, M4A, WAV, OGG, OPUS o video. Hasta 500 MB. También puedes arrastrarlo aquí.
                </p>
                {estadoAudio.nombre && !estadoAudio.error && (
                  <p className="mt-1 text-[11px] font-medium text-[var(--coralOscuro)]">{estadoAudio.nombre}</p>
                )}
                {estadoAudio.mensaje && !estadoAudio.activo && !estadoAudio.error && (
                  <p className="mt-1 text-[11.5px] leading-relaxed text-[#3f6b47]" role="status">{estadoAudio.mensaje}</p>
                )}
                {estadoAudio.error && <p className="mt-1 text-[11.5px] text-[#9d2c34]" role="alert">{estadoAudio.error}</p>}
              </div>
            </div>
            <label
              htmlFor="audio-file-input"
              className={`btn-secundario relative min-h-[48px] shrink-0 touch-manipulation justify-center focus-within:ring-2 focus-within:ring-[var(--coral)] focus-within:ring-offset-2 focus-within:ring-offset-[#fffdf8] ${
                cargando || estadoAudio.activo ? 'pointer-events-none cursor-not-allowed opacity-50' : 'cursor-pointer'
              }`}
              aria-disabled={cargando || estadoAudio.activo}
            >
              <input
                id="audio-file-input"
                type="file"
                accept="audio/*,video/mp4,video/quicktime,video/webm,.mp3,.m4a,.wav,.aac,.ogg,.oga,.opus,.flac,.mp4,.mov"
                className="sr-only"
                onChange={(event) => {
                  aceptarArchivo(event.target.files?.[0]);
                  event.target.value = '';
                }}
                disabled={cargando || estadoAudio.activo}
                aria-label="Seleccionar archivo de audio del mensaje"
                aria-describedby="audio-help"
              />
              <span>{estadoAudio.activo ? 'Procesando…' : estadoAudio.nombre ? 'Cambiar audio' : 'Elegir audio'}</span>
            </label>
          </div>
          {estadoAudio.activo && (
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white">
              <div className="h-full rounded-full bg-[var(--coral)] transition-all duration-500" style={{ width: `${Math.max(4, estadoAudio.progreso)}%` }} />
            </div>
          )}
        </div>

        <label className="block">
          <span className="mb-2 flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-[12px] font-semibold text-[var(--tinta)]">
              <IconoTexto className="h-4 w-4 text-[var(--coralOscuro)]" />
              Transcripción o texto del mensaje
            </span>
            <span className={`text-[11px] tabular-nums ${caracteres > 250000 ? 'text-[#9d2c34]' : 'text-[var(--muted)]'}`}>{caracteres.toLocaleString('es-CO')} / 250,000</span>
          </span>
          <textarea
            className="campo min-h-[250px] resize-y font-[420] leading-[1.7]"
            value={valores.texto}
            onChange={(event) => onCambio({ texto: event.target.value })}
            placeholder="Pega aquí la transcripción del mensaje. Si subiste un audio, la transcripción aparecerá en este campo y podrás corregirla antes de generar el estudio."
            aria-describedby="ayuda-texto"
            disabled={cargando}
          />
        </label>
        <div id="ayuda-texto" className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-[var(--muted)]">
          <span>Mínimo 120 caracteres. Revisa nombres propios y citas bíblicas antes de continuar.</span>
          <button type="button" className="font-semibold text-[var(--coralOscuro)] underline-offset-4 hover:underline" onClick={() => setMostrarAyuda((valor) => !valor)} aria-expanded={mostrarAyuda}>
            {mostrarAyuda ? 'Ocultar privacidad' : 'Privacidad del contenido'}
          </button>
        </div>
        {mostrarAyuda && (
          <p className="mt-2 rounded-[10px] bg-[#f7eee2] px-3 py-2 text-[11px] leading-relaxed text-[var(--texto)]">
            La transcripción se envía al proveedor de análisis para generar el estudio y no se almacena en el servidor de TeoDoc. El último resultado queda en este navegador durante 48 horas para que puedas recuperarlo. Si subes audio, este se procesa mediante Cloudinary y el servicio de transcripción elegido.
          </p>
        )}
      </Seccion>

      <Seccion numero="3" titulo="Elige la modalidad" descripcion="El análisis general siempre se conserva. La modalidad seleccionada añade un desarrollo especializado y su propio PDF.">
        <fieldset>
          <legend className="sr-only">Modalidad del análisis</legend>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {MODALIDADES.map((modalidad) => {
              const activa = valores.modalidad === modalidad.id;
              return (
                <label
                  key={modalidad.id}
                  className={`group relative flex cursor-pointer flex-col rounded-[14px] border p-4 transition focus-within:ring-2 focus-within:ring-[var(--coral)] focus-within:ring-offset-2 focus-within:ring-offset-[#fffdf8] ${
                    activa ? 'border-[var(--coral)] bg-[#fff4ef] shadow-[0_6px_20px_rgba(240,78,89,0.12)]' : 'border-[var(--linea)] bg-white hover:border-[#d8b4a8] hover:bg-[#fffaf1]'
                  }`}
                >
                  <input
                    type="radio"
                    name="modalidad"
                    value={modalidad.id}
                    checked={activa}
                    onChange={() => onCambio({ modalidad: modalidad.id })}
                    className="sr-only"
                    disabled={cargando}
                  />
                  <span className="mb-3 flex items-start justify-between gap-2">
                    <span className={`flex h-9 w-9 items-center justify-center rounded-full ${activa ? 'bg-[var(--coralOscuro)] text-white' : 'bg-[#f7eee2] text-[var(--coralOscuro)]'}`}>
                      <IconoModalidad tipo={modalidad.icono} />
                    </span>
                    <span className={`flex h-5 w-5 items-center justify-center rounded-full border ${activa ? 'border-[var(--coral)] bg-[var(--coralOscuro)] text-white' : 'border-[#d8c4b8] text-transparent'}`}>
                      <IconoCheck className="h-3.5 w-3.5" />
                    </span>
                  </span>
                  <span className="text-[12.5px] font-semibold leading-snug text-[var(--tinta)]">{modalidad.nombre}</span>
                  <span className="mt-1.5 text-[11px] leading-relaxed text-[var(--muted)]">{modalidad.descripcion}</span>
                  <span className="mt-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--coralOscuro)]">{modalidad.publico}</span>
                </label>
              );
            })}
          </div>
        </fieldset>

        {valores.modalidad === 'ninos' && (
          <fieldset className="mt-4 rounded-[14px] border border-[#efd3c8] bg-[#fff8ef] p-4">
            <legend className="px-1 text-[12px] font-semibold text-[var(--tinta)]">Rango de edad de los niños</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {RANGOS_EDAD.map((rango) => {
                const activo = valores.rangoEdad === rango.id;
                return (
                  <label key={rango.id} className={`cursor-pointer rounded-full border px-4 py-2 text-[12px] font-medium transition focus-within:ring-2 focus-within:ring-[var(--coral)] focus-within:ring-offset-2 focus-within:ring-offset-[#fffdf8] ${activo ? 'border-[var(--coral)] bg-[var(--coralOscuro)] text-white' : 'border-[#dfc7bb] bg-white text-[var(--texto)] hover:border-[var(--coral)]'}`}>
                    <input
                      type="radio"
                      name="rangoEdad"
                      value={rango.id}
                      checked={activo}
                      onChange={() => onCambio({ rangoEdad: rango.id })}
                      className="sr-only"
                    />
                    {rango.etiqueta}
                    <span className={`ml-1.5 text-[10px] ${activo ? 'text-white/80' : 'text-[var(--muted)]'}`}>{rango.descripcion}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        )}
      </Seccion>

      <div className="flex flex-col gap-3 border-t border-[var(--linea)] pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-md text-[11px] leading-relaxed text-[var(--muted)]">
          El material generado es un apoyo para el estudio. Debe revisarse a la luz de la Biblia y con acompañamiento pastoral antes de enseñarlo.
        </p>
        <button type="submit" className="btn-primario w-full sm:w-auto" disabled={cargando}>
          {cargando ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />
              Generando análisis…
            </>
          ) : (
            <>
              Generar análisis y PDF
              <IconoFlecha />
            </>
          )}
        </button>
      </div>
    </form>
  );
}
