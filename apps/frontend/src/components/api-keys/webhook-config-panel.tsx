'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Webhook, Check, Send, RefreshCcw, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { useToast } from '@/components/ui/toast'
import {
  apiKeysClient,
  type ApiKeyShape,
  type WebhookShape,
  type ScopesCatalog,
} from '@/lib/api-keys-client'
import { RevealedKeyDialog } from '@/components/api-keys/revealed-key-dialog'

interface Props {
  apiKey: ApiKeyShape
  webhook: WebhookShape | null
  onChanged: () => void
}

export function WebhookConfigPanel({ apiKey, webhook, onChanged }: Props) {
  const { toast } = useToast()
  const [url, setUrl] = useState(webhook?.url ?? '')
  const [events, setEvents] = useState<Set<string>>(new Set(webhook?.events ?? []))
  const [catalog, setCatalog] = useState<ScopesCatalog | null>(null)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [revealedSecret, setRevealedSecret] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<{
    delivered: boolean
    status_code: number | null
    error: string | null
    latency_ms: number
  } | null>(null)

  useEffect(() => {
    apiKeysClient.catalog().then((res) => {
      if (res.data?.data) setCatalog(res.data.data)
    })
  }, [])

  useEffect(() => {
    setUrl(webhook?.url ?? '')
    setEvents(new Set(webhook?.events ?? []))
  }, [webhook])

  function toggleEvent(e: string) {
    setEvents((prev) => {
      const next = new Set(prev)
      if (next.has(e)) next.delete(e)
      else next.add(e)
      return next
    })
  }

  function toggleCategory(events_in_cat: string[]) {
    setEvents((prev) => {
      const next = new Set(prev)
      const allSelected = events_in_cat.every((e) => next.has(e))
      events_in_cat.forEach((e) => {
        if (allSelected) next.delete(e)
        else next.add(e)
      })
      return next
    })
  }

  async function handleSave() {
    if (!url.trim()) {
      toast('URL is required', 'error')
      return
    }
    if (events.size === 0) {
      toast('Select at least one event', 'error')
      return
    }
    setSaving(true)
    const res = await apiKeysClient.setWebhook(apiKey.id, {
      url: url.trim(),
      events: Array.from(events),
    })
    setSaving(false)
    if (res.error) {
      toast(res.error, 'error')
      return
    }
    if (res.data?.plaintext_secret) {
      setRevealedSecret(res.data.plaintext_secret)
    } else {
      toast('Webhook saved', 'success')
    }
    onChanged()
  }

  async function handleTest() {
    setTesting(true)
    setTestResult(null)
    const res = await apiKeysClient.testWebhook(apiKey.id)
    setTesting(false)
    if (res.error || !res.data) {
      toast(res.error || 'Test failed', 'error')
      return
    }
    setTestResult(res.data)
  }

  async function handleRotateSecret() {
    if (!confirm('Generate a new signing secret? The old one stops working immediately.')) return
    const res = await apiKeysClient.rotateWebhookSecret(apiKey.id)
    if (res.error || !res.data?.plaintext_secret) {
      toast(res.error || 'Failed to rotate', 'error')
      return
    }
    setRevealedSecret(res.data.plaintext_secret)
    onChanged()
  }

  async function handleDelete() {
    if (!confirm('Remove this webhook configuration?')) return
    const res = await apiKeysClient.destroyWebhook(apiKey.id)
    if (res.error) {
      toast(res.error, 'error')
      return
    }
    toast('Webhook removed', 'success')
    setUrl('')
    setEvents(new Set())
    onChanged()
  }

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <div className="flex items-center gap-2">
          <Webhook className="size-4 text-violet-500" />
          <h2 className="text-base font-semibold">Webhook endpoint</h2>
        </div>

        <div className="mt-4 space-y-4">
          <div>
            <label className="text-sm font-medium">Destination URL *</label>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://hooks.example.com/faktur"
              className="mt-2 w-full rounded-lg border bg-background px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Must be HTTPS in production. Faktur signs every POST with HMAC-SHA256.
            </p>
          </div>

          {webhook && (
            <div className="rounded-lg border bg-muted/30 p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Signing secret
                  </p>
                  <p className="mt-1 font-mono text-sm">{webhook.masked_secret}</p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onPress={handleRotateSecret}
                  startContent={<RefreshCcw className="size-3.5" />}
                >
                  Rotate
                </Button>
              </div>
              {webhook.last_delivery_at && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Last delivery {new Date(webhook.last_delivery_at).toLocaleString()} —{' '}
                  <span
                    className={
                      webhook.last_delivery_status === 'delivered'
                        ? 'text-emerald-600'
                        : 'text-rose-600'
                    }
                  >
                    {webhook.last_delivery_status}
                  </span>
                </p>
              )}
            </div>
          )}
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="text-base font-semibold">Events</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Select which events to deliver to your endpoint.
        </p>
        {catalog === null ? (
          <div className="flex items-center justify-center py-10">
            <Spinner />
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {Object.entries(catalog.webhook_event_categories).map(([category, evs]) => {
              const allSelected = evs.every((e) => events.has(e))
              return (
                <div key={category}>
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {category}
                    </h4>
                    <button
                      type="button"
                      onClick={() => toggleCategory(evs)}
                      className="text-xs text-violet-500 hover:underline"
                    >
                      {allSelected ? 'Unselect all' : 'Select all'}
                    </button>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {evs.map((event) => {
                      const active = events.has(event)
                      return (
                        <button
                          key={event}
                          type="button"
                          onClick={() => toggleEvent(event)}
                          className={`rounded-md border px-2 py-1 font-mono text-xs transition-colors ${
                            active
                              ? 'border-violet-500/60 bg-violet-500/15'
                              : 'hover:bg-muted/50'
                          }`}
                        >
                          {active && <Check className="mr-1 inline-block size-3" />}
                          {event}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      <div className="flex items-center justify-between gap-2">
        <div>
          {webhook && (
            <Button
              variant="ghost"
              color="danger"
              onPress={handleDelete}
              startContent={<Trash2 className="size-3.5" />}
            >
              Remove webhook
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {webhook && (
            <Button
              variant="outline"
              onPress={handleTest}
              isLoading={testing}
              startContent={<Send className="size-3.5" />}
            >
              Send test event
            </Button>
          )}
          <Button onPress={handleSave} isLoading={saving} isDisabled={saving}>
            {webhook ? 'Save changes' : 'Configure webhook'}
          </Button>
        </div>
      </div>

      {testResult && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-lg border p-4 ${
            testResult.delivered
              ? 'border-emerald-500/30 bg-emerald-500/5'
              : 'border-rose-500/30 bg-rose-500/5'
          }`}
        >
          <h3 className="text-sm font-semibold">
            {testResult.delivered ? '✓ Delivered' : '✗ Failed'} — status{' '}
            <code>{testResult.status_code ?? 'no_response'}</code> in {testResult.latency_ms}ms
          </h3>
          {testResult.error && (
            <p className="mt-2 font-mono text-xs text-muted-foreground">{testResult.error}</p>
          )}
        </motion.div>
      )}

      <RevealedKeyDialog
        open={revealedSecret !== null}
        plaintext={revealedSecret ?? ''}
        keyName={apiKey.name}
        kind="webhook_secret"
        onClose={() => {
          setRevealedSecret(null)
          onChanged()
        }}
      />
    </div>
  )
}
