'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldLabel } from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'
import { api } from '@/lib/api'
import { ArrowLeft, ArrowRight, Check, Trash2, X, AlertTriangle, Eye, EyeOff, Lock } from '@/components/ui/icons'
import { HiddenUsername } from '@/components/auth/hidden-username'
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
  onClose: () => void
  onSuccess: (switchedToTeamId: string | null) => void
}

const steps = ['Avertissement', 'Nom équipe', 'Mot de passe', 'Suppression']

export function TeamDeleteWizard({ team, onClose, onSuccess }: Props) {
  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState(1)
  const [confirmName, setConfirmName] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
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
    if (confirmName !== team.name || !password) return
    setSubmitting(true)
    setError(null)
    const { data, error: err } = await api.delete<{ switchedToTeamId: string | null }>('/team', {
      teamName: confirmName,
      password,
    })
    setSubmitting(false)
    if (err) {
      setError(err)
      return
    }
    setSuccess(true)
    setTimeout(() => onSuccess(data?.switchedToTeamId ?? null), 1600)
  }

  const slide = {
    enter: (dir: number) => ({ x: dir > 0 ? 24 : -24, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -24 : 24, opacity: 0 }),
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-background/95 backdrop-blur-sm">
      <DashboardBackground />
      <div className="sticky top-4 z-10 mx-auto max-w-2xl px-4 sm:px-6">
        <Button
          variant="outline"
          size="sm"
          className="h-9 gap-1.5 rounded-full bg-background/80 backdrop-blur shadow-surface"
          onClick={onClose}
          disabled={submitting || success}
        >
          <X className="h-4 w-4" /> Annuler
        </Button>
      </div>

      <div className="mx-auto max-w-2xl px-4 sm:px-6 pb-8 pt-4 space-y-6">
        <TeamIdentityCard team={team} />

        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10">
            <Trash2 className="h-6 w-6 text-destructive" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-destructive">Supprimer l&apos;équipe</h1>
            <p className="text-sm text-muted-foreground">Toutes les données de cette équipe seront définitivement perdues.</p>
          </div>
        </div>

        <div className="rounded-xl bg-overlay shadow-surface p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground">
              Étape {step + 1} sur {steps.length}
            </p>
            <p className="text-xs font-medium text-destructive">{steps[step]}</p>
          </div>
          <div className="flex gap-1 mt-2.5">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                  i < step ? 'bg-destructive' : i === step ? 'bg-destructive/60' : 'bg-muted'
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
                  <h2 className="text-lg font-semibold text-foreground">Action irréversible</h2>
                  <p className="text-sm text-muted-foreground mt-1">Lisez attentivement avant de continuer.</p>
                </div>
                <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 space-y-3">
                  <p className="text-sm font-medium text-destructive flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" /> En supprimant cette équipe :
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-2 pl-1">
                    <li className="flex items-start gap-2">
                      <span className="text-destructive shrink-0">•</span>
                      Toutes les factures, devis, clients et produits seront perdus.
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-destructive shrink-0">•</span>
                      Tous les autres membres perdront l&apos;accès à ces données.
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-destructive shrink-0">•</span>
                      Les clefs de chiffrement de l&apos;équipe seront détruites.
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-destructive shrink-0">•</span>
                      Aucune récupération n&apos;est possible après cette action.
                    </li>
                  </ul>
                </div>
                <div className="flex justify-end">
                  <Button variant="outline" className="border-destructive/30 text-destructive hover:bg-destructive/10" onClick={goNext}>
                    J&apos;ai compris <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Confirmez le nom</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Tapez <strong className="text-foreground">{team.name}</strong> pour confirmer.
                  </p>
                </div>
                <Field>
                  <FieldLabel htmlFor="wizard-delete-confirm-name">Nom de l&apos;équipe</FieldLabel>
                  <Input
                    id="wizard-delete-confirm-name"
                    value={confirmName}
                    onChange={(e) => setConfirmName(e.target.value)}
                    placeholder={team.name}
                    autoFocus
                  />
                </Field>
                <div className="flex justify-between">
                  <Button variant="outline" onClick={goPrev}>
                    <ArrowLeft className="h-4 w-4 mr-2" /> Retour
                  </Button>
                  <Button
                    variant="outline"
                    className="border-destructive/30 text-destructive hover:bg-destructive/10"
                    onClick={goNext}
                    disabled={confirmName !== team.name}
                  >
                    Continuer <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </>
            )}

            {step === 2 && (
              <form
                onSubmit={(e) => { e.preventDefault(); if (password) goNext() }}
                className="space-y-5"
                autoComplete="on"
              >
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Mot de passe</h2>
                  <p className="text-sm text-muted-foreground mt-1">Confirmez votre identité pour autoriser la suppression.</p>
                </div>
                <HiddenUsername />
                <Field>
                  <FieldLabel htmlFor="wizard-delete-password">Mot de passe Faktur</FieldLabel>
                  <div className="relative">
                    <Input
                      id="wizard-delete-password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                      placeholder="Votre mot de passe"
                      autoFocus
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      tabIndex={-1}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </Field>
                <div className="flex justify-between">
                  <Button type="button" variant="outline" onClick={goPrev}>
                    <ArrowLeft className="h-4 w-4 mr-2" /> Retour
                  </Button>
                  <Button
                    type="submit"
                    variant="outline"
                    className="border-destructive/30 text-destructive hover:bg-destructive/10"
                    disabled={!password}
                  >
                    Continuer <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </form>
            )}

            {step === 3 && (
              <>
                <div>
                  <h2 className="text-lg font-semibold text-destructive">Suppression définitive</h2>
                  <p className="text-sm text-muted-foreground mt-1">Cliquez pour lancer la suppression définitive.</p>
                </div>
                <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 flex items-start gap-3">
                  <Lock className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-destructive">Cette action est permanente.</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      L&apos;équipe «&nbsp;{team.name}&nbsp;» et toutes ses données seront effacées immédiatement.
                    </p>
                  </div>
                </div>
                {error && (
                  <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                    {error}
                  </div>
                )}
                <div className="flex justify-between">
                  <Button variant="outline" onClick={goPrev} disabled={submitting}>
                    <ArrowLeft className="h-4 w-4 mr-2" /> Retour
                  </Button>
                  <Button variant="destructive" onClick={handleSubmit} disabled={submitting}>
                    {submitting ? <><Spinner /> Suppression...</> : <><Trash2 className="h-4 w-4 mr-2" /> Supprimer définitivement</>}
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
                <h3 className="text-xl font-bold text-foreground">Équipe supprimée</h3>
                <p className="text-sm text-muted-foreground">
                  «&nbsp;{team.name}&nbsp;» et toutes ses données ont été effacées.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
