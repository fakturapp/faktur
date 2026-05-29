'use client'

import { useState } from 'react'
import { Dialog, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Field, FieldLabel } from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'
import { KeyRound, Eye, EyeOff, CheckCircle2 } from 'lucide-react'
import { RecoveryKeyDisplay } from '@/components/shared/recovery-key-display'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { HiddenUsername } from '@/components/auth/hidden-username'

export function RecoveryKeySetupModal({ open }: { open: boolean }) {
  const { refreshUser } = useAuth()
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [recoveryKey, setRecoveryKey] = useState<string | null>(null)

  async function handleSetup(e: React.FormEvent) {
    e.preventDefault()
    if (!password.trim()) return
    setError('')
    setLoading(true)

    const { data, error: err } = await api.post<{ recoveryKey: string }>(
      '/auth/crypto/setup-recovery-key',
      { password }
    )
    setLoading(false)

    if (err || !data?.recoveryKey) {
      return setError(err || 'Une erreur est survenue')
    }

    setRecoveryKey(data.recoveryKey)
  }

  async function handleClose() {
    await refreshUser()
  }

  if (!open) return null

  return (
    <Dialog open={open} onClose={() => {}} dismissible={false}>
      {!recoveryKey ? (
        <>
          <div className="flex flex-col items-center gap-3 mb-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
              <KeyRound className="h-7 w-7 text-indigo-500" />
            </div>
            <DialogTitle className="text-center">Clef de secours</DialogTitle>
            <DialogDescription className="text-center">
              Configurez une clef de secours pour protéger vos données chiffrées.
              En cas de perte de mot de passe, cette clef vous permettra de récupérer vos données.
            </DialogDescription>
          </div>

          <div className="rounded-lg bg-indigo-500/10 border border-indigo-500/20 p-3 mb-4">
            <p className="text-sm text-indigo-300">
              Une clef unique sera générée et envoyée à votre adresse email. Conservez-la dans un endroit sûr.
            </p>
          </div>

          <form onSubmit={handleSetup} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-center text-sm text-destructive">
                {error}
              </div>
            )}

            <Field>
              <FieldLabel htmlFor="recoverySetupPassword">Mot de passe actuel</FieldLabel>
              <HiddenUsername />
              <div className="relative">
                <Input
                  id="recoverySetupPassword"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
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
              <Button type="submit" className="w-full" disabled={loading || !password.trim()}>
                {loading ? <><Spinner /> Configuration...</> : 'Configurer la clef de secours'}
              </Button>
            </DialogFooter>
          </form>
        </>
      ) : (
        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-500/10 border border-green-500/20">
              <CheckCircle2 className="h-7 w-7 text-green-500" />
            </div>
            <DialogTitle className="text-center">Clef de secours configurée</DialogTitle>
            <DialogDescription className="text-center">
              Sauvegardez cette clef dans un endroit sûr. Elle vous permettra de récupérer vos données en cas de perte de mot de passe.
            </DialogDescription>
          </div>

          <RecoveryKeyDisplay recoveryKey={recoveryKey} />

          <DialogFooter>
            <Button onClick={handleClose} className="w-full">
              J&apos;ai sauvegardé ma clef
            </Button>
          </DialogFooter>
        </div>
      )}
    </Dialog>
  )
}
