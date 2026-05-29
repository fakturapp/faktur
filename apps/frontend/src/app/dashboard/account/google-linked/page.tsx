'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Check, ArrowLeft, ArrowRight } from 'lucide-react'

export default function GoogleLinkedPage() {
  const router = useRouter()

  useEffect(() => {
    const t = setTimeout(() => {
      router.prefetch?.('/dashboard')
    }, 1500)
    return () => clearTimeout(t)
  }, [router])

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 h-14 flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="h-9 -ml-2 gap-1.5"
            onClick={() => router.push('/dashboard/account')}
          >
            <ArrowLeft className="h-4 w-4" /> Retour
          </Button>
          <div className="ml-auto text-xs font-medium text-muted-foreground">
            Liaison Google
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-md mx-auto text-center space-y-10">
          <div className="relative h-32 flex items-center justify-center">
            <motion.div
              initial={{ x: -90, opacity: 0, scale: 0.85 }}
              animate={{ x: -56, opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="absolute"
            >
              <div className="h-20 w-20 rounded-2xl border border-border bg-card shadow-surface flex items-center justify-center">
                <GoogleLogo />
              </div>
            </motion.div>

            <ConnectionLine />

            <motion.div
              initial={{ x: 90, opacity: 0, scale: 0.85 }}
              animate={{ x: 56, opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="absolute"
            >
              <div className="h-20 w-20 rounded-2xl border border-border bg-card shadow-surface flex items-center justify-center overflow-hidden">
                <img src="/logo.svg" alt="Faktur" className="h-12 w-12" />
              </div>
            </motion.div>

            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 1.0, type: 'spring', stiffness: 280, damping: 16 }}
              className="absolute h-9 w-9 rounded-full bg-emerald-500 border-4 border-background shadow-lg flex items-center justify-center"
              style={{ left: '50%', top: '50%', x: '-50%', y: '-50%' }}
            >
              <Check className="h-4 w-4 text-white" strokeWidth={3.5} />
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-2"
          >
            <h1 className="text-2xl font-bold text-foreground">C&apos;est lié !</h1>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Votre compte Google est maintenant connecté à Faktur. Vous pouvez désormais vous connecter en un clic avec Google.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <Button onClick={() => router.push('/dashboard')} className="gap-2 min-w-[200px]">
              Retour au dashboard <ArrowRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={() => router.push('/dashboard/account')}>
              Voir mon compte
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

function GoogleLogo() {
  return (
    <svg viewBox="0 0 48 48" className="h-10 w-10" aria-hidden>
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="m6.3 14.7 6.6 4.8C14.7 16 19 13 24 13c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2L31.2 33C29.2 34.5 26.7 35.5 24 35.5c-5.3 0-9.7-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.1 5.7l6.2 5.2C41.5 35.5 44 30.1 44 24c0-1.3-.1-2.3-.4-3.5z"
      />
    </svg>
  )
}

function ConnectionLine() {
  return (
    <svg width="120" height="20" viewBox="0 0 120 20" className="absolute" aria-hidden>
      <motion.line
        x1="6"
        y1="10"
        x2="114"
        y2="10"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray="6 6"
        className="text-emerald-500/70"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.5, ease: 'easeInOut' }}
      />
      <motion.circle
        cx="60"
        cy="10"
        r="3"
        className="fill-emerald-500"
        initial={{ scale: 0 }}
        animate={{ scale: [0, 1.4, 1] }}
        transition={{ delay: 1.05, duration: 0.4, ease: 'easeOut' }}
      />
    </svg>
  )
}
