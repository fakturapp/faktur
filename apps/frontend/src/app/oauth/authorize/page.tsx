'use client'

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth'
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
  "n'aura pas le droit de manger votre gâteau d'anniversaire 🎂",
  "n'aura pas le droit de voler vos cookies 🍪",
  "ne pourra pas changer votre fond d'écran en photo de chat 🐱",
  "ne pourra pas appeler votre maman 📞",
  'ne pourra pas commander une pizza à votre place 🍕',
  'ne pourra pas regarder votre historique Netflix 📺',
  'ne pourra pas deviner votre mot de passe 🤫',
  'ne pourra pas juger vos choix vestimentaires 👕',
  "ne pourra pas chanter sous la douche avec vous 🎤",
  'ne pourra pas arrêter le temps ⏰',
  'ne pourra pas prédire votre avenir 🔮',
  'ne pourra pas gagner au loto à votre place 🎰',
  "ne pourra pas vous faire la leçon 👨‍🏫",
  'ne pourra pas apprendre à faire du vélo 🚴',
  'ne pourra pas compter vos moutons avant de dormir 🐑',
  'ne pourra pas faire la grasse matinée pour vous 😴',
  "ne pourra pas vous parler à l'envers 🙃",
  "ne pourra pas inventer un nouveau mot pour 'fromage' 🧀",
  'ne pourra pas voyager dans le temps ⏳',
  'ne pourra pas téléporter votre téléphone 📱',
]

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
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false)
  const [switchingUser, setSwitchingUser] = useState(false)

  const playfulDenied = useMemo(
    () => PLAYFUL_DENIED[Math.floor(Math.random() * PLAYFUL_DENIED.length)],
    []
  )

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

  useEffect(() => {
    if (data?.autoApprove && state === 'ready' && !user?.vaultLocked) submitDecision('allow')
  }, [data, state, submitDecision, user?.vaultLocked])

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

  if (user && user.vaultLocked) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.25 }}
          className="w-[380px]"
        >
          <div className="rounded-xl border border-amber-500/20 bg-overlay shadow-surface p-6 text-center">
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
      </div>
    )
  }

  if (authLoading || !user || state === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Spinner size="lg" className="text-primary" />
      </div>
    )
  }

  if (state === 'error' || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-[380px] rounded-xl bg-overlay shadow-surface p-8 text-center"
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
      </div>
    )
  }

  const KindIcon = KIND_ICONS[data.client.id] ?? Smartphone
  const isRedirecting =
    state === 'redirecting' || state === 'approving' || state === 'denying'

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
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
          className="w-[400px]"
        >
          <div className="rounded-xl bg-overlay shadow-surface p-6">
            <div className="flex items-center gap-3 pb-5 border-b border-border">
              <div className="h-11 w-11 shrink-0 rounded-xl bg-surface flex items-center justify-center overflow-hidden">
                {data.client.iconUrl ? (
                  <img
                    src={data.client.iconUrl}
                    alt={data.client.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <KindIcon className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <h1 className="text-[15px] font-semibold text-foreground truncate">
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
                        <VerifiedBadge className="h-4 w-4" />
                      </motion.span>
                    </Tooltip>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground">
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
                  <p className="text-[11px] font-semibold text-foreground leading-tight">
                    Cette application n&apos;est pas vérifiée
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1 leading-snug">
                    N&apos;autorisez que si vous connaissez et faites
                    confiance au développeur.
                  </p>
                </div>
              </motion.div>
            )}

            <div className="pt-4 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="h-7 w-7 shrink-0 rounded-full bg-primary/15 text-primary flex items-center justify-center text-[10px] font-bold overflow-hidden">
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
                  <p className="text-[12px] text-foreground truncate">
                    {user.fullName || user.email}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setLogoutConfirmOpen(true)}
                  disabled={isRedirecting || switchingUser}
                  className="text-[10px] text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
                >
                  Ce n&apos;est pas toi ?
                </button>
              </div>
            </div>

            <div className="py-3 border-t border-border">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">
                Accès demandé
              </p>
              <div className="space-y-1.5">
                {GRANTED_ACCESSES.map((access) => (
                  <div
                    key={access}
                    className="flex items-center gap-2 text-[12px] text-foreground"
                  >
                    <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    <span>{access}</span>
                  </div>
                ))}
              </div>

              <div className="mt-3 pt-3 border-t border-border/60">
                <div className="flex items-start gap-2 text-[11px] text-muted-foreground italic leading-snug">
                  <X className="h-3 w-3 text-destructive/70 shrink-0 mt-0.5" />
                  <span>
                    En revanche, {data.client.name} {playfulDenied}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => submitDecision('deny')}
                disabled={isRedirecting || switchingUser}
              >
                {state === 'denying' ? <Spinner className="h-3 w-3" /> : 'Refuser'}
              </Button>
              <Button
                size="sm"
                className="flex-1"
                onClick={() => submitDecision('allow')}
                disabled={isRedirecting || switchingUser}
              >
                {state === 'approving' || state === 'redirecting' ? (
                  <Spinner className="h-3 w-3" />
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
