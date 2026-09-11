'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { createLiquidOrb, isWebGPUAvailable, type LiquidOrbHandle } from '@/lib/liquid-orb-engine'
import type { LiquidOrbState } from '@/lib/liquid-orb-seeds'

type LiquidOrbProps = {
  state: LiquidOrbState
  progress?: number
  disabled?: boolean
  onFile: (file: File) => void
}

const gradText = (gradient: string): CSSProperties => ({
  backgroundImage: gradient,
  backgroundClip: 'text',
  WebkitBackgroundClip: 'text',
  color: 'transparent',
  WebkitTextFillColor: 'transparent',
})

// Fallback 100% CSS para navegadores sin WebGPU (Safari iOS 15 / iPhone 7).
function CssOrb({ state }: { state: LiquidOrbState }) {
  const thinking = state === 'thinking'
  return (
    <div
      className="relative w-full h-full rounded-full overflow-hidden"
      style={{ background: 'radial-gradient(circle at 50% 32%, rgba(38,52,74,0.95), rgba(7,9,14,1) 70%)' }}
    >
      <div
        className="absolute inset-0 orbe-spin-slow"
        style={{
          background: thinking
            ? 'conic-gradient(from 0deg, rgba(0,0,0,0), rgba(236,72,153,0.55), rgba(168,85,247,0.5), rgba(0,0,0,0) 70%)'
            : 'conic-gradient(from 0deg, rgba(0,0,0,0), rgba(34,211,238,0.45), rgba(168,85,247,0.4), rgba(0,0,0,0) 70%)',
        }}
      />
      <div
        className="absolute inset-[12%] rounded-full blur-2xl orbe-glow"
        style={{
          background: thinking
            ? 'radial-gradient(circle, rgba(236,72,153,0.55), rgba(0,0,0,0) 70%)'
            : 'radial-gradient(circle, rgba(34,211,238,0.5), rgba(0,0,0,0) 70%)',
        }}
      />
      <div className="orbe-sheen" />
      <div
        className="absolute inset-0 rounded-full"
        style={{ boxShadow: 'inset 0 0 40px rgba(255,255,255,0.08), inset 0 -20px 50px rgba(0,0,0,0.55)' }}
      />
    </div>
  )
}

export default function LiquidOrb({ state, progress = 0, disabled = false, onFile }: LiquidOrbProps) {
  const [webgpu, setWebgpu] = useState<boolean | null>(null)
  const [dragging, setDragging] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const handleRef = useRef<LiquidOrbHandle | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const onFileRef = useRef(onFile)
  const lastKeyRef = useRef<string | null>(null)

  useEffect(() => { onFileRef.current = onFile }, [onFile])

  // Detecta WebGPU y arranca el motor. Si algo falla, cae al orb CSS.
  useEffect(() => {
    let cancelled = false
    if (!isWebGPUAvailable()) {
      // Sin WebGPU: `webgpu` queda null y el render usa el orb CSS.
      return () => { cancelled = true }
    }
    const canvas = canvasRef.current
    if (!canvas) {
      return () => { cancelled = true }
    }
    createLiquidOrb(canvas, state)
      .then((handle) => {
        if (cancelled) { handle.destroy(); return }
        handleRef.current = handle
        setWebgpu(true)
      })
      .catch((error) => {
        console.warn('LiquidOrb: usando fallback CSS —', error)
        if (!cancelled) setWebgpu(false)
      })
    return () => {
      cancelled = true
      handleRef.current?.destroy()
      handleRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Sincroniza el estado visual (idle/thinking) con el motor.
  useEffect(() => {
    handleRef.current?.setState(state)
  }, [state])

  // Al terminar un ciclo, permitir volver a subir el mismo archivo.
  useEffect(() => { if (!disabled) lastKeyRef.current = null }, [disabled])

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
    <div className="flex flex-col items-center gap-3 sm:gap-5 select-none">
      <div
        className="relative w-[240px] h-[240px] sm:w-[300px] sm:h-[300px]"
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
        {webgpu ? (
          <canvas ref={canvasRef} className="w-full h-full rounded-full" aria-hidden="true" />
        ) : (
          <CssOrb state={state} />
        )}

        <input
          ref={inputRef}
          type="file"
          accept="audio/*,.mp3,.m4a,.wav,.aac,.ogg,.oga,.opus,.flac,.webm,.mp4,.aiff,.aif,.caf,.3gp"
          aria-label="Seleccionar archivo de audio"
          disabled={disabled}
          className={`absolute inset-0 w-full h-full opacity-0 z-30 ${dragging ? 'pointer-events-none' : 'cursor-pointer'}`}
        />

        {dragging && (
          <div className="absolute inset-0 rounded-full pointer-events-none ring-2 ring-cyan-300/80 shadow-[0_0_40px_rgba(34,211,238,0.5)]" />
        )}
      </div>

      <div className="h-10 flex items-center justify-center">
        {state === 'thinking' ? (
          <span className="text-3xl sm:text-4xl font-black drop-shadow-[0_0_10px_rgba(255,255,255,0.35)]">
            <span className="grad-text" style={gradText('linear-gradient(to bottom right, #67e8f9, #f0abfc)')}>{progress}%</span>
          </span>
        ) : (
          <span className="text-white font-bold text-base sm:text-lg tracking-wide drop-shadow-md">Toca o arrastra aquí</span>
        )}
      </div>
    </div>
  )
}
