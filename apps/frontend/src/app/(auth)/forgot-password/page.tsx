'use client'

import { useState } from 'react'
import { motion, type Variants } from 'framer-motion'
import Link from 'next/link'
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
    transition: { delay: i * 0.08, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
} satisfies Variants

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error: err } = await api.post('/auth/password/forgot', { email })
    setLoading(false)

    if (err) return setError(err)
    setSuccess(true)
  }

  return (
    <motion.div initial="hidden" animate="visible" className="w-full max-w-sm">
      <Card className="overflow-hidden p-0 border-border/50">
        <CardContent className="p-8">
          {success ? (
            <FieldGroup>
              <motion.div variants={fadeUp} custom={0} className="flex flex-col items-center gap-4 text-center">
                <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center">
                  <svg className="h-8 w-8 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold">Email envoyé</h1>
                <p className="text-muted-foreground text-sm">
                  Si un compte existe avec cette adresse, vous recevrez un lien de réinitialisation.
                </p>
                <Link href="/login">
                  <Button variant="outline" className="mt-2">Retour à la connexion</Button>
                </Link>
              </motion.div>
            </FieldGroup>
          ) : (
            <form onSubmit={handleSubmit}>
              <FieldGroup>
                <motion.div variants={fadeUp} custom={0} className="flex flex-col items-center gap-2 text-center mb-2">
                  <h1 className="text-2xl font-bold">Mot de passe oublié</h1>
                  <p className="text-muted-foreground text-sm">
                    Entrez votre email pour recevoir un lien de réinitialisation
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
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? <><Spinner /> Envoi...</> : 'Envoyer le lien'}
                    </Button>
                  </Field>
                </motion.div>

                <motion.div variants={fadeUp} custom={4}>
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
