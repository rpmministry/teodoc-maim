import Image from 'next/image';
import type { Modalidad } from '@/lib/modalidades';

export function LogoMaim({ tamano = 'mediano' }: { tamano?: 'pequeno' | 'mediano' | 'grande' }) {
  const medidas = tamano === 'grande' ? { ancho: 202, alto: 140 } : tamano === 'pequeno' ? { ancho: 72, alto: 50 } : { ancho: 112, alto: 78 };
  return (
    <Image
      src="/institucional/maim-portada.jpg"
      alt="MAIM Casa de Oración"
      width={medidas.ancho}
      height={medidas.alto}
      className="h-auto w-auto rounded-[3px]"
      priority={tamano !== 'pequeno'}
    />
  );
}

export function MarcaProducto({ compacta = false }: { compacta?: boolean }) {
  return (
    <span className="flex items-baseline gap-2">
      <span className={`font-semibold tracking-[-0.02em] text-[var(--tinta)] ${compacta ? 'text-lg' : 'text-2xl'}`}>TeoDoc</span>
      <span className={`rounded-full bg-[var(--coralOscuro)] px-2 py-0.5 text-[10px] font-bold tracking-[0.16em] text-white ${compacta ? 'translate-y-[-2px]' : ''}`}>
        MAIM
      </span>
    </span>
  );
}

export function IconoModalidad({ tipo, className = 'h-5 w-5' }: { tipo: Modalidad['icono']; className?: string }) {
  const comunes = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} {...comunes}>
      {tipo === 'libro' && (
        <>
          <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5z" />
          <path d="M4 18.5A2.5 2.5 0 0 1 6.5 16H20M8 7h8M8 11h6" />
        </>
      )}
      {tipo === 'bosquejo' && (
        <>
          <path d="M4 6h2M4 12h2M4 18h2M10 6h10M10 12h10M10 18h7" />
          <path d="M14 2v4M18 2v4" />
        </>
      )}
      {tipo === 'grupo' && (
        <>
          <circle cx="9" cy="8" r="3" />
          <circle cx="17" cy="9" r="2.2" />
          <path d="M3.5 20a5.5 5.5 0 0 1 11 0M14.5 15.2A4.7 4.7 0 0 1 21 19.8" />
        </>
      )}
      {tipo === 'jovenes' && (
        <>
          <path d="M12 21s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.6-7 10-7 10Z" />
          <path d="M12 8.4V3M9.5 5.5 12 3l2.5 2.5" />
        </>
      )}
      {tipo === 'ninos' && (
        <>
          <circle cx="12" cy="8" r="4" />
          <path d="M4.5 21a7.5 7.5 0 0 1 15 0M9 7.5h.01M15 7.5h.01M10 10.5c1.2.9 2.8.9 4 0" />
        </>
      )}
      {tipo === 'devocional' && (
        <>
          <path d="M5 4.5h11.5A2.5 2.5 0 0 1 19 7v13H7.5A2.5 2.5 0 0 1 5 17.5z" />
          <path d="M5 17.5A2.5 2.5 0 0 1 7.5 15H19M9 7h6M9 10.5h5" />
          <path d="M15.5 13.5v5M13 16h5" />
        </>
      )}
    </svg>
  );
}

export function IconoDescarga({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="M12 3v12m0 0 4-4m-4 4-4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconoFlecha({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="M5 12h14m0 0-5-5m5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconoAudio({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <rect x="9" y="3" width="6" height="11" rx="3" stroke="currentColor" strokeWidth="1.8" />
      <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3M9 21h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function IconoTexto({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="M4 6h16M4 11h16M4 16h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function IconoCheck({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="m5 12.5 4.5 4.5L19 6.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
