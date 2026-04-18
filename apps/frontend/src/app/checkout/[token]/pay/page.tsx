'use client'

import { useState, useEffect, useCallback, use } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import { Spinner } from '@/components/ui/spinner'
import { StripePaymentForm } from '@/components/checkout/stripe-payment-form'
import { publicApi } from '@/lib/api'

type Step = 'loading' | 'error' | 'expired' | 'password' | 'method' | 'iban' | 'confirm' | 'pending' | 'done' | 'stripe'

interface Data {
  status: 'active' | 'paid_pending' | 'confirmed'
  invoiceNumber: string
  amount: number
  currency: string
  paymentMethod?: string
  isPasswordProtected?: boolean
  showIban?: boolean
  companyName?: string | null
  maskedEmail?: string | null
  hasPdf?: boolean
  hasStripe?: boolean
}

interface Iban {
  iban: string | null
  ibanRaw: string | null
  bic: string | null
  bankName: string | null
}

const slide = {
  initial: { opacity: 0, y: 20, filter: 'blur(4px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  exit: { opacity: 0, y: -12, filter: 'blur(4px)' },
  transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
}

/* ── SVG Icons ── */
function IconLock({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}
function IconBank({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3" />
    </svg>
  )
}
function IconShield({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" />
    </svg>
  )
}
function IconClock({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  )
}
function IconCheck({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  )
}
function IconAlert({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}
function IconCopy({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  )
}
function IconDownload({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  )
}
function IconMail({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  )
}


/* ── Step bar ── */
const steps = ['Méthode', 'Détails', 'Confirmation']
function StepBar({ current }: { current: number }) {
  if (current < 0) return null
  return (
    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-center gap-2 mb-6">
      {steps.map((label, i) => (
        <div key={label} className="flex items-center gap-2">
          {i > 0 && <div className={`h-px w-6 sm:w-10 transition-colors duration-500 ${i <= current ? 'bg-primary' : 'bg-border'}`} />}
          <div className="flex items-center gap-1.5">
            <div className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold transition-all duration-500 ${
              i < current ? 'bg-emerald-500/15 text-emerald-500' : i === current ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'bg-muted text-muted-foreground'
            }`}>
              {i < current ? <IconCheck className="h-3 w-3" /> : i + 1}
            </div>
            <span className={`text-[11px] font-medium hidden sm:inline transition-colors duration-500 ${i === current ? 'text-foreground' : 'text-muted-foreground/70'}`}>{label}</span>
          </div>
        </div>
      ))}
    </motion.div>
  )
}

/* ── Page ── */
export default function CheckoutPayPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)
  const [step, setStep] = useState<Step>('loading')
  const [d, setD] = useState<Data | null>(null)
  const [ib, setIb] = useState<Iban | null>(null)
  const [pw, setPw] = useState('')
  const [sess, setSess] = useState<string | null>(null)
  const [err, setErr] = useState('')
  const [pwErr, setPwErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const [dling, setDling] = useState(false)

  const boom = useCallback(() => {
    const end = Date.now() + 2500
    const go = () => {
      confetti({ particleCount: 4, angle: 60, spread: 70, origin: { x: 0, y: 0.65 }, colors: ['#6366f1', '#818cf8', '#a78bfa', '#34d399', '#fbbf24'], gravity: 0.8 })
      confetti({ particleCount: 4, angle: 120, spread: 70, origin: { x: 1, y: 0.65 }, colors: ['#6366f1', '#818cf8', '#a78bfa', '#34d399', '#fbbf24'], gravity: 0.8 })
      if (Date.now() < end) requestAnimationFrame(go)
    }
    go()
  }, [])

  useEffect(() => {
    (async () => {
      try {
        const { data: responseData, error, status } = await publicApi.get<Data>(`/checkout/${token}`)
        const r = { status, ok: !error, json: async () => responseData as Data }
        if (r.status === 404) { setErr('Ce lien de paiement est introuvable ou a été supprimé.'); setStep('error'); return }
        if (r.status === 410) { setStep('expired'); return }
        if (r.status === 429) { setErr('Trop de requêtes. Veuillez patienter quelques minutes avant de réessayer.'); setStep('error'); return }
        if (!r.ok) { setErr('Une erreur est survenue.'); setStep('error'); return }
        const data: Data = await r.json()
        setD(data)
        if (data.status === 'confirmed') { setStep('done'); setTimeout(boom, 400) }
        else if (data.status === 'paid_pending') setStep('pending')
        else if (data.isPasswordProtected) setStep('password')
        else setStep('method')
      } catch { setErr('Impossible de contacter le serveur.'); setStep('error') }
    })()
  }, [token, boom])

  async function submitPw() {
    if (!pw) return; setBusy(true); setPwErr('')
    try {
      const { data, error, status } = await publicApi.post<{ sessionToken: string }>(
        `/checkout/${token}/verify-password`,
        { password: pw }
      )
      const r = { status, ok: !error, json: async () => data as { sessionToken: string } }
      if (r.status === 401) { setPwErr('Mot de passe incorrect'); setBusy(false); return }
      if (r.status === 429) { setPwErr('Trop de tentatives. Réessayez dans quelques minutes.'); setBusy(false); return }
      if (!r.ok) { setPwErr('Erreur'); setBusy(false); return }
      setSess((await r.json()).sessionToken); setStep('method')
    } catch { setPwErr('Erreur de connexion') }
    setBusy(false)
  }

  async function pickBank() {
    if (!d?.showIban) { setStep('iban'); return }
    setBusy(true)
    try {
      const h: Record<string, string> = {}; if (sess) h['X-Checkout-Session'] = sess
      const { data, error } = await publicApi.get<Iban>(`/checkout/${token}/iban`, { headers: h })
      if (error || !data) { setErr(error || 'Erreur'); setStep('error'); setBusy(false); return }
      setIb(data); setStep('iban')
    } catch { setErr('Erreur de connexion'); setStep('error') }
    setBusy(false)
  }

  async function pay() {
    setBusy(true)
    try {
      const { error, status } = await publicApi.post(`/checkout/${token}/mark-paid`)
      const r = { status, ok: !error }
      if (r.status === 409) { setStep('pending'); setBusy(false); return }
      if (r.status === 429) { setErr('Trop de requêtes. Veuillez patienter quelques minutes.'); setStep('error'); setBusy(false); return }
      if (!r.ok) { setErr('Erreur'); setStep('error'); setBusy(false); return }
      setStep('pending'); boom()
    } catch { setErr('Erreur'); setStep('error') }
    setBusy(false)
  }

  async function dl() {
    setDling(true)
    try {
      const { blob } = await publicApi.downloadBlob(`/checkout/${token}/pdf`)
      const r = { ok: !!blob, blob: async () => blob as Blob }
      if (r.ok) { const b = await r.blob(); const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = `${d?.invoiceNumber || 'facture'}.pdf`; a.click(); URL.revokeObjectURL(u) }
    } catch { /* */ }
    setDling(false)
  }

  function cp() { if (!ib?.ibanRaw) return; navigator.clipboard.writeText(ib.ibanRaw); setCopied(true); setTimeout(() => setCopied(false), 2000) }

  const amt = d ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: d.currency }).format(d.amount) : ''
  const si = step === 'method' ? 0 : (step === 'iban' || step === 'stripe') ? 1 : step === 'confirm' ? 2 : -1

  function DlBtn() {
    if (!d?.hasPdf) return null
    return (
      <button onClick={dl} disabled={dling} className="w-full flex items-center justify-center gap-2.5 h-11 rounded-xl border border-border bg-surface text-sm text-muted-foreground hover:text-foreground hover:bg-surface-hover transition-all disabled:opacity-50">
        {dling ? <Spinner className="text-muted-foreground" /> : <IconDownload className="h-4 w-4" />}
        {dling ? 'Téléchargement...' : 'Télécharger la facture'}
      </button>
    )
  }

  return (
    <div className="w-full max-w-[440px]">
      {si >= 0 && <StepBar current={si} />}

      <AnimatePresence mode="wait">

        {/* Loading */}
        {step === 'loading' && (
          <motion.div key="l" {...slide} className="flex flex-col items-center py-28">
            <Spinner size="lg" className="text-accent" />
            <p className="mt-5 text-sm text-muted-foreground font-medium">Chargement du paiement...</p>
          </motion.div>
        )}

        {/* Error */}
        {step === 'error' && (
          <motion.div key="e" {...slide} className="rounded-xl bg-overlay shadow-surface p-8">
            <div className="flex flex-col items-center text-center">
              <div className="h-16 w-16 rounded-2xl bg-red-500/10 flex items-center justify-center mb-5">
                <IconAlert className="h-8 w-8 text-red-400" />
              </div>
              <h2 className="text-lg font-semibold text-foreground mb-2">Lien introuvable</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{err}</p>
            </div>
          </motion.div>
        )}

        {/* Expired */}
        {step === 'expired' && (
          <motion.div key="x" {...slide} className="rounded-xl bg-overlay shadow-surface p-8">
            <div className="flex flex-col items-center text-center">
              <div className="h-16 w-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-5">
                <IconClock className="h-8 w-8 text-amber-400" />
              </div>
              <h2 className="text-lg font-semibold text-foreground mb-2">Lien expiré</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">Ce lien de paiement a expiré. Contactez l&apos;émetteur de la facture pour obtenir un nouveau lien.</p>
            </div>
          </motion.div>
        )}

        {/* Password */}
        {step === 'password' && (
          <motion.div key="p" {...slide} className="rounded-xl bg-overlay shadow-surface p-8">
            <div className="flex flex-col items-center text-center mb-7">
              <div className="h-16 w-16 rounded-2xl bg-accent-soft flex items-center justify-center mb-5">
                <IconLock className="h-8 w-8 text-accent" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">Accès protégé</h2>
              <p className="text-sm text-muted-foreground mt-1.5">Ce lien est protégé. Entrez le mot de passe communiqué par l&apos;émetteur.</p>
            </div>
            <div className="space-y-3">
              <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submitPw()} placeholder="Mot de passe" autoFocus
                className="w-full h-12 rounded-xl border border-border bg-surface-hover px-4 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15 transition-all" />
              {pwErr && <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-sm text-red-400 flex items-center gap-1.5"><IconAlert className="h-3.5 w-3.5" /> {pwErr}</motion.p>}
              <button onClick={submitPw} disabled={busy || !pw}
                className="w-full h-12 rounded-xl bg-accent hover:bg-accent/90 text-primary-foreground text-sm font-semibold transition-all disabled:opacity-40 shadow-lg shadow-accent/20 flex items-center justify-center gap-2">
                {busy ? <Spinner className="text-primary-foreground" /> : 'Accéder'}
              </button>
            </div>
          </motion.div>
        )}

        {/* Method */}
        {step === 'method' && d && (
          <motion.div key="m" {...slide} className="rounded-xl bg-overlay shadow-surface p-8">
            <div className="text-center mb-8">
              {d.companyName && <p className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-[0.15em] mb-3">{d.companyName}</p>}
              <motion.p initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1, type: 'spring', bounce: 0.3 }}
                className="text-4xl font-bold text-foreground tracking-tight">{amt}</motion.p>
              <p className="text-sm text-muted-foreground mt-2">Facture {d.invoiceNumber}</p>
            </div>

            <p className="text-[10px] font-bold text-muted-secondary uppercase tracking-[0.2em] mb-3">Mode de paiement</p>

            <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} onClick={pickBank} disabled={busy}
              className="w-full flex items-center gap-4 p-4 rounded-xl border border-border bg-surface hover:bg-accent/5 hover:border-accent/30 transition-all text-left group mb-2.5">
              <div className="h-11 w-11 rounded-xl bg-accent-soft flex items-center justify-center shrink-0 group-hover:bg-accent/15 transition-colors">
                <IconBank className="h-5 w-5 text-accent" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">Virement bancaire</p>
                <p className="text-[11px] text-muted-foreground/80 mt-0.5">Coordonnées bancaires fournies</p>
              </div>
              {busy ? <Spinner className="text-accent" /> : (
                <svg className="h-4 w-4 text-muted-foreground/50 group-group-hover:text-muted-foreground transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
              )}
            </motion.button>

            {d.hasStripe ? (
              <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} onClick={() => setStep('stripe')}
                className="w-full flex items-center gap-4 p-4 rounded-xl border border-border bg-surface hover:bg-accent/5 hover:border-accent/30 transition-all text-left group mb-6">
                <div className="h-11 w-11 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0 group-hover:bg-violet-500/15 transition-colors">
                  <svg className="h-5 w-5 text-violet-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">Carte bancaire</p>
                  <p className="text-[11px] text-muted-foreground/80 mt-0.5">Paiement sécurisé par Stripe</p>
                </div>
                <svg className="h-4 w-4 text-muted-foreground/50 group-group-hover:text-muted-foreground transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
              </motion.button>
            ) : (
              <div className="flex items-center gap-4 p-4 rounded-xl border border-border/50 opacity-25 cursor-not-allowed mb-6">
                <div className="h-11 w-11 rounded-xl bg-surface-hover flex items-center justify-center shrink-0">
                  <svg className="h-5 w-5 text-muted-foreground/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                </div>
                <div className="flex-1"><p className="text-sm text-muted-foreground">Carte bancaire</p><p className="text-[11px] text-muted-foreground/50">Non disponible</p></div>
                <IconLock className="h-3.5 w-3.5 text-muted-foreground/40" />
              </div>
            )}

            <DlBtn />

            <div className="mt-6 flex items-center justify-center gap-2 text-muted-foreground/50">
              <IconShield className="h-3.5 w-3.5" /><span className="text-[11px] font-medium">Paiement sécurisé — données chiffrées</span>
            </div>
          </motion.div>
        )}

        {/* IBAN */}
        {step === 'iban' && d && (
          <motion.div key="i" {...slide} className="rounded-xl bg-overlay shadow-surface p-8">
            <div className="text-center mb-6">
              <div className="h-12 w-12 rounded-2xl bg-accent-soft flex items-center justify-center mx-auto mb-4"><IconBank className="h-6 w-6 text-accent" /></div>
              <h2 className="text-lg font-semibold text-foreground">Virement bancaire</h2>
              <p className="text-2xl font-bold text-foreground mt-1">{amt}</p>
              <p className="text-sm text-muted-foreground mt-0.5">Facture {d.invoiceNumber}</p>
            </div>

            {ib?.iban ? (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="space-y-4">
                <div className="rounded-xl bg-surface border border-border p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <svg className="h-4 w-4 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    <span className="text-[10px] font-bold text-muted-secondary uppercase tracking-[0.2em]">Coordonnées bancaires</span>
                  </div>
                  {ib.bankName && <div className="mb-4"><p className="text-[10px] text-muted-foreground/50 uppercase tracking-wider mb-1">Banque</p><p className="text-sm font-medium text-foreground">{ib.bankName}</p></div>}
                  <div className="mb-4">
                    <p className="text-[10px] text-muted-foreground/50 uppercase tracking-wider mb-1">IBAN</p>
                    <div className="flex items-center gap-2">
                      <p className="text-[15px] font-mono font-semibold text-foreground tracking-[0.15em] break-all leading-relaxed">{ib.iban}</p>
                      <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={cp}
                        className="shrink-0 h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground/70 hover:text-foreground hover:bg-surface-hover transition-all" title="Copier">
                        {copied ? <IconCheck className="h-4 w-4 text-emerald-400" /> : <IconCopy className="h-4 w-4" />}
                      </motion.button>
                    </div>
                  </div>
                  {ib.bic && <div><p className="text-[10px] text-muted-foreground/50 uppercase tracking-wider mb-1">BIC</p><p className="text-sm font-mono font-medium text-foreground tracking-wider">{ib.bic}</p></div>}
                </div>
                <div className="rounded-xl bg-accent/5 border border-accent/20 p-3.5">
                  <p className="text-xs text-accent leading-relaxed">Indiquez <strong className="text-accent">{d.invoiceNumber}</strong> en référence du virement.</p>
                </div>
              </motion.div>
            ) : (
              <div className="rounded-xl bg-surface border border-border p-5 text-center">
                <p className="text-sm text-muted-foreground">Contactez l&apos;émetteur pour les coordonnées bancaires.</p>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <motion.button whileTap={{ scale: 0.97 }} onClick={() => setStep('method')}
                className="flex-1 h-11 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:border-border transition-all flex items-center justify-center gap-2">
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg> Retour
              </motion.button>
              <motion.button whileTap={{ scale: 0.97 }} onClick={() => setStep('confirm')}
                className="flex-1 h-11 rounded-xl bg-accent hover:bg-accent/90 text-sm font-semibold text-primary-foreground transition-all shadow-lg shadow-accent/20">
                J&apos;ai payé
              </motion.button>
            </div>
            <div className="mt-3"><DlBtn /></div>
          </motion.div>
        )}

        {/* Stripe */}
        {step === 'stripe' && d && (
          <motion.div key="s" {...slide} className="rounded-xl bg-overlay shadow-surface p-8">
            <StripePaymentForm
              token={token}
              amount={amt}
              invoiceNumber={d.invoiceNumber}
              onSuccess={() => { setStep('done'); boom() }}
              onError={() => {}}
            />
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => setStep('method')}
              className="w-full mt-4 h-10 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground transition-all flex items-center justify-center gap-2">
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg> Retour
            </motion.button>
          </motion.div>
        )}

        {/* Confirm */}
        {step === 'confirm' && (
          <motion.div key="c" {...slide} className="rounded-xl bg-overlay shadow-surface p-8">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="h-16 w-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-5"><IconAlert className="h-8 w-8 text-amber-400" /></div>
              <h2 className="text-lg font-semibold text-foreground">Confirmer le paiement</h2>
            </div>
            <div className="rounded-xl bg-amber-500/5 border border-amber-500/10 p-4 mb-6">
              <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed text-center">
                En confirmant, vous ne pourrez plus revenir en arrière ni consulter les informations bancaires. L&apos;émetteur de la facture sera notifié.
              </p>
            </div>
            <div className="flex gap-3">
              <motion.button whileTap={{ scale: 0.97 }} onClick={() => setStep('iban')}
                className="flex-1 h-11 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground transition-all">Annuler</motion.button>
              <motion.button whileTap={{ scale: 0.97 }} onClick={pay} disabled={busy}
                className="flex-1 h-11 rounded-xl bg-accent hover:bg-accent/90 text-sm font-semibold text-primary-foreground transition-all disabled:opacity-40 shadow-lg shadow-accent/20 flex items-center justify-center gap-2">
                {busy ? <Spinner className="text-primary-foreground" /> : 'Confirmer'}
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Pending */}
        {step === 'pending' && d && (
          <motion.div key="w" {...slide} className="rounded-xl bg-overlay shadow-surface p-8">
            <div className="flex flex-col items-center text-center">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5 }}
                className="h-16 w-16 rounded-2xl bg-accent-soft flex items-center justify-center mb-5"><IconClock className="h-8 w-8 text-accent" /></motion.div>
              <h2 className="text-lg font-semibold text-foreground mb-2">Paiement envoyé</h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-2">
                Facture <strong className="text-foreground">{d.invoiceNumber}</strong> le paiement a été signalé et est en attente de confirmation par l&apos;émetteur.
              </p>
              {d.maskedEmail && (
                <div className="flex items-center gap-2 text-muted-foreground/70 mb-6">
                  <IconMail className="h-3.5 w-3.5" />
                  <p className="text-xs">Vous serez informé par mail à <span className="text-foreground/70 font-mono">{d.maskedEmail}</span></p>
                </div>
              )}
              <DlBtn />
              <div className="flex items-center gap-2 text-muted-foreground/50 mt-4">
                <IconClock className="h-3 w-3" />
                <p className="text-[10px]">Ce lien s&apos;autodétruira dans 5 minutes</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Done */}
        {step === 'done' && d && (
          <motion.div key="d" {...slide} className="rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 via-card to-card p-8 shadow-surface">
            <div className="flex flex-col items-center text-center">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5, delay: 0.1 }}
                className="h-16 w-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-5"><IconCheck className="h-8 w-8 text-emerald-400" /></motion.div>
              <h2 className="text-lg font-semibold text-foreground mb-2">Paiement confirmé</h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-2">
                Le paiement de la facture <strong className="text-foreground">{d.invoiceNumber}</strong> a été confirmé par l&apos;émetteur. Tout est en ordre.
              </p>
              {d.maskedEmail && (
                <div className="flex items-center gap-2 text-muted-foreground/70">
                  <IconMail className="h-3.5 w-3.5" />
                  <p className="text-xs">Une confirmation a été envoyée à <span className="text-foreground/70 font-mono">{d.maskedEmail}</span></p>
                </div>
              )}
              <div className="flex items-center gap-2 text-muted-foreground/50 mt-4">
                <IconClock className="h-3 w-3" />
                <p className="text-[10px]">Ce lien s&apos;autodétruira dans 5 minutes</p>
              </div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  )
}
