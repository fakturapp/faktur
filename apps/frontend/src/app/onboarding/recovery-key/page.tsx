'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, type Variants } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  CheckboxRoot,
  CheckboxControl,
  CheckboxIndicator,
  CheckboxContent,
} from '@/components/ui/checkbox'
import { RecoveryKeyDisplay } from '@/components/shared/recovery-key-display'
import { useOnboardingNav } from '@/lib/onboarding-nav'
import { useAuth } from '@/lib/auth'
import { KeyRound } from '@/components/ui/icons'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
} satisfies Variants

function readRecoveryKey(
  teamId: string | null | undefined
): { key: string; storageKey: string } | null {
  if (typeof window === 'undefined') return null
  if (teamId) {
    const scoped = sessionStorage.getItem(`faktur_recovery_key_${teamId}`)
    if (scoped) return { key: scoped, storageKey: `faktur_recovery_key_${teamId}` }
  }
  const legacy = sessionStorage.getItem('zenvoice_recovery_key')
  if (legacy) return { key: legacy, storageKey: 'zenvoice_recovery_key' }
  return null
}

export default function OnboardingRecoveryKeyPage() {
  const router = useRouter()
  const nav = useOnboardingNav()
  const { user, loading } = useAuth()
  const [recoveryKey, setRecoveryKey] = useState<string | null>(null)
  const [storageKey, setStorageKey] = useState<string | null>(null)
  const [ackSaved, setAckSaved] = useState(false)

  useEffect(() => {
    if (loading) return
    const found = readRecoveryKey(user?.currentTeamId)
    if (!found) {
      router.replace('/onboarding')
      return
    }
    setRecoveryKey(found.key)
    setStorageKey(found.storageKey)
  }, [router, user, loading])

  function handleContinue() {
    if (!ackSaved) return
    if (storageKey) sessionStorage.removeItem(storageKey)
    sessionStorage.removeItem('zenvoice_recovery_key')
    nav('/onboarding/company')
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
              <CheckboxRoot
                isSelected={ackSaved}
                onChange={(checked) => setAckSaved(!!checked)}
                className="flex items-start gap-3 cursor-pointer rounded-lg border border-border p-3"
              >
                <CheckboxControl className="mt-0.5">
                  <CheckboxIndicator />
                </CheckboxControl>
                <CheckboxContent className="text-sm text-foreground leading-tight">
                  Je confirme avoir sauvegardé ma clef de secours dans un endroit sûr.
                </CheckboxContent>
              </CheckboxRoot>
            </motion.div>

            <motion.div variants={fadeUp} custom={3}>
              <Button onClick={handleContinue} className="w-full" disabled={!ackSaved}>
                Continuer
              </Button>
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
