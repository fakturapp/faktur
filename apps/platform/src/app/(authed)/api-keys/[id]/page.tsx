'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  RotateCw,
  Trash2,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/components/ui/toast'
import { apiKeysClient, type ApiKeyShape, type WebhookShape } from '@/lib/api-keys-client'
import { useApiKeys } from '@/lib/api-keys-context'
import { WebhookConfigPanel } from '@/components/api-keys/webhook-config-panel'
import { DeliveriesPanel } from '@/components/api-keys/deliveries-panel'
import { LogsPanel } from '@/components/api-keys/logs-panel'
import { UsagePanel } from '@/components/api-keys/usage-panel'
import { RevealedKeyDialog } from '@/components/api-keys/revealed-key-dialog'

type Tab = 'overview' | 'webhook' | 'deliveries' | 'logs' | 'usage'

const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'overview', label: 'Vue d’ensemble' },
  { id: 'webhook', label: 'Webhook' },
  { id: 'deliveries', label: 'Livraisons' },
  { id: 'logs', label: 'Journaux' },
  { id: 'usage', label: 'Utilisation' },
]

function statusInfo(status: ApiKeyShape['status']) {
  switch (status) {
    case 'active':
      return { label: 'Active', variant: 'success' as const }
    case 'rotating':
      return { label: 'En rotation', variant: 'warning' as const }
    case 'expired':
      return { label: 'Expirée', variant: 'muted' as const }
    case 'revoked':
      return { label: 'Révoquée', variant: 'destructive' as const }
  }
}

export default function ApiKeyDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { toast } = useToast()
  const { reload: reloadList } = useApiKeys()
  const [tab, setTab] = useState<Tab>('overview')
  const [key, setKey] = useState<ApiKeyShape | null>(null)
  const [webhook, setWebhook] = useState<WebhookShape | null>(null)
  const [rotated, setRotated] = useState<{ plaintext: string } | null>(null)
  const [rotating, setRotating] = useState(false)
  const [revoking, setRevoking] = useState(false)

  async function load() {
    const res = await apiKeysClient.show(params.id)
    if (res.error) {
      toast(res.error, 'error')
      router.push('/api-keys')
      return
    }
    setKey(res.data?.data ?? null)
    setWebhook(res.data?.webhook ?? null)
  }

  useEffect(() => {
    load()
  }, [params.id])

  async function handleRotate() {
    if (!key) return
    setRotating(true)
    const res = await apiKeysClient.rotate(key.id)
    setRotating(false)
    if (res.error || !res.data?.plaintext) {
      toast(res.error || 'Échec de la rotation', 'error')
      return
    }
    toast("Nouvelle clé générée — l'ancienne reste active 24h", 'success')
    setRotated({ plaintext: res.data.plaintext })
    load()
    reloadList()
  }

  async function handleRevoke() {
    if (!key) return
    if (!confirm(`Révoquer la clé « ${key.name} » ? Cette action est irréversible.`)) return
    setRevoking(true)
    const res = await apiKeysClient.revoke(key.id)
    setRevoking(false)
    if (res.error) {
      toast(res.error, 'error')
      return
    }
    toast('Clé révoquée', 'success')
    reloadList()
    router.push('/api-keys')
  }

  if (!key) {
    return (
      <div className="space-y-6 px-4 lg:px-6 py-4 md:py-6">
        <Card className="border-border/50">
          <CardContent className="p-6">
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-32" />
          </CardContent>
        </Card>
      </div>
    )
  }

  const status = statusInfo(key.status)
  const isActive = key.status === 'active'

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 px-4 lg:px-6 py-4 md:py-6"
    >
      <Link
        href="/api-keys"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Retour aux clés
      </Link>

      <Card className="border-border/50">
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-bold text-foreground truncate">{key.name}</h1>
                <Badge variant={status.variant} size="sm">
                  {status.label}
                </Badge>
              </div>
              <p className="mt-1 font-mono text-sm text-muted-foreground">{key.masked_token}</p>
            </div>
            {isActive && (
              <div className="flex shrink-0 items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRotate}
                  disabled={rotating}
                >
                  {rotating ? (
                    <>
                      <Spinner />
                      Rotation...
                    </>
                  ) : (
                    <>
                      <RotateCw className="h-4 w-4 mr-2" />
                      Roter
                    </>
                  )}
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleRevoke}
                  disabled={revoking}
                >
                  {revoking ? (
                    <>
                      <Spinner />
                      Révocation...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Révoquer
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div>
        <div className="flex gap-1 overflow-x-auto border-b border-border/50 px-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`relative inline-flex items-center gap-1.5 px-3 py-2.5 text-sm transition-colors ${
                tab === t.id
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t.label}
              {tab === t.id && (
                <motion.span
                  layoutId="api-key-tab-indicator"
                  className="absolute inset-x-0 -bottom-px h-0.5 bg-accent"
                />
              )}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {tab === 'overview' && <OverviewPanel apiKey={key} webhook={webhook} />}
          {tab === 'webhook' && (
            <WebhookConfigPanel apiKey={key} webhook={webhook} onChanged={load} />
          )}
          {tab === 'deliveries' && <DeliveriesPanel apiKey={key} />}
          {tab === 'logs' && <LogsPanel apiKey={key} />}
          {tab === 'usage' && <UsagePanel apiKey={key} />}
        </div>
      </div>

      <RevealedKeyDialog
        open={rotated !== null}
        plaintext={rotated?.plaintext ?? ''}
        keyName={key.name}
        kind="api_key"
        onClose={() => setRotated(null)}
      />
    </motion.div>
  )
}

function OverviewPanel({
  apiKey,
  webhook,
}: {
  apiKey: ApiKeyShape
  webhook: WebhookShape | null
}) {
  function formatDate(iso: string | null) {
    if (!iso) return '—'
    return new Date(iso).toLocaleString()
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
              <div>
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
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Aucun webhook configuré. Ajoutez-en un dans l&apos;onglet Webhook pour recevoir
                les événements.
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
