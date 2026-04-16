'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bold, Italic, Underline, Strikethrough,
  Palette, Highlighter, ALargeSmall, Type,
  Link, List, Heading2, X, Check, ChevronDown,
  Unlink,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { measureTextBlock, resolveFont } from '@/lib/pretext'


function rgbToHex(rgb: string): string {
  const m = rgb.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/)
  if (!m) return rgb
  return '#' + [m[1], m[2], m[3]].map(n => parseInt(n).toString(16).padStart(2, '0')).join('')
}

function normalizeColor(c: string): string {
  c = c.trim()
  if (c.startsWith('rgb')) return rgbToHex(c)
  return c
}

const TEXT_COLORS = [
  '#000000', '#374151', '#6b7280', '#ef4444', '#f97316',
  '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899',
]

const HIGHLIGHT_COLORS = [
  '#fef08a', '#bbf7d0', '#bfdbfe', '#fbcfe8', '#e9d5ff', '#fed7aa', '#fecaca',
]

const FONTS = [
  { label: 'Default', value: 'inherit' },
  { label: 'Serif', value: 'Georgia' },
  { label: 'Sans', value: 'Arial' },
  { label: 'Mono', value: 'Courier New' },
]

const SIZES = [
  { label: 'Petit', value: '2' },
  { label: 'Normal', value: '3' },
  { label: 'Grand', value: '5' },
]


function escHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

const COLOR_REGEX = /^(#[0-9a-fA-F]{3,8}|rgba?\(\s*\d{1,3}(\s*,\s*\d{1,3}){2}(\s*,\s*(0|1|0?\.\d+))?\s*\)|[a-zA-Z]{3,20})$/
const ALLOWED_FONTS = new Set(['inherit', 'Arial', 'Georgia', 'Courier New', 'Helvetica', 'Times New Roman', 'Verdana', 'sans-serif', 'serif', 'monospace'])
const SAFE_URL_REGEX = /^(https?:|mailto:|tel:|#|\/[^/])/i

function sanitizeColor(value: string): string | null {
  const v = value.trim()
  return COLOR_REGEX.test(v) ? v : null
}

function sanitizeFont(value: string): string | null {
  const v = value.trim().replace(/^['"]|['"]$/g, '')
  return ALLOWED_FONTS.has(v) ? v : null
}

function sanitizeUrl(value: string): string | null {
  const v = value.trim()
  if (!SAFE_URL_REGEX.test(v)) return null
  return v.replace(/"/g, '%22')
}

function applyInlineFormat(h: string): string {
  h = h.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  h = h.replace(/__(.+?)__/g, '<u>$1</u>')
  h = h.replace(/\*(.+?)\*/g, '<em>$1</em>')
  h = h.replace(/~~(.+?)~~/g, '<s>$1</s>')
  h = h.replace(/\{color:([^}]+)\}(.+?)\{\/color\}/g, (_, color, content) => {
    const safe = sanitizeColor(color)
    return safe ? `<span style="color:${safe}">${content}</span>` : content
  })
  h = h.replace(/\{bg:([^}]+)\}(.+?)\{\/bg\}/g, (_, color, content) => {
    const safe = sanitizeColor(color)
    return safe
      ? `<span style="background-color:${safe};border-radius:2px;padding:0 1px">${content}</span>`
      : content
  })
  h = h.replace(/\{size:sm\}(.+?)\{\/size\}/g, '<span style="font-size:0.85em">$1</span>')
  h = h.replace(/\{size:lg\}(.+?)\{\/size\}/g, '<span style="font-size:1.3em">$1</span>')
  h = h.replace(/\{font:([^}]+)\}(.+?)\{\/font\}/g, (_, font, content) => {
    const safe = sanitizeFont(font)
    return safe ? `<span style="font-family:${safe}">${content}</span>` : content
  })
  h = h.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, text, href) => {
    const safe = sanitizeUrl(href)
    return safe
      ? `<a href="${safe}" rel="noopener noreferrer" target="_blank" style="color:inherit;text-decoration:underline">${text}</a>`
      : text
  })
  return h
}

export function mdToHtml(md: string): string {
  if (!md) return ''

  const lines = md.split('\n')
  const parts: string[] = []
  let inList = false

  for (let i = 0; i < lines.length; i++) {
    let line = escHtml(lines[i])
    line = applyInlineFormat(line)

    if (line.startsWith('## ')) {
      if (inList) { parts.push('</ul>'); inList = false }
      parts.push(`<h2 style="font-size:1.3em;font-weight:700;margin:2px 0">${line.slice(3)}</h2>`)
      continue
    }

    // List item
    if (line.startsWith('- ')) {
      if (!inList) { parts.push('<ul style="margin:0;padding-left:1.2em">'); inList = true }
      parts.push(`<li>${line.slice(2)}</li>`)
      continue
    }

    // Normal line
    if (inList) { parts.push('</ul>'); inList = false }
    parts.push(line)
    if (i < lines.length - 1) parts.push('<br>')
  }

  if (inList) parts.push('</ul>')
  return parts.join('')
}

/** Convert HTML from contentEditable → markdown string */
export function htmlToMd(html: string): string {
  if (!html) return ''
  let md = html

  // ── Block elements ──

  // Lists: <ul><li>...</li></ul> → "- ...\n"
  md = md.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (_, content) => {
    return content.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '- $1\n').trimEnd()
  })

  // Headings: <h1-6>...</h1-6> → "## ..."
  md = md.replace(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi, '## $1')

  // Links: <a href="url">text</a> → [text](url)
  md = md.replace(/<a\s[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, '[$2]($1)')

  // Chrome div-wrapped lines
  md = md.replace(/<\/div>\s*<div>/gi, '\n')
  md = md.replace(/<div>/gi, '\n')
  md = md.replace(/<\/div>/gi, '')
  // Paragraph wrappers
  md = md.replace(/<\/p>\s*<p>/gi, '\n')
  md = md.replace(/<p>/gi, '')
  md = md.replace(/<\/p>/gi, '')
  // Line breaks
  md = md.replace(/<br\s*\/?>/gi, '\n')

  // ── Inline formatting ──

  md = md.replace(/<strong>([\s\S]*?)<\/strong>/gi, '**$1**')
  md = md.replace(/<b>([\s\S]*?)<\/b>/gi, '**$1**')
  md = md.replace(/<u>([\s\S]*?)<\/u>/gi, '__$1__')
  md = md.replace(/<em>([\s\S]*?)<\/em>/gi, '*$1*')
  md = md.replace(/<i>([\s\S]*?)<\/i>/gi, '*$1*')
  md = md.replace(/<s>([\s\S]*?)<\/s>/gi, '~~$1~~')
  md = md.replace(/<del>([\s\S]*?)<\/del>/gi, '~~$1~~')
  md = md.replace(/<strike>([\s\S]*?)<\/strike>/gi, '~~$1~~')

  // ── Styled elements (iterative: innermost first) ──
  let prev = ''
  while (prev !== md) {
    prev = md

    // <font> tags (color, size, face)
    md = md.replace(/<font\s+([^>]*)>((?:(?!<font)[\s\S])*?)<\/font>/gi, (_, attrs, content) => {
      let r = content
      const cm = attrs.match(/color="([^"]*)"/)
      const sm = attrs.match(/size="([^"]*)"/)
      const fm = attrs.match(/face="([^"]*)"/)
      if (cm) {
        const c = normalizeColor(cm[1])
        if (c && c !== '#000000') r = `{color:${c}}${r}{/color}`
      }
      if (sm) {
        const s = parseInt(sm[1])
        if (s <= 2) r = `{size:sm}${r}{/size}`
        else if (s >= 4) r = `{size:lg}${r}{/size}`
      }
      if (fm) {
        const f = fm[1].trim()
        if (f && f !== 'inherit' && f !== '') r = `{font:${f}}${r}{/font}`
      }
      return r
    })

    // <span style="..."> tags
    md = md.replace(/<span\s+style="([^"]*)">((?:(?!<span)[\s\S])*?)<\/span>/gi, (_, style, content) => {
      let r = content
      const cm = style.match(/(?:^|;\s*)color:\s*([^;]+)/)
      const bm = style.match(/background-color:\s*([^;]+)/)
      const szm = style.match(/font-size:\s*([^;]+)/)
      const fm = style.match(/font-family:\s*([^;]+)/)
      if (cm) {
        const c = normalizeColor(cm[1].trim())
        if (c) r = `{color:${c}}${r}{/color}`
      }
      if (bm) {
        const b = normalizeColor(bm[1].trim())
        if (b && b !== 'transparent') r = `{bg:${b}}${r}{/bg}`
      }
      if (szm) {
        const raw = szm[1].trim()
        const px = parseFloat(raw)
        if (raw.includes('0.85') || raw.includes('small') || (raw.endsWith('px') && px < 12)) {
          r = `{size:sm}${r}{/size}`
        } else if (raw.includes('1.3') || raw.includes('large') || (raw.endsWith('px') && px > 14)) {
          r = `{size:lg}${r}{/size}`
        }
      }
      if (fm) {
        const f = fm[1].trim().replace(/['"]/g, '').split(',')[0].trim()
        if (f && f !== 'inherit') r = `{font:${f}}${r}{/font}`
      }
      return r
    })
  }

  // ── Cleanup ──

  // Strip remaining tags
  md = md.replace(/<[^>]+>/g, '')
  // Decode entities
  md = md.replace(/&amp;/g, '&')
  md = md.replace(/&lt;/g, '<')
  md = md.replace(/&gt;/g, '>')
  md = md.replace(/&quot;/g, '"')
  md = md.replace(/&nbsp;/g, ' ')
  // Trim leading newline Chrome sometimes adds
  if (md.startsWith('\n')) md = md.slice(1)

  return md
}

/* ═══════════════════════════════════════════════════════════
   Toolbar helpers
   ═══════════════════════════════════════════════════════════ */

function getFontLabel(fontName: string): string {
  if (!fontName || fontName === 'inherit') return 'Default'
  const match = FONTS.find(f => f.value.toLowerCase() === fontName.toLowerCase())
  if (match) return match.label
  return fontName.split(',')[0].replace(/['"]/g, '').trim()
}

function getSizeLabel(fontSize: string): string {
  const match = SIZES.find(s => s.value === fontSize)
  if (match) return match.label
  return 'Normal'
}

/* ═══════════════════════════════════════════════════════════
   Animated Tooltip
   ═══════════════════════════════════════════════════════════ */

function Tip({ label, children }: { label: string; children: React.ReactNode }) {
  const [show, setShow] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  return (
    <div
      className="relative flex"
      onMouseEnter={() => { timeoutRef.current = setTimeout(() => setShow(true), 500) }}
      onMouseLeave={() => { clearTimeout(timeoutRef.current); setShow(false) }}
    >
      {children}
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 3, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 3, scale: 0.95 }}
            transition={{ duration: 0.12, ease: [0.16, 1, 0.3, 1] }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-0.5 rounded-md bg-overlay shadow-overlay text-[10px] text-muted-foreground whitespace-nowrap pointer-events-none z-10"
          >
            {label}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   FloatingToolbar
   ═══════════════════════════════════════════════════════════ */

interface ToolbarState {
  visible: boolean
  x: number
  y: number
  bold: boolean
  italic: boolean
  underline: boolean
  strikethrough: boolean
  color: string
  bgColor: string
  inList: boolean
  inHeading: boolean
  fontSize: string
  fontName: string
  inLink: boolean
}

type Panel = 'color' | 'highlight' | 'size' | 'font' | 'link' | null

function FloatingToolbar({
  state,
  singleLine,
  containerRef,
  onFormat,
  onColor,
  onHighlight,
  onSize,
  onFont,
  onLink,
  onUnlink,
  onList,
  onHeading,
}: {
  state: ToolbarState
  singleLine: boolean
  containerRef: React.RefObject<HTMLDivElement | null>
  onFormat: (cmd: 'bold' | 'italic' | 'underline' | 'strikeThrough') => void
  onColor: (color: string) => void
  onHighlight: (color: string) => void
  onSize: (size: string) => void
  onFont: (font: string) => void
  onLink: (url: string) => void
  onUnlink: () => void
  onList: () => void
  onHeading: () => void
}) {
  const [panel, setPanel] = useState<Panel>(null)
  const [linkUrl, setLinkUrl] = useState('')
  const savedRangeRef = useRef<Range | null>(null)
  const linkInputRef = useRef<HTMLInputElement>(null)

  // Close panel when toolbar hides
  useEffect(() => {
    if (!state.visible) {
      setPanel(null)
      setLinkUrl('')
      savedRangeRef.current = null
    }
  }, [state.visible])

  // Auto-focus link input when panel opens
  useEffect(() => {
    if (panel === 'link') {
      setTimeout(() => linkInputRef.current?.focus(), 50)
    }
  }, [panel])

  const handleLinkOpen = () => {
    if (state.inLink) {
      onUnlink()
    } else {
      const sel = window.getSelection()
      if (sel && sel.rangeCount > 0) {
        savedRangeRef.current = sel.getRangeAt(0).cloneRange()
      }
      setLinkUrl('')
      setPanel('link')
    }
  }

  const handleLinkConfirm = () => {
    const url = linkUrl.trim()
    if (url && savedRangeRef.current) {
      const sel = window.getSelection()
      sel?.removeAllRanges()
      sel?.addRange(savedRangeRef.current)
      onLink(url)
    }
    setPanel(null)
    setLinkUrl('')
    savedRangeRef.current = null
  }

  const handleLinkCancel = () => {
    if (savedRangeRef.current) {
      const sel = window.getSelection()
      sel?.removeAllRanges()
      sel?.addRange(savedRangeRef.current)
    }
    setPanel(null)
    setLinkUrl('')
    savedRangeRef.current = null
  }

  const Btn = ({ active, onClick, children }: { active?: boolean; onClick: () => void; children: React.ReactNode }) => (
    <button
      onMouseDown={(e) => { e.preventDefault(); onClick() }}
      className={cn(
        'flex items-center justify-center h-7 w-7 rounded-md transition-colors',
        active ? 'bg-accent-soft text-accent' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      )}
    >
      {children}
    </button>
  )

  const Sep = () => <div className="w-px h-4 bg-border/60 mx-0.5" />

  return createPortal(
    <AnimatePresence>
      {state.visible && (
        <motion.div
          ref={containerRef}
          initial={{ opacity: 0, y: 4, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 4, scale: 0.96 }}
          transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="fixed z-[9999] flex flex-col rounded-xl bg-overlay shadow-overlay backdrop-blur-xl"
          style={{ top: state.y, left: state.x }}
          onMouseDown={(e) => {
            // Allow clicks on link input
            if ((e.target as HTMLElement).tagName === 'INPUT') return
            e.preventDefault()
          }}
        >
          {/* ── Main buttons row ── */}
          <div className="flex items-center gap-0.5 p-1">
            {/* Text style */}
            <Tip label="Gras">
              <Btn active={state.bold} onClick={() => onFormat('bold')}><Bold className="h-3.5 w-3.5" /></Btn>
            </Tip>
            <Tip label="Italique">
              <Btn active={state.italic} onClick={() => onFormat('italic')}><Italic className="h-3.5 w-3.5" /></Btn>
            </Tip>
            <Tip label="Souligné">
              <Btn active={state.underline} onClick={() => onFormat('underline')}><Underline className="h-3.5 w-3.5" /></Btn>
            </Tip>
            <Tip label="Barré">
              <Btn active={state.strikethrough} onClick={() => onFormat('strikeThrough')}><Strikethrough className="h-3.5 w-3.5" /></Btn>
            </Tip>

            <Sep />

            {/* Color */}
            <Tip label="Couleur du texte">
              <Btn active={panel === 'color'} onClick={() => setPanel(panel === 'color' ? null : 'color')}>
                <div className="flex flex-col items-center gap-0.5">
                  <Palette className="h-3 w-3" />
                  <div className="w-3 h-0.5 rounded-full" style={{ backgroundColor: state.color || '#000' }} />
                </div>
              </Btn>
            </Tip>
            <Tip label="Surlignage">
              <Btn active={panel === 'highlight'} onClick={() => setPanel(panel === 'highlight' ? null : 'highlight')}>
                <Highlighter className="h-3.5 w-3.5" />
              </Btn>
            </Tip>

            <Sep />

            {/* Typography — Word-style with current value label */}
            <Tip label="Taille">
              <button
                onMouseDown={(e) => { e.preventDefault(); setPanel(panel === 'size' ? null : 'size') }}
                className={cn(
                  'flex items-center gap-1 h-7 px-1.5 rounded-md transition-colors text-[11px]',
                  panel === 'size' ? 'bg-accent-soft text-accent' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <ALargeSmall className="h-3.5 w-3.5 shrink-0" />
                <span className="max-w-[48px] truncate">{getSizeLabel(state.fontSize)}</span>
                <ChevronDown className="h-2.5 w-2.5 shrink-0 opacity-50" />
              </button>
            </Tip>
            <Tip label="Police">
              <button
                onMouseDown={(e) => { e.preventDefault(); setPanel(panel === 'font' ? null : 'font') }}
                className={cn(
                  'flex items-center gap-1 h-7 px-1.5 rounded-md transition-colors text-[11px]',
                  panel === 'font' ? 'bg-accent-soft text-accent' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Type className="h-3.5 w-3.5 shrink-0" />
                <span className="max-w-[64px] truncate">{getFontLabel(state.fontName)}</span>
                <ChevronDown className="h-2.5 w-2.5 shrink-0 opacity-50" />
              </button>
            </Tip>

            <Sep />

            {/* Structure */}
            <Tip label={state.inLink ? 'Retirer le lien' : 'Lien'}>
              <Btn active={state.inLink || panel === 'link'} onClick={handleLinkOpen}>
                {state.inLink ? <Unlink className="h-3.5 w-3.5" /> : <Link className="h-3.5 w-3.5" />}
              </Btn>
            </Tip>
            {!singleLine && (
              <>
                <Tip label="Liste">
                  <Btn active={state.inList} onClick={onList}><List className="h-3.5 w-3.5" /></Btn>
                </Tip>
                <Tip label="Titre">
                  <Btn active={state.inHeading} onClick={onHeading}><Heading2 className="h-3.5 w-3.5" /></Btn>
                </Tip>
              </>
            )}
          </div>

          {/* ── Sub-panels ── */}
          <AnimatePresence>
            {panel === 'color' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.12 }}
                className="overflow-hidden border-t border-border/60"
              >
                <div className="flex items-center gap-1 p-1.5">
                  {/* Reset */}
                  <button
                    onMouseDown={(e) => { e.preventDefault(); onColor(''); setPanel(null) }}
                    className="h-5 w-5 rounded border border-border/80 flex items-center justify-center text-muted-foreground hover:bg-muted"
                    title="Par defaut"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  {TEXT_COLORS.map(c => (
                    <button
                      key={c}
                      onMouseDown={(e) => { e.preventDefault(); onColor(c); setPanel(null) }}
                      className="h-5 w-5 rounded-full border border-black/10 hover:scale-125 transition-transform"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {panel === 'highlight' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.12 }}
                className="overflow-hidden border-t border-border/60"
              >
                <div className="flex items-center gap-1 p-1.5">
                  <button
                    onMouseDown={(e) => { e.preventDefault(); onHighlight(''); setPanel(null) }}
                    className="h-5 w-5 rounded border border-border/80 flex items-center justify-center text-muted-foreground hover:bg-muted"
                    title="Supprimer"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  {HIGHLIGHT_COLORS.map(c => (
                    <button
                      key={c}
                      onMouseDown={(e) => { e.preventDefault(); onHighlight(c); setPanel(null) }}
                      className="h-5 w-5 rounded border border-black/10 hover:scale-125 transition-transform"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {panel === 'size' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.12 }}
                className="overflow-hidden border-t border-border/60"
              >
                <div className="flex items-center gap-0.5 p-1">
                  {SIZES.map(s => (
                    <button
                      key={s.value}
                      onMouseDown={(e) => { e.preventDefault(); onSize(s.value); setPanel(null) }}
                      className={cn(
                        'px-2.5 py-1 text-[11px] rounded-md transition-colors',
                        s.value === state.fontSize
                          ? 'bg-accent-soft text-accent'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      )}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {panel === 'font' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.12 }}
                className="overflow-hidden border-t border-border/60"
              >
                <div className="flex flex-col p-1">
                  {FONTS.map(f => (
                    <button
                      key={f.value}
                      onMouseDown={(e) => { e.preventDefault(); onFont(f.value); setPanel(null) }}
                      className={cn(
                        'flex items-center gap-2 px-2.5 py-1.5 text-[11px] rounded-md text-left transition-colors',
                        f.value === state.fontName || (f.value === 'inherit' && !state.fontName)
                          ? 'bg-accent-soft text-accent'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      )}
                      style={{ fontFamily: f.value === 'inherit' ? undefined : f.value }}
                    >
                      {(f.value === state.fontName || (f.value === 'inherit' && !state.fontName)) && (
                        <Check className="h-3 w-3 shrink-0" />
                      )}
                      {f.label}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {panel === 'link' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.12 }}
                className="overflow-hidden border-t border-border/60"
              >
                <div className="flex items-center gap-1 p-1.5">
                  <input
                    ref={linkInputRef}
                    type="url"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') { e.preventDefault(); handleLinkConfirm() }
                      if (e.key === 'Escape') { e.preventDefault(); handleLinkCancel() }
                    }}
                    placeholder="https://..."
                    className="flex-1 min-w-0 h-7 px-2 rounded-md bg-surface shadow-field text-xs text-foreground placeholder:text-muted-secondary focus:outline-none focus:ring-1 focus:ring-accent/40"
                  />
                  <button
                    onMouseDown={(e) => { e.preventDefault(); handleLinkConfirm() }}
                    className="flex items-center justify-center h-7 w-7 rounded-md text-emerald-400 hover:bg-emerald-500/15 transition-colors"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onMouseDown={(e) => { e.preventDefault(); handleLinkCancel() }}
                    className="flex items-center justify-center h-7 w-7 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}

/* ═══════════════════════════════════════════════════════════
   RichTextarea component
   ═══════════════════════════════════════════════════════════ */

interface RichTextareaProps {
  value: string
  onChange: (md: string) => void
  placeholder?: string
  className?: string
  style?: React.CSSProperties
  rows?: number
  singleLine?: boolean
}

export function RichTextarea({
  value,
  onChange,
  placeholder,
  className,
  style,
  rows = 2,
  singleLine = false,
}: RichTextareaProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const toolbarRef = useRef<HTMLDivElement>(null)
  const lastValueRef = useRef(value)
  const isComposingRef = useRef(false)
  const [toolbar, setToolbar] = useState<ToolbarState>({
    visible: false, x: 0, y: 0,
    bold: false, italic: false, underline: false, strikethrough: false,
    color: '', bgColor: '', inList: false, inHeading: false,
    fontSize: '3', fontName: '', inLink: false,
  })

  // Sync external value → editor HTML
  useEffect(() => {
    if (!editorRef.current) return
    const currentMd = htmlToMd(editorRef.current.innerHTML)
    const nv = (value || '').replace(/\n+$/, '')
    const nc = currentMd.replace(/\n+$/, '')
    if (nv !== nc) {
      editorRef.current.innerHTML = mdToHtml(value)
      lastValueRef.current = value
    }
  }, [value])

  const emitChange = useCallback(() => {
    if (!editorRef.current || isComposingRef.current) return
    const md = htmlToMd(editorRef.current.innerHTML)
    if (md !== lastValueRef.current) {
      lastValueRef.current = md
      onChange(md)
    }
  }, [onChange])

  const updateToolbar = useCallback(() => {
    const sel = window.getSelection()
    if (!sel || sel.isCollapsed || !editorRef.current?.contains(sel.anchorNode)) {
      setToolbar(prev => prev.visible ? { ...prev, visible: false } : prev)
      return
    }
    const range = sel.getRangeAt(0)
    const rect = range.getBoundingClientRect()
    if (rect.width === 0) {
      setToolbar(prev => prev.visible ? { ...prev, visible: false } : prev)
      return
    }

    // Position above selection
    const tw = singleLine ? 380 : 430
    const x = Math.max(8, Math.min(rect.left + rect.width / 2 - tw / 2, window.innerWidth - tw - 8))
    const y = rect.top + window.scrollY - 44

    let fmtBlock = ''
    try { fmtBlock = document.queryCommandValue('formatBlock') } catch {}

    // Check if selection is inside a link
    let inLink = false
    if (sel.anchorNode) {
      let node: Node | null = sel.anchorNode
      while (node && node !== editorRef.current) {
        if ((node as Element).tagName === 'A') { inLink = true; break }
        node = node.parentNode
      }
    }

    // Get font size
    let fontSize = '3'
    try {
      const fv = document.queryCommandValue('fontSize')
      if (fv) fontSize = fv
    } catch {}

    // Get font name
    let fontName = ''
    try {
      const fn = document.queryCommandValue('fontName')
      if (fn) fontName = fn.replace(/['"]/g, '').split(',')[0].trim()
    } catch {}

    setToolbar({
      visible: true, x, y,
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
      strikethrough: document.queryCommandState('strikeThrough'),
      color: normalizeColor(document.queryCommandValue('foreColor') || ''),
      bgColor: normalizeColor(document.queryCommandValue('hiliteColor') || ''),
      inList: document.queryCommandState('insertUnorderedList'),
      inHeading: /^h[1-6]$/i.test(fmtBlock),
      fontSize,
      fontName,
      inLink,
    })
  }, [singleLine])

  useEffect(() => {
    const handler = () => {
      if (editorRef.current?.contains(document.activeElement) || editorRef.current === document.activeElement) {
        updateToolbar()
      }
    }
    document.addEventListener('selectionchange', handler)
    return () => document.removeEventListener('selectionchange', handler)
  }, [updateToolbar])

  const handleBlur = useCallback(() => {
    setTimeout(() => {
      const active = document.activeElement
      if (
        !editorRef.current?.contains(active) &&
        !toolbarRef.current?.contains(active)
      ) {
        setToolbar(prev => prev.visible ? { ...prev, visible: false } : prev)
      }
    }, 200)
  }, [])

  const handleFormat = useCallback((cmd: 'bold' | 'italic' | 'underline' | 'strikeThrough') => {
    editorRef.current?.focus()
    document.execCommand(cmd, false)
    emitChange()
    setTimeout(updateToolbar, 10)
  }, [emitChange, updateToolbar])

  const handleColor = useCallback((color: string) => {
    editorRef.current?.focus()
    if (color) {
      document.execCommand('foreColor', false, color)
    } else {
      document.execCommand('removeFormat', false)
    }
    emitChange()
    setTimeout(updateToolbar, 10)
  }, [emitChange, updateToolbar])

  const handleHighlight = useCallback((color: string) => {
    editorRef.current?.focus()
    if (color) {
      document.execCommand('hiliteColor', false, color)
    } else {
      document.execCommand('hiliteColor', false, 'transparent')
    }
    emitChange()
    setTimeout(updateToolbar, 10)
  }, [emitChange, updateToolbar])

  const handleSize = useCallback((size: string) => {
    editorRef.current?.focus()
    document.execCommand('fontSize', false, size)
    emitChange()
    setTimeout(updateToolbar, 10)
  }, [emitChange, updateToolbar])

  const handleFont = useCallback((font: string) => {
    editorRef.current?.focus()
    document.execCommand('fontName', false, font)
    emitChange()
    setTimeout(updateToolbar, 10)
  }, [emitChange, updateToolbar])

  const handleLink = useCallback((url: string) => {
    editorRef.current?.focus()
    document.execCommand('createLink', false, url)
    emitChange()
    setTimeout(updateToolbar, 10)
  }, [emitChange, updateToolbar])

  const handleUnlink = useCallback(() => {
    editorRef.current?.focus()
    document.execCommand('unlink', false)
    emitChange()
    setTimeout(updateToolbar, 10)
  }, [emitChange, updateToolbar])

  const handleList = useCallback(() => {
    editorRef.current?.focus()
    document.execCommand('insertUnorderedList', false)
    emitChange()
    setTimeout(updateToolbar, 10)
  }, [emitChange, updateToolbar])

  const handleHeading = useCallback(() => {
    editorRef.current?.focus()
    let fmtBlock = ''
    try { fmtBlock = document.queryCommandValue('formatBlock') } catch {}
    document.execCommand('formatBlock', false, /^h[1-6]$/i.test(fmtBlock) ? 'DIV' : 'H2')
    emitChange()
    setTimeout(updateToolbar, 10)
  }, [emitChange, updateToolbar])

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault()
    const text = e.clipboardData.getData('text/plain')
    document.execCommand('insertText', false, singleLine ? text.replace(/[\n\r]/g, ' ') : text)
    emitChange()
  }, [emitChange, singleLine])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (singleLine && e.key === 'Enter') e.preventDefault()
  }, [singleLine])

  const pretextHeight = (() => {
    if (singleLine || !value) return 0
    try {
      const font = resolveFont()
      const result = measureTextBlock(value, font, 'base', 1.6, 600)
      return result.height
    } catch { return 0 }
  })()

  const minHeight = singleLine
    ? undefined
    : `${Math.max(rows * 20, pretextHeight || 24, 24)}px`

  return (
    <div className="relative">
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={emitChange}
        onBlur={handleBlur}
        onPaste={handlePaste}
        onMouseUp={updateToolbar}
        onKeyUp={updateToolbar}
        onKeyDown={handleKeyDown}
        onCompositionStart={() => { isComposingRef.current = true }}
        onCompositionEnd={() => { isComposingRef.current = false; emitChange() }}
        data-placeholder={placeholder}
        className={cn(
          'w-full bg-transparent focus:outline-none',
          '[&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-[inherit] [&:empty]:before:opacity-40 [&:empty]:before:pointer-events-none',
          className
        )}
        style={{
          minHeight,
          whiteSpace: singleLine ? 'nowrap' : 'pre-wrap',
          wordBreak: 'break-word',
          overflow: singleLine ? 'hidden' : undefined,
          ...style,
        }}
      />
      <FloatingToolbar
        state={toolbar}
        singleLine={singleLine}
        containerRef={toolbarRef}
        onFormat={handleFormat}
        onColor={handleColor}
        onHighlight={handleHighlight}
        onSize={handleSize}
        onFont={handleFont}
        onLink={handleLink}
        onUnlink={handleUnlink}
        onList={handleList}
        onHeading={handleHeading}
      />
    </div>
  )
}
