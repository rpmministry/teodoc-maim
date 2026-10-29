'use client';

interface Props {
  texto: string;
  onTexto: (nuevo: string) => void;
  onDetectarEnlaceVideo?: (url: string) => void;
  disabled?: boolean;
}

export default function EditorTextoPegar({ texto, onTexto, onDetectarEnlaceVideo, disabled }: Props) {
  const caracteres = texto.trim().length;
  const palabras = texto ? texto.trim().split(/\s+/).filter(Boolean).length : 0;

  const esUrlVideo =
    texto.trim().startsWith('http://') || texto.trim().startsWith('https://')
      ? /youtube\.com|youtu\.be|vimeo\.com|facebook\.com|fb\.watch|\.mp4|\.m3u8/i.test(texto.trim())
      : false;

  const pegarPortapapeles = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      if (clipboardText) onTexto(clipboardText);
    } catch {}
  };

  return (
    <div className="w-full max-w-full">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <label htmlFor="texto-directo-sermon" className="text-[12px] font-semibold text-[var(--tinta)]">
          Copia y pega la transcripción o notas del mensaje:
        </label>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={pegarPortapapeles}
            disabled={disabled}
            className="text-[11.5px] font-semibold text-[var(--coralOscuro)] hover:underline"
          >
            Pegar desde portapapeles
          </button>
          {texto && (
            <button
              type="button"
              onClick={() => onTexto('')}
              disabled={disabled}
              className="text-[11.5px] font-semibold text-[var(--muted)] hover:text-[#8f2830]"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      <textarea
        id="texto-directo-sermon"
        className="campo min-h-[220px] resize-y font-mono text-[13px] leading-relaxed w-full max-w-full"
        value={texto}
        onChange={(e) => onTexto(e.target.value)}
        placeholder="Pega aquí el contenido completo del mensaje o prédica..."
        disabled={disabled}
      />

      {esUrlVideo && onDetectarEnlaceVideo && (
        <div className="mt-2.5 flex flex-col gap-2 rounded-[10px] bg-[#fff8ec] border border-[#f0d4b8] p-3 text-[12px] sm:flex-row sm:items-center sm:justify-between">
          <span className="font-medium text-[#7a4918]">
            💡 Has pegado un enlace de video en lugar de una transcripción. ¿Deseas extraer su audio y analizarlo?
          </span>
          <button
            type="button"
            onClick={() => onDetectarEnlaceVideo(texto.trim())}
            className="btn-primario text-[11px] py-1.5 px-3 shrink-0"
          >
            Pasar a pestaña de video
          </button>
        </div>
      )}

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11.5px] font-medium text-[var(--muted)]">
        <span>
          {palabras.toLocaleString('es-CO')} palabras · {caracteres.toLocaleString('es-CO')} caracteres
        </span>
        <span>
          {caracteres < 120 ? (
            <span className="text-[#8f2830]">Mínimo 120 caracteres para análisis (faltan {120 - caracteres})</span>
          ) : (
            <span className="font-semibold text-[#276738]">✓ Contenido suficiente para análisis ministerial</span>
          )}
        </span>
      </div>
    </div>
  );
}
