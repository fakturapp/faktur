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

function fmtCurrency(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n)
}

function fmtDate(d: string) {
  if (!d) return ''
  try { return new Date(d).toLocaleDateString('fr-FR') } catch { return d }
}

/* ═══════════════════════════════════════════════════════════
   InlineEdit — click-to-edit text
   ═══════════════════════════════════════════════════════════ */

function InlineEdit({
  value, onChange, preview = false, className, placeholder, multiline, accentColor = '#6366f1',
}: {
  value: string
  onChange: (v: string) => void
  preview?: boolean
  className?: string
  placeholder?: string
  multiline?: boolean
  accentColor?: string
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
        {value || <span className="text-[#bbb] italic">{placeholder || '...'}</span>}
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
          'rounded px-1.5 py-0.5 outline-none bg-white w-full',
          multiline && 'resize-y min-h-[40px]',
          className,
        )}
        style={{ border: `1px solid ${accentColor}`, fontSize: 'inherit', fontFamily: 'inherit' }}
        rows={multiline ? 2 : undefined}
      />
    )
  }

  return (
    <span
      onClick={start}
      className={cn(
        'cursor-pointer border-b border-dashed border-[#ddd] inline-block min-w-[30px] min-h-[16px] transition-colors',
        className,
      )}
      onMouseEnter={(e) => ((e.target as HTMLElement).style.borderBottomColor = accentColor)}
      onMouseLeave={(e) => ((e.target as HTMLElement).style.borderBottomColor = '#ddd')}
      title="Cliquer pour modifier"
    >
      {value || <span className="text-[#bbb] italic">{placeholder || '...'}</span>}
    </span>
  )
}

/* ═══════════════════════════════════════════════════════════
   InlineNumber — click-to-edit number
   ═══════════════════════════════════════════════════════════ */

function InlineNumber({
  value, onChange, preview = false, className, min = 0, step = 1, accentColor = '#6366f1',
}: {
  value: number
  onChange: (v: number) => void
  preview?: boolean
  className?: string
  min?: number
  step?: number
  accentColor?: string
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
          'rounded px-1.5 py-0.5 outline-none bg-white w-full [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
          className,
        )}
        style={{ border: `1px solid ${accentColor}`, fontSize: 'inherit', fontFamily: 'inherit' }}
      />
    )
  }

  return (
    <span
      onClick={start}
      className={cn(
        'cursor-pointer border-b border-dashed border-[#ddd] inline-block min-w-[30px] transition-colors',
        className,
      )}
      onMouseEnter={(e) => ((e.target as HTMLElement).style.borderBottomColor = accentColor)}
      onMouseLeave={(e) => ((e.target as HTMLElement).style.borderBottomColor = '#ddd')}
      title="Cliquer pour modifier"
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
}

export function A4Sheet({
  mode, logoUrl, accentColor, documentTitle, quoteNumber, onQuoteNumberChange,
  issueDate, validityDate,
  billingType, company, onCompanyFieldChange, client, onClientClick, onClearClient,
  lines, onUpdateLine, onAddLine, onRemoveLine,
  subtotal, taxAmount, discountAmount, total, tvaBreakdown,
  notes, onNotesChange, acceptanceConditions, signatureField, freeField,
  deliveryAddress, showDeliveryAddress, clientSiren, showClientSiren,
  clientVatNumber, showClientVatNumber, paymentMethods, customPaymentMethod,
  subject,
}: A4SheetProps) {
  const isPreview = mode === 'preview'
  const ed = !isPreview // shorthand: is editable?

  const gridCols = billingType === 'detailed'
    ? 'minmax(180px, 1fr) 60px 60px 90px 55px 90px 32px'
    : 'minmax(200px, 1fr) 100px 32px'

  const gridColsPreview = billingType === 'detailed'
    ? 'minmax(180px, 1fr) 60px 60px 90px 55px 90px'
    : 'minmax(200px, 1fr) 100px'

  const cols = isPreview ? gridColsPreview : gridCols

  /* helper to shorten InlineEdit props */
  const ie = (v: string, onChange: (s: string) => void, cls?: string, ph?: string) => (
    <InlineEdit value={v} onChange={onChange} preview={isPreview} accentColor={accentColor} className={cls} placeholder={ph} />
  )

  return (
    <div className="flex justify-center">
      {/* ── A4 Container (strict ratio 210×297mm) ── */}
      <div
        className="w-full max-w-[794px] bg-white rounded-xl relative overflow-hidden"
        style={{
          aspectRatio: '210 / 297',
          boxShadow: '0 4px 24px rgba(0,0,0,0.15), 0 1px 4px rgba(0,0,0,0.08)',
        }}
      >
        {/* Accent left bar */}
        <div className="absolute top-0 left-0 bottom-0 w-1" style={{ backgroundColor: accentColor }} />

        {/* Scrollable content — flex column so bottom sticks */}
        <div className="absolute inset-0 overflow-y-auto">
          <div
            className="flex flex-col min-h-full px-10 py-8 text-[#202124]"
            style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif" }}
          >

            {/* ═══════════════════════════════════════════
                 TOP SECTION — grows with content
                ═══════════════════════════════════════════ */}
            <div className="flex-1">

              {/* ── Header: Company + Devis badge ── */}
              <div className="flex justify-between items-start mb-8">
                {/* Left: Logo + Company (all editable) */}
                <div className="max-w-[55%]">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo" className="h-14 w-auto max-w-[110px] object-contain mb-2" />
                  ) : (
                    <div
                      className="w-16 h-16 rounded-xl flex items-center justify-center mb-2 border-2 border-dashed"
                      style={{ background: `${accentColor}15`, borderColor: `${accentColor}66` }}
                    >
                      <span className="text-[10px] font-medium" style={{ color: accentColor }}>Logo</span>
                    </div>
                  )}
                  {company && (
                    <div className="text-[12px] text-[#5f6368] leading-[1.6]">
                      <div>{ie(company.legalName, (v) => onCompanyFieldChange('legalName', v), 'font-semibold text-[#202124] text-[13px]', 'Nom de la societe')}</div>
                      <div>{ie(company.addressLine1 || '', (v) => onCompanyFieldChange('addressLine1', v), 'text-[12px]', 'Adresse')}</div>
                      <div>
                        {ie(company.postalCode || '', (v) => onCompanyFieldChange('postalCode', v), 'text-[12px]', 'CP')}{' '}
                        {ie(company.city || '', (v) => onCompanyFieldChange('city', v), 'text-[12px]', 'Ville')}
                      </div>
                      <div>{ie(company.phone || '', (v) => onCompanyFieldChange('phone', v), 'text-[12px]', 'Telephone')}</div>
                      <div>{ie(company.email || '', (v) => onCompanyFieldChange('email', v), 'text-[12px]', 'Email')}</div>
                      <div className="text-[10px] mt-0.5">
                        SIREN : {ie(company.siren || '', (v) => onCompanyFieldChange('siren', v), 'text-[10px]', '000000000')}
                      </div>
                      <div className="text-[10px]">
                        N&deg; TVA : {ie(company.vatNumber || '', (v) => onCompanyFieldChange('vatNumber', v), 'text-[10px]', 'FR00000000000')}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right: DEVIS badge + meta (editable) */}
                <div className="text-right">
                  <div
                    className="inline-block rounded-[10px] px-5 py-2.5 mb-2"
                    style={{ background: `${accentColor}12`, border: `1px solid ${accentColor}33` }}
                  >
                    <div className="flex items-center gap-2 justify-center">
                      <FileText className="h-5 w-5" style={{ color: accentColor }} />
                      <span className="text-[20px] font-bold uppercase tracking-[2px]" style={{ color: accentColor }}>
                        {documentTitle || 'Devis'}
                      </span>
                    </div>
                  </div>
                  <div className="text-[12px] text-[#5f6368] leading-[1.8]">
                    <div>
                      N&deg; {ie(quoteNumber, onQuoteNumberChange, 'font-semibold text-[#202124]', 'D-0001')}
                    </div>
                    {issueDate && <div>Date : <span className="font-medium">{fmtDate(issueDate)}</span></div>}
                    {validityDate && <div>Validite : <span className="font-medium">{fmtDate(validityDate)}</span></div>}
                  </div>
                </div>
              </div>

              {/* ── Subject ── */}
              {subject && (
                <div className="mb-4 text-[13px] text-[#5f6368]">
                  <span className="font-semibold text-[#202124]">Objet :</span> {subject}
                </div>
              )}

              {/* ── Client Block (editable) ── */}
              <div
                className={cn(
                  'rounded-[10px] px-5 py-3.5 mb-6 border relative transition-all',
                  client
                    ? 'bg-[#f8f9fa] border-[#eee]'
                    : 'bg-[#fafafa] border-dashed border-[#d0d0d0] cursor-pointer hover:border-[#999]',
                )}
                onClick={!client ? onClientClick : undefined}
              >
                <div className="text-[9px] uppercase tracking-[1px] text-[#5f6368] font-semibold mb-1.5">
                  Destinataire
                </div>

                {client ? (
                  <div className="text-[12px] leading-[1.7] group">
                    <div className="font-semibold text-[#202124] text-[13px]">{client.displayName}</div>
                    {client.address && <div className="text-[#5f6368]">{client.address}</div>}
                    {client.addressComplement && <div className="text-[#5f6368]">{client.addressComplement}</div>}
                    {(client.postalCode || client.city) && (
                      <div className="text-[#5f6368]">{client.postalCode} {client.city}</div>
                    )}
                    {client.email && <div className="text-[#5f6368]">{client.email}</div>}

                    {showClientSiren && (
                      <div className="text-[10px] text-[#5f6368] mt-0.5">
                        SIREN : {client.type === 'company' && clientSiren
                          ? ie(clientSiren, () => {}, 'text-[10px]')
                          : <span className="text-[#bbb] italic">N/A (particulier)</span>
                        }
                      </div>
                    )}

                    {showClientVatNumber && (
                      <div className="text-[10px] text-[#5f6368]">
                        N&deg; TVA : {clientVatNumber
                          ? ie(clientVatNumber, () => {}, 'text-[10px]')
                          : <span className="text-[#bbb] italic">Non renseigne</span>
                        }
                      </div>
                    )}

                    {ed && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onClearClient() }}
                        className="absolute top-3.5 right-4 opacity-0 group-hover:opacity-100 transition-opacity text-[#999] hover:text-[#e53935]"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="py-3">
                    <div className="text-[12px] text-[#bbb] leading-[1.7] space-y-0.5">
                      <div className="bg-[#eee] rounded h-3.5 w-40" />
                      <div className="bg-[#eee] rounded h-3 w-52 mt-1.5" />
                      <div className="bg-[#eee] rounded h-3 w-32 mt-1" />
                    </div>
                    {ed && (
                      <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="mt-3">
                        <motion.div
                          animate={{ scale: [1, 1.05, 1] }}
                          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium"
                          style={{ background: `${accentColor}12`, color: accentColor, border: `1px solid ${accentColor}30` }}
                        >
                          <MousePointerClick className="h-3 w-3" />
                          Cliquez pour selectionner un client
                        </motion.div>
                      </motion.div>
                    )}
                  </div>
                )}
              </div>

              {/* ── Delivery address ── */}
              {showDeliveryAddress && deliveryAddress && (
                <div className="bg-[#f8f9fa] rounded-[10px] px-5 py-3 mb-6 border border-[#eee]">
                  <div className="text-[9px] uppercase tracking-[1px] text-[#5f6368] font-semibold mb-1">Adresse de livraison</div>
                  <div className="text-[12px] text-[#5f6368] whitespace-pre-line">{deliveryAddress}</div>
                </div>
              )}

              {/* ── Lines Table ── */}
              <div className="mb-3">
                {/* Header */}
                <div className="rounded-t-[10px] overflow-hidden" style={{ display: 'grid', gridTemplateColumns: cols }}>
                  <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.5px]"
                    style={{ backgroundColor: accentColor, color: contrastText(accentColor) }}>Designation</div>
                  {billingType === 'detailed' && (<>
                    <div className="px-1.5 py-2 text-[10px] font-semibold text-center" style={{ backgroundColor: accentColor, color: contrastText(accentColor) }}>Qte</div>
                    <div className="px-1.5 py-2 text-[10px] font-semibold text-center" style={{ backgroundColor: accentColor, color: contrastText(accentColor) }}>Unite</div>
                    <div className="px-1.5 py-2 text-[10px] font-semibold text-right" style={{ backgroundColor: accentColor, color: contrastText(accentColor) }}>P.U. HT</div>
                    <div className="px-1.5 py-2 text-[10px] font-semibold text-center" style={{ backgroundColor: accentColor, color: contrastText(accentColor) }}>TVA</div>
                  </>)}
                  <div className="px-3 py-2 text-[10px] font-semibold text-right" style={{ backgroundColor: accentColor, color: contrastText(accentColor) }}>Montant HT</div>
                  {ed && <div className="py-2" style={{ backgroundColor: accentColor }} />}
                </div>

                {/* Rows */}
                {lines.map((line, idx) => {
                  const isSection = line.type === 'section'
                  const ht = isSection ? 0 : (billingType === 'quick' ? line.unitPrice : line.quantity * line.unitPrice)
                  const rowBg = idx % 2 === 0 ? '#fff' : '#fafbfc'

                  return (
                    <div
                      key={line.id}
                      className={cn('border-b border-[#f0f0f0] items-center', ed && 'group')}
                      style={{ display: 'grid', gridTemplateColumns: cols, backgroundColor: rowBg, transition: 'background-color 0.15s' }}
                      onMouseEnter={ed ? (e) => (e.currentTarget.style.backgroundColor = `${accentColor}06`) : undefined}
                      onMouseLeave={ed ? (e) => (e.currentTarget.style.backgroundColor = rowBg) : undefined}
                    >
                      <div className="px-3 py-2">
                        {isPreview ? (
                          <span className={cn('text-[12px]', isSection ? 'font-bold' : '')}>{line.description || '-'}</span>
                        ) : (
                          <input type="text" value={line.description}
                            onChange={(e) => onUpdateLine(idx, { description: e.target.value })}
                            placeholder={isSection ? 'Titre de section...' : 'Description...'}
                            className={cn('w-full bg-transparent text-[12px] placeholder:text-[#bbb] focus:outline-none', isSection && 'font-bold')} />
                        )}
                      </div>

                      {!isSection && billingType === 'detailed' && (<>
                        <div className="px-1.5 py-2 text-center">
                          {isPreview ? <span className="text-[12px]">{line.quantity}</span>
                            : <input type="number" min="0" step="1" value={line.quantity}
                                onChange={(e) => onUpdateLine(idx, { quantity: parseFloat(e.target.value) || 0 })}
                                className="w-full bg-transparent text-[12px] text-center focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none" />}
                        </div>
                        <div className="px-1.5 py-2 text-center">
                          {isPreview ? <span className="text-[11px] text-[#5f6368]">{line.unit || '-'}</span>
                            : <input type="text" value={line.unit} placeholder="unite"
                                onChange={(e) => onUpdateLine(idx, { unit: e.target.value })}
                                className="w-full bg-transparent text-[11px] text-center text-[#5f6368] placeholder:text-[#ccc] focus:outline-none" />}
                        </div>
                        <div className="px-1.5 py-2 text-right">
                          {isPreview ? <span className="text-[12px]">{fmtCurrency(line.unitPrice)}</span>
                            : <input type="number" min="0" step="0.01" value={line.unitPrice}
                                onChange={(e) => onUpdateLine(idx, { unitPrice: parseFloat(e.target.value) || 0 })}
                                className="w-full bg-transparent text-[12px] text-right focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none" />}
                        </div>
                        <div className="px-1.5 py-2 text-center">
                          {isPreview ? <span className="text-[11px] text-[#5f6368]">{line.vatRate}%</span>
                            : <select value={line.vatRate} onChange={(e) => onUpdateLine(idx, { vatRate: parseFloat(e.target.value) })}
                                className="w-full text-[10px] border border-[#e0e0e0] rounded py-0.5 px-0.5 bg-white outline-none cursor-pointer">
                                <option value="20">20%</option><option value="10">10%</option><option value="5.5">5,5%</option><option value="0">0%</option>
                              </select>}
                        </div>
                      </>)}

                      {isSection && billingType === 'detailed' && (<><div /><div /><div /><div /></>)}

                      {!isSection ? (
                        <div className="px-3 py-2 text-right text-[12px] font-semibold text-[#202124]">
                          {billingType === 'quick' && ed ? (
                            <input type="number" min="0" step="0.01" value={line.unitPrice}
                              onChange={(e) => onUpdateLine(idx, { unitPrice: parseFloat(e.target.value) || 0 })}
                              className="w-full bg-transparent text-[12px] text-right font-semibold focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none" />
                          ) : fmtCurrency(ht)}
                        </div>
                      ) : <div />}

                      {ed && (
                        <div className="px-0.5 py-2 text-center">
                          {lines.length > 1 && (
                            <button onClick={() => onRemoveLine(idx)}
                              className="w-5 h-5 rounded-full flex items-center justify-center text-[#bbb] hover:bg-red-50 hover:text-[#e53935] transition-all opacity-0 group-hover:opacity-100">
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* ── Add line buttons (edit mode) ── */}
              {ed && (
                <div className="flex gap-2 mb-4">
                  <button onClick={() => onAddLine('standard')}
                    className="px-3.5 py-1.5 rounded-full text-[11px] font-medium cursor-pointer transition-all flex items-center gap-1.5"
                    style={{ border: `1px dashed ${accentColor}88`, background: `${accentColor}08`, color: accentColor }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = `${accentColor}18`)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = `${accentColor}08`)}>
                    <Plus className="h-3 w-3" /> Ligne
                  </button>
                  <button onClick={() => onAddLine('section')}
                    className="px-3.5 py-1.5 rounded-full border border-dashed border-[#dadce0] bg-white text-[#5f6368] text-[11px] font-medium cursor-pointer transition-all hover:bg-[#f8f9fa] flex items-center gap-1.5">
                    <Type className="h-3 w-3" /> Section
                  </button>
                </div>
              )}

            </div>
            {/* ═══ END TOP SECTION ═══ */}

            {/* ═══════════════════════════════════════════
                 BOTTOM SECTION — always sticks to bottom
                ═══════════════════════════════════════════ */}
            <div>

              {/* ── Totals ── */}
              <div className="flex justify-end mb-5">
                <div className="w-[260px]">
                  <div className="flex justify-between py-1.5 border-b border-[#f0f0f0]">
                    <span className="text-[12px] text-[#5f6368]">Total HT</span>
                    <span className="text-[12px] font-semibold text-[#202124]">{fmtCurrency(subtotal)}</span>
                  </div>
                  {tvaBreakdown.map((e) => (
                    <div key={e.rate} className="flex justify-between py-1 border-b border-[#f0f0f0]">
                      <span className="text-[10px] text-[#5f6368]">TVA {e.rate}% (base : {fmtCurrency(e.base)})</span>
                      <span className="text-[10px] text-[#5f6368]">{fmtCurrency(e.amount)}</span>
                    </div>
                  ))}
                  {discountAmount > 0 && (
                    <div className="flex justify-between py-1 border-b border-[#f0f0f0]">
                      <span className="text-[10px] text-[#5f6368]">Remise</span>
                      <span className="text-[10px] text-[#e53935]">-{fmtCurrency(discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between px-3.5 py-2.5 mt-1.5 rounded-[10px]"
                    style={{ background: `${accentColor}10`, border: `1px solid ${accentColor}25` }}>
                    <span className="text-[13px] font-bold text-[#202124]">Total {billingType === 'detailed' ? 'TTC' : ''}</span>
                    <span className="text-[15px] font-bold" style={{ color: accentColor }}>{fmtCurrency(total)}</span>
                  </div>
                </div>
              </div>

              {/* ── Notes (editable) ── */}
              <div className="border-t border-[#eee] pt-3">
                <div className="text-[9px] uppercase tracking-[1px] text-[#5f6368] font-semibold mb-1">Conditions et notes</div>
                {isPreview ? (
                  <p className="text-[11px] text-[#5f6368] whitespace-pre-line leading-[1.6]">
                    {notes || <span className="italic text-[#bbb]">Aucune note</span>}
                  </p>
                ) : (
                  <textarea value={notes} onChange={(e) => onNotesChange(e.target.value)}
                    placeholder="Ajoutez vos conditions de paiement, notes..."
                    className="w-full bg-transparent text-[11px] text-[#5f6368] leading-[1.6] placeholder:text-[#bbb] focus:outline-none resize-y min-h-[30px]" rows={2} />
                )}
              </div>

              {acceptanceConditions && (
                <div className="mt-2">
                  <div className="text-[9px] uppercase tracking-[1px] text-[#5f6368] font-semibold mb-1">Conditions d&apos;acceptation</div>
                  <p className="text-[11px] text-[#5f6368] whitespace-pre-line">{acceptanceConditions}</p>
                </div>
              )}

              {freeField && (
                <div className="mt-2">
                  <p className="text-[11px] text-[#5f6368] whitespace-pre-line">{freeField}</p>
                </div>
              )}

              {signatureField && (
                <div className="mt-3 flex gap-5">
                  <div className="flex-1">
                    <div className="text-[9px] uppercase tracking-[1px] text-[#5f6368] font-semibold mb-1">Signature emetteur</div>
                    <div className="h-14 rounded-lg border-2 border-dashed border-[#e0e0e0]" />
                  </div>
                  <div className="flex-1">
                    <div className="text-[9px] uppercase tracking-[1px] text-[#5f6368] font-semibold mb-1">Signature client</div>
                    <div className="h-14 rounded-lg border-2 border-dashed border-[#e0e0e0]" />
                  </div>
                </div>
              )}

              {paymentMethods.length > 0 && (
                <div className="mt-2">
                  <div className="text-[9px] uppercase tracking-[1px] text-[#5f6368] font-semibold mb-1">Moyens de paiement</div>
                  <div className="flex flex-wrap gap-1">
                    {paymentMethods.includes('bank_transfer') && <span className="text-[9px] bg-[#f8f9fa] text-[#5f6368] rounded px-1.5 py-0.5 border border-[#eee]">Virement</span>}
                    {paymentMethods.includes('check') && <span className="text-[9px] bg-[#f8f9fa] text-[#5f6368] rounded px-1.5 py-0.5 border border-[#eee]">Cheque</span>}
                    {paymentMethods.includes('cash') && <span className="text-[9px] bg-[#f8f9fa] text-[#5f6368] rounded px-1.5 py-0.5 border border-[#eee]">Especes</span>}
                    {paymentMethods.includes('custom') && customPaymentMethod && <span className="text-[9px] bg-[#f8f9fa] text-[#5f6368] rounded px-1.5 py-0.5 border border-[#eee]">{customPaymentMethod}</span>}
                  </div>
                </div>
              )}

              {/* ── Footer (editable) ── */}
              <div className="mt-4 pt-3 border-t-2 border-[#f0f0f0] text-center">
                <div className="text-[9px] text-[#999] leading-[1.6]">
                  {company && (<>
                    {ie(company.legalName, (v) => onCompanyFieldChange('legalName', v), 'font-semibold text-[9px] text-[#999]', 'Societe')}
                    {company.siren && <> &mdash; SIREN : {ie(company.siren, (v) => onCompanyFieldChange('siren', v), 'text-[9px] text-[#999]')}</>}
                    {company.vatNumber && <> &mdash; N&deg; TVA : {ie(company.vatNumber, (v) => onCompanyFieldChange('vatNumber', v), 'text-[9px] text-[#999]')}</>}
                    <br />
                    {ie(company.addressLine1 || '', (v) => onCompanyFieldChange('addressLine1', v), 'text-[9px] text-[#999]', 'Adresse')}
                    {', '}
                    {ie(company.postalCode || '', (v) => onCompanyFieldChange('postalCode', v), 'text-[9px] text-[#999]', 'CP')}{' '}
                    {ie(company.city || '', (v) => onCompanyFieldChange('city', v), 'text-[9px] text-[#999]', 'Ville')}
                    {company.phone && <> &mdash; {ie(company.phone, (v) => onCompanyFieldChange('phone', v), 'text-[9px] text-[#999]')}</>}
                    {company.email && <> &mdash; {ie(company.email, (v) => onCompanyFieldChange('email', v), 'text-[9px] text-[#999]')}</>}
                  </>)}
                </div>
              </div>

            </div>
            {/* ═══ END BOTTOM SECTION ═══ */}

          </div>
        </div>
      </div>
    </div>
  )
}
