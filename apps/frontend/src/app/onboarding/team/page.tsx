'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, type Variants } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Field, FieldGroup, FieldLabel, FieldError } from '@/components/ui/field'
import { useAuth } from '@/lib/auth'
import { api } from '@/lib/api'
import { Spinner } from '@/components/ui/spinner'
import { Users } from 'lucide-react'

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
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user?.currentTeamId) {
      const hasKey = sessionStorage.getItem('zenvoice_recovery_key')
      router.replace(hasKey ? '/onboarding/recovery-key' : '/onboarding/company')
    }
  }, [user, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { data, error: err } = await api.post<{ recoveryKey: string }>(
      '/onboarding/team',
      { name }
    )
    setLoading(false)

    if (err) return setError(err)

    if (data?.recoveryKey) {
      sessionStorage.setItem('zenvoice_recovery_key', data.recoveryKey)
    }

    await refreshUser()
    router.push(data?.recoveryKey ? '/onboarding/recovery-key' : '/onboarding/company')
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
                  <h1 className="text-2xl font-bold">Créez votre équipe</h1>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Donnez un nom à votre espace de travail. Vous pourrez inviter des collaborateurs plus tard.
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
                  <FieldLabel htmlFor="name">Nom de l&apos;équipe</FieldLabel>
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
                <Button type="submit" className="w-full" disabled={loading || !name.trim()}>
                  {loading ? (
                    <><Spinner /> Création...</>
                  ) : (
                    'Continuer'
                  )}
                </Button>
              </motion.div>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  )
}
