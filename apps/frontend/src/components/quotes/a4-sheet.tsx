'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  Trash2, Search, X, Building2, UserRound,
  RefreshCw, MousePointerClick, FileText, Plus, Type,
} from 'lucide-react'
import { api } from '@/lib/api'
import { Dialog, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { getTemplate, type TemplateConfig } from '@/lib/invoice-templates'
import { getTranslations } from '@/lib/invoice-i18n'

/* ═══════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════ */

export interface QuoteLine {
  id: string
  type: 'standard' | 'section'
  description: string
  saleType: string
  quantity: number
  unit: string
  unitPrice: number
  vatRate: number
}

export interface ClientInfo {
  id: string
  type: 'company' | 'individual'
  displayName: string
  companyName: string | null
  firstName: string | null
  lastName: string | null
  email: string | null
  phone: string | null
  address: string | null
  addressComplement: string | null
  postalCode: string | null
  city: string | null
  country: string
  siren: string | null
  vatNumber: string | null
}

export interface CompanyInfo {
  legalName: string
  addressLine1: string | null
  addressLine2: string | null
  postalCode: string | null
  city: string | null
  country: string
  phone: string | null
  email: string | null
  siren: string | null
  vatNumber: string | null
}

/* ═══════════════════════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════════════════════ */

function contrastText(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return (r * 299 + g * 587 + b * 114) / 1000 > 128 ? '#000' : '#fff'
}

function fmtCurrency(n: number, lang?: string) {
  return new Intl.NumberFormat(lang === 'en' ? 'en-GB' : 'fr-FR', { style: 'currency', currency: 'EUR' }).format(n)
}

function fmtDate(d: string, lang?: string) {
  if (!d) return ''
  try { return new Date(d).toLocaleDateString(lang === 'en' ? 'en-GB' : 'fr-FR') } catch { return d }
}

/* ═══════════════════════════════════════════════════════════
   InlineEdit — click-to-edit text
   ═══════════════════════════════════════════════════════════ */

function InlineEdit({
  value, onChange, preview = false, className, placeholder, multiline, accentColor = '#6366f1',
  inputBg = '#ffffff', borderDashed = '#ddd', titleText,
}: {
  value: string
  onChange: (v: string) => void
  preview?: boolean
  className?: string
  placeholder?: string
  multiline?: boolean
  accentColor?: string
  inputBg?: string
  borderDashed?: string
  titleText?: string
}) {
  const [editing, setEditing] = useState(false)
  const [tmp, setTmp] = useState(value)
  const ref = useRef<HTMLInputElement & HTMLTextAreaElement>(null)

  const start = () => {
    if (preview) return
    setTmp(value)
    setEditing(true)
    setTimeout(() => ref.current?.focus(), 10)
  }
  const confirm = () => { onChange(tmp); setEditing(false) }

  if (preview) {
    return (
      <span className={className}>
        {value || <span style={{ color: borderDashed }} className="italic">{placeholder || '...'}</span>}
      </span>
    )
  }

  if (editing) {
    const El = multiline ? 'textarea' : 'input'
    return (
      <El
        ref={ref as any}
        value={tmp}
        onChange={(e: any) => setTmp(e.target.value)}
        onBlur={confirm}
        onKeyDown={(e: any) => {
          if (!multiline && e.key === 'Enter') confirm()
          if (e.key === 'Escape') setEditing(false)
        }}
        placeholder={placeholder}
        className={cn(
          'rounded px-1.5 py-0.5 outline-none min-w-[100px]',
          multiline && 'resize-y min-h-[40px] w-full',
          !multiline && 'w-full',
        )}
        style={{ border: `1px solid ${accentColor}`, fontSize: 'inherit', fontFamily: 'inherit', fontWeight: 'inherit', backgroundColor: inputBg }}
        rows={multiline ? 2 : undefined}
      />
    )
  }

  return (
    <span
      onClick={start}
      className={cn(
        'cursor-pointer border-b border-dashed inline-block min-w-[30px] min-h-[16px] transition-colors',
        className,
      )}
      style={{ borderBottomColor: borderDashed }}
      onMouseEnter={(e) => ((e.target as HTMLElement).style.borderBottomColor = accentColor)}
      onMouseLeave={(e) => ((e.target as HTMLElement).style.borderBottomColor = borderDashed)}
      title={titleText || 'Click to edit'}
    >
      {value || <span style={{ color: borderDashed }} className="italic">{placeholder || '...'}</span>}
    </span>
  )
}

/* ═══════════════════════════════════════════════════════════
   InlineNumber — click-to-edit number
   ═══════════════════════════════════════════════════════════ */

function InlineNumber({
  value, onChange, preview = false, className, min = 0, step = 1, accentColor = '#6366f1',
  inputBg = '#ffffff', borderDashed = '#ddd', titleText,
}: {
  value: number
  onChange: (v: number) => void
  preview?: boolean
  className?: string
  min?: number
  step?: number
  accentColor?: string
  inputBg?: string
  borderDashed?: string
  titleText?: string
}) {
  const [editing, setEditing] = useState(false)
  const [tmp, setTmp] = useState(String(value))
  const ref = useRef<HTMLInputElement>(null)

  const start = () => {
    if (preview) return
    setTmp(String(value))
    setEditing(true)
    setTimeout(() => ref.current?.focus(), 10)
  }
  const confirm = () => { const n = parseFloat(tmp); onChange(isNaN(n) ? 0 : n); setEditing(false) }

  if (preview) return <span className={className}>{typeof value === 'number' ? value : '0'}</span>

  if (editing) {
    return (
      <input
        ref={ref}
        type="number"
        value={tmp}
        onChange={(e) => setTmp(e.target.value)}
        onBlur={confirm}
        onKeyDown={(e) => {
          if (e.key === 'Enter') confirm()
          if (e.key === 'Escape') setEditing(false)
        }}
        min={min}
        step={step}
        className={cn(
          'rounded px-1.5 py-0.5 outline-none w-full [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
          className,
        )}
        style={{ border: `1px solid ${accentColor}`, fontSize: 'inherit', fontFamily: 'inherit', backgroundColor: inputBg }}
      />
    )
  }

  return (
    <span
      onClick={start}
      className={cn(
        'cursor-pointer border-b border-dashed inline-block min-w-[30px] transition-colors',
        className,
      )}
      style={{ borderBottomColor: borderDashed }}
      onMouseEnter={(e) => ((e.target as HTMLElement).style.borderBottomColor = accentColor)}
      onMouseLeave={(e) => ((e.target as HTMLElement).style.borderBottomColor = borderDashed)}
      title={titleText || 'Click to edit'}
    >
      {typeof value === 'number' ? value : '0'}
    </span>
  )
}

/* ═══════════════════════════════════════════════════════════
   ClientModal — animated modal for client selection
   ═══════════════════════════════════════════════════════════ */

export function ClientModal({
  open, onClose, onSelect,
}: {
  open: boolean
  onClose: () => void
  onSelect: (client: ClientInfo) => void
}) {
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<ClientInfo[]>([])
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const loadClients = useCallback(async (query: string) => {
    setLoading(true)
    const { data } = await api.get<{ clients: ClientInfo[] }>(
      `/clients${query ? `?search=${encodeURIComponent(query)}` : ''}`,
    )
    if (data?.clients) setResults(data.clients)
    setLoading(false)
  }, [])

  useEffect(() => {
    if (open) { setSearch(''); loadClients('') }
  }, [open, loadClients])

  useEffect(() => {
    if (!open) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => loadClients(search), 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [search, open, loadClients])

  return (
    <Dialog open={open} onClose={onClose} className="max-w-lg">
      <div className="flex items-center justify-between mb-4">
        <DialogTitle>Selectionner un client</DialogTitle>
        <Button variant="ghost" size="icon" onClick={() => loadClients(search)} title="Rafraichir">
          <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
        </Button>
      </div>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Rechercher par nom, email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" autoFocus />
      </div>
      <div className="max-h-[320px] overflow-y-auto -mx-2">
        {loading ? (
          <div className="flex items-center justify-center py-10"><Spinner /></div>
        ) : results.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-10">{search ? 'Aucun client trouve' : 'Aucun client'}</p>
        ) : (
          results.map((c) => (
            <button key={c.id} onClick={() => { onSelect(c); onClose() }}
              className="w-full flex items-center gap-3 rounded-lg p-3 hover:bg-muted/50 transition-colors text-left">
              <div className={cn('h-9 w-9 rounded-lg flex items-center justify-center shrink-0', c.type === 'company' ? 'bg-blue-500/10' : 'bg-green-500/10')}>
                {c.type === 'company' ? <Building2 className="h-4 w-4 text-blue-500" /> : <UserRound className="h-4 w-4 text-green-500" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-foreground truncate">{c.displayName}</p>
                  <Badge variant="muted" className="text-[10px] shrink-0">{c.type === 'company' ? 'Pro' : 'Part.'}</Badge>
                </div>
                {c.email && <p className="text-xs text-muted-foreground truncate">{c.email}</p>}
                {(c.postalCode || c.city) && <p className="text-xs text-muted-foreground truncate">{c.postalCode} {c.city}</p>}
              </div>
            </button>
          ))
        )}
      </div>
    </Dialog>
  )
}

/* ═══════════════════════════════════════════════════════════
   AddLineDropdown — single button with dropdown menu
   ═══════════════════════════════════════════════════════════ */

function AddLineDropdown({
  isTiime, accentColor, T, t, onAddLine,
}: {
  isTiime: boolean
  accentColor: string
  T: any
  t: any
  onAddLine: (type: 'standard' | 'section') => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div className="relative mb-4" ref={ref}>
      {isTiime ? (
        <button
          onClick={() => setOpen(!open)}
          className="px-4 py-1.5 rounded-full text-[14px] font-extrabold cursor-pointer transition-all flex items-center gap-2"
          style={{
            border: 'none',
            background: T.docBg,
            color: '#29a557',
            boxShadow: 'rgba(71,99,136,0.25) 0px 0px 6px',
            letterSpacing: '0.5px',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.boxShadow = 'rgba(71,99,136,0.4) 0px 0px 10px')}
          onMouseLeave={(e) => (e.currentTarget.style.boxShadow = 'rgba(71,99,136,0.25) 0px 0px 6px')}
        >
          <Plus className="h-4 w-4" /> {t.addLine}
        </button>
      ) : (
        <button
          onClick={() => setOpen(!open)}
          className="px-3.5 py-1.5 rounded-full text-[11px] font-medium cursor-pointer transition-all flex items-center gap-1.5"
          style={{ border: `1px dashed ${accentColor}88`, background: `${accentColor}08`, color: accentColor }}
          onMouseEnter={(e) => (e.currentTarget.style.background = `${accentColor}18`)}
          onMouseLeave={(e) => (e.currentTarget.style.background = `${accentColor}08`)}
        >
          <Plus className="h-3 w-3" /> {t.addLine}
        </button>
      )}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 top-full mt-1 z-10 rounded-lg overflow-hidden"
            style={{
              backgroundColor: T.docBg,
              border: `1px solid ${T.borderLight}`,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              minWidth: '150px',
            }}
          >
            <button
              onClick={() => { onAddLine('standard'); setOpen(false) }}
              className="w-full flex items-center gap-2 px-3 py-2 text-[12px] transition-colors"
              style={{ color: T.text }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = `${accentColor}10`)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <Plus className="h-3 w-3" /> Ligne simple
            </button>
            <button
              onClick={() => { onAddLine('section'); setOpen(false) }}
              className="w-full flex items-center gap-2 px-3 py-2 text-[12px] transition-colors"
              style={{ color: T.text }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = `${accentColor}10`)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <Type className="h-3 w-3" /> Section
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   A4Sheet — main document component
   ═══════════════════════════════════════════════════════════ */

interface A4SheetProps {
  mode: 'edit' | 'preview'
  logoUrl: string | null
  accentColor: string
  documentTitle: string
  quoteNumber: string
  onQuoteNumberChange: (v: string) => void
  issueDate: string
  validityDate: string
  billingType: 'quick' | 'detailed'
  company: CompanyInfo | null
  onCompanyFieldChange: (field: keyof CompanyInfo, value: string) => void
  client: ClientInfo | null
  onClientClick: () => void
  onClearClient: () => void
  onClientFieldChange: (field: keyof ClientInfo, value: string) => void
  lines: QuoteLine[]
  onUpdateLine: (index: number, partial: Partial<QuoteLine>) => void
  onAddLine: (type: 'standard' | 'section') => void
  onRemoveLine: (index: number) => void
  subtotal: number
  taxAmount: number
  discountAmount: number
  total: number
  tvaBreakdown: { rate: number; base: number; amount: number }[]
  notes: string
  onNotesChange: (notes: string) => void
  acceptanceConditions: string
  signatureField: boolean
  freeField: string
  deliveryAddress: string
  showDeliveryAddress: boolean
  clientSiren: string
  showClientSiren: boolean
  clientVatNumber: string
  showClientVatNumber: boolean
  paymentMethods: string[]
  customPaymentMethod: string
  subject: string
  onSubjectChange: (v: string) => void
  template?: string
  darkMode?: boolean
  language?: string
  showNotes?: boolean
  vatExempt?: boolean
  footerText?: string
  documentFont?: string
  showSubject?: boolean
  showAcceptanceConditions?: boolean
  showFreeField?: boolean
  showFooterText?: boolean
  onAcceptanceConditionsChange?: (v: string) => void
  onFreeFieldChange?: (v: string) => void
  onFooterTextChange?: (v: string) => void
  onDeliveryAddressChange?: (v: string) => void
  onIssueDateChange?: (d: string) => void
  onValidityDateChange?: (d: string) => void
}

export function A4Sheet({
  mode, logoUrl, accentColor, documentTitle, quoteNumber, onQuoteNumberChange,
  issueDate, validityDate,
  billingType, company, onCompanyFieldChange, client, onClientClick, onClearClient, onClientFieldChange,
  lines, onUpdateLine, onAddLine, onRemoveLine,
  subtotal, taxAmount, discountAmount, total, tvaBreakdown,
  notes, onNotesChange, acceptanceConditions, signatureField, freeField,
  deliveryAddress, showDeliveryAddress, clientSiren, showClientSiren,
  clientVatNumber, showClientVatNumber, paymentMethods, customPaymentMethod,
  subject, onSubjectChange, template, darkMode, language,
  showNotes = true, vatExempt = false, footerText, documentFont = 'Lexend',
  showSubject = true, showAcceptanceConditions = false, showFreeField = false, showFooterText = false,
  onAcceptanceConditionsChange, onFreeFieldChange, onFooterTextChange, onDeliveryAddressChange,
  onIssueDateChange, onValidityDateChange,
}: A4SheetProps) {
  const isPreview = mode === 'preview'
  const ed = !isPreview // shorthand: is editable?
  const lang = language || 'fr'

  const T = getTemplate(template, darkMode)
  const t = getTranslations(lang)
  const isTiime = T.id === 'tiime'
  // Template font override takes precedence
  const effectiveFont = T.font || documentFont

  // Dynamically load document font from Google Fonts
  useEffect(() => {
    if (!effectiveFont || effectiveFont === 'Lexend') return // Lexend already loaded via next/font
    const id = `gfont-${effectiveFont.replace(/\s/g, '-')}`
    if (document.getElementById(id)) return
    const link = document.createElement('link')
    link.id = id
    link.rel = 'stylesheet'
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(effectiveFont)}:wght@300;400;500;600;700;800&display=swap`
    document.head.appendChild(link)
  }, [effectiveFont])

  const gridCols = billingType === 'detailed'
    ? 'minmax(180px, 1fr) 60px 60px 90px 55px 90px 32px'
    : 'minmax(200px, 1fr) 100px 32px'

  const gridColsPreview = billingType === 'detailed'
    ? 'minmax(180px, 1fr) 60px 60px 90px 55px 90px'
    : 'minmax(200px, 1fr) 100px'

  const cols = isPreview ? gridColsPreview : gridCols

  /* helper to shorten InlineEdit props */
  const ie = (v: string, onChange: (s: string) => void, cls?: string, ph?: string) => (
    <InlineEdit value={v} onChange={onChange} preview={isPreview} accentColor={accentColor}
      inputBg={T.inputBg} borderDashed={T.editBorderDashed} className={cls} placeholder={ph}
      titleText={t.clickToEdit} />
  )

  return (
    <div className="flex justify-center">
      {/* ── A4 Container (strict ratio 210×297mm) ── */}
      <div
        className="w-full max-w-[794px] rounded-xl relative overflow-hidden"
        style={{
          aspectRatio: '210 / 297',
          backgroundColor: T.docBg,
          background: isTiime
            ? 'linear-gradient(270deg, #fafafa, #fff 23.44%, #fff 77.6%, #fafafa)'
            : undefined,
          boxShadow: isTiime
            ? 'rgba(71,99,136,0.1) 0px 20px 40px -5px'
            : '0 4px 24px rgba(0,0,0,0.15), 0 1px 4px rgba(0,0,0,0.08)',
        }}
      >
        {/* Scrollable content — flex column so bottom sticks */}
        <div className="absolute inset-0 overflow-y-auto">
          <div
            className="flex flex-col min-h-full px-10 py-8"
            style={{ fontFamily: `'${effectiveFont}', 'Segoe UI', sans-serif`, color: T.text, letterSpacing: isTiime ? '0.5px' : undefined }}
          >

            {/* ═══════════════════════════════════════════
                 TOP SECTION — grows with content
                ═══════════════════════════════════════════ */}
            <div className="flex-1">

              {/* ── Banner header for 'banner' layout templates ── */}
              {T.layout === 'banner' && (
                <div
                  className="rounded-xl px-6 py-4 mb-6 -mx-4 -mt-2"
                  style={{ backgroundColor: accentColor }}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      {logoUrl ? (
                        <img src={logoUrl} alt="Logo" className="h-12 w-auto max-w-[100px] object-contain mb-1" />
                      ) : (
                        <div className="text-[18px] font-bold" style={{ color: contrastText(accentColor) }}>
                          {company?.legalName || t.society}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-[18px] font-bold uppercase tracking-[2px]" style={{ color: contrastText(accentColor) }}>
                        {documentTitle || t.quote}
                      </div>
                      <div className="text-[11px] mt-0.5" style={{ color: contrastText(accentColor), opacity: 0.8 }}>
                        {t.quoteNumber} {quoteNumber}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Header: Company + Devis badge (standard/lateral) ── */}
              {T.layout !== 'banner' && (
                <div className="flex justify-between items-start mb-5">
                  {/* Left: Logo + Company (all editable) */}
                  <div className="max-w-[55%]">
                    {logoUrl ? (
                      <img src={logoUrl} alt="Logo" className="h-14 w-auto max-w-[110px] object-contain mb-2" />
                    ) : (
                      <div
                        className="w-16 h-16 flex items-center justify-center mb-2 border-2 border-dashed"
                        style={{
                          background: `${accentColor}15`,
                          borderColor: `${accentColor}66`,
                          borderRadius: T.borderRadius,
                        }}
                      >
                        <span className="text-[10px] font-medium" style={{ color: accentColor }}>Logo</span>
                      </div>
                    )}
                    {company && (
                      <div className="text-[12px] leading-[1.6]" style={{ color: T.textMuted }}>
                        <div>{ie(company.legalName, (v) => onCompanyFieldChange('legalName', v), `font-semibold text-[13px]`, t.society)}</div>
                        <div>{ie(company.addressLine1 || '', (v) => onCompanyFieldChange('addressLine1', v), 'text-[12px]', t.address)}</div>
                        <div>
                          {ie(company.postalCode || '', (v) => onCompanyFieldChange('postalCode', v), 'text-[12px]', t.postalCode)}{' '}
                          {ie(company.city || '', (v) => onCompanyFieldChange('city', v), 'text-[12px]', t.city)}
                        </div>
                        <div>{ie(company.phone || '', (v) => onCompanyFieldChange('phone', v), 'text-[12px]', t.phone)}</div>
                        <div>{ie(company.email || '', (v) => onCompanyFieldChange('email', v), 'text-[12px]', t.email)}</div>
                        <div className="text-[10px] mt-0.5">
                          SIREN : {ie(company.siren || '', (v) => onCompanyFieldChange('siren', v), 'text-[10px]', '000000000')}
                        </div>
                        <div className="text-[10px]">
                          {lang === 'en' ? 'VAT No.' : 'N\u00b0 TVA'} : {ie(company.vatNumber || '', (v) => onCompanyFieldChange('vatNumber', v), 'text-[10px]', 'FR00000000000')}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right: DEVIS badge + quote number */}
                  <div className="text-right">
                    {isTiime ? (
                      <>
                        <div className="text-[14px] font-semibold mb-1" style={{ color: T.text }}>
                          {documentTitle || t.quote}
                        </div>
                        <div className="text-[12px] leading-[1.8]" style={{ color: T.textMuted }}>
                          {t.quoteNumber} {ie(quoteNumber, onQuoteNumberChange, 'font-semibold', 'D-0001')}
                        </div>
                      </>
                    ) : (
                      <>
                        <div
                          className="inline-block px-5 py-2.5 mb-2"
                          style={{
                            background: `${accentColor}12`,
                            border: `1px solid ${accentColor}33`,
                            borderRadius: T.borderRadius,
                          }}
                        >
                          <div className="flex items-center gap-2 justify-center">
                            <FileText className="h-5 w-5" style={{ color: accentColor }} />
                            <span className="text-[20px] font-bold uppercase tracking-[2px]" style={{ color: accentColor }}>
                              {documentTitle || t.quote}
                            </span>
                          </div>
                        </div>
                        <div className="text-[12px] leading-[1.8]" style={{ color: T.textMuted }}>
                          <div>
                            {t.quoteNumber} {ie(quoteNumber, onQuoteNumberChange, `font-semibold`, 'D-0001')}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* ── Company info under banner header (editable) ── */}
              {T.layout === 'banner' && company && (
                <div className="flex justify-between items-start mb-5">
                  <div className="text-[12px] leading-[1.6]" style={{ color: T.textMuted }}>
                    <div>{ie(company.legalName, (v) => onCompanyFieldChange('legalName', v), `font-semibold text-[13px]`, t.society)}</div>
                    <div>{ie(company.addressLine1 || '', (v) => onCompanyFieldChange('addressLine1', v), 'text-[12px]', t.address)}</div>
                    <div>
                      {ie(company.postalCode || '', (v) => onCompanyFieldChange('postalCode', v), 'text-[12px]', t.postalCode)}{' '}
                      {ie(company.city || '', (v) => onCompanyFieldChange('city', v), 'text-[12px]', t.city)}
                    </div>
                    <div>{ie(company.phone || '', (v) => onCompanyFieldChange('phone', v), 'text-[12px]', t.phone)}</div>
                    <div>{ie(company.email || '', (v) => onCompanyFieldChange('email', v), 'text-[12px]', t.email)}</div>
                  </div>
                  <div className="text-[12px] text-right leading-[1.8]" style={{ color: T.textMuted }}>
                    <div>
                      {t.quoteNumber} {ie(quoteNumber, onQuoteNumberChange, `font-semibold`, 'D-0001')}
                    </div>
                    <div className="text-[10px] mt-0.5">
                      SIREN : {ie(company.siren || '', (v) => onCompanyFieldChange('siren', v), 'text-[10px]', '000000000')}
                    </div>
                    <div className="text-[10px]">
                      {lang === 'en' ? 'VAT No.' : 'N\u00b0 TVA'} : {ie(company.vatNumber || '', (v) => onCompanyFieldChange('vatNumber', v), 'text-[10px]', 'FR00000000000')}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Subject (inline editable) ── */}
              {showSubject && (
                isTiime ? (
                  <div className="mb-4">
                    <div
                      style={{
                        border: `1px dashed ${T.editBorderDashed}`,
                        background: T.docBg,
                        padding: '7px',
                      }}
                    >
                      <div style={{ color: accentColor }}>
                        {ie(subject, onSubjectChange, 'text-[16px] font-extrabold tracking-wide', lang === 'en' ? 'Quote title' : 'Intitule du devis')}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mb-4 text-[13px]" style={{ color: T.textMuted }}>
                    <span className="font-semibold" style={{ color: T.text }}>{t.subject} : </span>
                    {ie(subject, onSubjectChange, 'text-[13px]', lang === 'en' ? 'e.g. Website development' : 'Ex: Developpement site web')}
                  </div>
                )
              )}

              {/* ── Client Block (right-aligned, inline editable fields) ── */}
              <div className="flex justify-end mb-5">
                <div className="relative w-full max-w-[50%] group">
                  <div className="text-[12px] leading-[1.5] space-y-[3px]">
                    {/* Name — click opens client search */}
                    {ed ? (
                      <div
                        className="font-semibold text-[13px] cursor-pointer border-b border-dashed transition-colors"
                        style={{ color: client?.displayName ? T.text : T.inputPlaceholder, borderBottomColor: T.editBorderDashed }}
                        onClick={onClientClick}
                        onMouseEnter={(e) => (e.currentTarget.style.borderBottomColor = accentColor)}
                        onMouseLeave={(e) => (e.currentTarget.style.borderBottomColor = T.editBorderDashed)}
                        title={t.clickToSelectClient}
                      >
                        <div className="flex items-center gap-1.5">
                          <Search className="h-3 w-3 shrink-0" style={{ color: T.inputPlaceholder }} />
                          {client?.displayName || (lang === 'en' ? 'Client name' : 'Nom du client')}
                        </div>
                      </div>
                    ) : (
                      <div className="font-semibold text-[13px]" style={{ color: T.text }}>
                        {client?.displayName || ''}
                      </div>
                    )}
                    {/* Address */}
                    <div>{ie(client?.address || '', (v) => onClientFieldChange('address', v), 'text-[12px]', lang === 'en' ? 'Address' : 'Adresse postale')}</div>
                    {/* Address complement */}
                    <div>{ie(client?.addressComplement || '', (v) => onClientFieldChange('addressComplement', v), 'text-[12px]', lang === 'en' ? 'Address line 2' : "Complement d'adresse")}</div>
                    {/* Postal code + City */}
                    <div className="flex gap-2">
                      {ie(client?.postalCode || '', (v) => onClientFieldChange('postalCode', v), 'text-[12px]', lang === 'en' ? 'Zip' : 'Code postal')}
                      {ie(client?.city || '', (v) => onClientFieldChange('city', v), 'text-[12px]', lang === 'en' ? 'City' : 'Ville')}
                    </div>
                    {/* Country */}
                    <div>{ie(client?.country || '', (v) => onClientFieldChange('country', v), 'text-[12px]', lang === 'en' ? 'Country' : 'Pays')}</div>

                    {showClientSiren && (
                      <div className="text-[10px] mt-0.5" style={{ color: T.textMuted }}>
                        SIREN : {ie(clientSiren || '', () => {}, 'text-[10px]', '000000000')}
                      </div>
                    )}

                    {showClientVatNumber && (
                      <div className="text-[10px]" style={{ color: T.textMuted }}>
                        {lang === 'en' ? 'VAT No.' : 'N\u00b0 TVA'} : {ie(clientVatNumber || '', () => {}, 'text-[10px]', 'FR00000000000')}
                      </div>
                    )}

                    {/* ── Delivery address ── */}
                    {showDeliveryAddress && (
                      <div className="mt-2 pt-2" style={{ borderTop: `1px solid ${T.borderLight}` }}>
                        <div className="text-[9px] uppercase tracking-[1px] font-semibold mb-0.5" style={{ color: T.textMuted }}>
                          {t.deliveryAddress}
                        </div>
                        {ed ? (
                          <textarea
                            value={deliveryAddress}
                            onChange={(e) => onDeliveryAddressChange?.(e.target.value)}
                            placeholder={lang === 'en' ? 'Delivery address...' : 'Adresse de livraison...'}
                            className="w-full bg-transparent text-[12px] leading-[1.5] focus:outline-none resize-y min-h-[24px]"
                            style={{ color: T.textMuted }}
                            rows={2}
                          />
                        ) : (
                          deliveryAddress && <div className="text-[12px] whitespace-pre-line" style={{ color: T.textMuted }}>{deliveryAddress}</div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Clear client button */}
                  {ed && client && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onClearClient() }}
                      className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ color: T.textMuted }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#e53935')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = T.textMuted)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* ── Date/Validity container (above lines table) ── */}
              {(issueDate || validityDate || ed) && (
                isTiime ? (
                  <div className="flex items-end gap-3 mb-4">
                    <div className="flex-1 text-[14px] font-semibold" style={{ color: T.text, padding: '8px' }}>
                      {documentTitle || t.quote}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[12px] mb-0.5" style={{ color: T.textMuted, letterSpacing: '0.4px' }}>{t.date}</span>
                      {ed ? (
                        <input
                          type="date"
                          value={issueDate}
                          onChange={(e) => onIssueDateChange?.(e.target.value)}
                          className="text-[14px] bg-transparent outline-none cursor-pointer"
                          style={{
                            border: `1px solid ${T.editBorderDashed}`,
                            borderRadius: '6px',
                            height: '36px',
                            minWidth: '140px',
                            padding: '0 10px',
                            color: T.text,
                            fontFamily: 'inherit',
                          }}
                        />
                      ) : (
                        <div
                          className="flex items-center px-2.5 text-[14px]"
                          style={{
                            border: `1px solid ${T.editBorderDashed}`,
                            borderRadius: '6px',
                            height: '36px',
                            minWidth: '140px',
                            background: T.docBg,
                            color: T.text,
                          }}
                        >
                          {fmtDate(issueDate, lang)}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[12px] mb-0.5" style={{ color: T.textMuted, letterSpacing: '0.4px' }}>{t.validity}</span>
                      {ed ? (
                        <input
                          type="date"
                          value={validityDate}
                          onChange={(e) => onValidityDateChange?.(e.target.value)}
                          className="text-[14px] bg-transparent outline-none cursor-pointer"
                          style={{
                            border: `1px dashed ${T.editBorderDashed}`,
                            borderRadius: '6px',
                            height: '36px',
                            minWidth: '140px',
                            padding: '0 10px',
                            color: T.text,
                            fontFamily: 'inherit',
                          }}
                        />
                      ) : (
                        validityDate && (
                          <div
                            className="flex items-center px-2 text-[14px]"
                            style={{
                              border: `1px dashed ${T.editBorderDashed}`,
                              background: T.docBg,
                              padding: '7px',
                              color: T.text,
                            }}
                          >
                            <span className="font-medium">{fmtDate(validityDate, lang)}</span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-4 mb-4 px-3 py-2.5" style={{ backgroundColor: `${accentColor}08`, border: `1px solid ${accentColor}20`, borderRadius: T.borderRadius }}>
                    <div className="text-[11px]" style={{ color: T.textMuted }}>
                      <span className="font-semibold" style={{ color: T.text }}>{t.date} :</span>{' '}
                      {ed ? (
                        <input
                          type="date"
                          value={issueDate}
                          onChange={(e) => onIssueDateChange?.(e.target.value)}
                          className="bg-transparent outline-none cursor-pointer text-[11px] font-medium"
                          style={{ color: T.textMuted, fontFamily: 'inherit' }}
                        />
                      ) : (
                        <span className="font-medium">{fmtDate(issueDate, lang)}</span>
                      )}
                    </div>
                    <div className="text-[11px]" style={{ color: T.textMuted }}>
                      <span className="font-semibold" style={{ color: T.text }}>{t.validity} :</span>{' '}
                      {ed ? (
                        <input
                          type="date"
                          value={validityDate}
                          onChange={(e) => onValidityDateChange?.(e.target.value)}
                          className="bg-transparent outline-none cursor-pointer text-[11px] font-medium"
                          style={{ color: T.textMuted, fontFamily: 'inherit' }}
                        />
                      ) : (
                        <span className="font-medium">{fmtDate(validityDate, lang)}</span>
                      )}
                    </div>
                  </div>
                )
              )}

              {/* ── Lines Table ── */}
              <div className="mb-3">
                {/* Header */}
                <div className="overflow-hidden" style={{ display: 'grid', gridTemplateColumns: cols, borderTopLeftRadius: T.borderRadius, borderTopRightRadius: T.borderRadius }}>
                  <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.5px]"
                    style={{ backgroundColor: accentColor, color: contrastText(accentColor) }}>{t.designation}</div>
                  {billingType === 'detailed' && (<>
                    <div className="px-1.5 py-2 text-[10px] font-semibold text-center" style={{ backgroundColor: accentColor, color: contrastText(accentColor) }}>{t.qty}</div>
                    <div className="px-1.5 py-2 text-[10px] font-semibold text-center" style={{ backgroundColor: accentColor, color: contrastText(accentColor) }}>{t.unit}</div>
                    <div className="px-1.5 py-2 text-[10px] font-semibold text-right" style={{ backgroundColor: accentColor, color: contrastText(accentColor) }}>{t.unitPriceHT}</div>
                    <div className="px-1.5 py-2 text-[10px] font-semibold text-center" style={{ backgroundColor: accentColor, color: contrastText(accentColor) }}>{t.vat}</div>
                  </>)}
                  <div className="px-3 py-2 text-[10px] font-semibold text-right" style={{ backgroundColor: accentColor, color: contrastText(accentColor) }}>{t.amountHT}</div>
                  {ed && <div className="py-2" style={{ backgroundColor: accentColor }} />}
                </div>

                {/* Rows */}
                {lines.map((line, idx) => {
                  const isSection = line.type === 'section'
                  const ht = isSection ? 0 : (billingType === 'quick' ? line.unitPrice : line.quantity * line.unitPrice)
                  const rowBg = idx % 2 === 0 ? T.rowEven : T.rowOdd

                  return (
                    <div
                      key={line.id}
                      className={cn('items-center', ed && 'group')}
                      style={{ display: 'grid', gridTemplateColumns: cols, backgroundColor: rowBg, borderBottom: `1px solid ${T.borderLight}`, transition: 'background-color 0.15s' }}
                      onMouseEnter={ed ? (e) => (e.currentTarget.style.backgroundColor = `${accentColor}${T.rowHover}`) : undefined}
                      onMouseLeave={ed ? (e) => (e.currentTarget.style.backgroundColor = rowBg) : undefined}
                    >
                      <div className="px-3 py-2">
                        {isPreview ? (
                          <span className={cn('text-[12px]', isSection ? 'font-bold' : '')}>{line.description || '-'}</span>
                        ) : (
                          <input type="text" value={line.description}
                            onChange={(e) => onUpdateLine(idx, { description: e.target.value })}
                            placeholder={isSection ? t.sectionTitle : t.description}
                            className={cn('w-full bg-transparent text-[12px] focus:outline-none', isSection && 'font-bold')}
                            style={{ color: T.text, '--tw-placeholder-color': T.inputPlaceholder } as React.CSSProperties}
                          />
                        )}
                      </div>

                      {!isSection && billingType === 'detailed' && (<>
                        <div className="px-1.5 py-2 text-center">
                          {isPreview ? <span className="text-[12px]">{line.quantity}</span>
                            : <input type="number" min="0" step="1" value={line.quantity}
                                onChange={(e) => onUpdateLine(idx, { quantity: parseFloat(e.target.value) || 0 })}
                                className="w-full bg-transparent text-[12px] text-center focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                                style={{ color: T.text }} />}
                        </div>
                        <div className="px-1.5 py-2 text-center">
                          {isPreview ? <span className="text-[11px]" style={{ color: T.textMuted }}>{line.unit || '-'}</span>
                            : <input type="text" value={line.unit} placeholder={t.unit}
                                onChange={(e) => onUpdateLine(idx, { unit: e.target.value })}
                                className="w-full bg-transparent text-[11px] text-center focus:outline-none"
                                style={{ color: T.textMuted }} />}
                        </div>
                        <div className="px-1.5 py-2 text-right">
                          {isPreview ? <span className="text-[12px]">{fmtCurrency(line.unitPrice, lang)}</span>
                            : <input type="number" min="0" step="0.01" value={line.unitPrice}
                                onChange={(e) => onUpdateLine(idx, { unitPrice: parseFloat(e.target.value) || 0 })}
                                className="w-full bg-transparent text-[12px] text-right focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                                style={{ color: T.text }} />}
                        </div>
                        <div className="px-1.5 py-2 text-center">
                          {isPreview ? <span className="text-[11px]" style={{ color: T.textMuted }}>{line.vatRate}%</span>
                            : <select value={line.vatRate} onChange={(e) => onUpdateLine(idx, { vatRate: parseFloat(e.target.value) })}
                                className="w-full text-[10px] rounded py-0.5 px-0.5 outline-none cursor-pointer"
                                style={{ border: `1px solid ${T.borderLight}`, backgroundColor: T.inputBg, color: T.text }}>
                                <option value="20">20%</option><option value="10">10%</option><option value="5.5">5,5%</option><option value="0">0%</option>
                              </select>}
                        </div>
                      </>)}

                      {isSection && billingType === 'detailed' && (<><div /><div /><div /><div /></>)}

                      {!isSection ? (
                        <div className="px-3 py-2 text-right text-[12px] font-semibold" style={{ color: T.text }}>
                          {billingType === 'quick' && ed ? (
                            <input type="number" min="0" step="0.01" value={line.unitPrice}
                              onChange={(e) => onUpdateLine(idx, { unitPrice: parseFloat(e.target.value) || 0 })}
                              className="w-full bg-transparent text-[12px] text-right font-semibold focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                              style={{ color: T.text }} />
                          ) : fmtCurrency(ht, lang)}
                        </div>
                      ) : <div />}

                      {ed && (
                        <div className="px-0.5 py-2 text-center">
                          {lines.length > 1 && (
                            <button onClick={() => onRemoveLine(idx)}
                              className="w-5 h-5 rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                              style={{ color: T.inputPlaceholder }}
                              onMouseEnter={(e) => { e.currentTarget.style.color = '#e53935'; e.currentTarget.style.backgroundColor = darkMode ? '#3f3f46' : '#fef2f2' }}
                              onMouseLeave={(e) => { e.currentTarget.style.color = T.inputPlaceholder; e.currentTarget.style.backgroundColor = 'transparent' }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* ── Add line dropdown (edit mode) ── */}
              {ed && <AddLineDropdown isTiime={isTiime} accentColor={accentColor} T={T} t={t} onAddLine={onAddLine} />}

            </div>
            {/* ═══ END TOP SECTION ═══ */}

            {/* ═══════════════════════════════════════════
                 BOTTOM SECTION — always sticks to bottom
                ═══════════════════════════════════════════ */}
            <div>

              {/* ── Totals ── */}
              <div className="flex justify-end mb-5">
                {isTiime ? (
                  <div className="w-[280px] flex flex-col gap-5" style={{ color: accentColor }}>
                    <div className="px-2 flex flex-col gap-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[14px] font-semibold">{t.totalHT}</span>
                        <span className="text-[14px] font-semibold">{fmtCurrency(subtotal, lang)}</span>
                      </div>
                      {tvaBreakdown.map((e) => (
                        <div key={e.rate} className="flex justify-between items-center">
                          <span className="text-[12px] font-semibold">{t.vatRate(e.rate)}</span>
                          <span className="text-[12px] font-semibold">{fmtCurrency(e.amount, lang)}</span>
                        </div>
                      ))}
                      {discountAmount > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-[12px] font-semibold">{t.discount}</span>
                          <span className="text-[12px] font-semibold">-{fmtCurrency(discountAmount, lang)}</span>
                        </div>
                      )}
                    </div>
                    <div className="px-2 flex justify-between items-center">
                      <span className="text-[20px] font-extrabold tracking-wide">{billingType === 'detailed' ? t.totalTTC : t.totalHT}</span>
                      <span
                        className="text-[20px] font-extrabold tracking-wide py-1 px-3"
                        style={{ borderRadius: 100, background: `${accentColor}15` }}
                      >
                        {fmtCurrency(total, lang)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="w-[260px]">
                    <div className="flex justify-between py-1.5" style={{ borderBottom: `1px solid ${T.borderLight}` }}>
                      <span className="text-[12px]" style={{ color: T.textMuted }}>{t.totalHT}</span>
                      <span className="text-[12px] font-semibold" style={{ color: T.text }}>{fmtCurrency(subtotal, lang)}</span>
                    </div>
                    {tvaBreakdown.map((e) => (
                      <div key={e.rate} className="flex justify-between py-1" style={{ borderBottom: `1px solid ${T.borderLight}` }}>
                        <span className="text-[10px]" style={{ color: T.textMuted }}>{t.vatRate(e.rate)} {t.vatBase(fmtCurrency(e.base, lang))}</span>
                        <span className="text-[10px]" style={{ color: T.textMuted }}>{fmtCurrency(e.amount, lang)}</span>
                      </div>
                    ))}
                    {discountAmount > 0 && (
                      <div className="flex justify-between py-1" style={{ borderBottom: `1px solid ${T.borderLight}` }}>
                        <span className="text-[10px]" style={{ color: T.textMuted }}>{t.discount}</span>
                        <span className="text-[10px] text-[#e53935]">-{fmtCurrency(discountAmount, lang)}</span>
                      </div>
                    )}
                    <div className="flex justify-between px-3.5 py-2.5 mt-1.5"
                      style={{
                        background: `${accentColor}${T.totalBg}`,
                        border: `1px solid ${accentColor}${T.totalBorder}`,
                        borderRadius: T.borderRadius,
                      }}>
                      <span className="text-[13px] font-bold" style={{ color: T.text }}>{billingType === 'detailed' ? t.totalTTC : t.totalHT}</span>
                      <span className="text-[15px] font-bold" style={{ color: accentColor }}>{fmtCurrency(total, lang)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* ── VAT exempt mention ── */}
              {vatExempt && (
                <div className="mb-3 text-[10px] italic" style={{ color: T.textMuted }}>
                  {lang === 'en'
                    ? 'VAT not applicable, article 293 B of the CGI'
                    : 'TVA non applicable, article 293 B du CGI'}
                </div>
              )}

              {/* ── Notes (editable, optional) ── */}
              {showNotes && (
                <div className="pt-3" style={{ borderTop: `1px solid ${T.borderLight}` }}>
                  <div className="text-[9px] uppercase tracking-[1px] font-semibold mb-1" style={{ color: T.textMuted }}>{t.conditionsAndNotes}</div>
                  {isPreview ? (
                    <p className="text-[11px] whitespace-pre-line leading-[1.6]" style={{ color: T.textMuted }}>
                      {notes || <span className="italic" style={{ color: T.inputPlaceholder }}>{t.noNotes}</span>}
                    </p>
                  ) : (
                    <textarea value={notes} onChange={(e) => onNotesChange(e.target.value)}
                      placeholder={t.conditionsAndNotes}
                      className="w-full bg-transparent text-[11px] leading-[1.6] focus:outline-none resize-y min-h-[30px]"
                      style={{ color: T.textMuted }}
                      rows={2} />
                  )}
                </div>
              )}

              {showAcceptanceConditions && (
                <div className="mt-2">
                  <div className="text-[9px] uppercase tracking-[1px] font-semibold mb-1" style={{ color: T.textMuted }}>{t.acceptanceConditions}</div>
                  {ed ? (
                    <textarea
                      value={acceptanceConditions}
                      onChange={(e) => onAcceptanceConditionsChange?.(e.target.value)}
                      placeholder={lang === 'en' ? 'Acceptance conditions...' : "Conditions d'acceptation..."}
                      className="w-full bg-transparent text-[11px] leading-[1.6] focus:outline-none resize-y min-h-[24px]"
                      style={{ color: T.textMuted }}
                      rows={2}
                    />
                  ) : (
                    acceptanceConditions && <p className="text-[11px] whitespace-pre-line" style={{ color: T.textMuted }}>{acceptanceConditions}</p>
                  )}
                </div>
              )}

              {showFreeField && (
                <div className="mt-2">
                  <div className="text-[9px] uppercase tracking-[1px] font-semibold mb-1" style={{ color: T.textMuted }}>{lang === 'en' ? 'Additional information' : 'Champ libre'}</div>
                  {ed ? (
                    <textarea
                      value={freeField}
                      onChange={(e) => onFreeFieldChange?.(e.target.value)}
                      placeholder={lang === 'en' ? 'Additional text...' : 'Texte supplementaire...'}
                      className="w-full bg-transparent text-[11px] leading-[1.6] focus:outline-none resize-y min-h-[24px]"
                      style={{ color: T.textMuted }}
                      rows={2}
                    />
                  ) : (
                    freeField && <p className="text-[11px] whitespace-pre-line" style={{ color: T.textMuted }}>{freeField}</p>
                  )}
                </div>
              )}

              {signatureField && (
                <div className="mt-3 flex gap-5">
                  <div className="flex-1">
                    <div className="text-[9px] uppercase tracking-[1px] font-semibold mb-1" style={{ color: T.textMuted }}>{t.signatureIssuer}</div>
                    <div className="h-14 rounded-lg border-2 border-dashed" style={{ borderColor: T.signatureBorder }} />
                  </div>
                  <div className="flex-1">
                    <div className="text-[9px] uppercase tracking-[1px] font-semibold mb-1" style={{ color: T.textMuted }}>{t.signatureClient}</div>
                    <div className="h-14 rounded-lg border-2 border-dashed" style={{ borderColor: T.signatureBorder }} />
                  </div>
                </div>
              )}

              {/* Payment methods — hidden for quotes (devis) */}

              {/* ── Footer (editable or custom text) ── */}
              {isTiime ? (
                <div className="mt-4 pt-3 text-center">
                  <div
                    style={{
                      border: `1px dashed ${T.editBorderDashed}`,
                      background: T.docBg,
                      padding: '6px 7px',
                    }}
                  >
                    {showFooterText ? (
                      ed ? (
                        <textarea
                          value={footerText || ''}
                          onChange={(e) => onFooterTextChange?.(e.target.value)}
                          placeholder={lang === 'en' ? 'Legal information' : 'Informations legales de ma societe'}
                          className="w-full bg-transparent text-[11px] leading-[1.6] text-center focus:outline-none resize-y min-h-[20px]"
                          style={{ color: T.textFooter }}
                          rows={1}
                        />
                      ) : (
                        <div className="text-[11px] leading-[1.6] whitespace-pre-line" style={{ color: T.textFooter }}>
                          {footerText || ''}
                        </div>
                      )
                    ) : (
                      <div className="text-[11px] leading-[1.6]" style={{ color: T.textFooter }}>
                        {company && (<>
                          {ie(company.legalName, (v) => onCompanyFieldChange('legalName', v), 'font-semibold text-[11px]', t.society)}
                          {company.siren && <> &mdash; SIREN : {ie(company.siren, (v) => onCompanyFieldChange('siren', v), 'text-[11px]')}</>}
                          {company.vatNumber && <> &mdash; {lang === 'en' ? 'VAT No.' : 'N\u00b0 TVA'} : {ie(company.vatNumber, (v) => onCompanyFieldChange('vatNumber', v), 'text-[11px]')}</>}
                        </>)}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="mt-4 pt-3 text-center" style={{ borderTop: `2px solid ${T.footerBorder}` }}>
                  {showFooterText ? (
                    ed ? (
                      <textarea
                        value={footerText || ''}
                        onChange={(e) => onFooterTextChange?.(e.target.value)}
                        placeholder={lang === 'en' ? 'Custom footer text...' : 'Ex: Conditions generales de vente...'}
                        className="w-full bg-transparent text-[9px] leading-[1.6] text-center focus:outline-none resize-y min-h-[30px]"
                        style={{ color: T.textFooter }}
                        rows={2}
                      />
                    ) : (
                      <div className="text-[9px] leading-[1.6] whitespace-pre-line" style={{ color: T.textFooter }}>
                        {footerText || ''}
                      </div>
                    )
                  ) : (
                    <div className="text-[9px] leading-[1.6]" style={{ color: T.textFooter }}>
                      {company && (<>
                        {ie(company.legalName, (v) => onCompanyFieldChange('legalName', v), 'font-semibold text-[9px]', t.society)}
                        {company.siren && <> &mdash; SIREN : {ie(company.siren, (v) => onCompanyFieldChange('siren', v), 'text-[9px]')}</>}
                        {company.vatNumber && <> &mdash; {lang === 'en' ? 'VAT No.' : 'N\u00b0 TVA'} : {ie(company.vatNumber, (v) => onCompanyFieldChange('vatNumber', v), 'text-[9px]')}</>}
                        <br />
                        {ie(company.addressLine1 || '', (v) => onCompanyFieldChange('addressLine1', v), 'text-[9px]', t.address)}
                        {', '}
                        {ie(company.postalCode || '', (v) => onCompanyFieldChange('postalCode', v), 'text-[9px]', t.postalCode)}{' '}
                        {ie(company.city || '', (v) => onCompanyFieldChange('city', v), 'text-[9px]', t.city)}
                        {company.phone && <> &mdash; {ie(company.phone, (v) => onCompanyFieldChange('phone', v), 'text-[9px]')}</>}
                        {company.email && <> &mdash; {ie(company.email, (v) => onCompanyFieldChange('email', v), 'text-[9px]')}</>}
                      </>)}
                    </div>
                  )}
                </div>
              )}

            </div>
            {/* ═══ END BOTTOM SECTION ═══ */}

          </div>
        </div>
      </div>
    </div>
  )
}
