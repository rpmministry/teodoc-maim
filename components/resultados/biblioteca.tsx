'use client';

import { MODALIDADES, fechaLarga } from '@/lib/modalidades';
import type { PredicacionBiblioteca } from '@/lib/biblioteca';
import type { ModalidadId } from '@/lib/tipos';
import { IconoDescarga } from '../marca';

interface Props {
  predicacion: PredicacionBiblioteca;
  todas: PredicacionBiblioteca[];
  actual: ModalidadId;
  generando: ModalidadId | 'todos' | null;
  errores: Partial<Record<ModalidadId, string>>;
  onVer: (modalidad: ModalidadId) => void;
  onGenerar: (modalidad: ModalidadId) => void;
  onGenerarTodos: () => void;
  onDescargar: (modalidad: ModalidadId, formato: 'pdf' | 'word') => void;
  onAbrirPredicacion: (id: string) => void;
}

export default function BibliotecaDocumentos({
  predicacion,
  todas,
  actual,
  generando,
  errores,
  onVer,
  onGenerar,
  onGenerarTodos,
  onDescargar,
  onAbrirPredicacion,
}: Props) {
  const generados = MODALIDADES.filter((modalidad) => Boolean(predicacion.documentos[modalidad.id])).length;
  const anteriores = todas.filter((item) => item.id !== predicacion.id);

  return (
    <section className="mt-5 rounded-[20px] border border-[var(--linea)] bg-[#fffdf8] p-5 shadow-[0_16px_45px_rgba(76,43,36,0.06)] sm:p-7" aria-label="Documentos de la predicación">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--coralOscuro)]">Documentos de esta predicación</p>
          <h2 className="mt-1 text-[20px] font-semibold tracking-[-0.02em] text-[var(--tinta)]">{generados} de {MODALIDADES.length} generados</h2>
          <p className="mt-1 text-[12px] leading-relaxed text-[var(--muted)]">Cada formato se puede generar y descargar por separado.</p>
        </div>
        <button
          type="button"
          onClick={onGenerarTodos}
          disabled={generando !== null || generados === MODALIDADES.length}
          className="btn-secundario w-fit text-[11px] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {generando === 'todos' ? 'Generando documentos…' : 'Generar todos'}
        </button>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {MODALIDADES.map((modalidad) => {
          const documento = predicacion.documentos[modalidad.id];
          const activo = actual === modalidad.id;
          const error = errores[modalidad.id];
          return (
            <article key={modalidad.id} className={`rounded-[12px] border p-4 ${activo ? 'border-[var(--coral)] bg-[#fff8f3]' : 'border-[var(--linea)] bg-white'}`}>
              <div className="flex items-start justify-between gap-2">
                <p className="text-[12px] font-semibold leading-snug text-[var(--tinta)]">{modalidad.nombre}</p>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.06em] ${documento ? 'bg-[#e8f5e9] text-[#2f6b3a]' : 'bg-[#f5ebdd] text-[var(--muted)]'}`}>
                  {documento ? 'Generado' : 'Pendiente'}
                </span>
              </div>
              {error && <p className="mt-2 text-[11px] leading-relaxed text-[#8f2830]">{error}</p>}
              <div className="mt-3 flex flex-wrap gap-2">
                {documento ? (
                  <>
                    {!activo && <button type="button" onClick={() => onVer(modalidad.id)} className="text-[11px] font-semibold text-[var(--coralOscuro)] underline underline-offset-4">Ver</button>}
                    <button type="button" onClick={() => onDescargar(modalidad.id, 'pdf')} className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--coralOscuro)] underline underline-offset-4"><IconoDescarga className="h-3 w-3" />PDF</button>
                    <button type="button" onClick={() => onDescargar(modalidad.id, 'word')} className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--coralOscuro)] underline underline-offset-4"><IconoDescarga className="h-3 w-3" />Word</button>
                    <button type="button" onClick={() => onGenerar(modalidad.id)} disabled={generando !== null} className="text-[11px] font-semibold text-[var(--muted)] underline underline-offset-4 disabled:opacity-50">Regenerar</button>
                  </>
                ) : (
                  <button type="button" onClick={() => onGenerar(modalidad.id)} disabled={generando !== null} className="btn-secundario px-3 py-1.5 text-[11px] disabled:cursor-not-allowed disabled:opacity-50">
                    {generando === modalidad.id ? 'Generando…' : 'Generar'}
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {anteriores.length > 0 && (
        <details className="mt-5 border-t border-[var(--linea)] pt-4">
          <summary className="cursor-pointer text-[11px] font-semibold text-[var(--coralOscuro)]">Predicaciones guardadas ({anteriores.length})</summary>
          <div className="mt-3 space-y-2">
            {anteriores.map((item) => (
              <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-[10px] bg-[#fbf2e6] px-3 py-2.5">
                <div>
                  <p className="text-[12px] font-semibold text-[var(--tinta)]">{item.titulo}</p>
                  <p className="text-[10.5px] text-[var(--muted)]">
                    {[item.predicador, item.fecha ? fechaLarga(item.fecha) : '', `${Object.keys(item.documentos).length} documentos`].filter(Boolean).join(' · ')}
                  </p>
                </div>
                <button type="button" onClick={() => onAbrirPredicacion(item.id)} className="text-[11px] font-semibold text-[var(--coralOscuro)] underline underline-offset-4">Abrir</button>
              </div>
            ))}
          </div>
        </details>
      )}
    </section>
  );
}
