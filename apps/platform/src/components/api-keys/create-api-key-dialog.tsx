'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { FormSelect } from '@/components/ui/dropdown'
import { Button } from '@/components/ui/button'
import { Field, FieldLabel, FieldDescription } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/components/ui/toast'
import { ArrowLeft, ArrowRight, Check, Plus, X } from 'lucide-react'
import { apiKeysClient, type ApiKeyShape, type ScopesCatalog } from '@/lib/api-keys-client'
import { useProjects } from '@/lib/projects-context'

type Step = 'info' | 'permissions'
type Preset = 'read_only' | 'full_access' | 'custom'
type Expiration = 'never' | '90d' | '1y' | 'custom'

interface Props {
  open: boolean
  onClose: () => void
  onCreated: (created: { key: ApiKeyShape; plaintext: string }) => void
  projectId?: string
}

export function CreateApiKeyDialog({ open, onClose, onCreated, projectId }: Props) {
  const { toast } = useToast()
  const { projects } = useProjects()
  const [step, setStep] = useState<Step>('info')
  const [name, setName] = useState('')
  const [expiration, setExpiration] = useState<Expiration>('never')
  const [customExpiry, setCustomExpiry] = useState('')
  const [ipsEnabled, setIpsEnabled] = useState(false)
  const [allowedIps, setAllowedIps] = useState<string[]>([])
  const [ipDraft, setIpDraft] = useState('')
  const [ipError, setIpError] = useState<string | null>(null)
  const [preset, setPreset] = useState<Preset>('read_only')
  const [customScopes, setCustomScopes] = useState<Set<string>>(new Set())
  const [catalog, setCatalog] = useState<ScopesCatalog | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    setStep('info')
    setName('')
    setExpiration('never')
    setCustomExpiry('')
    setIpsEnabled(false)
    setAllowedIps([])
    setIpDraft('')
    setIpError(null)
    setPreset('read_only')
    setCustomScopes(new Set())
  }, [open])

  useEffect(() => {
    if (!open || catalog) return
    apiKeysClient.catalog().then((res) => {
      if (res.data?.data) setCatalog(res.data.data)
    })
  }, [open, catalog])

  function resolvedScopes(): string[] {
    if (!catalog) return []
    if (preset === 'read_only') return catalog.presets.read_only
    if (preset === 'full_access') return catalog.presets.full_access
    return Array.from(customScopes)
  }

  function isValidIpOrCidr(input: string): boolean {
    const value = input.trim()
    if (!value) return false
    // Allow IPv4 or IPv4/CIDR or IPv6 short form (loose check)
    const ipv4 = /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d?\d)(?:\/(3[0-2]|[12]?\d))?$/
    const ipv6 = /^[0-9a-fA-F:]+(\/\d{1,3})?$/
    return ipv4.test(value) || (ipv6.test(value) && value.includes(':'))
  }

  function addIp() {
    const v = ipDraft.trim()
    if (!v) return
    if (!isValidIpOrCidr(v)) {
      setIpError("Format IP/CIDR invalide")
      return
    }
    if (allowedIps.includes(v)) {
      setIpError('Cette IP est déjà dans la liste')
      return
    }
    setAllowedIps((prev) => [...prev, v])
    setIpDraft('')
    setIpError(null)
  }

  function removeIp(ip: string) {
    setAllowedIps((prev) => prev.filter((x) => x !== ip))
  }

  function toggleScope(scope: string) {
    setCustomScopes((prev) => {
      const next = new Set(prev)
      if (next.has(scope)) next.delete(scope)
      else next.add(scope)
      return next
    })
  }

  async function handleSubmit() {
    if (!name.trim()) {
      toast('Le nom est requis', 'error')
      return
    }
    const scopes = resolvedScopes()
    if (scopes.length === 0) {
      toast('Sélectionnez au moins une permission', 'error')
      return
    }
    const effectiveProjectId =
      projectId ??
      projects?.find((p) => p.is_default)?.id ??
      projects?.[0]?.id
    if (!effectiveProjectId) {
      toast('Aucun projet disponible. Créez-en un avant de générer une clé.', 'error')
      return
    }
    let expiresAt: string | undefined
    if (expiration === '90d') {
      expiresAt = new Date(Date.now() + 90 * 24 * 3600 * 1000).toISOString()
    } else if (expiration === '1y') {
      expiresAt = new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString()
    } else if (expiration === 'custom') {
      if (!customExpiry) {
        toast("Date d'expiration requise", 'error')
        return
      }
      const d = new Date(customExpiry)
      if (Number.isNaN(d.getTime()) || d.getTime() <= Date.now()) {
        toast("La date d'expiration doit être future", 'error')
        return
      }
      expiresAt = d.toISOString()
    }

    const effectiveIps = ipsEnabled ? allowedIps : []

    setSubmitting(true)
    const res = await apiKeysClient.create({
      project_id: effectiveProjectId,
      name: name.trim(),
      scopes,
      expires_at: expiresAt,
      allowed_ips: effectiveIps.length > 0 ? effectiveIps : undefined,
    })
    setSubmitting(false)
    if (res.error || !res.data?.data) {
      toast(res.error || 'Échec de la création', 'error')
      return
    }
    onCreated({ key: res.data.data, plaintext: res.data.plaintext })
  }

  return (
    <Dialog open={open} onClose={onClose} className="max-w-xl">
      <DialogHeader onClose={onClose}>
        <DialogTitle>Créer une clé API</DialogTitle>
        <DialogDescription>
          {step === 'info'
            ? 'Donnez un nom à votre clé et configurez ses options de sécurité.'
            : 'Choisissez quelles ressources cette clé pourra lire ou modifier.'}
        </DialogDescription>
      </DialogHeader>

      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
        <span className={step === 'info' ? 'text-foreground font-medium' : ''}>1. Infos</span>
        <span aria-hidden>›</span>
        <span className={step === 'permissions' ? 'text-foreground font-medium' : ''}>
          2. Permissions
        </span>
      </div>

      <Separator className="my-4" />

      <AnimatePresence mode="wait">
        {step === 'info' ? (
          <motion.div
            key="info"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 8 }}
            transition={{ duration: 0.15 }}
            className="space-y-4"
          >
            <Field>
              <FieldLabel htmlFor="key-name">Nom</FieldLabel>
              <Input
                id="key-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Production Zapier"
                autoFocus
              />
              <FieldDescription>
                Aide à identifier cette clé dans les logs et l&apos;audit.
              </FieldDescription>
            </Field>

            <Field>
              <FieldLabel htmlFor="expiration-select">Expiration</FieldLabel>
              <FormSelect
                id="expiration-select"
                value={expiration}
                onChange={(v) => setExpiration(v as Expiration)}
                options={[
                  { value: 'never', label: 'Jamais' },
                  { value: '90d', label: '90 jours' },
                  { value: '1y', label: '1 an' },
                  { value: 'custom', label: 'Personnalisé…' },
                ]}
              />
              {expiration === 'custom' && (
                <div className="mt-2">
                  <Input
                    type="date"
                    value={customExpiry}
                    min={new Date(Date.now() + 24 * 3600 * 1000).toISOString().slice(0, 10)}
                    onChange={(e) => setCustomExpiry(e.target.value)}
                  />
                  <FieldDescription>Choisissez la date d&apos;expiration de la clé.</FieldDescription>
                </div>
              )}
            </Field>

            <Field>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <FieldLabel>Restreindre par IP</FieldLabel>
                  <FieldDescription>
                    Limiter l&apos;usage de cette clé à certaines IP ou plages CIDR.
                  </FieldDescription>
                </div>
                <div className="pt-1 shrink-0">
                  <Switch
                    checked={ipsEnabled}
                    onChange={(v) => {
                      setIpsEnabled(v)
                      if (!v) {
                        setAllowedIps([])
                        setIpDraft('')
                        setIpError(null)
                      }
                    }}
                  />
                </div>
              </div>
              {ipsEnabled && (
                <div className="mt-3 space-y-2">
                  <div className="flex gap-2">
                    <Input
                      value={ipDraft}
                      onChange={(e) => {
                        setIpDraft(e.target.value)
                        if (ipError) setIpError(null)
                      }}
                      placeholder="192.168.1.0/24"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addIp()
                        }
                      }}
                    />
                    <Button type="button" variant="outline" onClick={addIp} disabled={!ipDraft.trim()}>
                      <Plus className="h-4 w-4 mr-1.5" />
                      Ajouter
                    </Button>
                  </div>
                  {ipError && <p className="text-xs text-danger">{ipError}</p>}
                  {allowedIps.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 rounded-lg border border-border/50 bg-surface p-2.5">
                      {allowedIps.map((ip) => (
                        <span
                          key={ip}
                          className="inline-flex items-center gap-1.5 rounded-md border border-border/50 bg-field px-2 py-1 font-mono text-xs text-foreground"
                        >
                          {ip}
                          <button
                            type="button"
                            onClick={() => removeIp(ip)}
                            aria-label={`Retirer ${ip}`}
                            className="rounded p-0.5 text-muted-foreground hover:bg-surface-hover hover:text-foreground"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </Field>
          </motion.div>
        ) : (
          <motion.div
            key="permissions"
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.15 }}
            className="space-y-4"
          >
            <Field>
              <FieldLabel htmlFor="preset-select">Préréglage</FieldLabel>
              <FormSelect
                id="preset-select"
                value={preset}
                onChange={(v) => setPreset(v as Preset)}
                options={[
                  {
                    value: 'read_only',
                    label: 'Lecture seule · accès en lecture sur toutes les ressources',
                  },
                  {
                    value: 'full_access',
                    label: 'Accès complet · lecture + écriture + suppression',
                  },
                  {
                    value: 'custom',
                    label: 'Personnalisé · sélectionner les scopes un par un',
                  },
                ]}
              />
              <FieldDescription>
                {preset === 'read_only' && 'Idéal pour les intégrations qui consultent vos données sans les modifier (BI, exports).'}
                {preset === 'full_access' && 'Donnez ces clés uniquement à des intégrations de confiance — elles peuvent tout faire.'}
                {preset === 'custom' && 'Cochez exactement les permissions dont votre intégration a besoin.'}
              </FieldDescription>
            </Field>

            {catalog === null ? (
              <div className="flex justify-center py-8">
                <Spinner />
              </div>
            ) : preset === 'custom' ? (
              <div className="max-h-72 overflow-y-auto rounded-lg border border-border/50 bg-surface p-3">
                {catalog.resources.map((res) => (
                  <div key={res.name} className="mb-4 last:mb-0">
                    <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {res.name.replace(/_/g, ' ')}
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {res.scopes.map((scope) => {
                        const active = customScopes.has(scope)
                        return (
                          <button
                            key={scope}
                            type="button"
                            onClick={() => toggleScope(scope)}
                            className={`rounded-md border px-2 py-1 font-mono text-xs transition-colors ${
                              active
                                ? 'border-accent bg-accent-soft text-foreground'
                                : 'border-border/50 hover:bg-surface-hover'
                            }`}
                          >
                            {active && <Check className="mr-1 inline-block h-3 w-3" />}
                            {scope}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-border/50 bg-surface p-3">
                <p className="mb-2 text-xs font-medium text-foreground">
                  {resolvedScopes().length} permission{resolvedScopes().length > 1 ? 's' : ''}{' '}
                  accordée{resolvedScopes().length > 1 ? 's' : ''}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {resolvedScopes().slice(0, 12).map((s) => (
                    <Badge key={s} variant="soft" size="sm">
                      {s}
                    </Badge>
                  ))}
                  {resolvedScopes().length > 12 && (
                    <span className="text-xs text-muted-foreground">
                      +{resolvedScopes().length - 12} autres
                    </span>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <DialogFooter>
        {step === 'permissions' && (
          <Button variant="outline" onClick={() => setStep('info')} disabled={submitting}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
        )}
        <Button variant="outline" onClick={onClose} disabled={submitting}>
          Annuler
        </Button>
        {step === 'info' ? (
          <Button onClick={() => setStep('permissions')} disabled={!name.trim()}>
            Suivant
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={submitting || resolvedScopes().length === 0}
          >
            {submitting ? (
              <>
                <Spinner />
                Création...
              </>
            ) : (
              'Créer la clé'
            )}
          </Button>
        )}
      </DialogFooter>
    </Dialog>
  )
}
