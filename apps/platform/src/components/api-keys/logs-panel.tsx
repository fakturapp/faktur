'use client'

import { useEffect, useState } from 'react'
import { Copy, Check, RefreshCw, X } from 'lucide-react'
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
  const [selected, setSelected] = useState<RequestLogShape | null>(null)

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

      <div className="grid gap-4 lg:grid-cols-[1fr,minmax(0,360px)]">
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
                {items.map((log) => {
                  const active = selected?.id === log.id
                  return (
                    <button
                      key={log.id}
                      type="button"
                      onClick={() => setSelected(log)}
                      className={`w-full flex items-center justify-between gap-3 px-5 py-3 text-left transition-colors ${
                        active ? 'bg-accent-soft/50' : 'hover:bg-surface-hover'
                      }`}
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
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <span
                          className={`font-mono text-sm font-medium ${statusColor(log.status)}`}
                        >
                          {log.status}
                        </span>
                        <span className="text-xs text-muted-foreground">{log.latency_ms}ms</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <LogDetail log={selected} onClose={() => setSelected(null)} />
      </div>
    </div>
  )
}

function LogDetail({
  log,
  onClose,
}: {
  log: RequestLogShape | null
  onClose: () => void
}) {
  const { toast } = useToast()
  const [copied, setCopied] = useState(false)

  async function copyId() {
    if (!log) return
    try {
      await navigator.clipboard.writeText(log.request_id)
      setCopied(true)
      toast('Request ID copié', 'success')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast('Impossible de copier', 'error')
    }
  }

  if (!log) {
    return (
      <Card className="border-border/50 hidden lg:block">
        <CardContent className="p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Cliquez sur une ligne pour voir le détail.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border/50">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-foreground">Détails de la requête</h3>
          <button
            type="button"
            onClick={onClose}
            className="-m-1 p-1 text-muted-foreground hover:text-foreground"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <DetailRow label="Méthode">
          <code className="font-mono text-sm font-semibold text-foreground">{log.method}</code>
        </DetailRow>
        <DetailRow label="Chemin">
          <code className="font-mono text-sm break-all text-foreground">{log.path}</code>
        </DetailRow>
        <DetailRow label="Statut">
          <span className={`font-mono text-sm font-semibold ${statusColor(log.status)}`}>
            {log.status}
          </span>
        </DetailRow>
        <DetailRow label="Latence">
          <span className="text-sm text-foreground">{log.latency_ms} ms</span>
        </DetailRow>
        <DetailRow label="IP cliente">
          <code className="font-mono text-sm text-foreground">{log.ip}</code>
        </DetailRow>
        <DetailRow label="Horodatage">
          <span className="text-sm text-foreground">
            {new Date(log.created_at).toLocaleString()}
          </span>
        </DetailRow>
        {log.error_code && (
          <DetailRow label="Code d’erreur">
            <code className="font-mono text-sm text-danger">{log.error_code}</code>
          </DetailRow>
        )}
        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Request ID
          </p>
          <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-surface p-2">
            <code className="flex-1 truncate font-mono text-xs text-foreground select-all">
              {log.request_id}
            </code>
            <Button variant="outline" size="sm" onClick={copyId}>
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            </Button>
          </div>
          <p className="mt-1.5 text-[11px] text-muted-foreground">
            Communique ce request_id au support pour qu&apos;on retrouve la trace exacte.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      {children}
    </div>
  )
}
