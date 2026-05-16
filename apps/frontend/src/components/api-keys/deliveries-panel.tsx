'use client'

import { useEffect, useState } from 'react'
import { RefreshCw, Filter } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/toast'
import { apiKeysClient, type ApiKeyShape, type DeliveryShape } from '@/lib/api-keys-client'

const STATUS_FILTERS = ['all', 'pending', 'delivered', 'failed', 'failed_permanent'] as const

export function DeliveriesPanel({ apiKey }: { apiKey: ApiKeyShape }) {
  const { toast } = useToast()
  const [items, setItems] = useState<DeliveryShape[] | null>(null)
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]>('all')

  async function load() {
    setItems(null)
    const res = await apiKeysClient.deliveries(apiKey.id, {
      status: statusFilter === 'all' ? undefined : statusFilter,
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
  }, [statusFilter, apiKey.id])

  async function handleRetry(id: string) {
    const res = await apiKeysClient.retryDelivery(apiKey.id, id)
    if (res.error || !res.data) {
      toast(res.error || 'Retry failed', 'error')
      return
    }
    toast(
      res.data.delivered ? 'Redelivered successfully' : `Failed: ${res.data.error ?? res.data.status_code}`,
      res.data.delivered ? 'success' : 'error'
    )
    load()
  }

  function statusBadge(status: DeliveryShape['status']) {
    if (status === 'delivered') return { v: 'success' as const, label: 'Delivered' }
    if (status === 'failed_permanent') return { v: 'destructive' as const, label: 'Failed permanent' }
    if (status === 'failed') return { v: 'destructive' as const, label: 'Failed' }
    if (status === 'in_flight') return { v: 'warning' as const, label: 'In flight' }
    return { v: 'default' as const, label: 'Pending' }
  }

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Filter className="size-3.5 text-muted-foreground" />
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-md px-2.5 py-1 text-xs capitalize transition-colors ${
                statusFilter === s
                  ? 'bg-violet-500/15 text-foreground'
                  : 'text-muted-foreground hover:bg-muted/50'
              }`}
            >
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>
        <Button
          size="sm"
          variant="ghost"
          onPress={load}
          startContent={<RefreshCw className="size-3.5" />}
        >
          Refresh
        </Button>
      </div>

      <div className="mt-4 overflow-x-auto">
        {items === null ? (
          <div className="flex items-center justify-center py-10">
            <Spinner />
          </div>
        ) : items.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">No deliveries yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="py-2 pr-3">Event</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3">HTTP</th>
                <th className="py-2 pr-3">Attempts</th>
                <th className="py-2 pr-3">Created</th>
                <th className="py-2 pr-3 text-right"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((d) => {
                const b = statusBadge(d.status)
                return (
                  <tr key={d.id} className="border-b last:border-0">
                    <td className="py-2 pr-3 font-mono text-xs">{d.event_type}</td>
                    <td className="py-2 pr-3">
                      <Badge variant={b.v}>{b.label}</Badge>
                    </td>
                    <td className="py-2 pr-3 font-mono text-xs">
                      {d.last_status_code ?? '—'}
                    </td>
                    <td className="py-2 pr-3 text-xs text-muted-foreground">{d.attempt_count}</td>
                    <td className="py-2 pr-3 text-xs text-muted-foreground">
                      {new Date(d.created_at).toLocaleString()}
                    </td>
                    <td className="py-2 pr-3 text-right">
                      <Button size="sm" variant="ghost" onPress={() => handleRetry(d.id)}>
                        Retry
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </Card>
  )
}
