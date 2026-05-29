'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldLabel, FieldDescription } from '@/components/ui/field'
import { FormSelect } from '@/components/ui/dropdown'
import { Avatar } from '@/components/ui/avatar'
import { Spinner } from '@/components/ui/spinner'
import { api } from '@/lib/api'
import { ArrowLeft, ArrowRight, Check, Crown, UserCheck, Lock, AlertTriangle, X } from 'lucide-react'

interface MemberOption {
  id: string
  userId: string | null
  user: { id: string; fullName: string | null; email: string; avatarUrl: string | null } | null
  role: string
}

interface Props {
  team: { id: string; name: string }
  candidates: MemberOption[]
  onClose: () => void
  onSuccess: (newOwnerLabel: string) => void
}

const steps = ['Nouveau propriétaire', 'Mot de passe', 'Nom de l\'équipe', 'Confirmation']

export function TeamTransferWizard({ team, candidates, onClose, onSuccess }: Props) {
  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState(1)
  const [targetId, setTargetId] = useState<string>('')
  const [password, setPassword] = useState('')
  const [confirmName, setConfirmName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const target = candidates.find((c) => c.id === targetId)
  const targetLabel = target?.user?.fullName || target?.user?.email || ''

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
    if (!target || !password || confirmName !== team.name) return
    setSubmitting(true)
    setError(null)
    const { error: err } = await api.post('/team/transfer-ownership', {
      memberId: target.id,
      password,
    })
    setSubmitting(false)
    if (err) {
      setError(err)
      return
    }
    setSuccess(true)
    setTimeout(() => onSuccess(targetLabel), 1600)
  }

  const slide = {
    enter: (dir: number) => ({ x: dir > 0 ? 24 : -24, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -24 : 24, opacity: 0 }),
  }

  return (
    <div className="fixed inset-0 z-50 bg-background overflow-y-auto">
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 h-14 flex items-center gap-3">
          <Button variant="ghost" size="sm" className="h-9 -ml-2 gap-1.5" onClick={onClose}>
            <X className="h-4 w-4" /> Annuler
          </Button>
          <div className="ml-auto text-xs font-medium text-muted-foreground">
            Transférer l&apos;équipe «&nbsp;{team.name}&nbsp;»
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-8 space-y-6">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <UserCheck className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Transférer la propriété</h1>
            <p className="text-sm text-muted-foreground">Vous deviendrez administrateur, le nouveau propriétaire pourra ensuite vous retirer.</p>
          </div>
        </div>

        <div className="rounded-xl bg-overlay shadow-surface p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground">
              Étape {step + 1} sur {steps.length}
            </p>
            <p className="text-xs font-medium text-primary">{steps[step]}</p>
          </div>
          <div className="flex gap-1 mt-2.5">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                  i < step ? 'bg-primary' : i === step ? 'bg-primary/60' : 'bg-muted'
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
                  <h2 className="text-lg font-semibold text-foreground">Choisissez le nouveau propriétaire</h2>
                  <p className="text-sm text-muted-foreground mt-1">Seuls les membres actifs peuvent recevoir la propriété.</p>
                </div>
                {candidates.length === 0 ? (
                  <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 p-4 flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-900 dark:text-amber-100">Aucun membre éligible</p>
                      <p className="text-sm text-amber-800/80 dark:text-amber-200/80 mt-0.5">
                        Invitez d&apos;abord un autre membre actif à l&apos;équipe avant de pouvoir transférer la propriété.
                      </p>
                    </div>
                  </div>
                ) : (
                  <Field>
                    <FieldLabel>Membre</FieldLabel>
                    <FormSelect
                      value={targetId}
                      onChange={setTargetId}
                      placeholder="Sélectionner un membre"
                      options={[
                        { value: '', label: 'Sélectionner un membre' },
                        ...candidates.map((c) => ({
                          value: c.id,
                          label: c.user?.fullName || c.user?.email || 'Membre',
                        })),
                      ]}
                    />
                  </Field>
                )}
                <div className="flex justify-end">
                  <Button onClick={goNext} disabled={!targetId}>
                    Continuer <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Votre mot de passe</h2>
                  <p className="text-sm text-muted-foreground mt-1">Confirmez votre identité pour autoriser le transfert.</p>
                </div>
                <Field>
                  <FieldLabel htmlFor="wizard-transfer-password">Mot de passe Faktur</FieldLabel>
                  <Input
                    id="wizard-transfer-password"
                    name="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    placeholder="Votre mot de passe"
                    autoFocus
                  />
                </Field>
                <div className="flex justify-between">
                  <Button variant="outline" onClick={goPrev}>
                    <ArrowLeft className="h-4 w-4 mr-2" /> Retour
                  </Button>
                  <Button onClick={goNext} disabled={!password}>
                    Continuer <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Confirmez le nom de l&apos;équipe</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Tapez <strong className="text-foreground">{team.name}</strong> pour confirmer.
                  </p>
                </div>
                <Input
                  id="wizard-transfer-confirm-name"
                  value={confirmName}
                  onChange={(e) => setConfirmName(e.target.value)}
                  placeholder={team.name}
                  autoFocus
                />
                <div className="flex justify-between">
                  <Button variant="outline" onClick={goPrev}>
                    <ArrowLeft className="h-4 w-4 mr-2" /> Retour
                  </Button>
                  <Button onClick={goNext} disabled={confirmName !== team.name}>
                    Continuer <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Confirmation finale</h2>
                  <p className="text-sm text-muted-foreground mt-1">Vérifiez et lancez le transfert.</p>
                </div>
                <div className="rounded-xl border border-border bg-surface-secondary p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <Crown className="h-4 w-4 text-amber-500" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground">Nouveau propriétaire</p>
                      <p className="text-sm font-medium text-foreground truncate">{targetLabel}</p>
                    </div>
                    <Avatar
                      src={target?.user?.avatarUrl || undefined}
                      fallback={(target?.user?.fullName || target?.user?.email || '?')[0]}
                      size="sm"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <UserCheck className="h-4 w-4 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground flex-1">
                      Vous deviendrez <strong>administrateur</strong> et le nouveau propriétaire pourra vous retirer.
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
                  <Button onClick={handleSubmit} disabled={submitting}>
                    {submitting ? <><Spinner /> Transfert...</> : <>Transférer <ArrowRight className="h-4 w-4 ml-2" /></>}
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
                <h3 className="text-xl font-bold text-foreground">Équipe transférée</h3>
                <p className="text-sm text-muted-foreground">
                  «&nbsp;{team.name}&nbsp;» appartient désormais à {targetLabel}.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
