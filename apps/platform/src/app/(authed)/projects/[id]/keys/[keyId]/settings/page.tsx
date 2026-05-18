'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  AlertTriangle,
  Ban,
  Pencil,
  Plus,
  RefreshCw,
  Settings,
  Shield,
  Trash2,
  X,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Field, FieldLabel, FieldDescription } from '@/components/ui/field'
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  CheckboxRoot,
  CheckboxControl,
  CheckboxIndicator,
} from '@/components/ui/checkbox'
import { EditableField } from '@/components/ui/editable-field'
import { useToast } from '@/components/ui/toast'
import { useApiKey } from '@/lib/api-key-context'
import { apiKeysClient, type ScopesCatalog } from '@/lib/api-keys-client'
import { humanizeScope } from '@/lib/scopes-humanizer'
import { RevealedKeyDialog } from '@/components/api-keys/revealed-key-dialog'

function isValidIpOrCidr(input: string): boolean {
  const v = input.trim()
  if (!v) return false
  const ipv4 = /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d?\d)(?:\/(3[0-2]|[12]?\d))?$/
  const ipv6 = /^[0-9a-fA-F:]+(\/\d{1,3})?$/
  return ipv4.test(v) || (ipv6.test(v) && v.includes(':'))
}

export default function ApiKeySettingsPage() {
  const params = useParams<{ id: string; keyId: string }>()
  const router = useRouter()
  const { toast } = useToast()
  const { apiKey, reload } = useApiKey()

  const [scopesOpen, setScopesOpen] = useState(false)
  const [ipsOpen, setIpsOpen] = useState(false)
  const [catalog, setCatalog] = useState<ScopesCatalog | null>(null)

  const [confirmRevoke, setConfirmRevoke] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [confirmRotate, setConfirmRotate] = useState(false)
  const [revoking, setRevoking] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [rotating, setRotating] = useState(false)
  const [rotated, setRotated] = useState<{ plaintext: string } | null>(null)

  useEffect(() => {
    if (catalog) return
    apiKeysClient.catalog().then((res) => {
      if (res.data?.data) setCatalog(res.data.data)
    })
  }, [catalog])

  async function saveName(name: string): Promise<boolean> {
    if (!apiKey) return false
    const res = await apiKeysClient.update(apiKey.id, { name })
    if (res.error) {
      toast(res.error, 'error')
      return false
    }
    toast('Nom modifié', 'success')
    await reload()
    return true
  }

  async function saveScopes(scopes: string[]): Promise<boolean> {
    if (!apiKey) return false
    const res = await apiKeysClient.update(apiKey.id, { scopes })
    if (res.error) {
      toast(res.error, 'error')
      return false
    }
    toast('Permissions mises à jour', 'success')
    await reload()
    return true
  }

  async function saveIps(ips: string[] | null): Promise<boolean> {
    if (!apiKey) return false
    const res = await apiKeysClient.update(apiKey.id, { allowed_ips: ips })
    if (res.error) {
      toast(res.error, 'error')
      return false
    }
    toast('Restrictions IP mises à jour', 'success')
    await reload()
    return true
  }

  async function handleRotate() {
    if (!apiKey) return
    setRotating(true)
    setConfirmRotate(false)
    const res = await apiKeysClient.rotate(apiKey.id)
    setRotating(false)
    if (res.error || !res.data?.plaintext) {
      toast(res.error || 'Échec de la réinitialisation', 'error')
      return
    }
    toast('Clé réinitialisée', 'success')
    setRotated({ plaintext: res.data.plaintext })
    await reload()
  }

  async function handleRevoke() {
    if (!apiKey) return
    setRevoking(true)
    const res = await apiKeysClient.revoke(apiKey.id)
    setRevoking(false)
    if (res.error) {
      toast(res.error, 'error')
      return
    }
    toast('Clé révoquée', 'success')
    setConfirmRevoke(false)
    await reload()
  }

  async function handleDestroy() {
    if (!apiKey) return
    setDeleting(true)
    const res = await apiKeysClient.destroy(apiKey.id)
    setDeleting(false)
    if (res.error) {
      toast(res.error, 'error')
      return
    }
    toast('Clé supprimée définitivement', 'success')
    setConfirmDelete(false)
    router.replace(`/projects/${params.id}`)
  }

  if (!apiKey) {
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

  const isRevoked = apiKey.status === 'revoked'

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center gap-2">
        <Settings className="h-5 w-5 text-accent" />
        <h2 className="text-lg font-bold text-foreground">Paramètres de la clé</h2>
      </div>

      <Card className="border-border/50">
        <CardContent className="p-5 space-y-5">
          <EditableField
            label="Nom"
            value={apiKey.name}
            required
            modalTitle="Renommer la clé API"
            placeholder="Production Zapier"
            onSave={saveName}
          />

          <ReadOnlyField
            label="Permissions"
            description={`${apiKey.scopes.length} scope${apiKey.scopes.length > 1 ? 's' : ''} accordé${apiKey.scopes.length > 1 ? 's' : ''}.`}
            onEdit={isRevoked ? undefined : () => setScopesOpen(true)}
            empty={apiKey.scopes.length === 0}
            emptyText="Aucune permission"
          >
            <div className="flex flex-wrap gap-1.5">
              {apiKey.scopes.slice(0, 20).map((s) => (
                <code
                  key={s}
                  className="rounded-md border border-border/50 bg-field px-2 py-0.5 font-mono text-[11px] text-foreground"
                >
                  {s}
                </code>
              ))}
              {apiKey.scopes.length > 20 && (
                <span className="text-xs text-muted-foreground">
                  +{apiKey.scopes.length - 20} autres
                </span>
              )}
            </div>
          </ReadOnlyField>

          <ReadOnlyField
            label="Restrictions IP"
            description={
              apiKey.allowed_ips && apiKey.allowed_ips.length > 0
                ? `${apiKey.allowed_ips.length} IP/CIDR autorisée${apiKey.allowed_ips.length > 1 ? 's' : ''}.`
                : 'Toutes les sources autorisées.'
            }
            onEdit={isRevoked ? undefined : () => setIpsOpen(true)}
            empty={!apiKey.allowed_ips || apiKey.allowed_ips.length === 0}
            emptyText="Aucune restriction"
          >
            <div className="flex flex-wrap gap-1.5">
              {(apiKey.allowed_ips ?? []).map((ip) => (
                <code
                  key={ip}
                  className="rounded-md border border-border/50 bg-field px-2 py-0.5 font-mono text-[11px] text-foreground"
                >
                  {ip}
                </code>
              ))}
            </div>
          </ReadOnlyField>
        </CardContent>
      </Card>

      <Card className="border-danger/30 bg-danger/5">
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-danger" />
            <h3 className="text-sm font-semibold text-foreground">Zone dangereuse</h3>
          </div>

          <ActionRow
            title="Réinitialiser la clé"
            description="Un nouveau secret est généré. L'ancien est invalidé après une courte période de grâce."
            disabled={isRevoked}
          >
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmRotate(true)}
              disabled={isRevoked || rotating}
            >
              {rotating ? <Spinner /> : <RefreshCw className="h-3.5 w-3.5 mr-1.5" />}
              Réinitialiser
            </Button>
          </ActionRow>

          <ActionRow
            title="Révoquer la clé"
            description="La clé devient inutilisable immédiatement. L'historique est conservé."
            disabled={isRevoked}
          >
            <Button
              variant="danger"
              size="sm"
              onClick={() => setConfirmRevoke(true)}
              disabled={isRevoked || revoking}
            >
              {revoking ? <Spinner /> : <Ban className="h-3.5 w-3.5 mr-1.5" />}
              Révoquer
            </Button>
          </ActionRow>

          <ActionRow
            title="Supprimer définitivement"
            description="Supprime la clé de la base de données. L'historique audit reste mais sans référence."
          >
            <Button
              variant="danger"
              size="sm"
              onClick={() => setConfirmDelete(true)}
              disabled={deleting}
            >
              {deleting ? <Spinner /> : <Trash2 className="h-3.5 w-3.5 mr-1.5" />}
              Supprimer
            </Button>
          </ActionRow>
        </CardContent>
      </Card>

      <EditScopesDialog
        open={scopesOpen}
        onClose={() => setScopesOpen(false)}
        catalog={catalog}
        currentScopes={apiKey.scopes}
        onSave={async (next) => {
          const ok = await saveScopes(next)
          if (ok) setScopesOpen(false)
        }}
      />

      <EditIpsDialog
        open={ipsOpen}
        onClose={() => setIpsOpen(false)}
        currentIps={apiKey.allowed_ips}
        onSave={async (next) => {
          const ok = await saveIps(next.length === 0 ? null : next)
          if (ok) setIpsOpen(false)
        }}
      />

      <Dialog open={confirmRotate} onClose={() => !rotating && setConfirmRotate(false)} className="max-w-md">
        <DialogHeader onClose={() => setConfirmRotate(false)}>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Réinitialiser la clé ?
          </DialogTitle>
          <DialogDescription>
            Un nouveau secret sera généré. L&apos;ancien continue de fonctionner pendant une
            courte période de grâce.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setConfirmRotate(false)} disabled={rotating}>
            Annuler
          </Button>
          <Button onClick={handleRotate} disabled={rotating}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Réinitialiser
          </Button>
        </DialogFooter>
      </Dialog>

      <Dialog open={confirmRevoke} onClose={() => !revoking && setConfirmRevoke(false)} className="max-w-md">
        <DialogHeader onClose={() => setConfirmRevoke(false)}>
          <DialogTitle className="flex items-center gap-2 text-danger">
            <AlertTriangle className="h-5 w-5" />
            Révoquer « {apiKey.name} » ?
          </DialogTitle>
          <DialogDescription>
            La clé cessera de fonctionner immédiatement. L&apos;action est irréversible mais
            l&apos;historique d&apos;audit est conservé.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setConfirmRevoke(false)} disabled={revoking}>
            Annuler
          </Button>
          <Button variant="danger" onClick={handleRevoke} disabled={revoking}>
            <Ban className="h-4 w-4 mr-2" />
            Révoquer
          </Button>
        </DialogFooter>
      </Dialog>

      <ConfirmDestroyDialog
        open={confirmDelete}
        onClose={() => !deleting && setConfirmDelete(false)}
        keyName={apiKey.name}
        deleting={deleting}
        onConfirm={handleDestroy}
      />

      <RevealedKeyDialog
        open={rotated !== null}
        plaintext={rotated?.plaintext ?? ''}
        keyName={apiKey.name}
        kind="api_key"
        onClose={() => setRotated(null)}
      />
    </motion.div>
  )
}

function ReadOnlyField({
  label,
  description,
  onEdit,
  empty,
  emptyText,
  children,
}: {
  label: string
  description?: string
  onEdit?: () => void
  empty: boolean
  emptyText: string
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-surface-hover hover:text-foreground"
          >
            <Pencil className="h-3 w-3" />
            Modifier
          </button>
        )}
      </div>
      <div className="rounded-lg border border-border/50 bg-surface p-3">
        {empty ? (
          <p className="text-xs italic text-muted-foreground">{emptyText}</p>
        ) : (
          children
        )}
      </div>
      {description && (
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  )
}

function ActionRow({
  title,
  description,
  disabled,
  children,
}: {
  title: string
  description: string
  disabled?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-border/30 bg-card p-3">
      <div className={'min-w-0 flex-1 ' + (disabled ? 'opacity-50' : '')}>
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

function EditScopesDialog({
  open,
  onClose,
  catalog,
  currentScopes,
  onSave,
}: {
  open: boolean
  onClose: () => void
  catalog: ScopesCatalog | null
  currentScopes: string[]
  onSave: (next: string[]) => Promise<void>
}) {
  const [selection, setSelection] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setSelection(new Set(currentScopes))
      setSearch('')
    }
  }, [open, currentScopes])

  const filtered = useMemo(() => {
    if (!catalog) return []
    const q = search.trim().toLowerCase()
    return catalog.resources
      .map((res) => ({
        ...res,
        scopes: res.scopes.filter((s) => {
          if (!q) return true
          const { label } = humanizeScope(s)
          return s.toLowerCase().includes(q) || label.toLowerCase().includes(q)
        }),
      }))
      .filter((r) => r.scopes.length > 0)
  }, [catalog, search])

  function toggle(scope: string) {
    setSelection((prev) => {
      const next = new Set(prev)
      if (next.has(scope)) next.delete(scope)
      else next.add(scope)
      return next
    })
  }

  async function handleSave() {
    setSaving(true)
    try {
      await onSave(Array.from(selection))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={() => !saving && onClose()} className="max-w-xl">
      <DialogHeader onClose={onClose}>
        <DialogTitle>Modifier les permissions</DialogTitle>
        <DialogDescription>
          Cochez les permissions que cette clé peut utiliser.
        </DialogDescription>
      </DialogHeader>

      <div className="mt-3 space-y-3">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher (devis, clients:read…)"
        />
        <p className="text-xs text-muted-foreground">
          {selection.size} sélectionnée{selection.size > 1 ? 's' : ''}
        </p>
        {!catalog ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto rounded-lg border border-border/50 bg-surface">
            {filtered.length === 0 ? (
              <p className="px-4 py-6 text-center text-xs text-muted-foreground">
                Aucune permission ne correspond à « {search} ».
              </p>
            ) : (
              filtered.map((res) => (
                <div key={res.name} className="border-b border-border/40 last:border-0">
                  <div className="bg-field/60 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {humanizeScope(`${res.name}:read`).resource}
                  </div>
                  <div className="divide-y divide-border/30">
                    {res.scopes.map((scope) => {
                      const active = selection.has(scope)
                      const { action } = humanizeScope(scope)
                      return (
                        <CheckboxRoot
                          key={scope}
                          isSelected={active}
                          onChange={() => toggle(scope)}
                          className="flex w-full cursor-pointer items-center gap-3 px-3 py-2.5 transition-colors hover:bg-surface-hover"
                        >
                          <CheckboxControl>
                            <CheckboxIndicator />
                          </CheckboxControl>
                          <span className="min-w-0 flex-1 text-sm text-foreground">
                            {action || scope}
                          </span>
                          <code className="shrink-0 font-mono text-[11px] text-muted-foreground">
                            {scope}
                          </code>
                        </CheckboxRoot>
                      )
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onClose} disabled={saving}>
          Annuler
        </Button>
        <Button onClick={handleSave} disabled={saving || selection.size === 0}>
          {saving ? (
            <>
              <Spinner />
              Enregistrement...
            </>
          ) : (
            'Enregistrer'
          )}
        </Button>
      </DialogFooter>
    </Dialog>
  )
}

function EditIpsDialog({
  open,
  onClose,
  currentIps,
  onSave,
}: {
  open: boolean
  onClose: () => void
  currentIps: string[] | null
  onSave: (next: string[]) => Promise<void>
}) {
  const [enabled, setEnabled] = useState(false)
  const [ips, setIps] = useState<string[]>([])
  const [draft, setDraft] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      const initial = currentIps ?? []
      setEnabled(initial.length > 0)
      setIps(initial)
      setDraft('')
      setError(null)
    }
  }, [open, currentIps])

  function addIp() {
    const v = draft.trim()
    if (!v) return
    if (!isValidIpOrCidr(v)) {
      setError('Format IP/CIDR invalide')
      return
    }
    if (ips.includes(v)) {
      setError('Cette IP est déjà dans la liste')
      return
    }
    setIps((prev) => [...prev, v])
    setDraft('')
    setError(null)
  }

  function removeIp(ip: string) {
    setIps((prev) => prev.filter((x) => x !== ip))
  }

  async function handleSave() {
    setSaving(true)
    try {
      await onSave(enabled ? ips : [])
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={() => !saving && onClose()} className="max-w-md">
      <DialogHeader onClose={onClose}>
        <DialogTitle>Modifier les restrictions IP</DialogTitle>
        <DialogDescription>
          Limitez l&apos;usage de cette clé à certaines adresses IP ou plages CIDR.
        </DialogDescription>
      </DialogHeader>

      <div className="mt-3 space-y-3">
        <Field>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <FieldLabel>Restreindre par IP</FieldLabel>
              <FieldDescription>
                Désactivé = toutes les sources autorisées.
              </FieldDescription>
            </div>
            <div className="pt-1 shrink-0">
              <Switch
                checked={enabled}
                onChange={(v) => {
                  setEnabled(v)
                  if (!v) {
                    setIps([])
                    setDraft('')
                    setError(null)
                  }
                }}
              />
            </div>
          </div>
        </Field>

        {enabled && (
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                value={draft}
                onChange={(e) => {
                  setDraft(e.target.value)
                  if (error) setError(null)
                }}
                placeholder="192.168.1.0/24"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addIp()
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={addIp} disabled={!draft.trim()}>
                <Plus className="h-4 w-4 mr-1.5" />
                Ajouter
              </Button>
            </div>
            {error && <p className="text-xs text-danger">{error}</p>}
            {ips.length > 0 && (
              <div className="flex flex-wrap gap-1.5 rounded-lg border border-border/50 bg-surface p-2.5">
                {ips.map((ip) => (
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
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onClose} disabled={saving}>
          Annuler
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Spinner />
              Enregistrement...
            </>
          ) : (
            'Enregistrer'
          )}
        </Button>
      </DialogFooter>
    </Dialog>
  )
}

function ConfirmDestroyDialog({
  open,
  onClose,
  keyName,
  deleting,
  onConfirm,
}: {
  open: boolean
  onClose: () => void
  keyName: string
  deleting: boolean
  onConfirm: () => void
}) {
  const [text, setText] = useState('')

  useEffect(() => {
    if (open) setText('')
  }, [open])

  return (
    <Dialog open={open} onClose={() => !deleting && onClose()} className="max-w-md">
      <DialogHeader showClose={false}>
        <DialogTitle className="flex items-center gap-2 text-danger">
          <AlertTriangle className="h-5 w-5" />
          Supprimer « {keyName} » ?
        </DialogTitle>
        <DialogDescription>
          La clé sera définitivement retirée de la base. Toute trace audit fera référence à
          une clé inexistante. Cette action est <strong>irréversible</strong>.
        </DialogDescription>
      </DialogHeader>
      <div className="mt-3">
        <Field>
          <FieldLabel htmlFor="confirm-text">
            Tape <strong>« {keyName} »</strong> pour confirmer
          </FieldLabel>
          <Input
            id="confirm-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={keyName}
            autoFocus
            disabled={deleting}
          />
        </Field>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose} disabled={deleting}>
          Annuler
        </Button>
        <Button
          variant="danger"
          onClick={onConfirm}
          disabled={deleting || text.trim() !== keyName.trim()}
        >
          {deleting ? (
            <>
              <Spinner />
              Suppression...
            </>
          ) : (
            <>
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer définitivement
            </>
          )}
        </Button>
      </DialogFooter>
    </Dialog>
  )
}
