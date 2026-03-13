'use client'

import { useState, Suspense } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldError } from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'
import { api } from '@/lib/api'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: 'easeOut' },
  }),
}

function ResetPasswordContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password !== passwordConfirmation) {
      return setError('Les mots de passe ne correspondent pas')
    }

    setLoading(true)

    const { error: err } = await api.post('/auth/password/reset', {
      token,
      password,
      password_confirmation: passwordConfirmation,
    })
    setLoading(false)

    if (err) return setError(err)
    setSuccess(true)
  }

  if (!token) {
    return (
      <div className="w-full max-w-md">
        <Card className="overflow-hidden p-0 border-border/50">
          <CardContent className="p-8 text-center">
            <h1 className="text-2xl font-bold mb-4">Lien invalide</h1>
            <p className="text-muted-foreground mb-4">
              Ce lien de réinitialisation est invalide ou a expiré.
            </p>
            <Link href="/forgot-password">
              <Button>Demander un nouveau lien</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <motion.div initial="hidden" animate="visible" className="w-full max-w-md">
      <Card className="overflow-hidden p-0 border-border/50">
        <CardContent className="p-8">
          {success ? (
            <FieldGroup>
              <motion.div variants={fadeUp} custom={0} className="flex flex-col items-center gap-4 text-center">
                <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center">
                  <svg className="h-8 w-8 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold">Mot de passe modifié</h1>
                <p className="text-muted-foreground text-sm">
                  Votre mot de passe a été réinitialisé avec succès.
                </p>
                <Link href="/login">
                  <Button className="mt-2">Se connecter</Button>
                </Link>
              </motion.div>
            </FieldGroup>
          ) : (
            <form onSubmit={handleSubmit}>
              <FieldGroup>
                <motion.div variants={fadeUp} custom={0} className="flex flex-col items-center gap-2 text-center mb-2">
                  <h1 className="text-2xl font-bold">Nouveau mot de passe</h1>
                  <p className="text-muted-foreground text-sm">
                    Choisissez un nouveau mot de passe sécurisé
                  </p>
                </motion.div>

                {error && (
                  <motion.div variants={fadeUp} custom={1}>
                    <FieldError className="text-center bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                      {error}
                    </FieldError>
                  </motion.div>
                )}

                <motion.div variants={fadeUp} custom={2}>
                  <Field>
                    <FieldLabel htmlFor="password">Nouveau mot de passe</FieldLabel>
                    <Input
                      id="password"
                      type="password"
                      placeholder="8 caractères minimum"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      minLength={8}
                      required
                      autoFocus
                    />
                  </Field>
                </motion.div>

                <motion.div variants={fadeUp} custom={3}>
                  <Field>
                    <FieldLabel htmlFor="passwordConfirmation">Confirmer</FieldLabel>
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

                <motion.div variants={fadeUp} custom={4}>
                  <Field>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? <><Spinner /> Réinitialisation...</> : 'Réinitialiser le mot de passe'}
                    </Button>
                  </Field>
                </motion.div>

                <motion.div variants={fadeUp} custom={5}>
                  <FieldDescription className="text-center">
                    <Link href="/login">Retour à la connexion</Link>
                  </FieldDescription>
                </motion.div>
              </FieldGroup>
            </form>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Spinner size="lg" className="text-primary" /></div>}>
      <ResetPasswordContent />
    </Suspense>
  )
}
