'use client'

import { useEffect, useRef, useState } from 'react'
import FluidOrb from '@/components/fluid-orb'
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
  const thinking = state === 'thinking'

  useEffect(() => { onFileRef.current = onFile }, [onFile])
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
    <div className="flex flex-col items-center gap-6 select-none">
      <div
        className="relative w-[248px] h-[248px] sm:w-[320px] sm:h-[320px]"
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
        <FluidOrb
          className="absolute inset-0 w-full h-full pointer-events-none"
          color={thinking ? '#8a3ffc' : '#0f62fe'}
        />

        {/* Contador de progreso centrado (Carbon: peso ligero, cifras tabulares) */}
        {thinking && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div
              className="absolute w-[62%] h-[62%] rounded-full"
              style={{ background: 'radial-gradient(circle, rgba(10,10,10,0.55), rgba(10,10,10,0) 72%)' }}
            />
            <span className="relative text-5xl sm:text-6xl font-light tracking-tight text-white tabular-nums leading-none">
              {progress}
              <span className="text-2xl sm:text-3xl align-top font-light">%</span>
            </span>
          </div>
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
          <div className="absolute inset-0 rounded-full pointer-events-none ring-2 ring-[#0f62fe] ring-offset-0" />
        )}
      </div>

      {!thinking && (
        <span className="text-[#c6c6c6] text-sm font-normal tracking-wide">Toca o arrastra aquí</span>
      )}
    </div>
  )
}
