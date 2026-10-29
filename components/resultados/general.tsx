'use client';

import type { ResultadoAnalisis } from '@/lib/tipos';
import { preguntasReflexion } from '@/lib/reflexion';
import { construirReferencias, notaReferencias } from '@/lib/referencias';
import { Bloque, Caja, Chips, Cita, Lista, SeccionResultado, SinContenido } from './ui';

export default function ResultadoGeneral({ analisis }: { analisis: ResultadoAnalisis }) {
  const preguntas = preguntasReflexion(analisis);
  const referencias = construirReferencias(analisis);
  const notaVerificacion = notaReferencias(referencias);
  const tieneContexto = Boolean(analisis.contexto_biblico || analisis.contexto_historico || analisis.contexto_literario || analisis.relacion_textos || analisis.interpretacion);

  return (
    <div>
      <SeccionResultado numero="01" titulo="Idea central y propósito">
        {analisis.idea_principal ? <Caja etiqueta="Idea central del mensaje">{analisis.idea_principal}</Caja> : <SinContenido mensaje="El mensaje no ofreció una idea central explícita." />}
        {(analisis.tema_principal || analisis.proposito || analisis.contexto_general) && (
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            {analisis.tema_principal && <div><dt className="text-[9.5px] font-bold uppercase tracking-[0.11em] text-[var(--muted)]">Tema principal</dt><dd className="mt-1 text-[13px] leading-relaxed text-[var(--texto)]">{analisis.tema_principal}</dd></div>}
            {analisis.proposito && <div><dt className="text-[9.5px] font-bold uppercase tracking-[0.11em] text-[var(--muted)]">Propósito</dt><dd className="mt-1 text-[13px] leading-relaxed text-[var(--texto)]">{analisis.proposito}</dd></div>}
            {analisis.contexto_general && <div className="sm:col-span-2"><dt className="text-[9.5px] font-bold uppercase tracking-[0.11em] text-[var(--muted)]">Contexto general</dt><dd className="mt-1 text-[13px] leading-relaxed text-[var(--texto)]">{analisis.contexto_general}</dd></div>}
          </dl>
        )}
      </SeccionResultado>

      <SeccionResultado numero="02" titulo="Fundamento bíblico">
        <Cita versiculo={analisis.texto_biblico_principal} />
        {tieneContexto && (
          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            {analisis.contexto_biblico && <div><h4 className="mb-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--coralOscuro)]">Contexto del pasaje</h4><p className="text-[13px] leading-relaxed text-[var(--texto)]">{analisis.contexto_biblico}</p></div>}
            {analisis.contexto_historico && <div><h4 className="mb-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--coralOscuro)]">Contexto histórico</h4><p className="text-[13px] leading-relaxed text-[var(--texto)]">{analisis.contexto_historico}</p></div>}
            {analisis.contexto_literario && <div><h4 className="mb-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--coralOscuro)]">Contexto literario</h4><p className="text-[13px] leading-relaxed text-[var(--texto)]">{analisis.contexto_literario}</p></div>}
            {analisis.relacion_textos && <div><h4 className="mb-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--coralOscuro)]">Relación entre los textos</h4><p className="text-[13px] leading-relaxed text-[var(--texto)]">{analisis.relacion_textos}</p></div>}
            {analisis.interpretacion && <div className="sm:col-span-2"><h4 className="mb-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--coralOscuro)]">Lectura y significado doctrinal</h4><p className="text-[13px] italic leading-relaxed text-[var(--texto)]">{analisis.interpretacion}</p></div>}
          </div>
        )}
        {analisis.otros_textos.length > 0 && (
          <Bloque titulo="Otros textos citados">
            <div className="grid gap-3 sm:grid-cols-2">
              {analisis.otros_textos.map((versiculo, indice) => <Cita key={`${versiculo.cita}-${indice}`} versiculo={versiculo} />)}
            </div>
          </Bloque>
        )}
      </SeccionResultado>

      <SeccionResultado numero="03" titulo="Desarrollo del mensaje">
        {analisis.desarrollo_progresivo.length === 0 && <SinContenido mensaje="No se identificaron puntos de desarrollo claramente expuestos." />}
        <div className="space-y-5">
          {analisis.desarrollo_progresivo.map((punto, indice) => (
            <article key={`${punto.punto}-${indice}`} className="rounded-[12px] border border-[var(--linea)] bg-white p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--tinta)] text-[11px] font-bold text-white">{String(indice + 1).padStart(2, '0')}</span>
                <div className="min-w-0 flex-1">
                  <h4 className="text-[14px] font-semibold leading-snug text-[var(--tinta)]">{punto.punto || `Punto ${indice + 1}`}</h4>
                  {punto.explicacion && <p className="mt-2 text-[13px] leading-relaxed text-[var(--texto)]">{punto.explicacion}</p>}
                  {punto.subtemas.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {punto.subtemas.map((subtema) => (
                        <div key={subtema.titulo} className="border-l-2 border-[#ead9c9] pl-3">
                          {subtema.titulo && <p className="text-[12px] font-semibold text-[var(--coralOscuro)]">{subtema.titulo}</p>}
                          {subtema.desarrollo && <p className="mt-1 text-[12.5px] leading-relaxed text-[var(--texto)]">{subtema.desarrollo}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                  {punto.versiculos.map((versiculo, i) => <Cita key={`${versiculo.cita}-${i}`} versiculo={versiculo} />)}
                </div>
              </div>
            </article>
          ))}
        </div>
      </SeccionResultado>

      <SeccionResultado numero="04" titulo="Enseñanzas principales">
        {analisis.ensenanzas.length === 0 && <SinContenido mensaje="El mensaje no permitió aislar enseñanzas principales sin repetir el desarrollo." />}
        <div className="grid gap-3 sm:grid-cols-2">
          {analisis.ensenanzas.map((ensenanza, indice) => (
            <div key={`${ensenanza.sobre}-${indice}`} className="rounded-[12px] bg-[#fbf2e6] p-4">
              {ensenanza.sobre && <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--coralOscuro)]">Sobre {ensenanza.sobre}</p>}
              <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--texto)]">{ensenanza.ensenanza}</p>
            </div>
          ))}
        </div>
      </SeccionResultado>

      {(analisis.conceptos_clave.length > 0 || analisis.conceptos_teologicos.length > 0) && (
        <SeccionResultado numero="05" titulo="Conceptos clave">
          <Chips items={analisis.conceptos_clave} />
          {analisis.conceptos_teologicos.length > 0 && (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {analisis.conceptos_teologicos.map((concepto) => (
                <div key={concepto.concepto} className="rounded-[10px] border border-[var(--linea)] px-3.5 py-3">
                  <p className="text-[12px] font-semibold text-[var(--tinta)]">{concepto.concepto}</p>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-[var(--texto)]">{concepto.significado}</p>
                </div>
              ))}
            </div>
          )}
        </SeccionResultado>
      )}

      <SeccionResultado numero="06" titulo="Aplicación y reflexión">
        {analisis.aplicacion.length > 0 && <Lista items={analisis.aplicacion} />}
        {preguntas.length > 0 && (
          <Bloque titulo="Para reflexionar">
            <Lista items={preguntas} numerada />
          </Bloque>
        )}
        {analisis.aplicacion.length === 0 && preguntas.length === 0 && <SinContenido mensaje="El mensaje no ofreció aplicaciones explícitas." />}
      </SeccionResultado>

      {referencias.length > 0 && (
        <SeccionResultado numero="R" titulo="Inventario de referencias bíblicas">
          <p className="mb-3 text-[12px] leading-relaxed text-[var(--muted)]">{notaVerificacion}</p>
          <div className="overflow-hidden rounded-[12px] border border-[var(--linea)]">
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
      {(analisis.conclusion || analisis.oracion) && (
        <SeccionResultado numero="07" titulo="Conclusión y oración">
          {analisis.conclusion && <Caja etiqueta="Conclusión del estudio">{analisis.conclusion}</Caja>}
          {analisis.oracion && <div className="mt-4"><Caja tono="coral" etiqueta="Oración sugerida">{analisis.oracion}</Caja></div>}
        </SeccionResultado>
      )}
    </div>
  );
}
