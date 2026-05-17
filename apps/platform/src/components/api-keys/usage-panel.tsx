'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
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
      <Card className="border-border/50">
        <CardContent className="p-8">
          <div className="flex justify-center">
            <Spinner />
          </div>
        </CardContent>
      </Card>
    )
  }

  const maxDaily = Math.max(1, ...stats.daily.map((d) => d.count))
  const totalStatus = stats.status_distribution.reduce((a, b) => a + b.count, 0)
  const maxEndpoint = Math.max(1, ...stats.top_endpoints.map((x) => x.count))

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-3 px-1">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Compteurs
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="border-border/50">
            <CardContent className="p-5">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Ce mois-ci
              </p>
              <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">
                {stats.total_this_month.toLocaleString()}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">requêtes</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-5">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Total</p>
              <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">
                {stats.usage_count_lifetime.toLocaleString()}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">requêtes</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3 px-1">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            30 derniers jours
          </h2>
        </div>
        <Card className="border-border/50">
          <CardContent className="p-5">
            {stats.daily.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune donnée.</p>
            ) : (
              <div className="flex h-32 items-end gap-1">
                {stats.daily.map((d) => (
                  <div
                    key={d.day}
                    className="flex-1 rounded-t bg-accent transition-all hover:bg-accent/80"
                    style={{ height: `${Math.max(2, (d.count / maxDaily) * 100)}%` }}
                    title={`${d.day} : ${d.count}`}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3 px-1">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Top endpoints
          </h2>
        </div>
        <Card className="border-border/50">
          <CardContent className="p-0">
            {stats.top_endpoints.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-muted-foreground">
                Aucun appel pour le moment.
              </p>
            ) : (
              <div className="divide-y divide-border/50">
                {stats.top_endpoints.map((e) => (
                  <div
                    key={e.endpoint}
                    className="flex items-center gap-4 px-5 py-3 hover:bg-surface-hover transition-colors"
                  >
                    <code className="w-64 shrink-0 truncate font-mono text-xs text-foreground">
                      {e.endpoint}
                    </code>
                    <div className="relative h-1.5 flex-1 rounded-full bg-surface">
                      <div
                        className="absolute inset-y-0 left-0 rounded-full bg-accent"
                        style={{ width: `${(e.count / maxEndpoint) * 100}%` }}
                      />
                    </div>
                    <span className="w-12 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                      {e.count}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3 px-1">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Distribution des statuts
          </h2>
        </div>
        <Card className="border-border/50">
          <CardContent className="p-5">
            {totalStatus === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune donnée.</p>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {stats.status_distribution.map((s) => {
                  const pct = totalStatus > 0 ? (s.count / totalStatus) * 100 : 0
                  const colorClass =
                    s.bucket === '2xx'
                      ? 'bg-success'
                      : s.bucket === '4xx'
                        ? 'bg-warning'
                        : s.bucket === '5xx'
                          ? 'bg-danger'
                          : 'bg-muted'
                  return (
                    <div key={s.bucket} className="text-center">
                      <div className={`h-1.5 rounded-full ${colorClass}`} />
                      <p className="mt-1.5 text-xs font-medium text-foreground">{s.bucket}</p>
                      <p className="text-xs text-muted-foreground">
                        {s.count.toLocaleString()} ({pct.toFixed(1)}%)
                      </p>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
