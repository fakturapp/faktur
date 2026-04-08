'use client'

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { Spinner } from '@/components/ui/spinner'
import { Button } from '@/components/ui/button'
import { VerifiedBadge } from '@/components/ui/verified-badge'
import { cn } from '@/lib/utils'
import {
  ShieldCheck,
  Check,
  X,
  Smartphone,
  Globe,
  Terminal,
  Lock,
  KeyRound,
  User,
  FileText,
  Users,
  Clock,
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

const SCOPE_META: Record<string, { label: string; icon: any }> = {
  profile: { label: 'Votre profil', icon: User },
  'invoices:read': { label: 'Lire vos factures', icon: FileText },
  'invoices:write': { label: 'Modifier vos factures', icon: FileText },
  'clients:read': { label: 'Lire vos clients', icon: Users },
  'clients:write': { label: 'Modifier vos clients', icon: Users },
  'vault:unlock': { label: 'Déverrouiller votre coffre-fort', icon: Lock },
  offline_access: { label: 'Rester connecté', icon: Clock },
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
      // Refuse to proceed if the vault is still locked. The global
      // VaultUnlockModal in AuthProvider handles the password prompt
      // and reloads the page on success.
      if (user?.vaultLocked) {
        setErrorMsg('Vous devez déverrouiller votre coffre-fort avant de pouvoir autoriser une application.')
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
    [data]
  )

  useEffect(() => {
    if (data?.autoApprove && state === 'ready' && !user?.vaultLocked) submitDecision('allow')
  }, [data, state, submitDecision, user?.vaultLocked])

  // ---------- Vault locked blocker ----------
  // When the session is authenticated but the vault key is missing
  // (post server restart, cookie-only resume, etc.) we freeze the
  // consent screen and let the global VaultUnlockModal handle the
  // password prompt. The modal reloads on success which re-renders
  // this page with user.vaultLocked === false.
  if (user && user.vaultLocked) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.25 }}
          className="w-full max-w-sm"
        >
          <div className="rounded-2xl border border-amber-500/20 bg-card p-6 text-center">
            <div className="h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
              <Lock className="h-6 w-6 text-amber-500" />
            </div>
            <h2 className="text-base font-semibold text-foreground mb-1">
              Coffre-fort verrouillé
            </h2>
            <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
              Vous devez déverrouiller votre coffre-fort avant de pouvoir
              autoriser cette application. Saisissez votre mot de passe
              dans la fenêtre qui vient de s&apos;ouvrir pour continuer.
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
          className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 text-center"
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
  const isRedirecting = state === 'redirecting' || state === 'approving' || state === 'denying'

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <AnimatePresence mode="wait">
        <motion.div
          key="consent"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.25 }}
          className="w-full max-w-sm"
        >
          <div className="rounded-2xl border border-border bg-card p-6">
            {/* App card */}
            <div className="flex items-center gap-3 pb-5 border-b border-border">
              <div className="h-11 w-11 shrink-0 rounded-xl bg-muted/60 flex items-center justify-center overflow-hidden">
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
                  {data.client.isFirstParty && <VerifiedBadge />}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  souhaite accéder à votre compte
                </p>
              </div>
            </div>

            {/* Current user */}
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
                <Link
                  href="/login"
                  className="text-[10px] text-muted-foreground hover:text-foreground"
                >
                  Ce n'est pas toi
                </Link>
              </div>
            </div>

            {/* Permissions — compact Discord-style */}
            <div className="py-3 border-t border-border">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Accès demandé
              </p>
              <div className="max-h-[180px] overflow-y-auto pr-1 space-y-1">
                {data.scopes.map((scope) => {
                  const meta = SCOPE_META[scope] ?? { label: scope, icon: ShieldCheck }
                  const Icon = meta.icon
                  return (
                    <div
                      key={scope}
                      className="flex items-center gap-2 text-[12px] text-foreground py-1"
                    >
                      <Check className="h-3 w-3 text-emerald-500 shrink-0" />
                      <Icon className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="truncate">{meta.label}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-border flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => submitDecision('deny')}
                disabled={isRedirecting}
              >
                {state === 'denying' ? <Spinner className="h-3 w-3" /> : 'Refuser'}
              </Button>
              <Button
                size="sm"
                className="flex-1"
                onClick={() => submitDecision('allow')}
                disabled={isRedirecting}
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
