'use client'

import { useState } from 'react'
import type { Analisis } from '@/lib/sample-analysis'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { BookOpen, Check, Download, Lightbulb, ListChecks, Quote } from 'lucide-react'

type ReportViewProps = {
  analysis: Analisis
}

export function ReportView({ analysis }: ReportViewProps) {
  const [checked, setChecked] = useState<Record<string, boolean>>({})

  const completadas = analysis.aplicaciones.filter((a) => checked[a.id]).length

  return (
    <section aria-labelledby="reporte-titulo" className="mx-auto max-w-3xl px-5 py-12 sm:px-6 md:py-20">
      <div className="mb-8 flex flex-col gap-5 sm:mb-10 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="max-w-xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary sm:text-xs">
            Reporte de la enseñanza
          </span>
          <h2
            id="reporte-titulo"
            className="mt-3 text-balance font-serif text-2xl font-semibold leading-tight text-primary sm:mt-4 sm:text-3xl md:text-4xl"
          >
            {analysis.titulo}
          </h2>
          <p className="mt-2 text-pretty text-sm leading-relaxed text-muted-foreground sm:mt-3 sm:text-base">{analysis.subtitulo}</p>
        </div>

        <Button
          onClick={() => window.print()}
          variant="outline"
          className="w-full shrink-0 gap-2 rounded-xl border-primary/20 text-primary hover:bg-secondary sm:w-auto"
        >
          <Download className="size-4" aria-hidden="true" />
          Descargar PDF
        </Button>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 pl-6 shadow-lg shadow-primary/5 sm:p-7 sm:pl-8 md:p-8 md:pl-9">
        <div aria-hidden="true" className="absolute inset-y-0 left-0 w-1.5 bg-accent" />
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-xl bg-accent/15 text-accent-foreground sm:size-10">
            <Lightbulb className="size-4 text-accent sm:size-5" aria-hidden="true" />
          </span>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:text-sm">Idea Principal</h3>
        </div>
        <p className="mt-3 text-pretty text-base font-medium leading-relaxed text-foreground sm:mt-4 sm:text-xl">
          {analysis.ideaPrincipal}
        </p>
      </div>

      <div className="mt-10 sm:mt-14">
        <h3 className="mb-6 font-serif text-xl font-semibold text-primary sm:mb-8 sm:text-2xl">Desarrollo</h3>

        <ol className="relative border-l-2 border-border pl-6 sm:pl-8">
          {analysis.desarrollo.map((punto, i) => (
            <li key={i} className="relative pb-10 last:pb-0 sm:pb-12">
              <span
                aria-hidden="true"
                className="absolute -left-[33px] flex size-6 items-center justify-center rounded-full border-4 border-background bg-primary text-[10px] font-bold text-primary-foreground sm:-left-[41px] sm:size-8 sm:text-xs"
              >
                {i + 1}
              </span>

              <h4 className="text-base font-semibold text-foreground sm:text-lg">{punto.subtitulo}</h4>
              <p className="mt-2 text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">{punto.explicacion}</p>

              <div className="mt-3 space-y-3 sm:mt-4">
                {punto.versiculos.map((v, j) => (
                  <figure
                    key={j}
                    className="rounded-xl border border-cream-foreground/10 bg-cream p-3.5 sm:p-4"
                  >
                    <figcaption className="flex items-center gap-2 text-xs font-semibold text-cream-foreground sm:text-sm">
                      <BookOpen className="size-3.5 shrink-0 sm:size-4" aria-hidden="true" />
                      {v.cita}
                    </figcaption>
                    <blockquote className="mt-2 flex gap-2 font-serif text-sm italic leading-relaxed text-cream-foreground/90 sm:text-base">
                      <Quote className="mt-0.5 size-3.5 shrink-0 opacity-50 sm:mt-1 sm:size-4" aria-hidden="true" />
                      <span>{v.texto}</span>
                    </blockquote>
                  </figure>
                ))}
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-10 rounded-2xl border border-border bg-card p-5 shadow-sm sm:mt-14 sm:p-7 md:p-8">
        <div className="mb-5 flex items-center justify-between gap-4 sm:mb-6">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <span className="flex size-9 items-center justify-center rounded-xl bg-secondary text-primary sm:size-10">
              <ListChecks className="size-4 sm:size-5" aria-hidden="true" />
            </span>
            <h3 className="font-serif text-xl font-semibold text-primary sm:text-2xl">Aplicación Práctica</h3>
          </div>
          <span className="shrink-0 text-sm font-medium text-muted-foreground">
            {completadas}/{analysis.aplicaciones.length}
          </span>
        </div>

        <ul className="space-y-2.5 sm:space-y-3">
          {analysis.aplicaciones.map((app) => {
            const isChecked = !!checked[app.id]
            return (
              <li key={app.id}>
                <label
                  className={cn(
                    'flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-colors sm:gap-4 sm:p-4',
                    isChecked ? 'border-accent/40 bg-accent/10' : 'border-border hover:bg-secondary',
                  )}
                >
                  <span
                    className={cn(
                      'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors sm:size-6',
                      isChecked ? 'border-accent bg-accent text-accent-foreground' : 'border-muted-foreground/40',
                    )}
                  >
                    {isChecked && <Check className="size-3.5 sm:size-4" aria-hidden="true" />}
                  </span>
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={isChecked}
                    onChange={() => setChecked((prev) => ({ ...prev, [app.id]: !prev[app.id] }))}
                  />
                  <span
                    className={cn(
                      'text-pretty text-sm leading-relaxed transition-colors sm:text-base',
                      isChecked ? 'text-muted-foreground line-through' : 'text-foreground',
                    )}
                  >
                    {app.texto}
                  </span>
                </label>
              </li>
            )
          })}
        </ul>
      </div>

      <div className="mt-10 overflow-hidden rounded-2xl bg-primary p-6 text-primary-foreground shadow-xl sm:mt-14 sm:p-8 md:p-12">
        <h3 className="flex items-center justify-center gap-2 text-center text-xs font-semibold uppercase tracking-[0.2em] text-accent sm:text-sm">
          Oración Pastoral
        </h3>
        <p className="mx-auto mt-4 max-w-xl text-balance text-center font-serif text-lg italic leading-relaxed text-primary-foreground/95 sm:mt-6 sm:text-xl md:text-2xl">
          {analysis.oracion}
        </p>
      </div>
    </section>
  )
}
