'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { useToast } from '@/components/ui/toast'
import {
  apiKeysClient,
  type ApiKeyShape,
  type RequestLogShape,
  type UsageStats,
} from '@/lib/api-keys-client'

function fmtRelative(iso: string): string {
  const then = new Date(iso).getTime()
  const diff = Math.max(0, Math.floor((Date.now() - then) / 1000))
  if (diff < 60) return `${diff}s`
  const m = Math.floor(diff / 60)
  if (m < 60) return `${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} h`
  return `${Math.floor(h / 24)} j`
}

function statusTone(status: number): string {
  if (status >= 500) return 'text-danger'
  if (status >= 400) return 'text-warning'
  if (status >= 300) return 'text-accent'
  return 'text-success'
}

export function UsagePanel({ apiKey }: { apiKey: ApiKeyShape }) {
  const { toast } = useToast()
  const [stats, setStats] = useState<UsageStats | null>(null)
  const [recent, setRecent] = useState<RequestLogShape[] | null>(null)

  useEffect(() => {
    apiKeysClient.usageStats(apiKey.id).then((res) => {
      if (res.error) {
        toast(res.error, 'error')
        return
      }
      setStats(res.data?.data ?? null)
    })
    apiKeysClient.logs(apiKey.id, { limit: 20 }).then((res) => {
      if (res.error) return
      setRecent(res.data?.data ?? [])
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
            Requêtes récentes
          </h2>
        </div>
        <Card className="border-border/50">
          <CardContent className="p-0">
            {recent === null ? (
              <div className="flex justify-center py-8">
                <Spinner />
              </div>
            ) : recent.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-muted-foreground">
                Aucune requête enregistrée pour le moment.
              </p>
            ) : (
              <div className="divide-y divide-border/40">
                {recent.map((r) => (
                  <div
                    key={r.id}
                    className="grid grid-cols-[60px_1fr_60px_70px_90px] items-start gap-3 px-5 py-2.5 text-xs hover:bg-surface-hover transition-colors"
                  >
                    <code className="font-mono font-semibold text-foreground">{r.method}</code>
                    <div className="min-w-0">
                      <code className="block truncate font-mono text-muted-foreground">
                        {r.path}
                      </code>
                      {r.ip && (
                        <code className="mt-0.5 block truncate font-mono text-[10px] text-muted-foreground/70">
                          {r.ip}
                        </code>
                      )}
                    </div>
                    <code className={`text-right font-mono font-semibold ${statusTone(r.status)}`}>
                      {r.status || 'ERR'}
                    </code>
                    <span className="text-right tabular-nums text-muted-foreground">
                      {r.latency_ms}ms
                    </span>
                    <span
                      className="text-right text-muted-foreground"
                      title={new Date(r.created_at).toLocaleString()}
                    >
                      il y a {fmtRelative(r.created_at)}
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
