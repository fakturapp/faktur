'use client'

import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'
import { Spinner } from '@/components/ui/spinner'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/toast'
import { Dialog, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShieldCheck,
  Smartphone,
  Globe,
  Terminal,
  Monitor,
  LogOut,
  Clock,
  Trash2,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  MapPin,
  BadgeCheck,
} from 'lucide-react'

interface Session {
  id: string
  deviceName: string | null
  devicePlatform: string | null
  deviceOs: string | null
  lastIp: string | null
  lastUsedAt: string | null
  createdAt: string
}

interface AuthorizedApp {
  authorizationId: string
  app: {
    id: string
    name: string
    description: string | null
    iconUrl: string | null
    websiteUrl: string | null
    kind: 'desktop' | 'web' | 'cli'
    isFirstParty: boolean
  }
  scopes: string[]
  firstAuthorizedAt: string
  lastAuthorizedAt: string
  sessions: Session[]
}

const KIND_META = {
  desktop: { label: 'Application de bureau', icon: Smartphone, color: 'bg-indigo-500/10 text-indigo-500' },
  web: { label: 'Application web', icon: Globe, color: 'bg-emerald-500/10 text-emerald-500' },
  cli: { label: 'Outil en ligne de commande', icon: Terminal, color: 'bg-amber-500/10 text-amber-500' },
}

const SCOPE_LABELS: Record<string, string> = {
  profile: 'Profil',
  'invoices:read': 'Lire factures',
  'invoices:write': 'Créer factures',
  'clients:read': 'Lire clients',
  'clients:write': 'Gérer clients',
  'vault:unlock': 'Déverrouiller coffre',
  offline_access: 'Accès hors-ligne',
}

function formatRelative(dateStr: string | null) {
  if (!dateStr) return '—'
  const diff = Date.now() - new Date(dateStr).getTime()
  const sec = Math.floor(diff / 1000)
  if (sec < 60) return `il y a ${sec}s`
  const min = Math.floor(sec / 60)
  if (min < 60) return `il y a ${min}min`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `il y a ${hr}h`
  const days = Math.floor(hr / 24)
  if (days < 30) return `il y a ${days}j`
  const months = Math.floor(days / 30)
  return `il y a ${months}mois`
}

export default function AccountOauthAppsPage() {
  const { toast } = useToast()
  const [apps, setApps] = useState<AuthorizedApp[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [confirmRevokeApp, setConfirmRevokeApp] = useState<AuthorizedApp | null>(null)
  const [confirmRevokeSession, setConfirmRevokeSession] = useState<{
    app: AuthorizedApp
    session: Session
  } | null>(null)
  const [revokingApp, setRevokingApp] = useState(false)
  const [revokingSession, setRevokingSession] = useState(false)

  const load = useCallback(async () => {
    const { data, error } = await api.get<{ apps: AuthorizedApp[] }>('/account/oauth-apps')
    if (error) {
      toast(error, 'error')
    } else if (data?.apps) {
      setApps(data.apps)
    }
    setLoading(false)
  }, [toast])

  useEffect(() => {
    load()
  }, [load])

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleRevokeApp(app: AuthorizedApp) {
    setRevokingApp(true)
    const { data, error } = await api.post<{ message: string; revokedCount: number }>(
      `/account/oauth-apps/${app.authorizationId}/revoke`,
      {}
    )
    if (error) {
      toast(error, 'error')
    } else {
      toast(data?.message || 'Application révoquée', 'success')
      await load()
    }
    setRevokingApp(false)
    setConfirmRevokeApp(null)
  }

  async function handleRevokeSession(app: AuthorizedApp, session: Session) {
    setRevokingSession(true)
    const { data, error } = await api.post<{ message: string }>(
      `/account/oauth-apps/sessions/${session.id}/revoke`,
      {}
    )
    if (error) {
      toast(error, 'error')
    } else {
      toast(data?.message || 'Session révoquée', 'success')
      await load()
    }
    setRevokingSession(false)
    setConfirmRevokeSession(null)
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Applications connectées</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Les applications tierces qui ont accès à votre compte. Vous pouvez révoquer une
          session à distance ou déconnecter entièrement une application à tout moment.
        </p>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-xl bg-overlay shadow-surface p-5">
              <div className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-64" />
                </div>
                <Skeleton className="h-4 w-4 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : apps.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-surface shadow-surface p-12 text-center">
          <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-xl bg-accent-soft mb-4">
            <ShieldCheck className="h-7 w-7 text-accent" />
          </div>
          <h3 className="text-base font-semibold text-foreground">Aucune application connectée</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
            Lorsque vous autoriserez une application tierce (comme Faktur Desktop), elle
            apparaîtra ici avec la liste de ses sessions actives.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {apps.map((app, i) => {
            const kindMeta = KIND_META[app.app.kind] ?? KIND_META.desktop
            const KindIcon = kindMeta.icon
            const isExpanded = expanded.has(app.authorizationId)
            const activeSessions = app.sessions.length

            return (
              <motion.div
                key={app.authorizationId}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="rounded-xl bg-overlay shadow-surface overflow-hidden"
              >
                {/* Header row */}
                <button
                  onClick={() => toggleExpand(app.authorizationId)}
                  className="w-full flex items-center gap-4 p-5 text-left hover:bg-surface-hover transition-colors"
                >
                  <div
                    className={cn(
                      'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl overflow-hidden',
                      kindMeta.color
                    )}
                  >
                    {app.app.iconUrl ? (
                      <img
                        src={app.app.iconUrl}
                        alt={app.app.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <KindIcon className="h-5 w-5" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-semibold text-foreground truncate">
                        {app.app.name}
                      </h3>
                      {app.app.isFirstParty && (
                        <Badge variant="default" className="text-[10px] gap-0.5">
                          <BadgeCheck className="h-3 w-3" />
                          Officiel
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {kindMeta.label} · {activeSessions} session{activeSessions !== 1 ? 's' : ''} active{activeSessions !== 1 ? 's' : ''} ·
                      Autorisée {formatRelative(app.lastAuthorizedAt)}
                    </p>
                  </div>

                  <ChevronDown
                    className={cn(
                      'h-4 w-4 text-muted-foreground transition-transform',
                      isExpanded && 'rotate-180'
                    )}
                  />
                </button>

                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-border px-5 py-4 space-y-4">
                        {/* Description */}
                        {app.app.description && (
                          <p className="text-xs text-muted-foreground">{app.app.description}</p>
                        )}

                        {/* Scopes granted */}
                        <div>
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                            Permissions accordées
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {app.scopes.map((scope) => (
                              <span
                                key={scope}
                                className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/40 px-2 py-1 text-[11px] text-foreground"
                              >
                                <ShieldCheck className="h-3 w-3 text-accent" />
                                {SCOPE_LABELS[scope] ?? scope}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Active sessions */}
                        <div>
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                            Sessions actives
                          </p>
                          {app.sessions.length === 0 ? (
                            <p className="text-[11px] text-muted-foreground italic">
                              Aucune session active
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {app.sessions.map((session) => (
                                <div
                                  key={session.id}
                                  className="flex items-center gap-3 rounded-lg border border-border bg-background p-3"
                                >
                                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                                    <Monitor className="h-4 w-4 text-muted-foreground" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-[13px] font-medium text-foreground truncate">
                                      {session.deviceName || 'Appareil inconnu'}
                                    </p>
                                    <div className="flex items-center gap-3 mt-0.5 text-[10px] text-muted-foreground">
                                      {session.deviceOs && (
                                        <span>{session.deviceOs}</span>
                                      )}
                                      {session.lastIp && (
                                        <span className="flex items-center gap-1">
                                          <MapPin className="h-2.5 w-2.5" />
                                          {session.lastIp}
                                        </span>
                                      )}
                                      <span className="flex items-center gap-1">
                                        <Clock className="h-2.5 w-2.5" />
                                        {formatRelative(session.lastUsedAt)}
                                      </span>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() =>
                                      setConfirmRevokeSession({ app, session })
                                    }
                                    className="h-8 px-2.5 rounded-lg border border-border hover:border-destructive/40 hover:bg-destructive/5 text-[11px] text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1"
                                    title="Déconnecter cet appareil"
                                  >
                                    <LogOut className="h-3 w-3" />
                                    Déconnecter
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Revoke app entirely */}
                        <div className="pt-2 border-t border-border">
                          <button
                            onClick={() => setConfirmRevokeApp(app)}
                            className="w-full flex items-center justify-center gap-2 h-10 rounded-lg border border-destructive/30 bg-destructive/5 hover:bg-destructive/10 text-[12px] font-medium text-destructive transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Révoquer l&apos;application entièrement
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Revoke single session confirm */}
      <Dialog
        open={!!confirmRevokeSession}
        onClose={() => setConfirmRevokeSession(null)}
      >
        <div className="flex items-start gap-3 mb-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10">
            <LogOut className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <DialogTitle>Déconnecter cet appareil ?</DialogTitle>
            <DialogDescription className="mt-1">
              &quot;{confirmRevokeSession?.session.deviceName || 'Cet appareil'}&quot; sera
              déconnecté immédiatement de {confirmRevokeSession?.app.app.name}. L&apos;utilisateur
              devra se reconnecter pour reprendre.
            </DialogDescription>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setConfirmRevokeSession(null)}
            disabled={revokingSession}
          >
            Annuler
          </Button>
          <Button
            variant="destructive"
            size="sm"
            disabled={revokingSession}
            onClick={() =>
              confirmRevokeSession &&
              handleRevokeSession(confirmRevokeSession.app, confirmRevokeSession.session)
            }
          >
            {revokingSession ? <><Spinner size="sm" /> Déconnection...</> : 'Déconnecter'}
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Revoke full app confirm */}
      <Dialog open={!!confirmRevokeApp} onClose={() => setConfirmRevokeApp(null)}>
        <div className="flex items-start gap-3 mb-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-destructive/10">
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <DialogTitle>Révoquer {confirmRevokeApp?.app.name} ?</DialogTitle>
            <DialogDescription className="mt-1">
              Toutes les sessions actives seront immédiatement déconnectées et l&apos;application
              devra redemander votre autorisation la prochaine fois que vous l&apos;ouvrirez.
            </DialogDescription>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setConfirmRevokeApp(null)}
            disabled={revokingApp}
          >
            Annuler
          </Button>
          <Button
            variant="destructive"
            size="sm"
            disabled={revokingApp}
            onClick={() => confirmRevokeApp && handleRevokeApp(confirmRevokeApp)}
          >
            {revokingApp ? <><Spinner size="sm" /> Révocation...</> : <>Révoquer l&apos;application</>}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  )
}
