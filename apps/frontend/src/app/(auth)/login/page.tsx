'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldError } from '@/components/ui/field'
import { Avatar } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/lib/auth'
import { api } from '@/lib/api'
import { Spinner } from '@/components/ui/spinner'
import { LogOut, LayoutDashboard } from 'lucide-react'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: 'easeOut' as const },
  }),
}

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
        <Card className="overflow-hidden p-0 border-border/50">
          <CardContent className="p-8">
            <FieldGroup>
              <motion.div variants={fadeUp} custom={0} className="flex flex-col items-center gap-4 text-center">
                <Avatar
                  src={user.avatarUrl}
                  alt={user.fullName || user.email}
                  fallback={initials}
                  size="lg"
                />
                <div>
                  <h1 className="text-2xl font-bold">Déjà connecté</h1>
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
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      className="w-full max-w-md"
    >
      <Card className="overflow-hidden p-0 border-border/50">
        <CardContent className="p-8">
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <motion.div variants={fadeUp} custom={0} className="flex flex-col items-center gap-2 text-center mb-2">
                <h1 className="text-2xl font-bold">
                  {requires2FA ? 'Vérification 2FA' : 'Bon retour'}
                </h1>
                <p className="text-muted-foreground text-sm">
                  {requires2FA
                    ? 'Entrez le code de votre application authenticator'
                    : 'Connectez-vous à votre compte ZenVoice'}
                </p>
              </motion.div>

              {error && (
                <motion.div variants={fadeUp} custom={1}>
                  <FieldError className="text-center bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                    {error}
                  </FieldError>
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
                      className="text-center text-lg tracking-widest font-mono"
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
                      />
                    </Field>
                  </motion.div>

                  <motion.div variants={fadeUp} custom={3}>
                    <Field>
                      <div className="flex items-center">
                        <FieldLabel htmlFor="password">Mot de passe</FieldLabel>
                        <Link
                          href="/forgot-password"
                          className="ml-auto text-sm text-primary underline-offset-2 hover:underline"
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
                      />
                    </Field>
                  </motion.div>
                </>
              )}

              <motion.div variants={fadeUp} custom={4}>
                <Field>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <><Spinner /> {requires2FA ? 'Vérification...' : 'Connexion...'}</>
                    ) : requires2FA ? (
                      'Vérifier'
                    ) : (
                      'Se connecter'
                    )}
                  </Button>
                </Field>
              </motion.div>

              {!requires2FA && (
                <motion.div variants={fadeUp} custom={5}>
                  <FieldDescription className="text-center">
                    Pas encore de compte ?{' '}
                    <Link href="/register">Créer un compte</Link>
                  </FieldDescription>
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
        </CardContent>
      </Card>

      <motion.div variants={fadeUp} custom={6}>
        <FieldDescription className="px-6 text-center mt-4">
          En continuant, vous acceptez nos{' '}
          <a href="#">Conditions d&apos;utilisation</a> et notre{' '}
          <a href="#">Politique de confidentialité</a>.
        </FieldDescription>
      </motion.div>
    </motion.div>
  )
}
