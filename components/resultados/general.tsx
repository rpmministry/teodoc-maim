'use client';

import type { ResultadoAnalisis } from '@/lib/tipos';
import { preguntasReflexion } from '@/lib/reflexion';
import { construirReferencias, notaReferencias } from '@/lib/referencias';
import { Bloque, Caja, Chips, Cita, Lista, SeccionResultado, SinContenido } from './ui';

export default function ResultadoGeneral({ analisis }: { analisis: ResultadoAnalisis }) {
  const preguntas = preguntasReflexion(analisis);
  const referencias = construirReferencias(analisis);
  const notaVerificacion = notaReferencias(referencias);
  const tieneContexto = Boolean(
    analisis.contexto_biblico ||
    analisis.contexto_historico ||
    analisis.contexto_literario ||
    analisis.relacion_textos ||
    analisis.interpretacion
  );

  return (
    <div className="space-y-6">
      {/* 01. FUNDAMENTO BÍBLICO E IDEA CENTRAL */}
      <SeccionResultado numero="01" titulo="Fundamento bíblico e idea central">
        {analisis.idea_principal ? (
          <Caja etiqueta="Idea central del mensaje">{analisis.idea_principal}</Caja>
        ) : (
          <SinContenido mensaje="El mensaje no ofreció una idea central explícita." />
        )}

        {(analisis.tema_principal || analisis.proposito || analisis.contexto_general) && (
          <dl className="mt-4 grid gap-4 rounded-[12px] border border-[var(--linea)] bg-white p-4 sm:grid-cols-2">
            {analisis.tema_principal && (
              <div>
                <dt className="text-[9.5px] font-bold uppercase tracking-[0.11em] text-[var(--muted)]">Tema principal</dt>
                <dd className="mt-1 text-[13px] font-medium leading-relaxed text-[var(--tinta)]">{analisis.tema_principal}</dd>
              </div>
            )}
            {analisis.proposito && (
              <div>
                <dt className="text-[9.5px] font-bold uppercase tracking-[0.11em] text-[var(--muted)]">Propósito espiritual</dt>
                <dd className="mt-1 text-[13px] font-medium leading-relaxed text-[var(--tinta)]">{analisis.proposito}</dd>
              </div>
            )}
            {analisis.contexto_general && (
              <div className="sm:col-span-2 border-t border-[#f3e7da] pt-3">
                <dt className="text-[9.5px] font-bold uppercase tracking-[0.11em] text-[var(--muted)]">Contexto general</dt>
                <dd className="mt-1 text-[13px] leading-relaxed text-[var(--texto)]">{analisis.contexto_general}</dd>
              </div>
            )}
          </dl>
        )}

        <div className="mt-5">
          <p className="mb-1 text-[10.5px] font-bold uppercase tracking-[0.1em] text-[var(--coralOscuro)]">Pasaje bíblico base</p>
          <Cita versiculo={analisis.texto_biblico_principal} />
        </div>

        {tieneContexto && (
          <div className="mt-4 grid gap-4 rounded-[12px] bg-[#fbf7ee] p-4 sm:grid-cols-2">
            {analisis.contexto_biblico && (
              <div>
                <h4 className="mb-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--coralOscuro)]">Contexto del pasaje</h4>
                <p className="text-[12.5px] leading-relaxed text-[var(--texto)]">{analisis.contexto_biblico}</p>
              </div>
            )}
            {analisis.contexto_historico && (
              <div>
                <h4 className="mb-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--coralOscuro)]">Contexto histórico</h4>
                <p className="text-[12.5px] leading-relaxed text-[var(--texto)]">{analisis.contexto_historico}</p>
              </div>
            )}
            {analisis.contexto_literario && (
              <div>
                <h4 className="mb-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--coralOscuro)]">Contexto literario</h4>
                <p className="text-[12.5px] leading-relaxed text-[var(--texto)]">{analisis.contexto_literario}</p>
              </div>
            )}
            {analisis.relacion_textos && (
              <div>
                <h4 className="mb-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--coralOscuro)]">Relación entre los textos</h4>
                <p className="text-[12.5px] leading-relaxed text-[var(--texto)]">{analisis.relacion_textos}</p>
              </div>
            )}
            {analisis.interpretacion && (
              <div className="sm:col-span-2 border-t border-[#ebd8cb] pt-3">
                <h4 className="mb-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--coralOscuro)]">Lectura y significado doctrinal</h4>
                <p className="text-[13px] italic leading-relaxed text-[var(--texto)]">{analisis.interpretacion}</p>
              </div>
            )}
          </div>
        )}

        {analisis.otros_textos.length > 0 && (
          <Bloque titulo="Pasajes complementarios citados">
            <div className="grid gap-3 sm:grid-cols-2">
              {analisis.otros_textos.map((versiculo, indice) => (
                <Cita key={`${versiculo.cita}-${indice}`} versiculo={versiculo} />
              ))}
            </div>
          </Bloque>
        )}
      </SeccionResultado>

      {/* 02. CUERPO Y DESARROLLO DEL MENSAJE */}
      <SeccionResultado numero="02" titulo="Cuerpo y desarrollo del mensaje">
        {analisis.desarrollo_progresivo.length === 0 ? (
          <SinContenido mensaje="No se identificaron puntos de desarrollo claramente expuestos." />
        ) : (
          <div className="space-y-5">
            {analisis.desarrollo_progresivo.map((punto, indice) => (
              <article key={`${punto.punto}-${indice}`} className="rounded-[14px] border border-[var(--linea)] bg-white p-5 shadow-sm sm:p-6">
                <div className="flex items-start gap-3.5 border-b border-[#f3e7da] pb-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--coralOscuro)] text-[12px] font-bold text-white shadow-sm">
                    {String(indice + 1).padStart(2, '0')}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-[15px] font-bold leading-snug text-[var(--tinta)]">
                      {punto.punto || `Punto ${indice + 1}`}
                    </h4>
                    {punto.versiculos.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {punto.versiculos.map((v, vi) => (
                          <span key={vi} className="rounded bg-[#fbf2e6] px-2 py-0.5 text-[10.5px] font-semibold text-[var(--coralOscuro)]">
                            {v.cita}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {punto.explicacion && (
                  <p className="mt-4 text-[13.5px] leading-[1.8] text-[var(--texto)]">
                    {punto.explicacion}
                  </p>
                )}

                {punto.subtemas.length > 0 && (
                  <div className="mt-4 space-y-3 pl-2 sm:pl-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--muted)]">Subapartados y desarrollo</p>
                    {punto.subtemas.map((subtema, sIdx) => (
                      <div key={`${subtema.titulo}-${sIdx}`} className="rounded-[10px] border-l-2 border-[var(--coral)] bg-[#fbf7ee] p-3.5">
                        {subtema.titulo && (
                          <p className="text-[13px] font-semibold text-[var(--coralOscuro)]">{subtema.titulo}</p>
                        )}
                        {subtema.desarrollo && (
                          <p className="mt-1.5 text-[12.5px] leading-relaxed text-[var(--texto)]">{subtema.desarrollo}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {punto.versiculos.some((v) => v.texto) && (
                  <div className="mt-4">
                    {punto.versiculos.filter((v) => v.texto).map((versiculo, i) => (
                      <Cita key={`${versiculo.cita}-${i}`} versiculo={versiculo} />
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}

        {/* Síntesis doctrinal de apoyo */}
        {analisis.ensenanzas.length > 0 && (
          <div className="mt-6 rounded-[14px] border border-[#ecd5c5] bg-[#fffaf5] p-5">
            <h4 className="mb-3 text-[12px] font-bold uppercase tracking-[0.1em] text-[var(--coralOscuro)]">
              Enseñanzas y verdades doctrinales centrales
            </h4>
            <div className="grid gap-3 sm:grid-cols-2">
              {analisis.ensenanzas.map((ensenanza, indice) => (
                <div key={`${ensenanza.sobre}-${indice}`} className="rounded-[10px] border border-[#f0ded3] bg-white p-3.5">
                  {ensenanza.sobre && (
                    <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--coralOscuro)]">
                      Sobre {ensenanza.sobre}
                    </p>
                  )}
                  <p className="mt-1 text-[12.5px] leading-relaxed text-[var(--texto)]">{ensenanza.ensenanza}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Conceptos teológicos y glosario */}
        {(analisis.conceptos_clave.length > 0 || analisis.conceptos_teologicos.length > 0) && (
          <div className="mt-6 rounded-[14px] border border-[var(--linea)] bg-white p-5">
            <h4 className="mb-3 text-[12px] font-bold uppercase tracking-[0.1em] text-[var(--tinta)]">
              Conceptos clave y teológicos del mensaje
            </h4>
            {analisis.conceptos_clave.length > 0 && <Chips items={analisis.conceptos_clave} />}
            {analisis.conceptos_teologicos.length > 0 && (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {analisis.conceptos_teologicos.map((concepto) => (
                  <div key={concepto.concepto} className="rounded-[10px] bg-[#fbf2e6] p-3.5">
                    <p className="text-[12px] font-semibold text-[var(--coralOscuro)]">{concepto.concepto}</p>
                    <p className="mt-1 text-[12.5px] leading-relaxed text-[var(--texto)]">{concepto.significado}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </SeccionResultado>

      {/* 03. CIERRE, APLICACIÓN Y RESPUESTA PERSONAL */}
      <SeccionResultado numero="03" titulo="Cierre, aplicación y respuesta personal">
        {analisis.conclusion && (
          <Caja tono="crema" etiqueta="Conclusión del estudio bíblico">
            {analisis.conclusion}
          </Caja>
        )}

        {analisis.aplicacion.length > 0 && (
          <Bloque titulo="Aplicación práctica para la vida personal y de fe">
            <Lista items={analisis.aplicacion} numerada />
          </Bloque>
        )}

        {preguntas.length > 0 && (
          <Bloque titulo="Preguntas para el autoexamen y reflexión personal">
            <div className="rounded-[12px] border border-[#f0ded3] bg-[#fffcf7] p-4">
              <Lista items={preguntas} numerada />
            </div>
          </Bloque>
        )}

        {analisis.oracion && (
          <div className="mt-5">
            <Caja tono="coral" etiqueta="Oración sugerida de consagración y respuesta">
              {analisis.oracion}
            </Caja>
          </div>
        )}
      </SeccionResultado>

      {/* R. INVENTARIO DE REFERENCIAS BÍBLICAS */}
      {referencias.length > 0 && (
        <SeccionResultado numero="R" titulo="Inventario de referencias bíblicas">
          <p className="mb-3 text-[12px] leading-relaxed text-[var(--muted)]">{notaVerificacion}</p>
          <div className="overflow-hidden rounded-[12px] border border-[var(--linea)] bg-white">
            {referencias.map((referencia) => (
              <div key={referencia.cita} className="flex flex-wrap items-start justify-between gap-2 border-b border-[var(--linea)] px-4 py-3 last:border-b-0">
                <div>
                  <p className="text-[12.5px] font-semibold text-[var(--tinta)]">{referencia.cita}</p>
                  <p className="mt-0.5 text-[11px] text-[var(--muted)]">
                    {referencia.tipoUso === 'lectura_o_cita' ? 'Lectura o cita principal' : 'Referencia detectada'} · {referencia.traduccion}
                    {referencia.licencia ? ` · ${referencia.licencia}` : ''}
                  </p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[9.5px] font-bold uppercase tracking-[0.06em] ${referencia.estado === 'verificada' ? 'bg-[#e8f5e9] text-[#2f6b3a]' : 'bg-[#fff3d7] text-[#7a4b14]'}`}>
                  {referencia.estado === 'verificada' ? 'Verificada' : 'Pendiente de verificación'}
                </span>
              </div>
            ))}
          </div>
        </SeccionResultado>
      )}
    </div>
  );
}
