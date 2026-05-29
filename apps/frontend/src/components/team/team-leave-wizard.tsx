'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldLabel } from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'
import { api } from '@/lib/api'
import { ArrowLeft, ArrowRight, Check, LogOut, X, AlertTriangle } from 'lucide-react'
import { TeamIdentityCard } from '@/components/team/team-identity-card'
import { DashboardBackground } from '@/components/layout/dashboard-background'

interface Props {
  team: {
    id: string
    name: string
    iconUrl?: string | null
    memberCount?: number
    role?: string
    encryptionMode?: 'private' | 'standard' | null
  }
  memberId: string
  onClose: () => void
  onSuccess: () => void
}

const steps = ['Avertissement', 'Confirmation', 'Adieu']

export function TeamLeaveWizard({ team, memberId, onClose, onSuccess }: Props) {
  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState(1)
  const [confirmName, setConfirmName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  function goNext() {
    setError(null)
    setDirection(1)
    setStep((s) => Math.min(s + 1, steps.length - 1))
  }

  function goPrev() {
    setError(null)
    setDirection(-1)
    setStep((s) => Math.max(s - 1, 0))
  }

  async function handleSubmit() {
    if (confirmName !== team.name) return
    setSubmitting(true)
    setError(null)
    const { error: err } = await api.delete(`/team/members/${memberId}`)
    setSubmitting(false)
    if (err) {
      setError(err)
      return
    }
    setSuccess(true)
    setTimeout(() => onSuccess(), 1600)
  }

  const slide = {
    enter: (dir: number) => ({ x: dir > 0 ? 24 : -24, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -24 : 24, opacity: 0 }),
  }

  return (
    <div className="fixed inset-0 z-50 bg-background overflow-y-auto">
      <DashboardBackground />
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 h-14 flex items-center gap-3">
          <Button variant="ghost" size="sm" className="h-9 -ml-2 gap-1.5" onClick={onClose}>
            <X className="h-4 w-4" /> Annuler
          </Button>
          <div className="ml-auto text-xs font-medium text-muted-foreground">
            Quitter l&apos;équipe
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-8 space-y-6">
        <TeamIdentityCard team={team} />

        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10">
            <LogOut className="h-6 w-6 text-amber-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Quitter l&apos;équipe</h1>
            <p className="text-sm text-muted-foreground">Vous perdrez l&apos;accès à toutes les données de cette équipe.</p>
          </div>
        </div>

        <div className="rounded-xl bg-overlay shadow-surface p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground">
              Étape {step + 1} sur {steps.length}
            </p>
            <p className="text-xs font-medium text-amber-500">{steps[step]}</p>
          </div>
          <div className="flex gap-1 mt-2.5">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                  i < step ? 'bg-amber-500' : i === step ? 'bg-amber-500/60' : 'bg-muted'
                }`}
              />
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={slide}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.2 }}
            className="rounded-2xl border border-border bg-card shadow-surface p-6 space-y-5"
          >
            {step === 0 && (
              <>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Avant de partir</h2>
                  <p className="text-sm text-muted-foreground mt-1">Veuillez lire ce qui suit attentivement.</p>
                </div>
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-3">
                  <p className="text-sm font-medium text-amber-600 dark:text-amber-300 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" /> En quittant cette équipe :
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-2 pl-1">
                    <li className="flex items-start gap-2">
                      <span className="text-amber-500 shrink-0">•</span>
                      Vous perdrez l&apos;accès aux factures, devis, clients et autres données de l&apos;équipe.
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-500 shrink-0">•</span>
                      Vos contributions resteront visibles pour les membres restants.
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-500 shrink-0">•</span>
                      Pour revenir, un administrateur devra vous réinviter.
                    </li>
                  </ul>
                </div>
                <div className="flex justify-end">
                  <Button variant="outline" className="border-amber-500/30 text-amber-600 hover:bg-amber-500/10" onClick={goNext}>
                    J&apos;ai compris <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Confirmez votre départ</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Tapez <strong className="text-foreground">{team.name}</strong> pour confirmer.
                  </p>
                </div>
                <Field>
                  <FieldLabel htmlFor="wizard-leave-confirm">Nom de l&apos;équipe</FieldLabel>
                  <Input
                    id="wizard-leave-confirm"
                    value={confirmName}
                    onChange={(e) => setConfirmName(e.target.value)}
                    placeholder={team.name}
                    autoFocus
                  />
                </Field>
                {error && (
                  <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                    {error}
                  </div>
                )}
                <div className="flex justify-between">
                  <Button variant="outline" onClick={goPrev} disabled={submitting}>
                    <ArrowLeft className="h-4 w-4 mr-2" /> Retour
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={submitting || confirmName !== team.name}
                    className="bg-amber-500 hover:bg-amber-500/90 text-white"
                  >
                    {submitting ? <><Spinner /> En cours...</> : <>Quitter l&apos;équipe <LogOut className="h-4 w-4 ml-2" /></>}
                  </Button>
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-background/95 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 220, damping: 18 }}
              className="text-center space-y-5"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 280, damping: 16 }}
                className="mx-auto h-20 w-20 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center"
              >
                <Check className="h-10 w-10 text-emerald-500" strokeWidth={3} />
              </motion.div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-foreground">Vous avez quitté l&apos;équipe</h3>
                <p className="text-sm text-muted-foreground">
                  «&nbsp;{team.name}&nbsp;» ne fait plus partie de votre espace Faktur.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
