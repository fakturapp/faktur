'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, type Variants } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { useAuth } from '@/lib/auth'
import { api } from '@/lib/api'
import { Receipt, Zap, ClipboardList } from 'lucide-react'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
} satisfies Variants

const vatExemptOptions = [
  { value: 'none', label: 'Aucun motif' },
  { value: 'not_subject', label: 'Non soumis à la TVA (art. 293B)' },
  { value: 'france_no_vat', label: 'Exonération TVA (art. 261)' },
  { value: 'outside_france', label: 'Prestation hors France (art. 259-1)' },
]

export default function OnboardingBillingPage() {
  const router = useRouter()
  const { refreshUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [billingType, setBillingType] = useState<'quick' | 'detailed'>('quick')
  const [vatExemptReason, setVatExemptReason] = useState('not_subject')

  async function handleSubmit() {
    setError('')
    setLoading(true)

    let appearance = { template: 'classique', accentColor: '#6366f1' }
    try {
      const stored = sessionStorage.getItem('onboarding_appearance')
      if (stored) appearance = JSON.parse(stored)
    } catch {}

    const { error: err } = await api.post('/onboarding/personalization', {
      ...appearance,
      billingType,
      vatExemptReason,
    })
    setLoading(false)

    if (err) return setError(err)

    sessionStorage.removeItem('onboarding_appearance')
    await refreshUser()
    router.push('/dashboard')
  }

  async function handleSkip() {
    setError('')
    setLoading(true)

    let appearance = {}
    try {
      const stored = sessionStorage.getItem('onboarding_appearance')
      if (stored) appearance = JSON.parse(stored)
    } catch {}

    const { error: err } = await api.post('/onboarding/personalization', appearance)
    setLoading(false)

    if (err) return setError(err)

    sessionStorage.removeItem('onboarding_appearance')
    await refreshUser()
    router.push('/dashboard')
  }

  return (
    <motion.div initial="hidden" animate="visible">
      <Card className="overflow-hidden border-border/50">
        <CardContent className="p-8">
          <motion.div variants={fadeUp} custom={0} className="flex flex-col items-center gap-4 text-center mb-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <Receipt className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Paramètres de facturation</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Configurez vos préférences de facturation par défaut.
              </p>
            </div>
          </motion.div>

          {error && (
            <motion.div variants={fadeUp} custom={1} className="mb-4 text-center bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm text-destructive">
              {error}
            </motion.div>
          )}

          {/* Billing Type */}
          <motion.div variants={fadeUp} custom={1} className="mb-6">
            <h2 className="text-sm font-semibold text-foreground mb-3">Type de facturation</h2>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setBillingType('quick')}
                className={`flex flex-col items-center gap-3 rounded-xl border-2 p-5 transition-all ${
                  billingType === 'quick'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-border/80'
                }`}
              >
                <Zap className={`h-6 w-6 ${billingType === 'quick' ? 'text-primary' : 'text-muted-foreground'}`} />
                <div className="text-center">
                  <p className="text-sm font-medium">Rapide</p>
                  <p className="text-xs text-muted-foreground mt-1">Facturation simplifiée</p>
                </div>
              </button>
              <button
                onClick={() => setBillingType('detailed')}
                className={`flex flex-col items-center gap-3 rounded-xl border-2 p-5 transition-all ${
                  billingType === 'detailed'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-border/80'
                }`}
              >
                <ClipboardList className={`h-6 w-6 ${billingType === 'detailed' ? 'text-primary' : 'text-muted-foreground'}`} />
                <div className="text-center">
                  <p className="text-sm font-medium">Détaillée</p>
                  <p className="text-xs text-muted-foreground mt-1">Avec lignes détaillées</p>
                </div>
              </button>
            </div>
          </motion.div>

          {/* TVA Exemption */}
          <motion.div variants={fadeUp} custom={2} className="mb-6">
            <h2 className="text-sm font-semibold text-foreground mb-3">Exonération de TVA</h2>
            <select
              value={vatExemptReason}
              onChange={(e) => setVatExemptReason(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {vatExemptOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <p className="mt-2 text-xs text-muted-foreground">
              Ce réglage sera appliqué par défaut à vos nouveaux documents.
            </p>
          </motion.div>

          {/* Actions */}
          <motion.div variants={fadeUp} custom={3} className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={handleSkip}
              disabled={loading}
            >
              Passer cette étape
            </Button>
            <Button
              className="flex-1"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? <><Spinner /> Finalisation...</> : 'Terminer'}
            </Button>
          </motion.div>

          <motion.div variants={fadeUp} custom={4} className="mt-4">
            <p className="text-xs text-muted-foreground text-center">
              Vous pourrez modifier ces paramètres à tout moment dans les réglages.
            </p>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
