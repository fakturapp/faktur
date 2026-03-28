'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, Check, AlertTriangle, Bug, Globe } from 'lucide-react'

interface ErrorRowProps {
  id: string
  errorType: string
  errorMessage: string
  errorMessageFull?: string
  stackTrace?: string
  pagePath: string
  browser: string
  os: string
  occurrenceCount: number
  isResolved: boolean
  timestamp: string
  onResolve: (id: string) => void
}

const typeIcons: Record<string, React.ReactNode> = {
  js_error: <Bug className="h-4 w-4 text-red-500" />,
  unhandled_rejection: <AlertTriangle className="h-4 w-4 text-orange-500" />,
  api_error: <Globe className="h-4 w-4 text-yellow-500" />,
}

export function ErrorRow({
  id,
  errorType,
  errorMessage,
  errorMessageFull,
  stackTrace,
  pagePath,
  browser,
  os,
  occurrenceCount,
  isResolved,
  timestamp,
  onResolve,
}: ErrorRowProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className={cn('rounded-lg border border-border bg-card', isResolved && 'opacity-60')}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-3 p-3 text-left"
      >
        <motion.div animate={{ rotate: expanded ? 90 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
        </motion.div>
        {typeIcons[errorType] || <Bug className="h-4 w-4 text-muted-foreground" />}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{errorMessage}</p>
          <p className="text-xs text-muted-foreground">
            {pagePath} · {browser} / {os}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-sm font-semibold text-foreground">{occurrenceCount}x</span>
          <span className="text-xs text-muted-foreground">
            {new Date(timestamp).toLocaleDateString('fr-FR')}
          </span>
          {isResolved ? (
            <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-500">
              <Check className="h-3 w-3" /> Résolu
            </span>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onResolve(id)
              }}
              className="rounded-lg border border-border bg-muted/50 px-2 py-1 text-xs font-medium text-foreground hover:bg-muted transition-colors"
            >
              Résoudre
            </button>
          )}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-border p-3 space-y-2">
              {errorMessageFull && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Message complet</p>
                  <p className="text-sm text-foreground bg-muted/30 rounded-md p-2 font-mono text-xs break-all">
                    {errorMessageFull}
                  </p>
                </div>
              )}
              {stackTrace && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Stack trace</p>
                  <pre className="text-xs text-foreground bg-muted/30 rounded-md p-2 font-mono overflow-x-auto max-h-48 overflow-y-auto whitespace-pre-wrap break-all">
                    {stackTrace}
                  </pre>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
