'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { useToast } from '@/components/ui/toast'
import { apiKeysClient, type ApiKeyShape, type UsageStats } from '@/lib/api-keys-client'

export function UsagePanel({ apiKey }: { apiKey: ApiKeyShape }) {
  const { toast } = useToast()
  const [stats, setStats] = useState<UsageStats | null>(null)

  useEffect(() => {
    apiKeysClient.usageStats(apiKey.id).then((res) => {
      if (res.error) {
        toast(res.error, 'error')
        return
      }
      setStats(res.data?.data ?? null)
    })
  }, [apiKey.id])

  if (!stats) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center">
          <Spinner />
        </div>
      </Card>
    )
  }

  const maxDaily = Math.max(1, ...stats.daily.map((d) => d.count))

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="p-5">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">This month</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">
            {stats.total_this_month.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">requests</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Lifetime</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">
            {stats.usage_count_lifetime.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">requests</p>
        </Card>
      </div>

      <Card className="p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Last 30 days
        </h3>
        <div className="mt-4 flex items-end gap-1 h-32">
          {stats.daily.map((d) => (
            <div
              key={d.day}
              className="flex-1 rounded-t bg-gradient-to-t from-violet-500/30 to-violet-500/70 transition-all hover:from-violet-500/40 hover:to-violet-500"
              style={{ height: `${(d.count / maxDaily) * 100}%` }}
              title={`${d.day}: ${d.count}`}
            />
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Top endpoints
        </h3>
        {stats.top_endpoints.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">No traffic yet.</p>
        ) : (
          <div className="mt-4 space-y-2">
            {stats.top_endpoints.map((e) => {
              const max = Math.max(...stats.top_endpoints.map((x) => x.count))
              return (
                <div key={e.endpoint} className="flex items-center gap-3">
                  <code className="w-64 truncate font-mono text-xs">{e.endpoint}</code>
                  <div className="relative h-2 flex-1 rounded-full bg-muted">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full bg-violet-500"
                      style={{ width: `${(e.count / max) * 100}%` }}
                    />
                  </div>
                  <span className="w-12 text-right text-xs tabular-nums text-muted-foreground">
                    {e.count}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      <Card className="p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Status distribution
        </h3>
        <div className="mt-4 flex gap-2">
          {stats.status_distribution.map((s) => {
            const total = stats.status_distribution.reduce((a, b) => a + b.count, 0)
            const pct = total > 0 ? (s.count / total) * 100 : 0
            const color =
              s.bucket === '2xx'
                ? 'bg-emerald-500'
                : s.bucket === '4xx'
                  ? 'bg-amber-500'
                  : s.bucket === '5xx'
                    ? 'bg-rose-500'
                    : 'bg-slate-500'
            return (
              <div key={s.bucket} className="flex-1 text-center">
                <div className={`h-2 rounded-full ${color}`} />
                <p className="mt-1 text-xs font-medium">{s.bucket}</p>
                <p className="text-xs text-muted-foreground">
                  {s.count.toLocaleString()} ({pct.toFixed(1)}%)
                </p>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
