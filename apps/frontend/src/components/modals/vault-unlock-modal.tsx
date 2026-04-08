'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Field, FieldLabel } from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'
import { Lock, Eye, EyeOff, KeyRound, ExternalLink, LogOut } from 'lucide-react'
import { api, onVaultLocked } from '@/lib/api'
import { isFakturDesktop } from '@/lib/is-desktop'
import { useAuth } from '@/lib/auth'

type UnlockMode = 'password' | 'recoveryKey'

function formatRecoveryKeyInput(value: string): string {
  const raw = value.replace(/[^0-9a-fA-F]/g, '').toUpperCase().slice(0, 32)
  return raw.match(/.{1,4}/g)?.join('-') ?? ''
}

export function VaultUnlockModal({ forceOpen = false }: { forceOpen?: boolean }) {
  const { logout } = useAuth()
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<UnlockMode>('password')
  const [password, setPassword] = useState('')
  const [recoveryKey, setRecoveryKey] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    setIsDesktop(isFakturDesktop())
  }, [])

  useEffect(() => {
    if (forceOpen) setOpen(true)
  }, [forceOpen])

  useEffect(() => {
    return onVaultLocked(() => {
      setOpen(true)
    })
  }, [])

  async function handleUnlock(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const body =
      mode === 'password'
        ? { password }
        : { recoveryKey: recoveryKey.replace(/-/g, '').trim() }

    const { data, error: err } = await api.post<{ vaultKey?: string }>('/auth/vault/unlock', body)
    setLoading(false)

    if (err && err !== 'VAULT_LOCKED') {
      return setError(err)
    }

    if (!err) {
      if (data?.vaultKey) {
        localStorage.setItem('faktur_vault_key', data.vaultKey)
      }
      setOpen(false)
      setPassword('')
      setRecoveryKey('')
      setShowPassword(false)
      setError('')
      window.location.reload()
    }
  }

  function switchMode(newMode: UnlockMode) {
    setMode(newMode)
    setError('')
    setPassword('')
    setRecoveryKey('')
  }

  const isValid = mode === 'password' ? !!password : !!recoveryKey.trim()

  if (!open) return null

  if (isDesktop) {
    return (
      <Dialog open={open} onClose={() => {}}>
        <div className="flex flex-col items-center gap-3 mb-5">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20">
            <Lock className="h-7 w-7 text-amber-500" />
          </div>
          <DialogTitle className="text-center">Coffre-fort verrouillé</DialogTitle>
          <DialogDescription className="text-center">
            Votre coffre-fort est verrouillé. Pour le déverrouiller depuis Faktur Desktop,
            déconnectez-vous et reconnectez-vous via le flow OAuth — votre mot de passe ne
            transite jamais par l&apos;application.
          </DialogDescription>
        </div>

        <div className="flex flex-col gap-2">
          <Button
            className="w-full"
            onClick={async () => {
              await logout()
            }}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Se déconnecter et se reconnecter
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              const url = `${window.location.origin}/dashboard/account/security`
              if (typeof window !== 'undefined' && (window as any).fakturDesktop?.openExternal) {
                ;(window as any).fakturDesktop.openExternal(url)
              } else {
                window.open(url, '_blank')
              }
            }}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Déverrouiller dans le navigateur
          </Button>
        </div>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onClose={() => {}}>
      <div className="flex flex-col items-center gap-3 mb-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20">
          <Lock className="h-7 w-7 text-amber-500" />
        </div>
        <DialogTitle className="text-center">Coffre-fort verrouillé</DialogTitle>
        <DialogDescription className="text-center">
          Suite à un redémarrage du serveur, votre coffre-fort de données est verrouillé.
        </DialogDescription>
      </div>

      {/* Mode toggle */}
      <div className="flex rounded-lg border border-border overflow-hidden mb-4">
        <button
          type="button"
          onClick={() => switchMode('password')}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium transition-colors ${
            mode === 'password'
              ? 'bg-primary/10 text-primary border-r border-border'
              : 'text-muted-foreground hover:bg-muted/50 border-r border-border'
          }`}
        >
          <Lock className="h-3.5 w-3.5" />
          Mot de passe
        </button>
        <button
          type="button"
          onClick={() => switchMode('recoveryKey')}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium transition-colors ${
            mode === 'recoveryKey'
              ? 'bg-primary/10 text-primary'
              : 'text-muted-foreground hover:bg-muted/50'
          }`}
        >
          <KeyRound className="h-3.5 w-3.5" />
          Clef de secours
        </button>
      </div>

      <form onSubmit={handleUnlock} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-center text-sm text-destructive">
            {error}
          </div>
        )}

        {mode === 'password' ? (
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
        ) : (
          <Field>
            <FieldLabel htmlFor="vaultRecoveryKey">Clef de secours</FieldLabel>
            <Input
              id="vaultRecoveryKey"
              type="text"
              value={recoveryKey}
              onChange={(e) => setRecoveryKey(formatRecoveryKeyInput(e.target.value))}
              maxLength={39}
              required
              autoFocus
              className="font-mono text-sm tracking-wider"
              placeholder="XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX"
            />
            <p className="text-xs text-muted-foreground mt-1">
              La clef de secours envoyée par email lors de la création de votre équipe.
            </p>
          </Field>
        )}

        <DialogFooter>
          <Button type="submit" className="w-full" disabled={loading || !isValid}>
            {loading ? <><Spinner /> Déverrouillage...</> : 'Déverrouiller'}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}
