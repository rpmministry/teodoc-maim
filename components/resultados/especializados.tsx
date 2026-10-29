'use client';

import type { ClaseNinos, EstudioBosquejo, EstudioGrupos, EstudioJovenes, PlanDevocional, ResultadoAnalisis } from '@/lib/tipos';
import { obtenerRangoEdad } from '@/lib/modalidades';
import { Bloque, Caja, Chips, Cita, Dato, Lista, SeccionResultado, SinContenido } from './ui';

function Referencias({ analisis }: { analisis: ResultadoAnalisis }) {
  const referencias = Array.from(new Set([
    analisis.texto_biblico_principal.cita,
    ...analisis.otros_textos.map((versiculo) => versiculo.cita),
  ].filter(Boolean)));
  if (!referencias.length) return null;
  return (
    <SeccionResultado numero="R" titulo="Referencias bíblicas del mensaje">
      <Chips items={referencias} />
    </SeccionResultado>
  );
}

export function ResultadoBosquejo({ analisis, datos }: { analisis: ResultadoAnalisis; datos: EstudioBosquejo }) {
  return (
    <div className="space-y-6">
      <SeccionResultado numero="01" titulo="Encabezado homilético y propósito">
        <div className="rounded-[14px] border border-[var(--linea)] bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--linea)] pb-3">
            <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--coralOscuro)]">Bosquejo Homilético Oficial</span>
            <span className="rounded-full bg-[#fbf2e6] px-3 py-1 text-[10px] font-semibold text-[var(--tinta)]">Liderazgo MAIM</span>
          </div>
          <h3 className="mt-3 text-[20px] font-bold text-[var(--tinta)]">{datos.titulo || analisis.titulo}</h3>
          {datos.tema_central && (
            <p className="mt-1 text-[13px] text-[var(--texto)]">
              <strong className="font-semibold text-[var(--tinta)]">Tema central:</strong> {datos.tema_central}
            </p>
          )}
          {datos.proposito_general && (
            <p className="mt-2 text-[13px] leading-relaxed text-[var(--texto)]">
              <strong className="font-semibold text-[var(--tinta)]">Propósito ministerial:</strong> {datos.proposito_general}
            </p>
          )}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-[12px] bg-[#fbf2e6] p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--coralOscuro)]">Objetivo Cognitivo</p>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-[var(--texto)]">{datos.objetivos?.cognitivo || 'Asimilar con claridad el fundamento doctrinal de la enseñanza.'}</p>
          </div>
          <div className="rounded-[12px] bg-[#fbf2e6] p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--coralOscuro)]">Objetivo Afectivo</p>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-[var(--texto)]">{datos.objetivos?.afectivo || 'Despertar convicción profunda y respuesta del corazón.'}</p>
          </div>
          <div className="rounded-[12px] bg-[#fbf2e6] p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--coralOscuro)]">Objetivo Volitivo</p>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-[var(--texto)]">{datos.objetivos?.volitivo || 'Llevar a una acción concreta y obediencia ministerial.'}</p>
          </div>
        </div>
      </SeccionResultado>

      <SeccionResultado numero="02" titulo="Tesis y fundamento doctrinal">
        {datos.tesis ? <Caja tono="coral" etiqueta="Tesis / Proposición Homilética">{datos.tesis}</Caja> : <SinContenido mensaje="No se definió una proposición homilética explícita." />}
        {datos.fundamento_doctrinal && (
          <div className="mt-4 rounded-[12px] border border-[var(--linea)] bg-white p-4">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-[var(--tinta)]">Fundamento Doctrinal</p>
            <p className="mt-2 text-[13px] leading-relaxed text-[var(--texto)]">{datos.fundamento_doctrinal}</p>
          </div>
        )}
        <div className="mt-4">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--coralOscuro)]">Texto base</p>
          <Cita versiculo={datos.texto_base?.cita ? datos.texto_base : analisis.texto_biblico_principal} />
        </div>
      </SeccionResultado>

      <SeccionResultado numero="03" titulo="Introducción del bosquejo">
        <div className="space-y-3">
          {datos.introduccion?.gancho && (
            <div className="rounded-[12px] border border-[var(--linea)] bg-[#fbf7ee] p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--coralOscuro)]">I. Gancho y Necesidad Humana</p>
              <p className="mt-2 text-[13px] leading-relaxed text-[var(--texto)]">{datos.introduccion.gancho}</p>
            </div>
          )}
          {datos.introduccion?.contexto && (
            <div className="rounded-[12px] border border-[var(--linea)] bg-white p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--muted)]">II. Contexto Histórico-Literario</p>
              <p className="mt-2 text-[13px] leading-relaxed text-[var(--texto)]">{datos.introduccion.contexto}</p>
            </div>
          )}
          {datos.introduccion?.transicion && (
            <div className="rounded-[10px] border-l-[3px] border-[var(--coralOscuro)] bg-[#fdf1e8] p-3 text-[12.5px] italic text-[var(--texto)]">
              <span className="font-semibold text-[var(--coralOscuro)]">Transición al cuerpo del mensaje: </span>
              {datos.introduccion.transicion}
            </div>
          )}
        </div>
      </SeccionResultado>

      <SeccionResultado numero="04" titulo="Desarrollo estructural jerárquico">
        {!datos.puntos_principales || datos.puntos_principales.length === 0 ? (
          <SinContenido mensaje="No se estructuraron puntos principales en el bosquejo." />
        ) : (
          <div className="space-y-6">
            {datos.puntos_principales.map((punto, idx) => (
              <article key={`${punto.romano}-${idx}`} className="rounded-[16px] border border-[var(--linea)] bg-white p-5 shadow-sm sm:p-6">
                <div className="flex items-start gap-3.5 border-b border-[#f0e4d7] pb-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--coralOscuro)] text-[13px] font-bold text-white shadow-sm">
                    {punto.romano || `P${idx + 1}`}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-[16px] font-bold text-[var(--tinta)]">{punto.titulo}</h4>
                      {punto.cita && (
                        <span className="rounded-full bg-[#fbf2e6] px-2.5 py-0.5 text-[10.5px] font-bold text-[var(--coralOscuro)]">
                          {punto.cita}
                        </span>
                      )}
                    </div>
                    {punto.texto_cita && (
                      <p className="mt-1.5 text-[12.5px] italic text-[var(--muted)]">&ldquo;{punto.texto_cita}&rdquo;</p>
                    )}
                  </div>
                </div>

                {punto.exposicion && (
                  <div className="mt-4">
                    <p className="text-[13.5px] leading-[1.8] text-[var(--texto)]">{punto.exposicion}</p>
                  </div>
                )}

                {punto.subpuntos?.length > 0 && (
                  <div className="mt-5 space-y-3 pl-2 sm:pl-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--muted)]">Subpuntos Argumentados</p>
                    {punto.subpuntos.map((sub, sIdx) => (
                      <div key={`${sub.letra}-${sIdx}`} className="rounded-[10px] border-l-2 border-[var(--coral)] bg-[#fbf5ed] p-3.5">
                        <div className="flex items-baseline gap-2">
                          <span className="font-bold text-[var(--coralOscuro)]">{sub.letra}.</span>
                          <h5 className="text-[13.5px] font-semibold text-[var(--tinta)]">{sub.titulo}</h5>
                        </div>
                        {sub.desarrollo && <p className="mt-1.5 text-[12.5px] leading-relaxed text-[var(--texto)]">{sub.desarrollo}</p>}
                        {sub.detalles && sub.detalles.length > 0 && (
                          <ul className="mt-2 list-disc pl-5 text-[12px] leading-relaxed text-[var(--muted)]">
                            {sub.detalles.map((det, dIdx) => (
                              <li key={dIdx}>{det}</li>
                            ))}
                          </ul>
                        )}
                        {sub.pasajes_apoyo && sub.pasajes_apoyo.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {sub.pasajes_apoyo.map((ref, rIdx) => (
                              <span key={rIdx} className="rounded bg-white px-2 py-0.5 text-[10px] font-medium text-[var(--coralOscuro)] border border-[#ebd8cb]">
                                {ref}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {punto.ilustracion && (
                  <div className="mt-4 rounded-[10px] bg-[#fbf2e6] p-3 text-[12px] leading-relaxed text-[var(--texto)]">
                    <strong className="text-[var(--coralOscuro)]">Ilustración / Metáfora:</strong> {punto.ilustracion}
                  </div>
                )}

                {punto.transicion && (
                  <div className="mt-4 text-[12px] italic text-[var(--muted)]">
                    <span className="font-semibold text-[var(--coralOscuro)]">Transición: </span>
                    {punto.transicion}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </SeccionResultado>

      <SeccionResultado numero="05" titulo="Conclusión homilética">
        <div className="space-y-3">
          {datos.conclusion?.recapitulacion && (
            <div className="rounded-[12px] border border-[var(--linea)] bg-white p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--muted)]">Recapitulación sintética</p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--texto)]">{datos.conclusion.recapitulacion}</p>
            </div>
          )}
          {datos.conclusion?.climax && (
            <div className="rounded-[12px] border border-[#f0c3b8] bg-[#fff6f2] p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--coralOscuro)]">Clímax del mensaje</p>
              <p className="mt-1.5 text-[13.5px] font-medium leading-relaxed text-[var(--tinta)]">{datos.conclusion.climax}</p>
            </div>
          )}
        </div>
      </SeccionResultado>

      <SeccionResultado numero="06" titulo="Aplicación pastoral para el liderazgo de MAIM">
        {datos.aplicacion_liderazgo?.length > 0 ? (
          <div className="space-y-2.5">
            {datos.aplicacion_liderazgo.map((item, idx) => (
              <div key={idx} className="flex items-start gap-3 rounded-[12px] border border-[var(--linea)] bg-white p-3.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--coralOscuro)] text-[10px] font-bold text-white">
                  {idx + 1}
                </span>
                <p className="text-[12.5px] leading-relaxed text-[var(--texto)]">{item}</p>
              </div>
            ))}
          </div>
        ) : (
          <SinContenido mensaje="No se incluyeron aplicaciones pastorales específicas para el liderazgo." />
        )}
      </SeccionResultado>

      <SeccionResultado numero="07" titulo="Desafío final y oración de ministración">
        {datos.desafio_final?.llamado && (
          <Caja tono="coral" etiqueta="Llamado y desafío volitivo">
            {datos.desafio_final.llamado}
          </Caja>
        )}
        {datos.desafio_final?.oracion_ministracion && (
          <div className="mt-4">
            <Caja etiqueta="Oración pastoral de ministración">
              {datos.desafio_final.oracion_ministracion}
            </Caja>
          </div>
        )}
      </SeccionResultado>

      <Referencias analisis={analisis} />
    </div>
  );
}

export function ResultadoGrupos({ analisis, datos }: { analisis: ResultadoAnalisis; datos: EstudioGrupos }) {
  return (
    <div>
      <SeccionResultado numero="01" titulo="Objetivo e idea central">
        {datos.objetivo ? <Caja etiqueta="Objetivo del encuentro">{datos.objetivo}</Caja> : <SinContenido mensaje="No se definió un objetivo para el encuentro." />}
        {datos.idea_central && <p className="mt-4 text-[13.5px] leading-relaxed text-[var(--texto)]"><strong className="text-[var(--tinta)]">Idea central:</strong> {datos.idea_central}</p>}
      </SeccionResultado>

      <SeccionResultado numero="02" titulo="Texto y contexto">
        <Cita versiculo={analisis.texto_biblico_principal} />
        {datos.contexto_pasaje && <p className="mt-3 text-[13px] leading-relaxed text-[var(--texto)]">{datos.contexto_pasaje}</p>}
      </SeccionResultado>

      <SeccionResultado numero="03" titulo="Agenda del encuentro">
        {datos.agenda.length === 0 ? <SinContenido mensaje="No se propuso una agenda para este encuentro." /> : (
          <div className="overflow-hidden rounded-[12px] border border-[var(--linea)]">
            <div className="hidden grid-cols-[1.2fr_0.6fr_2fr] gap-3 bg-[var(--coralOscuro)] px-4 py-2.5 text-[9.5px] font-bold uppercase tracking-[0.1em] text-white sm:grid">
              <span>Momento</span><span>Tiempo</span><span>Descripción</span>
            </div>
            {datos.agenda.map((fila, indice) => (
              <div key={`${fila.momento}-${indice}`} className={`grid gap-1 px-4 py-3 sm:grid-cols-[1.2fr_0.6fr_2fr] sm:gap-3 ${indice % 2 === 0 ? 'bg-[#fbf7ee]' : 'bg-white'}`}>
                <p className="text-[12.5px] font-semibold text-[var(--tinta)]">{fila.momento}</p>
                <p className="text-[11.5px] font-semibold text-[var(--coralOscuro)]">{fila.minutos}</p>
                <p className="text-[12.5px] leading-relaxed text-[var(--texto)]">{fila.descripcion}</p>
              </div>
            ))}
          </div>
        )}
      </SeccionResultado>

      {datos.materiales.length > 0 && (
        <SeccionResultado numero="04" titulo="Materiales necesarios">
          <Lista items={datos.materiales} />
        </SeccionResultado>
      )}

      <SeccionResultado numero="05" titulo="Preguntas para el encuentro">
        {datos.preguntas_inicio.length > 0 && <Bloque titulo="Para comenzar"><Lista items={datos.preguntas_inicio} numerada /></Bloque>}
        {datos.preguntas_comprension.length > 0 && <Bloque titulo="Comprender el texto"><Lista items={datos.preguntas_comprension} numerada /></Bloque>}
        {datos.preguntas_reflexion.length > 0 && <Bloque titulo="Reflexión y aplicación"><Lista items={datos.preguntas_reflexion} numerada /></Bloque>}
        {!datos.preguntas_inicio.length && !datos.preguntas_comprension.length && !datos.preguntas_reflexion.length && <SinContenido mensaje="No se generaron preguntas para este encuentro." />}
      </SeccionResultado>

      <SeccionResultado numero="06" titulo="Actividad grupal">
        {datos.actividad.titulo ? (
          <>
            <h4 className="text-[13.5px] font-semibold text-[var(--tinta)]">{datos.actividad.titulo}</h4>
            {datos.actividad.objetivo && <p className="mt-1 text-[12.5px] leading-relaxed text-[var(--texto)]">{datos.actividad.objetivo}</p>}
            {datos.actividad.pasos.length > 0 && <div className="mt-3"><Lista items={datos.actividad.pasos} numerada /></div>}
          </>
        ) : <SinContenido mensaje="No se propuso una actividad grupal." />}
      </SeccionResultado>

      {datos.caso_practico && (
        <SeccionResultado numero="07" titulo="Caso práctico">
          <Caja etiqueta="Para conversar en grupo">{datos.caso_practico}</Caja>
        </SeccionResultado>
      )}

      <SeccionResultado numero="08" titulo="Aplicación y compromiso">
        {datos.aplicaciones.length > 0 && <Lista items={datos.aplicaciones} />}
        {datos.compromiso_semanal && <div className="mt-4"><Caja tono="coral" etiqueta="Compromiso de la semana">{datos.compromiso_semanal}</Caja></div>}
        {!datos.aplicaciones.length && !datos.compromiso_semanal && <SinContenido mensaje="No se generaron aplicaciones para este encuentro." />}
      </SeccionResultado>

      <SeccionResultado numero="09" titulo="Oración">
        {datos.motivos_oracion.length > 0 && <><h4 className="mb-2 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--coralOscuro)]">Motivos de oración</h4><Lista items={datos.motivos_oracion} /></>}
        {datos.oracion_final && <div className="mt-4"><Caja etiqueta="Oración final sugerida">{datos.oracion_final}</Caja></div>}
        {!datos.motivos_oracion.length && !datos.oracion_final && <SinContenido mensaje="No se generó una oración para el cierre." />}
      </SeccionResultado>

      {datos.orientaciones_lider.length > 0 && (
        <SeccionResultado numero="10" titulo="Orientaciones para el líder">
          <Lista items={datos.orientaciones_lider} numerada />
        </SeccionResultado>
      )}

      <Referencias analisis={analisis} />
    </div>
  );
}

export function ResultadoJovenes({ analisis, datos }: { analisis: ResultadoAnalisis; datos: EstudioJovenes }) {
  return (
    <div>
      <SeccionResultado numero="01" titulo="Objetivo y tema">
        {datos.objetivo ? <Caja etiqueta="Objetivo del encuentro">{datos.objetivo}</Caja> : <SinContenido mensaje="No se definió un objetivo para el encuentro." />}
        {datos.tema && <p className="mt-3 text-[13px] leading-relaxed text-[var(--texto)]"><strong className="text-[var(--tinta)]">Tema:</strong> {datos.tema}</p>}
      </SeccionResultado>

      <SeccionResultado numero="02" titulo="Pasaje y contexto">
        <Cita versiculo={analisis.texto_biblico_principal} />
        {datos.contexto_pasaje && <p className="mt-3 text-[13px] leading-relaxed text-[var(--texto)]">{datos.contexto_pasaje}</p>}
      </SeccionResultado>

      {datos.conceptos.length > 0 && (
        <SeccionResultado numero="03" titulo="Conceptos fundamentales">
          <div className="grid gap-3 sm:grid-cols-2">
            {datos.conceptos.map((concepto) => (
              <div key={concepto.concepto} className="rounded-[11px] bg-[#fbf2e6] p-3.5">
                <p className="text-[12px] font-semibold text-[var(--coralOscuro)]">{concepto.concepto}</p>
                <p className="mt-1 text-[12.5px] leading-relaxed text-[var(--texto)]">{concepto.explicacion}</p>
              </div>
            ))}
          </div>
        </SeccionResultado>
      )}

      <SeccionResultado numero="04" titulo="Reflexión y conversación">
        {datos.preguntas_reflexion.length > 0 && <Bloque titulo="Reflexión individual"><Lista items={datos.preguntas_reflexion} numerada /></Bloque>}
        {datos.preguntas_grupales.length > 0 && <Bloque titulo="Conversación grupal"><Lista items={datos.preguntas_grupales} numerada /></Bloque>}
        {!datos.preguntas_reflexion.length && !datos.preguntas_grupales.length && <SinContenido mensaje="No se generaron preguntas para el encuentro." />}
      </SeccionResultado>

      {datos.casos_practicos.length > 0 && (
        <SeccionResultado numero="05" titulo="Casos para conversar">
          <div className="space-y-3">
            {datos.casos_practicos.map((caso, indice) => (
              <div key={`${caso.slice(0, 24)}-${indice}`} className="rounded-[11px] border border-[var(--linea)] p-4">
                <p className="mb-1 text-[9.5px] font-bold uppercase tracking-[0.1em] text-[var(--coralOscuro)]">Caso {indice + 1}</p>
                <p className="text-[12.5px] leading-relaxed text-[var(--texto)]">{caso}</p>
              </div>
            ))}
          </div>
        </SeccionResultado>
      )}

      <SeccionResultado numero="06" titulo="Dinámica participativa">
        {datos.dinamica.titulo ? (
          <>
            <h4 className="text-[13.5px] font-semibold text-[var(--tinta)]">{datos.dinamica.titulo}</h4>
            {datos.dinamica.objetivo && <p className="mt-1 text-[12.5px] leading-relaxed text-[var(--texto)]">{datos.dinamica.objetivo}</p>}
            {datos.dinamica.pasos.length > 0 && <div className="mt-3"><Lista items={datos.dinamica.pasos} numerada /></div>}
          </>
        ) : <SinContenido mensaje="No se propuso una dinámica para este encuentro." />}
      </SeccionResultado>

      <SeccionResultado numero="07" titulo="Aplicación y desafío">
        {datos.aplicaciones.length > 0 && <Lista items={datos.aplicaciones} />}
        {datos.desafio_semanal && <div className="mt-4"><Caja tono="coral" etiqueta="Desafío de la semana">{datos.desafio_semanal}</Caja></div>}
        {!datos.aplicaciones.length && !datos.desafio_semanal && <SinContenido mensaje="No se generaron aplicaciones para este encuentro." />}
      </SeccionResultado>

      <SeccionResultado numero="08" titulo="Oración y guía del líder">
        {datos.motivos_oracion.length > 0 && <><h4 className="mb-2 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--coralOscuro)]">Motivos de oración</h4><Lista items={datos.motivos_oracion} /></>}
        {analisis.oracion && <div className="mt-4"><Caja etiqueta="Oración sugerida">{analisis.oracion}</Caja></div>}
        {datos.guia_lider.length > 0 && <Bloque titulo="Orientaciones para el líder"><Lista items={datos.guia_lider} numerada /></Bloque>}
      </SeccionResultado>

      <Referencias analisis={analisis} />
    </div>
  );
}

export function ResultadoNinos({ analisis, datos }: { analisis: ResultadoAnalisis; datos: ClaseNinos }) {
  const edad = obtenerRangoEdad(analisis.metadatos.rangoEdad);
  return (
    <div>
      <SeccionResultado numero="01" titulo="Datos de la clase">
        <dl className="grid gap-4 rounded-[12px] bg-[#fbf2e6] p-4 sm:grid-cols-3">
          <Dato etiqueta="Rango de edad" valor={edad} />
          <Dato etiqueta="Duración aproximada" valor={datos.duracion_aproximada} />
          <Dato etiqueta="Texto principal" valor={analisis.texto_biblico_principal.cita} />
        </dl>
        {datos.objetivo_aprendizaje && <div className="mt-4"><Caja etiqueta="Objetivo de aprendizaje">{datos.objetivo_aprendizaje}</Caja></div>}
      </SeccionResultado>

      <SeccionResultado numero="02" titulo="El versículo que aprenderemos">
        <Cita versiculo={datos.versiculo_clave} />
        {datos.explicacion_versiculo && <p className="mt-3 text-[13.5px] leading-relaxed text-[var(--texto)]">{datos.explicacion_versiculo}</p>}
      </SeccionResultado>

      <SeccionResultado numero="03" titulo="El relato bíblico">
        {datos.relato.length === 0 && <SinContenido mensaje="No se generó un relato adaptado para los niños." />}
        <div className="space-y-4">
          {datos.relato.map((parte, indice) => (
            <article key={`${parte.titulo}-${indice}`} className="rounded-[12px] border border-[var(--linea)] bg-white p-4">
              <p className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-[var(--coralOscuro)]">{parte.parte || `Parte ${indice + 1}`}</p>
              {parte.titulo && <h4 className="mt-0.5 text-[14px] font-semibold text-[var(--tinta)]">{parte.titulo}</h4>}
              {parte.texto && <p className="mt-2 text-[13.5px] leading-[1.8] text-[var(--texto)]">{parte.texto}</p>}
            </article>
          ))}
        </div>
      </SeccionResultado>

      <SeccionResultado numero="04" titulo="Preguntas para comprender">
        {datos.preguntas_comprension.length > 0 ? <Lista items={datos.preguntas_comprension} numerada /> : <SinContenido mensaje="No se generaron preguntas para los niños." />}
      </SeccionResultado>

      <SeccionResultado numero="05" titulo="Actividad didáctica">
        {datos.actividad.titulo ? (
          <>
            <h4 className="text-[14px] font-semibold text-[var(--tinta)]">{datos.actividad.titulo}</h4>
            {datos.actividad.objetivo && <div className="mt-2 rounded-[10px] bg-[#fbf2e6] p-3 text-[12px] leading-relaxed text-[var(--texto)]"><strong className="text-[var(--coralOscuro)]">Para el maestro:</strong> {datos.actividad.objetivo}</div>}
            {datos.actividad.materiales.length > 0 && <Bloque titulo="Materiales"><Lista items={datos.actividad.materiales} /></Bloque>}
            {datos.actividad.pasos.length > 0 && <Bloque titulo="Paso a paso"><Lista items={datos.actividad.pasos} numerada /></Bloque>}
          </>
        ) : <SinContenido mensaje="No se propuso una actividad didáctica." />}
      </SeccionResultado>

      <SeccionResultado numero="06" titulo="Juego o dinámica">
        {datos.juego.titulo ? (
          <>
            <h4 className="text-[14px] font-semibold text-[var(--tinta)]">{datos.juego.titulo}</h4>
            {datos.juego.materiales.length > 0 && <Bloque titulo="Materiales"><Lista items={datos.juego.materiales} /></Bloque>}
            {datos.juego.pasos.length > 0 && <Bloque titulo="Cómo jugar"><Lista items={datos.juego.pasos} numerada /></Bloque>}
          </>
        ) : <SinContenido mensaje="No se propuso un juego para la clase." />}
      </SeccionResultado>

      <SeccionResultado numero="07" titulo="Aplicación, familia y oración">
        {datos.aplicacion && <Caja tono="coral" etiqueta="Aplicación para el niño">{datos.aplicacion}</Caja>}
        {datos.actividad_familia && <div className="mt-4"><Caja etiqueta="Actividad para compartir en familia">{datos.actividad_familia}</Caja></div>}
        {datos.oracion_cierre && <div className="mt-4"><Caja etiqueta="Oración de cierre">{datos.oracion_cierre}</Caja></div>}
      </SeccionResultado>

      {datos.recomendaciones_maestro.length > 0 && (
        <SeccionResultado numero="08" titulo="Guía para el maestro">
          <div className="rounded-[12px] border border-[#efd3c8] bg-[#fff8ef] p-4">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--coralOscuro)]">Para el adulto responsable</p>
            <Lista items={datos.recomendaciones_maestro} numerada />
          </div>
        </SeccionResultado>
      )}

      <Referencias analisis={analisis} />
    </div>
  );
}

export function ResultadoDevocionales({ analisis, datos }: { analisis: ResultadoAnalisis; datos: PlanDevocional }) {
  return (
    <div>
      <SeccionResultado numero="01" titulo="Introducción y propósito">
        {datos.introduccion && <p className="text-[13px] leading-relaxed text-[var(--texto)]">{datos.introduccion}</p>}
        {datos.proposito && <div className="mt-4"><Caja etiqueta="Propósito del plan">{datos.proposito}</Caja></div>}
        <div className="mt-4 rounded-[10px] border border-[var(--linea)] px-4 py-3 text-[12px] leading-relaxed text-[var(--muted)]">
          Reserva un momento del día y lee con calma. Cada jornada incluye contexto, reflexión, una pregunta para el corazón, aplicación, acción y oración.
        </div>
        {datos.dias.length < 7 && (
          <div className="mt-4 rounded-[10px] border border-[#e8c9a5] bg-[#fff8eb] px-4 py-3 text-[12px] leading-relaxed text-[#6f4b22]">
            Este plan contiene {datos.dias.length} de las 7 jornadas previstas. El contenido disponible no permitió completar las restantes sin inventar.
          </div>
        )}
      </SeccionResultado>

      {datos.dias.map((dia, indice) => (
        <SeccionResultado key={`${dia.dia}-${indice}`} numero={String(dia.dia).padStart(2, '0')} titulo={dia.titulo || `Jornada ${dia.dia}`}>
          {dia.tema && <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.06em] text-[var(--coralOscuro)]">{dia.tema}</p>}
          <Cita versiculo={dia.lectura_principal} />
          {dia.lecturas_complementarias.length > 0 && (
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {dia.lecturas_complementarias.map((versiculo, i) => <Cita key={`${versiculo.cita}-${i}`} versiculo={versiculo} />)}
            </div>
          )}
          {dia.contexto && <Bloque titulo="Contexto del texto"><p className="text-[13px] leading-relaxed text-[var(--texto)]">{dia.contexto}</p></Bloque>}
          {dia.reflexion && <Bloque titulo="Reflexión"><p className="text-[13px] leading-relaxed text-[var(--texto)]">{dia.reflexion}</p></Bloque>}
          {dia.ensenanza_central && <div className="mt-4"><Caja etiqueta="Enseñanza central">{dia.ensenanza_central}</Caja></div>}
          {dia.pregunta_introspeccion && <div className="mt-4"><Caja tono="coral" etiqueta="Pregunta para el corazón">{dia.pregunta_introspeccion}</Caja></div>}
          {dia.aplicacion && <Bloque titulo="Aplicación práctica"><p className="text-[13px] leading-relaxed text-[var(--texto)]">{dia.aplicacion}</p></Bloque>}
          {dia.accion && <div className="mt-4"><Caja etiqueta="Acción o compromiso del día">{dia.accion}</Caja></div>}
          {dia.oracion && <div className="mt-4"><Caja etiqueta="Oración sugerida">{dia.oracion}</Caja></div>}
        </SeccionResultado>
      ))}

      <Referencias analisis={analisis} />
    </div>
  );
}
