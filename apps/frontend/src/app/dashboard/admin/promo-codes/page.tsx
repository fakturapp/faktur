'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { Spinner } from '@/components/ui/spinner'
import { Button } from '@/components/ui/button'
import { FormSelect } from '@/components/ui/dropdown'
import { DatePicker } from '@/components/ui/date-picker'
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { useToast } from '@/components/ui/toast'
import { Ticket, Plus, Calendar, Users2, Infinity as InfinityIcon, Power, ArrowLeft } from '@/components/ui/icons'

type PlanChoice = 'both' | 'pro' | 'team'
type MaxChoice = 'illimite' | '1' | '4' | '6' | '100' | '1000' | 'custom'

const WIZARD_STEPS = ['Code', 'Remise', 'Durée', 'Forfaits', 'Limites']

type DiscountType = 'percent' | 'amount'
type Duration = 'once' | 'forever' | 'repeating'
type Plan = 'pro' | 'team'

interface PromoCode {
  id: string
  code: string
  active: boolean
  expiresAt: number | null
  maxRedemptions: number | null
  timesRedeemed: number
  percentOff: number | null
  amountOff: number | null
  duration: string
  durationInMonths: number | null
  plans: Plan[]
  createdAt: number | null
}

function formatDiscount(p: PromoCode): string {
  if (p.percentOff != null) return `-${p.percentOff} %`
  if (p.amountOff != null)
    return `-${(p.amountOff / 100).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`
  return '—'
}

function formatDuration(p: PromoCode): string {
  if (p.duration === 'forever') return 'À chaque facture'
  if (p.duration === 'repeating') return `${p.durationInMonths ?? 1} mois`
  return 'Une fois'
}

function formatDate(ts: number | null): string {
  if (!ts) return ''
  return new Date(ts * 1000).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function AdminPromoCodesPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [codes, setCodes] = useState<PromoCode[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    const { data, error } = await api.get<{ promoCodes: PromoCode[] }>('/admin/promo-codes')
    if (error) toast(error, 'error')
    else if (data?.promoCodes) setCodes(data.promoCodes)
    setLoading(false)
  }, [toast])

  useEffect(() => {
    if (user && !user.isAdmin) {
      router.replace('/dashboard')
      return
    }
    if (user?.isAdmin) load()
  }, [user, router, load])

  async function toggleActive(p: PromoCode) {
    setBusyId(p.id)
    const { error } = await api.patch(`/admin/promo-codes/${p.id}`, { active: !p.active })
    if (error) toast(error, 'error')
    else {
      setCodes((prev) => prev.map((c) => (c.id === p.id ? { ...c, active: !c.active } : c)))
      toast(p.active ? 'Code désactivé' : 'Code réactivé', 'success')
    }
    setBusyId(null)
  }

  if (!user?.isAdmin) return null

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Codes promo</h1>
          <p className="text-sm text-muted-foreground">
            Gérés par Stripe — créez ici ou directement depuis le tableau de bord Stripe.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Créer un code
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" className="text-primary" />
        </div>
      ) : codes.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-10 text-center">
          <Ticket className="mx-auto mb-3 h-9 w-9 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">Aucun code promo pour le moment.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {codes.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className={cn(
                'flex flex-wrap items-center gap-4 rounded-xl border bg-card p-4',
                p.active ? 'border-border' : 'border-border opacity-60'
              )}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Ticket className="h-5 w-5 text-primary" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold tracking-wide text-foreground">{p.code}</span>
                  <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                    {formatDiscount(p)}
                  </span>
                  {!p.active && (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                      Inactif
                    </span>
                  )}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <InfinityIcon className="h-3 w-3" /> {formatDuration(p)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Users2 className="h-3 w-3" />
                    {p.plans.length ? p.plans.map((pl) => (pl === 'pro' ? 'Pro' : 'Team')).join(' · ') : 'Tous les forfaits'}
                  </span>
                  {p.expiresAt && (
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> Expire le {formatDate(p.expiresAt)}
                    </span>
                  )}
                  <span>
                    {p.timesRedeemed}
                    {p.maxRedemptions ? ` / ${p.maxRedemptions}` : ''} utilisation{p.timesRedeemed !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              <Button
                variant="ghost"
                onClick={() => toggleActive(p)}
                disabled={busyId === p.id}
                className={cn('gap-2', p.active ? 'text-danger' : 'text-emerald-600')}
              >
                {busyId === p.id ? <Spinner /> : <Power className="h-4 w-4" />}
                {p.active ? 'Désactiver' : 'Réactiver'}
              </Button>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {createOpen && (
          <CreatePromoDialog
            onClose={() => setCreateOpen(false)}
            onCreated={() => {
              setCreateOpen(false)
              setLoading(true)
              load()
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function CreatePromoDialog({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { toast } = useToast()
  const [step, setStep] = useState(0)
  const [code, setCode] = useState('')
  const [discountType, setDiscountType] = useState<DiscountType>('percent')
  const [value, setValue] = useState('')
  const [duration, setDuration] = useState<Duration>('once')
  const [durationInMonths, setDurationInMonths] = useState('3')
  const [planChoice, setPlanChoice] = useState<PlanChoice>('both')
  const [expiresAt, setExpiresAt] = useState('')
  const [maxChoice, setMaxChoice] = useState<MaxChoice>('illimite')
  const [customMax, setCustomMax] = useState('')
  const [saving, setSaving] = useState(false)

  const numericValue = Number(value)
  const stepValid = [
    code.trim().length >= 2,
    numericValue > 0 && (discountType !== 'percent' || numericValue <= 100),
    duration !== 'repeating' || Number(durationInMonths) >= 1,
    true,
    maxChoice !== 'custom' || Number(customMax) > 0,
  ]
  const isLast = step === WIZARD_STEPS.length - 1

  function next() {
    if (!stepValid[step]) return
    if (isLast) submit()
    else setStep((s) => s + 1)
  }

  async function submit() {
    if (saving) return
    setSaving(true)
    const plans: Plan[] = planChoice === 'both' ? ['pro', 'team'] : [planChoice]
    const body: Record<string, unknown> = {
      code: code.trim().toUpperCase().replace(/\s+/g, ''),
      discountType,
      value: numericValue,
      duration,
      plans,
    }
    if (duration === 'repeating') body.durationInMonths = Math.max(1, Number(durationInMonths) || 1)
    if (expiresAt) {
      const ts = Math.floor(new Date(`${expiresAt}T23:59:59`).getTime() / 1000)
      if (ts > Math.floor(Date.now() / 1000)) body.expiresAt = ts
    }
    const max =
      maxChoice === 'illimite' ? 0 : maxChoice === 'custom' ? Number(customMax) : Number(maxChoice)
    if (max > 0) body.maxRedemptions = max

    const { error } = await api.post('/admin/promo-codes', body)
    if (error) {
      toast(error, 'error')
      setSaving(false)
      return
    }
    toast('Code promo créé sur Stripe', 'success')
    onCreated()
  }

  return (
    <Dialog open onClose={onClose}>
      <DialogHeader>
        <DialogTitle>Créer un code promo</DialogTitle>
        <DialogDescription>
          Étape {step + 1} sur {WIZARD_STEPS.length} — {WIZARD_STEPS[step]}
        </DialogDescription>
      </DialogHeader>

      <div className="mt-1 mb-4 flex gap-1.5">
        {WIZARD_STEPS.map((_, i) => (
          <div
            key={i}
            className={cn(
              'h-1 flex-1 rounded-full transition-colors',
              i <= step ? 'bg-primary' : 'bg-foreground/10'
            )}
          />
        ))}
      </div>

      <div className="min-h-[160px] px-1 py-1">
        {step === 0 && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Code promo</label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && stepValid[0]) next()
              }}
              placeholder="A2026"
              autoFocus
              className="input w-full font-mono uppercase"
            />
            <p className="mt-2 text-[12px] text-muted-foreground">
              Le code que vos clients saisiront au paiement. Lettres, chiffres et tirets.
            </p>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Type de remise</label>
              <FormSelect
                value={discountType}
                onChange={(v) => setDiscountType(v as DiscountType)}
                options={[
                  { value: 'percent', label: 'Pourcentage (%)' },
                  { value: 'amount', label: 'Montant fixe (€)' },
                ]}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                {discountType === 'percent' ? 'Pourcentage de réduction' : 'Montant de la réduction (€)'}
              </label>
              <input
                type="number"
                min={discountType === 'percent' ? 1 : 0.5}
                max={discountType === 'percent' ? 100 : undefined}
                step={discountType === 'percent' ? 1 : 0.5}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={discountType === 'percent' ? '20' : '5,00'}
                autoFocus
                className="input w-full"
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Durée de la remise</label>
              <FormSelect
                value={duration}
                onChange={(v) => setDuration(v as Duration)}
                options={[
                  { value: 'once', label: 'Une seule fois' },
                  { value: 'repeating', label: 'Plusieurs mois' },
                  { value: 'forever', label: 'À chaque facture' },
                ]}
              />
            </div>
            {duration === 'repeating' && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Nombre de mois</label>
                <input
                  type="number"
                  min={1}
                  value={durationInMonths}
                  onChange={(e) => setDurationInMonths(e.target.value)}
                  className="input w-full"
                />
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Forfaits compatibles</label>
            <FormSelect
              value={planChoice}
              onChange={(v) => setPlanChoice(v as PlanChoice)}
              options={[
                { value: 'both', label: 'Pro et Team' },
                { value: 'pro', label: 'Pro uniquement' },
                { value: 'team', label: 'Team uniquement' },
              ]}
            />
            <p className="mt-2 text-[12px] text-muted-foreground">
              Le code ne sera applicable qu&apos;aux forfaits sélectionnés.
            </p>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Expiration (optionnel)</label>
              <DatePicker value={expiresAt} onChange={setExpiresAt} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Nombre d&apos;utilisations</label>
              <FormSelect
                value={maxChoice}
                onChange={(v) => setMaxChoice(v as MaxChoice)}
                options={[
                  { value: 'illimite', label: 'Illimité' },
                  { value: '1', label: '1 utilisation' },
                  { value: '4', label: '4 utilisations' },
                  { value: '6', label: '6 utilisations' },
                  { value: '100', label: '100 utilisations' },
                  { value: '1000', label: '1000 utilisations' },
                  { value: 'custom', label: 'Personnaliser…' },
                ]}
              />
              {maxChoice === 'custom' && (
                <input
                  type="number"
                  min={1}
                  value={customMax}
                  onChange={(e) => setCustomMax(e.target.value)}
                  placeholder="Nombre d'utilisations"
                  autoFocus
                  className="input mt-2 w-full"
                />
              )}
            </div>
          </div>
        )}
      </div>

      <DialogFooter>
        {step === 0 ? (
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Annuler
          </Button>
        ) : (
          <Button variant="outline" onClick={() => setStep((s) => s - 1)} disabled={saving} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Précédent
          </Button>
        )}
        <Button onClick={next} disabled={!stepValid[step] || saving} className="gap-2">
          {saving ? (
            <>
              <Spinner /> Création…
            </>
          ) : isLast ? (
            'Créer le code'
          ) : (
            'Suivant'
          )}
        </Button>
      </DialogFooter>
    </Dialog>
  )
}
