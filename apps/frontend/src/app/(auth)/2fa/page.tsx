'use client'

import { useState, Suspense } from 'react'
import { motion, type Variants } from 'framer-motion'
import { useSearchParams, useRouter } from 'next/navigation'
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

function TwoFactorContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const userId = searchParams.get('userId')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [useRecovery, setUseRecovery] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { data, error: err } = await api.post<{ token: string }>('/auth/login/2fa', {
      userId,
      code,
    })
    setLoading(false)

    if (err) return setError(err)

    if (data?.token) {
      localStorage.setItem('faktur_token', data.token)
      router.push('/dashboard')
    }
  }

  if (!userId) {
    return (
      <div className="w-full max-w-md">
        <Card className="overflow-hidden p-0 border-border/50">
          <CardContent className="p-8 text-center">
            <h1 className="text-2xl font-bold mb-4">Session invalide</h1>
            <p className="text-muted-foreground mb-4">Veuillez vous reconnecter.</p>
            <Link href="/login">
              <Button>Retour a la connexion</Button>
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
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <motion.div variants={fadeUp} custom={0} className="flex flex-col items-center gap-4 text-center mb-2">
                <div className="w-16 h-16 rounded-full bg-accent-soft flex items-center justify-center">
                  <svg className="h-8 w-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold">Verification 2FA</h1>
                <p className="text-muted-foreground text-sm">
                  {useRecovery
                    ? 'Entrez un de vos codes de récupération'
                    : 'Entrez le code a 6 chiffres de votre application authenticator'}
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
                  <FieldLabel htmlFor="code">
                    {useRecovery ? 'Code de récupération' : 'Code de vérification'}
                  </FieldLabel>
                  <Input
                    id="code"
                    type="text"
                    placeholder={useRecovery ? 'XXXXX-XXXXX' : '000000'}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="text-center text-lg tracking-widest font-mono"
                    maxLength={useRecovery ? 11 : 6}
                    required
                    autoFocus
                  />
                </Field>
              </motion.div>

              <motion.div variants={fadeUp} custom={3}>
                <Field>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? <><Spinner /> Vérification...</> : 'Vérifier'}
                  </Button>
                </Field>
              </motion.div>

              <motion.div variants={fadeUp} custom={4}>
                <FieldDescription className="text-center space-y-2">
                  <button
                    type="button"
                    onClick={() => {
                      setUseRecovery(!useRecovery)
                      setCode('')
                      setError('')
                    }}
                    className="text-accent underline underline-offset-4 hover:text-accent/80 block mx-auto"
                  >
                    {useRecovery
                      ? 'Utiliser le code authenticator'
                      : 'Utiliser un code de récupération'}
                  </button>
                  <Link href="/login" className="text-muted-foreground hover:text-foreground block">
                    Retour a la connexion
                  </Link>
                </FieldDescription>
              </motion.div>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default function TwoFactorPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Spinner size="lg" className="text-primary" /></div>}>
      <TwoFactorContent />
    </Suspense>
  )
}
