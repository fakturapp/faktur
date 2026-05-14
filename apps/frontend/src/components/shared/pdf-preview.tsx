'use client'

import { useEffect, useRef, useState } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import type { PDFDocumentProxy, RenderTask } from 'pdfjs-dist'
import { ChevronLeft, ChevronRight, FileWarning } from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'
import { api } from '@/lib/api'

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).href

interface PdfPreviewProps {
  src: string
}

export function PdfPreview({ src }: PdfPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pdfRef = useRef<PDFDocumentProxy | null>(null)

  const [numPages, setNumPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    setNumPages(0)
    setCurrentPage(1)

    ;(async () => {
      const result = await api.downloadBlob(src)
      if (cancelled) return
      if (result.error || !result.blob) {
        setError(result.error || 'Impossible de charger le PDF.')
        setLoading(false)
        return
      }
      try {
        const buffer = await result.blob.arrayBuffer()
        if (cancelled) return
        const pdf = await pdfjsLib.getDocument({ data: buffer }).promise
        if (cancelled) {
          pdf.destroy()
          return
        }
        pdfRef.current = pdf
        setNumPages(pdf.numPages)
        setCurrentPage(1)
      } catch {
        if (!cancelled) setError('Le PDF généré est illisible.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
      pdfRef.current?.destroy()
      pdfRef.current = null
    }
  }, [src])

  useEffect(() => {
    const pdf = pdfRef.current
    const container = containerRef.current
    const canvas = canvasRef.current
    if (!pdf || !container || !canvas || numPages === 0) return

    let cancelled = false
    let renderTask: RenderTask | null = null
    let scheduled: ReturnType<typeof setTimeout> | undefined

    async function renderPage() {
      if (cancelled || !pdf || !container || !canvas) return
      const page = await pdf.getPage(currentPage)
      if (cancelled) return
      const base = page.getViewport({ scale: 1 })
      const fit = Math.max(
        0.1,
        Math.min(
          container.clientWidth / base.width,
          container.clientHeight / base.height,
        ),
      )
      const dpr = window.devicePixelRatio || 1
      const viewport = page.getViewport({ scale: fit * dpr })
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      renderTask?.cancel()
      canvas.width = viewport.width
      canvas.height = viewport.height
      canvas.style.width = `${viewport.width / dpr}px`
      canvas.style.height = `${viewport.height / dpr}px`
      renderTask = page.render({ canvas, canvasContext: ctx, viewport })
      try {
        await renderTask.promise
      } catch {
      }
    }

    renderPage()
    const ro = new ResizeObserver(() => {
      clearTimeout(scheduled)
      scheduled = setTimeout(renderPage, 120)
    })
    ro.observe(container)

    return () => {
      cancelled = true
      clearTimeout(scheduled)
      renderTask?.cancel()
      ro.disconnect()
    }
  }, [currentPage, numPages])

  return (
    <div className="relative flex h-full w-full flex-col items-center">
      <div ref={containerRef} className="flex min-h-0 w-full flex-1 items-center justify-center">
        {loading && (
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <Spinner size="lg" className="text-accent" />
            <p className="text-sm">Génération de l’aperçu…</p>
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <FileWarning className="h-8 w-8 text-danger" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <canvas
          ref={canvasRef}
          className={`rounded-lg bg-white shadow-xl ${loading || error ? 'hidden' : ''}`}
        />
      </div>

      {!loading && !error && numPages > 1 && (
        <div className="mt-3 flex shrink-0 items-center gap-1 rounded-full bg-foreground/85 px-1.5 py-1 shadow-lg backdrop-blur-sm">
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="flex h-7 w-7 items-center justify-center rounded-full text-background/90 transition-colors hover:bg-background/15 disabled:opacity-30 disabled:hover:bg-transparent"
            aria-label="Page précédente"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="px-2 text-[12px] font-medium tabular-nums text-background">
            {currentPage} / {numPages}
          </span>
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.min(numPages, p + 1))}
            disabled={currentPage === numPages}
            className="flex h-7 w-7 items-center justify-center rounded-full text-background/90 transition-colors hover:bg-background/15 disabled:opacity-30 disabled:hover:bg-transparent"
            aria-label="Page suivante"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}
