'use client'

import { useState } from 'react'
import { Lock, Eye, EyeOff } from 'lucide-react'
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldLabel, FieldDescription } from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'
import { HiddenUsername } from '@/components/auth/hidden-username'

interface Props {
  open: boolean
  onClose: () => void
  onConfirm: (password: string) => Promise<void> | void
  submitting?: boolean
}

export function ConfirmPasswordModal({ open, onClose, onConfirm, submitting }: Props) {
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  function handleClose() {
    if (submitting) return
    setPassword('')
    setShowPassword(false)
    onClose()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!password || submitting) return
    await onConfirm(password)
    setPassword('')
  }

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogHeader onClose={handleClose} icon={<Lock className="h-5 w-5 text-accent" />}>
        <DialogTitle>Confirmer le mot de passe</DialogTitle>
        <DialogDescription>
          Pour activer le chiffrement de bout en bout, confirmez votre mot de passe Faktur — il
          servira à dériver la clef de chiffrement de cette équipe.
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="mt-3 space-y-4">
        <Field>
          <FieldLabel htmlFor="confirm-password">Mot de passe Faktur</FieldLabel>
          <HiddenUsername />
          <div className="relative">
            <Input
              id="confirm-password"
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
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <FieldDescription>
            Faktur n&apos;enregistre jamais votre mot de passe — il sert uniquement à dériver la
            clef de chiffrement de cette équipe.
          </FieldDescription>
        </Field>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose} disabled={submitting}>
            Annuler
          </Button>
          <Button type="submit" disabled={!password || submitting}>
            {submitting ? (
              <>
                <Spinner /> Vérification…
              </>
            ) : (
              'Confirmer'
            )}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}
