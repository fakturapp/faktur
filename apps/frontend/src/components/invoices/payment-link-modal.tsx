'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Dialog } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { useToast } from '@/components/ui/toast'
import { api } from '@/lib/api'
import {
  Link2,
  Copy,
  Check,
  Lock,
  Eye,
  EyeOff,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Banknote,
  Coins,
  Clock,
  FileText,
  Calendar,
  Shield,
  CheckCircle,
} from 'lucide-react'

interface PaymentLinkModalProps {
  open: boolean
  onClose: () => void
  invoiceId: string
  invoiceNumber: string
  invoicePaymentMethod: string | null
  invoiceDueDate: string | null
  hasBankAccount: boolean
  onCreated: (link: { id: string; token: string; url: string; expiresAt: string | null }) => void
}

function formatDateFr(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  } catch {
    return dateStr
  }
}

function isDatePassed(dateStr: string | null): boolean {
  if (!dateStr) return false
  try {
    const d = new Date(dateStr)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return d < today
  } catch {
    return false
  }
}

const stepSlide = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 },
  transition: { duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
}

const TOTAL_STEPS = 4

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`relative inline-flex h-[22px] w-[42px] shrink-0 cursor-pointer rounded-full transition-colors duration-200 ${
        checked ? 'bg-primary shadow-[0_0_8px_rgba(99,102,241,0.3)]' : 'bg-muted-foreground/20'
      }`}
    >
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className="block h-[18px] w-[18px] mt-[2px] rounded-full bg-white shadow-sm"
        style={{ marginLeft: checked ? 22 : 2 }}
      />
    </button>
  )
}

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }, (_, i) => (
        <motion.div
          key={i}
          animate={{
            width: i + 1 === current ? 20 : 6,
            backgroundColor: i + 1 <= current ? 'rgb(99, 102, 241)' : 'rgba(161, 161, 170, 0.2)',
          }}
          transition={{ duration: 0.3 }}
          className="h-1.5 rounded-full"
        />
      ))}
    </div>
  )
}

export function PaymentLinkModal({
  open,
  onClose,
  invoiceId,
  invoiceNumber,
  invoicePaymentMethod,
  invoiceDueDate,
  hasBankAccount,
  onCreated,
}: PaymentLinkModalProps) {
  const { toast } = useToast()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  // Step 1 - Method
  const [paymentMethod, setPaymentMethod] = useState(invoicePaymentMethod || 'bank_transfer')
  const [paymentType, setPaymentType] = useState<'full' | 'installments'>('full')

  // Step 2 - Options
  const [showIban, setShowIban] = useState(true)
  const [includePdf, setIncludePdf] = useState(true)

  // Step 3 - Security & Expiration
  const [usePassword, setUsePassword] = useState(false)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [expirationType, setExpirationType] = useState<'due_date' | 'custom' | 'days'>('days')
  const [expiresAt, setExpiresAt] = useState('')
  const [expirationDays, setExpirationDays] = useState(30)

  // Step 4 - Result
  const [generatedLink, setGeneratedLink] = useState<{
    id: string; token: string; url: string; expiresAt: string | null
  } | null>(null)

  const isCash = paymentMethod === 'cash' || paymentMethod === 'especes'
  const dueDatePassed = useMemo(() => isDatePassed(invoiceDueDate), [invoiceDueDate])
  const daysPresets = [7, 14, 30, 60]

  function handleClose() {
    setStep(1)
    setPaymentMethod(invoicePaymentMethod || 'bank_transfer')
    setPaymentType('full')
    setShowIban(true)
    setIncludePdf(true)
    setUsePassword(false)
    setPassword('')
    setShowPassword(false)
    setExpirationType('days')
    setExpiresAt('')
    setExpirationDays(30)
    setGeneratedLink(null)
    setCopied(false)
    onClose()
  }

  async function handleGenerate() {
    setLoading(true)
    const body: Record<string, any> = {
      paymentMethod: 'bank_transfer',
      paymentType: 'full',
      showIban,
      expirationType,
      includePdf,
    }
    if (usePassword && password) body.password = password
    if (expirationType === 'custom' && expiresAt) body.expiresAt = expiresAt
    if (expirationType === 'days') body.expirationDays = expirationDays

    const { data, error } = await api.post<{
      paymentLink: { id: string; token: string; url: string; expiresAt: string | null }
    }>(`/invoices/${invoiceId}/payment-link`, body)
    setLoading(false)

    if (error) { toast(error, 'error'); return }
    if (data?.paymentLink) {
      setGeneratedLink(data.paymentLink)
      onCreated(data.paymentLink)
      setStep(4)
    }
  }

  async function handleCopy() {
    if (!generatedLink) return
    await navigator.clipboard.writeText(generatedLink.url)
    setCopied(true)
    toast('Lien copié', 'success')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open={open} onClose={handleClose} dismissible={step !== 4} className="max-w-[480px] p-0 overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-base font-semibold text-foreground">
            {step === 1 && 'Mode de paiement'}
            {step === 2 && 'Options du lien'}
            {step === 3 && 'Sécurité et expiration'}
            {step === 4 && 'Lien créé'}
          </h2>
          <span className="text-[11px] text-muted-foreground font-medium">
            {step < 4 ? `Étape ${step}/${TOTAL_STEPS - 1}` : ''}
          </span>
        </div>
        {step < 4 && <StepIndicator current={step} total={TOTAL_STEPS - 1} />}
        {step < 4 && (
          <p className="text-xs text-muted-foreground mt-3">
            Facture <span className="font-semibold text-foreground">{invoiceNumber}</span>
          </p>
        )}
      </div>

      {/* Content */}
      <div className="px-6 pb-2 min-h-[260px]">
        <AnimatePresence mode="wait">

          {/* ── Step 1: Payment method ── */}
          {step === 1 && (
            <motion.div key="s1" {...stepSlide} className="space-y-3">
              <label
                className={`flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                  paymentMethod === 'bank_transfer'
                    ? 'border-primary bg-primary/5 shadow-sm shadow-primary/10'
                    : 'border-border hover:border-muted-foreground/30 hover:bg-muted/20'
                }`}
              >
                <input type="radio" name="method" value="bank_transfer" checked={paymentMethod === 'bank_transfer'} onChange={() => setPaymentMethod('bank_transfer')} className="sr-only" />
                <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${paymentMethod === 'bank_transfer' ? 'bg-primary/15' : 'bg-muted/50'}`}>
                  <Banknote className={`h-4.5 w-4.5 ${paymentMethod === 'bank_transfer' ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Virement bancaire</p>
                  <p className="text-[11px] text-muted-foreground">IBAN/BIC affiché au client</p>
                </div>
                <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'bank_transfer' ? 'border-primary' : 'border-muted-foreground/30'}`}>
                  {paymentMethod === 'bank_transfer' && <div className="h-2 w-2 rounded-full bg-primary" />}
                </div>
              </label>

              <div className="flex items-center gap-3 p-3.5 rounded-xl border-2 border-border opacity-35 cursor-not-allowed">
                <div className="h-9 w-9 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                  <Coins className="h-4.5 w-4.5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">Espèces</p>
                  <p className="text-[11px] text-muted-foreground">Non disponible pour les liens</p>
                </div>
                <Lock className="h-3.5 w-3.5 text-muted-foreground" />
              </div>

              <div className="h-px bg-border my-1" />

              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Type de paiement</p>

              <label
                className={`flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                  paymentType === 'full'
                    ? 'border-primary bg-primary/5 shadow-sm shadow-primary/10'
                    : 'border-border hover:border-muted-foreground/30'
                }`}
              >
                <input type="radio" name="type" value="full" checked={paymentType === 'full'} onChange={() => setPaymentType('full')} className="sr-only" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Montant total</p>
                </div>
                <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${paymentType === 'full' ? 'border-primary' : 'border-muted-foreground/30'}`}>
                  {paymentType === 'full' && <div className="h-2 w-2 rounded-full bg-primary" />}
                </div>
              </label>

              <div className="flex items-center gap-3 p-3.5 rounded-xl border-2 border-border opacity-35 cursor-not-allowed">
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">Paiement en plusieurs fois</p>
                </div>
                <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full uppercase tracking-wider">Bientôt</span>
              </div>
            </motion.div>
          )}

          {/* ── Step 2: Options ── */}
          {step === 2 && (
            <motion.div key="s2" {...stepSlide} className="space-y-1">
              {/* IBAN toggle */}
              <div className={`flex items-center justify-between p-3.5 rounded-xl transition-colors -mx-1 px-4 ${hasBankAccount ? 'hover:bg-muted/20' : 'opacity-40'}`}>
                <div className="flex items-center gap-3">
                  <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${hasBankAccount ? 'bg-blue-500/10' : 'bg-muted/30'}`}>
                    <Eye className={`h-4 w-4 ${hasBankAccount ? 'text-blue-400' : 'text-muted-foreground'}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Afficher l&apos;IBAN</p>
                    <p className="text-[11px] text-muted-foreground">
                      {hasBankAccount ? 'Le client verra vos coordonnées bancaires' : 'Aucun compte bancaire lié à cette facture'}
                    </p>
                  </div>
                </div>
                {hasBankAccount ? (
                  <Toggle checked={showIban} onChange={() => setShowIban(!showIban)} />
                ) : (
                  <Toggle checked={false} onChange={() => {}} />
                )}
              </div>

              {/* PDF toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-xl hover:bg-muted/20 transition-colors -mx-1 px-4">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
                    <FileText className="h-4 w-4 text-violet-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Inclure la facture PDF</p>
                    <p className="text-[11px] text-muted-foreground">Téléchargeable depuis la page de paiement</p>
                  </div>
                </div>
                <Toggle checked={includePdf} onChange={() => setIncludePdf(!includePdf)} />
              </div>

              {/* Password */}
              <div className="rounded-xl -mx-1 px-4">
                <div
                  className="flex items-center justify-between p-3.5 rounded-xl hover:bg-muted/20 transition-colors cursor-pointer"
                  onClick={() => { setUsePassword(!usePassword); if (usePassword) setPassword('') }}
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${usePassword ? 'bg-amber-500/10' : 'bg-muted/30'}`}>
                      <Lock className={`h-4 w-4 ${usePassword ? 'text-amber-400' : 'text-muted-foreground'}`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Protéger par mot de passe</p>
                      <p className="text-[11px] text-muted-foreground">
                        {usePassword ? 'Le client devra entrer le mot de passe' : 'Accès libre, sans mot de passe'}
                      </p>
                    </div>
                  </div>
                  <Toggle checked={usePassword} onChange={() => { setUsePassword(!usePassword); if (usePassword) setPassword('') }} />
                </div>

                <AnimatePresence>
                  {usePassword && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="pl-12 pr-3.5 pb-3.5 pt-1">
                        <div className="relative">
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Entrez un mot de passe..."
                            autoFocus
                            className="pr-10 h-9 text-sm"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {/* ── Step 3: Expiration ── */}
          {step === 3 && (
            <motion.div key="s3" {...stepSlide} className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Expiration du lien</p>

              {/* Due date option */}
              {invoiceDueDate && (
                <label
                  className={`flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all ${
                    dueDatePassed
                      ? 'border-border opacity-35 cursor-not-allowed'
                      : expirationType === 'due_date'
                        ? 'border-primary bg-primary/5 shadow-sm shadow-primary/10 cursor-pointer'
                        : 'border-border hover:border-muted-foreground/30 cursor-pointer'
                  }`}
                >
                  <input type="radio" name="exp" value="due_date" checked={expirationType === 'due_date'} onChange={() => !dueDatePassed && setExpirationType('due_date')} disabled={dueDatePassed} className="sr-only" />
                  <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${expirationType === 'due_date' && !dueDatePassed ? 'bg-primary/15' : 'bg-muted/30'}`}>
                    <Calendar className={`h-4 w-4 ${expirationType === 'due_date' && !dueDatePassed ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">Date d&apos;échéance</p>
                    <p className="text-[11px] text-muted-foreground">{formatDateFr(invoiceDueDate)}</p>
                  </div>
                  {dueDatePassed ? (
                    <span className="text-[10px] font-bold text-red-400 bg-red-400/10 px-2 py-0.5 rounded-full shrink-0">Passée</span>
                  ) : (
                    <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0 ${expirationType === 'due_date' ? 'border-primary' : 'border-muted-foreground/30'}`}>
                      {expirationType === 'due_date' && <div className="h-2 w-2 rounded-full bg-primary" />}
                    </div>
                  )}
                </label>
              )}

              {/* Days presets */}
              <div
                className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer ${
                  expirationType === 'days'
                    ? 'border-primary bg-primary/5 shadow-sm shadow-primary/10'
                    : 'border-border hover:border-muted-foreground/30'
                }`}
                onClick={() => setExpirationType('days')}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${expirationType === 'days' ? 'bg-primary/15' : 'bg-muted/30'}`}>
                    <Clock className={`h-4 w-4 ${expirationType === 'days' ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">Dans un nombre de jours</p>
                  </div>
                  <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0 ${expirationType === 'days' ? 'border-primary' : 'border-muted-foreground/30'}`}>
                    {expirationType === 'days' && <div className="h-2 w-2 rounded-full bg-primary" />}
                  </div>
                </div>
                <div className="flex gap-1.5 pl-12" onClick={(e) => e.stopPropagation()}>
                  {daysPresets.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => { setExpirationType('days'); setExpirationDays(d) }}
                      className={`flex-1 h-8 rounded-lg text-xs font-semibold transition-all ${
                        expirationType === 'days' && expirationDays === d
                          ? 'bg-primary text-white shadow-sm shadow-primary/20'
                          : 'bg-muted/40 text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                      }`}
                    >
                      {d}j
                    </button>
                  ))}
                  <Input
                    type="number"
                    min={1}
                    max={365}
                    value={expirationType === 'days' ? expirationDays : ''}
                    onChange={(e) => { setExpirationType('days'); setExpirationDays(Number(e.target.value)) }}
                    placeholder="..."
                    className="w-14 h-8 text-center text-xs"
                    onClick={(e) => { e.stopPropagation(); setExpirationType('days') }}
                  />
                </div>
              </div>

              {/* Custom date */}
              <label
                className={`flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                  expirationType === 'custom'
                    ? 'border-primary bg-primary/5 shadow-sm shadow-primary/10'
                    : 'border-border hover:border-muted-foreground/30'
                }`}
              >
                <input type="radio" name="exp" value="custom" checked={expirationType === 'custom'} onChange={() => setExpirationType('custom')} className="sr-only" />
                <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${expirationType === 'custom' ? 'bg-primary/15' : 'bg-muted/30'}`}>
                  <Calendar className={`h-4 w-4 ${expirationType === 'custom' ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Date personnalisée</p>
                  {expirationType === 'custom' && expiresAt && (
                    <p className="text-[11px] text-primary">{formatDateFr(expiresAt)}</p>
                  )}
                </div>
                <Input
                  type="date"
                  value={expiresAt}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => { setExpiresAt(e.target.value); setExpirationType('custom') }}
                  className="w-36 h-8 text-xs"
                  onClick={(e) => { e.stopPropagation(); setExpirationType('custom') }}
                />
              </label>
            </motion.div>
          )}

          {/* ── Step 4: Result ── */}
          {step === 4 && generatedLink && (
            <motion.div key="s4" {...stepSlide}>
              <div className="flex flex-col items-center text-center mb-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', bounce: 0.5, delay: 0.1 }}
                  className="h-14 w-14 rounded-2xl bg-green-500/10 flex items-center justify-center mb-4"
                >
                  <CheckCircle className="h-7 w-7 text-green-400" />
                </motion.div>
                <h3 className="text-base font-semibold text-foreground">Lien de paiement créé</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Partagez ce lien avec votre client
                </p>
              </div>

              <div className="rounded-xl bg-muted/20 border border-border p-3">
                <div className="flex gap-2">
                  <input
                    readOnly
                    value={generatedLink.url}
                    className="flex-1 bg-transparent text-[11px] font-mono text-muted-foreground outline-none select-all truncate"
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleCopy}
                    className={`shrink-0 h-8 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      copied
                        ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                        : 'bg-primary/10 text-primary hover:bg-primary/15 border border-primary/20'
                    }`}
                  >
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? 'Copié' : 'Copier'}
                  </motion.button>
                </div>
              </div>

              {generatedLink.expiresAt && (
                <div className="flex items-center gap-1.5 mt-3 justify-center">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <p className="text-[11px] text-muted-foreground">
                    Expire le {formatDateFr(generatedLink.expiresAt)}
                  </p>
                </div>
              )}

              <div className="mt-4 rounded-xl bg-amber-500/5 border border-amber-500/10 p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-400 mt-0.5 shrink-0" />
                  <p className="text-[11px] text-amber-300/70 leading-relaxed">
                    La facture n&apos;est plus modifiable tant que le lien est actif. Supprimez le lien pour pouvoir la modifier.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-border flex items-center justify-between">
        {step < 4 ? (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={step === 1 ? handleClose : () => setStep(step - 1)}
              className="text-muted-foreground hover:text-foreground"
            >
              {step === 1 ? 'Annuler' : <><ArrowLeft className="h-3.5 w-3.5 mr-1" /> Retour</>}
            </Button>
            {step < 3 ? (
              <Button size="sm" disabled={isCash} onClick={() => setStep(step + 1)} className="gap-1.5">
                Suivant <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            ) : (
              <Button size="sm" disabled={loading || (usePassword && password.length < 4)} onClick={handleGenerate} className="gap-1.5">
                {loading ? <Spinner className="h-4 w-4" /> : <Link2 className="h-3.5 w-3.5" />}
                Générer le lien
              </Button>
            )}
          </>
        ) : (
          <>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Shield className="h-3 w-3" />
              <span className="text-[11px]">Chiffré et sécurisé</span>
            </div>
            <Button size="sm" onClick={handleClose}>Fermer</Button>
          </>
        )}
      </div>
    </Dialog>
  )
}
