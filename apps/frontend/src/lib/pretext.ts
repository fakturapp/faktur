'use client'

import {
  prepare,
  prepareWithSegments,
  layout,
  layoutWithLines,
  measureNaturalWidth,
  clearCache,
  setLocale,
  type PreparedText,
  type PreparedTextWithSegments,
  type PrepareOptions,
  type LayoutResult,
  type LayoutLinesResult,
} from '@chenglou/pretext'

import {
  prepareRichInline,
  measureRichInlineStats,
  type RichInlineItem,
  type PreparedRichInline,
} from '@chenglou/pretext/rich-inline'

export const A4_WIDTH_PX = 960
export const A4_CONTENT_WIDTH_PX = A4_WIDTH_PX - 80
export const A4_HEIGHT_PX = Math.round(960 * (297 / 210))
export const A4_CONTENT_HEIGHT_PX = A4_HEIGHT_PX - 64

const DOCUMENT_FONTS: Record<string, string> = {
  default: "'Lexend', 'Segoe UI', sans-serif",
  lexend: "'Lexend', 'Segoe UI', sans-serif",
  inter: "'Inter', sans-serif",
  lato: "'Lato', sans-serif",
  roboto: "'Roboto', sans-serif",
  georgia: "'Georgia', serif",
  serif: "'Georgia', serif",
  sans: "'Arial', sans-serif",
  mono: "'Courier New', monospace",
}

export const FONT_SIZES = {
  'xs':  9,
  'sm':  10,
  'md':  11,
  'base': 12,
  'lg':  13,
  'xl':  14,
  'xxl': 18,
} as const

export type FontSizeKey = keyof typeof FONT_SIZES

function resolveFontSize(fontSize: number | FontSizeKey): number {
  return typeof fontSize === 'string' ? FONT_SIZES[fontSize] : fontSize
}

export function resolveFont(fontName?: string): string {
  if (!fontName) return DOCUMENT_FONTS.default
  const key = fontName.toLowerCase().replace(/\s/g, '')
  return DOCUMENT_FONTS[key] || `'${fontName}', 'Segoe UI', sans-serif`
}

function stripFormatting(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/~~(.+?)~~/g, '$1')
    .replace(/\{color:[^}]+\}(.+?)\{\/color\}/g, '$1')
    .replace(/\{bg:[^}]+\}(.+?)\{\/bg\}/g, '$1')
    .replace(/\{size:\w+\}(.+?)\{\/size\}/g, '$1')
    .replace(/\{font:[^}]+\}(.+?)\{\/font\}/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^## /gm, '')
    .replace(/^- /gm, '')
}

export function measureTextBlock(
  text: string,
  font: string,
  fontSize: number | FontSizeKey = 'base',
  lineHeight: number = 1.6,
  maxWidth: number = A4_CONTENT_WIDTH_PX,
): { lines: number; height: number } {
  if (!text || text.trim().length === 0) return { lines: 0, height: 0 }
  const size = resolveFontSize(fontSize)
  const stripped = stripFormatting(text)
  const prepared = prepare(stripped, `${size}px ${font}`)
  const result = layout(prepared, maxWidth, size * lineHeight)
  return { lines: result.lineCount, height: result.height }
}

export function measureTextLines(
  text: string,
  font: string,
  fontSize: number | FontSizeKey = 'base',
  lineHeight: number = 1.6,
  maxWidth: number = A4_CONTENT_WIDTH_PX,
): LayoutLinesResult & { lines: LayoutLinesResult['lines'] } {
  if (!text || text.trim().length === 0) {
    return { lineCount: 0, height: 0, lines: [] }
  }
  const size = resolveFontSize(fontSize)
  const stripped = stripFormatting(text)
  const prepared = prepareWithSegments(stripped, `${size}px ${font}`)
  return layoutWithLines(prepared, maxWidth, size * lineHeight)
}

export function measureTextWidth(
  text: string,
  font: string,
  fontSize: number | FontSizeKey = 'base',
): number {
  if (!text) return 0
  const size = resolveFontSize(fontSize)
  const stripped = stripFormatting(text)
  const prepared = prepareWithSegments(stripped, `${size}px ${font}`)
  return measureNaturalWidth(prepared)
}

export function measureRichText(
  items: RichInlineItem[],
  maxWidth: number = A4_CONTENT_WIDTH_PX,
): { lineCount: number; maxLineWidth: number } {
  if (items.length === 0) return { lineCount: 0, maxLineWidth: 0 }
  const prepared = prepareRichInline(items)
  return measureRichInlineStats(prepared, maxWidth)
}

export function parseRichInlineItems(
  text: string,
  baseFont: string,
  baseFontSize: number | FontSizeKey = 'base',
): RichInlineItem[] {
  const size = resolveFontSize(baseFontSize)
  const fontStr = `${size}px ${baseFont}`
  const boldFontStr = `bold ${size}px ${baseFont}`
  const italicFontStr = `italic ${size}px ${baseFont}`

  const items: RichInlineItem[] = []
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/)

  for (const part of parts) {
    if (!part) continue
    if (part.startsWith('**') && part.endsWith('**')) {
      items.push({ text: part.slice(2, -2), font: boldFontStr })
    } else if (part.startsWith('*') && part.endsWith('*')) {
      items.push({ text: part.slice(1, -1), font: italicFontStr })
    } else {
      items.push({ text: part, font: fontStr })
    }
  }

  return items
}

export function estimateDocumentContentHeight(params: {
  lines: { description: string; type: 'standard' | 'section' }[]
  notes?: string
  acceptanceConditions?: string
  freeField?: string
  footerText?: string
  font?: string
  billingType?: 'quick' | 'detailed'
}): {
  totalHeight: number
  overflows: boolean
  overflow: number
  sections: Record<string, number>
} {
  const font = resolveFont(params.font)
  const sections: Record<string, number> = {}
  let totalHeight = 0

  sections.header = 200
  totalHeight += 200

  sections.subject = 25
  totalHeight += 25

  sections.tableHeader = 30
  totalHeight += 30

  let linesHeight = 0
  for (const line of params.lines) {
    if (line.type === 'section') {
      linesHeight += 28
    } else {
      const desc = measureTextBlock(line.description, font, 'base', 1.6, A4_CONTENT_WIDTH_PX - 200)
      linesHeight += Math.max(32, desc.height + 16)
    }
  }
  sections.lines = linesHeight
  totalHeight += linesHeight

  sections.totals = 100
  totalHeight += 100

  if (params.notes) {
    const h = measureTextBlock(params.notes, font, 'md', 1.6).height + 30
    sections.notes = h
    totalHeight += h
  }

  if (params.acceptanceConditions) {
    const h = measureTextBlock(params.acceptanceConditions, font, 'md', 1.6).height + 25
    sections.acceptanceConditions = h
    totalHeight += h
  }

  if (params.freeField) {
    const h = measureTextBlock(params.freeField, font, 'md', 1.6).height + 25
    sections.freeField = h
    totalHeight += h
  }

  if (params.footerText) {
    const h = measureTextBlock(params.footerText, font, 'xs', 1.6).height + 20
    sections.footer = h
    totalHeight += h
  } else {
    sections.footer = 40
    totalHeight += 40
  }

  const overflow = totalHeight - A4_CONTENT_HEIGHT_PX
  return {
    totalHeight,
    overflows: overflow > 0,
    overflow: Math.max(0, overflow),
    sections,
  }
}

export {
  prepare,
  prepareWithSegments,
  layout,
  layoutWithLines,
  measureNaturalWidth,
  clearCache,
  setLocale,
  prepareRichInline,
  measureRichInlineStats,
}
export type {
  PreparedText,
  PreparedTextWithSegments,
  PrepareOptions,
  LayoutResult,
  LayoutLinesResult,
  RichInlineItem,
  PreparedRichInline,
}
