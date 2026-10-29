'use client';

import type { ApartadoLiderazgo, ClaseNinos, EstudioBosquejo, EstudioGrupos, EstudioJovenes, PlanDevocional, ResultadoAnalisis } from '@/lib/tipos';
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

// =============================================================================
// MODALIDAD 1: LIDERAZGO MAIM (Enseñanza Bíblica y Bosquejo Oficial)
// =============================================================================
export function ResultadoBosquejo({ analisis, datos }: { analisis: ResultadoAnalisis; datos: EstudioBosquejo }) {
  const apartados: ApartadoLiderazgo[] =
    datos.apartados && datos.apartados.length > 0
      ? datos.apartados
      : (datos.puntos_principales || []).map((p, idx): ApartadoLiderazgo => ({
          seccion: p.romano || String.fromCharCode(65 + idx),
          titulo: p.titulo,
          cita: p.cita,
          texto_cita: p.texto_cita,
          contenido: [p.exposicion, ...(p.subpuntos || []).map((s) => `${s.titulo}: ${s.desarrollo}`)].filter(Boolean).join('\n\n'),
        }));

  const pasajeCabecera =
    datos.epigrafe_biblico && (datos.epigrafe_biblico.cita || datos.epigrafe_biblico.texto)
      ? datos.epigrafe_biblico
      : datos.texto_base && (datos.texto_base.cita || datos.texto_base.texto)
        ? datos.texto_base
        : analisis.texto_biblico_principal;

  const intro =
    datos.introduccion_editorial ||
    (typeof datos.introduccion === 'string' ? datos.introduccion : '') ||
    [datos.introduccion?.gancho, datos.introduccion?.contexto, datos.introduccion?.transicion].filter(Boolean).join('\n\n');

  const conclusion =
    datos.conclusion_editorial ||
    (typeof datos.conclusion === 'string' ? datos.conclusion : '') ||
    [datos.conclusion?.recapitulacion, datos.conclusion?.climax].filter(Boolean).join('\n\n') ||
    datos.desafio_final?.llamado;

  return (
    <div className="mx-auto max-w-4xl space-y-7">
      {/* Cabecera Editorial del Documento */}
      <div className="rounded-[18px] border border-[#ebd8cb] bg-gradient-to-b from-white to-[#fdfaf5] p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#f0e4d7] pb-3">
          <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--coralOscuro)]">
            Documento Editorial Ministerial
          </span>
          <span className="rounded-full bg-[#fbf2e6] px-3 py-1 text-[11px] font-semibold text-[var(--tinta)]">
            Liderazgo MAIM
          </span>
        </div>

        <h2 className="mt-4 text-[22px] font-bold leading-tight text-[var(--tinta)] sm:text-[28px]">
          {datos.titulo || analisis.titulo}
        </h2>

        {pasajeCabecera && (pasajeCabecera.cita || pasajeCabecera.texto) && (
          <div className="mt-5">
            <Cita versiculo={pasajeCabecera} />
          </div>
        )}

        {intro && (
          <div className="mt-5 space-y-3 border-t border-[#f0e4d7]/70 pt-4">
            {intro.split(/\n+/).map((parrafo, i) => (
              <p key={i} className="text-[14.5px] leading-[1.85] text-[var(--texto)] sm:text-[15px]">
                {parrafo}
              </p>
            ))}
          </div>
        )}
      </div>

      {/* Apartados principales del estudio */}
      <div className="space-y-6">
        {apartados.length === 0 ? (
          <SinContenido mensaje="No se estructuraron apartados principales en la enseñanza de liderazgo." />
        ) : (
          apartados.map((apartado, idx) => (
            <article
              key={`${apartado.seccion || idx}-${apartado.titulo}`}
              className="rounded-[18px] border border-[#ebd8cb] bg-white p-6 shadow-sm sm:p-8"
            >
              <div className="flex items-start gap-3.5 border-b border-[#f0e4d7] pb-4">
                {apartado.seccion && (
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--coralOscuro)] text-[14px] font-bold text-white shadow-sm">
                    {apartado.seccion}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <h3 className="text-[18px] font-bold text-[var(--tinta)] sm:text-[20px]">
                    {apartado.titulo}
                  </h3>
                  {apartado.cita && (
                    <span className="mt-1 inline-block text-[12px] font-semibold text-[var(--coralOscuro)]">
                      {apartado.cita}
                    </span>
                  )}
                </div>
              </div>

              {apartado.texto_cita && (
                <div className="mt-4">
                  <Cita versiculo={{ cita: apartado.cita || '', texto: apartado.texto_cita }} />
                </div>
              )}

              {/* Desarrollo completo en prosa continua */}
              {apartado.contenido && (
                <div className="mt-5 space-y-4">
                  {apartado.contenido.split(/\n+/).map((parrafo, pIdx) => (
                    <p key={pIdx} className="text-[14.5px] leading-[1.85] text-[var(--texto)] sm:text-[15px]">
                      {parrafo}
                    </p>
                  ))}
                </div>
              )}

              {/* Subsecciones temáticas cuando existen agrupaciones */}
              {apartado.subsecciones && apartado.subsecciones.length > 0 && (
                <div className="mt-6 space-y-5 border-t border-[#f0e4d7] pt-5">
                  {apartado.subsecciones.map((sub, sIdx) => (
                    <div key={sIdx} className="space-y-2.5">
                      <h4 className="text-[14.5px] font-bold uppercase tracking-wide text-[var(--tinta)]">
                        {sub.titulo}
                      </h4>
                      {sub.contenido.split(/\n+/).map((sp, spIdx) => (
                        <p key={spIdx} className="text-[14px] leading-[1.8] text-[var(--texto)] sm:text-[14.5px]">
                          {sp}
                        </p>
                      ))}
                    </div>
                  ))}
                </div>
              )}

              {/* Término original presentado con sobriedad */}
              {apartado.termino_clave?.termino && (
                <div className="mt-5 rounded-[12px] border border-[#ebd8cb] bg-[#fbf7ee] p-4 text-[13px] leading-relaxed text-[var(--texto)]">
                  <strong className="font-semibold text-[var(--coralOscuro)]">Término en lengua original: </strong>
                  <span className="font-bold text-[var(--tinta)]">{apartado.termino_clave.termino}</span> —{' '}
                  {apartado.termino_clave.significado}. {apartado.termino_clave.aplicacion}
                </div>
              )}

              {/* Aplicación pastoral integrada */}
              {apartado.aplicacion_pastoral && (
                <div className="mt-4 rounded-[10px] bg-[#fdf2e8] p-3.5 text-[13px] leading-relaxed text-[var(--texto)]">
                  <strong className="font-semibold text-[var(--coralOscuro)]">Directriz ministerial: </strong>
                  {apartado.aplicacion_pastoral}
                </div>
              )}
            </article>
          ))
        )}
      </div>

      {/* Conclusión y exhortación ministerial */}
      {conclusion && (
        <article className="rounded-[18px] border border-[#ebd8cb] bg-gradient-to-b from-[#fffcf8] to-white p-6 shadow-sm sm:p-8">
          <h3 className="border-b border-[#f0e4d7] pb-3 text-[18px] font-bold uppercase tracking-wide text-[var(--coralOscuro)] sm:text-[20px]">
            Conclusión y Exhortación Ministerial
          </h3>
          <div className="mt-5 space-y-4">
            {conclusion.split(/\n+/).map((parrafo, cIdx) => (
              <p key={cIdx} className="text-[14.5px] leading-[1.85] text-[var(--texto)] sm:text-[15px]">
                {parrafo}
              </p>
            ))}
          </div>

          {datos.desafio_final?.oracion_ministracion && (
            <div className="mt-6 rounded-[12px] border border-[#ebd8cb] bg-[#fbf7ee] p-4 sm:p-5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--coralOscuro)]">
                Oración de consagración ministerial
              </p>
              <p className="mt-2 text-[14px] italic leading-relaxed text-[var(--tinta)]">
                {datos.desafio_final.oracion_ministracion}
              </p>
            </div>
          )}
        </article>
      )}

      <Referencias analisis={analisis} />
    </div>
  );
}

// =============================================================================
// MODALIDAD 2: GRUPOS PEQUEÑOS Y HOGARES
// =============================================================================
export function ResultadoGrupos({ analisis, datos }: { analisis: ResultadoAnalisis; datos: EstudioGrupos }) {
  return (
    <div className="space-y-6">
      {/* 01. PREPARACIÓN DEL ENCUENTRO */}
      <SeccionResultado numero="01" titulo="Preparación del encuentro">
        {datos.objetivo ? (
          <Caja etiqueta="Objetivo espiritual del encuentro">{datos.objetivo}</Caja>
        ) : (
          <SinContenido mensaje="No se definió un objetivo para el encuentro." />
        )}
        {datos.idea_central && (
          <p className="mt-4 text-[13.5px] leading-relaxed text-[var(--texto)]">
            <strong className="text-[var(--tinta)]">Idea central:</strong> {datos.idea_central}
          </p>
        )}

        <div className="mt-5">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--coralOscuro)]">Pasaje bíblico y contexto</p>
          <Cita versiculo={analisis.texto_biblico_principal} />
          {datos.contexto_pasaje && (
            <p className="mt-3 text-[13px] leading-relaxed text-[var(--texto)]">{datos.contexto_pasaje}</p>
          )}
        </div>

        {datos.agenda.length > 0 && (
          <div className="mt-6">
            <h4 className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--coralOscuro)]">Agenda recomendada</h4>
            <div className="overflow-hidden rounded-[12px] border border-[var(--linea)] bg-white">
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
          </div>
        )}

        {datos.materiales.length > 0 && (
          <Bloque titulo="Materiales necesarios">
            <Lista items={datos.materiales} />
          </Bloque>
        )}
      </SeccionResultado>

      {/* 02. DIÁLOGO Y DINÁMICA DE GRUPO */}
      <SeccionResultado numero="02" titulo="Diálogo y dinámica de grupo">
        <div className="space-y-4">
          {datos.preguntas_inicio.length > 0 && (
            <Bloque titulo="Para comenzar (Conexión)">
              <Lista items={datos.preguntas_inicio} numerada />
            </Bloque>
          )}
          {datos.preguntas_comprension.length > 0 && (
            <Bloque titulo="Comprender el texto bíblico">
              <Lista items={datos.preguntas_comprension} numerada />
            </Bloque>
          )}
          {datos.preguntas_reflexion.length > 0 && (
            <Bloque titulo="Reflexión y conversación en comunidad">
              <Lista items={datos.preguntas_reflexion} numerada />
            </Bloque>
          )}

          {datos.caso_practico && (
            <div className="mt-5">
              <Caja etiqueta="Caso práctico para conversar en grupo">{datos.caso_practico}</Caja>
            </div>
          )}

          {datos.actividad.titulo && (
            <div className="mt-5 rounded-[12px] border border-[var(--linea)] bg-white p-4 sm:p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--coralOscuro)]">Actividad grupal participativa</p>
              <h4 className="mt-1 text-[14px] font-semibold text-[var(--tinta)]">{datos.actividad.titulo}</h4>
              {datos.actividad.objetivo && (
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-[var(--texto)]">{datos.actividad.objetivo}</p>
              )}
              {datos.actividad.pasos.length > 0 && (
                <div className="mt-3">
                  <Lista items={datos.actividad.pasos} numerada />
                </div>
              )}
            </div>
          )}
        </div>
      </SeccionResultado>

      {/* 03. CIERRE Y COMPROMISO */}
      <SeccionResultado numero="03" titulo="Cierre y compromiso">
        <div className="space-y-4">
          {datos.aplicaciones.length > 0 && (
            <Bloque titulo="Aplicaciones prácticas cotidianas">
              <Lista items={datos.aplicaciones} />
            </Bloque>
          )}

          {datos.compromiso_semanal && (
            <Caja tono="coral" etiqueta="Compromiso personal y grupal de la semana">
              {datos.compromiso_semanal}
            </Caja>
          )}

          {datos.motivos_oracion.length > 0 && (
            <Bloque titulo="Motivos de oración comunitaria">
              <Lista items={datos.motivos_oracion} />
            </Bloque>
          )}

          {datos.oracion_final && (
            <div className="mt-4">
              <Caja etiqueta="Oración pastoral de cierre">{datos.oracion_final}</Caja>
            </div>
          )}

          {datos.orientaciones_lider.length > 0 && (
            <div className="mt-5 rounded-[12px] border border-[#efd3c8] bg-[#fff8ef] p-4 sm:p-5">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--coralOscuro)]">
                Orientaciones y consejos para el facilitador
              </p>
              <Lista items={datos.orientaciones_lider} numerada />
            </div>
          )}
        </div>
      </SeccionResultado>

      <Referencias analisis={analisis} />
    </div>
  );
}

// =============================================================================
// MODALIDAD 3: JÓVENES
// =============================================================================
export function ResultadoJovenes({ analisis, datos }: { analisis: ResultadoAnalisis; datos: EstudioJovenes }) {
  return (
    <div className="space-y-6">
      {/* 01. OBJETIVO Y CONCEPTOS CLAVE */}
      <SeccionResultado numero="01" titulo="Objetivo y conceptos clave">
        {datos.objetivo ? (
          <Caja etiqueta="Objetivo del encuentro juvenil">{datos.objetivo}</Caja>
        ) : (
          <SinContenido mensaje="No se definió un objetivo para el encuentro." />
        )}
        {datos.tema && (
          <p className="mt-3 text-[13.5px] leading-relaxed text-[var(--texto)]">
            <strong className="text-[var(--tinta)]">Tema central:</strong> {datos.tema}
          </p>
        )}

        <div className="mt-5">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--coralOscuro)]">Pasaje bíblico y contexto</p>
          <Cita versiculo={analisis.texto_biblico_principal} />
          {datos.contexto_pasaje && (
            <p className="mt-3 text-[13px] leading-relaxed text-[var(--texto)]">{datos.contexto_pasaje}</p>
          )}
        </div>

        {datos.conceptos.length > 0 && (
          <div className="mt-5">
            <h4 className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--coralOscuro)]">Conceptos fundamentales</h4>
            <div className="grid gap-3 sm:grid-cols-2">
              {datos.conceptos.map((concepto) => (
                <div key={concepto.concepto} className="rounded-[11px] bg-[#fbf2e6] p-3.5">
                  <p className="text-[12px] font-semibold text-[var(--coralOscuro)]">{concepto.concepto}</p>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-[var(--texto)]">{concepto.explicacion}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </SeccionResultado>

      {/* 02. REFLEXIÓN Y CONVERSACIÓN */}
      <SeccionResultado numero="02" titulo="Reflexión y conversación">
        <div className="space-y-4">
          {datos.preguntas_reflexion.length > 0 && (
            <Bloque titulo="Reflexión individual (Introspección)">
              <Lista items={datos.preguntas_reflexion} numerada />
            </Bloque>
          )}

          {datos.preguntas_grupales.length > 0 && (
            <Bloque titulo="Conversación grupal abierta">
              <Lista items={datos.preguntas_grupales} numerada />
            </Bloque>
          )}

          {datos.casos_practicos.length > 0 && (
            <div className="mt-5 space-y-3">
              <h4 className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--coralOscuro)]">Casos para debatir en grupo</h4>
              {datos.casos_practicos.map((caso, indice) => (
                <div key={`${caso.slice(0, 24)}-${indice}`} className="rounded-[11px] border border-[var(--linea)] bg-white p-4">
                  <p className="mb-1 text-[9.5px] font-bold uppercase tracking-[0.1em] text-[var(--coralOscuro)]">Caso {indice + 1}</p>
                  <p className="text-[12.5px] leading-relaxed text-[var(--texto)]">{caso}</p>
                </div>
              ))}
            </div>
          )}

          {datos.dinamica.titulo && (
            <div className="mt-5 rounded-[12px] border border-[var(--linea)] bg-white p-4 sm:p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--coralOscuro)]">Dinámica participativa</p>
              <h4 className="mt-1 text-[13.5px] font-semibold text-[var(--tinta)]">{datos.dinamica.titulo}</h4>
              {datos.dinamica.objetivo && (
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-[var(--texto)]">{datos.dinamica.objetivo}</p>
              )}
              {datos.dinamica.pasos.length > 0 && (
                <div className="mt-3">
                  <Lista items={datos.dinamica.pasos} numerada />
                </div>
              )}
            </div>
          )}
        </div>
      </SeccionResultado>

      {/* 03. APLICACIÓN Y DESAFÍO */}
      <SeccionResultado numero="03" titulo="Aplicación y desafío">
        <div className="space-y-4">
          {datos.aplicaciones.length > 0 && (
            <Bloque titulo="Aplicaciones prácticas para la vida diaria">
              <Lista items={datos.aplicaciones} />
            </Bloque>
          )}

          {datos.desafio_semanal && (
            <Caja tono="coral" etiqueta="Desafío de la semana">{datos.desafio_semanal}</Caja>
          )}

          {datos.motivos_oracion.length > 0 && (
            <Bloque titulo="Motivos de oración">
              <Lista items={datos.motivos_oracion} />
            </Bloque>
          )}

          {analisis.oracion && (
            <div className="mt-4">
              <Caja etiqueta="Oración sugerida de consagración">{analisis.oracion}</Caja>
            </div>
          )}

          {datos.guia_lider.length > 0 && (
            <div className="mt-5 rounded-[12px] border border-[#efd3c8] bg-[#fff8ef] p-4 sm:p-5">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--coralOscuro)]">
                Orientaciones para el líder juvenil
              </p>
              <Lista items={datos.guia_lider} numerada />
            </div>
          )}
        </div>
      </SeccionResultado>

      <Referencias analisis={analisis} />
    </div>
  );
}

// =============================================================================
// MODALIDAD 4: NIÑOS (Clase Infantil)
// =============================================================================
export function ResultadoNinos({ analisis, datos }: { analisis: ResultadoAnalisis; datos: ClaseNinos }) {
  const edad = obtenerRangoEdad(analisis.metadatos.rangoEdad);
  return (
    <div className="space-y-6">
      {/* 01. VERSÍCULO Y DATOS DE LA CLASE */}
      <SeccionResultado numero="01" titulo="Versículo y datos de la clase">
        <dl className="grid gap-4 rounded-[12px] bg-[#fbf2e6] p-4 sm:grid-cols-3">
          <Dato etiqueta="Rango de edad" valor={edad} />
          <Dato etiqueta="Duración aproximada" valor={datos.duracion_aproximada} />
          <Dato etiqueta="Texto principal" valor={analisis.texto_biblico_principal.cita} />
        </dl>
        {datos.objetivo_aprendizaje && (
          <div className="mt-4">
            <Caja etiqueta="Objetivo de aprendizaje">{datos.objetivo_aprendizaje}</Caja>
          </div>
        )}

        <div className="mt-5">
          <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--coralOscuro)]">El versículo que aprenderemos</p>
          <Cita versiculo={datos.versiculo_clave} />
          {datos.explicacion_versiculo && (
            <p className="mt-2 text-[13px] leading-relaxed text-[var(--texto)]">{datos.explicacion_versiculo}</p>
          )}
        </div>
      </SeccionResultado>

      {/* 02. RELATO BÍBLICO Y PREGUNTAS */}
      <SeccionResultado numero="02" titulo="Relato bíblico y preguntas">
        {datos.relato.length === 0 ? (
          <SinContenido mensaje="No se generó un relato adaptado para los niños." />
        ) : (
          <div className="space-y-4">
            {datos.relato.map((parte, indice) => (
              <article key={`${parte.titulo}-${indice}`} className="rounded-[12px] border border-[var(--linea)] bg-white p-4">
                <p className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-[var(--coralOscuro)]">
                  {parte.parte || `Parte ${indice + 1}`}
                </p>
                {parte.titulo && <h4 className="mt-0.5 text-[14px] font-semibold text-[var(--tinta)]">{parte.titulo}</h4>}
                {parte.texto && <p className="mt-2 text-[13.5px] leading-[1.8] text-[var(--texto)]">{parte.texto}</p>}
              </article>
            ))}
          </div>
        )}

        {datos.preguntas_comprension.length > 0 && (
          <div className="mt-5">
            <Bloque titulo="Preguntas para comprender la enseñanza">
              <Lista items={datos.preguntas_comprension} numerada />
            </Bloque>
          </div>
        )}
      </SeccionResultado>

      {/* 03. ACTIVIDADES PRÁCTICAS Y CIERRE */}
      <SeccionResultado numero="03" titulo="Actividades prácticas y cierre">
        <div className="space-y-4">
          {datos.actividad.titulo && (
            <div className="rounded-[12px] border border-[var(--linea)] bg-white p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--coralOscuro)]">Actividad didáctica</p>
              <h4 className="mt-0.5 text-[14px] font-semibold text-[var(--tinta)]">{datos.actividad.titulo}</h4>
              {datos.actividad.objetivo && (
                <div className="mt-2 rounded-[10px] bg-[#fbf2e6] p-3 text-[12px] leading-relaxed text-[var(--texto)]">
                  <strong className="text-[var(--coralOscuro)]">Para el maestro:</strong> {datos.actividad.objetivo}
                </div>
              )}
              {datos.actividad.materiales.length > 0 && (
                <Bloque titulo="Materiales">
                  <Lista items={datos.actividad.materiales} />
                </Bloque>
              )}
              {datos.actividad.pasos.length > 0 && (
                <Bloque titulo="Paso a paso">
                  <Lista items={datos.actividad.pasos} numerada />
                </Bloque>
              )}
            </div>
          )}

          {datos.juego.titulo && (
            <div className="rounded-[12px] border border-[var(--linea)] bg-white p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--coralOscuro)]">Juego o dinámica</p>
              <h4 className="mt-0.5 text-[14px] font-semibold text-[var(--tinta)]">{datos.juego.titulo}</h4>
              {datos.juego.materiales.length > 0 && (
                <Bloque titulo="Materiales">
                  <Lista items={datos.juego.materiales} />
                </Bloque>
              )}
              {datos.juego.pasos.length > 0 && (
                <Bloque titulo="Cómo jugar">
                  <Lista items={datos.juego.pasos} numerada />
                </Bloque>
              )}
            </div>
          )}

          {datos.aplicacion && (
            <Caja tono="coral" etiqueta="Lo que puedo vivir hoy (Aplicación infantil)">
              {datos.aplicacion}
            </Caja>
          )}

          {datos.actividad_familia && (
            <div className="mt-4">
              <Caja etiqueta="Actividad para compartir en familia">{datos.actividad_familia}</Caja>
            </div>
          )}

          {datos.oracion_cierre && (
            <div className="mt-4">
              <Caja etiqueta="Oración de cierre">{datos.oracion_cierre}</Caja>
            </div>
          )}

          {datos.recomendaciones_maestro.length > 0 && (
            <div className="mt-5 rounded-[12px] border border-[#efd3c8] bg-[#fff8ef] p-4">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--coralOscuro)]">
                Guía y salvaguardas para el maestro
              </p>
              <Lista items={datos.recomendaciones_maestro} numerada />
            </div>
          )}
        </div>
      </SeccionResultado>

      <Referencias analisis={analisis} />
    </div>
  );
}

// =============================================================================
// MODALIDAD 5: DEVOCIONALES (7 Días)
// =============================================================================
export function ResultadoDevocionales({ analisis, datos }: { analisis: ResultadoAnalisis; datos: PlanDevocional }) {
  return (
    <div className="space-y-6">
      {/* 01. PROPÓSITO DEL PLAN DEVOCIONAL */}
      <SeccionResultado numero="01" titulo="Propósito del plan devocional">
        {datos.introduccion && (
          <p className="text-[13.5px] leading-relaxed text-[var(--texto)]">{datos.introduccion}</p>
        )}
        {datos.proposito && (
          <div className="mt-4">
            <Caja etiqueta="Propósito espiritual formativo">{datos.proposito}</Caja>
          </div>
        )}
        <div className="mt-4 rounded-[10px] border border-[var(--linea)] bg-white px-4 py-3 text-[12px] leading-relaxed text-[var(--muted)]">
          Reserva un momento de quietud cada día. Lee con calma la Palabra y permite que el Espíritu Santo hable a tu corazón a través de cada jornada.
        </div>
        {datos.dias.length < 7 && (
          <div className="mt-4 rounded-[10px] border border-[#e8c9a5] bg-[#fff8eb] px-4 py-3 text-[12px] leading-relaxed text-[#6f4b22]">
            Este plan contiene {datos.dias.length} de las 7 jornadas previstas. El contenido disponible no permitió completar las restantes sin inventar.
          </div>
        )}
      </SeccionResultado>

      {/* 02. PLAN DEVOCIONAL DE 7 DÍAS */}
      <SeccionResultado numero="02" titulo="Plan devocional de 7 días">
        <div className="space-y-6">
          {datos.dias.map((dia, indice) => (
            <article key={`${dia.dia}-${indice}`} className="rounded-[16px] border border-[var(--linea)] bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#f0e4d7] pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--coralOscuro)] text-[11px] font-bold text-white">
                    {dia.dia}
                  </span>
                  <h4 className="text-[15px] font-bold text-[var(--tinta)]">{dia.titulo || `Jornada ${dia.dia}`}</h4>
                </div>
                {dia.tema && (
                  <span className="rounded-full bg-[#fbf2e6] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--coralOscuro)]">
                    {dia.tema}
                  </span>
                )}
              </div>

              <div className="mt-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--muted)]">Lectura bíblica principal</p>
                <Cita versiculo={dia.lectura_principal} />
              </div>

              {dia.lecturas_complementarias.length > 0 && (
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {dia.lecturas_complementarias.map((versiculo, i) => (
                    <Cita key={`${versiculo.cita}-${i}`} versiculo={versiculo} />
                  ))}
                </div>
              )}

              {dia.contexto && (
                <Bloque titulo="Contexto del pasaje">
                  <p className="text-[13px] leading-relaxed text-[var(--texto)]">{dia.contexto}</p>
                </Bloque>
              )}

              {dia.reflexion && (
                <Bloque titulo="Reflexión personal">
                  <p className="text-[13px] leading-[1.8] text-[var(--texto)]">{dia.reflexion}</p>
                </Bloque>
              )}

              {dia.ensenanza_central && (
                <div className="mt-4">
                  <Caja etiqueta="Enseñanza central del día">{dia.ensenanza_central}</Caja>
                </div>
              )}

              {dia.pregunta_introspeccion && (
                <div className="mt-4">
                  <Caja tono="coral" etiqueta="Pregunta para el corazón">{dia.pregunta_introspeccion}</Caja>
                </div>
              )}

              {dia.aplicacion && (
                <Bloque titulo="Aplicación práctica">
                  <p className="text-[13px] leading-relaxed text-[var(--texto)]">{dia.aplicacion}</p>
                </Bloque>
              )}

              {dia.accion && (
                <div className="mt-4 rounded-[10px] border border-[#ebd8cb] bg-[#fffaf5] p-3 text-[12.5px] text-[var(--texto)]">
                  <strong className="text-[var(--coralOscuro)]">Acción o compromiso de hoy:</strong> {dia.accion}
                </div>
              )}

              {dia.oracion && (
                <div className="mt-4">
                  <Caja etiqueta="Oración del día">{dia.oracion}</Caja>
                </div>
              )}
            </article>
          ))}
        </div>
      </SeccionResultado>

      {/* 03. CIERRE Y REFLEXIÓN FINAL */}
      <SeccionResultado numero="03" titulo="Cierre y reflexión final">
        <div className="rounded-[14px] border border-[var(--linea)] bg-white p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--coralOscuro)]">Perseverancia en la comunión diaria</p>
          <p className="mt-2 text-[13px] leading-relaxed text-[var(--texto)]">
            La Palabra de Dios recibida en estas jornadas no concluye con la lectura, sino que fructifica al ser guardada y practicada. Que cada verdad sembrada en tu corazón siga guiando tus decisiones, tu familia y tu servicio al Señor.
          </p>
        </div>
      </SeccionResultado>

      <Referencias analisis={analisis} />
    </div>
  );
}

export { ResultadoBosquejo as ResultadoLiderazgo };
