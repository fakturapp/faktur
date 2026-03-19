'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, type Variants } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldLabel, FieldDescription } from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'
import { useAuth } from '@/lib/auth'
import { api } from '@/lib/api'
import {
  Receipt,
  Zap,
  ClipboardList,
  ChevronLeft,
  Hash,
  Globe,
  FileText,
  CreditCard,
  Banknote,
} from 'lucide-react'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
} satisfies Variants

const vatExemptOptions = [
  { value: 'none', label: 'Aucun motif (TVA applicable)' },
  { value: 'not_subject', label: 'Non soumis à la TVA (art. 293B du CGI)' },
  { value: 'france_no_vat', label: 'Exonération de TVA (art. 261 du CGI)' },
  { value: 'outside_france', label: 'Prestation hors France (art. 259-1 du CGI)' },
]

const currencies = [
  { value: 'EUR', label: 'Euro (€)', symbol: '€' },
  { value: 'USD', label: 'Dollar US ($)', symbol: '$' },
  { value: 'GBP', label: 'Livre sterling (£)', symbol: '£' },
  { value: 'CHF', label: 'Franc suisse (CHF)', symbol: 'CHF' },
  { value: 'CAD', label: 'Dollar canadien (CA$)', symbol: 'CA$' },
]

const languages = [
  { value: 'fr', label: 'Français' },
  { value: 'en', label: 'Anglais' },
]

const paymentMethods = [
  { id: 'bank_transfer', label: 'Virement bancaire', icon: CreditCard },
  { id: 'cash', label: 'Espèces', icon: Banknote },
]

export default function OnboardingBillingPage() {
  const router = useRouter()
  const { refreshUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [billingType, setBillingType] = useState<'quick' | 'detailed'>('quick')
  const [vatExemptReason, setVatExemptReason] = useState('not_subject')
  const [currency, setCurrency] = useState('EUR')
  const [language, setLanguage] = useState('fr')
  const [invoicePrefix, setInvoicePrefix] = useState('FAC-')
  const [quotePrefix, setQuotePrefix] = useState('DEV-')
  const [paymentConditions, setPaymentConditions] = useState('Paiement à 30 jours')
  const [selectedPaymentMethods, setSelectedPaymentMethods] = useState<string[]>(['bank_transfer'])

  function togglePaymentMethod(id: string) {
    setSelectedPaymentMethods((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    )
  }

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
      currency,
      language,
      invoicePrefix,
      quotePrefix,
      paymentConditions,
      paymentMethods: selectedPaymentMethods,
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
                <br />
                <span className="text-xs text-muted-foreground/70">
                  Dernière étape avant de commencer !
                </span>
              </p>
            </div>
          </motion.div>

          {error && (
            <motion.div variants={fadeUp} custom={1} className="mb-4 text-center bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm text-destructive">
              {error}
            </motion.div>
          )}

          {/* Type de facturation */}
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

          {/* TVA */}
          <motion.div variants={fadeUp} custom={2} className="mb-6">
            <h2 className="text-sm font-semibold text-foreground mb-3">Régime de TVA</h2>
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

          {/* Devise et langue */}
          <motion.div variants={fadeUp} custom={3} className="mb-6 grid grid-cols-2 gap-4">
            <Field>
              <FieldLabel>
                <span className="flex items-center gap-1.5"><Globe className="h-3.5 w-3.5" /> Devise</span>
              </FieldLabel>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {currencies.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </Field>
            <Field>
              <FieldLabel>
                <span className="flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" /> Langue des documents</span>
              </FieldLabel>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {languages.map((l) => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
              </select>
            </Field>
          </motion.div>

          {/* Préfixes de numérotation */}
          <motion.div variants={fadeUp} custom={4} className="mb-6">
            <h2 className="text-sm font-semibold text-foreground mb-3">
              <span className="flex items-center gap-1.5"><Hash className="h-3.5 w-3.5" /> Numérotation</span>
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="invoicePrefix">Préfixe factures</FieldLabel>
                <Input
                  id="invoicePrefix"
                  value={invoicePrefix}
                  onChange={(e) => setInvoicePrefix(e.target.value)}
                  placeholder="FAC-"
                />
                <FieldDescription>Ex : FAC-2026-001</FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor="quotePrefix">Préfixe devis</FieldLabel>
                <Input
                  id="quotePrefix"
                  value={quotePrefix}
                  onChange={(e) => setQuotePrefix(e.target.value)}
                  placeholder="DEV-"
                />
                <FieldDescription>Ex : DEV-2026-001</FieldDescription>
              </Field>
            </div>
          </motion.div>

          {/* Moyens de paiement */}
          <motion.div variants={fadeUp} custom={5} className="mb-6">
            <h2 className="text-sm font-semibold text-foreground mb-3">Moyens de paiement acceptés</h2>
            <div className="grid grid-cols-2 gap-3">
              {paymentMethods.map((method) => {
                const isSelected = selectedPaymentMethods.includes(method.id)
                return (
                  <button
                    key={method.id}
                    onClick={() => togglePaymentMethod(method.id)}
                    className={`flex items-center gap-3 rounded-xl border-2 p-3.5 transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-border/80'
                    }`}
                  >
                    <method.icon className={`h-4 w-4 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className="text-sm font-medium">{method.label}</span>
                  </button>
                )
              })}
            </div>
          </motion.div>

          {/* Conditions de paiement */}
          <motion.div variants={fadeUp} custom={6} className="mb-6">
            <Field>
              <FieldLabel htmlFor="paymentConditions">Conditions de paiement par défaut</FieldLabel>
              <Input
                id="paymentConditions"
                value={paymentConditions}
                onChange={(e) => setPaymentConditions(e.target.value)}
                placeholder="Paiement à 30 jours"
              />
              <FieldDescription>
                Ce texte apparaîtra en pied de page de vos factures.
              </FieldDescription>
            </Field>
          </motion.div>

          {/* Actions */}
          <motion.div variants={fadeUp} custom={7} className="flex gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.push('/onboarding/email')}
              className="gap-1.5"
            >
              <ChevronLeft className="h-4 w-4" /> Précédent
            </Button>
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
              {loading ? <><Spinner /> Finalisation...</> : 'Terminer la configuration'}
            </Button>
          </motion.div>

          <motion.div variants={fadeUp} custom={8} className="mt-4">
            <p className="text-xs text-muted-foreground text-center">
              Vous pourrez modifier ces paramètres à tout moment dans les réglages.
            </p>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
