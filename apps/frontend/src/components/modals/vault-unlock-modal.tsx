'use client'

import { useState } from 'react'
import { Dialog, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { FieldDescription } from '@/components/ui/field'
import { api } from '@/lib/api'
import { Spinner } from '@/components/ui/spinner'
import { Lock } from 'lucide-react'

interface VaultUnlockModalProps {
  open: boolean
  onUnlocked: () => void
}

export function VaultUnlockModal({ open, onUnlocked }: VaultUnlockModalProps) {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!password.trim()) return

    setLoading(true)
    setError(null)

    const { error: apiError } = await api.post('/auth/unlock', { password })

    setLoading(false)

    if (apiError) {
      setError(apiError)
      return
    }

    setPassword('')
    setError(null)
    onUnlocked()
  }

  return (
    <Dialog open={open} onClose={() => {}} dismissible={false}>
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
          <Lock className="h-5 w-5 text-amber-500" />
        </div>
        <div>
          <DialogTitle>Coffre-fort verrouillé</DialogTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Entrez votre mot de passe pour déverrouiller vos données
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <FieldDescription>
            Votre session est active mais les clés de chiffrement ne sont plus en mémoire.
            Entrez votre mot de passe pour déverrouiller l&apos;accès à vos données.
          </FieldDescription>
          <Input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
          />
        </div>

        {error && (
          <div className="mt-3 rounded-lg bg-destructive/10 border border-destructive/20 p-3">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <DialogFooter className="mt-4">
          <Button type="submit" disabled={loading || !password.trim()}>
            {loading ? <><Spinner /> Déverrouillage...</> : 'Déverrouiller'}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}
