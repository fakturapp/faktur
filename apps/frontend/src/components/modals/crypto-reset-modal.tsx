'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '@/lib/api'
import { Shield, AlertTriangle, Trash2, KeyRound, Loader2, CheckCircle2, Lock, Key } from 'lucide-react'

function formatRecoveryKeyInput(value: string): string {
  const raw = value.replace(/[^0-9a-fA-F]/g, '').toUpperCase().slice(0, 32)
  return raw.match(/.{1,4}/g)?.join('-') ?? ''
}

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
  const [mode, setMode] = useState<'choose' | 'recover' | 'recover-key' | 'wipe'>('choose')
  const [oldPassword, setOldPassword] = useState('')
  const [recoveryKey, setRecoveryKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [wipeStep, setWipeStep] = useState(0)
  const [wipeConfirmText, setWipeConfirmText] = useState('')
  const [wipePassword, setWipePassword] = useState('')
  const [wiped, setWiped] = useState(false)

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

  async function handleRecoverWithKey() {
    if (!recoveryKey.trim()) {
      setError('Veuillez entrer votre clef de secours')
      return
    }
    setLoading(true)
    setError('')
    const { error: apiError } = await api.post('/auth/crypto/recover', {
      recoveryKey: recoveryKey.replace(/-/g, '').trim(),
    })
    setLoading(false)
    if (apiError) {
      setError(apiError)
    } else {
      onRecovered()
    }
  }

  async function handleWipe() {
    if (!wipePassword.trim()) {
      setError('Veuillez entrer votre mot de passe')
      return
    }
    setLoading(true)
    setError('')
    const { error: apiError } = await api.post('/auth/crypto/wipe', {
      confirm: 'SUPPRIMER',
      password: wipePassword,
    })
    setLoading(false)
    if (apiError) {
      setError(apiError)
    } else {
      setWiped(true)
      setTimeout(() => {
        onWiped()
      }, 2400)
    }
  }

  const contentKey = mode === 'wipe' ? `wipe-${wipeStep}` : mode === 'recover-key' ? 'recover-key' : mode

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          // When wiped, animate the entire container out
          animate={wiped ? { opacity: 0 } : { opacity: 1 }}
          transition={wiped ? { duration: 0.8, delay: 1.6, ease: 'easeIn' as const } : {}}
        >
          {/* Backdrop */}
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate={wiped ? { opacity: 0 } : 'visible'}
            exit="hidden"
            transition={{ duration: wiped ? 1.2 : 0.3, delay: wiped ? 1.2 : 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Panel */}
          <AnimatePresence mode="wait">
            {!wiped ? (
              <motion.div
                key="panel"
                variants={panelVariants}
                initial="hidden"
                animate="visible"
                exit={{
                  opacity: 0,
                  scale: 0,
                  y: -60,
                  rotate: -3,
                  transition: { duration: 0.6, ease: [0.4, 0, 1, 1] },
                }}
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
                      {/* ===== CHOOSE MODE ===== */}
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
                            onClick={() => { setMode('recover-key'); setError('') }}
                            className="w-full flex items-center gap-3 p-4 rounded-xl border border-border hover:bg-muted/50 transition-colors text-left"
                          >
                            <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-indigo-500/10 shrink-0">
                              <Key className="h-4 w-4 text-indigo-400" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-foreground">Utiliser ma clef de secours</p>
                              <p className="text-xs text-muted-foreground">J&apos;ai ma clef de secours re&ccedil;ue par email</p>
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
                              <p className="text-xs text-muted-foreground">Je n&apos;ai ni mon ancien mot de passe, ni ma clef</p>
                            </div>
                          </motion.button>
                        </div>
                      )}

                      {/* ===== RECOVER MODE ===== */}
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

                      {/* ===== RECOVER WITH KEY MODE ===== */}
                      {mode === 'recover-key' && (
                        <div className="space-y-4">
                          <p className="text-sm text-muted-foreground">
                            Entrez la clef de secours re&ccedil;ue par email pour r&eacute;cup&eacute;rer vos donn&eacute;es.
                          </p>

                          <div>
                            <label className="block text-sm font-medium text-foreground mb-1.5">Clef de secours</label>
                            <input
                              type="text"
                              value={recoveryKey}
                              onChange={(e) => setRecoveryKey(formatRecoveryKeyInput(e.target.value))}
                              onKeyDown={(e) => e.key === 'Enter' && handleRecoverWithKey()}
                              maxLength={39}
                              placeholder="XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX"
                              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono tracking-wider"
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
                              onClick={() => { setMode('choose'); setError(''); setRecoveryKey('') }}
                              className="flex-1 px-4 py-2 text-sm font-medium text-muted-foreground border border-border rounded-lg hover:bg-muted/50 transition-colors"
                            >
                              Retour
                            </motion.button>
                            <motion.button
                              whileTap={{ scale: 0.97 }}
                              onClick={handleRecoverWithKey}
                              disabled={loading || !recoveryKey.trim()}
                              className="flex-1 px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                              R&eacute;cup&eacute;rer
                            </motion.button>
                          </div>
                        </div>
                      )}

                      {/* ===== WIPE STEP 0 - Warning ===== */}
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

                      {/* ===== WIPE STEP 1 - Confirm ===== */}
                      {mode === 'wipe' && wipeStep === 1 && (
                        <div className="space-y-4">
                          <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3">
                            <p className="text-sm text-destructive font-medium">
                              Confirmation 2/4 : &Ecirc;tes-vous vraiment s&ucirc;r ? Toutes vos donn&eacute;es seront d&eacute;finitivement perdues.
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

                      {/* ===== WIPE STEP 2 - Type SUPPRIMER ===== */}
                      {mode === 'wipe' && wipeStep === 2 && (
                        <div className="space-y-4">
                          <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3">
                            <p className="text-sm text-destructive font-medium">
                              Confirmation 3/4 : Tapez SUPPRIMER pour continuer.
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
                              onClick={() => { setWipeStep(3); setError('') }}
                              disabled={wipeConfirmText !== 'SUPPRIMER'}
                              className="flex-1 px-4 py-2 text-sm font-medium text-destructive-foreground bg-destructive rounded-lg hover:bg-destructive/90 transition-colors disabled:opacity-50"
                            >
                              Continuer
                            </motion.button>
                          </div>
                        </div>
                      )}

                      {/* ===== WIPE STEP 3 - Password confirmation ===== */}
                      {mode === 'wipe' && wipeStep === 3 && (
                        <div className="space-y-4">
                          <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3">
                            <div className="flex items-start gap-2">
                              <Lock className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                              <p className="text-sm text-destructive font-medium">
                                Confirmation finale 4/4 : Entrez votre mot de passe actuel pour confirmer la suppression d&eacute;finitive.
                              </p>
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-foreground mb-1.5">Mot de passe actuel</label>
                            <input
                              type="password"
                              value={wipePassword}
                              onChange={(e) => setWipePassword(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && wipePassword.trim() && handleWipe()}
                              placeholder="Votre mot de passe"
                              className="w-full px-3 py-2 bg-background border border-destructive/30 rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-destructive/50"
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
                              onClick={() => { setWipeStep(2); setWipePassword(''); setError('') }}
                              className="flex-1 px-4 py-2 text-sm font-medium text-muted-foreground border border-border rounded-lg hover:bg-muted/50 transition-colors"
                            >
                              Retour
                            </motion.button>
                            <motion.button
                              whileTap={{ scale: 0.97 }}
                              onClick={handleWipe}
                              disabled={loading || !wipePassword.trim()}
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
            ) : (
              /* ===== WIPED - Destruction animation ===== */
              <motion.div
                key="wiped"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{ type: 'spring' as const, bounce: 0.3, duration: 0.5 }}
                className="relative z-10 flex flex-col items-center gap-6"
              >
                {/* Success pulse ring */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.4, 1] }}
                  transition={{ duration: 0.6, times: [0, 0.6, 1], ease: 'easeOut' as const }}
                  className="relative"
                >
                  <motion.div
                    initial={{ opacity: 0.6, scale: 1 }}
                    animate={{ opacity: 0, scale: 2.5 }}
                    transition={{ duration: 1.2, delay: 0.3, ease: 'easeOut' as const }}
                    className="absolute inset-0 rounded-full bg-destructive/20"
                  />
                  <div className="flex items-center justify-center h-20 w-20 rounded-full bg-destructive/10 border-2 border-destructive/30">
                    <motion.div
                      initial={{ scale: 0, rotate: -90 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: 0.2, type: 'spring' as const, bounce: 0.4, duration: 0.6 }}
                    >
                      <CheckCircle2 className="h-10 w-10 text-destructive" />
                    </motion.div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.3 }}
                  className="text-center"
                >
                  <h3 className="text-lg font-semibold text-foreground mb-1">Donn&eacute;es supprim&eacute;es</h3>
                  <p className="text-sm text-muted-foreground">Redirection vers la configuration...</p>
                </motion.div>

                {/* Animated dots */}
                <div className="flex gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0.3 }}
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1, delay: i * 0.2, repeat: Infinity }}
                      className="h-1.5 w-1.5 rounded-full bg-muted-foreground"
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
