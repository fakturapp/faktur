'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, type Variants } from 'framer-motion'
import { Upload, Users } from '@/components/ui/icons'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Field, FieldGroup, FieldLabel, FieldError } from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'
import { useAuth } from '@/lib/auth'
import { api } from '@/lib/api'
import {
  EncryptionModeChooser,
  type EncryptionMode,
  type EncryptionAcks,
} from '@/components/team/encryption-mode-chooser'
import { ConfirmPasswordModal } from '@/components/team/confirm-password-modal'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
} satisfies Variants

export default function OnboardingTeamPage() {
  const router = useRouter()
  const { user, refreshUser } = useAuth()
  const [name, setName] = useState('')
  const [encryptionMode, setEncryptionMode] = useState<EncryptionMode>('standard')
  const [acks, setAcks] = useState<EncryptionAcks>({ dataLoss: false, notResponsible: false })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [confirmPasswordOpen, setConfirmPasswordOpen] = useState(false)
  const [confirmPasswordSubmitting, setConfirmPasswordSubmitting] = useState(false)

  function startNav() {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('faktur:onboarding-navigate'))
    }
  }

  useEffect(() => {
    if (user?.currentTeamId) {
      const hasKey =
        sessionStorage.getItem(`faktur_recovery_key_${user.currentTeamId}`) ??
        sessionStorage.getItem('zenvoice_recovery_key')
      startNav()
      router.replace(hasKey ? '/onboarding/recovery-key' : '/onboarding/company')
    }
  }, [user, router])

  const acksValid = encryptionMode === 'standard' || (acks.dataLoss && acks.notResponsible)

  async function submitTeam(confirmPassword?: string) {
    const { data, error: err, errorCode } = await api.post<{
      recoveryKey?: string
      team?: { id: string }
    }>(
      '/onboarding/team',
      {
        name,
        encryptionMode,
        ackDataLoss: acks.dataLoss,
        ackNotResponsible: acks.notResponsible,
        confirmPassword,
      },
    )

    if (err) {
      if (errorCode === 'kek_required') {
        setLoading(false)
        setConfirmPasswordOpen(true)
        return null
      }
      if (errorCode === 'invalid_password') {
        setConfirmPasswordSubmitting(false)
        setError('Mot de passe incorrect.')
        return null
      }
      setLoading(false)
      setConfirmPasswordSubmitting(false)
      setError(err)
      return null
    }

    setConfirmPasswordSubmitting(false)
    setConfirmPasswordOpen(false)
    return data
  }

  async function handleConfirmPassword(password: string) {
    setError('')
    setConfirmPasswordSubmitting(true)
    const data = await submitTeam(password)
    if (!data) return
    if (data.recoveryKey && data.team) {
      sessionStorage.setItem(`faktur_recovery_key_${data.team.id}`, data.recoveryKey)
    }
    await refreshUser()
    startNav()
    router.push(data.recoveryKey ? '/onboarding/recovery-key' : '/onboarding/company')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!acksValid) {
      setError('Veuillez accepter les avertissements pour activer le Mode Privé.')
      return
    }
    setLoading(true)
    const data = await submitTeam()
    if (!data) return

    if (data.recoveryKey && data.team) {
      sessionStorage.setItem(`faktur_recovery_key_${data.team.id}`, data.recoveryKey)
    }

    await refreshUser()
    startNav()
    router.push(data.recoveryKey ? '/onboarding/recovery-key' : '/onboarding/company')
  }

  return (
    <motion.div initial="hidden" animate="visible">
      <Card className="overflow-hidden border-border/50">
        <CardContent className="p-8">
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <motion.div variants={fadeUp} custom={0} className="flex flex-col items-center gap-4 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-soft">
                  <Users className="h-8 w-8 text-accent" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Creez votre equipe</h1>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Donnez un nom a votre espace de travail. Vous pourrez inviter des collaborateurs plus tard.
                  </p>
                </div>
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
                  <FieldLabel htmlFor="name">Nom de l&apos;equipe</FieldLabel>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Mon entreprise"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    autoFocus
                  />
                </Field>
              </motion.div>

              <motion.div variants={fadeUp} custom={3}>
                <EncryptionModeChooser
                  value={encryptionMode}
                  onChange={setEncryptionMode}
                  acks={acks}
                  onAcksChange={setAcks}
                />
              </motion.div>

              <motion.div variants={fadeUp} custom={4}>
                <Button type="submit" className="w-full" disabled={loading || !name.trim() || !acksValid}>
                  {loading ? (
                    <><Spinner /> Creation...</>
                  ) : (
                    'Continuer'
                  )}
                </Button>
              </motion.div>

              <motion.div variants={fadeUp} custom={5}>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push('/onboarding/team/import')}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Importer une equipe existante
                </Button>
              </motion.div>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>

      <ConfirmPasswordModal
        open={confirmPasswordOpen}
        onClose={() => {
          if (!confirmPasswordSubmitting) {
            setConfirmPasswordOpen(false)
          }
        }}
        onConfirm={handleConfirmPassword}
        submitting={confirmPasswordSubmitting}
      />
    </motion.div>
  )
}
