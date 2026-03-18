'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '@/lib/api'
import { Shield, AlertTriangle, Trash2, KeyRound, Loader2 } from 'lucide-react'

interface CryptoResetModalProps {
  open: boolean
  onRecovered: () => void
  onWiped: () => void
}

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
}

const panelVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring' as const, bounce: 0.15, duration: 0.5 },
  },
  exit: { opacity: 0, scale: 0.95, y: 20, transition: { duration: 0.2 } },
}

const contentVariants = {
  enter: { opacity: 0, x: 20 },
  center: { opacity: 1, x: 0, transition: { duration: 0.25, ease: 'easeOut' as const } },
  exit: { opacity: 0, x: -20, transition: { duration: 0.15, ease: 'easeIn' as const } },
}

export function CryptoResetModal({ open, onRecovered, onWiped }: CryptoResetModalProps) {
  const [mode, setMode] = useState<'choose' | 'recover' | 'wipe'>('choose')
  const [oldPassword, setOldPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [wipeStep, setWipeStep] = useState(0)
  const [wipeConfirmText, setWipeConfirmText] = useState('')

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

  // Unique key for AnimatePresence content transitions
  const contentKey = mode === 'wipe' ? `wipe-${wipeStep}` : mode

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Panel */}
          <motion.div
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative z-10 w-full max-w-md mx-4 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.3 }}
              className="px-6 pt-6 pb-4 border-b border-border"
            >
              <div className="flex items-center gap-3 mb-2">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.25, type: 'spring', bounce: 0.4, duration: 0.5 }}
                  className="flex items-center justify-center h-10 w-10 rounded-xl bg-amber-500/10"
                >
                  <Shield className="h-5 w-5 text-amber-500" />
                </motion.div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Donn&eacute;es chiffr&eacute;es</h2>
                  <p className="text-xs text-muted-foreground">R&eacute;cup&eacute;ration apr&egrave;s r&eacute;initialisation du mot de passe</p>
                </div>
              </div>
            </motion.div>

            {/* Animated content area */}
            <div className="px-6 py-5 min-h-[200px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={contentKey}
                  variants={contentVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                >
                  {mode === 'choose' && (
                    <div className="space-y-4">
                      <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3">
                        <p className="text-sm text-amber-200">
                          Vos donn&eacute;es sont chiffr&eacute;es avec votre ancien mot de passe. Vous devez fournir votre ancien mot de passe pour les r&eacute;cup&eacute;rer, ou recommencer de z&eacute;ro.
                        </p>
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => { setMode('recover'); setError('') }}
                        className="w-full flex items-center gap-3 p-4 rounded-xl border border-border hover:bg-muted/50 transition-colors text-left"
                      >
                        <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-primary/10 shrink-0">
                          <KeyRound className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">R&eacute;cup&eacute;rer mes donn&eacute;es</p>
                          <p className="text-xs text-muted-foreground">J&apos;ai mon ancien mot de passe</p>
                        </div>
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => { setMode('wipe'); setWipeStep(0); setError('') }}
                        className="w-full flex items-center gap-3 p-4 rounded-xl border border-destructive/30 hover:bg-destructive/5 transition-colors text-left"
                      >
                        <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-destructive/10 shrink-0">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-destructive">Recommencer de z&eacute;ro</p>
                          <p className="text-xs text-muted-foreground">Je n&apos;ai plus mon ancien mot de passe</p>
                        </div>
                      </motion.button>
                    </div>
                  )}

                  {mode === 'recover' && (
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Entrez votre ancien mot de passe pour d&eacute;chiffrer vos donn&eacute;es et les re-chiffrer avec votre nouveau mot de passe.
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

                      <AnimatePresence>
                        {error && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3">
                              <p className="text-sm text-destructive">{error}</p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div className="flex gap-2">
                        <motion.button
                          whileTap={{ scale: 0.97 }}
                          onClick={() => { setMode('choose'); setError('') }}
                          className="flex-1 px-4 py-2 text-sm font-medium text-muted-foreground border border-border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          Retour
                        </motion.button>
                        <motion.button
                          whileTap={{ scale: 0.97 }}
                          onClick={handleRecover}
                          disabled={loading || !oldPassword.trim()}
                          className="flex-1 px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                          R&eacute;cup&eacute;rer
                        </motion.button>
                      </div>
                    </div>
                  )}

                  {mode === 'wipe' && wipeStep === 0 && (
                    <div className="space-y-4">
                      <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                          <div className="text-sm text-destructive">
                            <p className="font-medium mb-1">Attention : action irr&eacute;versible</p>
                            <p>Cette action va supprimer <strong>toutes</strong> vos &eacute;quipes, clients, factures, devis, comptes bancaires et param&egrave;tres. Vous repartirez de z&eacute;ro.</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <motion.button
                          whileTap={{ scale: 0.97 }}
                          onClick={() => { setMode('choose'); setError('') }}
                          className="flex-1 px-4 py-2 text-sm font-medium text-muted-foreground border border-border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          Annuler
                        </motion.button>
                        <motion.button
                          whileTap={{ scale: 0.97 }}
                          onClick={() => setWipeStep(1)}
                          className="flex-1 px-4 py-2 text-sm font-medium text-destructive-foreground bg-destructive rounded-lg hover:bg-destructive/90 transition-colors"
                        >
                          Je comprends, continuer
                        </motion.button>
                      </div>
                    </div>
                  )}

                  {mode === 'wipe' && wipeStep === 1 && (
                    <div className="space-y-4">
                      <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3">
                        <p className="text-sm text-destructive font-medium">
                          Confirmation 2/3 : &Ecirc;tes-vous vraiment s&ucirc;r ? Toutes vos donn&eacute;es seront d&eacute;finitivement perdues.
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <motion.button
                          whileTap={{ scale: 0.97 }}
                          onClick={() => setWipeStep(0)}
                          className="flex-1 px-4 py-2 text-sm font-medium text-muted-foreground border border-border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          Retour
                        </motion.button>
                        <motion.button
                          whileTap={{ scale: 0.97 }}
                          onClick={() => setWipeStep(2)}
                          className="flex-1 px-4 py-2 text-sm font-medium text-destructive-foreground bg-destructive rounded-lg hover:bg-destructive/90 transition-colors"
                        >
                          Oui, supprimer tout
                        </motion.button>
                      </div>
                    </div>
                  )}

                  {mode === 'wipe' && wipeStep === 2 && (
                    <div className="space-y-4">
                      <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3">
                        <p className="text-sm text-destructive font-medium mb-2">
                          Confirmation finale 3/3 : Tapez SUPPRIMER pour confirmer la suppression d&eacute;finitive de toutes vos donn&eacute;es.
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

                      <AnimatePresence>
                        {error && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3">
                              <p className="text-sm text-destructive">{error}</p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div className="flex gap-2">
                        <motion.button
                          whileTap={{ scale: 0.97 }}
                          onClick={() => { setWipeStep(1); setWipeConfirmText('') }}
                          className="flex-1 px-4 py-2 text-sm font-medium text-muted-foreground border border-border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          Retour
                        </motion.button>
                        <motion.button
                          whileTap={{ scale: 0.97 }}
                          onClick={handleWipe}
                          disabled={loading || wipeConfirmText !== 'SUPPRIMER'}
                          className="flex-1 px-4 py-2 text-sm font-medium text-destructive-foreground bg-destructive rounded-lg hover:bg-destructive/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                          Supprimer tout
                        </motion.button>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
