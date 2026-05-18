'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Send, RefreshCw, Trash2, Webhook, Plus, ArrowLeft, Search } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Field, FieldLabel, FieldDescription } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { FormSelect } from '@/components/ui/dropdown'
import {
  CheckboxRoot,
  CheckboxControl,
  CheckboxIndicator,
} from '@/components/ui/checkbox'
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { useToast } from '@/components/ui/toast'
import {
  apiKeysClient,
  type ApiKeyShape,
  type WebhookShape,
  type ScopesCatalog,
} from '@/lib/api-keys-client'
import { RevealedKeyDialog } from '@/components/api-keys/revealed-key-dialog'
import {
  WEBHOOK_PRESETS,
  humanizeWebhookEvent,
  resolveWebhookPreset,
} from '@/lib/webhook-events-humanizer'

interface Props {
  apiKey: ApiKeyShape
  webhook: WebhookShape | null
  onChanged: () => void
}

export function WebhookConfigPanel({ apiKey, webhook, onChanged }: Props) {
  const { toast } = useToast()
  const [createOpen, setCreateOpen] = useState(false)
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

  const [preset, setPreset] = useState<string>('custom')

  function detectPreset(currentEvents: string[], allEvents: string[]): string {
    for (const p of WEBHOOK_PRESETS) {
      if (p.id === 'custom') continue
      const target = resolveWebhookPreset(allEvents, p.id).sort().join(',')
      const actual = [...currentEvents].sort().join(',')
      if (target && target === actual) return p.id
    }
    return 'custom'
  }

  useEffect(() => {
    if (!catalog) return
    setPreset(detectPreset(Array.from(events), catalog.webhook_events))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catalog])

  function changePreset(next: string) {
    setPreset(next)
    if (!catalog) return
    if (next === 'custom') return
    setEvents(new Set(resolveWebhookPreset(catalog.webhook_events, next)))
  }

  function toggleEvent(e: string) {
    setEvents((prev) => {
      const next = new Set(prev)
      if (next.has(e)) next.delete(e)
      else next.add(e)
      return next
    })
    setPreset('custom')
  }

  async function handleSave(payload: { url: string; events: string[] }) {
    if (!payload.url.trim()) {
      toast("L'URL est requise", 'error')
      return false
    }
    if (payload.events.length === 0) {
      toast('Sélectionnez au moins un événement', 'error')
      return false
    }
    setSaving(true)
    const res = await apiKeysClient.setWebhook(apiKey.id, {
      url: payload.url.trim(),
      events: payload.events,
    })
    setSaving(false)
    if (res.error) {
      toast(res.error, 'error')
      return false
    }
    if (res.data?.plaintext_secret) {
      setRevealedSecret(res.data.plaintext_secret)
    } else {
      toast('Webhook enregistré', 'success')
    }
    onChanged()
    return true
  }

  async function handleTest() {
    if (events.size === 0) {
      toast('Sélectionnez au moins un événement avant de tester', 'error')
      return
    }
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

  if (!webhook) {
    return (
      <>
        <Card className="border-border/50">
          <CardContent className="p-8 text-center">
            <div className="mx-auto inline-flex size-12 items-center justify-center rounded-full bg-accent-soft">
              <Webhook className="h-5 w-5 text-accent" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-foreground">
              Aucun webhook configuré
            </h3>
            <p className="mt-2 max-w-md mx-auto text-sm text-muted-foreground">
              Recevez en temps réel les événements de votre compte Faktur — création de
              factures, paiements, modifications client — directement sur votre serveur.
            </p>
            <div className="mt-5 flex justify-center">
              <Button size="sm" onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Créer un webhook
              </Button>
            </div>
          </CardContent>
        </Card>

        <CreateWebhookDialog
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          catalog={catalog}
          onSubmit={async (payload) => {
            const ok = await handleSave(payload)
            if (ok) setCreateOpen(false)
          }}
          saving={saving}
        />

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
      </>
    )
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

            <div className="rounded-lg border border-border/50 bg-surface p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">
                    Secret de signature
                  </p>
                  <p className="mt-1 font-mono text-sm text-foreground">
                    {webhook.masked_secret}
                  </p>
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
          <CardContent className="p-5 space-y-4">
            <WebhookEventPicker
              catalog={catalog}
              preset={preset}
              onPresetChange={changePreset}
              selectedEvents={events}
              onToggleEvent={toggleEvent}
            />
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
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
        <div className="flex items-center gap-2">
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
          <Button
            onClick={() => handleSave({ url, events: Array.from(events) })}
            disabled={saving}
          >
            {saving ? (
              <>
                <Spinner />
                Enregistrement...
              </>
            ) : (
              'Enregistrer'
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

interface CreateWebhookDialogProps {
  open: boolean
  onClose: () => void
  catalog: ScopesCatalog | null
  saving: boolean
  onSubmit: (payload: { url: string; events: string[] }) => void
}

function CreateWebhookDialog({
  open,
  onClose,
  catalog,
  saving,
  onSubmit,
}: CreateWebhookDialogProps) {
  const [step, setStep] = useState<1 | 2>(1)
  const [url, setUrl] = useState('')
  const [events, setEvents] = useState<Set<string>>(new Set())
  const [preset, setPreset] = useState<string>('all')

  useEffect(() => {
    if (!open) {
      setStep(1)
      setUrl('')
      setEvents(new Set())
      setPreset('all')
      return
    }
    if (catalog) {
      setEvents(new Set(resolveWebhookPreset(catalog.webhook_events, 'all')))
    }
  }, [open, catalog])

  function changePreset(next: string) {
    setPreset(next)
    if (!catalog) return
    if (next === 'custom') return
    setEvents(new Set(resolveWebhookPreset(catalog.webhook_events, next)))
  }

  function toggleEvent(e: string) {
    setEvents((prev) => {
      const next = new Set(prev)
      if (next.has(e)) next.delete(e)
      else next.add(e)
      return next
    })
    setPreset('custom')
  }

  return (
    <Dialog open={open} onClose={onClose} className="max-w-2xl">
      <DialogHeader onClose={onClose}>
        <DialogTitle>Nouveau webhook · Étape {step}/2</DialogTitle>
        <DialogDescription>
          {step === 1
            ? "Saisissez l'URL de destination."
            : 'Sélectionnez les événements à recevoir.'}
        </DialogDescription>
      </DialogHeader>

      {step === 1 && (
        <div className="mt-4">
          <Field>
            <FieldLabel htmlFor="new-webhook-url">URL de destination</FieldLabel>
            <Input
              id="new-webhook-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://hooks.example.com/faktur"
              autoFocus
            />
            <FieldDescription>
              HTTPS recommandé en production. Faktur signe chaque POST en HMAC-SHA256.
            </FieldDescription>
          </Field>
        </div>
      )}

      {step === 2 && (
        <div className="mt-4">
          <WebhookEventPicker
            catalog={catalog}
            preset={preset}
            onPresetChange={changePreset}
            selectedEvents={events}
            onToggleEvent={toggleEvent}
          />
        </div>
      )}

      <DialogFooter>
        {step === 2 && (
          <Button variant="outline" onClick={() => setStep(1)} disabled={saving}>
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Précédent
          </Button>
        )}
        <Button variant="outline" onClick={onClose} disabled={saving}>
          Annuler
        </Button>
        {step === 1 ? (
          <Button onClick={() => setStep(2)} disabled={!url.trim()}>
            Suivant
          </Button>
        ) : (
          <Button
            onClick={() => onSubmit({ url, events: Array.from(events) })}
            disabled={saving || events.size === 0}
          >
            {saving ? (
              <>
                <Spinner />
                Configuration...
              </>
            ) : (
              'Configurer le webhook'
            )}
          </Button>
        )}
      </DialogFooter>
    </Dialog>
  )
}

/* ─────────────────────────── Event picker (shared) ─────────────────────────── */

interface WebhookEventPickerProps {
  catalog: ScopesCatalog | null
  preset: string
  onPresetChange: (next: string) => void
  selectedEvents: Set<string>
  onToggleEvent: (event: string) => void
}

function WebhookEventPicker({
  catalog,
  preset,
  onPresetChange,
  selectedEvents,
  onToggleEvent,
}: WebhookEventPickerProps) {
  const [search, setSearch] = useState('')

  const locked = preset !== 'custom'

  const filtered = useMemo(() => {
    if (!catalog) return [] as Array<{ category: string; events: string[] }>
    const q = search.trim().toLowerCase()
    return Object.entries(catalog.webhook_event_categories)
      .map(([category, evs]) => ({
        category,
        events: evs.filter((e) => {
          if (!q) return true
          const { label } = humanizeWebhookEvent(e)
          return e.toLowerCase().includes(q) || label.toLowerCase().includes(q)
        }),
      }))
      .filter((c) => c.events.length > 0)
  }, [catalog, search])

  if (catalog === null) {
    return (
      <div className="flex justify-center py-8">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <Field>
        <FieldLabel htmlFor="webhook-preset-select">Préréglage</FieldLabel>
        <FormSelect
          id="webhook-preset-select"
          value={preset}
          onChange={onPresetChange}
          options={WEBHOOK_PRESETS.map((p) => ({ value: p.id, label: p.label }))}
        />
        <FieldDescription>
          {WEBHOOK_PRESETS.find((p) => p.id === preset)?.description}
        </FieldDescription>
      </Field>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher (invoice.created, paiement…)"
          className="pl-9"
        />
      </div>

      <div className="flex items-center justify-between px-1 text-xs text-muted-foreground">
        <span>
          {selectedEvents.size} événement{selectedEvents.size > 1 ? 's' : ''} sélectionné
          {selectedEvents.size > 1 ? 's' : ''}
          {locked && ' (verrouillé par le préréglage)'}
        </span>
      </div>

      <div
        className={
          'max-h-[60vh] overflow-y-auto rounded-lg border border-border/50 bg-surface ' +
          (locked ? 'opacity-70' : '')
        }
      >
        {filtered.length === 0 ? (
          <p className="px-4 py-6 text-center text-xs text-muted-foreground">
            Aucun événement ne correspond à « {search} ».
          </p>
        ) : (
          filtered.map(({ category, events: evs }) => (
            <div key={category} className="border-b border-border/40 last:border-0">
              <div className="bg-field/60 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {category}
              </div>
              <div className="divide-y divide-border/30">
                {evs.map((event) => {
                  const active = selectedEvents.has(event)
                  const { label, icon: Icon, toneClass } = humanizeWebhookEvent(event)
                  return (
                    <CheckboxRoot
                      key={event}
                      isSelected={active}
                      isDisabled={locked}
                      onChange={locked ? undefined : () => onToggleEvent(event)}
                      className={
                        'flex w-full items-center gap-3 px-3 py-2.5 transition-colors ' +
                        (locked
                          ? 'cursor-not-allowed'
                          : 'cursor-pointer hover:bg-surface-hover')
                      }
                    >
                      <CheckboxControl>
                        <CheckboxIndicator />
                      </CheckboxControl>
                      <Icon className={`h-4 w-4 shrink-0 ${toneClass}`} />
                      <span className="min-w-0 flex-1 text-sm text-foreground">{label}</span>
                      <code className="shrink-0 font-mono text-[11px] text-muted-foreground">
                        {event}
                      </code>
                    </CheckboxRoot>
                  )
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
