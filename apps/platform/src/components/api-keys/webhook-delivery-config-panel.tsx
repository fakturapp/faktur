'use client'

import { useEffect, useState } from 'react'
import { Plus, Save, Trash2, Sliders } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Field, FieldLabel, FieldDescription } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast'
import { apiKeysClient } from '@/lib/api-keys-client'

interface DeliveryConfig {
  delivery_max_retries: number
  delivery_timeout_ms: number
  delivery_backoff_seconds: number
  delivery_custom_headers: Record<string, string>
}

interface Props {
  apiKeyId: string
}

interface HeaderRow {
  id: number
  key: string
  value: string
}

let nextRowId = 1

export function WebhookDeliveryConfigPanel({ apiKeyId }: Props) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [config, setConfig] = useState<DeliveryConfig | null>(null)
  const [maxRetries, setMaxRetries] = useState('5')
  const [timeoutMs, setTimeoutMs] = useState('10000')
  const [backoffSeconds, setBackoffSeconds] = useState('30')
  const [rows, setRows] = useState<HeaderRow[]>([])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    apiKeysClient.deliveryConfig(apiKeyId).then((res) => {
      if (cancelled) return
      if (res.error || !res.data?.data) {
        toast(res.error ?? 'Échec du chargement', 'error')
        setLoading(false)
        return
      }
      const cfg = res.data.data
      setConfig(cfg)
      setMaxRetries(String(cfg.delivery_max_retries))
      setTimeoutMs(String(cfg.delivery_timeout_ms))
      setBackoffSeconds(String(cfg.delivery_backoff_seconds))
      setRows(
        Object.entries(cfg.delivery_custom_headers ?? {}).map(([key, value]) => ({
          id: nextRowId++,
          key,
          value,
        }))
      )
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [apiKeyId, toast])

  function addRow() {
    setRows((r) => [...r, { id: nextRowId++, key: '', value: '' }])
  }

  function updateRow(id: number, patch: Partial<HeaderRow>) {
    setRows((r) => r.map((row) => (row.id === id ? { ...row, ...patch } : row)))
  }

  function removeRow(id: number) {
    setRows((r) => r.filter((row) => row.id !== id))
  }

  async function handleSave() {
    const headers: Record<string, string> = {}
    for (const row of rows) {
      const k = row.key.trim()
      const v = row.value.trim()
      if (!k && !v) continue
      if (!k || !v) {
        toast('Chaque en-tête doit avoir un nom et une valeur', 'error')
        return
      }
      if (headers[k] !== undefined) {
        toast(`En-tête « ${k} » défini deux fois`, 'error')
        return
      }
      headers[k] = v
    }

    const max = Number(maxRetries)
    const timeout = Number(timeoutMs)
    const backoff = Number(backoffSeconds)
    if (!Number.isFinite(max) || max < 0 || max > 20) {
      toast('Nombre de tentatives : entre 0 et 20', 'error')
      return
    }
    if (!Number.isFinite(timeout) || timeout < 1000 || timeout > 60000) {
      toast('Délai d’attente : entre 1000ms et 60000ms', 'error')
      return
    }
    if (!Number.isFinite(backoff) || backoff < 5 || backoff > 3600) {
      toast('Backoff : entre 5 et 3600 secondes', 'error')
      return
    }

    setSaving(true)
    const res = await apiKeysClient.updateDeliveryConfig(apiKeyId, {
      deliveryMaxRetries: max,
      deliveryTimeoutMs: timeout,
      deliveryBackoffSeconds: backoff,
      deliveryCustomHeaders: headers,
    })
    setSaving(false)
    if (res.error || !res.data?.data) {
      toast(res.error ?? 'Échec de l’enregistrement', 'error')
      return
    }
    setConfig(res.data.data)
    toast('Configuration de livraison enregistrée', 'success')
  }

  if (loading) {
    return (
      <Card className="border-border/50">
        <CardContent className="flex justify-center py-8">
          <Spinner />
        </CardContent>
      </Card>
    )
  }

  if (!config) return null

  const dirty =
    String(config.delivery_max_retries) !== maxRetries ||
    String(config.delivery_timeout_ms) !== timeoutMs ||
    String(config.delivery_backoff_seconds) !== backoffSeconds ||
    JSON.stringify(config.delivery_custom_headers ?? {}) !==
      JSON.stringify(
        rows.reduce<Record<string, string>>((acc, row) => {
          if (row.key.trim()) acc[row.key.trim()] = row.value.trim()
          return acc
        }, {})
      )

  return (
    <div>
      <div className="flex items-center gap-2 mb-3 px-1">
        <Sliders className="h-3.5 w-3.5 text-muted-foreground" />
        <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Configuration de livraison
        </h2>
      </div>
      <Card className="border-border/50">
        <CardContent className="p-5 space-y-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field>
              <FieldLabel htmlFor="delivery-max-retries">Tentatives max</FieldLabel>
              <Input
                id="delivery-max-retries"
                type="number"
                min={0}
                max={20}
                value={maxRetries}
                onChange={(e) => setMaxRetries(e.target.value)}
              />
              <FieldDescription>0 à 20 essais.</FieldDescription>
            </Field>

            <Field>
              <FieldLabel htmlFor="delivery-timeout">Délai d’attente (ms)</FieldLabel>
              <Input
                id="delivery-timeout"
                type="number"
                min={1000}
                max={60000}
                step={500}
                value={timeoutMs}
                onChange={(e) => setTimeoutMs(e.target.value)}
              />
              <FieldDescription>Timeout HTTP par tentative.</FieldDescription>
            </Field>

            <Field>
              <FieldLabel htmlFor="delivery-backoff">Backoff initial (s)</FieldLabel>
              <Input
                id="delivery-backoff"
                type="number"
                min={5}
                max={3600}
                value={backoffSeconds}
                onChange={(e) => setBackoffSeconds(e.target.value)}
              />
              <FieldDescription>Délai exponentiel entre essais.</FieldDescription>
            </Field>
          </div>

          <div>
            <FieldLabel>En-têtes personnalisés</FieldLabel>
            <FieldDescription>
              Ajoutés à chaque POST. Les en-têtes réservés (Authorization, X-Faktur-*…) sont
              interdits.
            </FieldDescription>
            <div className="mt-2 space-y-2">
              {rows.length === 0 && (
                <p className="rounded-md border border-dashed border-border/50 px-3 py-2 text-xs text-muted-foreground">
                  Aucun en-tête personnalisé.
                </p>
              )}
              {rows.map((row) => (
                <div key={row.id} className="flex items-center gap-2">
                  <Input
                    placeholder="X-Mon-Header"
                    value={row.key}
                    onChange={(e) => updateRow(row.id, { key: e.target.value })}
                    className="font-mono text-xs"
                  />
                  <Input
                    placeholder="valeur"
                    value={row.value}
                    onChange={(e) => updateRow(row.id, { value: e.target.value })}
                    className="font-mono text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => removeRow(row.id)}
                    className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-danger/10 hover:text-danger"
                    aria-label="Retirer l’en-tête"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addRow} className="mt-1">
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Ajouter un en-tête
              </Button>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving || !dirty}>
              {saving ? (
                <>
                  <Spinner />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Enregistrer
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
