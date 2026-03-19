'use client'

import { useState, useEffect, Suspense } from 'react'
import { motion, type Variants } from 'framer-motion'
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
import { ArrowRight, UserPlus, Check } from 'lucide-react'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
} satisfies Variants

interface GoogleProfile {
  email: string
  fullName: string | null
  avatarUrl: string | null
  googleSub: string
}

function RegisterContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login } = useAuth()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [acceptPrivacy, setAcceptPrivacy] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  // Google mode
  const [googleMode, setGoogleMode] = useState(false)
  const [googleProfile, setGoogleProfile] = useState<GoogleProfile | null>(null)
  const [googleData, setGoogleData] = useState<string | null>(null)

  // Detect ?google_data= in URL and decode the profile
  useEffect(() => {
    const gd = searchParams.get('google_data')
    if (!gd) return
    setGoogleData(gd)
    // Remove from URL
    window.history.replaceState({}, '', '/register')
    // Decode the profile
    api.post<GoogleProfile>('/auth/oauth/google/decode', { googleData: gd }).then(({ data, error: err }) => {
      if (err || !data) {
        setError('Les données Google sont invalides ou expirées. Veuillez réessayer.')
        return
      }
      setGoogleProfile(data)
      setGoogleMode(true)
      setFullName(data.fullName || '')
      setEmail(data.email)
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!acceptTerms || !acceptPrivacy) {
      return setError('Vous devez accepter les conditions et la politique de confidentialité')
    }

    if (password !== passwordConfirmation) {
      return setError('Les mots de passe ne correspondent pas')
    }

    setLoading(true)

    if (googleMode && googleData) {
      // Google register flow
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
        router.push('/onboarding/team')
      }
      return
    }

    // Normal register flow
    const { error: err } = await api.post('/auth/sign-up', {
      fullName,
      email,
      password,
      password_confirmation: passwordConfirmation,
    })
    setLoading(false)

    if (err) return setError(err)
    router.push(`/verify-email?email=${encodeURIComponent(email)}`)
  }

  return (
    <motion.div initial="hidden" animate="visible" className="w-full max-w-md">
      <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
        {/* Decorative header */}
        <div className="relative px-8 pt-8 pb-6">
          <motion.div variants={fadeUp} custom={0} className="flex flex-col items-center gap-3 text-center">
            {googleMode && googleProfile ? (
              <>
                <Avatar
                  src={googleProfile.avatarUrl}
                  alt={googleProfile.fullName || googleProfile.email}
                  fallback={googleProfile.fullName?.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() || '?'}
                  size="lg"
                  className="h-16 w-16 text-base ring-4 ring-card"
                />
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Finaliser l&apos;inscription</h1>
                  <p className="text-muted-foreground text-sm mt-1">
                    {googleProfile.fullName && <span className="font-medium text-foreground">{googleProfile.fullName}</span>}
                    {googleProfile.fullName && ' — '}
                    {googleProfile.email}
                  </p>
                  <div className="flex items-center justify-center gap-1.5 mt-2">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500/10">
                      <Check className="h-3 w-3 text-green-500" />
                    </div>
                    <span className="text-xs text-green-500">Email vérifié par Google</span>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
                  <UserPlus className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Créer un compte</h1>
                  <p className="text-muted-foreground text-sm mt-1">
                    Rejoignez Faktur gratuitement
                  </p>
                </div>
              </>
            )}
          </motion.div>
        </div>

        {/* Form */}
        <div className="px-8 pb-8">
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              {error && (
                <motion.div variants={fadeUp} custom={1}>
                  <FieldError className="text-center bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                    {error}
                  </FieldError>
                </motion.div>
              )}

              {/* Google Button */}
              {!googleMode && (
                <motion.div variants={fadeUp} custom={1.5}>
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

                  <div className="relative my-5">
                    <div className="absolute inset-0 flex items-center">
                      <Separator />
                    </div>
                    <div className="relative flex justify-center">
                      <span className="bg-card px-3 text-xs text-muted-foreground">ou par email</span>
                    </div>
                  </div>
                </motion.div>
              )}

              <motion.div variants={fadeUp} custom={2}>
                <Field>
                  <FieldLabel htmlFor="fullName">Nom complet</FieldLabel>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Jean Dupont"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    autoFocus={!googleMode}
                    disabled={googleMode}
                    className={`h-11 ${googleMode ? 'opacity-60' : ''}`}
                  />
                </Field>
              </motion.div>

              <motion.div variants={fadeUp} custom={3}>
                <Field>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    placeholder="vous@exemple.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={googleMode}
                    className={`h-11 ${googleMode ? 'opacity-60' : ''}`}
                  />
                </Field>
              </motion.div>

              <motion.div variants={fadeUp} custom={4}>
                <Field>
                  <FieldLabel htmlFor="password">Mot de passe</FieldLabel>
                  <Input
                    id="password"
                    type="password"
                    placeholder="8 caractères minimum"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={8}
                    required
                    className="h-11"
                  />
                </Field>
              </motion.div>

              <motion.div variants={fadeUp} custom={5}>
                <Field>
                  <FieldLabel htmlFor="passwordConfirmation">Confirmer le mot de passe</FieldLabel>
                  <Input
                    id="passwordConfirmation"
                    type="password"
                    value={passwordConfirmation}
                    onChange={(e) => setPasswordConfirmation(e.target.value)}
                    minLength={8}
                    required
                    className="h-11"
                  />
                </Field>
              </motion.div>

              {/* Terms & Privacy checkboxes */}
              <motion.div variants={fadeUp} custom={6} className="space-y-3">
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
              </motion.div>

              <motion.div variants={fadeUp} custom={7}>
                <Button
                  type="submit"
                  className="w-full h-11 text-sm font-semibold gap-2"
                  disabled={loading || !acceptTerms || !acceptPrivacy}
                >
                  {loading ? (
                    <><Spinner /> {googleMode ? 'Inscription...' : 'Création...'}</>
                  ) : (
                    <>{googleMode ? 'Finaliser l\'inscription' : 'Créer mon compte'} <ArrowRight className="h-4 w-4" /></>
                  )}
                </Button>
              </motion.div>

              <motion.div variants={fadeUp} custom={8}>
                <p className="text-center text-sm text-muted-foreground">
                  Déjà un compte ?{' '}
                  <Link href="/login" className="text-primary font-medium underline-offset-2 hover:underline">
                    Se connecter
                  </Link>
                </p>
              </motion.div>
            </FieldGroup>
          </form>
        </div>
      </div>
    </motion.div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterContent />
    </Suspense>
  )
}
