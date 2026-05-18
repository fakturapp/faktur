'use client'

import { useMemo, useState, type ReactNode } from 'react'
import { Check, Copy } from 'lucide-react'
import { cn } from '@/lib/cn'

interface Props {
  language?: string
  filename?: string
  children: ReactNode
  className?: string
  
  noChrome?: boolean
}

export function CodeWindow({ language, filename, children, className, noChrome }: Props) {
  const [copied, setCopied] = useState(false)
  const lang = (language ?? filename ?? '').toLowerCase()

  const rawText = typeof children === 'string' ? children : null

  const content = useMemo<ReactNode>(() => {
    if (rawText === null) return children
    if (lang.includes('json')) return highlight(rawText, 'json')
    if (lang.includes('bash') || lang.includes('curl') || lang.includes('sh')) {
      return highlight(rawText, 'bash')
    }
    if (lang.includes('ts') || lang.includes('js') || lang.includes('node')) {
      return highlight(rawText, 'ts')
    }
    return rawText
  }, [children, rawText, lang])

  async function copy() {
    if (rawText === null) return
    try {
      await navigator.clipboard.writeText(rawText)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
    }
  }

  return (
    <div
      className={cn(
        'group overflow-hidden rounded-xl border border-zinc-800/60 bg-[#0d0d12] shadow-sm',
        className
      )}
    >
      <div className="flex items-center justify-between border-b border-zinc-800/60 bg-[#0a0a10] px-3 py-2">
        <div className="flex w-16 items-center gap-1.5">
          {!noChrome && (
            <>
              <span className="size-2.5 rounded-full bg-[#ff5f57]" />
              <span className="size-2.5 rounded-full bg-[#febc2e]" />
              <span className="size-2.5 rounded-full bg-[#28c840]" />
            </>
          )}
        </div>
        <div className="text-[11px] font-medium text-zinc-400">{filename ?? language ?? ''}</div>
        {rawText !== null ? (
          <button
            type="button"
            onClick={copy}
            className="inline-flex w-16 items-center justify-end gap-1 text-[11px] font-medium text-zinc-400 transition-colors hover:text-white"
            aria-label="Copier"
          >
            {copied ? (
              <>
                <Check className="size-3 text-emerald-400" />
                Copié
              </>
            ) : (
              <>
                <Copy className="size-3" />
                Copier
              </>
            )}
          </button>
        ) : (
          <div className="w-16" />
        )}
      </div>
      <pre className="overflow-x-auto px-4 py-4 text-[13px] leading-[1.65] text-zinc-100">
        <code>{content}</code>
      </pre>
    </div>
  )
}

const C = {
  key: 'text-violet-300',
  string: 'text-emerald-300',
  number: 'text-amber-300',
  bool: 'text-pink-300',
  null: 'text-zinc-400',
  punct: 'text-zinc-500',
  comment: 'text-zinc-500 italic',
  command: 'text-pink-300 font-semibold',
  flag: 'text-violet-300',
  url: 'text-sky-300',
  variable: 'text-amber-300',
  keyword: 'text-pink-300',
  builtin: 'text-sky-300',
}

function highlight(src: string, kind: 'json' | 'bash' | 'ts'): ReactNode {
  if (kind === 'json') return highlightJson(src)
  if (kind === 'bash') return highlightBash(src)
  return highlightTs(src)
}

function highlightJson(src: string): ReactNode {
  const tokens: { value: string; cls?: string }[] = []
  const re =
    /"(?:[^"\\]|\\.)*"\s*:|"(?:[^"\\]|\\.)*"|\b(?:true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|[{}\[\],:]|\/\/.*|\s+/g

  let last = 0
  for (const match of src.matchAll(re)) {
    const i = match.index ?? 0
    if (i > last) tokens.push({ value: src.slice(last, i) })
    const raw = match[0]
    let cls: string | undefined
    if (/^"(?:[^"\\]|\\.)*"\s*:$/.test(raw)) cls = C.key
    else if (raw.startsWith('"')) cls = C.string
    else if (raw === 'true' || raw === 'false') cls = C.bool
    else if (raw === 'null') cls = C.null
    else if (/^-?\d/.test(raw)) cls = C.number
    else if (/^[{}\[\],:]$/.test(raw)) cls = C.punct
    else if (raw.startsWith('//')) cls = C.comment
    tokens.push({ value: raw, cls })
    last = i + raw.length
  }
  if (last < src.length) tokens.push({ value: src.slice(last) })

  return tokens.map((t, idx) =>
    t.cls ? (
      <span key={idx} className={t.cls}>
        {t.value}
      </span>
    ) : (
      <span key={idx}>{t.value}</span>
    )
  )
}

function highlightBash(src: string): ReactNode {
  const lines = src.split('\n')
  return lines.map((line, lineIdx) => {
    const parts: { value: string; cls?: string }[] = []
    const re =
      /^(\s*)(curl|wget|http)\b|(\s)(-[A-Za-z]+|--[A-Za-z][\w-]+)\b|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|\bhttps?:\/\/[^\s"']+|\$\{?[A-Z_][A-Z0-9_]*\}?|#.*$|\\\s*$|\s+|[^\s]+/gm

    let last = 0
    for (const match of line.matchAll(re)) {
      const i = match.index ?? 0
      if (i > last) parts.push({ value: line.slice(last, i) })
      const raw = match[0]
      let cls: string | undefined
      if (/^\s*(curl|wget|http)\b/.test(raw)) cls = C.command
      else if (/^\s(-[A-Za-z]+|--[A-Za-z][\w-]+)$/.test(raw)) cls = C.flag
      else if (raw.startsWith('"') || raw.startsWith("'")) cls = C.string
      else if (raw.startsWith('http')) cls = C.url
      else if (raw.startsWith('$')) cls = C.variable
      else if (raw.startsWith('#')) cls = C.comment
      else if (raw === '\\' || raw.endsWith('\\')) cls = C.punct
      parts.push({ value: raw, cls })
      last = i + raw.length
    }
    if (last < line.length) parts.push({ value: line.slice(last) })

    return (
      <span key={lineIdx}>
        {parts.map((p, idx) =>
          p.cls ? (
            <span key={idx} className={p.cls}>
              {p.value}
            </span>
          ) : (
            <span key={idx}>{p.value}</span>
          )
        )}
        {lineIdx < lines.length - 1 && '\n'}
      </span>
    )
  })
}

const TS_KEYWORDS = new Set([
  'const',
  'let',
  'var',
  'function',
  'return',
  'if',
  'else',
  'for',
  'while',
  'await',
  'async',
  'import',
  'from',
  'export',
  'default',
  'class',
  'new',
  'typeof',
  'true',
  'false',
  'null',
  'undefined',
  'as',
  'interface',
  'type',
])

function highlightTs(src: string): ReactNode {
  const tokens: { value: string; cls?: string }[] = []
  const re =
    /\/\/[^\n]*|`(?:[^`\\]|\\.)*`|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|\b\d+(?:\.\d+)?\b|\b[A-Za-z_$][\w$]*\b|\s+|[{}();,.\[\]:=+\-*/<>!?&|]+/g

  let last = 0
  for (const match of src.matchAll(re)) {
    const i = match.index ?? 0
    if (i > last) tokens.push({ value: src.slice(last, i) })
    const raw = match[0]
    let cls: string | undefined
    if (raw.startsWith('//')) cls = C.comment
    else if (raw.startsWith('`') || raw.startsWith('"') || raw.startsWith("'")) cls = C.string
    else if (/^\d/.test(raw)) cls = C.number
    else if (TS_KEYWORDS.has(raw)) cls = C.keyword
    else if (raw === 'console' || raw === 'process' || raw === 'fetch' || raw === 'JSON') {
      cls = C.builtin
    }
    tokens.push({ value: raw, cls })
    last = i + raw.length
  }
  if (last < src.length) tokens.push({ value: src.slice(last) })

  return tokens.map((t, idx) =>
    t.cls ? (
      <span key={idx} className={t.cls}>
        {t.value}
      </span>
    ) : (
      <span key={idx}>{t.value}</span>
    )
  )
}
