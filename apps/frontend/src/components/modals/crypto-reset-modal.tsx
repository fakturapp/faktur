'use client'

import { useState } from 'react'
import { api } from '@/lib/api'
import { Shield, AlertTriangle, Trash2, KeyRound, Loader2 } from 'lucide-react'

interface CryptoResetModalProps {
  open: boolean
  onRecovered: () => void
  onWiped: () => void
}

export function CryptoResetModal({ open, onRecovered, onWiped }: CryptoResetModalProps) {
  const [mode, setMode] = useState<'choose' | 'recover' | 'wipe'>('choose')
  const [oldPassword, setOldPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [wipeStep, setWipeStep] = useState(0) // 0, 1, 2, 3 (3 confirmations)
  const [wipeConfirmText, setWipeConfirmText] = useState('')

  if (!open) return null

  async function handleRecover() {
    if (!oldPassword.trim()) {
      setError('Veuillez entrer votre ancien mot de passe')
      return
    }
    setLoading(true)
    setError('')
    const { error: apiError } = await api.post('/auth/crypto/recover', { oldPassword })
    setLoading(false)
    if (apiError) {
      setError(apiError)
    } else {
      onRecovered()
    }
  }

  async function handleWipe() {
    setLoading(true)
    setError('')
    const { error: apiError } = await api.post('/auth/crypto/wipe', { confirm: 'SUPPRIMER' })
    setLoading(false)
    if (apiError) {
      setError(apiError)
    } else {
      onWiped()
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md mx-4 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-border">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-amber-500/10">
              <Shield className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Données chiffrées</h2>
              <p className="text-xs text-muted-foreground">Récupération après réinitialisation du mot de passe</p>
            </div>
          </div>
        </div>

        <div className="px-6 py-5">
          {mode === 'choose' && (
            <div className="space-y-4">
              <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3">
                <p className="text-sm text-amber-200">
                  Vos données sont chiffrées avec votre ancien mot de passe. Vous devez fournir votre ancien mot de passe pour les récupérer, ou recommencer de zéro.
                </p>
              </div>

              <button
                onClick={() => { setMode('recover'); setError('') }}
                className="w-full flex items-center gap-3 p-4 rounded-xl border border-border hover:bg-muted/50 transition-colors text-left"
              >
                <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-primary/10 shrink-0">
                  <KeyRound className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Récupérer mes données</p>
                  <p className="text-xs text-muted-foreground">J&apos;ai mon ancien mot de passe</p>
                </div>
              </button>

              <button
                onClick={() => { setMode('wipe'); setWipeStep(0); setError('') }}
                className="w-full flex items-center gap-3 p-4 rounded-xl border border-destructive/30 hover:bg-destructive/5 transition-colors text-left"
              >
                <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-destructive/10 shrink-0">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </div>
                <div>
                  <p className="text-sm font-medium text-destructive">Recommencer de zéro</p>
                  <p className="text-xs text-muted-foreground">Je n&apos;ai plus mon ancien mot de passe</p>
                </div>
              </button>
            </div>
          )}

          {mode === 'recover' && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Entrez votre ancien mot de passe pour déchiffrer vos données et les re-chiffrer avec votre nouveau mot de passe.
              </p>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Ancien mot de passe</label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleRecover()}
                  placeholder="Votre ancien mot de passe"
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  autoFocus
                />
              </div>

              {error && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => { setMode('choose'); setError('') }}
                  className="flex-1 px-4 py-2 text-sm font-medium text-muted-foreground border border-border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  Retour
                </button>
                <button
                  onClick={handleRecover}
                  disabled={loading || !oldPassword.trim()}
                  className="flex-1 px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Récupérer
                </button>
              </div>
            </div>
          )}

          {mode === 'wipe' && (
            <div className="space-y-4">
              {wipeStep === 0 && (
                <>
                  <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                      <div className="text-sm text-destructive">
                        <p className="font-medium mb-1">Attention : action irréversible</p>
                        <p>Cette action va supprimer <strong>toutes</strong> vos équipes, clients, factures, devis, comptes bancaires et paramètres. Vous repartirez de zéro.</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setMode('choose'); setError('') }}
                      className="flex-1 px-4 py-2 text-sm font-medium text-muted-foreground border border-border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={() => setWipeStep(1)}
                      className="flex-1 px-4 py-2 text-sm font-medium text-destructive-foreground bg-destructive rounded-lg hover:bg-destructive/90 transition-colors"
                    >
                      Je comprends, continuer
                    </button>
                  </div>
                </>
              )}

              {wipeStep === 1 && (
                <>
                  <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3">
                    <p className="text-sm text-destructive font-medium">
                      Confirmation 2/3 : Êtes-vous vraiment sûr ? Toutes vos données seront définitivement perdues.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setWipeStep(0)}
                      className="flex-1 px-4 py-2 text-sm font-medium text-muted-foreground border border-border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      Retour
                    </button>
                    <button
                      onClick={() => setWipeStep(2)}
                      className="flex-1 px-4 py-2 text-sm font-medium text-destructive-foreground bg-destructive rounded-lg hover:bg-destructive/90 transition-colors"
                    >
                      Oui, supprimer tout
                    </button>
                  </div>
                </>
              )}

              {wipeStep === 2 && (
                <>
                  <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3">
                    <p className="text-sm text-destructive font-medium mb-2">
                      Confirmation finale 3/3 : Tapez SUPPRIMER pour confirmer la suppression définitive de toutes vos données.
                    </p>
                  </div>

                  <input
                    type="text"
                    value={wipeConfirmText}
                    onChange={(e) => setWipeConfirmText(e.target.value)}
                    placeholder="Tapez SUPPRIMER"
                    className="w-full px-3 py-2 bg-background border border-destructive/30 rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-destructive/50 font-mono"
                    autoFocus
                  />

                  {error && (
                    <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3">
                      <p className="text-sm text-destructive">{error}</p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => { setWipeStep(1); setWipeConfirmText('') }}
                      className="flex-1 px-4 py-2 text-sm font-medium text-muted-foreground border border-border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      Retour
                    </button>
                    <button
                      onClick={handleWipe}
                      disabled={loading || wipeConfirmText !== 'SUPPRIMER'}
                      className="flex-1 px-4 py-2 text-sm font-medium text-destructive-foreground bg-destructive rounded-lg hover:bg-destructive/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                      Supprimer tout
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
