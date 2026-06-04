'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Send, RefreshCw, Trash2, Check } from '@/components/ui/icons'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Field, FieldLabel, FieldDescription } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
  const [deleting, setDeleting] = useState(false)
  const [rotatingSecret, setRotatingSecret] = useState(false)
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

  function toggleCategory(eventsInCat: string[]) {
    setEvents((prev) => {
      const next = new Set(prev)
      const allSelected = eventsInCat.every((e) => next.has(e))
      eventsInCat.forEach((e) => {
        if (allSelected) next.delete(e)
        else next.add(e)
      })
      return next
    })
  }

  async function handleSave() {
    if (!url.trim()) {
      toast("L'URL est requise", 'error')
      return
    }
    if (events.size === 0) {
      toast('Sélectionnez au moins un événement', 'error')
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
      toast('Webhook enregistré', 'success')
    }
    onChanged()
  }

  async function handleTest() {
    setTesting(true)
    setTestResult(null)
    const res = await apiKeysClient.testWebhook(apiKey.id)
    setTesting(false)
    if (res.error || !res.data) {
      toast(res.error || 'Échec du test', 'error')
      return
    }
    setTestResult(res.data)
  }

  async function handleRotateSecret() {
    if (
      !confirm("Générer un nouveau secret de signature ? L'ancien cesse de fonctionner immédiatement.")
    )
      return
    setRotatingSecret(true)
    const res = await apiKeysClient.rotateWebhookSecret(apiKey.id)
    setRotatingSecret(false)
    if (res.error || !res.data?.plaintext_secret) {
      toast(res.error || 'Échec de la rotation', 'error')
      return
    }
    setRevealedSecret(res.data.plaintext_secret)
    onChanged()
  }

  async function handleDelete() {
    if (!confirm('Supprimer la configuration du webhook ?')) return
    setDeleting(true)
    const res = await apiKeysClient.destroyWebhook(apiKey.id)
    setDeleting(false)
    if (res.error) {
      toast(res.error, 'error')
      return
    }
    toast('Webhook supprimé', 'success')
    setUrl('')
    setEvents(new Set())
    onChanged()
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-3 px-1">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Endpoint
          </h2>
        </div>
        <Card className="border-border/50">
          <CardContent className="p-5 space-y-4">
            <Field>
              <FieldLabel htmlFor="webhook-url">URL de destination</FieldLabel>
              <Input
                id="webhook-url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://hooks.example.com/faktur"
              />
              <FieldDescription>
                Doit être en HTTPS en production. Faktur signe chaque POST en HMAC-SHA256.
              </FieldDescription>
            </Field>

            {webhook && (
              <div className="rounded-lg border border-border/50 bg-surface p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">
                      Secret de signature
                    </p>
                    <p className="mt-1 font-mono text-sm text-foreground">{webhook.masked_secret}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRotateSecret}
                    disabled={rotatingSecret}
                  >
                    {rotatingSecret ? (
                      <>
                        <Spinner />
                        Rotation...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                        Roter
                      </>
                    )}
                  </Button>
                </div>
                {webhook.last_delivery_at && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Dernière livraison {new Date(webhook.last_delivery_at).toLocaleString()}
                    {' • '}
                    <span
                      className={
                        webhook.last_delivery_status === 'delivered'
                          ? 'text-success'
                          : 'text-danger'
                      }
                    >
                      {webhook.last_delivery_status}
                    </span>
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3 px-1">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Événements
          </h2>
        </div>
        <Card className="border-border/50">
          <CardContent className="p-5">
            {catalog === null ? (
              <div className="flex justify-center py-8">
                <Spinner />
              </div>
            ) : (
              <div className="space-y-5">
                {Object.entries(catalog.webhook_event_categories).map(([category, evs]) => {
                  const allSelected = evs.every((e) => events.has(e))
                  return (
                    <div key={category}>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          {category}
                        </h4>
                        <button
                          type="button"
                          onClick={() => toggleCategory(evs)}
                          className="text-xs text-accent hover:underline"
                        >
                          {allSelected ? 'Tout déselectionner' : 'Tout sélectionner'}
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {evs.map((event) => {
                          const active = events.has(event)
                          return (
                            <button
                              key={event}
                              type="button"
                              onClick={() => toggleEvent(event)}
                              className={`rounded-md border px-2 py-1 font-mono text-xs transition-colors ${
                                active
                                  ? 'border-accent bg-accent-soft text-foreground'
                                  : 'border-border/50 hover:bg-surface-hover'
                              }`}
                            >
                              {active && <Check className="mr-1 inline-block h-3 w-3" />}
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
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          {webhook && (
            <Button variant="ghost" onClick={handleDelete} disabled={deleting}>
              {deleting ? (
                <>
                  <Spinner />
                  Suppression...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2 text-danger" />
                  Supprimer le webhook
                </>
              )}
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {webhook && (
            <Button variant="outline" onClick={handleTest} disabled={testing}>
              {testing ? (
                <>
                  <Spinner />
                  Envoi...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Tester
                </>
              )}
            </Button>
          )}
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Spinner />
                Enregistrement...
              </>
            ) : webhook ? (
              'Enregistrer'
            ) : (
              'Configurer le webhook'
            )}
          </Button>
        </div>
      </div>

      {testResult && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <Card
            className={
              testResult.delivered
                ? 'border-success/40 bg-success/5'
                : 'border-danger/40 bg-danger/5'
            }
          >
            <CardContent className="p-4">
              <p className="text-sm font-semibold text-foreground">
                {testResult.delivered ? '✓ Livré' : '✗ Échec'} — HTTP{' '}
                <code className="font-mono">{testResult.status_code ?? 'aucune réponse'}</code> en{' '}
                {testResult.latency_ms}ms
              </p>
              {testResult.error && (
                <p className="mt-1 font-mono text-xs text-muted-foreground">{testResult.error}</p>
              )}
            </CardContent>
          </Card>
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
