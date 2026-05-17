'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn } from '@/lib/utils'
import { measureTextBlock, resolveFont, type FontSizeKey } from '@/lib/pretext'

interface MarkdownRendererProps {
  content: string
  className?: string
  compact?: boolean
}

export function estimateMarkdownHeight(
  content: string,
  options: {
    font?: string
    fontSize?: number | FontSizeKey
    maxWidth?: number
    lineHeight?: number
  } = {},
): number {
  const { font = 'Lexend', fontSize = 'base', maxWidth = 600, lineHeight = 1.5 } = options
  if (!content) return 0
  const resolvedFont = resolveFont(font)
  const result = measureTextBlock(content, resolvedFont, fontSize, lineHeight, maxWidth)
  return result.height
}

export function MarkdownRenderer({ content, className, compact = false }: MarkdownRendererProps) {
  return (
    <div className={cn('markdown-chat', compact && 'markdown-compact', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-sm font-bold text-foreground mb-2 mt-3 first:mt-0 border-b border-border/40 pb-1">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xs font-bold text-foreground mb-1.5 mt-2.5 first:mt-0">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-xs font-semibold text-foreground mb-1 mt-2 first:mt-0">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="text-xs leading-relaxed mb-1.5 last:mb-0">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-inside space-y-0.5 mb-1.5 text-xs">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside space-y-0.5 mb-1.5 text-xs">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="text-xs leading-relaxed">{children}</li>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic text-muted-foreground">{children}</em>
          ),
          code: ({ className: codeClassName, children, ...props }) => {
            const isInline = !codeClassName
            if (isInline) {
              return (
                <code className="px-1 py-0.5 rounded bg-surface text-[10px] font-mono text-foreground">
                  {children}
                </code>
              )
            }
            return (
              <code className={cn('block rounded-lg bg-surface p-2 text-[10px] font-mono overflow-x-auto my-1.5', codeClassName)} {...props}>
                {children}
              </code>
            )
          },
          pre: ({ children }) => (
            <pre className="rounded-lg bg-surface p-2 overflow-x-auto my-1.5 text-[10px]">
              {children}
            </pre>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-accent/40 pl-2 my-1.5 text-xs text-muted-foreground italic">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-1.5">
              <table className="w-full text-[10px] border-collapse">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-surface border-b border-border/60">{children}</thead>
          ),
          th: ({ children }) => (
            <th className="px-2 py-1 text-left font-semibold text-foreground">{children}</th>
          ),
          td: ({ children }) => (
            <td className="px-2 py-1 border-t border-border/30">{children}</td>
          ),
          hr: () => <hr className="my-2 border-border/40" />,
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" className="text-accent underline underline-offset-2 hover:text-accent/80">
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

interface ComplianceBadgeProps {
  type: 'success' | 'warning' | 'error' | 'info'
  children: React.ReactNode
}

export function ComplianceBadge({ type, children }: ComplianceBadgeProps) {
  const colors = {
    success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    error: 'bg-red-500/10 text-red-400 border-red-500/20',
    info: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  }

  return (
    <span className={cn('inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[10px] font-medium', colors[type])}>
      {children}
    </span>
  )
}

interface ModificationBlockProps {
  content: string
  onAccept?: () => void
  onRevert?: () => void
  accepted?: boolean
  reverted?: boolean
}

export function ModificationBlock({ content, onAccept, onRevert, accepted, reverted }: ModificationBlockProps) {
  if (reverted) {
    return (
      <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 my-1.5">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-[10px] font-medium text-red-400">Annulé</span>
        </div>
        <div className="text-xs line-through text-muted-foreground/60">
          <MarkdownRenderer content={content} compact />
        </div>
      </div>
    )
  }

  if (accepted) {
    return (
      <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 my-1.5">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-[10px] font-medium text-emerald-400">Accepté</span>
        </div>
        <div className="text-xs text-foreground">
          <MarkdownRenderer content={content} compact />
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 px-3 py-2 my-1.5">
      <div className="text-xs text-foreground">
        <MarkdownRenderer content={content} compact />
      </div>
      <div className="flex items-center gap-2 mt-2 pt-1.5 border-t border-blue-500/20">
        <button
          onClick={onAccept}
          className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
        >
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Accepter
        </button>
        <button
          onClick={onRevert}
          className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
        >
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
          Annuler
        </button>
      </div>
    </div>
  )
}
