'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion, type Variants } from 'framer-motion'
import { Hash, Pencil, Plus, X, AlertCircle } from '@/components/ui/icons'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { useInvoiceSettings } from '@/lib/invoice-settings-context'
import { api } from '@/lib/api'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
} satisfies Variants

type VarName = 'numero' | 'annee' | 'mois' | 'date'

const VAR_DEFS: { name: VarName; label: string; example: () => string }[] = [
  { name: 'numero', label: 'Numéro', example: () => '001' },
  { name: 'annee', label: 'Année', example: () => new Date().getFullYear().toString() },
  { name: 'mois', label: 'Mois', example: () => (new Date().getMonth() + 1).toString().padStart(2, '0') },
  { name: 'date', label: 'Date', example: () => new Date().toISOString().slice(0, 10) },
]

const VAR_REGEX = /\{(num(?:ero|éro)|ann(?:ee|ée)|mois|date)\}/gi

type Token = { type: 'text'; value: string } | { type: 'var'; name: VarName }

function tokenize(pattern: string): Token[] {
  if (!pattern) return []
  const tokens: Token[] = []
  let last = 0
  pattern.replace(VAR_REGEX, (match, raw, offset: number) => {
    if (offset > last) tokens.push({ type: 'text', value: pattern.slice(last, offset) })
    const normalized = raw.toLowerCase().replace('é', 'e') as VarName
    tokens.push({ type: 'var', name: normalized })
    last = offset + match.length
    return match
  })
  if (last < pattern.length) tokens.push({ type: 'text', value: pattern.slice(last) })
  return tokens
}

function resolvePreview(pattern: string): string {
  return tokenize(pattern)
    .map((t) => (t.type === 'text' ? t.value : VAR_DEFS.find((v) => v.name === t.name)!.example()))
    .join('')
}

function patternHasNumero(pattern: string): boolean {
  return /\{num(?:ero|éro)\}/i.test(pattern || '')
}

function TokenBadge({ name }: { name: VarName }) {
  const label = VAR_DEFS.find((v) => v.name === name)?.label ?? name
  return (
    <span className="inline-flex items-center h-6 px-2 rounded-md bg-accent/15 text-accent text-[11px] font-medium font-sans">
      {label}
    </span>
  )
}

function PdfIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <path d="M14 4h28l12 12v40a4 4 0 0 1-4 4H14a4 4 0 0 1-4-4V8a4 4 0 0 1 4-4z" fill="#fff" stroke="#e2e8f0" strokeWidth="1.5" />
      <path d="M42 4v12h12" fill="none" stroke="#e2e8f0" strokeWidth="1.5" />
      <rect x="6" y="32" width="44" height="20" rx="3" fill="#dc2626" />
      <text x="28" y="46" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="11" fontWeight="700" fill="#fff">PDF</text>
    </svg>
  )
}

function fakeSize(pattern: string): string {
  const seed = (pattern || '').length * 37 + 197
  const kb = 180 + (seed % 240)
  return `${kb} KB`
}

function formatFrenchDate(d: Date): string {
  const months = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juill.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
}

function FilePreviewCard({ pattern, fallback, kind }: { pattern: string; fallback: string; kind: 'devis' | 'facture' }) {
  const resolved = resolvePreview(pattern || fallback)
  const filename = `${resolved || fallback.replace(/[{}]/g, '')}.pdf`
  const today = new Date()
  return (
    <div className="rounded-xl border border-border bg-background p-3 flex items-center gap-3 shadow-sm">
      <div className="shrink-0 w-10 h-12">
        <PdfIcon className="w-full h-full" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
          {kind === 'devis' ? 'Devis' : 'Facture'}
        </p>
        <p className="text-sm font-semibold text-foreground truncate font-mono" title={filename}>
          {filename}
        </p>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          {formatFrenchDate(today)} · {fakeSize(pattern || fallback)}
        </p>
      </div>
    </div>
  )
}

function SheetPreview({ pattern, fallback, kind }: { pattern: string; fallback: string; kind: 'devis' | 'facture' }) {
  const resolved = resolvePreview(pattern || fallback) || '—'
  const titleLabel = kind === 'devis' ? 'DEVIS' : 'FACTURE'
  return (
    <div className="rounded-xl border border-border bg-white dark:bg-zinc-50 p-4 shadow-sm aspect-[210/297] flex flex-col text-zinc-900 select-none">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="h-2 w-16 bg-zinc-300 rounded mb-1.5" />
          <div className="h-1.5 w-12 bg-zinc-200 rounded" />
        </div>
        <div className="h-6 w-6 rounded bg-accent/30" />
      </div>
      <div className="mt-2">
        <p className="text-[10px] font-bold tracking-widest text-zinc-500">{titleLabel}</p>
        <p className="text-sm font-bold text-zinc-900 font-mono truncate">{resolved}</p>
      </div>
      <div className="mt-3 space-y-1">
        <div className="h-1.5 w-3/4 bg-zinc-200 rounded" />
        <div className="h-1.5 w-2/3 bg-zinc-200 rounded" />
        <div className="h-1.5 w-1/2 bg-zinc-200 rounded" />
      </div>
      <div className="mt-auto space-y-1">
        <div className="h-1 w-full bg-zinc-100 rounded" />
        <div className="h-1 w-full bg-zinc-100 rounded" />
        <div className="h-1 w-2/3 bg-zinc-100 rounded" />
      </div>
    </div>
  )
}

function PatternPreview({ pattern }: { pattern: string }) {
  const tokens = tokenize(pattern)
  if (tokens.length === 0) {
    return <span className="text-xs text-muted-foreground italic">Aucun format défini</span>
  }
  return (
    <span className="inline-flex items-center flex-wrap gap-1 font-mono text-sm text-foreground/90">
      {tokens.map((t, i) =>
        t.type === 'text' ? (
          <span key={i} className="whitespace-pre">{t.value}</span>
        ) : (
          <TokenBadge key={i} name={t.name} />
        )
      )}
    </span>
  )
}

function EditablePatternPreview({ pattern, onChange }: { pattern: string; onChange: (next: string) => void }) {
  const tokens = tokenize(pattern)

  const removeVar = (varName: VarName) => {
    const next = tokens
      .filter((t) => !(t.type === 'var' && t.name === varName))
      .map((t) => (t.type === 'text' ? t.value : `{${t.name}}`))
      .join('')
    onChange(next)
  }

  if (tokens.length === 0) {
    return <span className="text-xs text-muted-foreground italic">Cliquez sur une variable ci-dessous</span>
  }

  return (
    <span className="inline-flex items-center flex-wrap gap-1 font-mono text-sm text-foreground/90">
      {tokens.map((t, i) =>
        t.type === 'text' ? (
          <span key={i} className="whitespace-pre">{t.value}</span>
        ) : (
          <span
            key={i}
            className="inline-flex items-center h-6 pl-2 pr-1 rounded-md bg-accent/15 text-accent text-[11px] font-medium font-sans gap-0.5 group/badge"
          >
            {VAR_DEFS.find((v) => v.name === t.name)?.label ?? t.name}
            <button
              type="button"
              onClick={() => removeVar(t.name)}
              className="inline-flex h-4 w-4 items-center justify-center rounded-sm text-accent/70 hover:bg-accent/20 hover:text-accent transition-colors"
              aria-label={`Retirer ${t.name}`}
              title="Retirer"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </span>
        )
      )}
    </span>
  )
}

interface PatternEditorProps {
  open: boolean
  title: string
  initialValue: string
  fallback: string
  kind: 'devis' | 'facture'
  onClose: () => void
  onSave: (next: string) => void
}

function PatternEditor({ open, title, initialValue, fallback, kind, onClose, onSave }: PatternEditorProps) {
  const [value, setValue] = useState(initialValue)

  useEffect(() => {
    if (open) setValue(initialValue || fallback)
  }, [open, initialValue, fallback])

  const usedVars = useMemo(() => {
    const set = new Set<VarName>()
    tokenize(value).forEach((t) => { if (t.type === 'var') set.add(t.name) })
    return set
  }, [value])

  const insertVariable = useCallback((name: VarName) => {
    setValue((v) => {
      if (tokenize(v).some((t) => t.type === 'var' && t.name === name)) return v
      return v + `{${name}}`
    })
  }, [])

  const preview = resolvePreview(value || fallback)

  return (
    <Dialog open={open} onClose={onClose} className="max-w-lg">
      <DialogHeader icon={<Hash className="h-5 w-5 text-accent" />}>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>
          Composez le format en tapant du texte et en ajoutant des variables.
        </DialogDescription>
      </DialogHeader>

      <div className="px-6 py-4 space-y-4">
        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
            Structure
          </label>
          <div className="rounded-lg border border-border bg-muted/30 p-3 min-h-[44px] flex items-center">
            <EditablePatternPreview pattern={value} onChange={setValue} />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
            Format
          </label>
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={fallback}
            className="text-sm font-mono"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
            Aperçu en direct
          </label>
          <div className="space-y-2">
            <FilePreviewCard pattern={value} fallback={fallback} kind={kind} />
            <div className="rounded-lg border border-accent/30 bg-accent/5 p-3 flex items-center justify-center">
              <span className="font-mono text-base font-semibold text-foreground tracking-wide">
                {preview || <span className="text-muted-foreground/60 text-xs font-normal italic">Aucun format</span>}
              </span>
            </div>
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
            Insérer une variable
          </label>
          <div className="flex flex-wrap gap-1.5">
            {VAR_DEFS.map((v) => {
              const used = usedVars.has(v.name)
              return (
                <button
                  key={v.name}
                  type="button"
                  onClick={() => insertVariable(v.name)}
                  disabled={used}
                  title={used ? 'Déjà ajouté' : undefined}
                  className="inline-flex items-center gap-1 h-7 px-2.5 rounded-md bg-accent/10 text-accent text-[12px] font-medium hover:bg-accent/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-accent/10"
                >
                  <Plus className="h-3 w-3" /> {v.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button variant="ghost" onClick={onClose}>Annuler</Button>
        <Button onClick={() => { onSave(value.trim() || fallback); onClose() }}>Valider</Button>
      </DialogFooter>
    </Dialog>
  )
}

interface PatternRowProps {
  label: string
  pattern: string
  fallback: string
  kind: 'devis' | 'facture'
  onChange: (next: string) => void
}

function PatternRow({ label, pattern, fallback, kind, onChange }: PatternRowProps) {
  const [editing, setEditing] = useState(false)
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
        {label}
      </label>
      <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/20 px-3 py-2.5 min-h-[44px]">
        <div className="flex-1 min-w-0 overflow-x-auto">
          <PatternPreview pattern={pattern || fallback} />
        </div>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="shrink-0 inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent/10 hover:text-accent transition-colors"
          aria-label="Modifier"
          title="Modifier"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      </div>
      <p className="mt-1.5 text-[11px] text-muted-foreground">
        Aperçu&nbsp;: <span className="font-mono text-foreground/80">{resolvePreview(pattern || fallback)}</span>
      </p>
      <PatternEditor
        open={editing}
        title={`Modifier — ${label}`}
        initialValue={pattern}
        fallback={fallback}
        kind={kind}
        onClose={() => setEditing(false)}
        onSave={onChange}
      />
    </div>
  )
}

interface NextNumberRowProps {
  label: string
  value: string | null
  autoNext: string
  patternHasNumero: boolean
  onChange: (next: string | null) => void
}

function NextNumberRow({ label, value, autoNext, patternHasNumero, onChange }: NextNumberRowProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value || autoNext || '')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setDraft(value || autoNext || '') }, [value, autoNext])
  useEffect(() => { if (editing) inputRef.current?.focus() }, [editing])

  const commit = () => {
    const trimmed = draft.trim()
    setEditing(false)
    onChange(trimmed && trimmed !== autoNext ? trimmed : null)
  }

  const displayValue = value || autoNext || '—'
  const disabled = !patternHasNumero

  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
        {label}
      </label>
      <div
        className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 min-h-[44px] transition-colors ${
          disabled
            ? 'border-danger/40 bg-danger/5'
            : editing
            ? 'border-accent bg-background'
            : 'border-border bg-muted/20'
        }`}
      >
        {editing && !disabled ? (
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit()
              if (e.key === 'Escape') { setDraft(value || autoNext || ''); setEditing(false) }
            }}
            className="flex-1 min-w-0 bg-transparent border-0 outline-none font-mono text-sm text-foreground"
          />
        ) : (
          <span className={`flex-1 min-w-0 truncate font-mono text-sm ${disabled ? 'text-danger/70' : value ? 'text-foreground' : 'text-muted-foreground/70'}`}>
            {disabled ? '—' : displayValue}
          </span>
        )}
        <button
          type="button"
          onClick={() => !disabled && setEditing(true)}
          disabled={disabled}
          className="shrink-0 inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent/10 hover:text-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-muted-foreground"
          aria-label="Modifier"
          title={disabled ? 'Ajoutez la variable Numéro au format pour activer' : 'Modifier'}
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      </div>
      {disabled ? (
        <p className="mt-1.5 text-[11px] text-danger flex items-center gap-1">
          <AlertCircle className="h-3 w-3" /> Aucun numéro trouvé dans le format
        </p>
      ) : value ? (
        <p className="mt-1.5 text-[11px] text-muted-foreground">
          Override actif&nbsp;— utilisé une seule fois, puis numérotation continue
        </p>
      ) : (
        <p className="mt-1.5 text-[11px] text-muted-foreground">
          Auto&nbsp;: prochain numéro calculé d&apos;après le dernier document
        </p>
      )}
      {value && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="mt-1 inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-3 w-3" /> Retirer l&apos;override
        </button>
      )}
    </div>
  )
}

export default function NamingSettingsPage() {
  const { settings, loading, updateSettings } = useInvoiceSettings()
  const [autoInvoiceNext, setAutoInvoiceNext] = useState<string>('')
  const [autoQuoteNext, setAutoQuoteNext] = useState<string>('')

  const loadAutoNumbers = useCallback(async () => {
    const [inv, quo] = await Promise.all([
      api.get<{ nextNumber: string }>('/invoices/next-number'),
      api.get<{ nextNumber: string }>('/quotes/next-number'),
    ])
    if (inv.data?.nextNumber) setAutoInvoiceNext(inv.data.nextNumber)
    if (quo.data?.nextNumber) setAutoQuoteNext(quo.data.nextNumber)
  }, [])

  useEffect(() => {
    if (!loading) loadAutoNumbers()
  }, [loading, loadAutoNumbers, settings.invoiceNumberPattern, settings.quoteNumberPattern, settings.nextInvoiceNumber, settings.nextQuoteNumber])

  const quoteHasNumero = useMemo(() => patternHasNumero(settings.quoteNumberPattern), [settings.quoteNumberPattern])
  const invoiceHasNumero = useMemo(() => patternHasNumero(settings.invoiceNumberPattern), [settings.invoiceNumberPattern])

  if (loading) {
    return (
      <div className="space-y-6 px-4 lg:px-6 py-4 md:py-6">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-80" />
        </div>
        <div className="space-y-6 max-w-3xl">
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-56 w-full rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <motion.div initial="hidden" animate="visible" className="space-y-6 px-4 lg:px-6 py-4 md:py-6">
      <motion.div variants={fadeUp} custom={0}>
        <h1 className="text-2xl font-bold text-foreground">Nommage des documents</h1>
        <p className="text-muted-foreground mt-1">
          Configurez le format du nom et le prochain numéro de vos devis et factures
        </p>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-6">
       <div className="space-y-6 min-w-0">
        <motion.div variants={fadeUp} custom={1}>
          <Card className="overflow-hidden border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft">
                  <Hash className="h-4.5 w-4.5 text-accent" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-foreground">Format du nom</h2>
                  <p className="text-xs text-muted-foreground">
                    Cliquez sur le crayon pour composer le format
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                <PatternRow
                  label="Nom du devis"
                  pattern={settings.quoteNumberPattern}
                  fallback="DEV-{numero}"
                  kind="devis"
                  onChange={(next) => updateSettings({ quoteNumberPattern: next })}
                />
                <PatternRow
                  label="Nom de la facture"
                  pattern={settings.invoiceNumberPattern}
                  fallback="FAC-{numero}"
                  kind="facture"
                  onChange={(next) => updateSettings({ invoiceNumberPattern: next })}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={fadeUp} custom={2}>
          <Card className="overflow-hidden border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft">
                  <Pencil className="h-4.5 w-4.5 text-accent" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-foreground">Prochain numéro</h2>
                  <p className="text-xs text-muted-foreground">
                    Cliquez sur le crayon pour modifier le prochain numéro
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                <NextNumberRow
                  label="Prochain devis"
                  value={settings.nextQuoteNumber}
                  autoNext={autoQuoteNext}
                  patternHasNumero={quoteHasNumero}
                  onChange={(next) => updateSettings({ nextQuoteNumber: next })}
                />
                <NextNumberRow
                  label="Prochaine facture"
                  value={settings.nextInvoiceNumber}
                  autoNext={autoInvoiceNext}
                  patternHasNumero={invoiceHasNumero}
                  onChange={(next) => updateSettings({ nextInvoiceNumber: next })}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>
       </div>

       <motion.div variants={fadeUp} custom={3} className="space-y-4 xl:sticky xl:top-6 xl:self-start">
        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
          Aperçu
        </p>
        <FilePreviewCard
          pattern={settings.quoteNumberPattern}
          fallback="DEV-{numero}"
          kind="devis"
        />
        <FilePreviewCard
          pattern={settings.invoiceNumberPattern}
          fallback="FAC-{numero}"
          kind="facture"
        />
        <div className="grid grid-cols-2 gap-3">
          <SheetPreview
            pattern={settings.quoteNumberPattern}
            fallback="DEV-{numero}"
            kind="devis"
          />
          <SheetPreview
            pattern={settings.invoiceNumberPattern}
            fallback="FAC-{numero}"
            kind="facture"
          />
        </div>
       </motion.div>
      </div>
    </motion.div>
  )
}
