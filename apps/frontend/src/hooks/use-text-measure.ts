'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import {
  measureTextBlock,
  measureTextWidth,
  estimateDocumentContentHeight,
  resolveFont,
  FONT_SIZES,
  type FontSizeKey,
} from '@/lib/pretext'

interface TextMeasureOptions {
  font?: string
  fontSize?: number | FontSizeKey
  lineHeight?: number
  maxWidth?: number
  debounceMs?: number
}

interface TextMeasureResult {
  lines: number
  height: number
  naturalWidth: number
}

export function useTextMeasure(
  text: string,
  options: TextMeasureOptions = {},
): TextMeasureResult {
  const { font = 'Lexend', fontSize = 'base', lineHeight = 1.6, maxWidth, debounceMs = 50 } = options
  const resolvedFont = useMemo(() => resolveFont(font), [font])
  const [result, setResult] = useState<TextMeasureResult>({ lines: 0, height: 0, naturalWidth: 0 })
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)

    timerRef.current = setTimeout(() => {
      if (!text) {
        setResult({ lines: 0, height: 0, naturalWidth: 0 })
        return
      }

      const block = measureTextBlock(text, resolvedFont, fontSize, lineHeight, maxWidth)
      const naturalWidth = measureTextWidth(text, resolvedFont, fontSize)
      setResult({ ...block, naturalWidth })
    }, debounceMs)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [text, resolvedFont, fontSize, lineHeight, maxWidth, debounceMs])

  return result
}

interface DocumentOverflowParams {
  lines: { description: string; type: 'standard' | 'section' }[]
  notes?: string
  acceptanceConditions?: string
  freeField?: string
  footerText?: string
  font?: string
  billingType?: 'quick' | 'detailed'
}

interface DocumentOverflowResult {
  overflows: boolean
  totalHeight: number
  overflow: number
  sections: Record<string, number>
}

export function useDocumentOverflow(
  params: DocumentOverflowParams,
): DocumentOverflowResult {
  const [result, setResult] = useState<DocumentOverflowResult>({
    overflows: false,
    totalHeight: 0,
    overflow: 0,
    sections: {},
  })
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const depsKey = useMemo(() => JSON.stringify({
    lines: params.lines.map(l => ({ d: l.description.slice(0, 100), t: l.type })),
    notes: params.notes?.slice(0, 50),
    ac: params.acceptanceConditions?.slice(0, 50),
    ff: params.freeField?.slice(0, 50),
    ft: params.footerText?.slice(0, 50),
    font: params.font,
    bt: params.billingType,
  }), [params.lines, params.notes, params.acceptanceConditions, params.freeField, params.footerText, params.font, params.billingType])

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)

    timerRef.current = setTimeout(() => {
      const estimation = estimateDocumentContentHeight(params)
      setResult(estimation)
    }, 100)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [depsKey])

  return result
}

export function useAutoHeight(
  text: string,
  options: {
    font?: string
    fontSize?: number | FontSizeKey
    lineHeight?: number
    maxWidth?: number
    minRows?: number
    maxRows?: number
    paddingY?: number
  } = {},
): number {
  const {
    font = 'Lexend',
    fontSize = 'base',
    lineHeight = 1.6,
    maxWidth = 600,
    minRows = 2,
    maxRows = 10,
    paddingY = 16,
  } = options

  const resolvedFont = useMemo(() => resolveFont(font), [font])
  const [height, setHeight] = useState(0)
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)

    timerRef.current = setTimeout(() => {
      const resolvedSize = typeof fontSize === 'string'
        ? FONT_SIZES[fontSize]
        : fontSize

      const singleLineHeight = resolvedSize * lineHeight

      if (!text) {
        setHeight(singleLineHeight * minRows + paddingY)
        return
      }

      const block = measureTextBlock(text, resolvedFont, fontSize, lineHeight, maxWidth)
      const clampedLines = Math.min(Math.max(block.lines, minRows), maxRows)
      setHeight(clampedLines * singleLineHeight + paddingY)
    }, 30)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [text, resolvedFont, fontSize, lineHeight, maxWidth, minRows, maxRows, paddingY])

  return height
}
