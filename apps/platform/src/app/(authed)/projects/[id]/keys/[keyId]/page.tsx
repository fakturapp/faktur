'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { useApiKey } from '@/lib/api-key-context'

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString()
}

export default function OverviewPage() {
  const { apiKey, webhook, loading } = useApiKey()

  if (!apiKey) {
    return loading ? (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    ) : null
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-3 px-1">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Détails de la clé
          </h2>
        </div>
        <Card className="border-border/50">
          <CardContent className="p-0">
            <div className="divide-y divide-border/50">
              <Row label="Créée le" value={formatDate(apiKey.created_at)} />
              <Row label="Expire le" value={formatDate(apiKey.expires_at)} />
              <Row label="Dernière utilisation" value={formatDate(apiKey.last_used_at)} />
              <Row label="Dernière IP" value={apiKey.last_ip ?? '—'} mono />
              <Row label="Nombre d'appels" value={apiKey.usage_count.toLocaleString()} />
              <Row label="Plan de quotas" value={apiKey.rate_limit_tier} />
              <Row
                label="IPs autorisées"
                value={
                  apiKey.allowed_ips?.length
                    ? apiKey.allowed_ips.join(', ')
                    : 'Toutes les sources'
                }
                mono={Boolean(apiKey.allowed_ips?.length)}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3 px-1">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Permissions ({apiKey.scopes.length})
          </h2>
        </div>
        <Card className="border-border/50">
          <CardContent className="p-5">
            <div className="flex flex-wrap gap-1.5">
              {apiKey.scopes.map((s) => (
                <Badge key={s} variant="soft" size="sm">
                  {s}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3 px-1">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Webhook
          </h2>
        </div>
        <Card className="border-border/50">
          <CardContent className="p-5">
            {webhook ? (
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-mono text-sm text-foreground">{webhook.url}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {webhook.events.length} événement{webhook.events.length > 1 ? 's' : ''}{' '}
                    souscrit{webhook.events.length > 1 ? 's' : ''}
                  </p>
                </div>
                <Badge variant={webhook.is_active ? 'success' : 'muted'} size="sm">
                  {webhook.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Aucun webhook configuré. Ouvre la section Webhook dans la sidebar pour en
                ajouter un.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function Row({
  label,
  value,
  mono,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-surface-hover transition-colors">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className={`text-sm text-foreground text-right ${mono ? 'font-mono text-xs' : ''}`}>
        {value}
      </span>
    </div>
  )
}
