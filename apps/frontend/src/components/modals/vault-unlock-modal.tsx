'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Field, FieldLabel } from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'
import { Lock, Eye, EyeOff } from 'lucide-react'
import { api, onVaultLocked } from '@/lib/api'

export function VaultUnlockModal({ forceOpen = false }: { forceOpen?: boolean }) {
  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Proactive trigger from auth provider (vaultLocked in /auth/me)
  useEffect(() => {
    if (forceOpen) setOpen(true)
  }, [forceOpen])

  // Reactive trigger from 423 API responses
  useEffect(() => {
    return onVaultLocked(() => {
      setOpen(true)
    })
  }, [])

  async function handleUnlock(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error: err } = await api.post('/auth/vault/unlock', { password })
    setLoading(false)

    if (err && err !== 'VAULT_LOCKED') {
      return setError(err)
    }

    if (!err) {
      setOpen(false)
      setPassword('')
      setShowPassword(false)
      setError('')
      // Reload the current page to retry failed requests
      window.location.reload()
    }
  }

  if (!open) return null

  return (
    <Dialog open={open} onClose={() => {}}>
      <div className="flex flex-col items-center gap-3 mb-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20">
          <Lock className="h-7 w-7 text-amber-500" />
        </div>
        <DialogTitle className="text-center">Coffre-fort verrouillé</DialogTitle>
        <DialogDescription className="text-center">
          Suite à un redémarrage du serveur, votre coffre-fort de données est verrouillé.
          Entrez votre mot de passe pour le déverrouiller.
        </DialogDescription>
      </div>

      <form onSubmit={handleUnlock} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-center text-sm text-destructive">
            {error}
          </div>
        )}

        <Field>
          <FieldLabel htmlFor="vaultPassword">Mot de passe</FieldLabel>
          <div className="relative">
            <Input
              id="vaultPassword"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoFocus
              className="pr-10"
              placeholder="Votre mot de passe de connexion"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </Field>

        <DialogFooter>
          <Button type="submit" className="w-full" disabled={loading || !password}>
            {loading ? <><Spinner /> Déverrouillage...</> : 'Déverrouiller'}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}
