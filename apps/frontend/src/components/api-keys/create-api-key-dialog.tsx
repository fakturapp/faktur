'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, ChevronRight, Eye, Plus, Sparkles, Lock, ListFilter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { useToast } from '@/components/ui/toast'
import { apiKeysClient, type ApiKeyShape, type ScopesCatalog } from '@/lib/api-keys-client'

const fade = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.2 },
}

type Step = 'info' | 'scopes'
type Preset = 'read_only' | 'read_write' | 'full_access' | 'custom'

interface Props {
  open: boolean
  onClose: () => void
  onCreated: (created: { key: ApiKeyShape; plaintext: string }) => void
}

export function CreateApiKeyDialog({ open, onClose, onCreated }: Props) {
  const { toast } = useToast()
  const [step, setStep] = useState<Step>('info')
  const [name, setName] = useState('')
  const [expiration, setExpiration] = useState<'never' | '90d' | '1y'>('never')
  const [allowedIpsRaw, setAllowedIpsRaw] = useState('')
  const [preset, setPreset] = useState<Preset>('read_write')
  const [customScopes, setCustomScopes] = useState<Set<string>>(new Set())
  const [catalog, setCatalog] = useState<ScopesCatalog | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    setStep('info')
    setName('')
    setExpiration('never')
    setAllowedIpsRaw('')
    setPreset('read_write')
    setCustomScopes(new Set())
  }, [open])

  useEffect(() => {
    if (!open || catalog) return
    apiKeysClient.catalog().then((res) => {
      if (res.data?.data) setCatalog(res.data.data)
    })
  }, [open, catalog])

  if (!open) return null

  function resolvedScopes(): string[] {
    if (!catalog) return []
    if (preset === 'read_only') return catalog.presets.read_only
    if (preset === 'read_write') return catalog.presets.read_write
    if (preset === 'full_access') return catalog.presets.full_access
    return Array.from(customScopes)
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
      toast('Name is required', 'error')
      return
    }
    const scopes = resolvedScopes()
    if (scopes.length === 0) {
      toast('Select at least one scope', 'error')
      return
    }
    const expiresAt =
      expiration === '90d'
        ? new Date(Date.now() + 90 * 24 * 3600 * 1000).toISOString()
        : expiration === '1y'
          ? new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString()
          : undefined

    const allowedIps = allowedIpsRaw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)

    setSubmitting(true)
    const res = await apiKeysClient.create({
      name: name.trim(),
      scopes,
      expires_at: expiresAt,
      allowed_ips: allowedIps.length > 0 ? allowedIps : undefined,
    })
    setSubmitting(false)
    if (res.error || !res.data?.data) {
      toast(res.error || 'Failed to create key', 'error')
      return
    }
    onCreated({ key: res.data.data, plaintext: res.data.plaintext })
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.97 }}
          className="w-full max-w-2xl rounded-2xl border bg-background p-6 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 p-2">
                <Plus className="size-4 text-violet-500" />
              </div>
              <h2 className="text-lg font-semibold">Create an API key</h2>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className={step === 'info' ? 'font-semibold text-foreground' : ''}>Info</span>
              <ChevronRight className="size-3" />
              <span className={step === 'scopes' ? 'font-semibold text-foreground' : ''}>
                Permissions
              </span>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {step === 'info' ? (
              <motion.div key="info" {...fade} className="mt-6 space-y-5">
                <div>
                  <label className="text-sm font-medium">Name *</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoFocus
                    placeholder="Production Zapier"
                    className="mt-2 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Helps identify this key in logs and audit trails.
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium">Expiration</label>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {[
                      { v: 'never', label: 'Never' },
                      { v: '90d', label: '90 days' },
                      { v: '1y', label: '1 year' },
                    ].map((opt) => (
                      <button
                        key={opt.v}
                        type="button"
                        onClick={() => setExpiration(opt.v as typeof expiration)}
                        className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                          expiration === opt.v
                            ? 'border-violet-500/60 bg-violet-500/10 text-foreground'
                            : 'hover:bg-muted/50'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">IP allowlist (optional)</label>
                  <input
                    value={allowedIpsRaw}
                    onChange={(e) => setAllowedIpsRaw(e.target.value)}
                    placeholder="12.34.56.0/24, 78.90.12.34"
                    className="mt-2 w-full rounded-lg border bg-background px-3 py-2 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/40"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Comma-separated IPs or CIDR blocks. Leave empty to allow all sources.
                  </p>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="ghost" onPress={onClose}>
                    Cancel
                  </Button>
                  <Button
                    onPress={() => setStep('scopes')}
                    isDisabled={!name.trim()}
                    endContent={<ChevronRight className="size-4" />}
                  >
                    Next
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div key="scopes" {...fade} className="mt-6 space-y-5">
                <div>
                  <label className="text-sm font-medium">Permissions preset</label>
                  <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {[
                      { v: 'read_only' as const, label: 'Read only', icon: Eye },
                      { v: 'read_write' as const, label: 'Read + write', icon: ListFilter },
                      { v: 'full_access' as const, label: 'Full access', icon: Sparkles },
                      { v: 'custom' as const, label: 'Custom', icon: Lock },
                    ].map((opt) => {
                      const Icon = opt.icon
                      return (
                        <button
                          key={opt.v}
                          type="button"
                          onClick={() => setPreset(opt.v)}
                          className={`flex flex-col items-center gap-2 rounded-lg border p-3 text-xs transition-colors ${
                            preset === opt.v
                              ? 'border-violet-500/60 bg-violet-500/10'
                              : 'hover:bg-muted/50'
                          }`}
                        >
                          <Icon className="size-4 text-violet-500" />
                          <span>{opt.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {catalog === null ? (
                  <div className="flex items-center justify-center py-10">
                    <Spinner />
                  </div>
                ) : preset === 'custom' ? (
                  <div className="max-h-72 overflow-y-auto rounded-lg border p-3">
                    {catalog.resources.map((res) => (
                      <div key={res.name} className="mb-3 last:mb-0">
                        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
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
                                    ? 'border-violet-500/60 bg-violet-500/15 text-foreground'
                                    : 'hover:bg-muted/50'
                                }`}
                              >
                                {active && <Check className="mr-1 inline-block size-3" />}
                                {scope}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
                    <p className="mb-2 font-medium text-foreground">
                      {resolvedScopes().length} scope{resolvedScopes().length > 1 ? 's' : ''} will be granted
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {resolvedScopes().slice(0, 12).map((s) => (
                        <code key={s} className="rounded bg-background px-1.5 py-0.5">
                          {s}
                        </code>
                      ))}
                      {resolvedScopes().length > 12 && (
                        <span>+ {resolvedScopes().length - 12} more</span>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex justify-between gap-2">
                  <Button variant="ghost" onPress={() => setStep('info')}>
                    Back
                  </Button>
                  <Button
                    onPress={handleSubmit}
                    isLoading={submitting}
                    isDisabled={submitting || resolvedScopes().length === 0}
                  >
                    Create key
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
