'use client'

import { useEffect, useRef, useState } from 'react'
import FluidOrb from '@/components/fluid-orb'
import MatrixOrb from '@/components/matrix-orb'
import type { LiquidOrbState } from '@/lib/liquid-orb-seeds'

type LiquidOrbProps = {
  state: LiquidOrbState
  progress?: number
  disabled?: boolean
  onFile: (file: File) => void
}

export default function LiquidOrb({ state, progress = 0, disabled = false, onFile }: LiquidOrbProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const onFileRef = useRef(onFile)
  const lastKeyRef = useRef<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const [orbSize, setOrbSize] = useState(240)
  const thinking = state === 'thinking'

  useEffect(() => { onFileRef.current = onFile }, [onFile])
  useEffect(() => { if (!disabled) lastKeyRef.current = null }, [disabled])

  // Tamaño responsivo acotado también por el ALTO: en Windows no lo corta la
  // barra inferior y en móvil nunca excede el ancho.
  useEffect(() => {
    const compute = () => {
      const vw = window.innerWidth
      const vh = window.innerHeight
      const s = Math.round(Math.max(180, Math.min(vw * 0.56, vh * 0.34, 300)))
      setOrbSize(s)
    }
    compute()
    window.addEventListener('resize', compute)
    window.addEventListener('orientationchange', compute)
    return () => {
      window.removeEventListener('resize', compute)
      window.removeEventListener('orientationchange', compute)
    }
  }, [])

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
    <div className="flex flex-col items-center gap-3 sm:gap-4 select-none">
      <div
        className="relative"
        style={{ width: orbSize, height: orbSize }}
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
        {/* Pantalla principal: orbe anterior (FluidOrb). Análisis: MatrixOrb. */}
        {thinking ? (
          <MatrixOrb
            state="thinking"
            color="#a56eff"
            size={orbSize}
            labels={{ idle: '', listening: '', thinking: '' }}
            className="pointer-events-none"
          />
        ) : (
          <FluidOrb
            className="absolute inset-0 w-full h-full pointer-events-none"
            color="#0f62fe"
          />
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
          <div className="absolute inset-0 rounded-full pointer-events-none ring-2 ring-[#0f62fe]" />
        )}
      </div>

      {/* Texto o porcentaje DEBAJO del orbe — número estilo Carbon */}
      <div className="h-12 flex items-center justify-center">
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
}
