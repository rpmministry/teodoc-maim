'use client';

import { useEffect, useRef, useState } from 'react';
import type { SnapshotTrabajo } from '@/lib/tracker-analisis';
import { formatearTiempoSegundos } from '@/lib/tracker-analisis';
import { ETAPAS_ANALISIS, type EtapaAnalisisId } from '@/lib/analisis-progreso-tipos';
import { obtenerModalidad } from '@/lib/modalidades';
import { IconoCheck, IconoModalidad } from './marca';

interface Props {
  trabajo: SnapshotTrabajo;
  reconectando?: boolean;
  minimizado: boolean;
  onMinimizar: (minimizado: boolean) => void;
  onCancelar?: () => void;
  onVerResultado?: () => void;
}

export default function ProgresoAnalisis({
  trabajo,
  reconectando = false,
  minimizado,
  onMinimizar,
  onCancelar,
  onVerResultado,
}: Props) {
  const modalidadInfo = obtenerModalidad(trabajo.modalidad);
  const [anuncioLector, setAnuncioLector] = useState('');
  const ultimaEtapaAnunciadaRef = useRef<string>('');

  // Notificar al lector de pantalla únicamente ante cambios de etapa relevantes
  useEffect(() => {
    if (trabajo.etapaActual && trabajo.etapaActual !== ultimaEtapaAnunciadaRef.current) {
      ultimaEtapaAnunciadaRef.current = trabajo.etapaActual;
      const etapaActualObj = ETAPAS_ANALISIS.find((e) => e.id === trabajo.etapaActual);
      if (etapaActualObj) {
        setAnuncioLector(`Etapa actual: ${etapaActualObj.nombre}. ${trabajo.progreso}% completado.`);
      }
    } else if (trabajo.estado === 'completado') {
      setAnuncioLector(`El análisis de ${trabajo.titulo} se ha completado al 100%. Tu documento está listo.`);
    }
  }, [trabajo.etapaActual, trabajo.estado, trabajo.progreso, trabajo.titulo]);

  const etapasFiltradas = ETAPAS_ANALISIS.filter((e) => {
    if (!trabajo.huella && e.id === 'extraccion_transcripcion') return false;
    if (trabajo.modalidad === 'general' && e.id === 'redaccion_especialidad') return false;
    return true;
  });

  const porcentaje = Math.max(4, Math.min(100, Math.round(trabajo.progreso)));
  const esCompletado = trabajo.estado === 'completado';

  // =========================================================================
  // VISTA MINIMIZADA (Píldora flotante compacta y no invasiva)
  // =========================================================================
  if (minimizado) {
    return (
      <aside
        aria-label="Progreso minimizado del análisis"
        className="fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-full border border-white/15 bg-[var(--tinta)] px-4 py-2.5 text-white shadow-[0_12px_40px_rgba(42,38,36,0.35)] backdrop-blur-md transition-all sm:right-6 sm:bottom-6 max-w-[calc(100vw-2rem)]"
      >
        <span className="sr-only" aria-live="polite">
          {anuncioLector}
        </span>

        {/* Indicador de estado */}
        <div className="relative flex h-8 w-8 shrink-0 items-center justify-center">
          {esCompletado ? (
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#276738] text-white">
              <IconoCheck className="h-4 w-4" />
            </span>
          ) : (
            <div className="relative flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-[11px] font-bold text-[#ffd8a8]">
              <span className="h-2 w-2 animate-ping rounded-full bg-[var(--coral)] opacity-75" />
              <span className="absolute">{porcentaje}%</span>
            </div>
          )}
        </div>

        {/* Información resumida */}
        <div className="flex flex-col">
          <span className="text-[11px] font-semibold text-white/90 truncate max-w-[150px] sm:max-w-[200px]">
            {trabajo.titulo || 'Estudio en proceso'}
          </span>
          <span className="text-[9.5px] text-[#ffd8a8]/80 font-medium">
            {esCompletado
              ? '¡Completado! Clic para ver'
              : `${modalidadInfo.nombre} · ${formatearTiempoSegundos(trabajo.tiempoTranscurridoSegundos)}`}
          </span>
        </div>

        {/* Botones de acción */}
        <div className="flex items-center gap-1.5 pl-1">
          {esCompletado ? (
            <button
              type="button"
              onClick={onVerResultado}
              className="rounded-full bg-[var(--coral)] px-3 py-1 text-[11px] font-bold text-white transition hover:bg-[var(--coralOscuro)]"
            >
              Ver resultado
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onMinimizar(false)}
              className="rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold text-white transition hover:bg-white/25"
            >
              Ver progreso
            </button>
          )}
        </div>
      </aside>
    );
  }

  // =========================================================================
  // VISTA MAXIMIZADA (Experiencia completa con psicología de la espera)
  // =========================================================================
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-progreso"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#1c1110]/70 p-3 sm:p-4 backdrop-blur-sm overflow-y-auto"
    >
      <div className="sr-only" aria-live="polite">
        {anuncioLector}
      </div>

      <div className="relative my-auto w-full max-w-2xl rounded-[22px] border border-[#ebd8cb] bg-[#fffdfa] p-5 shadow-[0_24px_70px_rgba(42,38,36,0.3)] sm:p-8">
        {/* Cabecera del Panel */}
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#f0e4d7] pb-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fbf2e6] px-2.5 py-0.5 text-[10.5px] font-bold uppercase tracking-wider text-[var(--coralOscuro)]">
                <IconoModalidad tipo={modalidadInfo.icono} />
                {modalidadInfo.nombre}
              </span>
              {reconectando && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#fff4e5] px-2 py-0.5 text-[10px] font-semibold text-[#8f5214]">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#d97706]" />
                  Reconectando…
                </span>
              )}
            </div>

            <h2 id="titulo-progreso" className="mt-2 text-[18px] font-bold tracking-tight text-[var(--tinta)] sm:text-[22px] break-words">
              {trabajo.titulo || 'Análisis de la prédica'}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onMinimizar(true)}
              className="rounded-full border border-[#d8c4b8] bg-white px-3 py-1.5 text-[11.5px] font-semibold text-[var(--texto)] shadow-sm hover:bg-[#faf4ec] transition"
              title="Continuar utilizando la plataforma mientras se procesa"
            >
              Minimizar
            </button>
          </div>
        </div>

        {/* Indicador de Porcentaje Destacado */}
        <div className="mt-6 flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <span className="text-[34px] font-extrabold tracking-tight text-[var(--tinta)] sm:text-[42px] tabular-nums">
              {porcentaje} %
            </span>
            <span className="ml-2 text-[12px] font-semibold text-[var(--muted)]">
              {esCompletado ? 'Completado' : trabajo.esEstimado ? 'Progreso estimado en tiempo real' : 'Progreso verificado'}
            </span>
          </div>

          <div className="text-right text-[12px] font-medium text-[var(--texto)]">
            <p>
              <span className="text-[var(--muted)]">Transcurrido:</span>{' '}
              <span className="font-semibold tabular-nums">{formatearTiempoSegundos(trabajo.tiempoTranscurridoSegundos)}</span>
            </p>
            {!esCompletado && trabajo.tiempoEstimadoRestanteSegundos > 0 && (
              <p className="mt-0.5 text-[11px] text-[var(--coralOscuro)] font-semibold">
                <span>Restante estimado:</span>{' '}
                <span className="tabular-nums">aprox. {formatearTiempoSegundos(trabajo.tiempoEstimadoRestanteSegundos)}</span>
              </p>
            )}
          </div>
        </div>

        {/* Barra de Progreso Accesible */}
        <div className="mt-3">
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={porcentaje}
            aria-label={`Progreso del análisis: ${porcentaje}%`}
            className="h-3 w-full overflow-hidden rounded-full bg-[#ebdcd0]"
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-[var(--coral)] to-[var(--coralOscuro)] transition-all duration-700 ease-out"
              style={{ width: `${porcentaje}%` }}
            />
          </div>
        </div>

        {/* Mensaje Contextual Dinámico (Psicología de la Espera) */}
        <div className="mt-5 rounded-[14px] border border-[#ebd8cb] bg-[#faf4ec] p-4 text-[13px] leading-relaxed text-[var(--tinta)]">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--coralOscuro)] text-white">
              <span className="h-2 w-2 animate-ping rounded-full bg-white opacity-80" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-[var(--tinta)]">
                {trabajo.mensaje || 'Estamos profundizando en las enseñanzas de la prédica…'}
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-[var(--muted)]">
                {trabajo.tiempoTranscurridoSegundos > 90 && !esCompletado
                  ? 'El análisis continúa en proceso. El tiempo puede variar según la extensión, cantidad de Escrituras y densidad doctrinal del mensaje.'
                  : 'Puedes minimizar este panel para consultar la biblioteca o continuar usando TeoDoc MAIM mientras termina.'}
              </p>
            </div>
          </div>
        </div>

        {/* Stepper de Etapas (Transparencia de Estado) */}
        <div className="mt-6">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
            Etapas del análisis ministerial
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 md:grid-cols-3">
            {etapasFiltradas.map((etapa, idx) => {
              const estaCompletada = trabajo.etapasCompletadas.includes(etapa.id) || esCompletado;
              const estaActiva = trabajo.etapaActual === etapa.id && !esCompletado;

              return (
                <div
                  key={etapa.id}
                  className={`flex items-start gap-2.5 rounded-[10px] p-2.5 text-[11.5px] transition-colors ${
                    estaActiva
                      ? 'border border-[var(--coralOscuro)] bg-white shadow-xs'
                      : estaCompletada
                        ? 'border border-[#cbe4cf] bg-[#f2f9f3]'
                        : 'border border-transparent bg-transparent text-[var(--muted)]'
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                      estaCompletada
                        ? 'bg-[#276738] text-white'
                        : estaActiva
                          ? 'bg-[var(--coralOscuro)] text-white'
                          : 'bg-[#e4d5c9] text-[var(--tinta)]'
                    }`}
                  >
                    {estaCompletada ? <IconoCheck className="h-3 w-3" /> : idx + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={`font-semibold leading-tight ${estaActiva ? 'text-[var(--tinta)]' : ''}`}>
                      {etapa.nombre}
                    </p>
                    <p className="mt-0.5 text-[10px] leading-tight text-[var(--muted)] truncate">
                      {etapa.descripcion}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Acciones y Cierre */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[#f0e4d7] pt-4">
          <div className="flex items-center gap-2 text-[11.5px] text-[var(--muted)]">
            <span className="h-2 w-2 rounded-full bg-[#276738]" />
            <span>Trazabilidad y fidelidad bíblica asegurada</span>
          </div>

          <div className="flex items-center gap-2">
            {onCancelar && !esCompletado && (
              <button
                type="button"
                onClick={onCancelar}
                className="rounded-full px-3.5 py-1.5 text-[11.5px] font-semibold text-[var(--muted)] hover:text-[#8f2830] transition"
              >
                Cancelar
              </button>
            )}

            {esCompletado ? (
              <button
                type="button"
                onClick={onVerResultado}
                className="btn-primario px-5 py-2 text-[12px] shadow-sm"
              >
                Ver documento completado
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onMinimizar(true)}
                className="btn-secundario px-4 py-2 text-[12px]"
              >
                Continuar usando la plataforma
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
