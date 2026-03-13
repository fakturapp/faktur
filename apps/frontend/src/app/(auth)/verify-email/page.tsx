'use client'

import { useState, useEffect, Suspense } from 'react'
import { motion } from 'framer-motion'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { FieldGroup, FieldDescription, FieldError } from '@/components/ui/field'
import { useAuth } from '@/lib/auth'
import { api } from '@/lib/api'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: 'easeOut' as const },
  }),
}

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
          // Check if error is about already verified
          if (error.toLowerCase().includes('already verified') || error.toLowerCase().includes('invalid')) {
            setStatus('error')
          } else {
            setStatus('error')
          }
          setMessage(error)
        } else {
          setStatus('success')
          setMessage((data as { message?: string })?.message || 'Email verifie avec succes !')
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
      setMessage('Un nouveau lien de verification a ete envoye.')
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
                  <h1 className="text-2xl font-bold">Email deja verifie</h1>
                  <p className="text-muted-foreground text-sm">
                    Votre adresse email <span className="font-medium text-foreground">{user?.email}</span> est deja verifiee.
                  </p>
                  <Link href="/">
                    <Button className="mt-2">Aller au Dashboard</Button>
                  </Link>
                </>
              )}

              {status === 'verifying' && (
                <>
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <svg className="animate-spin h-8 w-8 text-primary" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  </div>
                  <h1 className="text-2xl font-bold">Verification en cours...</h1>
                </>
              )}

              {status === 'success' && (
                <>
                  <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center">
                    <svg className="h-8 w-8 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h1 className="text-2xl font-bold">Email verifie !</h1>
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
                  <h1 className="text-2xl font-bold">Erreur de verification</h1>
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
                  <h1 className="text-2xl font-bold">Verifiez votre email</h1>
                  <p className="text-muted-foreground text-sm">
                    Nous avons envoye un lien de verification a{' '}
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
                      {resendLoading ? 'Envoi...' : 'Renvoyer le lien'}
                    </Button>
                  )}
                </>
              )}
            </motion.div>

            {status !== 'already_verified' && (
              <motion.div variants={fadeUp} custom={1}>
                <FieldDescription className="text-center">
                  <Link href="/login" className="text-primary underline underline-offset-4">
                    Retour a la connexion
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
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Chargement...</div>}>
      <VerifyEmailContent />
    </Suspense>
  )
}
