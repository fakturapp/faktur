import React from 'react'

interface Props {
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  path: string
  scope?: string
  description: string
  example?: string
  children?: React.ReactNode
}

const METHOD_TONES: Record<Props['method'], string> = {
  GET: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  POST: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
  PATCH: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  PUT: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  DELETE: 'bg-rose-500/15 text-rose-600 dark:text-rose-400',
}

export function EndpointBlock({ method, path, scope, description, example, children }: Props) {
  return (
    <section
      id={`${method.toLowerCase()}-${path}`.replace(/[^a-z0-9]+/g, '-')}
      className="mt-8 scroll-mt-24 rounded-xl border border-(--border) bg-(--background)"
    >
      <header className="flex flex-wrap items-center gap-2 border-b border-(--border) px-4 py-3">
        <span
          className={`rounded-md px-2 py-0.5 font-mono text-xs font-semibold ${METHOD_TONES[method]}`}
        >
          {method}
        </span>
        <code className="flex-1 font-mono text-sm">{path}</code>
        {scope && (
          <span className="rounded-md border border-(--border) bg-(--muted) px-2 py-0.5 font-mono text-[11px] text-(--muted-foreground)">
            {scope}
          </span>
        )}
      </header>
      <div className="px-4 py-3 text-sm text-(--muted-foreground)">{description}</div>
      {(example || children) && (
        <div className="border-t border-(--border) bg-(--code-bg)">
          {example && (
            <pre className="overflow-x-auto p-4 text-xs leading-relaxed">
              <code>{example}</code>
            </pre>
          )}
          {children}
        </div>
      )}
    </section>
  )
}
