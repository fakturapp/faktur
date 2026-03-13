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

export default function RegisterPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password !== passwordConfirmation) {
      return setError('Les mots de passe ne correspondent pas')
    }

    setLoading(true)

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
      <Card className="overflow-hidden p-0 border-border/50">
        <CardContent className="p-8">
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <motion.div variants={fadeUp} custom={0} className="flex flex-col items-center gap-2 text-center mb-2">
                <h1 className="text-2xl font-bold">Creer un compte</h1>
                <p className="text-muted-foreground text-sm">
                  Rejoignez ZenVoice gratuitement
                </p>
              </motion.div>

              {error && (
                <motion.div variants={fadeUp} custom={1}>
                  <FieldError className="text-center bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                    {error}
                  </FieldError>
                </motion.div>
              )}

              <motion.div variants={fadeUp} custom={1}>
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
                  />
                </Field>
              </motion.div>

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
                  />
                </Field>
              </motion.div>

              <motion.div variants={fadeUp} custom={3}>
                <Field>
                  <FieldLabel htmlFor="password">Mot de passe</FieldLabel>
                  <Input
                    id="password"
                    type="password"
                    placeholder="8 caracteres minimum"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={8}
                    required
                  />
                </Field>
              </motion.div>

              <motion.div variants={fadeUp} custom={4}>
                <Field>
                  <FieldLabel htmlFor="passwordConfirmation">Confirmer le mot de passe</FieldLabel>
                  <Input
                    id="passwordConfirmation"
                    type="password"
                    value={passwordConfirmation}
                    onChange={(e) => setPasswordConfirmation(e.target.value)}
                    minLength={8}
                    required
                  />
                </Field>
              </motion.div>

              <motion.div variants={fadeUp} custom={5}>
                <Field>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Creation...
                      </span>
                    ) : (
                      'Creer mon compte'
                    )}
                  </Button>
                </Field>
              </motion.div>

              <motion.div variants={fadeUp} custom={6}>
                <FieldDescription className="text-center">
                  Deja un compte ?{' '}
                  <Link href="/login">Se connecter</Link>
                </FieldDescription>
              </motion.div>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  )
}
