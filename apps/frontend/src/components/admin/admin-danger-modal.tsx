'use client'

import { useState, useEffect } from 'react'
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
import { HiddenUsername } from '@/components/auth/hidden-username'
import { AlertTriangle, Eye, EyeOff, ArrowLeft, ArrowRight, Trash2 } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
  title: string
  description: React.ReactNode
  confirmValue: string
  confirmLabel: string
  confirmPlaceholder?: string
  warning?: React.ReactNode
  submitLabel?: string
  submitting?: boolean
  error?: string | null
  onConfirm: (password: string) => void | Promise<void>
}

export function AdminDangerModal({
  open,
  onClose,
  title,
  description,
  confirmValue,
  confirmLabel,
  confirmPlaceholder,
  warning,
  submitLabel = 'Supprimer définitivement',
  submitting,
  error,
  onConfirm,
}: Props) {
  const [step, setStep] = useState(1)
  const [typed, setTyped] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    if (open) {
      setStep(1)
      setTyped('')
      setPassword('')
      setShowPassword(false)
    }
  }, [open])

  const matches = typed.trim() === confirmValue.trim() && confirmValue.length > 0

  function handleClose() {
    if (submitting) return
    onClose()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!password || submitting) return
    await onConfirm(password)
  }

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogHeader showClose={false} icon={<Trash2 className="h-5 w-5 text-danger" />}>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>

      {warning && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-[13px] text-destructive">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{warning}</span>
        </div>
      )}

      {step === 1 ? (
        <div className="space-y-4">
          <Field>
            <FieldLabel htmlFor="admin-confirm-value">{confirmLabel}</FieldLabel>
            <Input
              id="admin-confirm-value"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder={confirmPlaceholder ?? confirmValue}
              autoFocus
              autoComplete="off"
            />
          </Field>
          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              Annuler
            </Button>
            <Button variant="destructive" disabled={!matches} onClick={() => setStep(2)}>
              Continuer <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </DialogFooter>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field>
            <FieldLabel htmlFor="admin-password">Votre mot de passe administrateur</FieldLabel>
            <HiddenUsername />
            <div className="relative">
              <Input
                id="admin-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
                required
                autoComplete="current-password"
                className="pr-10"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </Field>

          {error && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setStep(1)} disabled={submitting}>
              <ArrowLeft className="mr-1.5 h-4 w-4" /> Retour
            </Button>
            <Button type="submit" variant="destructive" disabled={!password || submitting}>
              {submitting ? (
                <>
                  <Spinner /> Suppression…
                </>
              ) : (
                submitLabel
              )}
            </Button>
          </DialogFooter>
        </form>
      )}
    </Dialog>
  )
}
