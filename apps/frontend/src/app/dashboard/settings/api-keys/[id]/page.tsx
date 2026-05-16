'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Activity,
  Webhook,
  ScrollText,
  BarChart3,
  RotateCw,
  Trash2,
  Copy,
  Check,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { useToast } from '@/components/ui/toast'
import { apiKeysClient, type ApiKeyShape, type WebhookShape } from '@/lib/api-keys-client'
import { WebhookConfigPanel } from '@/components/api-keys/webhook-config-panel'
import { DeliveriesPanel } from '@/components/api-keys/deliveries-panel'
import { LogsPanel } from '@/components/api-keys/logs-panel'
import { UsagePanel } from '@/components/api-keys/usage-panel'
import { RevealedKeyDialog } from '@/components/api-keys/revealed-key-dialog'

type Tab = 'overview' | 'webhook' | 'deliveries' | 'logs' | 'usage'

const TABS: Array<{ id: Tab; label: string; icon: typeof Activity }> = [
  { id: 'overview', label: 'Overview', icon: Activity },
  { id: 'webhook', label: 'Webhook', icon: Webhook },
  { id: 'deliveries', label: 'Deliveries', icon: ScrollText },
  { id: 'logs', label: 'Logs', icon: ScrollText },
  { id: 'usage', label: 'Usage', icon: BarChart3 },
]

export default function ApiKeyDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { toast } = useToast()
  const [tab, setTab] = useState<Tab>('overview')
  const [key, setKey] = useState<ApiKeyShape | null>(null)
  const [webhook, setWebhook] = useState<WebhookShape | null>(null)
  const [rotated, setRotated] = useState<{ plaintext: string } | null>(null)

  async function load() {
    const res = await apiKeysClient.show(params.id)
    if (res.error) {
      toast(res.error, 'error')
      router.push('/dashboard/settings/api-keys')
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
    const res = await apiKeysClient.rotate(key.id)
    if (res.error || !res.data?.plaintext) {
      toast(res.error || 'Rotation failed', 'error')
      return
    }
    toast('New key generated — old one stays active 24h', 'success')
    setRotated({ plaintext: res.data.plaintext })
    load()
  }

  async function handleRevoke() {
    if (!key) return
    if (!confirm(`Revoke ${key.name}? This cannot be undone.`)) return
    const res = await apiKeysClient.revoke(key.id)
    if (res.error) {
      toast(res.error, 'error')
      return
    }
    toast('Key revoked', 'success')
    router.push('/dashboard/settings/api-keys')
  }

  if (!key) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner />
      </div>
    )
  }

  const statusTone =
    key.status === 'active'
      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
      : key.status === 'rotating'
        ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
        : key.status === 'expired'
          ? 'bg-slate-500/15 text-slate-700 dark:text-slate-300'
          : 'bg-rose-500/15 text-rose-700 dark:text-rose-300'

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard/settings/api-keys"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" /> Back to keys
        </Link>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight truncate">{key.name}</h1>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusTone}`}
            >
              {key.status}
            </span>
          </div>
          <p className="mt-1 font-mono text-sm text-muted-foreground">{key.masked_token}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {key.status === 'active' && (
            <>
              <Button
                size="sm"
                variant="outline"
                onPress={handleRotate}
                startContent={<RotateCw className="size-3.5" />}
              >
                Rotate
              </Button>
              <Button
                size="sm"
                color="danger"
                variant="outline"
                onPress={handleRevoke}
                startContent={<Trash2 className="size-3.5" />}
              >
                Revoke
              </Button>
            </>
          )}
        </div>
      </motion.div>

      <div className="border-b">
        <div className="flex gap-1 overflow-x-auto">
          {TABS.map((t) => {
            const Icon = t.icon
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`relative inline-flex items-center gap-1.5 px-3 py-2.5 text-sm transition-colors ${
                  tab === t.id ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="size-3.5" />
                {t.label}
                {tab === t.id && (
                  <motion.span
                    layoutId="tab-indicator"
                    className="absolute inset-x-0 -bottom-px h-0.5 bg-violet-500"
                  />
                )}
              </button>
            )
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {tab === 'overview' && <OverviewPanel apiKey={key} webhook={webhook} />}
          {tab === 'webhook' && (
            <WebhookConfigPanel apiKey={key} webhook={webhook} onChanged={load} />
          )}
          {tab === 'deliveries' && <DeliveriesPanel apiKey={key} />}
          {tab === 'logs' && <LogsPanel apiKey={key} />}
          {tab === 'usage' && <UsagePanel apiKey={key} />}
        </motion.div>
      </AnimatePresence>

      <RevealedKeyDialog
        open={rotated !== null}
        plaintext={rotated?.plaintext ?? ''}
        keyName={key.name}
        kind="api_key"
        onClose={() => setRotated(null)}
      />
    </div>
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
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Key details
        </h3>
        <dl className="mt-4 space-y-3 text-sm">
          <Row label="Created at" value={formatDate(apiKey.created_at)} />
          <Row label="Expires at" value={formatDate(apiKey.expires_at)} />
          <Row label="Last used" value={formatDate(apiKey.last_used_at)} />
          <Row label="Last IP" value={apiKey.last_ip ?? '—'} mono />
          <Row label="Usage count" value={apiKey.usage_count.toLocaleString()} />
          <Row label="Rate limit tier" value={apiKey.rate_limit_tier} />
          <Row
            label="IP allowlist"
            value={apiKey.allowed_ips?.length ? apiKey.allowed_ips.join(', ') : 'Unrestricted'}
            mono={Boolean(apiKey.allowed_ips?.length)}
          />
        </dl>
      </Card>

      <Card className="p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Permissions ({apiKey.scopes.length})
        </h3>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {apiKey.scopes.map((s) => (
            <code
              key={s}
              className="rounded-md border bg-muted/40 px-2 py-1 font-mono text-xs"
            >
              {s}
            </code>
          ))}
        </div>
      </Card>

      <Card className="p-5 md:col-span-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Webhook
          </h3>
          {webhook ? (
            <Badge variant={webhook.is_active ? 'success' : 'default'}>
              {webhook.is_active ? 'Active' : 'Inactive'}
            </Badge>
          ) : (
            <Badge variant="default">Not configured</Badge>
          )}
        </div>
        {webhook ? (
          <div className="mt-4 space-y-1 text-sm">
            <p className="truncate font-mono text-xs text-muted-foreground">{webhook.url}</p>
            <p className="text-xs text-muted-foreground">
              {webhook.events.length} event{webhook.events.length > 1 ? 's' : ''} subscribed
            </p>
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            No webhook configured. Set one in the Webhook tab to receive event notifications.
          </p>
        )}
      </Card>
    </div>
  )
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="shrink-0 text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className={`text-right text-sm ${mono ? 'font-mono text-xs' : ''}`}>{value}</dd>
    </div>
  )
}
