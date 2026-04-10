'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, type Variants } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RecoveryKeyDisplay } from '@/components/shared/recovery-key-display'
import { KeyRound } from 'lucide-react'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
} satisfies Variants

export default function OnboardingRecoveryKeyPage() {
  const router = useRouter()
  const [recoveryKey, setRecoveryKey] = useState<string | null>(null)

  useEffect(() => {
    const key = sessionStorage.getItem('zenvoice_recovery_key')
    if (!key) {
      router.replace('/onboarding/company')
      return
    }
    setRecoveryKey(key)
  }, [router])

  function handleContinue() {
    sessionStorage.removeItem('zenvoice_recovery_key')
    router.push('/onboarding/company')
  }

  if (!recoveryKey) return null

  return (
    <motion.div initial="hidden" animate="visible">
      <Card className="overflow-hidden border-border/50">
        <CardContent className="p-8">
          <div className="space-y-6">
            <motion.div variants={fadeUp} custom={0} className="flex flex-col items-center gap-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-soft border border-accent/20">
                <KeyRound className="h-8 w-8 text-indigo-500" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Votre clef de secours</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Cette clef vous permettra de récupérer vos données chiffrées en cas de perte de mot de passe.
                  Conservez-la dans un endroit sûr.
                </p>
              </div>
            </motion.div>

            <motion.div variants={fadeUp} custom={1}>
              <RecoveryKeyDisplay recoveryKey={recoveryKey} />
            </motion.div>

            <motion.div variants={fadeUp} custom={2}>
              <Button onClick={handleContinue} className="w-full">
                J&apos;ai sauvegardé ma clef — Continuer
              </Button>
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
