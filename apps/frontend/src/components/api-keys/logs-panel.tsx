'use client'

import { useEffect, useState } from 'react'
import { RefreshCw } from '@/components/ui/icons'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { useToast } from '@/components/ui/toast'
import { apiKeysClient, type ApiKeyShape, type RequestLogShape } from '@/lib/api-keys-client'

const BUCKETS = ['all', '2xx', '4xx', '5xx'] as const

function statusColor(s: number): string {
  if (s < 300) return 'text-success'
  if (s < 400) return 'text-accent'
  if (s < 500) return 'text-warning'
  return 'text-danger'
}

export function LogsPanel({ apiKey }: { apiKey: ApiKeyShape }) {
  const { toast } = useToast()
  const [items, setItems] = useState<RequestLogShape[] | null>(null)
  const [bucket, setBucket] = useState<(typeof BUCKETS)[number]>('all')

  async function load() {
    setItems(null)
    const res = await apiKeysClient.logs(apiKey.id, {
      status_bucket: bucket === 'all' ? undefined : (bucket as '2xx' | '4xx' | '5xx'),
      limit: 200,
    })
    if (res.error) {
      toast(res.error, 'error')
      setItems([])
      return
    }
    setItems(res.data?.data ?? [])
  }

  useEffect(() => {
    load()
  }, [bucket, apiKey.id])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          {BUCKETS.map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => setBucket(b)}
              className={`rounded-md px-3 py-1.5 text-xs uppercase transition-colors ${
                bucket === b
                  ? 'bg-accent-soft text-foreground'
                  : 'text-muted-foreground hover:bg-surface-hover'
              }`}
            >
              {b === 'all' ? 'Tous' : b}
            </button>
          ))}
        </div>
        <Button variant="ghost" size="sm" onClick={load}>
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
          Actualiser
        </Button>
      </div>

      <Card className="border-border/50">
        <CardContent className="p-0">
          {items === null ? (
            <div className="flex justify-center py-12">
              <Spinner />
            </div>
          ) : items.length === 0 ? (
            <p className="px-5 py-12 text-center text-sm text-muted-foreground">
              Aucune requête sur les 30 derniers jours.
            </p>
          ) : (
            <div className="divide-y divide-border/50">
              {items.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-surface-hover transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-foreground">
                        {log.method}
                      </span>
                      <code className="truncate font-mono text-xs text-foreground">
                        {log.path}
                      </code>
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{new Date(log.created_at).toLocaleString()}</span>
                      <span aria-hidden>•</span>
                      <span className="font-mono">{log.ip}</span>
                      {log.error_code && (
                        <>
                          <span aria-hidden>•</span>
                          <code>{log.error_code}</code>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className={`font-mono text-sm font-medium ${statusColor(log.status)}`}>
                      {log.status}
                    </span>
                    <span className="text-xs text-muted-foreground">{log.latency_ms}ms</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
