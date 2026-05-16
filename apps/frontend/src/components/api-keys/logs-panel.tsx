'use client'

import { useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { useToast } from '@/components/ui/toast'
import { apiKeysClient, type ApiKeyShape, type RequestLogShape } from '@/lib/api-keys-client'

const BUCKETS = ['all', '2xx', '4xx', '5xx'] as const

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

  function statusColor(s: number) {
    if (s < 300) return 'text-emerald-600 dark:text-emerald-400'
    if (s < 400) return 'text-blue-600 dark:text-blue-400'
    if (s < 500) return 'text-amber-600 dark:text-amber-400'
    return 'text-rose-600 dark:text-rose-400'
  }

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {BUCKETS.map((b) => (
            <button
              key={b}
              onClick={() => setBucket(b)}
              className={`rounded-md px-2.5 py-1 text-xs uppercase transition-colors ${
                bucket === b
                  ? 'bg-violet-500/15 text-foreground'
                  : 'text-muted-foreground hover:bg-muted/50'
              }`}
            >
              {b}
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
          <p className="py-10 text-center text-sm text-muted-foreground">
            No requests in the last 30 days.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="py-2 pr-3">Time</th>
                <th className="py-2 pr-3">Method</th>
                <th className="py-2 pr-3">Path</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3">Latency</th>
                <th className="py-2 pr-3">IP</th>
              </tr>
            </thead>
            <tbody>
              {items.map((log) => (
                <tr key={log.id} className="border-b last:border-0">
                  <td className="py-2 pr-3 text-xs text-muted-foreground">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="py-2 pr-3 font-mono text-xs">{log.method}</td>
                  <td className="py-2 pr-3 font-mono text-xs">{log.path}</td>
                  <td className={`py-2 pr-3 font-mono text-xs ${statusColor(log.status)}`}>
                    {log.status} {log.error_code ? `(${log.error_code})` : ''}
                  </td>
                  <td className="py-2 pr-3 text-xs text-muted-foreground">{log.latency_ms}ms</td>
                  <td className="py-2 pr-3 font-mono text-xs text-muted-foreground">{log.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Card>
  )
}
