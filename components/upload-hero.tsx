'use client'

import type React from 'react'
import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { AudioLines, Sparkles, UploadCloud, FileAudio, X } from 'lucide-react'

type UploadHeroProps = {
  onAnalyze: (file: File) => void
  status: 'idle' | 'analyzing' | 'done'
  error?: string | null
}

export function UploadHero({ onAnalyze, status, error }: UploadHeroProps) {
  const [dragging, setDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const isAudio = (f: File) =>
    f.type.startsWith('audio/') || /\.(mp3|wav|m4a|aac|ogg|flac)$/i.test(f.name)

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    const f = files[0]
    if (isAudio(f)) setFile(f)
  }

  const analyzing = status === 'analyzing'

  return (
    <section className="relative overflow-hidden border-b border-border">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-40 h-80 bg-gradient-to-b from-secondary to-transparent"
      />
      <div className="relative mx-auto flex max-w-4xl flex-col items-center px-5 py-14 text-center sm:px-6 md:py-28">
        <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-muted-foreground shadow-sm sm:text-sm">
          <Sparkles className="size-3.5 text-accent sm:size-4" aria-hidden="true" />
          Análisis de enseñanza asistido
        </span>

        <h1 className="text-balance font-serif text-4xl font-semibold leading-tight tracking-tight text-primary sm:text-5xl md:text-7xl">
          TeoDoc
        </h1>
        <p className="mt-2 text-balance text-base font-medium tracking-tight text-accent-foreground sm:mt-3 sm:text-xl md:text-2xl">
          Analizador de Mensajes
        </p>
        <p className="mt-4 max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground sm:mt-5 sm:text-lg">
          Sube el audio de una enseñanza y recibe un reporte infográfico claro: la idea principal, el desarrollo con sus
          versículos, aplicaciones prácticas y una oración pastoral.
        </p>

        <div
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragging(false)
            handleFiles(e.dataTransfer.files)
          }}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              inputRef.current?.click()
            }
          }}
          className={cn(
            'group mt-8 w-full max-w-2xl cursor-pointer rounded-2xl border-2 border-dashed bg-card p-5 text-left shadow-sm transition-colors sm:p-8 md:p-10',
            dragging ? 'border-accent bg-secondary' : 'border-border hover:border-accent/60',
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg,.flac"
            className="sr-only"
            onChange={(e) => handleFiles(e.target.files)}
          />

          {file ? (
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground sm:size-12">
                <FileAudio className="size-5 sm:size-6" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground sm:text-base">{file.name}</p>
                <p className="text-xs text-muted-foreground sm:text-sm">{(file.size / (1024 * 1024)).toFixed(1)} MB · listo para analizar</p>
              </div>
              <button
                type="button"
                aria-label="Quitar archivo"
                onClick={(e) => {
                  e.stopPropagation()
                  setFile(null)
                  if (inputRef.current) inputRef.current.value = ''
                }}
                className="flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 py-2 text-center sm:gap-4 sm:py-4">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-secondary text-primary transition-colors group-hover:bg-accent/15 sm:size-14">
                <UploadCloud className="size-6 sm:size-7" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground sm:text-base">
                  Arrastra tu archivo de audio aquí
                </p>
                <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                  o haz clic para seleccionar · MP3, WAV, M4A
                </p>
              </div>
            </div>
          )}
        </div>

        <Button
          size="lg"
          onClick={() => {
            if (file) onAnalyze(file)
          }}
          disabled={analyzing || !file}
          className="mt-6 h-11 w-full max-w-xs gap-2 rounded-xl bg-primary px-8 text-sm font-semibold text-primary-foreground shadow-md transition-transform hover:bg-primary/90 hover:shadow-lg active:scale-[0.98] disabled:opacity-80 sm:mt-8 sm:h-12 sm:w-auto sm:text-base"
        >
          {analyzing ? (
            <>
              <AudioLines className="size-5 animate-pulse" aria-hidden="true" />
              Analizando enseñanza…
            </>
          ) : (
            <>
              <Sparkles className="size-5" aria-hidden="true" />
              Analizar Enseñanza
            </>
          )}
        </Button>

        {error ? (
          <p className="mt-4 max-w-md text-sm font-medium text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        {status === 'done' && (
          <p className="mt-4 text-sm font-medium text-accent-foreground/80">
            Tu reporte está listo abajo.
          </p>
        )}
      </div>
    </section>
  )
}
