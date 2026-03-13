'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Dialog, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Field, FieldLabel, FieldDescription } from '@/components/ui/field'
import { api } from '@/lib/api'
import { Shield, Mail, Smartphone, Key } from 'lucide-react'

interface SecurityVerificationModalProps {
  open: boolean
  onClose: () => void
  onVerified: () => void
  twoFactorEnabled?: boolean
}

type VerifyMethod = 'email' | 'totp' | 'recovery'

export function SecurityVerificationModal({
  open,
  onClose,
  onVerified,
  twoFactorEnabled = false,
}: SecurityVerificationModalProps) {
  const [method, setMethod] = useState<VerifyMethod>('email')
  const [code, setCode] = useState('')
  const [sending, setSending] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [codeSent, setCodeSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expiresAt, setExpiresAt] = useState<Date | null>(null)
  const [cooldown, setCooldown] = useState(0)
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Persist code state across close/reopen
  const [sentEmail, setSentEmail] = useState(false)

  useEffect(() => {
    if (cooldown > 0) {
      cooldownRef.current = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) {
            if (cooldownRef.current) clearInterval(cooldownRef.current)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current)
    }
  }, [cooldown])

  // Auto-send code when opening with email method
  useEffect(() => {
    if (open && method === 'email' && !sentEmail) {
      handleSendCode()
    }
  }, [open])

  async function handleSendCode() {
    setSending(true)
    setError(null)

    const { data, error: apiError } = await api.post<{ expiresAt: string }>(
      '/account/security/send-code',
      {}
    )

    setSending(false)

    if (apiError) {
      setError(apiError)
      return
    }

    setCodeSent(true)
    setSentEmail(true)
    setCooldown(60)
    if (data?.expiresAt) {
      setExpiresAt(new Date(data.expiresAt))
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    if (!code.trim()) return

    setVerifying(true)
    setError(null)

    const { data, error: apiError } = await api.post<{ verified: boolean }>(
      '/account/security/verify',
      { code: code.trim(), method }
    )

    setVerifying(false)

    if (apiError) {
      setError(apiError)
      return
    }

    if (data?.verified) {
      // Reset state
      setCode('')
      setCodeSent(false)
      setSentEmail(false)
      setExpiresAt(null)
      setError(null)
      onVerified()
    }
  }

  function handleClose() {
    // Don't reset sent state - preserve code validity across close/reopen
    setCode('')
    setError(null)
    onClose()
  }

  function switchMethod(newMethod: VerifyMethod) {
    setMethod(newMethod)
    setCode('')
    setError(null)
  }

  const isExpired = expiresAt ? new Date() > expiresAt : false

  return (
    <Dialog open={open} onClose={handleClose}>
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Shield className="h-5 w-5 text-primary" />
        </div>
        <div>
          <DialogTitle>Verification de securite</DialogTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Confirmez votre identite pour continuer
          </p>
        </div>
      </div>

      {/* Method selector (only if 2FA is enabled) */}
      {twoFactorEnabled && (
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => switchMethod('email')}
            className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm transition-colors border ${
              method === 'email'
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:bg-muted'
            }`}
          >
            <Mail className="h-4 w-4" /> Email
          </button>
          <button
            onClick={() => switchMethod('totp')}
            className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm transition-colors border ${
              method === 'totp'
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:bg-muted'
            }`}
          >
            <Smartphone className="h-4 w-4" /> 2FA
          </button>
          <button
            onClick={() => switchMethod('recovery')}
            className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm transition-colors border ${
              method === 'recovery'
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:bg-muted'
            }`}
          >
            <Key className="h-4 w-4" /> Recovery
          </button>
        </div>
      )}

      <form onSubmit={handleVerify}>
        {method === 'email' && (
          <>
            {!codeSent && !sentEmail ? (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground mb-4">
                  Un code de verification sera envoye a votre adresse email.
                </p>
                <Button type="button" onClick={handleSendCode} disabled={sending}>
                  {sending ? 'Envoi...' : 'Envoyer le code'}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <FieldDescription>
                  Un code a 6 chiffres a ete envoye a votre adresse email. Il est valide pendant 5 minutes.
                </FieldDescription>
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="000000"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="text-center text-2xl tracking-[0.3em] font-mono"
                  maxLength={6}
                  autoFocus
                />
                {isExpired && (
                  <p className="text-xs text-destructive text-center">
                    Le code a expire.
                  </p>
                )}
                <div className="flex justify-center">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleSendCode}
                    disabled={sending || cooldown > 0}
                  >
                    {cooldown > 0 ? `Renvoyer (${cooldown}s)` : sending ? 'Envoi...' : 'Renvoyer le code'}
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        {method === 'totp' && (
          <div className="space-y-4">
            <FieldDescription>
              Entrez le code a 6 chiffres de votre application d&apos;authentification.
            </FieldDescription>
            <Input
              type="text"
              inputMode="numeric"
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="text-center text-2xl tracking-[0.3em] font-mono"
              maxLength={6}
              autoFocus
            />
          </div>
        )}

        {method === 'recovery' && (
          <div className="space-y-4">
            <FieldDescription>
              Entrez un de vos codes de recuperation.
            </FieldDescription>
            <Input
              type="text"
              placeholder="XXXXX-XXXXX"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="text-center font-mono"
              autoFocus
            />
          </div>
        )}

        {error && (
          <div className="mt-3 rounded-lg bg-destructive/10 border border-destructive/20 p-3">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <DialogFooter className="mt-4">
          <Button type="button" variant="outline" onClick={handleClose}>
            Annuler
          </Button>
          <Button
            type="submit"
            disabled={verifying || !code.trim() || (method === 'email' && !codeSent && !sentEmail)}
          >
            {verifying ? 'Verification...' : 'Verifier'}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}
