'use client';

import type { ResultadoAnalisis } from '@/lib/tipos';
import { preguntasReflexion } from '@/lib/reflexion';
import { construirReferencias } from '@/lib/referencias';
import { Caja, Cita, Lista } from './ui';

export default function ResultadoGeneral({ analisis }: { analisis: ResultadoAnalisis }) {
  const preguntas = preguntasReflexion(analisis);
  const referencias = construirReferencias(analisis);

  return (
    <article className="space-y-8 font-sans">
      {/* 1. ENCABEZADO Y FUNDAMENTO BÍBLICO */}
      <header className="rounded-[16px] border border-[var(--linea)] bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#f0ded3] pb-3">
          <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--coralOscuro)]">
            Bosquejo de Enseñanza Bíblica · MAIM
          </span>
          <span className="rounded-full bg-[#fbf2e6] px-3 py-1 text-[10px] font-semibold text-[var(--tinta)]">
            Enseñanza Bíblica Oficial
          </span>
        </div>

        <h2 className="mt-4 text-[22px] sm:text-[26px] font-bold leading-tight text-[var(--tinta)]">
          {analisis.titulo}
        </h2>

        {analisis.texto_biblico_principal.cita && (
          <div className="mt-4">
            <p className="mb-1.5 text-[10.5px] font-bold uppercase tracking-[0.1em] text-[var(--coralOscuro)]">
              Pasaje bíblico base
            </p>
            <Cita versiculo={analisis.texto_biblico_principal} />
          </div>
        )}

        {/* Introducción / Tesis vivencial integrada (sin etiquetas administrativas) */}
        {(analisis.idea_principal || analisis.proposito || analisis.contexto_general || analisis.interpretacion) && (
          <div className="mt-5 space-y-3 rounded-[12px] bg-[#fbf7ee] p-4 sm:p-5">
            {analisis.idea_principal && (
              <p className="text-[14px] font-semibold leading-relaxed text-[var(--tinta)]">
                {analisis.idea_principal}
              </p>
            )}
            {analisis.interpretacion && (
              <p className="text-[13px] italic leading-relaxed text-[var(--texto)]">
                {analisis.interpretacion}
              </p>
            )}
            {(analisis.proposito || analisis.contexto_general) && (
              <p className="text-[12.5px] leading-relaxed text-[var(--muted)]">
                {analisis.proposito && <span className="font-medium text-[var(--texto)]">{analisis.proposito} </span>}
                {analisis.contexto_general}
              </p>
            )}
          </div>
        )}
      </header>

      {/* 2. CUERPO Y DESARROLLO DEL MENSAJE (Apartados progresivos estilo MAIM) */}
      <section className="space-y-6">
        <div className="flex items-center gap-2 border-b border-[var(--linea)] pb-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--coralOscuro)]">
            Desarrollo del Mensaje
          </span>
        </div>

        {analisis.desarrollo_progresivo.length === 0 ? (
          <p className="rounded-[10px] bg-[#f8f2e8] p-4 text-[13px] italic text-[var(--muted)]">
            No se identificaron puntos de desarrollo claramente expuestos en el mensaje.
          </p>
        ) : (
          analisis.desarrollo_progresivo.map((punto, idx) => {
            const letraApartado = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'][idx] || String(idx + 1);
            return (
              <div
                key={`${punto.punto}-${idx}`}
                className="rounded-[16px] border border-[var(--linea)] bg-white p-5 sm:p-6 shadow-sm"
              >
                {/* Cabecera del apartado (Ej: A. EL DERRAMAMIENTO DEL ESPÍRITU) */}
                <div className="flex items-baseline gap-3 border-b border-[#f3e7da] pb-3">
                  <span className="text-[18px] font-bold text-[var(--coralOscuro)]">
                    {letraApartado}.
                  </span>
                  <h3 className="text-[16px] sm:text-[18px] font-bold text-[var(--tinta)] leading-snug">
                    {punto.punto}
                  </h3>
                </div>

                {/* Versículos intercalados directamente dentro del apartado */}
                {punto.versiculos.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {punto.versiculos.map((v, vi) => (
                      <Cita key={`${v.cita}-${vi}`} versiculo={v} />
                    ))}
                  </div>
                )}

                {/* Exposición doctrinal y pastoral en primera persona */}
                {punto.explicacion && (
                  <div className="mt-4 text-[14px] leading-[1.85] text-[var(--texto)]">
                    <p>{punto.explicacion}</p>
                  </div>
                )}

                {/* Subapartados organizados orgánicamente */}
                {punto.subtemas.length > 0 && (
                  <div className="mt-5 space-y-3 border-l-2 border-[var(--coral)] pl-3 sm:pl-4">
                    {punto.subtemas.map((sub, sIdx) => (
                      <div key={`${sub.titulo}-${sIdx}`}>
                        {sub.titulo && (
                          <h4 className="text-[13.5px] font-semibold text-[var(--coralOscuro)]">
                            {sub.titulo}
                          </h4>
                        )}
                        {sub.desarrollo && (
                          <p className="mt-1 text-[13px] leading-relaxed text-[var(--texto)]">
                            {sub.desarrollo}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Pasajes complementarios citados si existen */}
        {analisis.otros_textos.length > 0 && (
          <div className="rounded-[12px] border border-[var(--linea)] bg-[#fffdf8] p-4 sm:p-5">
            <h4 className="mb-2 text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--coralOscuro)]">
              Otros pasajes bíblicos citados en la enseñanza
            </h4>
            <div className="grid gap-2 sm:grid-cols-2">
              {analisis.otros_textos.map((v, i) => (
                <Cita key={`${v.cita}-${i}`} versiculo={v} />
              ))}
            </div>
          </div>
        )}
      </section>

      {/* 3. CIERRE, APLICACIÓN VIVENCIAL Y ORACIÓN */}
      {(analisis.conclusion || analisis.aplicacion.length > 0 || preguntas.length > 0 || analisis.oracion) && (
        <section className="rounded-[16px] border border-[#f0c3b8] bg-[#fffaf5] p-5 sm:p-7 shadow-sm space-y-5">
          <div className="border-b border-[#f3ded3] pb-3">
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--coralOscuro)]">
              Cierre, Exhortación y Respuesta Personal
            </span>
            {analisis.conclusion && (
              <p className="mt-2 text-[14px] leading-[1.8] font-medium text-[var(--tinta)]">
                {analisis.conclusion}
              </p>
            )}
          </div>

          {analisis.aplicacion.length > 0 && (
            <div>
              <h4 className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--coralOscuro)]">
                Aplicación para la vida personal y ministerio
              </h4>
              <Lista items={analisis.aplicacion} numerada />
            </div>
          )}

          {preguntas.length > 0 && (
            <div className="rounded-[12px] border border-[#ebd8cb] bg-white p-4">
              <h4 className="mb-2 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--tinta)]">
                Preguntas para el autoexamen del corazón
              </h4>
              <Lista items={preguntas} numerada />
            </div>
          )}

          {analisis.oracion && (
            <div className="mt-4">
              <Caja tono="coral" etiqueta="Oración de consagración y clamor">
                {analisis.oracion}
              </Caja>
            </div>
          )}
        </section>
      )}

      {/* APÉNDICE DESPLEGABLE: INVENTARIO DE REFERENCIAS */}
      {referencias.length > 0 && (
        <footer className="border-t border-[var(--linea)] pt-4 text-[12px]">
          <details className="group cursor-pointer">
            <summary className="font-semibold text-[var(--muted)] transition hover:text-[var(--coralOscuro)]">
              Inventario de referencias bíblicas ({referencias.length})
            </summary>
            <div className="mt-3 overflow-hidden rounded-[10px] border border-[var(--linea)] bg-white">
              {referencias.map((ref) => (
                <div
                  key={ref.cita}
                  className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--linea)] px-4 py-2.5 last:border-b-0 text-[12px]"
                >
                  <span className="font-semibold text-[var(--tinta)]">{ref.cita}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-[var(--muted)]">{ref.traduccion}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.06em] ${
                        ref.estado === 'verificada' ? 'bg-[#e8f5e9] text-[#2f6b3a]' : 'bg-[#fff3d7] text-[#7a4b14]'
                      }`}
                    >
                      {ref.estado === 'verificada' ? 'Verificada' : 'Pendiente'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </details>
        </footer>
      )}
    </article>
  );
}
