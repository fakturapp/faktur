'use client'

import { useState } from 'react'
import { motion, type Variants } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldError } from '@/components/ui/field'
import { Avatar } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/lib/auth'
import { api } from '@/lib/api'
import { Spinner } from '@/components/ui/spinner'
import { LogOut, LayoutDashboard, ArrowRight, Shield, Zap } from 'lucide-react'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
} satisfies Variants

export default function LoginPage() {
  const router = useRouter()
  const { user, login, logout, loading: authLoading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [requires2FA, setRequires2FA] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

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
        if (!data.user.onboardingCompleted) {
          router.push('/onboarding/team')
        } else {
          router.push('/dashboard')
        }
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
    }>('/auth/login', { email, password })
    setLoading(false)

    if (err) return setError(err)

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
      login(data.token, data.user)
      if (!data.user.onboardingCompleted) {
        router.push('/onboarding/team')
      } else {
        router.push('/dashboard')
      }
    }
  }

  // Already logged in
  if (!authLoading && user) {
    const initials = user.fullName
      ? user.fullName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
      : user.email.slice(0, 2).toUpperCase()

    return (
      <motion.div initial="hidden" animate="visible" className="w-full max-w-md">
        <div className="rounded-2xl border border-border/50 bg-card p-8">
          <FieldGroup>
            <motion.div variants={fadeUp} custom={0} className="flex flex-col items-center gap-4 text-center">
              <Avatar
                src={user.avatarUrl}
                alt={user.fullName || user.email}
                fallback={initials}
                size="lg"
              />
              <div>
                <h1 className="text-2xl font-bold text-foreground">Bon retour</h1>
                <p className="text-muted-foreground text-sm mt-1">
                  Vous êtes connecté en tant que
                </p>
                <p className="font-medium text-foreground mt-0.5">
                  {user.fullName || user.email}
                </p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
            </motion.div>

            <motion.div variants={fadeUp} custom={1}>
              <Separator />
            </motion.div>

            <motion.div variants={fadeUp} custom={2} className="space-y-3">
              <Button className="w-full" onClick={() => router.push('/dashboard')}>
                <LayoutDashboard className="h-4 w-4 mr-2" />
                Aller au Dashboard
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={async () => {
                  await logout()
                }}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Se déconnecter
              </Button>
            </motion.div>
          </FieldGroup>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      className="w-full max-w-md"
    >
      <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
        {/* Decorative header */}
        <div className="relative px-8 pt-8 pb-6">
          <motion.div variants={fadeUp} custom={0} className="flex flex-col items-center gap-3 text-center">
            {requires2FA ? (
              <>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20">
                  <Shield className="h-7 w-7 text-amber-500" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Vérification 2FA</h1>
                  <p className="text-muted-foreground text-sm mt-1">
                    Entrez le code de votre application authenticator
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
                  <Zap className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Bon retour</h1>
                  <p className="text-muted-foreground text-sm mt-1">
                    Connectez-vous à votre compte Faktur
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

              {/* Google Button (placeholder) */}
              {!requires2FA && (
                <motion.div variants={fadeUp} custom={1.5}>
                  <button
                    type="button"
                    disabled
                    className="w-full flex items-center justify-center gap-3 h-11 rounded-lg border border-border bg-card text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
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

              {requires2FA ? (
                <motion.div variants={fadeUp} custom={2}>
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
                </motion.div>
              ) : (
                <>
                  <motion.div variants={fadeUp} custom={2}>
                    <Field>
                      <FieldLabel htmlFor="email">Email</FieldLabel>
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
                  </motion.div>

                  <motion.div variants={fadeUp} custom={3}>
                    <Field>
                      <div className="flex items-center">
                        <FieldLabel htmlFor="password">Mot de passe</FieldLabel>
                        <Link
                          href="/forgot-password"
                          className="ml-auto text-xs text-primary underline-offset-2 hover:underline"
                        >
                          Mot de passe oublié ?
                        </Link>
                      </div>
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="h-11"
                      />
                    </Field>
                  </motion.div>
                </>
              )}

              <motion.div variants={fadeUp} custom={4}>
                <Button type="submit" className="w-full h-11 text-sm font-semibold gap-2" disabled={loading}>
                  {loading ? (
                    <><Spinner /> {requires2FA ? 'Vérification...' : 'Connexion...'}</>
                  ) : requires2FA ? (
                    'Vérifier'
                  ) : (
                    <>Se connecter <ArrowRight className="h-4 w-4" /></>
                  )}
                </Button>
              </motion.div>

              {!requires2FA && (
                <motion.div variants={fadeUp} custom={5}>
                  <p className="text-center text-sm text-muted-foreground">
                    Pas encore de compte ?{' '}
                    <Link href="/register" className="text-primary font-medium underline-offset-2 hover:underline">
                      Créer un compte
                    </Link>
                  </p>
                </motion.div>
              )}

              {requires2FA && (
                <motion.div variants={fadeUp} custom={5}>
                  <FieldDescription className="text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setRequires2FA(false)
                        setCode('')
                        setError('')
                      }}
                      className="text-primary underline underline-offset-4 hover:text-primary/80"
                    >
                      Retour à la connexion
                    </button>
                  </FieldDescription>
                </motion.div>
              )}
            </FieldGroup>
          </form>
        </div>
      </div>

      <motion.div variants={fadeUp} custom={6}>
        <p className="px-6 text-center mt-4 text-xs text-muted-foreground">
          En continuant, vous acceptez nos{' '}
          <a href="/dashboard/legal/terms" target="_blank" className="text-primary underline-offset-2 hover:underline">Conditions d&apos;utilisation</a> et notre{' '}
          <a href="/dashboard/legal/privacy" target="_blank" className="text-primary underline-offset-2 hover:underline">Politique de confidentialité</a>.
        </p>
      </motion.div>
    </motion.div>
  )
}
