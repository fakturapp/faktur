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
import { ShieldCheck, Eye, EyeOff } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
  title: string
  description: React.ReactNode
  submitLabel?: string
  submitting?: boolean
  error?: string | null
  onConfirm: (password: string) => void | Promise<void>
}

export function AdminPasswordConfirmModal({
  open,
  onClose,
  title,
  description,
  submitLabel = 'Confirmer',
  submitting,
  error,
  onConfirm,
}: Props) {
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (open) {
      setPassword('')
      setShow(false)
    }
  }, [open])

  function handleClose() {
    if (!submitting) onClose()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!password || submitting) return
    await onConfirm(password)
  }

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogHeader onClose={handleClose} icon={<ShieldCheck className="h-5 w-5 text-accent" />}>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field>
          <FieldLabel htmlFor="admin-confirm-password">Votre mot de passe administrateur</FieldLabel>
          <HiddenUsername />
          <div className="relative">
            <Input
              id="admin-confirm-password"
              name="password"
              type={show ? 'text' : 'password'}
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
              onClick={() => setShow((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
              aria-label={show ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
            >
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </Field>

        {error && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose} disabled={submitting}>
            Annuler
          </Button>
          <Button type="submit" disabled={!password || submitting}>
            {submitting ? (
              <>
                <Spinner /> En cours…
              </>
            ) : (
              submitLabel
            )}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}
