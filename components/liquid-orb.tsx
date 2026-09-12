'use client'

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import FluidOrb from '@/components/fluid-orb'
import MatrixOrb from '@/components/matrix-orb'

export type OrbState = 'idle' | 'thinking' | 'error'

export type LiquidOrbHandle = {
  /** Abre el selector de archivos (usado por el botón "Subir otro audio"). */
  abrirSelector: () => void
}

type LiquidOrbProps = {
  state: OrbState
  progress?: number
  disabled?: boolean
  onFile: (file: File) => void
}

// Paleta de procesamiento: azul dominante con cian y púrpura (transición fluida).
const THINKING_COLORS = ['#0f62fe', '#08bdba', '#a56eff', '#0043ce']

const LiquidOrb = forwardRef<LiquidOrbHandle, LiquidOrbProps>(function LiquidOrb(
  { state, progress = 0, disabled = false, onFile },
  ref,
) {
  const inputRef = useRef<HTMLInputElement>(null)
  const onFileRef = useRef(onFile)
  const lastKeyRef = useRef<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const [orbSize, setOrbSize] = useState(240)
  const thinking = state === 'thinking'
  const errorState = state === 'error'

  useImperativeHandle(ref, () => ({
    abrirSelector: () => {
      if (!disabled) inputRef.current?.click()
    },
  }), [disabled])

  useEffect(() => { onFileRef.current = onFile }, [onFile])
  useEffect(() => { if (!disabled) lastKeyRef.current = null }, [disabled])

  // Tamaño responsivo acotado también por el ALTO: en Windows no lo corta la
  // barra inferior y en móvil nunca excede el ancho.
  useEffect(() => {
    const compute = () => {
      const vw = window.innerWidth
      const vh = window.innerHeight
      // Durante el análisis el orbe se reduce para que quepan la barra y los
      // versículos sin necesidad de hacer scroll.
      const maxVh = thinking ? 0.24 : 0.34
      const maxPx = thinking ? 210 : 300
      const s = Math.round(Math.max(140, Math.min(vw * 0.56, vh * maxVh, maxPx)))
      setOrbSize(s)
    }
    compute()
    window.addEventListener('resize', compute)
    window.addEventListener('orientationchange', compute)
    return () => {
      window.removeEventListener('resize', compute)
      window.removeEventListener('orientationchange', compute)
    }
  }, [thinking])

  const procesar = (file: File) => {
    const key = `${file.name}:${file.size}:${file.lastModified}`
    if (key === lastKeyRef.current) return
    lastKeyRef.current = key
    onFileRef.current(file)
  }

  // Captura del archivo por 'change', 'focus' y 'visibilitychange' (iOS).
  useEffect(() => {
    const input = inputRef.current
    if (!input) return
    const leer = () => {
      const file = input.files?.[0]
      if (!file) return
      procesar(file)
      input.value = ''
    }
    const conReintentos = () => {
      leer()
      setTimeout(leer, 300)
      setTimeout(leer, 1000)
    }
    const onVisibility = () => { if (document.visibilityState === 'visible') conReintentos() }
    input.addEventListener('change', conReintentos)
    window.addEventListener('focus', conReintentos)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      input.removeEventListener('change', conReintentos)
      window.removeEventListener('focus', conReintentos)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDragging(false)
    if (disabled) return
    const file = event.dataTransfer?.files?.[0]
    if (file) procesar(file)
  }

  return (
    <div className="flex flex-col items-center gap-2 sm:gap-3 select-none">
      <div
        className="relative"
        style={{ width: orbSize, height: orbSize, transition: 'width .5s ease, height .5s ease' }}
        onDragOver={(event) => { event.preventDefault(); if (!disabled) setDragging(true) }}
        onDragEnter={(event) => { event.preventDefault(); if (!disabled) setDragging(true) }}
        onDragLeave={(event) => { event.preventDefault(); setDragging(false) }}
        onDrop={handleDrop}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label="Subir archivo de audio"
        onKeyDown={(event) => {
          if (!disabled && (event.key === 'Enter' || event.key === ' ')) {
            event.preventDefault()
            inputRef.current?.click()
          }
        }}
      >
        {/* Estado en reposo: orbe líquido (FluidOrb). */}
        <div
          className="absolute inset-0 transition-opacity duration-700 ease-out"
          style={{ opacity: thinking ? 0 : 1 }}
        >
          <FluidOrb className="w-full h-full pointer-events-none" color="#0f62fe" active={!thinking} />
        </div>

        {/* Estado procesando: orbe multicolor (MatrixOrb). */}
        <div
          className="absolute inset-0 flex items-center justify-center transition-opacity duration-700 ease-out"
          style={{ opacity: thinking ? 1 : 0 }}
        >
          <MatrixOrb
            state={thinking ? 'thinking' : 'idle'}
            colors={THINKING_COLORS}
            active={thinking}
            size={orbSize}
            labels={{ idle: '', listening: '', thinking: '' }}
            className="pointer-events-none"
          />
        </div>

        {/* Estado error: tratamiento sobrio (atenuado + anillo ámbar, sin pulso). */}
        <div
          aria-hidden
          className="absolute inset-0 rounded-full pointer-events-none transition-opacity duration-500"
          style={{
            opacity: errorState ? 1 : 0,
            background: 'radial-gradient(circle at 50% 50%, rgba(22,22,22,0.55), rgba(22,22,22,0.8))',
            boxShadow: 'inset 0 0 0 2px rgba(241,194,27,0.55)',
          }}
        />

        <input
          ref={inputRef}
          type="file"
          accept="audio/*,.mp3,.m4a,.wav,.aac,.ogg,.oga,.opus,.flac,.webm,.mp4,.aiff,.aif,.caf,.3gp"
          aria-label="Seleccionar archivo de audio"
          disabled={disabled}
          className={`absolute inset-0 w-full h-full opacity-0 z-30 ${dragging ? 'pointer-events-none' : 'cursor-pointer'}`}
        />

        {dragging && (
          <div className="absolute inset-0 rounded-full pointer-events-none ring-2 ring-[#0f62fe]" />
        )}
      </div>

      {/* Texto o porcentaje DEBAJO del orbe — número estilo Carbon */}
      <div className="h-10 flex items-center justify-center">
        {thinking ? (
          <div className="flex items-baseline gap-1 text-[#f4f4f4] tabular-nums">
            <span className="text-fluid-counter font-light leading-none">{progress}</span>
            <span className="text-lg sm:text-xl font-light text-[#c6c6c6]">%</span>
          </div>
        ) : (
          <span className="text-[#c6c6c6] text-sm font-normal tracking-wide">Toca o arrastra aquí</span>
        )}
      </div>
    </div>
  )
})

export default LiquidOrb
