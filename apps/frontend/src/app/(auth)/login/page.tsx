'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldError } from '@/components/ui/field'
import { api } from '@/lib/api'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: 'easeOut' },
  }),
}

export default function LoginPage() {
  const router = useRouter()
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
      const { data, error: err } = await api.post<{ token: string }>('/auth/login/2fa', {
        userId,
        code,
      })
      setLoading(false)
      if (err) return setError(err)
      if (data?.token) {
        localStorage.setItem('zenvoice_token', data.token)
        router.push('/dashboard')
      }
      return
    }

    const { data, error: err } = await api.post<{
      token?: string
      requiresTwoFactor?: boolean
      userId?: string
    }>('/auth/login', { email, password })
    setLoading(false)

    if (err) return setError(err)

    if (data?.requiresTwoFactor) {
      setRequires2FA(true)
      setUserId(data.userId ?? null)
      return
    }

    if (data?.token) {
      localStorage.setItem('zenvoice_token', data.token)
      router.push('/dashboard')
    }
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
                  {requires2FA ? 'Verification 2FA' : 'Bon retour'}
                </h1>
                <p className="text-muted-foreground text-sm">
                  {requires2FA
                    ? 'Entrez le code de votre application authenticator'
                    : 'Connectez-vous a votre compte ZenVoice'}
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
                    <FieldLabel htmlFor="code">Code de verification</FieldLabel>
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
                      Entrez un code TOTP ou un code de recuperation
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
                          Mot de passe oublie ?
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
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Connexion...
                      </span>
                    ) : requires2FA ? (
                      'Verifier'
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
                    <Link href="/register">Creer un compte</Link>
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
                      Retour a la connexion
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
          <a href="#">Politique de confidentialite</a>.
        </FieldDescription>
      </motion.div>
    </motion.div>
  )
}
