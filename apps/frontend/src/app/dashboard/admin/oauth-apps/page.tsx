'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { api } from '@/lib/api'
import { Spinner } from '@/components/ui/spinner'
import { useToast } from '@/components/ui/toast'
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Copy,
  Check,
  RotateCw,
  Trash2,
  MoreHorizontal,
  ShieldCheck,
  ShieldAlert,
  Globe,
  Smartphone,
  Terminal,
  Users,
  Link2,
  AlertTriangle,
  Webhook,
  Key,
  Eye,
  EyeOff,
  Pencil,
} from 'lucide-react'
import { CheckboxRoot, CheckboxControl, CheckboxIndicator, CheckboxContent } from '@/components/ui/checkbox'

interface OauthApp {
  id: string
  name: string
  description: string | null
  iconUrl: string | null
  websiteUrl: string | null
  clientId: string
  redirectUris: string[]
  allowedOrigins: string[]
  allowAllOrigins: boolean
  scopes: string[]
  webhookUrl: string | null
  webhookEvents: string[] | null
  kind: 'desktop' | 'web' | 'cli' | 'mobile'
  isActive: boolean
  isFirstParty: boolean
  activeSessions: number
  createdAt: string
}

const AVAILABLE_SCOPES = [
  { id: 'profile', label: 'Profil', description: 'Lecture du nom et email' },
  { id: 'invoices:read', label: 'Factures (lecture)', description: 'Voir les factures' },
  { id: 'invoices:write', label: 'Factures (écriture)', description: 'Créer et modifier' },
  { id: 'clients:read', label: 'Clients (lecture)', description: 'Voir le carnet' },
  { id: 'clients:write', label: 'Clients (écriture)', description: 'Gérer les clients' },
  { id: 'vault:unlock', label: 'Coffre-fort', description: 'Débloquer le vault' },
  { id: 'offline_access', label: 'Accès hors-ligne', description: 'Refresh tokens' },
]

const ALL_SCOPE_IDS = AVAILABLE_SCOPES.map((s) => s.id)

const AVAILABLE_EVENTS = [
  'session.revoked',
  'token.issued',
  'token.refreshed',
  'vault.unlocked',
  'vault.locked',
  'authorization.granted',
  'authorization.revoked',
]

const KIND_META: Record<OauthApp['kind'], { label: string; icon: any; color: string }> = {
  desktop: { label: 'Bureau', icon: Terminal, color: 'bg-indigo-500/10 text-indigo-500' },
  web: { label: 'Web', icon: Globe, color: 'bg-emerald-500/10 text-emerald-500' },
  cli: { label: 'CLI', icon: Terminal, color: 'bg-amber-500/10 text-amber-500' },
  mobile: { label: 'Mobile', icon: Smartphone, color: 'bg-sky-500/10 text-sky-500' },
}

export default function AdminOauthAppsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const [apps, setApps] = useState<OauthApp[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [createdSecrets, setCreatedSecrets] = useState<{
    clientId: string
    clientSecret: string
    webhookSecret: string | null
    appName: string
  } | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<OauthApp | null>(null)
  const [confirmRevokeAll, setConfirmRevokeAll] = useState<OauthApp | null>(null)
  const [rotatingApp, setRotatingApp] = useState<OauthApp | null>(null)
  const [editingApp, setEditingApp] = useState<OauthApp | null>(null)

  useEffect(() => {
    if (user && !user.isAdmin) {
      router.replace('/dashboard')
    }
  }, [user, router])

  const loadApps = useCallback(async () => {
    const { data, error } = await api.get<{ apps: OauthApp[] }>('/admin/oauth-apps')
    if (error) {
      toast(error, 'error')
    } else if (data?.apps) {
      setApps(data.apps)
    }
    setLoading(false)
  }, [toast])

  useEffect(() => {
    loadApps()
  }, [loadApps])

  if (!user?.isAdmin) return null

  async function handleDelete(app: OauthApp) {
    const { error } = await api.delete(`/admin/oauth-apps/${app.id}`)
    if (error) {
      toast(error, 'error')
    } else {
      toast(`Application "${app.name}" supprimée`, 'success')
      await loadApps()
    }
    setConfirmDelete(null)
  }

  async function handleRevokeAllSessions(app: OauthApp) {
    const { data, error } = await api.post<{ revokedCount: number; message: string }>(
      `/admin/oauth-apps/${app.id}/revoke-sessions`,
      {}
    )
    if (error) {
      toast(error, 'error')
    } else {
      toast(data?.message || `Sessions révoquées`, 'success')
      await loadApps()
    }
    setConfirmRevokeAll(null)
  }

  async function handleToggleActive(app: OauthApp) {
    const { error } = await api.put(`/admin/oauth-apps/${app.id}`, { isActive: !app.isActive })
    if (error) {
      toast(error, 'error')
    } else {
      toast(app.isActive ? 'Application désactivée' : 'Application activée', 'success')
      await loadApps()
    }
  }

  async function handleRotateClientSecret(app: OauthApp) {
    const { data, error } = await api.post<{ clientSecret: string }>(
      `/admin/oauth-apps/${app.id}/rotate-secrets`,
      { client: true }
    )
    if (error) {
      toast(error, 'error')
      return
    }
    if (data?.clientSecret) {
      setCreatedSecrets({
        clientId: app.clientId,
        clientSecret: data.clientSecret,
        webhookSecret: null,
        appName: app.name,
      })
      toast('Nouveau client_secret généré', 'success')
    }
    setRotatingApp(null)
  }

  async function handleRotateWebhookSecret(app: OauthApp) {
    const { data, error } = await api.post<{ webhookSecret: string }>(
      `/admin/oauth-apps/${app.id}/rotate-secrets`,
      { webhook: true }
    )
    if (error) {
      toast(error, 'error')
      return
    }
    if (data?.webhookSecret) {
      setCreatedSecrets({
        clientId: app.clientId,
        clientSecret: '',
        webhookSecret: data.webhookSecret,
        appName: app.name,
      })
      toast('Nouveau webhook_secret généré', 'success')
    }
    setRotatingApp(null)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Applications OAuth</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gérez les applications tierces qui peuvent se connecter à Faktur via OAuth2.
          </p>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Nouvelle application
        </Button>
      </div>

      {/* Stats */}
      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatBlock
            icon={ShieldCheck}
            label="Applications actives"
            value={apps.filter((a) => a.isActive).length}
            total={apps.length}
            color="indigo"
          />
          <StatBlock
            icon={Users}
            label="Sessions en cours"
            value={apps.reduce((sum, a) => sum + a.activeSessions, 0)}
            color="emerald"
          />
          <StatBlock
            icon={Webhook}
            label="Webhooks configurés"
            value={apps.filter((a) => !!a.webhookUrl).length}
            color="violet"
          />
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" className="text-primary" />
        </div>
      ) : apps.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center">
          <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-2xl bg-primary/10 mb-4">
            <ShieldCheck className="h-7 w-7 text-primary" />
          </div>
          <h3 className="text-base font-semibold text-foreground">Aucune application OAuth</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4 max-w-sm mx-auto">
            Créez votre première application OAuth pour autoriser un client de bureau, une
            intégration web ou un outil en ligne de commande à se connecter à Faktur.
          </p>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Créer ma première application
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          <AnimatePresence>
            {apps.map((app, i) => (
              <AppRow
                key={app.id}
                app={app}
                index={i}
                onEdit={() => setEditingApp(app)}
                onDelete={() => setConfirmDelete(app)}
                onRevokeAll={() => setConfirmRevokeAll(app)}
                onToggleActive={() => handleToggleActive(app)}
                onRotate={() => setRotatingApp(app)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Create modal */}
      <OauthAppFormModal
        mode="create"
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(payload) => {
          setCreatedSecrets(payload)
          setCreateOpen(false)
          loadApps()
        }}
      />

      {/* Edit modal */}
      <OauthAppFormModal
        mode="edit"
        open={!!editingApp}
        existingApp={editingApp}
        onClose={() => setEditingApp(null)}
        onCreated={() => {
          setEditingApp(null)
          loadApps()
        }}
      />

      {/* Secret reveal modal */}
      <SecretRevealModal
        payload={createdSecrets}
        onClose={() => setCreatedSecrets(null)}
      />

      {/* Delete confirm */}
      <Dialog open={!!confirmDelete} onClose={() => setConfirmDelete(null)}>
        <DialogHeader showClose={false} icon={<Trash2 className="h-5 w-5 text-danger" />}>
          <DialogTitle>Supprimer cette application ?</DialogTitle>
          <DialogDescription>
            &quot;{confirmDelete?.name}&quot; sera définitivement supprimée. Tous les tokens
            actifs seront révoqués et les utilisateurs connectés seront déconnectés.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => setConfirmDelete(null)}>
            Annuler
          </Button>
          <Button variant="destructive" size="sm" onClick={() => confirmDelete && handleDelete(confirmDelete)}>
            Supprimer
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Revoke all sessions confirm */}
      <Dialog open={!!confirmRevokeAll} onClose={() => setConfirmRevokeAll(null)}>
        <DialogHeader showClose={false} icon={<ShieldAlert className="h-5 w-5 text-amber-500" />}>
          <DialogTitle>Révoquer toutes les sessions ?</DialogTitle>
          <DialogDescription>
            {confirmRevokeAll?.activeSessions} utilisateur(s) connecté(s) via &quot;
            {confirmRevokeAll?.name}&quot; seront immédiatement déconnectés. Un webhook{' '}
            <code className="text-[11px] px-1 rounded bg-muted">session.revoked</code> sera
            envoyé pour chaque session.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => setConfirmRevokeAll(null)}>
            Annuler
          </Button>
          <Button size="sm" onClick={() => confirmRevokeAll && handleRevokeAllSessions(confirmRevokeAll)}>
            Révoquer tout
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Rotate secrets modal */}
      <Dialog open={!!rotatingApp} onClose={() => setRotatingApp(null)}>
        <DialogHeader onClose={() => setRotatingApp(null)}>
          <DialogTitle>Régénérer les secrets</DialogTitle>
          <DialogDescription>
            Choisissez le secret à régénérer. L&apos;ancien sera immédiatement invalide.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <button
            onClick={() => rotatingApp && handleRotateClientSecret(rotatingApp)}
            className="w-full flex items-start gap-3 rounded-xl border border-border bg-card hover:bg-muted/40 p-3 text-left transition-colors"
          >
            <Key className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">client_secret</p>
              <p className="text-[11px] text-muted-foreground">
                Utilisé pour authentifier le client OAuth sur /oauth/token
              </p>
            </div>
          </button>
          {rotatingApp?.webhookUrl && (
            <button
              onClick={() => rotatingApp && handleRotateWebhookSecret(rotatingApp)}
              className="w-full flex items-start gap-3 rounded-xl border border-border bg-card hover:bg-muted/40 p-3 text-left transition-colors"
            >
              <Webhook className="h-4 w-4 text-violet-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">webhook_secret</p>
                <p className="text-[11px] text-muted-foreground">
                  Signe les payloads envoyés à {rotatingApp.webhookUrl}
                </p>
              </div>
            </button>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => setRotatingApp(null)}>
            Annuler
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  )
}

/* ─────────────── Stat block ─────────────── */

function StatBlock({
  icon: Icon,
  label,
  value,
  total,
  color,
}: {
  icon: any
  label: string
  value: number
  total?: number
  color: 'indigo' | 'emerald' | 'violet'
}) {
  const colorMap = {
    indigo: 'bg-indigo-500/10 text-indigo-500',
    emerald: 'bg-emerald-500/10 text-emerald-500',
    violet: 'bg-violet-500/10 text-violet-500',
  }
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-3">
        <div className={cn('flex h-11 w-11 items-center justify-center rounded-lg', colorMap[color])}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-2xl font-bold text-foreground">
            {value}
            {total !== undefined && (
              <span className="text-sm text-muted-foreground font-medium"> / {total}</span>
            )}
          </p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </div>
    </div>
  )
}

/* ─────────────── App row ─────────────── */

function AppRow({
  app,
  index,
  onEdit,
  onDelete,
  onRevokeAll,
  onToggleActive,
  onRotate,
}: {
  app: OauthApp
  index: number
  onEdit: () => void
  onDelete: () => void
  onRevokeAll: () => void
  onToggleActive: () => void
  onRotate: () => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [copiedId, setCopiedId] = useState(false)
  const kindMeta = KIND_META[app.kind]
  const KindIcon = kindMeta.icon

  function copyClientId() {
    navigator.clipboard.writeText(app.clientId)
    setCopiedId(true)
    setTimeout(() => setCopiedId(false), 1800)
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ delay: index * 0.03 }}
      className={cn(
        'rounded-2xl border bg-card p-5 relative',
        app.isActive ? 'border-border' : 'border-border/50 opacity-60'
      )}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div
          className={cn(
            'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl overflow-hidden',
            kindMeta.color
          )}
        >
          {app.iconUrl ? (
            <img src={app.iconUrl} alt={app.name} className="h-full w-full object-cover" />
          ) : (
            <KindIcon className="h-5 w-5" />
          )}
        </div>

        {/* Main info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-semibold text-foreground truncate">{app.name}</h3>
            <Badge variant={app.isActive ? 'success' : 'muted'} className="text-[10px]">
              {app.isActive ? 'Active' : 'Désactivée'}
            </Badge>
            {app.isFirstParty && (
              <Badge variant="default" className="text-[10px]">
                1st party
              </Badge>
            )}
            <span className="text-[10px] text-muted-foreground/70">{kindMeta.label}</span>
          </div>
          {app.description && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{app.description}</p>
          )}

          <div className="flex items-center gap-4 mt-3 flex-wrap">
            {/* Client ID with copy */}
            <button
              onClick={copyClientId}
              className="flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground hover:text-foreground transition-colors group"
            >
              <Key className="h-3 w-3" />
              <span className="truncate max-w-[200px]">{app.clientId}</span>
              {copiedId ? (
                <Check className="h-3 w-3 text-emerald-500" />
              ) : (
                <Copy className="h-3 w-3 opacity-40 group-hover:opacity-100" />
              )}
            </button>

            {/* Active sessions */}
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Users className="h-3 w-3" />
              {app.activeSessions} session{app.activeSessions !== 1 ? 's' : ''}
            </div>

            {/* Scopes count */}
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <ShieldCheck className="h-3 w-3" />
              {app.scopes.length} scope{app.scopes.length !== 1 ? 's' : ''}
            </div>

            {/* Redirect URIs */}
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Link2 className="h-3 w-3" />
              {app.redirectUris.length + app.allowedOrigins.length} URL
              {app.redirectUris.length + app.allowedOrigins.length !== 1 ? 's' : ''}
            </div>

            {app.allowAllOrigins && (
              <div className="flex items-center gap-1.5 text-[11px] text-destructive font-semibold">
                <AlertTriangle className="h-3 w-3" />
                TOUTES ORIGINES
              </div>
            )}

            {app.webhookUrl && (
              <div className="flex items-center gap-1.5 text-[11px] text-violet-500">
                <Webhook className="h-3 w-3" />
                Webhook
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="h-8 w-8 rounded-lg border border-border hover:bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
          <AnimatePresence>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-10 w-56 rounded-xl border border-border bg-card shadow-2xl p-1.5 z-20"
                >
                  <MenuItem
                    icon={Pencil}
                    label="Éditer"
                    onClick={() => {
                      onEdit()
                      setMenuOpen(false)
                    }}
                  />
                  <MenuItem
                    icon={app.isActive ? EyeOff : Eye}
                    label={app.isActive ? 'Désactiver' : 'Activer'}
                    onClick={() => {
                      onToggleActive()
                      setMenuOpen(false)
                    }}
                  />
                  <MenuItem
                    icon={RotateCw}
                    label="Régénérer les secrets"
                    onClick={() => {
                      onRotate()
                      setMenuOpen(false)
                    }}
                  />
                  {app.activeSessions > 0 && (
                    <MenuItem
                      icon={ShieldAlert}
                      label={`Révoquer ${app.activeSessions} session(s)`}
                      onClick={() => {
                        onRevokeAll()
                        setMenuOpen(false)
                      }}
                      warning
                    />
                  )}
                  <div className="h-px bg-border my-1" />
                  <MenuItem
                    icon={Trash2}
                    label="Supprimer"
                    onClick={() => {
                      onDelete()
                      setMenuOpen(false)
                    }}
                    destructive
                  />
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}

function MenuItem({
  icon: Icon,
  label,
  onClick,
  destructive,
  warning,
}: {
  icon: any
  label: string
  onClick: () => void
  destructive?: boolean
  warning?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] text-left transition-colors',
        destructive && 'text-destructive hover:bg-destructive/10',
        warning && 'text-amber-600 dark:text-amber-500 hover:bg-amber-500/10',
        !destructive && !warning && 'text-foreground hover:bg-muted/60'
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span>{label}</span>
    </button>
  )
}

/* ─────────────── Form modal (create + edit) ─────────────── */

type OauthAppFormMode = 'create' | 'edit'

function OauthAppFormModal({
  mode,
  open,
  onClose,
  onCreated,
  existingApp = null,
}: {
  mode: OauthAppFormMode
  open: boolean
  onClose: () => void
  onCreated: (payload: {
    clientId: string
    clientSecret: string
    webhookSecret: string | null
    appName: string
  }) => void
  existingApp?: OauthApp | null
}) {
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '',
    description: '',
    websiteUrl: '',
    redirectUris: 'http://127.0.0.1/callback',
    allowedOrigins: '',
    allowAllOrigins: false,
    scopes: ['profile', 'invoices:read', 'offline_access'] as string[],
    allScopes: false,
    kind: 'desktop' as OauthApp['kind'],
    webhookUrl: '',
    webhookEvents: [] as string[],
    isFirstParty: false,
  })

  function resetToDefaults() {
    setForm({
      name: '',
      description: '',
      websiteUrl: '',
      redirectUris: 'http://127.0.0.1/callback',
      allowedOrigins: '',
      allowAllOrigins: false,
      scopes: ['profile', 'invoices:read', 'offline_access'],
      allScopes: false,
      kind: 'desktop',
      webhookUrl: '',
      webhookEvents: [],
      isFirstParty: false,
    })
  }

  useEffect(() => {
    if (!open) return
    if (mode === 'edit' && existingApp) {
      const isAllScopes =
        existingApp.scopes.length === ALL_SCOPE_IDS.length &&
        ALL_SCOPE_IDS.every((s) => existingApp.scopes.includes(s))
      setForm({
        name: existingApp.name,
        description: existingApp.description ?? '',
        websiteUrl: existingApp.websiteUrl ?? '',
        redirectUris: existingApp.redirectUris.join('\n'),
        allowedOrigins: existingApp.allowedOrigins.join('\n'),
        allowAllOrigins: existingApp.allowAllOrigins,
        scopes: isAllScopes ? ALL_SCOPE_IDS : existingApp.scopes,
        allScopes: isAllScopes,
        kind: existingApp.kind,
        webhookUrl: existingApp.webhookUrl ?? '',
        webhookEvents: existingApp.webhookEvents ?? [],
        isFirstParty: existingApp.isFirstParty,
      })
    } else if (mode === 'create') {
      resetToDefaults()
    }
  }, [open, mode, existingApp])

  function toggleScope(id: string) {
    setForm((f) => ({
      ...f,
      scopes: f.scopes.includes(id) ? f.scopes.filter((s) => s !== id) : [...f.scopes, id],
    }))
  }

  function toggleEvent(event: string) {
    setForm((f) => ({
      ...f,
      webhookEvents: f.webhookEvents.includes(event)
        ? f.webhookEvents.filter((e) => e !== event)
        : [...f.webhookEvents, event],
    }))
  }

  async function handleSubmit() {
    if (!form.name.trim()) {
      toast('Le nom est requis', 'error')
      return
    }
    const redirects = form.redirectUris
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
    if (redirects.length === 0 && !form.allowAllOrigins) {
      toast('Au moins un redirect URI est requis', 'error')
      return
    }
    const origins = form.allowedOrigins
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
    const scopes = form.allScopes ? ALL_SCOPE_IDS : form.scopes
    if (scopes.length === 0) {
      toast('Au moins un scope est requis', 'error')
      return
    }

    setSaving(true)
    const body: any = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      websiteUrl: form.websiteUrl.trim() || null,
      redirectUris: redirects.length > 0 ? redirects : ['http://127.0.0.1/callback'],
      allowedOrigins: origins,
      allowAllOrigins: form.allowAllOrigins,
      scopes,
      kind: form.kind,
    }
    if (mode === 'create') {
      body.isFirstParty = form.isFirstParty
    }
    if (form.webhookUrl.trim()) {
      body.webhookUrl = form.webhookUrl.trim()
      body.webhookEvents = form.webhookEvents
    } else if (mode === 'edit') {
      body.webhookUrl = null
      body.webhookEvents = []
    }

    if (mode === 'create') {
      const { data, error } = await api.post<{
        app: { clientId: string; name: string }
        clientSecret: string
        webhookSecret: string | null
      }>('/admin/oauth-apps', body)

      setSaving(false)

      if (error) {
        toast(error, 'error')
        return
      }

      if (data) {
        onCreated({
          clientId: data.app.clientId,
          clientSecret: data.clientSecret,
          webhookSecret: data.webhookSecret,
          appName: data.app.name,
        })
        resetToDefaults()
      }
      return
    }

    if (!existingApp) {
      setSaving(false)
      return
    }
    const { error } = await api.put(`/admin/oauth-apps/${existingApp.id}`, body)
    setSaving(false)
    if (error) {
      toast(error, 'error')
      return
    }
    toast('Application mise à jour', 'success')
    onCreated({
      clientId: existingApp.clientId,
      clientSecret: '',
      webhookSecret: null,
      appName: form.name.trim(),
    })
  }

  return (
    <Dialog open={open} onClose={onClose} className="max-w-xl">
      <DialogHeader onClose={onClose}>
        <DialogTitle>
          {mode === 'create' ? 'Nouvelle application OAuth' : "Éditer l\u0027application OAuth"}
        </DialogTitle>
        <DialogDescription>
          {mode === 'create'
            ? 'Configurez une application tierce qui pourra se connecter à Faktur via OAuth2.'
            : 'Modifiez les redirect URIs, les origines autorisées et les scopes de cette application.'}
        </DialogDescription>
      </DialogHeader>

      <div className="mt-5 space-y-4 max-h-[60vh] overflow-y-auto pr-1 -mr-1">
        {/* Name */}
        <div>
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
            Nom *
          </label>
          <Input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Faktur Desktop"
          />
        </div>

        {/* Description */}
        <div>
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
            Description
          </label>
          <Input
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Client de bureau officiel"
          />
        </div>

        {/* Kind */}
        <div>
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
            Type
          </label>
          <div className="grid grid-cols-4 gap-2">
            {(['desktop', 'mobile', 'web', 'cli'] as const).map((k) => {
              const meta = KIND_META[k]
              const Icon = meta.icon
              const selected = form.kind === k
              return (
                <button
                  key={k}
                  onClick={() => setForm({ ...form, kind: k })}
                  className={cn(
                    'flex items-center gap-2 rounded-lg border p-3 transition-all',
                    selected
                      ? 'border-primary bg-primary/5 text-foreground'
                      : 'border-border bg-card hover:bg-muted/40 text-muted-foreground'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-[13px] font-medium">{meta.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Redirect URIs */}
        <div>
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
            Redirect URIs {form.allowAllOrigins ? '' : '*'}
          </label>
          <textarea
            value={form.redirectUris}
            onChange={(e) => setForm({ ...form, redirectUris: e.target.value })}
            rows={3}
            disabled={form.allowAllOrigins}
            className={cn(
              'w-full rounded-lg border border-border bg-background px-3 py-2 text-[13px] font-mono text-foreground placeholder:text-muted-foreground/60 focus:border-primary/50 focus:ring-2 focus:ring-primary/15 outline-none transition-all',
              form.allowAllOrigins && 'opacity-40'
            )}
            placeholder="http://127.0.0.1/callback&#10;https://example.com/callback&#10;faktur-mobile://oauth/callback"
          />
          <p className="text-[11px] text-muted-foreground mt-1.5">
            Un par ligne, match exact. Pour le bureau, utilisez{' '}
            <code className="text-[10px] px-1 rounded bg-muted">http://127.0.0.1/callback</code> —
            le port est auto-assigné au runtime.
          </p>
        </div>

        {/* Allowed origins (wildcards) */}
        <div>
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
            Origines autorisées (wildcards)
          </label>
          <textarea
            value={form.allowedOrigins}
            onChange={(e) => setForm({ ...form, allowedOrigins: e.target.value })}
            rows={3}
            disabled={form.allowAllOrigins}
            className={cn(
              'w-full rounded-lg border border-border bg-background px-3 py-2 text-[13px] font-mono text-foreground placeholder:text-muted-foreground/60 focus:border-primary/50 focus:ring-2 focus:ring-primary/15 outline-none transition-all',
              form.allowAllOrigins && 'opacity-40'
            )}
            placeholder="exp://*/--/oauth/callback&#10;faktur-mobile://*&#10;http://127.0.0.1:*/callback"
          />
          <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">
            Un par ligne. Supporte les wildcards <code className="text-[10px] px-1 rounded bg-muted">*</code> (segment) et <code className="text-[10px] px-1 rounded bg-muted">**</code> (chemin complet). Utile pour Expo Go (<code className="text-[10px] px-1 rounded bg-muted">exp://*/--/oauth/callback</code>) ou les ports loopback dynamiques.
          </p>
        </div>

        {/* DANGER ZONE: allow all origins */}
        <button
          type="button"
          onClick={() => setForm({ ...form, allowAllOrigins: !form.allowAllOrigins })}
          className={cn(
            'w-full flex items-start gap-3 rounded-lg border-2 p-3 transition-all text-left',
            form.allowAllOrigins
              ? 'border-destructive/70 bg-destructive/5'
              : 'border-border bg-card hover:bg-muted/40'
          )}
        >
          <div
            className={cn(
              'h-5 w-5 shrink-0 rounded border-2 flex items-center justify-center mt-0.5 transition-colors',
              form.allowAllOrigins ? 'bg-destructive border-destructive' : 'border-muted-foreground/40'
            )}
          >
            {form.allowAllOrigins && <Check className="h-3 w-3 text-white" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-foreground flex items-center gap-2">
              <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
              Autoriser TOUTES les origines
              <Badge variant="destructive" className="text-[9px]">DÉV UNIQUEMENT</Badge>
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
              N&apos;importe quel <code className="text-[10px] px-1 rounded bg-muted">redirect_uri</code> sera accepté sans validation — tout attaquant avec le client_id pourra détourner le code d&apos;autorisation. À n&apos;utiliser <strong>que</strong> pendant le développement local.
            </p>
          </div>
        </button>

        {/* Scopes */}
        <div>
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
            Scopes *
          </label>

          {/* All scopes toggle — equivalent to a full login */}
          <button
            onClick={() => setForm({ ...form, allScopes: !form.allScopes })}
            className={cn(
              'w-full flex items-start gap-3 rounded-lg border-2 p-3 transition-all text-left mb-2',
              form.allScopes
                ? 'border-amber-500/60 bg-amber-500/5'
                : 'border-border bg-card hover:bg-muted/40'
            )}
          >
            <div
              className={cn(
                'h-5 w-5 shrink-0 rounded border-2 flex items-center justify-center mt-0.5 transition-colors',
                form.allScopes ? 'bg-amber-500 border-amber-500' : 'border-muted-foreground/40'
              )}
            >
              {form.allScopes && <Check className="h-3 w-3 text-white" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-foreground flex items-center gap-2">
                Tous les scopes (accès complet)
                <Badge variant="warning" className="text-[9px]">RECOMMANDÉ DESKTOP</Badge>
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                L&apos;application aura les mêmes droits qu&apos;un login classique au compte.
                Idéal pour un client de bureau officiel qui sert de coque au dashboard.
              </p>
            </div>
          </button>

          {/* Fine-grained scope list, greyed out when allScopes is on */}
          <div className={cn('space-y-1 transition-opacity', form.allScopes && 'opacity-40 pointer-events-none')}>
            {AVAILABLE_SCOPES.map((scope) => {
              const selected = form.allScopes || form.scopes.includes(scope.id)
              return (
                <button
                  key={scope.id}
                  onClick={() => toggleScope(scope.id)}
                  disabled={form.allScopes}
                  className={cn(
                    'w-full flex items-start gap-3 rounded-lg border p-2.5 transition-all text-left',
                    selected
                      ? 'border-primary/40 bg-primary/5'
                      : 'border-border bg-card hover:bg-muted/40'
                  )}
                >
                  <div
                    className={cn(
                      'h-4 w-4 shrink-0 rounded border flex items-center justify-center mt-0.5 transition-colors',
                      selected ? 'bg-primary border-primary' : 'border-muted-foreground/40'
                    )}
                  >
                    {selected && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium text-foreground">
                      <code className="text-[10px] px-1 rounded bg-muted mr-1">{scope.id}</code>
                      {scope.label}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{scope.description}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Webhook */}
        <div>
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
            Webhook (optionnel)
          </label>
          <Input
            value={form.webhookUrl}
            onChange={(e) => setForm({ ...form, webhookUrl: e.target.value })}
            placeholder="https://example.com/webhook"
          />
          <AnimatePresence>
            {form.webhookUrl.trim() && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <p className="text-[11px] text-muted-foreground mt-2 mb-2">
                  Sélectionnez les évènements à recevoir :
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  {AVAILABLE_EVENTS.map((event) => {
                    const selected = form.webhookEvents.includes(event)
                    return (
                      <button
                        key={event}
                        onClick={() => toggleEvent(event)}
                        className={cn(
                          'flex items-center gap-2 rounded-md border p-2 text-left transition-colors',
                          selected
                            ? 'border-violet-500/40 bg-violet-500/5'
                            : 'border-border bg-card hover:bg-muted/40'
                        )}
                      >
                        <div
                          className={cn(
                            'h-3.5 w-3.5 shrink-0 rounded border flex items-center justify-center',
                            selected ? 'bg-violet-500 border-violet-500' : 'border-muted-foreground/40'
                          )}
                        >
                          {selected && <Check className="h-2 w-2 text-white" />}
                        </div>
                        <code className="text-[10px] font-mono text-foreground truncate">
                          {event}
                        </code>
                      </button>
                    )
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* First party (create only) */}
        {mode === 'create' && (
          <CheckboxRoot 
            isSelected={form.isFirstParty} 
            onChange={(selected) => setForm({ ...form, isFirstParty: selected })} 
            className="flex items-start gap-3 rounded-lg border border-border bg-card p-3 cursor-pointer hover:bg-muted/40 transition-colors"
          >
            <CheckboxControl className="mt-0.5">
              <CheckboxIndicator />
            </CheckboxControl>
            <CheckboxContent>
              <p className="text-[13px] font-medium text-foreground">Application 1st-party</p>
              <p className="text-[11px] text-muted-foreground mt-[1px]">
                Cochez pour les apps officielles (le badge sera affiché sur l&apos;écran de consentement).
              </p>
            </CheckboxContent>
          </CheckboxRoot>
        )}
      </div>

      <DialogFooter className="mt-5">
        <Button variant="outline" size="sm" onClick={onClose} disabled={saving}>
          Annuler
        </Button>
        <Button size="sm" onClick={handleSubmit} disabled={saving}>
          {saving ? <Spinner className="h-3.5 w-3.5 mr-1.5" /> : null}
          {mode === 'create' ? "Créer l'application" : 'Enregistrer les modifications'}
        </Button>
      </DialogFooter>
    </Dialog>
  )
}

/* ─────────────── Secret reveal modal ─────────────── */

function SecretRevealModal({
  payload,
  onClose,
}: {
  payload: {
    clientId: string
    clientSecret: string
    webhookSecret: string | null
    appName: string
  } | null
  onClose: () => void
}) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  if (!payload) return null

  function copy(key: string, value: string) {
    navigator.clipboard.writeText(value)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  return (
    <Dialog open={true} onClose={onClose} className="max-w-lg" dismissible={false}>
      <DialogHeader showClose={false} icon={<AlertTriangle className="h-5 w-5 text-amber-500" />}>
        <DialogTitle>Copiez les secrets maintenant</DialogTitle>
        <DialogDescription>
          Ces valeurs ne seront <strong>plus jamais affichées</strong>. Stockez-les dans un
          gestionnaire de secrets ou directement dans le fichier <code>.env</code> du client.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-3">
        {payload.clientId && (
          <SecretRow label="Client ID" value={payload.clientId} copiedKey={copiedKey} onCopy={copy} reveal />
        )}
        {payload.clientSecret && (
          <SecretRow label="Client Secret" value={payload.clientSecret} copiedKey={copiedKey} onCopy={copy} />
        )}
        {payload.webhookSecret && (
          <SecretRow label="Webhook Secret" value={payload.webhookSecret} copiedKey={copiedKey} onCopy={copy} />
        )}
      </div>

      <div className="mt-4 rounded-lg bg-muted/50 border border-border p-3">
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Pour le client de bureau, ajoutez ces valeurs à <code>faktur-desktop/.env</code> :
        </p>
        <pre className="mt-2 text-[10px] font-mono text-foreground bg-background rounded p-2 overflow-x-auto">
          {`FAKTUR_OAUTH_CLIENT_ID=${payload.clientId}
FAKTUR_OAUTH_CLIENT_SECRET=${payload.clientSecret || '<existant>'}`}
        </pre>
      </div>

      <DialogFooter className="mt-4">
        <Button size="sm" onClick={onClose}>
          J&apos;ai copié les secrets
        </Button>
      </DialogFooter>
    </Dialog>
  )
}

function SecretRow({
  label,
  value,
  copiedKey,
  onCopy,
  reveal = false,
}: {
  label: string
  value: string
  copiedKey: string | null
  onCopy: (key: string, value: string) => void
  reveal?: boolean
}) {
  const [visible, setVisible] = useState(reveal)
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
          {label}
        </span>
        <div className="flex items-center gap-1">
          {!reveal && (
            <button
              onClick={() => setVisible((v) => !v)}
              className="h-6 w-6 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
            >
              {visible ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            </button>
          )}
          <button
            onClick={() => onCopy(label, value)}
            className="h-6 w-6 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
          >
            {copiedKey === label ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
          </button>
        </div>
      </div>
      <div className="rounded-lg border border-border bg-muted/40 px-3 py-2.5 font-mono text-[11px] text-foreground break-all">
        {visible ? value : '•'.repeat(Math.min(value.length, 48))}
      </div>
    </div>
  )
}
