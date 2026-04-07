'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Dialog, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Link2,
  Globe,
  Shield,
  CreditCard,
  ArrowRight,
  ArrowLeft,
  Check,
  Copy,
  Eye,
  ChevronRight,
} from 'lucide-react'

export const CHECKOUT_FEATURE_SEEN_KEY = 'faktur_seen_checkout_feature_v1'

interface CheckoutFeatureModalProps {
  open: boolean
  onClose: () => void
}

/* ─────────────── Step 1: announcement ─────────────── */

function StepAnnouncement({ onNext, onClose }: { onNext: () => void; onClose: () => void }) {
  return (
    <motion.div
      key="announce"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25 }}
    >
      {/* Hero */}
      <div className="relative -mx-6 -mt-6 mb-5 px-6 pt-8 pb-6 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border-b border-border">
        <DialogTitle className="text-xl md:text-2xl tracking-tight">
          Liens de paiement instantanés
        </DialogTitle>
        <p className="mt-2 text-sm text-muted-foreground">
          Envoyez à vos clients un lien de paiement sécurisé, sur un sous-domaine dédié.
        </p>

        {/* URL preview */}
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-border bg-card/80 backdrop-blur-sm px-3 py-2 font-mono text-[11px] text-foreground shadow-sm">
          <Globe className="h-3.5 w-3.5 text-primary shrink-0" />
          <span className="truncate">
            <span className="text-primary font-semibold">checkout.fakturapp.cc</span>
            <span className="text-muted-foreground">/abc123…/pay</span>
          </span>
          <div className="ml-auto flex h-5 w-5 items-center justify-center rounded bg-muted text-muted-foreground">
            <Copy className="h-3 w-3" />
          </div>
        </div>
      </div>

      {/* Feature bullets */}
      <div className="space-y-3">
        <Feature
          icon={Link2}
          iconClass="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
          title="URLs propres et courtes"
          body="Terminé les URLs à rallonge. Un sous-domaine dédié checkout.fakturapp.cc + un token, c'est tout."
        />
        <Feature
          icon={CreditCard}
          iconClass="bg-violet-500/10 text-violet-600 dark:text-violet-400"
          title="Paiement Stripe intégré"
          body="Carte bancaire, Apple Pay, Google Pay. Le client paie en quelques secondes, vous êtes notifié en temps réel."
        />
        <Feature
          icon={Shield}
          iconClass="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          title="Sécurité par défaut"
          body="Expiration automatique, protection par mot de passe optionnelle, suppression après paiement confirmé."
        />
      </div>

      {/* Footer */}
      <div className="mt-6 flex items-center justify-between gap-3">
        <Button variant="ghost" size="sm" onClick={onClose}>
          Plus tard
        </Button>
        <Button size="sm" onClick={onNext}>
          Comment ça marche
          <ChevronRight className="h-3.5 w-3.5 ml-1" />
        </Button>
      </div>
    </motion.div>
  )
}

function Feature({
  icon: Icon,
  iconClass,
  title,
  body,
}: {
  icon: React.ElementType
  iconClass: string
  title: string
  body: string
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border/50 bg-muted/20 p-3">
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${iconClass}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-foreground leading-tight">{title}</p>
        <p className="mt-0.5 text-[12px] text-muted-foreground leading-snug">{body}</p>
      </div>
    </div>
  )
}

/* ─────────────── Step 2: how it works ─────────────── */

function StepHowItWorks({ onBack, onClose }: { onBack: () => void; onClose: () => void }) {
  const steps = [
    {
      icon: CreditCard,
      title: '1. Créez votre facture',
      body: "Depuis l'éditeur, cliquez sur 'Générer un lien de paiement'. Choisissez la méthode (virement ou carte via Stripe) et l'expiration.",
    },
    {
      icon: Copy,
      title: '2. Partagez le lien',
      body: 'Copiez le lien court checkout.fakturapp.cc/<token>/pay, envoyez-le par email, SMS, WhatsApp — au client ou à son service compta.',
    },
    {
      icon: Eye,
      title: '3. Suivez le paiement',
      body: "Quand le client paie, la facture passe automatiquement en 'Payée', un webhook Stripe confirme la transaction, vous recevez une notification.",
    },
    {
      icon: Check,
      title: "4. C'est fait",
      body: 'Le lien est automatiquement désactivé 5 minutes après la confirmation. Aucune trace restante, aucun risque de double paiement.',
    },
  ]

  return (
    <motion.div
      key="how"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25 }}
    >
      <div className="-mx-6 -mt-6 mb-5 px-6 pt-6 pb-4 border-b border-border">
        <DialogTitle className="text-lg">Comment ça marche</DialogTitle>
        <p className="mt-1 text-sm text-muted-foreground">
          4 étapes, du clic à la confirmation du paiement.
        </p>
      </div>

      <ol className="space-y-4">
        {steps.map((step, i) => {
          const Icon = step.icon
          return (
            <li key={i} className="flex items-start gap-3">
              <div className="relative">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary border border-primary/20">
                  <Icon className="h-4 w-4" />
                </div>
                {i < steps.length - 1 && (
                  <div className="absolute left-1/2 top-9 -translate-x-1/2 h-4 w-px bg-border" />
                )}
              </div>
              <div className="flex-1 min-w-0 pb-1">
                <p className="text-[13px] font-semibold text-foreground leading-tight">{step.title}</p>
                <p className="mt-1 text-[12px] text-muted-foreground leading-snug">{step.body}</p>
              </div>
            </li>
          )
        })}
      </ol>

      <div className="mt-6 flex items-center justify-between gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-3.5 w-3.5 mr-1" />
          Retour
        </Button>
        <Button size="sm" onClick={onClose}>
          C'est noté
          <ArrowRight className="h-3.5 w-3.5 ml-1" />
        </Button>
      </div>
    </motion.div>
  )
}

/* ─────────────── Modal shell ─────────────── */

export function CheckoutFeatureModal({ open, onClose }: CheckoutFeatureModalProps) {
  const [step, setStep] = useState<'announce' | 'how'>('announce')

  function handleClose() {
    try {
      localStorage.setItem(CHECKOUT_FEATURE_SEEN_KEY, '1')
    } catch {}
    setStep('announce')
    onClose()
  }

  return (
    <Dialog open={open} onClose={handleClose} className="max-w-lg">
      <AnimatePresence mode="wait">
        {step === 'announce' ? (
          <StepAnnouncement onNext={() => setStep('how')} onClose={handleClose} />
        ) : (
          <StepHowItWorks onBack={() => setStep('announce')} onClose={handleClose} />
        )}
      </AnimatePresence>
    </Dialog>
  )
}
