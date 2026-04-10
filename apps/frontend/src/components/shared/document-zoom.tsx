'use client'

import { useState, useRef, useEffect, type RefObject } from 'react'
import { Minus, Plus } from 'lucide-react'

const STORAGE_KEY = 'faktur_doc_zoom'
const MIN = 50
const MAX = 150
const STEP = 10
const DEFAULT = 100

export function loadDocumentZoom(): number {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    if (!v) return DEFAULT
    const n = Number(v)
    return n >= MIN && n <= MAX ? n : DEFAULT
  } catch {
    return DEFAULT
  }
}

export function useZoomSpacing(
  ref: RefObject<HTMLElement | null>,
  zoom: number,
): { marginBottom: string; transition: string } {
  const [naturalHeight, setNaturalHeight] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const update = () => setNaturalHeight(el.offsetHeight)
    update()

    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref])

  const scale = zoom / 100
  const scaleOffset = (scale - 1) * naturalHeight
  const hardClearance = 120 * scale
  return {
    marginBottom: `${Math.round(scaleOffset + hardClearance)}px`,
    transition: 'margin-bottom 0.2s ease, transform 0.15s ease',
  }
}

function persist(v: number) {
  try {
    localStorage.setItem(STORAGE_KEY, String(v))
  } catch {}
}

interface DocumentZoomProps {
  value: number
  onChange: (v: number) => void
}

export function DocumentZoom({ value, onChange }: DocumentZoomProps) {
  const [editing, setEditing] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  function set(v: number) {
    const clamped = Math.max(MIN, Math.min(MAX, v))
    onChange(clamped)
    persist(clamped)
  }

  function handleInputSubmit() {
    const n = parseInt(inputValue, 10)
    if (!isNaN(n)) set(n)
    setEditing(false)
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => set(value - STEP)}
        disabled={value <= MIN}
        className="p-1 rounded text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
      >
        <Minus className="h-3 w-3" />
      </button>
      <input
        type="range"
        min={MIN}
        max={MAX}
        step={STEP}
        value={value}
        onChange={(e) => set(Number(e.target.value))}
        className="w-24 h-1.5 accent-primary cursor-pointer appearance-none rounded-full bg-muted-foreground/20 dark:bg-muted-foreground/30 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
      />
      {editing ? (
        <input
          ref={inputRef}
          type="number"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onBlur={handleInputSubmit}
          onKeyDown={(e) => e.key === 'Enter' && handleInputSubmit()}
          className="w-12 text-xs text-center bg-muted border border-border rounded px-1 py-0.5 text-foreground outline-none focus:border-primary/50 tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          autoFocus
        />
      ) : (
        <button
          onClick={() => { setEditing(true); setInputValue(String(value)) }}
          onDoubleClick={() => set(DEFAULT)}
          className="text-xs tabular-nums text-muted-foreground hover:text-foreground min-w-[36px] text-center transition-colors"
          title="Cliquer pour saisir, double-clic pour reinitialiser"
        >
          {value}%
        </button>
      )}
      <button
        onClick={() => set(value + STEP)}
        disabled={value >= MAX}
        className="p-1 rounded text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
      >
        <Plus className="h-3 w-3" />
      </button>
    </div>
  )
}
