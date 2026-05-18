'use client'

import { useMemo, useState, type ReactNode } from 'react'
import { Check, Copy } from 'lucide-react'

interface CodeBlockProps {
  children: string
  lang?: string
  filename?: string
}

export function CodeBlock({ children, lang = 'text', filename }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const tokens = useMemo<ReactNode>(() => {
    if (lang === 'json') return highlightJson(children)
    if (lang === 'bash' || lang === 'shell' || lang === 'sh' || lang === 'curl') {
      return highlightBash(children)
    }
    return children
  }, [children, lang])

  async function copy() {
    try {
      await navigator.clipboard.writeText(children)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
    }
  }

  const langLabel = lang === 'curl' ? 'cURL' : lang.toUpperCase()
  const showHeader = Boolean(filename) || lang !== 'text'

  return (
    <div className="group mt-4 overflow-hidden rounded-xl border border-zinc-800/60 bg-[#0d0d12] shadow-sm dark:border-zinc-800/80">
      {showHeader && (
        <div className="flex items-center justify-between border-b border-zinc-800/60 bg-[#0a0a10] px-4 py-2">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            {filename ? (
              <span className="font-mono text-zinc-300">{filename}</span>
            ) : (
              <span className="font-mono uppercase tracking-wider text-zinc-500">{langLabel}</span>
            )}
          </div>
          <button
            type="button"
            onClick={copy}
            className="inline-flex items-center gap-1 rounded-md border border-zinc-800/80 bg-zinc-900/60 px-2 py-1 text-[11px] font-medium text-zinc-300 transition-colors hover:border-zinc-700 hover:bg-zinc-800 hover:text-white"
            aria-label="Copier"
          >
            {copied ? (
              <>
                <Check className="size-3 text-emerald-400" />
                <span>Copié</span>
              </>
            ) : (
              <>
                <Copy className="size-3" />
                <span>Copier</span>
              </>
            )}
          </button>
        </div>
      )}
      <pre className="overflow-x-auto px-4 py-4 text-[13px] leading-[1.65] text-zinc-100">
        <code>{tokens}</code>
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
