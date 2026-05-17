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
  GET: 'bg-success/15 text-success',
  POST: 'bg-accent-soft text-accent-soft-foreground',
  PATCH: 'bg-warning/15 text-warning',
  PUT: 'bg-warning/15 text-warning',
  DELETE: 'bg-danger/15 text-danger',
}

export function EndpointBlock({ method, path, scope, description, example, children }: Props) {
  return (
    <section
      id={`${method.toLowerCase()}-${path}`.replace(/[^a-z0-9]+/g, '-')}
      className="mt-8 scroll-mt-24 overflow-hidden rounded-xl border border-border bg-background"
    >
      <header className="flex flex-wrap items-center gap-2 border-b border-separator bg-surface px-4 py-3">
        <span
          className={`rounded-md px-2 py-0.5 font-mono text-[11px] font-semibold ${METHOD_TONES[method]}`}
        >
          {method}
        </span>
        <code className="flex-1 font-mono text-sm text-foreground">{path}</code>
        {scope && (
          <span className="rounded-md border border-border bg-background px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
            {scope}
          </span>
        )}
      </header>
      <div className="px-4 py-3 text-[13.5px] leading-relaxed text-muted-foreground">
        {description}
      </div>
      {(example || children) && (
        <div className="border-t border-separator bg-code-bg">
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
