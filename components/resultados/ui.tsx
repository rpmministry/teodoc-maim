import type { ReactNode } from 'react';
import type { Versiculo } from '@/lib/tipos';

export function SeccionResultado({ numero, titulo, children, className = '' }: { numero: string; titulo: string; children: ReactNode; className?: string }) {
  return (
    <section className={`border-t border-[var(--linea)] py-7 first:border-t-0 first:pt-0 ${className}`}>
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#f7e5da] text-[10px] font-bold text-[var(--coralOscuro)]">{numero}</span>
        <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-[var(--tinta)]">{titulo}</h3>
      </div>
      {children}
    </section>
  );
}

export function Cita({ versiculo }: { versiculo: Versiculo }) {
  if (!versiculo.cita && !versiculo.texto) return null;
  return (
    <blockquote className="my-4 rounded-r-[10px] border-l-[3px] border-[var(--coral)] bg-[#fbf2e6] px-4 py-3.5">
      {versiculo.cita && <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--coralOscuro)]">{versiculo.cita}</p>}
      {versiculo.texto && <p className="mt-1 text-[13px] italic leading-relaxed text-[var(--texto)]">{versiculo.texto}</p>}
    </blockquote>
  );
}

export function Lista({ items, numerada = false }: { items: string[]; numerada?: boolean }) {
  if (!items.length) return null;
  return (
    <ol className={`space-y-2.5 ${numerada ? 'list-decimal' : 'list-disc'} pl-5 marker:text-[var(--coralOscuro)] marker:font-semibold`}>
      {items.map((item, indice) => (
        <li key={`${item}-${indice}`} className="text-[13px] leading-relaxed text-[var(--texto)]">{item}</li>
      ))}
    </ol>
  );
}

export function Chips({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span key={item} className="rounded-full border border-[#e5b9ad] bg-[#fff8ef] px-3 py-1.5 text-[10.5px] font-semibold uppercase tracking-[0.06em] text-[var(--coralOscuro)]">
          {item}
        </span>
      ))}
    </div>
  );
}

export function Caja({ children, etiqueta, tono = 'crema' }: { children: ReactNode; etiqueta?: string; tono?: 'crema' | 'coral' | 'blanca' }) {
  const clases = tono === 'coral' ? 'bg-[var(--coralOscuro)] text-white' : tono === 'blanca' ? 'bg-white' : 'bg-[#fbf2e6]';
  return (
    <div className={`rounded-[12px] p-4 ${clases}`}>
      {etiqueta && <p className={`mb-1.5 text-[9.5px] font-bold uppercase tracking-[0.12em] ${tono === 'coral' ? 'text-[#ffe8b4]' : 'text-[var(--coralOscuro)]'}`}>{etiqueta}</p>}
      <div className={`text-[13px] leading-relaxed ${tono === 'coral' ? 'text-white' : 'text-[var(--texto)]'}`}>{children}</div>
    </div>
  );
}

export function Dato({ etiqueta, valor }: { etiqueta: string; valor?: string }) {
  if (!valor) return null;
  return (
    <div>
      <dt className="text-[9.5px] font-bold uppercase tracking-[0.11em] text-[var(--muted)]">{etiqueta}</dt>
      <dd className="mt-0.5 text-[12.5px] leading-snug text-[var(--tinta)]">{valor}</dd>
    </div>
  );
}

export function Bloque({ titulo, children, color = 'coral' }: { titulo: string; children: ReactNode; color?: 'coral' | 'tinta' }) {
  return (
    <div className="mt-5">
      <h4 className={`mb-2 text-[12px] font-semibold ${color === 'coral' ? 'text-[var(--coralOscuro)]' : 'text-[var(--tinta)]'}`}>{titulo}</h4>
      {children}
    </div>
  );
}

export function SinContenido({ mensaje = 'La transcripción no ofreció contenido suficiente para esta sección.' }: { mensaje?: string }) {
  return <p className="rounded-[10px] bg-[#f8f2e8] px-3 py-2.5 text-[12px] italic leading-relaxed text-[var(--muted)]">{mensaje}</p>;
}
