'use client'

import { useState } from 'react'
import { ShieldCheck, Cloud, Lock, AlertTriangle } from 'lucide-react'
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldLabel } from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'
import { useToast, toast as t } from '@/components/ui/toast'
import { api } from '@/lib/api'
import {
  CheckboxRoot,
  CheckboxControl,
  CheckboxIndicator,
  CheckboxContent,
} from '@/components/ui/checkbox'

interface Props {
  open: boolean
  teamId: string
  teamName: string
  onClose: () => void
  onResolved: () => void
}

type Step = 'choice' | 'keep-private' | 'switch-standard'

export function TeamEncryptionMigrationModal({ open, teamId, teamName, onClose, onResolved }: Props) {
  const { toast } = useToast()
  const [step, setStep] = useState<Step>('choice')
  const [dataLoss, setDataLoss] = useState(false)
  const [notResponsible, setNotResponsible] = useState(false)
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function reset() {
    setStep('choice')
    setDataLoss(false)
    setNotResponsible(false)
    setPassword('')
    setSubmitting(false)
  }

  function handleClose() {
    reset()
    onClose()
  }

  async function confirmPrivate() {
    if (!dataLoss || !notResponsible) return
    setSubmitting(true)
    const { error } = await api.post('/team/encryption/confirm-private', {
      teamId,
      ackDataLoss: dataLoss,
      ackNotResponsible: notResponsible,
    })
    setSubmitting(false)
    if (error) return toast(error, 'error')
    t.success('Mode Privé confirmé', {
      description: `« ${teamName} » conserve le chiffrement de bout en bout.`,
      indicator: <Lock className="h-4 w-4" />,
    })
    reset()
    onResolved()
  }

  async function switchToStandard() {
    if (!password) return
    setSubmitting(true)
    const { error } = await api.post('/team/encryption/migrate-to-standard', {
      teamId,
      password,
    })
    setSubmitting(false)
    if (error) return toast(error, 'error')
    t.success('Équipe migrée en Mode Standard', {
      description: `« ${teamName} » n'a plus besoin de votre mot de passe pour déchiffrer ses données.`,
      indicator: <Cloud className="h-4 w-4" />,
    })
    reset()
    onResolved()
  }

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogHeader
        onClose={handleClose}
        icon={<ShieldCheck className="h-5 w-5 text-accent" />}
      >
        <DialogTitle>Configurer le chiffrement</DialogTitle>
        <DialogDescription>Équipe « {teamName} »</DialogDescription>
      </DialogHeader>

      {step === 'choice' && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Le chiffrement de votre équipe est maintenant configurable. Choisissez le mode qui
            correspond à votre besoin.
          </p>

          <button
            type="button"
            onClick={() => setStep('keep-private')}
            className="w-full text-left flex flex-col gap-2 rounded-xl border-2 border-border hover:border-primary/40 p-4 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-hover">
                <Lock className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Garder le Mode Privé</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Vos données restent chiffrées de bout en bout avec votre mot de passe.
                </p>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setStep('switch-standard')}
            className="w-full text-left flex flex-col gap-2 rounded-xl border-2 border-border hover:border-primary/40 p-4 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-hover">
                <Cloud className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Passer en Mode Standard</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Plus de verrouillage du coffre, mais Faktur peut techniquement accéder à vos
                  données. Action irréversible.
                </p>
              </div>
            </div>
          </button>
        </div>
      )}

      {step === 'keep-private' && (
        <div className="space-y-4">
          <div className="rounded-lg border border-amber-400/20 bg-amber-400/5 p-3 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400 mt-0.5" />
            <p className="text-sm text-foreground leading-relaxed">
              Pour conserver le Mode Privé, confirmez les deux avertissements ci-dessous.
            </p>
          </div>

          <CheckboxRoot
            isSelected={dataLoss}
            onChange={(c) => setDataLoss(!!c)}
            className="flex items-start gap-3 cursor-pointer"
          >
            <CheckboxControl className="mt-0.5">
              <CheckboxIndicator />
            </CheckboxControl>
            <CheckboxContent className="text-sm text-foreground leading-tight">
              Je comprends que si je perds mon mot de passe ET ma clef de secours, mes données
              seront définitivement perdues.
            </CheckboxContent>
          </CheckboxRoot>

          <CheckboxRoot
            isSelected={notResponsible}
            onChange={(c) => setNotResponsible(!!c)}
            className="flex items-start gap-3 cursor-pointer"
          >
            <CheckboxControl className="mt-0.5">
              <CheckboxIndicator />
            </CheckboxControl>
            <CheckboxContent className="text-sm text-foreground leading-tight">
              Je comprends que Faktur ne peut être tenu responsable d&apos;une perte de données
              causée par un déploiement ou une mise à jour défectueuse.
            </CheckboxContent>
          </CheckboxRoot>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setStep('choice')}>
              Retour
            </Button>
            <Button
              type="button"
              onClick={confirmPrivate}
              disabled={!dataLoss || !notResponsible || submitting}
            >
              {submitting ? <><Spinner /> Confirmation...</> : 'Confirmer le Mode Privé'}
            </Button>
          </DialogFooter>
        </div>
      )}

      {step === 'switch-standard' && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Entrez votre mot de passe pour déchiffrer la clef de votre équipe et la re-chiffrer avec
            la clef serveur. Vos factures, clients et autres données restent intacts.
          </p>

          <Field>
            <FieldLabel htmlFor="migrate-password">Mot de passe Faktur</FieldLabel>
            <Input
              id="migrate-password"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              autoFocus
            />
          </Field>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setStep('choice')}>
              Retour
            </Button>
            <Button type="button" onClick={switchToStandard} disabled={!password || submitting}>
              {submitting ? <><Spinner /> Migration...</> : 'Passer en Mode Standard'}
            </Button>
          </DialogFooter>
        </div>
      )}
    </Dialog>
  )
}
