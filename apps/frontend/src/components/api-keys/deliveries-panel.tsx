'use client'

import { useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { useToast } from '@/components/ui/toast'
import { apiKeysClient, type ApiKeyShape, type DeliveryShape } from '@/lib/api-keys-client'

const STATUS_FILTERS = ['all', 'pending', 'delivered', 'failed', 'failed_permanent'] as const

const STATUS_LABELS: Record<(typeof STATUS_FILTERS)[number], string> = {
  all: 'Toutes',
  pending: 'En attente',
  delivered: 'Livrées',
  failed: 'Échec',
  failed_permanent: 'Abandonnées',
}

function statusBadge(status: DeliveryShape['status']) {
  switch (status) {
    case 'delivered':
      return { variant: 'success' as const, label: 'Livrée' }
    case 'failed_permanent':
      return { variant: 'destructive' as const, label: 'Abandonnée' }
    case 'failed':
      return { variant: 'destructive' as const, label: 'Échec' }
    case 'in_flight':
      return { variant: 'warning' as const, label: 'En cours' }
    default:
      return { variant: 'muted' as const, label: 'En attente' }
  }
}

export function DeliveriesPanel({ apiKey }: { apiKey: ApiKeyShape }) {
  const { toast } = useToast()
  const [items, setItems] = useState<DeliveryShape[] | null>(null)
  const [filter, setFilter] = useState<(typeof STATUS_FILTERS)[number]>('all')
  const [retrying, setRetrying] = useState<string | null>(null)

  async function load() {
    setItems(null)
    const res = await apiKeysClient.deliveries(apiKey.id, {
      status: filter === 'all' ? undefined : filter,
      limit: 100,
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
  }, [filter, apiKey.id])

  async function handleRetry(id: string) {
    setRetrying(id)
    const res = await apiKeysClient.retryDelivery(apiKey.id, id)
    setRetrying(null)
    if (res.error || !res.data) {
      toast(res.error || 'Échec du retry', 'error')
      return
    }
    toast(
      res.data.delivered
        ? 'Livrée'
        : `Échec : ${res.data.error ?? `HTTP ${res.data.status_code ?? '?'}`}`,
      res.data.delivered ? 'success' : 'error'
    )
    load()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setFilter(s)}
              className={`rounded-md px-3 py-1.5 text-xs transition-colors ${
                filter === s
                  ? 'bg-accent-soft text-foreground'
                  : 'text-muted-foreground hover:bg-surface-hover'
              }`}
            >
              {STATUS_LABELS[s]}
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
              Aucune livraison à afficher.
            </p>
          ) : (
            <div className="divide-y divide-border/50">
              {items.map((d) => {
                const b = statusBadge(d.status)
                const isRetrying = retrying === d.id
                return (
                  <div
                    key={d.id}
                    className="flex items-center justify-between gap-3 px-5 py-4 hover:bg-surface-hover transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <code className="font-mono text-sm text-foreground">{d.event_type}</code>
                        <Badge variant={b.variant} size="sm">
                          {b.label}
                        </Badge>
                        {d.last_status_code && (
                          <span className="font-mono text-xs text-muted-foreground">
                            HTTP {d.last_status_code}
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span>
                          Tentative {d.attempt_count} sur 8
                        </span>
                        <span aria-hidden>•</span>
                        <span>{new Date(d.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRetry(d.id)}
                      disabled={isRetrying}
                    >
                      {isRetrying ? (
                        <>
                          <Spinner />
                          ...
                        </>
                      ) : (
                        'Rejouer'
                      )}
                    </Button>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
