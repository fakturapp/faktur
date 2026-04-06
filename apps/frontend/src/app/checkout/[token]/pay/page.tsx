'use client'

import { useState, useEffect, useCallback, use } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import {
  Banknote,
  Lock,
  Download,
  CheckCircle,
  Clock,
  AlertTriangle,
  Copy,
  Check,
  CreditCard,
  Eye,
  Shield,
  ArrowLeft,
} from 'lucide-react'

type CheckoutState =
  | 'loading'
  | 'error'
  | 'expired'
  | 'password'
  | 'payment_method'
  | 'iban_view'
  | 'confirm_pay'
  | 'paid_pending'
  | 'confirmed'

interface CheckoutData {
  status: 'active' | 'paid_pending' | 'confirmed'
  invoiceNumber: string
  amount: number
  currency: string
  paymentMethod?: string
  isPasswordProtected?: boolean
  showIban?: boolean
  companyName?: string | null
  hasPdf?: boolean
}

interface IbanData {
  iban: string | null
  ibanRaw: string | null
  bic: string | null
  bankName: string | null
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333'
const API_PREFIX = process.env.NEXT_PUBLIC_API_PREFIX || ''

function getApiUrl(path: string) {
  return `${API_URL}${API_PREFIX}${path}`
}

const fadeSlide = {
  initial: { opacity: 0, y: 24, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -16, scale: 0.98 },
  transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] },
}

export default function CheckoutPayPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)
  const [state, setState] = useState<CheckoutState>('loading')
  const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null)
  const [ibanData, setIbanData] = useState<IbanData | null>(null)
  const [password, setPassword] = useState('')
  const [sessionToken, setSessionToken] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [downloading, setDownloading] = useState(false)

  const fireConfetti = useCallback(() => {
    const duration = 2000
    const end = Date.now() + duration
    const frame = () => {
      confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0, y: 0.6 }, colors: ['#6366f1', '#818cf8', '#a78bfa', '#4ade80', '#fbbf24'] })
      confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1, y: 0.6 }, colors: ['#6366f1', '#818cf8', '#a78bfa', '#4ade80', '#fbbf24'] })
      if (Date.now() < end) requestAnimationFrame(frame)
    }
    frame()
  }, [])

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(getApiUrl(`/checkout/${token}`))
        if (res.status === 404) {
          setErrorMessage('Ce lien de paiement est introuvable.')
          setState('error')
          return
        }
        if (res.status === 410) {
          setState('expired')
          return
        }
        if (!res.ok) {
          setErrorMessage('Une erreur est survenue.')
          setState('error')
          return
        }
        const data: CheckoutData = await res.json()
        setCheckoutData(data)

        if (data.status === 'confirmed') { setState('confirmed'); setTimeout(fireConfetti, 300) }
        else if (data.status === 'paid_pending') setState('paid_pending')
        else if (data.isPasswordProtected) setState('password')
        else setState('payment_method')
      } catch {
        setErrorMessage('Impossible de charger les informations de paiement.')
        setState('error')
      }
    }
    load()
  }, [token])

  async function handlePasswordSubmit() {
    if (!password) return
    setLoading(true)
    setPasswordError('')
    try {
      const res = await fetch(getApiUrl(`/checkout/${token}/verify-password`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (res.status === 401) { setPasswordError('Mot de passe incorrect'); setLoading(false); return }
      if (res.status === 429) { setPasswordError('Trop de tentatives. Réessayez plus tard.'); setLoading(false); return }
      if (!res.ok) { setPasswordError('Une erreur est survenue'); setLoading(false); return }
      const data = await res.json()
      setSessionToken(data.sessionToken)
      setState('payment_method')
    } catch {
      setPasswordError('Erreur de connexion')
    }
    setLoading(false)
  }

  async function handleSelectBankTransfer() {
    if (!checkoutData?.showIban) {
      // No IBAN to show, go directly to iban_view without data
      setState('iban_view')
      return
    }

    setLoading(true)
    try {
      const headers: Record<string, string> = {}
      if (sessionToken) headers['X-Checkout-Session'] = sessionToken

      const res = await fetch(getApiUrl(`/checkout/${token}/iban`), { headers })
      if (!res.ok) {
        const err = await res.json().catch(() => null)
        setErrorMessage(err?.message || 'Impossible de charger les informations bancaires.')
        setState('error')
        setLoading(false)
        return
      }
      const data: IbanData = await res.json()
      setIbanData(data)
      setState('iban_view')
    } catch {
      setErrorMessage('Erreur de connexion')
      setState('error')
    }
    setLoading(false)
  }

  async function handleMarkPaid() {
    setLoading(true)
    try {
      const res = await fetch(getApiUrl(`/checkout/${token}/mark-paid`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      if (res.status === 409) { setState('paid_pending'); setLoading(false); return }
      if (!res.ok) { setErrorMessage('Une erreur est survenue'); setState('error'); setLoading(false); return }
      setState('paid_pending')
      fireConfetti()
    } catch {
      setErrorMessage('Erreur de connexion')
      setState('error')
    }
    setLoading(false)
  }

  async function handleDownloadPdf() {
    setDownloading(true)
    try {
      const res = await fetch(getApiUrl(`/checkout/${token}/pdf`))
      if (!res.ok) { setDownloading(false); return }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${checkoutData?.invoiceNumber || 'facture'}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch { /* silent */ }
    setDownloading(false)
  }

  async function handleCopyIban() {
    if (!ibanData?.ibanRaw) return
    await navigator.clipboard.writeText(ibanData.ibanRaw)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const formattedAmount = checkoutData
    ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: checkoutData.currency }).format(checkoutData.amount)
    : ''

  function DownloadButton({ className }: { className?: string }) {
    if (!checkoutData?.hasPdf) return null
    return (
      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleDownloadPdf}
        disabled={downloading}
        className={`w-full flex items-center justify-center gap-2 h-11 rounded-xl border border-zinc-700/50 text-sm text-zinc-400 hover:text-white hover:border-zinc-600 hover:bg-zinc-800/30 transition-all ${className || ''}`}
      >
        <Download className="h-4 w-4" />
        {downloading ? 'Téléchargement...' : 'Télécharger la facture'}
      </motion.button>
    )
  }

  return (
    <div className="w-full max-w-md">
      <AnimatePresence mode="wait">

        {/* ── Loading ── */}
        {state === 'loading' && (
          <motion.div key="loading" {...fadeSlide} className="flex flex-col items-center justify-center py-24">
            <div className="relative">
              <div className="h-10 w-10 rounded-full border-2 border-indigo-500/20" />
              <div className="absolute inset-0 h-10 w-10 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
            </div>
            <p className="mt-5 text-sm text-zinc-500">Chargement du paiement...</p>
          </motion.div>
        )}

        {/* ── Error ── */}
        {state === 'error' && (
          <motion.div key="error" {...fadeSlide} className="rounded-2xl border border-red-500/15 bg-[#141118] p-8 shadow-2xl shadow-red-500/5">
            <div className="flex flex-col items-center text-center">
              <div className="h-14 w-14 rounded-2xl bg-red-500/10 flex items-center justify-center mb-5">
                <AlertTriangle className="h-7 w-7 text-red-400" />
              </div>
              <h2 className="text-lg font-semibold text-white mb-2">Erreur</h2>
              <p className="text-sm text-zinc-400 leading-relaxed">{errorMessage}</p>
            </div>
          </motion.div>
        )}

        {/* ── Expired ── */}
        {state === 'expired' && (
          <motion.div key="expired" {...fadeSlide} className="rounded-2xl border border-amber-500/15 bg-[#141118] p-8 shadow-2xl shadow-amber-500/5">
            <div className="flex flex-col items-center text-center">
              <div className="h-14 w-14 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-5">
                <Clock className="h-7 w-7 text-amber-400" />
              </div>
              <h2 className="text-lg font-semibold text-white mb-2">Lien expiré</h2>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Ce lien de paiement a expiré. Contactez l&apos;émetteur pour obtenir un nouveau lien.
              </p>
            </div>
          </motion.div>
        )}

        {/* ── Password ── */}
        {state === 'password' && (
          <motion.div key="password" {...fadeSlide} className="rounded-2xl border border-zinc-800 bg-[#141118] p-8 shadow-2xl">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="h-14 w-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-5">
                <Lock className="h-7 w-7 text-indigo-400" />
              </div>
              <h2 className="text-lg font-semibold text-white">Accès protégé</h2>
              <p className="text-sm text-zinc-400 mt-1.5">Entrez le mot de passe pour accéder au paiement</p>
            </div>

            <div className="space-y-3">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                placeholder="Mot de passe"
                autoFocus
                className="w-full h-12 rounded-xl border border-zinc-700 bg-zinc-900/80 px-4 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all"
              />
              {passwordError && (
                <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-sm text-red-400 flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5" /> {passwordError}
                </motion.p>
              )}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.97 }}
                onClick={handlePasswordSubmit}
                disabled={loading || !password}
                className="w-full h-12 rounded-xl bg-gradient-to-b from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white text-sm font-semibold transition-all disabled:opacity-40 disabled:hover:from-indigo-500 shadow-lg shadow-indigo-500/20"
              >
                {loading ? (
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                ) : (
                  'Accéder'
                )}
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* ── Payment Method ── */}
        {state === 'payment_method' && checkoutData && (
          <motion.div key="method" {...fadeSlide} className="rounded-2xl border border-zinc-800 bg-[#141118] p-8 shadow-2xl">
            {/* Amount header */}
            <div className="text-center mb-8">
              {checkoutData.companyName && (
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">{checkoutData.companyName}</p>
              )}
              <motion.p
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, type: 'spring', bounce: 0.3 }}
                className="text-3xl font-bold text-white tracking-tight"
              >
                {formattedAmount}
              </motion.p>
              <p className="text-sm text-zinc-500 mt-1.5">Facture {checkoutData.invoiceNumber}</p>
            </div>

            <div className="space-y-2.5">
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Mode de paiement</p>

              <motion.button
                whileHover={{ scale: 1.01, borderColor: 'rgba(99, 102, 241, 0.5)' }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSelectBankTransfer}
                disabled={loading}
                className="w-full flex items-center gap-4 p-4 rounded-xl border border-zinc-700/50 bg-zinc-900/30 hover:bg-indigo-500/5 transition-all text-left group"
              >
                <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0 group-hover:bg-indigo-500/15 transition-colors">
                  <Banknote className="h-5 w-5 text-indigo-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white">Virement bancaire</p>
                  <p className="text-xs text-zinc-500 mt-0.5">Effectuez un virement vers le compte indiqué</p>
                </div>
                {loading && <div className="h-4 w-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />}
              </motion.button>

              {/* Stripe placeholder */}
              <div className="flex items-center gap-4 p-4 rounded-xl border border-zinc-800/50 opacity-35 cursor-not-allowed">
                <div className="h-10 w-10 rounded-xl bg-zinc-800/50 flex items-center justify-center shrink-0">
                  <CreditCard className="h-5 w-5 text-zinc-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-zinc-500">Carte bancaire</p>
                  <p className="text-xs text-zinc-600">Bientôt disponible</p>
                </div>
                <Lock className="h-3.5 w-3.5 text-zinc-700" />
              </div>
            </div>

            <div className="mt-6">
              <DownloadButton />
            </div>

            {/* Security footer */}
            <div className="mt-6 flex items-center justify-center gap-1.5 text-zinc-600">
              <Shield className="h-3 w-3" />
              <span className="text-[11px]">Paiement sécurisé et chiffré</span>
            </div>
          </motion.div>
        )}

        {/* ── IBAN View ── */}
        {state === 'iban_view' && checkoutData && (
          <motion.div key="iban" {...fadeSlide} className="rounded-2xl border border-zinc-800 bg-[#141118] p-8 shadow-2xl">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center mx-auto mb-4">
                <Banknote className="h-6 w-6 text-indigo-400" />
              </div>
              <h2 className="text-lg font-semibold text-white">Virement bancaire</h2>
              <p className="text-2xl font-bold text-white mt-1">{formattedAmount}</p>
              <p className="text-sm text-zinc-500 mt-0.5">Facture {checkoutData.invoiceNumber}</p>
            </div>

            {/* IBAN card */}
            {ibanData?.iban ? (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="space-y-4"
              >
                <div className="rounded-xl bg-zinc-900/80 border border-zinc-800 p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Eye className="h-4 w-4 text-indigo-400" />
                    <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                      Coordonnées bancaires
                    </span>
                  </div>

                  {ibanData.bankName && (
                    <div className="mb-4">
                      <p className="text-[11px] text-zinc-600 uppercase tracking-wider mb-1">Banque</p>
                      <p className="text-sm font-medium text-white">{ibanData.bankName}</p>
                    </div>
                  )}

                  <div className="mb-4">
                    <p className="text-[11px] text-zinc-600 uppercase tracking-wider mb-1">IBAN</p>
                    <div className="flex items-center gap-2">
                      <p className="text-[15px] font-mono font-semibold text-white tracking-[0.15em] leading-relaxed break-all">
                        {ibanData.iban}
                      </p>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={handleCopyIban}
                        className="shrink-0 h-8 w-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-white hover:bg-zinc-800 transition-all"
                        title="Copier l'IBAN"
                      >
                        {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                      </motion.button>
                    </div>
                  </div>

                  {ibanData.bic && (
                    <div>
                      <p className="text-[11px] text-zinc-600 uppercase tracking-wider mb-1">BIC</p>
                      <p className="text-sm font-mono font-medium text-white tracking-wider">{ibanData.bic}</p>
                    </div>
                  )}
                </div>

                <div className="rounded-xl bg-indigo-500/5 border border-indigo-500/10 p-3.5">
                  <p className="text-xs text-indigo-300/80 leading-relaxed">
                    Effectuez un virement du montant indiqué vers ce compte. Indiquez <strong className="text-indigo-200">{checkoutData.invoiceNumber}</strong> en référence du virement.
                  </p>
                </div>
              </motion.div>
            ) : (
              <div className="rounded-xl bg-zinc-900/80 border border-zinc-800 p-5 text-center">
                <p className="text-sm text-zinc-400">
                  Contactez l&apos;émetteur pour obtenir les coordonnées bancaires.
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setState('payment_method')}
                className="flex-1 h-11 rounded-xl border border-zinc-700/50 text-sm font-medium text-zinc-400 hover:text-white hover:border-zinc-600 transition-all flex items-center justify-center gap-2"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Retour
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setState('confirm_pay')}
                className="flex-1 h-11 rounded-xl bg-gradient-to-b from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-sm font-semibold text-white transition-all shadow-lg shadow-indigo-500/20"
              >
                J&apos;ai payé
              </motion.button>
            </div>

            <div className="mt-3">
              <DownloadButton />
            </div>
          </motion.div>
        )}

        {/* ── Confirm Payment ── */}
        {state === 'confirm_pay' && (
          <motion.div key="confirm" {...fadeSlide} className="rounded-2xl border border-zinc-800 bg-[#141118] p-8 shadow-2xl">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="h-14 w-14 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-5">
                <AlertTriangle className="h-7 w-7 text-amber-400" />
              </div>
              <h2 className="text-lg font-semibold text-white">Confirmer le paiement</h2>
            </div>

            <div className="rounded-xl bg-amber-500/5 border border-amber-500/10 p-4 mb-6">
              <p className="text-xs text-amber-300/80 leading-relaxed text-center">
                En confirmant, vous ne pourrez plus revenir en arrière ni consulter les informations bancaires.
                Le statut sera mis à jour auprès de l&apos;émetteur.
              </p>
            </div>

            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setState('iban_view')}
                className="flex-1 h-11 rounded-xl border border-zinc-700/50 text-sm font-medium text-zinc-400 hover:text-white transition-all"
              >
                Annuler
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleMarkPaid}
                disabled={loading}
                className="flex-1 h-11 rounded-xl bg-gradient-to-b from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-sm font-semibold text-white transition-all disabled:opacity-40 shadow-lg shadow-indigo-500/20"
              >
                {loading ? (
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                ) : (
                  'Confirmer'
                )}
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* ── Paid Pending ── */}
        {state === 'paid_pending' && checkoutData && (
          <motion.div key="pending" {...fadeSlide} className="rounded-2xl border border-zinc-800 bg-[#141118] p-8 shadow-2xl">
            <div className="flex flex-col items-center text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', bounce: 0.5, delay: 0.1 }}
                className="h-14 w-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-5"
              >
                <Clock className="h-7 w-7 text-indigo-400" />
              </motion.div>
              <h2 className="text-lg font-semibold text-white mb-2">Paiement envoyé</h2>
              <p className="text-sm text-zinc-400 leading-relaxed mb-6">
                Votre paiement pour la facture <strong className="text-white">{checkoutData.invoiceNumber}</strong> a été signalé.
                Il est en attente de confirmation.
              </p>
              <DownloadButton />
            </div>
          </motion.div>
        )}

        {/* ── Confirmed ── */}
        {state === 'confirmed' && checkoutData && (
          <motion.div key="confirmed" {...fadeSlide} className="rounded-2xl border border-green-500/15 bg-[#141118] p-8 shadow-2xl shadow-green-500/5">
            <div className="flex flex-col items-center text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', bounce: 0.5, delay: 0.1 }}
                className="h-14 w-14 rounded-2xl bg-green-500/10 flex items-center justify-center mb-5"
              >
                <CheckCircle className="h-7 w-7 text-green-400" />
              </motion.div>
              <h2 className="text-lg font-semibold text-white mb-2">Paiement confirmé</h2>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Le paiement de la facture <strong className="text-white">{checkoutData.invoiceNumber}</strong> a été confirmé.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
