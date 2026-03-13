'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Field, FieldGroup, FieldLabel, FieldError } from '@/components/ui/field'
import { useAuth } from '@/lib/auth'
import { api } from '@/lib/api'
import { Users } from 'lucide-react'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: 'easeOut' },
  }),
}

export default function OnboardingTeamPage() {
  const router = useRouter()
  const { refreshUser } = useAuth()
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error: err } = await api.post('/onboarding/team', { name })
    setLoading(false)

    if (err) return setError(err)

    await refreshUser()
    router.push('/onboarding/company')
  }

  return (
    <motion.div initial="hidden" animate="visible">
      <Card className="overflow-hidden border-border/50">
        <CardContent className="p-8">
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <motion.div variants={fadeUp} custom={0} className="flex flex-col items-center gap-4 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                  <Users className="h-8 w-8 text-primary" />
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
                <Button type="submit" className="w-full" disabled={loading || !name.trim()}>
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Creation...
                    </span>
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
