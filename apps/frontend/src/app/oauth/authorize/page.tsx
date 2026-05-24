'use client'

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { useTheme } from '@/lib/theme'
import { Spinner } from '@/components/ui/spinner'
import { Button } from '@/components/ui/button'
import { Tooltip } from '@/components/ui/tooltip'
import { VerifiedBadge } from '@/components/ui/verified-badge'
import {
  Dialog,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Check,
  X,
  Smartphone,
  Globe,
  Terminal,
  Lock,
  KeyRound,
  ShieldAlert,
  LogOut,
} from 'lucide-react'

const DarkVeil = dynamic(() => import('@/components/effects/DarkVeil'), { ssr: false })

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

const GRANTED_ACCESSES = [
  'Se connecter à votre compte',
  'Gérer vos données',
  'Rester connecté',
]

const PLAYFUL_DENIED = [
  "manger votre gâteau d'anniversaire 🎂",
  'voler vos cookies 🍪',
  "changer votre fond d'écran 🐱",
  'appeler votre maman 📞',
  'commander une pizza 🍕',
  'lire votre historique Netflix 📺',
  'deviner votre mot de passe 🤫',
  'juger vos vêtements 👕',
  'chanter sous la douche 🎤',
  'arrêter le temps ⏰',
  'prédire votre avenir 🔮',
  'gagner au loto 🎰',
  'vous faire la leçon 👨‍🏫',
  'apprendre à faire du vélo 🚴',
  'compter vos moutons 🐑',
  'faire la grasse matinée 😴',
  "vous parler à l'envers 🙃",
  'inventer un mot pour "fromage" 🧀',
  'voyager dans le temps ⏳',
  'téléporter votre téléphone 📱',
]

const KIND_ICONS: Record<string, any> = {
  desktop: Smartphone,
  web: Globe,
  cli: Terminal,
}

function pickOne<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function AuthorizeContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading: authLoading } = useAuth()
  const { resolvedTheme } = useTheme()

  const [state, setState] = useState<PageState>('loading')
  const [data, setData] = useState<ConsentData | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false)
  const [switchingUser, setSwitchingUser] = useState(false)

  const playfulDenied = useMemo(() => pickOne(PLAYFUL_DENIED), [])

  const queryString = useMemo(() => searchParams.toString(), [searchParams])
  const params = useMemo(
    () => ({
      client_id: searchParams.get('client_id') ?? '',
      redirect_uri: searchParams.get('redirect_uri') ?? '',
    }),
    [searchParams]
  )

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
      setErrorMsg('Paramètres manquants (client_id et redirect_uri requis).')
      setState('error')
      return
    }
    setState('loading')
    const { data: resp, error } = await api.get<ConsentData>(`/oauth/authorize?${queryString}`)
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
      if (user?.vaultLocked) {
        setErrorMsg(
          'Vous devez déverrouiller votre coffre-fort avant de pouvoir autoriser une application.'
        )
        setState('error')
        return
      }
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
      setTimeout(() => {
        window.location.href = resp.redirect
      }, 150)
    },
    [data, user?.vaultLocked]
  )

  async function handleSwitchAccount() {
    setSwitchingUser(true)
    try {
      await api.post('/auth/logout', {})
    } catch {}
    try {
      localStorage.removeItem('faktur_token')
      localStorage.removeItem('faktur_vault_key')
    } catch {}
    const returnTo = encodeURIComponent(`/oauth/authorize?${queryString}`)
    router.replace(`/login?redirect=${returnTo}`)
  }

  const veilHueShift = resolvedTheme === 'light' ? 220 : 0
  const veilSpeed = resolvedTheme === 'light' ? 0.6 : 0.9
  const veilWarp = 0.35
  const veilOverlay =
    resolvedTheme === 'light'
      ? 'bg-background/55 backdrop-blur-md'
      : 'bg-background/35 backdrop-blur-sm'

  if (user && user.vaultLocked) {
    return (
      <PageShell hueShift={veilHueShift} speed={veilSpeed} warp={veilWarp} overlay={veilOverlay}>
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.25 }}
          className="w-full max-w-[440px]"
        >
          <div className="rounded-2xl border border-amber-500/20 bg-overlay/90 backdrop-blur-xl shadow-overlay p-7 text-center">
            <div className="h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
              <Lock className="h-6 w-6 text-amber-500" />
            </div>
            <h2 className="text-base font-semibold text-foreground mb-1">
              Coffre-fort verrouillé
            </h2>
            <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
              Vous devez déverrouiller votre coffre-fort avant de pouvoir
              autoriser cette application.
            </p>
            <Button className="w-full" disabled>
              <KeyRound className="h-4 w-4 mr-2" />
              En attente du déverrouillage…
            </Button>
          </div>
        </motion.div>
      </PageShell>
    )
  }

  if (authLoading || !user || state === 'loading') {
    return (
      <PageShell hueShift={veilHueShift} speed={veilSpeed} warp={veilWarp} overlay={veilOverlay}>
        <Spinner size="lg" className="text-primary" />
      </PageShell>
    )
  }

  if (state === 'error' || !data) {
    return (
      <PageShell hueShift={veilHueShift} speed={veilSpeed} warp={veilWarp} overlay={veilOverlay}>
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-[440px] rounded-2xl bg-overlay/90 backdrop-blur-xl shadow-overlay p-8 text-center"
        >
          <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <X className="h-6 w-6 text-destructive" />
          </div>
          <h2 className="text-base font-semibold text-foreground mb-1">Autorisation impossible</h2>
          <p className="text-sm text-muted-foreground mb-5">
            {errorMsg || 'Une erreur est survenue.'}
          </p>
          <Button className="w-full" onClick={fetchConsent}>
            Réessayer
          </Button>
        </motion.div>
      </PageShell>
    )
  }

  const KindIcon = KIND_ICONS[data.client.id] ?? Smartphone
  const isRedirecting =
    state === 'redirecting' || state === 'approving' || state === 'denying'

  return (
    <PageShell hueShift={veilHueShift} speed={veilSpeed} warp={veilWarp} overlay={veilOverlay}>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center gap-3 mb-6"
      >
        <Image
          src="/logo.svg"
          alt="Faktur"
          width={40}
          height={40}
          className="h-10 w-10 drop-shadow-md"
        />
        <span className="text-2xl font-bold text-foreground font-lexend tracking-tight">
          Faktur
        </span>
      </motion.div>

      <AnimatePresence mode="wait">
        <motion.div
          key="consent"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.25 }}
          className="w-full max-w-[480px]"
        >
          <div className="rounded-2xl bg-overlay/85 backdrop-blur-xl shadow-overlay p-10">
            <div className="flex items-center gap-4 pb-6 border-b border-border">
              <div className="h-14 w-14 shrink-0 rounded-xl bg-surface flex items-center justify-center overflow-hidden">
                {data.client.iconUrl ? (
                  <img
                    src={data.client.iconUrl}
                    alt={data.client.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <KindIcon className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h1 className="text-lg font-semibold text-foreground truncate">
                    {data.client.name}
                  </h1>
                  {data.client.isFirstParty && (
                    <Tooltip content="Application officielle vérifiée par Faktur">
                      <motion.span
                        initial={{ scale: 0, rotate: -30, opacity: 0 }}
                        animate={{ scale: 1, rotate: 0, opacity: 1 }}
                        transition={{
                          type: 'spring',
                          stiffness: 420,
                          damping: 18,
                          delay: 0.15,
                        }}
                        className="inline-flex"
                      >
                        <VerifiedBadge className="h-5 w-5" />
                      </motion.span>
                    </Tooltip>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  souhaite accéder à votre compte
                </p>
              </div>
            </div>

            {!data.client.isFirstParty && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: 0.1 }}
                className="mt-4 flex items-start gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3"
              >
                <ShieldAlert className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold text-foreground leading-tight">
                    Cette application n&apos;est pas vérifiée
                  </p>
                  <p className="text-[12px] text-muted-foreground mt-1 leading-snug">
                    N&apos;autorisez que si vous connaissez le développeur.
                  </p>
                </div>
              </motion.div>
            )}

            <div className="pt-5 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 shrink-0 rounded-full bg-primary/15 text-primary flex items-center justify-center text-[13px] font-bold overflow-hidden">
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
                  <p className="text-sm text-foreground truncate">
                    {user.fullName || user.email}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setLogoutConfirmOpen(true)}
                  disabled={isRedirecting || switchingUser}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
                >
                  Ce n&apos;est pas toi ?
                </button>
              </div>
            </div>

            <div className="py-5 border-t border-border">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Ce à quoi {data.client.name} a accès
              </p>
              <div className="space-y-2">
                {GRANTED_ACCESSES.map((access) => (
                  <div
                    key={access}
                    className="flex items-center gap-2.5 text-sm text-foreground"
                  >
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>{access}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-border/60 flex items-center gap-2.5 text-[13px] text-muted-foreground italic">
                <X className="h-4 w-4 text-destructive/70 shrink-0" />
                <span className="truncate">
                  En revanche, {data.client.name} ne pourra pas {playfulDenied}
                </span>
              </div>
            </div>

            <div className="pt-5 border-t border-border flex gap-3">
              <Button
                variant="outline"
                size="lg"
                className="flex-1"
                onClick={() => submitDecision('deny')}
                disabled={isRedirecting || switchingUser}
              >
                {state === 'denying' ? <Spinner className="h-4 w-4" /> : 'Refuser'}
              </Button>
              <Button
                size="lg"
                className="flex-1"
                onClick={() => submitDecision('allow')}
                disabled={isRedirecting || switchingUser}
              >
                {state === 'approving' || state === 'redirecting' ? (
                  <Spinner className="h-4 w-4" />
                ) : (
                  'Autoriser'
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      <Dialog
        open={logoutConfirmOpen}
        onClose={() => setLogoutConfirmOpen(false)}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10">
            <LogOut className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <DialogTitle>Changer de compte</DialogTitle>
            <DialogDescription className="mt-0">
              Vous allez être déconnecté(e) pour vous reconnecter avec un
              autre compte.
            </DialogDescription>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setLogoutConfirmOpen(false)}>
            Annuler
          </Button>
          <Button
            variant="destructive"
            onClick={handleSwitchAccount}
            disabled={switchingUser}
          >
            {switchingUser ? <Spinner className="h-3 w-3 mr-2" /> : null}
            Se déconnecter
          </Button>
        </DialogFooter>
      </Dialog>
    </PageShell>
  )
}

function PageShell({
  children,
  hueShift,
  speed,
  warp,
  overlay,
}: {
  children: React.ReactNode
  hueShift: number
  speed: number
  warp: number
  overlay: string
}) {
  return (
    <div className="relative isolate flex min-h-[100svh] flex-col items-center justify-center overflow-hidden bg-background p-4">
      <div className="pointer-events-none absolute inset-0 -z-20">
        <DarkVeil hueShift={hueShift} speed={speed} warpAmount={warp} />
      </div>
      <div className={`pointer-events-none absolute inset-0 -z-10 ${overlay}`} />
      {children}
    </div>
  )
}

export default function OauthAuthorizePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Spinner size="lg" className="text-primary" />
        </div>
      }
    >
      <AuthorizeContent />
    </Suspense>
  )
}
