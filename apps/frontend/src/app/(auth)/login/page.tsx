'use client'

import { useState, useEffect, useRef, useCallback, Suspense } from 'react'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldError } from '@/components/ui/field'
import { Avatar } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { AccountIndicator } from '@/components/ui/account-indicator/account-indicator'
import { useAuth } from '@/lib/auth'
import { isFakturDesktop } from '@/lib/is-desktop'
import { api } from '@/lib/api'
import { Spinner } from '@/components/ui/spinner'
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile'
import { startAuthentication } from '@simplewebauthn/browser'
import { LogOut, LayoutDashboard, ArrowRight, Shield, Eye, EyeOff, KeyRound, Smartphone, Lock, Mail } from 'lucide-react'

type LoginStage = 'email' | 'password'
type EmailStatus = 'idle' | 'checking' | 'exists' | 'not-exists'
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const LAST_LOGIN_TTL_MS = 30 * 24 * 60 * 60 * 1000

const fadeIn = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
} satisfies Variants

const OAUTH_ERRORS: Record<string, string> = {
  oauth_cancelled: 'Connexion Google annulée.',
  oauth_failed: 'Erreur lors de la connexion avec Google.',
  invalid_state: 'Session expirée, veuillez réessayer.',
  email_exists: 'Un compte existe déjà avec cet email. Connectez-vous avec votre mot de passe, puis liez Google depuis les paramètres.',
  account_inactive: 'Ce compte est désactivé.',
}

function getPostLoginRedirect(onboardingCompleted: boolean, explicitRedirect?: string | null): string {
  if (!onboardingCompleted) return '/onboarding/team'
  if (explicitRedirect && explicitRedirect.startsWith('/')) {
    return explicitRedirect
  }
  const shareRedirect = typeof window !== 'undefined' ? sessionStorage.getItem('faktur_share_redirect') : null
  if (shareRedirect) {
    sessionStorage.removeItem('faktur_share_redirect')
    return shareRedirect
  }
  return '/dashboard'
}

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, login, logout, loading: authLoading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [requires2FA, setRequires2FA] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [passkeyLoading, setPasskeyLoading] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState('')
  const [redirecting, setRedirecting] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)
  const [stage, setStage] = useState<LoginStage>('email')
  const [emailStatus, setEmailStatus] = useState<EmailStatus>('idle')
  const [checkData, setCheckData] = useState<{ avatarUrl: string | null; initial: string } | null>(null)
  const turnstileRef = useRef<TurnstileInstance>(null)
  const resetTurnstile = useCallback(() => {
    setTurnstileToken('')
    turnstileRef.current?.reset()
  }, [])

  useEffect(() => {
    setIsDesktop(isFakturDesktop())
  }, [])

  useEffect(() => {
    const token = searchParams.get('token')
    const oauthError = searchParams.get('error')

    if (token) {
      window.history.replaceState({}, '', '/login')
      localStorage.setItem('faktur_token', token)
      api.get<{ user: any }>('/auth/me').then(({ data, error: err }) => {
        if (err || !data?.user) {
          localStorage.removeItem('faktur_token')
          setError('Erreur lors de la connexion automatique.')
          return
        }
        login(token, data.user)
        setRedirecting(true)
        router.push(getPostLoginRedirect(data.user.onboardingCompleted, searchParams.get('redirect')))
      })
    } else if (oauthError) {
      window.history.replaceState({}, '', '/login')
      setError(OAUTH_ERRORS[oauthError] || 'Une erreur est survenue.')
    }
  }, [])

  useEffect(() => {
    if (searchParams.get('error')) return
    if (searchParams.get('token')) return
    if (isDesktop) return
    if (stage !== 'email') return

    try {
      const raw = localStorage.getItem('faktur_last_login')
      if (!raw) return
      const parsed = JSON.parse(raw) as {
        email?: string
        avatarUrl?: string | null
        initial?: string
        ts?: number
      }
      if (!parsed.email || !parsed.ts || Date.now() - parsed.ts > LAST_LOGIN_TTL_MS) {
        localStorage.removeItem('faktur_last_login')
        return
      }
      setEmail(parsed.email)
      setCheckData({
        avatarUrl: parsed.avatarUrl ?? null,
        initial: (parsed.initial ?? parsed.email[0] ?? '?').toUpperCase(),
      })
      setEmailStatus('exists')
      setStage('password')
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDesktop])

  useEffect(() => {
    if (stage !== 'email') return
    if (requires2FA) return
    if (!email || !EMAIL_REGEX.test(email)) {
      setEmailStatus('idle')
      return
    }

    setEmailStatus('checking')
    const timer = setTimeout(async () => {
      const { data, error: err } = await api.post<{
        exists: boolean
        avatarUrl?: string | null
        initial?: string
      }>('/auth/check-email', { email })

      if (err) {
        setEmailStatus('idle')
        return
      }

      if (!data?.exists) {
        setEmailStatus('not-exists')
        return
      }

      setCheckData({
        avatarUrl: data.avatarUrl ?? null,
        initial: (data.initial ?? email[0] ?? '?').toUpperCase(),
      })
      setEmailStatus('exists')
    }, 700)

    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email, stage, requires2FA])

  async function handleGoogleLogin() {
    setError('')
    setGoogleLoading(true)
    const { data, error: err } = await api.get<{ url: string }>('/auth/oauth/google/url')
    if (err || !data?.url) {
      setGoogleLoading(false)
      return setError(err || 'Impossible de se connecter avec Google.')
    }
    window.location.href = data.url
  }

  async function handlePasskeyLogin() {
    setError('')
    setPasskeyLoading(true)
    try {
      const { data: options, error: optErr } = await api.post<any>('/auth/passkey/login-options', {})
      if (optErr || !options) {
        setPasskeyLoading(false)
        return setError(optErr || 'Impossible de démarrer l\'authentification passkey.')
      }

      const credential = await startAuthentication({ optionsJSON: options })

      const { data, error: verifyErr } = await api.post<{
        token?: string
        user?: any
        vaultKey?: string
        requiresEmailVerification?: boolean
        email?: string
      }>('/auth/passkey/login-verify', { credential })
      setPasskeyLoading(false)

      if (verifyErr) return setError(verifyErr)

      if (data?.requiresEmailVerification) {
        router.push(`/verify-email?email=${encodeURIComponent(data.email || '')}`)
        return
      }

      if (data?.token && data?.user) {
        login(data.token, data.user, data.vaultKey)
        setRedirecting(true)
        router.push(getPostLoginRedirect(data.user.onboardingCompleted, searchParams.get('redirect')))
      }
    } catch (err: any) {
      setPasskeyLoading(false)
      if (err.name === 'NotAllowedError') {
        return // User cancelled
      }
      console.error('[Passkey]', err)
      setError(err.message || 'Erreur lors de l\'authentification passkey.')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (requires2FA && userId) {
      const { data, error: err } = await api.post<{ token: string; user: any }>('/auth/login/2fa', {
        userId,
        code,
      })
      setLoading(false)
      if (err) return setError(err)
      if (data?.token) {
        login(data.token, data.user)
        setRedirecting(true)
        router.push(getPostLoginRedirect(data.user.onboardingCompleted, searchParams.get('redirect')))
      }
      return
    }

    const { data, error: err } = await api.post<{
      token?: string
      requiresTwoFactor?: boolean
      requiresEmailVerification?: boolean
      email?: string
      userId?: string
      user?: any
      vaultKey?: string
    }>('/auth/login', { email, password, turnstileToken })
    setLoading(false)

    if (err) {
      resetTurnstile()
      return setError(err)
    }

    if (data?.requiresEmailVerification) {
      router.push(`/verify-email?email=${encodeURIComponent(data.email || email)}`)
      return
    }

    if (data?.requiresTwoFactor) {
      setRequires2FA(true)
      setUserId(data.userId ?? null)
      return
    }

    if (data?.token && data?.user) {
      login(data.token, data.user, data.vaultKey)
      setRedirecting(true)
      router.push(getPostLoginRedirect(data.user.onboardingCompleted))
    }
  }

  // Auto-bounce an already-signed-in user when they arrive with a
  // ?redirect= param (e.g. coming from the OAuth consent screen).
  // We don't show the 'Bon retour' card in that case — it would look
  // like the flow got stuck.
  useEffect(() => {
    if (authLoading || !user) return
    const redirectParam = searchParams.get('redirect')
    if (redirectParam && redirectParam.startsWith('/')) {
      router.replace(redirectParam)
    }
  }, [authLoading, user, searchParams, router])

  if (redirecting) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full max-w-sm mx-auto flex flex-col items-center justify-center py-20"
      >
        <Spinner size="lg" className="text-accent" />
        <p className="mt-4 text-sm font-medium text-foreground">
          Connexion en cours...
        </p>
      </motion.div>
    )
  }

  // Desktop shell detected — the email/password login form is a
  // dead end here (no keychain, no 2FA flow, no Turnstile). Show a
  // blocker card that explains how to connect instead.
  if (isDesktop && !authLoading && !user) {
    return (
      <motion.div initial="hidden" animate="visible" className="w-full max-w-sm mx-auto">
        <div className="rounded-xl bg-overlay shadow-surface p-6 text-center">
          <div className="h-12 w-12 rounded-2xl bg-accent-soft flex items-center justify-center mx-auto mb-4">
            <Lock className="h-6 w-6 text-accent" />
          </div>
          <h1 className="text-base font-semibold text-foreground mb-1">
            Connexion via Faktur Desktop
          </h1>
          <p className="text-sm text-muted-foreground mb-5">
            La connexion par email et mot de passe n&apos;est pas disponible dans l&apos;application de
            bureau. Retournez à l&apos;écran d&apos;accueil et cliquez sur «&nbsp;Se connecter avec
            Faktur&nbsp;» pour lancer le flow OAuth sécurisé.
          </p>
          <Button
            className="w-full"
            onClick={() => {
              // Tell the main process to close this webview and bring
              // back the login window. We post a message the shell
              // preload can forward via IPC.
              if (typeof window !== 'undefined' && (window as any).fakturDesktop?.logout) {
                ;(window as any).fakturDesktop.logout()
              }
            }}
          >
            Retour à l&apos;écran de connexion
          </Button>
        </div>
      </motion.div>
    )
  }

  // Already logged in
  if (!authLoading && user) {
    const initials = user.fullName
      ? user.fullName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
      : user.email.slice(0, 2).toUpperCase()

    return (
      <motion.div initial="hidden" animate="visible" className="w-full max-w-sm mx-auto">
        <div className="space-y-6">
          <motion.div variants={fadeIn} custom={0} className="flex flex-col items-center gap-5 text-center">
            <Avatar
              src={user.avatarUrl}
              alt={user.fullName || user.email}
              fallback={initials}
              size="lg"
            />
            <div>
              <h1 className="text-xl font-bold text-foreground">Bon retour, {user.fullName?.split(' ')[0] || 'vous'} !</h1>
              <p className="text-muted-foreground text-sm mt-1">
                Connect&eacute; en tant que <span className="font-medium text-foreground">{user.fullName || user.email}</span>
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{user.email}</p>
            </div>
          </motion.div>

          <motion.div variants={fadeIn} custom={1}>
            <Separator />
          </motion.div>

          <motion.div variants={fadeIn} custom={2} className="space-y-3">
            <Button
              className="w-full h-11"
              onClick={() => {
                const redirectParam = searchParams.get('redirect')
                if (redirectParam && redirectParam.startsWith('/')) {
                  router.push(redirectParam)
                } else {
                  router.push('/dashboard')
                }
              }}
            >
              <LayoutDashboard className="h-4 w-4 mr-2" />
              Aller au Dashboard
            </Button>
            <Button
              variant="outline"
              className="w-full h-11"
              onClick={async () => { await logout() }}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Se déconnecter
            </Button>
          </motion.div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div initial="hidden" animate="visible" className="w-full max-w-sm mx-auto">
      <AnimatePresence mode="wait">
        {requires2FA ? (
          <motion.div
            key="2fa"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            <div className="space-y-8">
              {/* 2FA Header */}
              <div className="text-center space-y-3">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10">
                  <Shield className="h-6 w-6 text-amber-500" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Vérification 2FA</h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    Entrez le code de votre application authenticator
                  </p>
                </div>
              </div>

              {/* 2FA Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-center text-sm text-destructive">
                    {error}
                  </div>
                )}

                <Field>
                  <FieldLabel htmlFor="code">Code de vérification</FieldLabel>
                  <Input
                    id="code"
                    type="text"
                    placeholder="000000"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="text-center text-lg tracking-widest font-mono h-12"
                    maxLength={11}
                    required
                    autoFocus
                  />
                  <FieldDescription>
                    Entrez un code TOTP ou un code de récupération
                  </FieldDescription>
                </Field>

                <Button type="submit" className="w-full h-11 font-semibold" disabled={loading}>
                  {loading ? <><Spinner /> Vérification...</> : 'Vérifier'}
                </Button>

                <p className="text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setRequires2FA(false)
                      setCode('')
                      setError('')
                    }}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Retour à la connexion
                  </button>
                </p>
              </form>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="login"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            <div className="space-y-8">
              {/* Header */}
              <motion.div variants={fadeIn} custom={0} className="flex flex-col items-center text-center space-y-3">
                <div>
                  <h1 className="text-xl font-bold text-foreground">Bon retour</h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    Connectez-vous &agrave; votre compte
                  </p>
                </div>
              </motion.div>

              {/* Google OAuth */}
              <motion.div variants={fadeIn} custom={1}>
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={googleLoading}
                  className="w-full flex items-center justify-center gap-3 h-11 rounded-lg border border-border bg-background text-sm font-medium text-foreground transition-all hover:bg-surface-hover disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {googleLoading ? (
                    <Spinner size="sm" />
                  ) : (
                    <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                  )}
                  Continuer avec Google
                </button>
              </motion.div>

              {/* Passkey + Mobile App buttons */}
              <motion.div variants={fadeIn} custom={2} className="flex gap-2">
                <button
                  type="button"
                  onClick={handlePasskeyLogin}
                  disabled={passkeyLoading}
                  className="flex-1 flex items-center justify-center gap-2 h-9 rounded-lg border border-border bg-background text-xs font-medium text-foreground transition-all hover:bg-surface-hover disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {passkeyLoading ? (
                    <Spinner size="sm" />
                  ) : (
                    <KeyRound className="h-3.5 w-3.5" />
                  )}
                  Clé d'accès
                </button>
                <button
                  type="button"
                  disabled
                  className="flex-1 flex items-center justify-center gap-2 h-9 rounded-lg border border-border/50 bg-surface text-xs font-medium text-muted-foreground cursor-not-allowed relative"
                >
                  <Smartphone className="h-3.5 w-3.5" />
                  App mobile
                  <span className="absolute -top-2 -right-1 text-[9px] font-semibold uppercase tracking-wider bg-muted border border-border/50 rounded-full px-1.5 py-0 text-muted-foreground">
                    Bientôt
                  </span>
                </button>
              </motion.div>

              {/* Separator */}
              <motion.div variants={fadeIn} custom={3} className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-background px-3 text-xs text-muted-foreground uppercase tracking-wider rounded-full">ou</span>
                </div>
              </motion.div>

              <motion.div variants={fadeIn} custom={4}>
                <AnimatePresence mode="wait" initial={false}>
                  {stage === 'email' ? (
                    <motion.div
                      key="stage-email"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.25 }}
                    >
                      {error && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="mb-3"
                        >
                          <FieldError className="text-center bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                            {error}
                          </FieldError>
                        </motion.div>
                      )}

                      <div className="space-y-4">
                        {emailStatus === 'exists' && checkData ? (
                          <AccountIndicator
                            email={email}
                            avatarUrl={checkData.avatarUrl}
                            fallback={checkData.initial}
                            onClear={() => {
                              setEmailStatus('idle')
                              setCheckData(null)
                              setEmail('')
                              try {
                                localStorage.removeItem('faktur_last_login')
                              } catch {}
                            }}
                          />
                        ) : (
                          <div className="rounded-xl border border-border bg-card shadow-surface p-4">
                            <div className="flex items-center gap-3">
                              <div className="shrink-0 h-8 w-8 rounded-full bg-surface flex items-center justify-center">
                                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <Input
                                  id="email"
                                  type="email"
                                  placeholder="vous@exemple.com"
                                  value={email}
                                  onChange={(e) => setEmail(e.target.value)}
                                  required
                                  autoFocus
                                  aria-label="Adresse email"
                                  className="h-9 border-0 bg-transparent shadow-none focus-visible:ring-0 px-0"
                                />
                              </div>
                              {emailStatus === 'checking' && (
                                <div className="shrink-0">
                                  <Spinner size="sm" />
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {emailStatus === 'exists' && (
                          <motion.div
                            initial={{ opacity: 0, y: 14 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                          >
                            <Button
                              type="button"
                              className="w-full h-11 font-semibold gap-2"
                              onClick={() => setStage('password')}
                            >
                              Continuer <ArrowRight className="h-4 w-4" />
                            </Button>
                          </motion.div>
                        )}

                        {emailStatus === 'not-exists' && (
                          <motion.div
                            initial={{ opacity: 0, y: 14 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                          >
                            <Button
                              type="button"
                              className="w-full h-11 font-semibold gap-2"
                              onClick={() => {
                                router.push('/register?email=' + encodeURIComponent(email))
                              }}
                            >
                              Créer un compte <ArrowRight className="h-4 w-4" />
                            </Button>
                          </motion.div>
                        )}
                      </div>

                      <p className="text-center text-sm text-muted-foreground mt-6">
                        Pas encore de compte ?{' '}
                        <Link
                          href={(() => {
                            const r = searchParams.get('redirect')
                            return r ? `/register?redirect=${encodeURIComponent(r)}` : '/register'
                          })()}
                          className="text-accent font-medium hover:text-accent/80 transition-colors"
                        >
                          Créer un compte
                        </Link>
                      </p>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="stage-password"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.25 }}
                    >
                      <form onSubmit={handleSubmit}>
                        <FieldGroup>
                          {error && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                            >
                              <FieldError className="text-center bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                                {error}
                              </FieldError>
                            </motion.div>
                          )}

                          <AccountIndicator
                            email={email}
                            avatarUrl={checkData?.avatarUrl ?? null}
                            fallback={checkData?.initial ?? (email[0] ?? '?').toUpperCase()}
                            onClear={() => {
                              setStage('email')
                              setEmailStatus('idle')
                              setCheckData(null)
                              setEmail('')
                              setPassword('')
                              setError('')
                              try {
                                localStorage.removeItem('faktur_last_login')
                              } catch {}
                            }}
                          />


                          <Field>
                            <div className="flex items-center justify-between">
                              <FieldLabel htmlFor="password">Mot de passe</FieldLabel>
                              <Link
                                href="/forgot-password"
                                className="text-xs text-accent hover:text-accent/80 transition-colors"
                              >
                                Oublié ?
                              </Link>
                            </div>
                            <div className="relative">
                              <Input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                autoFocus
                                className="h-11 pr-10"
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                                tabIndex={-1}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                              >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            </div>
                          </Field>

                          {process.env.NEXT_PUBLIC_CAPTCHA_ENABLED === 'true' && process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY && (
                            <div className="flex justify-center">
                              <Turnstile
                                ref={turnstileRef}
                                siteKey={process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY}
                                onSuccess={setTurnstileToken}
                                onError={resetTurnstile}
                                onExpire={resetTurnstile}
                                options={{ theme: 'dark', language: 'fr' }}
                              />
                            </div>
                          )}

                          <Button
                            type="submit"
                            className="w-full h-11 font-semibold gap-2"
                            disabled={loading || (process.env.NEXT_PUBLIC_CAPTCHA_ENABLED === 'true' && !!process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY && !turnstileToken)}
                          >
                            {loading ? (
                              <><Spinner /> Connexion...</>
                            ) : (
                              <>Se connecter <ArrowRight className="h-4 w-4" /></>
                            )}
                          </Button>

                          <p className="text-center text-sm text-muted-foreground">
                            Pas encore de compte ?{' '}
                            <Link
                              href={(() => {
                                const r = searchParams.get('redirect')
                                return r ? `/register?redirect=${encodeURIComponent(r)}` : '/register'
                              })()}
                              className="text-accent font-medium hover:text-accent/80 transition-colors"
                            >
                              Créer un compte
                            </Link>
                          </p>
                        </FieldGroup>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legal footer */}
      <motion.p
        variants={fadeIn}
        custom={9}
        initial="hidden"
        animate="visible"
        className="text-center mt-8 text-[11px] text-muted-secondary"
      >
        En continuant, vous acceptez nos{' '}
        <a href="/legal/terms" target="_blank" className="hover:text-muted-foreground transition-colors underline underline-offset-2">CGU</a> et notre{' '}
        <a href="/legal/privacy" target="_blank" className="hover:text-muted-foreground transition-colors underline underline-offset-2">Politique de confidentialité</a>.
      </motion.p>
    </motion.div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  )
}
