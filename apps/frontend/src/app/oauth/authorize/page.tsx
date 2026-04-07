'use client'

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { Spinner } from '@/components/ui/spinner'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  ShieldCheck,
  ShieldAlert,
  Check,
  X,
  Smartphone,
  Globe,
  Terminal,
  Lock,
  User,
  FileText,
  Users,
  KeyRound,
  Clock,
  ExternalLink,
  AlertTriangle,
  Sparkles,
} from 'lucide-react'

interface ConsentData {
  client: {
    id: string
    clientId: string
    name: string
    description: string | null
    iconUrl: string | null
    websiteUrl: string | null
    isFirstParty: boolean
  }
  scopes: string[]
  redirectUri: string
  state: string | null
  codeChallenge: string | null
  codeChallengeMethod: string | null
  autoApprove: boolean
}

type PageState = 'loading' | 'ready' | 'approving' | 'denying' | 'error' | 'redirecting'

const SCOPE_META: Record<
  string,
  { label: string; description: string; icon: any; dangerous?: boolean }
> = {
  profile: {
    label: 'Votre profil',
    description: "Consulter votre nom, email et photo de profil.",
    icon: User,
  },
  'invoices:read': {
    label: 'Lire vos factures',
    description: "Consulter vos factures, devis et avoirs existants.",
    icon: FileText,
  },
  'invoices:write': {
    label: 'Créer et modifier vos factures',
    description: 'Ajouter, éditer et supprimer vos documents.',
    icon: FileText,
    dangerous: true,
  },
  'clients:read': {
    label: 'Lire votre carnet clients',
    description: 'Voir la liste de vos clients et leurs coordonnées.',
    icon: Users,
  },
  'clients:write': {
    label: 'Gérer vos clients',
    description: 'Ajouter, modifier et supprimer des clients.',
    icon: Users,
    dangerous: true,
  },
  'vault:unlock': {
    label: 'Déverrouiller votre coffre-fort',
    description: 'Accéder aux données chiffrées de votre compte.',
    icon: Lock,
    dangerous: true,
  },
  offline_access: {
    label: 'Accès hors-ligne',
    description: "Rester connecté via un refresh token — l'application pourra se reconnecter automatiquement sans vous redemander votre mot de passe.",
    icon: Clock,
  },
}

const KIND_ICONS: Record<string, any> = {
  desktop: Smartphone,
  web: Globe,
  cli: Terminal,
}

function AuthorizeContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading: authLoading } = useAuth()

  const [state, setState] = useState<PageState>('loading')
  const [data, setData] = useState<ConsentData | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Query params — memoised so we don't rebuild them on every render.
  const queryString = useMemo(() => searchParams.toString(), [searchParams])

  const params = useMemo(
    () => ({
      client_id: searchParams.get('client_id') ?? '',
      redirect_uri: searchParams.get('redirect_uri') ?? '',
      response_type: searchParams.get('response_type') ?? 'code',
      scope: searchParams.get('scope') ?? '',
      state: searchParams.get('state') ?? '',
      code_challenge: searchParams.get('code_challenge') ?? '',
      code_challenge_method: searchParams.get('code_challenge_method') ?? '',
    }),
    [searchParams]
  )

  // Auth guard — redirect to /login with a return_to so the user
  // comes right back to the consent screen with the query preserved.
  useEffect(() => {
    if (authLoading) return
    if (!user) {
      const returnTo = encodeURIComponent(`/oauth/authorize?${queryString}`)
      router.replace(`/login?redirect=${returnTo}`)
    }
  }, [user, authLoading, router, queryString])

  const fetchConsent = useCallback(async () => {
    if (!user) return
    if (!params.client_id || !params.redirect_uri) {
      setErrorMsg('Paramètres manquants dans la requête. client_id et redirect_uri sont requis.')
      setState('error')
      return
    }
    setState('loading')
    const { data: resp, error } = await api.get<ConsentData>(
      `/oauth/authorize?${queryString}`
    )
    if (error) {
      setErrorMsg(error)
      setState('error')
      return
    }
    if (resp) {
      setData(resp)
      setState('ready')
    }
  }, [user, params.client_id, params.redirect_uri, queryString])

  useEffect(() => {
    if (user && !authLoading) fetchConsent()
  }, [user, authLoading, fetchConsent])

  const submitDecision = useCallback(
    async (decision: 'allow' | 'deny') => {
      if (!data) return
      setState(decision === 'allow' ? 'approving' : 'denying')

      const { data: resp, error } = await api.post<{ redirect: string }>(
        '/oauth/authorize/consent',
        {
          client_id: data.client.clientId,
          redirect_uri: data.redirectUri,
          scope: data.scopes.join(' '),
          state: data.state ?? undefined,
          code_challenge: data.codeChallenge ?? undefined,
          code_challenge_method: data.codeChallengeMethod ?? undefined,
          decision,
        }
      )

      if (error || !resp?.redirect) {
        setErrorMsg(error || 'Réponse inattendue du serveur')
        setState('error')
        return
      }

      setState('redirecting')
      // Small delay so the user sees the state change flip visually
      // before the browser actually navigates out.
      setTimeout(() => {
        window.location.href = resp.redirect
      }, 200)
    },
    [data]
  )

  // Auto-approve — if the user has already granted these exact scopes
  // once before, the backend tells us so and we can skip the screen
  // entirely. This happens for the desktop app on restart after the
  // refresh token has died but the consent is still on file.
  useEffect(() => {
    if (data?.autoApprove && state === 'ready') {
      submitDecision('allow')
    }
  }, [data, state, submitDecision])

  // Not authenticated yet — spinner while the redirect happens.
  if (authLoading || !user) {
    return <CenteredSpinner label="Chargement…" />
  }

  // Loading the consent metadata.
  if (state === 'loading') {
    return <CenteredSpinner label="Chargement de l'application…" />
  }

  // Error state.
  if (state === 'error' || !data) {
    return <ErrorCard message={errorMsg} onRetry={fetchConsent} />
  }

  const KindIcon = KIND_ICONS[data.client.id === 'desktop' ? 'desktop' : 'desktop']
  const hasDangerousScope = data.scopes.some((s) => SCOPE_META[s]?.dangerous)
  const isRedirecting = state === 'redirecting' || state === 'approving' || state === 'denying'

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
      <AnimatePresence mode="wait">
        <motion.div
          key="consent"
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -16, scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 260, damping: 26 }}
          className="relative w-full max-w-lg"
        >
          {/* Faktur logo */}
          <div className="flex flex-col items-center mb-6">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/20 mb-3">
              <span className="text-primary-foreground font-bold text-xl font-lexend">F</span>
            </div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.15em]">
              Faktur
            </p>
          </div>

          {/* Main card */}
          <div className="rounded-2xl border border-border bg-card shadow-xl overflow-hidden">
            {/* Hero with app info */}
            <div className="relative p-6 bg-gradient-to-br from-primary/8 via-primary/4 to-transparent border-b border-border">
              <h1 className="text-lg font-bold text-foreground tracking-tight mb-1">
                Autoriser l&apos;accès à votre compte
              </h1>
              <p className="text-xs text-muted-foreground">
                Vérifiez les permissions demandées avant de continuer.
              </p>

              {/* App card */}
              <div className="mt-5 flex items-start gap-4 rounded-xl border border-border bg-card/80 backdrop-blur-sm p-4">
                <div className="h-14 w-14 shrink-0 rounded-2xl bg-primary/10 flex items-center justify-center overflow-hidden">
                  {data.client.iconUrl ? (
                    <img
                      src={data.client.iconUrl}
                      alt={data.client.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <KindIcon className="h-6 w-6 text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-base font-semibold text-foreground truncate">
                      {data.client.name}
                    </h2>
                    {data.client.isFirstParty && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider border border-primary/20">
                        <Sparkles className="h-2.5 w-2.5" /> Officielle
                      </span>
                    )}
                  </div>
                  {data.client.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {data.client.description}
                    </p>
                  )}
                  {data.client.websiteUrl && (
                    <a
                      href={data.client.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 mt-2 text-[11px] text-primary hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Site web de l&apos;application
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Current user pill */}
            <div className="px-6 pt-5">
              <div className="flex items-center gap-3 rounded-xl bg-muted/40 border border-border p-3">
                <div className="h-9 w-9 shrink-0 rounded-full bg-primary/15 text-primary flex items-center justify-center text-[12px] font-bold overflow-hidden">
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.fullName || user.email}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    (user.fullName || user.email).slice(0, 2).toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-muted-foreground">Connecté en tant que</p>
                  <p className="text-[13px] font-medium text-foreground truncate">
                    {user.fullName || user.email}
                  </p>
                </div>
                <Link
                  href="/login"
                  className="text-[11px] text-muted-foreground hover:text-foreground"
                >
                  Changer
                </Link>
              </div>
            </div>

            {/* Scopes */}
            <div className="px-6 py-5">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.15em] mb-3">
                Permissions demandées
              </p>
              <div className="space-y-2">
                {data.scopes.map((scope) => {
                  const meta = SCOPE_META[scope] ?? {
                    label: scope,
                    description: `Accès au scope ${scope}`,
                    icon: ShieldCheck,
                  }
                  const Icon = meta.icon
                  return (
                    <div
                      key={scope}
                      className="flex items-start gap-3 rounded-lg border border-border bg-background p-3"
                    >
                      <div
                        className={cn(
                          'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                          meta.dangerous
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-500'
                            : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-500'
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-foreground leading-tight">
                          {meta.label}
                          {meta.dangerous && (
                            <span className="inline-flex items-center gap-0.5 ml-1.5 text-[9px] font-bold uppercase text-amber-600 dark:text-amber-500">
                              <AlertTriangle className="h-2.5 w-2.5" /> Écriture
                            </span>
                          )}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                          {meta.description}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Dangerous scope warning */}
              {hasDangerousScope && !data.client.isFirstParty && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 flex items-start gap-2.5 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3"
                >
                  <ShieldAlert className="h-4 w-4 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-snug">
                    Cette application demande des permissions d&apos;écriture. Assurez-vous qu&apos;elle
                    provient d&apos;une source de confiance avant de continuer.
                  </p>
                </motion.div>
              )}
            </div>

            {/* Actions */}
            <div className="px-6 py-4 bg-muted/20 border-t border-border">
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => submitDecision('deny')}
                  disabled={isRedirecting}
                >
                  {state === 'denying' ? (
                    <Spinner className="h-3.5 w-3.5" />
                  ) : (
                    <X className="h-3.5 w-3.5 mr-1.5" />
                  )}
                  Refuser
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => submitDecision('allow')}
                  disabled={isRedirecting}
                >
                  {state === 'approving' || state === 'redirecting' ? (
                    <>
                      <Spinner className="h-3.5 w-3.5 mr-1.5" />
                      {state === 'redirecting' ? 'Redirection…' : 'Autorisation…'}
                    </>
                  ) : (
                    <>
                      <Check className="h-3.5 w-3.5 mr-1.5" />
                      Autoriser
                    </>
                  )}
                </Button>
              </div>

              {/* Redirect URI transparency */}
              <div className="mt-4 flex items-start gap-2 text-[10px] text-muted-foreground/70">
                <KeyRound className="h-3 w-3 shrink-0 mt-0.5" />
                <p className="leading-snug break-all">
                  Vous serez redirigé vers{' '}
                  <code className="font-mono text-[9px] px-1 rounded bg-muted text-foreground">
                    {data.redirectUri}
                  </code>
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <p className="mt-5 text-center text-[10px] text-muted-foreground">
            Vous pouvez révoquer cette autorisation à tout moment depuis{' '}
            <Link href="/dashboard/account/oauth" className="text-primary hover:underline">
              Mon compte → Applications connectées
            </Link>
            .
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

/* ─────────────── Shared helpers ─────────────── */

function CenteredSpinner({ label }: { label: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
      <Spinner size="lg" className="text-primary" />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  )
}

function ErrorCard({
  message,
  onRetry,
}: {
  message: string | null
  onRetry: () => void
}) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md rounded-2xl border border-destructive/20 bg-card p-8 shadow-xl"
      >
        <div className="flex flex-col items-center text-center">
          <div className="h-14 w-14 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
            <X className="h-7 w-7 text-destructive" />
          </div>
          <h2 className="text-lg font-bold text-foreground mb-1">Autorisation impossible</h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-5">
            {message || 'Une erreur inconnue est survenue pendant la vérification de la requête.'}
          </p>
          <div className="flex gap-3 w-full">
            <Button variant="outline" className="flex-1" onClick={() => (window.location.href = '/dashboard')}>
              Retour au tableau de bord
            </Button>
            <Button className="flex-1" onClick={onRetry}>
              Réessayer
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

/* ─────────────── Page wrapper ─────────────── */

export default function OauthAuthorizePage() {
  return (
    <Suspense fallback={<CenteredSpinner label="Chargement…" />}>
      <AuthorizeContent />
    </Suspense>
  )
}
