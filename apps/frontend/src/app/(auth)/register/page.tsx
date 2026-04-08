'use client'

import { useState, useEffect, useRef, useCallback, Suspense } from 'react'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldGroup, FieldLabel, FieldError } from '@/components/ui/field'
import { Avatar } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Spinner } from '@/components/ui/spinner'
import { useAuth } from '@/lib/auth'
import { api } from '@/lib/api'
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile'
import { Dialog, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { ArrowRight, ArrowLeft, UserPlus, Check, Eye, EyeOff, Mail, Lock, User, Shield, AlertTriangle, MailX } from 'lucide-react'

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
}

const slideVariants: Variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 80 : -80,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -80 : 80,
    opacity: 0,
  }),
}

interface GoogleProfile {
  email: string
  fullName: string | null
  avatarUrl: string | null
  googleSub: string
}

const STEPS = [
  { id: 'email', icon: Mail, label: 'Email' },
  { id: 'identity', icon: User, label: 'Identité' },
  { id: 'password', icon: Lock, label: 'Sécurité' },
  { id: 'confirm', icon: Shield, label: 'Finaliser' },
]

function RegisterContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login } = useAuth()

  // Step
  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState(1)

  // Fields
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [acceptPrivacy, setAcceptPrivacy] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)

  // State
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState('')
  const turnstileRef = useRef<TurnstileInstance>(null)
  const resetTurnstile = useCallback(() => {
    setTurnstileToken('')
    turnstileRef.current?.reset()
  }, [])

  // Disposable email modal
  const [showDisposableModal, setShowDisposableModal] = useState(false)
  const [checkingEmail, setCheckingEmail] = useState(false)

  // Google mode
  const [googleMode, setGoogleMode] = useState(false)
  const [googleProfile, setGoogleProfile] = useState<GoogleProfile | null>(null)
  const [googleData, setGoogleData] = useState<string | null>(null)

  // Password strength
  const passwordStrength = getPasswordStrength(password)

  useEffect(() => {
    const gd = searchParams.get('google_data')
    if (!gd) return
    setGoogleData(gd)
    window.history.replaceState({}, '', '/register')
    api.post<GoogleProfile>('/auth/oauth/google/decode', { googleData: gd }).then(({ data, error: err }) => {
      if (err || !data) {
        setError('Les données Google sont invalides ou expirées. Veuillez réessayer.')
        return
      }
      setGoogleProfile(data)
      setGoogleMode(true)
      setFullName(data.fullName || '')
      setEmail(data.email)
      // Skip to password step directly
      setStep(2)
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function goNext() {
    setDirection(1)
    setError('')
    setStep((s) => Math.min(s + 1, STEPS.length - 1))
  }

  function goBack() {
    setDirection(-1)
    setError('')
    setStep((s) => Math.max(s - 1, 0))
  }

  function goToStep(target: number) {
    if (target < step) {
      setDirection(-1)
      setError('')
      setStep(target)
    }
  }

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

  async function handleStepEmailNext(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || !email.includes('@')) {
      setError('Veuillez saisir une adresse email valide')
      return
    }

    // Check disposable email blacklist
    setCheckingEmail(true)
    setError('')
    try {
      const domain = email.toLowerCase().split('@')[1]
      if (domain) {
        const res = await fetch('https://cdn.fakturapp.cc/assets/authentification/emailbacklist.json')
        if (res.ok) {
          const text = await res.text()
          let domains: string[] = []
          try {
            domains = JSON.parse(text) as string[]
          } catch {
            // JSON may be malformed — extract domains with regex
            const regex = /"([a-zA-Z0-9][a-zA-Z0-9.-]*\.[a-zA-Z]{2,})"/g
            let match: RegExpExecArray | null
            while ((match = regex.exec(text)) !== null) {
              domains.push(match[1].toLowerCase())
            }
          }
          const blacklist = new Set(domains.map((d) => d.toLowerCase().trim()))
          if (blacklist.has(domain)) {
            setCheckingEmail(false)
            setShowDisposableModal(true)
            return
          }
        }
      }
    } catch {
      // Network error — don't block registration, backend will also check
    }
    setCheckingEmail(false)
    goNext()
  }

  function handleStepIdentityNext(e: React.FormEvent) {
    e.preventDefault()
    if (!fullName.trim()) {
      setError('Veuillez saisir votre nom complet')
      return
    }
    goNext()
  }

  function handleStepPasswordNext(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères')
      return
    }
    if (password !== passwordConfirmation) {
      setError('Les mots de passe ne correspondent pas')
      return
    }
    goNext()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!acceptTerms || !acceptPrivacy) {
      return setError('Vous devez accepter les conditions et la politique de confidentialité')
    }

    setLoading(true)

    // ---------- Honor ?redirect= from the OAuth consent flow ----------
    // When the desktop client (or any OAuth caller) bounces an
    // unauthenticated user through /login → /register, we want the
    // newly-registered user to land on the OAuth authorize page
    // instead of the onboarding wizard. Onboarding still kicks in
    // automatically AFTER consent, inside the dashboard layout.
    const rawRedirect = searchParams.get('redirect')
    const safeRedirect =
      rawRedirect && rawRedirect.startsWith('/') ? rawRedirect : null

    if (googleMode && googleData) {
      const { data, error: err } = await api.post<{ token: string; user: any }>('/auth/oauth/google/register', {
        googleData,
        password,
        password_confirmation: passwordConfirmation,
        acceptTerms: true,
        acceptPrivacy: true,
      })
      setLoading(false)
      if (err) return setError(err)
      if (data?.token && data?.user) {
        login(data.token, data.user)
        router.push(safeRedirect ?? '/onboarding/team')
      }
      return
    }

    const { error: err } = await api.post('/auth/sign-up', {
      fullName,
      email,
      password,
      password_confirmation: passwordConfirmation,
      turnstileToken,
    })
    setLoading(false)

    if (err) {
      resetTurnstile()
      if (typeof err === 'string' && err.includes('temporaires')) {
        setShowDisposableModal(true)
        return
      }
      return setError(err)
    }

    // Forward redirect through verify-email so the user lands back
    // on the OAuth authorize page after confirming their email.
    const verifyUrl = safeRedirect
      ? `/verify-email?email=${encodeURIComponent(email)}&redirect=${encodeURIComponent(safeRedirect)}`
      : `/verify-email?email=${encodeURIComponent(email)}`
    router.push(verifyUrl)
  }

  return (
    <motion.div initial="hidden" animate="visible" className="w-full max-w-md">
      <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
        {/* Header with step indicator */}
        <div className="relative px-8 pt-8 pb-5">
          <motion.div variants={fadeUp} custom={0} className="flex flex-col items-center gap-4 text-center">
            {googleMode && googleProfile ? (
              <div className="flex items-center gap-3">
                <Avatar
                  src={googleProfile.avatarUrl}
                  alt={googleProfile.fullName || googleProfile.email}
                  fallback={googleProfile.fullName?.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() || '?'}
                  size="lg"
                  className="h-12 w-12 text-sm ring-4 ring-card"
                />
                <div className="text-left">
                  <h1 className="text-xl font-bold text-foreground">Finaliser l&apos;inscription</h1>
                  <p className="text-muted-foreground text-xs mt-0.5">
                    {googleProfile.email}
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
                  <UserPlus className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">Créer un compte</h1>
                  <p className="text-muted-foreground text-sm mt-0.5">
                    Rejoignez Faktur gratuitement
                  </p>
                </div>
              </>
            )}

            {/* Step indicator */}
            <div className="flex items-center gap-1 w-full mt-1">
              {STEPS.map((s, i) => {
                const isCompleted = i < step
                const isCurrent = i === step
                const StepIcon = s.icon

                // In google mode, steps 0 and 1 are auto-completed
                const isGoogleSkipped = googleMode && (i === 0 || i === 1)

                return (
                  <div key={s.id} className="flex-1 flex flex-col items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => (isCompleted || isGoogleSkipped) ? goToStep(i) : undefined}
                      className={`
                        flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all duration-300
                        ${isCompleted || isGoogleSkipped
                          ? 'bg-primary text-primary-foreground cursor-pointer hover:ring-2 hover:ring-primary/30'
                          : isCurrent
                            ? 'bg-primary/15 text-primary border-2 border-primary'
                            : 'bg-muted text-muted-foreground'
                        }
                      `}
                    >
                      {isCompleted || isGoogleSkipped ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <StepIcon className="h-3.5 w-3.5" />
                      )}
                    </button>
                    <span className={`text-[10px] font-medium transition-colors ${isCurrent ? 'text-primary' : 'text-muted-foreground'}`}>
                      {s.label}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Progress bar */}
            <div className="w-full h-1 bg-muted rounded-full overflow-hidden -mt-1">
              <motion.div
                className="h-full bg-primary rounded-full"
                initial={{ width: '0%' }}
                animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
              />
            </div>
          </motion.div>
        </div>

        {/* Step content */}
        <div className="px-8 pb-8 min-h-[320px]">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4"
            >
              <FieldError className="text-center bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                {error}
              </FieldError>
            </motion.div>
          )}

          <AnimatePresence mode="wait" custom={direction}>
            {/* Step 0: Email */}
            {step === 0 && (
              <motion.div
                key="step-email"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                <form onSubmit={handleStepEmailNext}>
                  <FieldGroup>
                    <p className="text-sm text-muted-foreground mb-2">
                      Commençons par votre adresse email pour créer votre compte.
                    </p>

                    {/* Google Button */}
                    <button
                      type="button"
                      onClick={handleGoogleLogin}
                      disabled={googleLoading}
                      className="w-full flex items-center justify-center gap-3 h-11 rounded-lg border border-border bg-card text-sm font-medium text-foreground transition-colors hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {googleLoading ? (
                        <Spinner size="sm" />
                      ) : (
                        <svg className="h-5 w-5" viewBox="0 0 24 24">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                      )}
                      Continuer avec Google
                    </button>

                    <div className="relative my-3">
                      <div className="absolute inset-0 flex items-center">
                        <Separator />
                      </div>
                      <div className="relative flex justify-center">
                        <span className="bg-card px-3 text-xs text-muted-foreground">ou par email</span>
                      </div>
                    </div>

                    <Field>
                      <FieldLabel htmlFor="email">Adresse email</FieldLabel>
                      <Input
                        id="email"
                        type="email"
                        placeholder="vous@exemple.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoFocus
                        className="h-11"
                      />
                    </Field>

                    <Button type="submit" className="w-full h-11 text-sm font-semibold gap-2 mt-2" disabled={checkingEmail}>
                      {checkingEmail ? (
                        <><Spinner size="sm" /> Vérification...</>
                      ) : (
                        <>Continuer <ArrowRight className="h-4 w-4" /></>
                      )}
                    </Button>
                  </FieldGroup>
                </form>
              </motion.div>
            )}

            {/* Step 1: Identity */}
            {step === 1 && (
              <motion.div
                key="step-identity"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                <form onSubmit={handleStepIdentityNext}>
                  <FieldGroup>
                    <p className="text-sm text-muted-foreground mb-2">
                      Comment devons-nous vous appeler ?
                    </p>

                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border mb-2">
                      <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-sm text-foreground truncate">{email}</span>
                      <button type="button" onClick={() => goToStep(0)} className="text-xs text-primary font-medium ml-auto shrink-0 hover:underline">
                        Modifier
                      </button>
                    </div>

                    <Field>
                      <FieldLabel htmlFor="fullName">Nom complet</FieldLabel>
                      <Input
                        id="fullName"
                        type="text"
                        placeholder="Jean Dupont"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        autoFocus
                        className="h-11"
                      />
                    </Field>

                    <div className="flex gap-3 mt-2">
                      <Button type="button" variant="outline" className="h-11 flex-1" onClick={goBack}>
                        <ArrowLeft className="h-4 w-4 mr-2" /> Retour
                      </Button>
                      <Button type="submit" className="h-11 flex-1 font-semibold gap-2">
                        Continuer <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </FieldGroup>
                </form>
              </motion.div>
            )}

            {/* Step 2: Password */}
            {step === 2 && (
              <motion.div
                key="step-password"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                <form onSubmit={handleStepPasswordNext}>
                  <FieldGroup>
                    <p className="text-sm text-muted-foreground mb-2">
                      Choisissez un mot de passe sécurisé pour protéger votre compte.
                    </p>

                    <Field>
                      <FieldLabel htmlFor="password">Mot de passe</FieldLabel>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="8 caractères minimum"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          minLength={8}
                          required
                          autoFocus
                          className="h-11 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          tabIndex={-1}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </Field>

                    {/* Password strength indicator */}
                    {password.length > 0 && (
                      <div className="space-y-1.5">
                        <div className="flex gap-1">
                          {[1, 2, 3, 4].map((level) => (
                            <div
                              key={level}
                              className="flex-1 h-1 rounded-full transition-colors duration-300"
                              style={{
                                backgroundColor: level <= passwordStrength.level
                                  ? passwordStrength.color
                                  : 'var(--muted)',
                              }}
                            />
                          ))}
                        </div>
                        <p className="text-[11px] font-medium" style={{ color: passwordStrength.color }}>
                          {passwordStrength.label}
                        </p>
                      </div>
                    )}

                    <Field>
                      <FieldLabel htmlFor="passwordConfirmation">Confirmer le mot de passe</FieldLabel>
                      <div className="relative">
                        <Input
                          id="passwordConfirmation"
                          type={showPasswordConfirm ? 'text' : 'password'}
                          value={passwordConfirmation}
                          onChange={(e) => setPasswordConfirmation(e.target.value)}
                          minLength={8}
                          required
                          className="h-11 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          tabIndex={-1}
                        >
                          {showPasswordConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </Field>

                    {password && passwordConfirmation && password === passwordConfirmation && (
                      <div className="flex items-center gap-2 text-green-500">
                        <Check className="h-3.5 w-3.5" />
                        <span className="text-xs font-medium">Les mots de passe correspondent</span>
                      </div>
                    )}

                    <div className="flex gap-3 mt-2">
                      {!googleMode && (
                        <Button type="button" variant="outline" className="h-11 flex-1" onClick={goBack}>
                          <ArrowLeft className="h-4 w-4 mr-2" /> Retour
                        </Button>
                      )}
                      <Button type="submit" className={`h-11 font-semibold gap-2 ${googleMode ? 'w-full' : 'flex-1'}`}>
                        Continuer <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </FieldGroup>
                </form>
              </motion.div>
            )}

            {/* Step 3: Confirm / Terms */}
            {step === 3 && (
              <motion.div
                key="step-confirm"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                <form onSubmit={handleSubmit}>
                  <FieldGroup>
                    <p className="text-sm text-muted-foreground mb-2">
                      Dernière étape ! Vérifiez vos informations et acceptez les conditions.
                    </p>

                    {/* Summary */}
                    <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground">Nom</p>
                          <p className="text-sm font-medium text-foreground truncate">{fullName}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                          <Mail className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground">Email</p>
                          <p className="text-sm font-medium text-foreground truncate">{email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                          <Lock className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground">Mot de passe</p>
                          <p className="text-sm font-medium text-foreground">{'•'.repeat(password.length)}</p>
                        </div>
                      </div>
                      {googleMode && (
                        <div className="flex items-center gap-2 pt-1">
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500/10">
                            <Check className="h-3 w-3 text-green-500" />
                          </div>
                          <span className="text-xs text-green-500 font-medium">Email vérifié par Google</span>
                        </div>
                      )}
                    </div>

                    {/* Terms */}
                    <div className="space-y-3">
                      <label className="flex items-start gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={acceptTerms}
                          onChange={(e) => setAcceptTerms(e.target.checked)}
                          className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary/20 accent-primary"
                        />
                        <span className="text-sm text-muted-foreground leading-tight">
                          J&apos;accepte les{' '}
                          <a href="/legal/terms" target="_blank" className="text-primary underline-offset-2 hover:underline">
                            Conditions g&eacute;n&eacute;rales d&apos;utilisation
                          </a>
                        </span>
                      </label>

                      <label className="flex items-start gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={acceptPrivacy}
                          onChange={(e) => setAcceptPrivacy(e.target.checked)}
                          className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary/20 accent-primary"
                        />
                        <span className="text-sm text-muted-foreground leading-tight">
                          J&apos;accepte la{' '}
                          <a href="/legal/privacy" target="_blank" className="text-primary underline-offset-2 hover:underline">
                            Politique de confidentialit&eacute;
                          </a>
                        </span>
                      </label>
                    </div>

                    {process.env.NEXT_PUBLIC_CAPTCHA_ENABLED === 'true' && process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY && !googleMode && (
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

                    <div className="flex gap-3 mt-2">
                      <Button type="button" variant="outline" className="h-11 flex-1" onClick={goBack}>
                        <ArrowLeft className="h-4 w-4 mr-2" /> Retour
                      </Button>
                      <Button
                        type="submit"
                        className="h-11 flex-1 font-semibold gap-2"
                        disabled={loading || !acceptTerms || !acceptPrivacy || (!googleMode && process.env.NEXT_PUBLIC_CAPTCHA_ENABLED === 'true' && !!process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY && !turnstileToken)}
                      >
                        {loading ? (
                          <><Spinner /> Création...</>
                        ) : (
                          <>{googleMode ? "Finaliser" : "Créer mon compte"} <ArrowRight className="h-4 w-4" /></>
                        )}
                      </Button>
                    </div>
                  </FieldGroup>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ---------- Login link (preserves redirect) ---------- */}
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Déjà un compte ?{' '}
              <Link
                href={(() => {
                  const r = searchParams.get('redirect')
                  return r ? `/login?redirect=${encodeURIComponent(r)}` : '/login'
                })()}
                className="text-primary font-medium underline-offset-2 hover:underline"
              >
                Se connecter
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Disposable email modal */}
      <Dialog open={showDisposableModal} onClose={() => setShowDisposableModal(false)}>
        <div className="p-6 max-w-md">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10">
              <MailX className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <DialogTitle>Email temporaire détecté</DialogTitle>
              <DialogDescription>Ce type d&apos;adresse n&apos;est pas autorisé</DialogDescription>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                <p className="text-sm text-foreground leading-relaxed">
                  Les adresses email temporaires ou jetables ne sont pas autorisées sur Faktur. Veuillez utiliser une adresse email permanente (Gmail, Outlook, votre domaine professionnel, etc.).
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-muted/30 p-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Si vous pensez que votre adresse est légitime, contactez notre support pour faire whitelister votre domaine :
              </p>
              <a
                href="mailto:support@fakturapp.cc"
                className="inline-flex items-center gap-2 mt-2 px-3 py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
              >
                <Mail className="h-4 w-4" />
                support@fakturapp.cc
              </a>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setShowDisposableModal(false)} className="w-full">
              Compris, je vais changer d&apos;email
            </Button>
          </DialogFooter>
        </div>
      </Dialog>
    </motion.div>
  )
}

function getPasswordStrength(password: string): { level: number; label: string; color: string } {
  if (!password) return { level: 0, label: '', color: '' }
  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++
  if (/\d/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  if (score <= 1) return { level: 1, label: 'Faible', color: '#ef4444' }
  if (score === 2) return { level: 2, label: 'Moyen', color: '#f97316' }
  if (score === 3) return { level: 3, label: 'Bon', color: '#eab308' }
  return { level: 4, label: 'Excellent', color: '#22c55e' }
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterContent />
    </Suspense>
  )
}
