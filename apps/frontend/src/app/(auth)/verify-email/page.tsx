'use client'

import { useState, useEffect, Suspense } from 'react'
import { motion, type Variants } from 'framer-motion'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { FieldGroup, FieldDescription, FieldError } from '@/components/ui/field'
import { useAuth } from '@/lib/auth'
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

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const token = searchParams.get('token')
  const email = searchParams.get('email')
  const [status, setStatus] = useState<'pending' | 'verifying' | 'success' | 'error' | 'already_verified'>('pending')
  const [message, setMessage] = useState('')
  const [resendLoading, setResendLoading] = useState(false)

  // If user is logged in and email is already verified
  useEffect(() => {
    if (user?.emailVerified && !token) {
      setStatus('already_verified')
    }
  }, [user, token])

  useEffect(() => {
    if (token) {
      setStatus('verifying')
      api.post('/auth/verify-email', { token }).then(({ data, error }) => {
        if (error) {
          setStatus('error')
          setMessage(error)
        } else {
          setStatus('success')
          setMessage((data as { message?: string })?.message || 'Email vérifié avec succès !')
        }
      })
    }
  }, [token])

  async function handleResend() {
    if (!email) return
    setResendLoading(true)
    const { error } = await api.post('/auth/resend-verification', { email })
    setResendLoading(false)
    if (error) {
      setMessage(error)
    } else {
      setMessage('Un nouveau lien de vérification a été envoyé.')
    }
  }

  return (
    <motion.div initial="hidden" animate="visible" className="w-full max-w-md">
      <Card className="overflow-hidden p-0 border-border/50">
        <CardContent className="p-8">
          <FieldGroup>
            <motion.div variants={fadeUp} custom={0} className="flex flex-col items-center gap-4 text-center">
              {status === 'already_verified' && (
                <>
                  <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center">
                    <svg className="h-8 w-8 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h1 className="text-2xl font-bold">Email déjà vérifié</h1>
                  <p className="text-muted-foreground text-sm">
                    Votre adresse email <span className="font-medium text-foreground">{user?.email}</span> est déjà vérifiée.
                  </p>
                  <Link href="/dashboard">
                    <Button className="mt-2">Aller au Dashboard</Button>
                  </Link>
                </>
              )}

              {status === 'verifying' && (
                <>
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Spinner size="lg" className="text-primary" />
                  </div>
                  <h1 className="text-2xl font-bold">Vérification en cours...</h1>
                </>
              )}

              {status === 'success' && (
                <>
                  <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center">
                    <svg className="h-8 w-8 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h1 className="text-2xl font-bold">Email vérifié !</h1>
                  <p className="text-muted-foreground text-sm">{message}</p>
                  <Link href="/login">
                    <Button className="mt-2">Se connecter</Button>
                  </Link>
                </>
              )}

              {status === 'error' && (
                <>
                  <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                    <svg className="h-8 w-8 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <h1 className="text-2xl font-bold">Erreur de vérification</h1>
                  <FieldError>{message}</FieldError>
                </>
              )}

              {status === 'pending' && (
                <>
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <svg className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h1 className="text-2xl font-bold">Vérifiez votre email</h1>
                  <p className="text-muted-foreground text-sm">
                    Nous avons envoyé un lien de vérification à{' '}
                    <span className="font-medium text-foreground">{email || 'votre adresse email'}</span>.
                  </p>
                  {message && <p className="text-sm text-success">{message}</p>}
                  {email && (
                    <Button
                      variant="outline"
                      onClick={handleResend}
                      disabled={resendLoading}
                      className="mt-2"
                    >
                      {resendLoading ? <><Spinner /> Envoi...</> : 'Renvoyer le lien'}
                    </Button>
                  )}
                </>
              )}
            </motion.div>

            {status !== 'already_verified' && (
              <motion.div variants={fadeUp} custom={1}>
                <FieldDescription className="text-center">
                  <Link href="/login" className="text-primary underline underline-offset-4">
                    Retour à la connexion
                  </Link>
                </FieldDescription>
              </motion.div>
            )}
          </FieldGroup>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Spinner size="lg" className="text-primary" /></div>}>
      <VerifyEmailContent />
    </Suspense>
  )
}
