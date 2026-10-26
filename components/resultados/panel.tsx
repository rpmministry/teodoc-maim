'use client';

import { useState } from 'react';
import type { ResultadoAnalisis } from '@/lib/tipos';
import { fechaLarga, nombreArchivoPdf, nombreArchivoWord, obtenerModalidad, obtenerRangoEdad } from '@/lib/modalidades';
import { especializadoTieneContenido } from '@/lib/normalizar';
import { IconoDescarga, IconoFlecha } from '../marca';
import ResultadoGeneral from './general';
import { ResultadoDevocionales, ResultadoGrupos, ResultadoJovenes, ResultadoNinos } from './especializados';

interface Props {
  resultado: ResultadoAnalisis;
  descargando: 'general' | 'modalidad' | null;
  descargandoWord: 'general' | 'modalidad' | null;
  onNuevo: () => void;
  onDescargarGeneral: () => void;
  onDescargarModalidad: () => void;
  onDescargarWordGeneral: () => void;
  onDescargarWordModalidad: () => void;
  onReintentarModalidad: () => void;
}

export default function PanelResultados({ resultado, descargando, descargandoWord, onNuevo, onDescargarGeneral, onDescargarModalidad, onDescargarWordGeneral, onDescargarWordModalidad, onReintentarModalidad }: Props) {
  const modalidad = obtenerModalidad(resultado.metadatos.modalidad);
  const tieneEspecializado = resultado.metadatos.modalidad !== 'general' &&
    especializadoTieneContenido(resultado.metadatos.modalidad, resultado.especializado);
  const [tab, setTab] = useState<'general' | 'especializada'>('general');
  const mostrarTabs = resultado.metadatos.modalidad !== 'general' && tieneEspecializado;
  const tabActiva = tab === 'especializada' && tieneEspecializado ? 'especializada' : 'general';

  return (
    <section className="overflow-hidden rounded-[20px] border border-[var(--linea)] bg-[#fffdf8] shadow-[0_24px_70px_rgba(76,43,36,0.09)]" aria-label="Resultados del análisis">
      <div className="relative overflow-hidden bg-[var(--tinta)] px-5 pb-7 pt-6 text-white sm:px-8 sm:pb-8 sm:pt-8">
        <div className="absolute -right-16 -top-24 h-64 w-64 rounded-full border-[38px] border-[var(--coral)] opacity-20" aria-hidden="true" />
        <div className="relative">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[var(--coralOscuro)] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white">{modalidad.nombre}</span>
            {resultado.metadatos.rangoEdad && (
              <span className="rounded-full border border-white/25 px-3 py-1 text-[10px] font-semibold text-white/80">{obtenerRangoEdad(resultado.metadatos.rangoEdad)}</span>
            )}
            <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-white/45">Análisis generado</span>
          </div>
          <h2 className="mt-4 max-w-3xl text-[26px] font-semibold leading-[1.15] tracking-[-0.02em] sm:text-[32px]">{resultado.titulo}</h2>
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px] text-white/70">
            {resultado.metadatos.predicador && (
              <span><span className="text-white/45">Predicador o expositor:</span> <strong className="font-semibold text-white">{resultado.metadatos.predicador}</strong></span>
            )}
            {resultado.metadatos.fecha && <span><span className="text-white/45">Fecha:</span> {fechaLarga(resultado.metadatos.fecha)}</span>}
            {resultado.texto_biblico_principal.cita && <span><span className="text-white/45">Texto:</span> {resultado.texto_biblico_principal.cita}</span>}
          </div>
          {resultado.idea_principal && <p className="mt-5 max-w-3xl border-l-2 border-[var(--coral)] pl-4 text-[14px] leading-relaxed text-white/85">{resultado.idea_principal}</p>}
        </div>
      </div>

      <div className="flex flex-col gap-4 border-b border-[var(--linea)] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={onDescargarModalidad} disabled={descargando !== null || !tieneEspecializado} className="btn-primario text-[12px] disabled:cursor-not-allowed disabled:opacity-45">
            {descargando === 'modalidad' ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" /> : <IconoDescarga />}
            {descargando === 'modalidad' ? 'Generando PDF…' : 'Descargar PDF de esta modalidad'}
          </button>
          <button type="button" onClick={onDescargarGeneral} disabled={descargando !== null} className="btn-secundario text-[12px]">
            {descargando === 'general' ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--coral)]/30 border-t-[var(--coral)]" aria-hidden="true" /> : <IconoDescarga />}
            Análisis general
          </button>
          <button type="button" onClick={onDescargarWordModalidad} disabled={descargandoWord !== null || !tieneEspecializado} className="btn-secundario px-3 py-2 text-[11px] disabled:cursor-not-allowed disabled:opacity-45">
            {descargandoWord === 'modalidad' ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[var(--coral)]/30 border-t-[var(--coral)]" aria-hidden="true" /> : <IconoDescarga className="h-3.5 w-3.5" />}
            Word modalidad
          </button>
          <button type="button" onClick={onDescargarWordGeneral} disabled={descargandoWord !== null} className="btn-secundario px-3 py-2 text-[11px]">
            {descargandoWord === 'general' ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[var(--coral)]/30 border-t-[var(--coral)]" aria-hidden="true" /> : <IconoDescarga className="h-3.5 w-3.5" />}
            Word general
          </button>
        </div>
        <button type="button" onClick={onNuevo} className="text-left text-[12px] font-semibold text-[var(--coralOscuro)] underline-offset-4 hover:underline sm:text-right">
          Preparar otra prédica <IconoFlecha className="ml-1 inline h-3.5 w-3.5" />
        </button>
      </div>

      <div className="px-5 py-5 sm:px-8">
        <div className="mb-5 flex flex-wrap gap-2 text-[10.5px] text-[var(--muted)]">
          <span className="rounded-full bg-[#f5ebdd] px-3 py-1.5 font-medium">PDF: {nombreArchivoPdf(resultado.metadatos.modalidad)}</span>
          {resultado.metadatos.modalidad !== 'general' && <span className="rounded-full bg-[#f5ebdd] px-3 py-1.5 font-medium">General: {nombreArchivoPdf('general')}</span>}
          <span className="rounded-full bg-[#f5ebdd] px-3 py-1.5 font-medium">Word: {nombreArchivoWord(resultado.metadatos.modalidad)}</span>
        </div>

        {resultado.advertenciaEspecializado && (
          <div className="mb-5 rounded-[12px] border border-[#e5c49c] bg-[#fff8ec] px-4 py-3.5" role="status">
            <p className="text-[12px] font-semibold text-[#6f4b22]">El material especializado está incompleto</p>
            <p className="mt-1 text-[12px] leading-relaxed text-[#6f4b22]">{resultado.advertenciaEspecializado}</p>
            <button type="button" onClick={onReintentarModalidad} className="mt-2.5 text-[12px] font-semibold text-[var(--coralOscuro)] underline underline-offset-4">Reintentar esta modalidad</button>
          </div>
        )}

        {mostrarTabs && (
          <div role="tablist" aria-label="Contenido del análisis" className="mb-5 flex gap-1 rounded-[10px] bg-[#f7eee2] p-1">
            <button
              type="button"
              role="tab"
              aria-selected={tabActiva === 'general'}
              onClick={() => setTab('general')}
              className={`flex-1 rounded-[8px] px-3 py-2 text-[12px] font-semibold transition ${tabActiva === 'general' ? 'bg-white text-[var(--tinta)] shadow-sm' : 'text-[var(--muted)] hover:text-[var(--tinta)]'}`}
            >
              Análisis general
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tabActiva === 'especializada'}
              onClick={() => setTab('especializada')}
              className={`flex-1 rounded-[8px] px-3 py-2 text-[12px] font-semibold transition ${tabActiva === 'especializada' ? 'bg-white text-[var(--tinta)] shadow-sm' : 'text-[var(--muted)] hover:text-[var(--tinta)]'}`}
            >
              {modalidad.nombreCorto}
            </button>
          </div>
        )}

        <div role="tabpanel">
          {tabActiva === 'especializada' && resultado.metadatos.modalidad !== 'general' ? (
            <>
              {resultado.metadatos.modalidad === 'grupos' && resultado.especializado.grupos && <ResultadoGrupos analisis={resultado} datos={resultado.especializado.grupos} />}
              {resultado.metadatos.modalidad === 'jovenes' && resultado.especializado.jovenes && <ResultadoJovenes analisis={resultado} datos={resultado.especializado.jovenes} />}
              {resultado.metadatos.modalidad === 'ninos' && resultado.especializado.ninos && <ResultadoNinos analisis={resultado} datos={resultado.especializado.ninos} />}
              {resultado.metadatos.modalidad === 'devocionales' && resultado.especializado.devocionales && <ResultadoDevocionales analisis={resultado} datos={resultado.especializado.devocionales} />}
            </>
          ) : (
            <ResultadoGeneral analisis={resultado} />
          )}
        </div>
      </div>
    </section>
  );
}
