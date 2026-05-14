'use client'

import { useState, useRef, useEffect, useCallback, useMemo, type Ref, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  Trash2, Search, X, Building2, UserRound,
  RefreshCw, MousePointerClick, FileText, Plus, Type, ChevronDown, Package, ImagePlus, Upload,
  AlertTriangle, GripVertical, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { api } from '@/lib/api'
import { RichTextarea, mdToHtml } from '@/components/ui/rich-textarea'
import { Dialog, DialogTitle } from '@/components/ui/dialog'
import { Dropdown, DropdownItem } from '@/components/ui/dropdown'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { DatePicker } from '@/components/ui/date-picker'
import { toast } from '@/components/ui/toast'
import { getTemplate, type TemplateConfig } from '@/lib/invoice-templates'
import { getTranslations } from '@/lib/invoice-i18n'


export interface DocumentLine {
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


function InlineEdit({
  value, onChange, preview = false, className, placeholder, multiline, accentColor = '#6366f1',
  inputBg: _inputBg, borderDashed = '#ddd', titleText,
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
  const [justConfirmed, setJustConfirmed] = useState(false)
  const editRef = useRef<HTMLSpanElement>(null)

  const start = () => {
    if (preview) return
    setEditing(true)
    setTimeout(() => {
      const el = editRef.current
      if (!el) return
      el.focus()
      const range = document.createRange()
      const sel = window.getSelection()
      if (el.childNodes.length > 0) {
        range.selectNodeContents(el)
        range.collapse(false)
      } else {
        range.setStart(el, 0)
        range.collapse(true)
      }
      sel?.removeAllRanges()
      sel?.addRange(range)
    }, 10)
  }

  const confirm = () => {
    const text = editRef.current?.textContent || ''
    onChange(text)
    setEditing(false)
    setJustConfirmed(true)
    setTimeout(() => setJustConfirmed(false), 300)
  }

  if (preview) {
    return (
      <span className={className}>
        {value || <span style={{ color: borderDashed }} className="italic">{placeholder || '...'}</span>}
      </span>
    )
  }

  const focusAt = (position: 'start' | 'end') => {
    const el = editRef.current
    if (!el) return
    el.focus()
    const range = document.createRange()
    const sel = window.getSelection()
    if (el.childNodes.length > 0) {
      range.selectNodeContents(el)
      range.collapse(position === 'start')
    } else {
      range.setStart(el, 0)
      range.collapse(true)
    }
    sel?.removeAllRanges()
    sel?.addRange(range)
  }

  if (editing) {
    return (
      <span
        className={cn('relative inline cursor-text', className)}
        style={{ borderBottom: `1px dashed ${borderDashed}` }}
        onClick={(e) => {
          // Click on wrapper (hitbox) → focus at nearest edge
          if (e.target === e.currentTarget) {
            const rect = e.currentTarget.getBoundingClientRect()
            const mid = rect.left + rect.width / 2
            focusAt(e.clientX < mid ? 'start' : 'end')
          }
        }}
      >
        {/* Left invisible hitbox — absolute so it doesn't shift content */}
        <span className="absolute -left-2 top-0 bottom-0 w-2" style={{ userSelect: 'none' }}
          onClick={(e) => { e.stopPropagation(); focusAt('start') }}
        />
        <span
          ref={editRef}
          contentEditable
          suppressContentEditableWarning
          onBlur={confirm}
          onKeyDown={(e) => {
            if (!multiline && e.key === 'Enter') { e.preventDefault(); confirm() }
            if (e.key === 'Escape') { e.preventDefault(); setEditing(false) }
          }}
          onPaste={(e) => {
            e.preventDefault()
            const text = e.clipboardData.getData('text/plain')
            document.execCommand('insertText', false, multiline ? text : text.replace(/[\n\r]/g, ' '))
          }}
          data-placeholder={placeholder || '...'}
          className={cn(
            'inline outline-none',
            '[&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:italic [&:empty]:before:opacity-40 [&:empty]:before:pointer-events-none',
          )}
          style={{
            whiteSpace: multiline ? 'pre-wrap' : 'nowrap',
            wordBreak: multiline ? 'break-word' : undefined,
          }}
          dangerouslySetInnerHTML={{ __html: value || '' }}
        />
        {/* Right invisible hitbox — absolute so it doesn't shift content */}
        <span className="absolute -right-2 top-0 bottom-0 w-2" style={{ userSelect: 'none' }}
          onClick={(e) => { e.stopPropagation(); focusAt('end') }}
        />
      </span>
    )
  }

  return (
    <span
      onClick={start}
      className={cn(
        'cursor-pointer border-b border-dashed inline-block transition-colors',
        justConfirmed && 'animate-[fadeIn_0.25s_ease-out]',
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
   InlineDateEdit — shows formatted date, click to open picker
   ═══════════════════════════════════════════════════════════ */

function InlineDateEdit({
  value, onChange, preview = false, className, lang, accentColor = '#6366f1',
  inputBg = '#ffffff', borderDashed = '#ddd', style,
}: {
  value: string
  onChange?: (v: string) => void
  preview?: boolean
  className?: string
  lang?: string
  accentColor?: string
  inputBg?: string
  borderDashed?: string
  style?: React.CSSProperties
}) {
  if (preview) {
    return <span className={className} style={style}>{fmtDate(value, lang)}</span>
  }

  return (
    <DatePicker
      value={value}
      onChange={onChange}
      lang={lang}
      accentColor={accentColor}
      className={className}
    />
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
  const popupRef = useRef<Window | null>(null)

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

  useEffect(() => {
    if (!open) return
    const interval = setInterval(() => {
      if (popupRef.current && popupRef.current.closed) {
        popupRef.current = null
        loadClients(search)
      }
    }, 500)
    return () => clearInterval(interval)
  }, [open, search, loadClients])

  function handleAddClient() {
    const w = 700
    const h = 700
    const left = (window.screen.width - w) / 2
    const top = (window.screen.height - h) / 2
    popupRef.current = window.open(
      '/dashboard/clients/create?popup=true',
      'createClient',
      `width=${w},height=${h},left=${left},top=${top},resizable=yes,scrollbars=yes`,
    )
  }

  return (
    <Dialog open={open} onClose={onClose} className="max-w-lg">
      <div className="flex items-center justify-between mb-4">
        <DialogTitle>Selectionner un client</DialogTitle>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => loadClients(search)} title="Rafraichir">
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
          </Button>
        </div>
      </div>
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Rechercher par nom, email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" autoFocus />
        </div>
        <Button variant="outline" size="sm" className="shrink-0 gap-1.5" onClick={handleAddClient}>
          <Plus className="h-3.5 w-3.5" /> Ajouter
        </Button>
      </div>
      <div className="max-h-[320px] overflow-y-auto -mx-2">
        {loading ? (
          <div className="flex items-center justify-center py-10"><Spinner /></div>
        ) : results.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-10">{search ? 'Aucun client trouvé' : 'Aucun client'}</p>
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
  isClassique, accentColor, T, t, onAddLine, onCatalogClick, disabled = false, onDisabledClick,
}: {
  isClassique: boolean
  accentColor: string
  T: any
  t: any
  onAddLine: (type: 'standard' | 'section') => void
  onCatalogClick?: () => void
  disabled?: boolean
  onDisabledClick?: () => void
}) {
  const [open, setOpen] = useState(false)
  const [menuPos, setMenuPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 })
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        !triggerRef.current?.contains(target) &&
        !menuRef.current?.contains(target)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  function toggle() {
    if (disabled) {
      onDisabledClick?.()
      return
    }
    if (!open && triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect()
      setMenuPos({ top: r.bottom + 4, left: r.left })
    }
    setOpen((o) => !o)
  }

  const menuItem = (icon: ReactNode, label: string, onClick: () => void) => (
    <button
      onClick={() => { onClick(); setOpen(false) }}
      className="w-full flex items-center gap-2 px-3 py-2 text-[12px] transition-colors"
      style={{ color: T.text }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = `${accentColor}10`)}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
    >
      {icon} {label}
    </button>
  )

  // The menu is portaled to <body> with a high z-index so it is never clipped
  // by the sheet's overflow-hidden or the CSS-column container.
  const menu =
    typeof document === 'undefined'
      ? null
      : createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                ref={menuRef}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="fixed z-[10000] rounded-lg overflow-hidden"
                style={{
                  top: menuPos.top,
                  left: menuPos.left,
                  backgroundColor: T.docBg,
                  border: `1px solid ${T.borderLight}`,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
                  minWidth: '150px',
                }}
              >
                {menuItem(<Plus className="h-3 w-3" />, 'Ligne simple', () => onAddLine('standard'))}
                {menuItem(<Type className="h-3 w-3" />, 'Section', () => onAddLine('section'))}
                {onCatalogClick && (
                  <>
                    <div style={{ height: '1px', background: `${T.borderLight}` }} />
                    {menuItem(<Package className="h-3 w-3" />, 'Depuis le catalogue', onCatalogClick)}
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )

  return (
    <div className="relative mb-4">
      {isClassique ? (
        <button
          ref={triggerRef}
          onClick={toggle}
          className={cn(
            'px-4 py-1.5 rounded-full text-[14px] font-extrabold cursor-pointer transition-all flex items-center gap-2',
            disabled && 'opacity-50 cursor-not-allowed',
          )}
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
          <Plus className="h-4 w-4" /> {t.addLine} <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-180')} />
        </button>
      ) : (
        <button
          ref={triggerRef}
          onClick={toggle}
          className={cn(
            'px-3.5 py-1.5 rounded-full text-[11px] font-medium cursor-pointer transition-all flex items-center gap-1.5',
            disabled && 'opacity-50 cursor-not-allowed',
          )}
          style={{ border: `1px dashed ${accentColor}88`, background: `${accentColor}08`, color: accentColor }}
          onMouseEnter={(e) => (e.currentTarget.style.background = `${accentColor}18`)}
          onMouseLeave={(e) => (e.currentTarget.style.background = `${accentColor}08`)}
        >
          <Plus className="h-3 w-3" /> {t.addLine} <ChevronDown className={cn('h-3 w-3 transition-transform', open && 'rotate-180')} />
        </button>
      )}
      {menu}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   StyledCheckbox — custom animated checkbox
   ═══════════════════════════════════════════════════════════ */

function StyledCheckbox({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <label className="flex items-center gap-2.5 text-xs text-muted-foreground cursor-pointer select-none" onClick={(e) => { e.preventDefault(); onChange(!checked) }}>
      <span
        className={cn(
          'h-[18px] w-[18px] shrink-0 rounded-[5px] border-2 transition-all flex items-center justify-center',
          checked ? 'bg-indigo-500 border-indigo-500' : 'border-zinc-600 bg-transparent hover:border-zinc-400',
        )}
      >
        <AnimatePresence>
          {checked && (
            <motion.svg initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              width="10" height="8" viewBox="0 0 10 8" fill="none">
              <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </motion.svg>
          )}
        </AnimatePresence>
      </span>
      {label}
    </label>
  )
}

/* ═══════════════════════════════════════════════════════════
   LogoImportModal — modal for importing a logo (portaled to body)
   ═══════════════════════════════════════════════════════════ */

function LogoImportModal({
  open, onClose, companyLogoUrl, onSelectCompanyLogo, onSelectFile,
}: {
  open: boolean
  onClose: () => void
  companyLogoUrl?: string | null
  onSelectCompanyLogo?: (saveToSettings: boolean) => void
  onSelectFile: (file: File, saveToSettings: boolean) => void
}) {
  const [saveToSettings, setSaveToSettings] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  if (typeof document === 'undefined') return null

  return createPortal(
    <Dialog open={open} onClose={onClose} className="max-w-sm">
      <DialogTitle>Importer un logo</DialogTitle>
      <div className="mt-4 space-y-3">
        {companyLogoUrl && (
          <motion.button
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05, duration: 0.25 }}
            onClick={() => { onSelectCompanyLogo?.(saveToSettings); onClose() }}
            className="w-full flex items-center gap-3 rounded-xl p-3 border border-border hover:bg-muted/50 transition-colors text-left"
          >
            <img src={companyLogoUrl} alt="" className="h-10 w-10 object-contain rounded-lg" />
            <div>
              <div className="text-sm font-medium text-foreground">Logo de l&apos;entreprise</div>
              <div className="text-xs text-muted-foreground">Utiliser le logo actuel</div>
            </div>
          </motion.button>
        )}
        <motion.button
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: companyLogoUrl ? 0.1 : 0.05, duration: 0.25 }}
          onClick={() => fileRef.current?.click()}
          className="w-full flex items-center gap-3 rounded-xl p-3 border border-dashed border-border hover:bg-muted/50 transition-colors text-left"
        >
          <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
            <Upload className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <div className="text-sm font-medium text-foreground">Importer depuis le PC</div>
            <div className="text-xs text-muted-foreground">PNG, JPG, SVG, WebP — max 2 Mo</div>
          </div>
        </motion.button>
        <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (!file || file.size > 2 * 1024 * 1024) return
            onSelectFile(file, saveToSettings)
            onClose()
            e.target.value = ''
          }}
        />
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="pt-1">
          <StyledCheckbox checked={saveToSettings} onChange={setSaveToSettings} label="Appliquer aussi aux parametres" />
        </motion.div>
      </div>
    </Dialog>,
    document.body,
  )
}

/* ═══════════════════════════════════════════════════════════
   LogoEditor — interactive logo zone (import, resize, round, delete)
   ═══════════════════════════════════════════════════════════ */

function LogoEditor({
  logoUrl, logoBorderRadius = 0, accentColor, companyLogoUrl,
  onLogoChange, onLogoBorderRadiusChange, onLogoUpload, T,
  variant = 'standard', company, t,
}: {
  logoUrl: string | null
  logoBorderRadius: number
  accentColor: string
  companyLogoUrl?: string | null
  onLogoChange?: (logoUrl: string | null, saveToSettings: boolean) => void
  onLogoBorderRadiusChange?: (radius: number) => void
  onLogoUpload?: (file: File, saveToSettings: boolean) => void
  T: TemplateConfig
  variant?: 'standard' | 'banner'
  company?: CompanyInfo | null
  t: any
}) {
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteFromSettings, setDeleteFromSettings] = useState(false)
  const [radiusOpen, setRadiusOpen] = useState(false)
  const [hovered, setHovered] = useState(false)
  const radiusRef = useRef<HTMLDivElement>(null)

  const [logoSize, setLogoSize] = useState(() => {
    try {
      const saved = localStorage.getItem('faktur_logo_size')
      return saved ? parseInt(saved, 10) : (variant === 'banner' ? 48 : 56)
    } catch { return variant === 'banner' ? 48 : 56 }
  })

  useEffect(() => {
    try { localStorage.setItem('faktur_logo_size', String(logoSize)) } catch {}
  }, [logoSize])

  useEffect(() => {
    if (!radiusOpen) return
    const handler = (e: MouseEvent) => {
      if (radiusRef.current && !radiusRef.current.contains(e.target as Node)) setRadiusOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [radiusOpen])

  const handleResize = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation()
    const startY = e.clientY, startSize = logoSize
    const onMove = (me: MouseEvent) => setLogoSize(Math.max(40, Math.min(200, startSize + (me.clientY - startY))))
    const onUp = () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp) }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  /* No logo — placeholder */
  if (!logoUrl) {
    if (variant === 'banner') {
      return (
        <>
          <div className="flex items-center gap-2 cursor-pointer group/logo" onClick={() => setImportModalOpen(true)}>
            <div className="text-[18px] font-bold" style={{ color: contrastText(accentColor) }}>
              {company?.legalName || t.society}
            </div>
            <ImagePlus className="h-4 w-4 opacity-0 group-hover/logo:opacity-70 transition-opacity" style={{ color: contrastText(accentColor) }} />
          </div>
          <LogoImportModal open={importModalOpen} onClose={() => setImportModalOpen(false)}
            companyLogoUrl={companyLogoUrl}
            onSelectCompanyLogo={(save) => onLogoChange?.(companyLogoUrl!, save)}
            onSelectFile={(file, save) => onLogoUpload?.(file, save)} />
        </>
      )
    }
    return (
      <>
        <div
          className="w-16 h-16 flex items-center justify-center mb-2 border-2 border-dashed cursor-pointer transition-colors"
          style={{ background: `${accentColor}15`, borderColor: `${accentColor}66`, borderRadius: T.borderRadius }}
          onClick={() => setImportModalOpen(true)}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = accentColor)}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = `${accentColor}66`)}
        >
          <ImagePlus className="h-5 w-5" style={{ color: accentColor }} />
        </div>
        <LogoImportModal open={importModalOpen} onClose={() => setImportModalOpen(false)}
          companyLogoUrl={companyLogoUrl}
          onSelectCompanyLogo={(save) => onLogoChange?.(companyLogoUrl!, save)}
          onSelectFile={(file, save) => onLogoUpload?.(file, save)} />
      </>
    )
  }

  /* Has logo — image with overlay controls */
  return (
    <>
      <div
        className={cn('relative inline-block group/logowrap', variant === 'standard' ? 'mb-2' : 'mb-1')}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <img src={logoUrl} alt="Logo" className="w-auto object-contain"
          style={{ height: `${logoSize}px`, maxWidth: variant === 'banner' ? '100px' : '150px', borderRadius: `${logoBorderRadius}px`, cursor: 'se-resize' }}
          onDoubleClick={() => setImportModalOpen(true)}
        />

        {/* Resize grip — visible on hover */}
        <div className="absolute -bottom-1 -right-1 opacity-0 group-hover/logowrap:opacity-100 transition-opacity pointer-events-none">
          <div className="w-3.5 h-3.5 rounded-sm bg-white/80 shadow-sm flex items-center justify-center">
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
              <path d="M6 1L1 6" stroke="#666" strokeWidth="1.2" strokeLinecap="round"/>
              <path d="M6 4L4 6" stroke="#666" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          </div>
        </div>

        <AnimatePresence>
          {(hovered || radiusOpen) && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
              className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.35)', borderRadius: `${logoBorderRadius}px` }}>
              {/* Delete — top right */}
              <button className="absolute top-1 right-1 h-5 w-5 rounded-full flex items-center justify-center bg-white/90 hover:bg-white transition-colors"
                onClick={(e) => { e.stopPropagation(); setDeleteDialogOpen(true) }} title="Supprimer">
                <X className="h-3 w-3 text-red-500" />
              </button>

              {/* Border-radius — bottom left */}
              <div className="absolute bottom-1 left-1" ref={radiusRef}>
                <button className="h-5 w-5 rounded-full flex items-center justify-center bg-white/90 hover:bg-white transition-colors"
                  onClick={(e) => { e.stopPropagation(); setRadiusOpen(!radiusOpen) }} title="Arrondi">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1 9V5C1 2.79 2.79 1 5 1H9" stroke="#555" strokeWidth="1.5" strokeLinecap="round"/></svg>
                </button>
                <AnimatePresence>
                  {radiusOpen && (
                    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }} transition={{ duration: 0.15 }}
                      className="absolute left-0 bottom-full mb-1 z-20 rounded-lg p-2.5"
                      style={{ backgroundColor: T.docBg, border: `1px solid ${T.borderLight}`, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', width: '140px' }}
                      onClick={(e) => e.stopPropagation()} onMouseEnter={() => setHovered(true)}>
                      <div className="text-[10px] font-medium mb-1.5" style={{ color: T.textMuted }}>Arrondi : {logoBorderRadius}px</div>
                      <input type="range" min="0" max="50" value={logoBorderRadius}
                        onChange={(e) => onLogoBorderRadiusChange?.(parseInt(e.target.value, 10))}
                        className="w-full h-1 cursor-pointer" style={{ accentColor }} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Resize handle — bottom right */}
              <div className="absolute -bottom-1 -right-1 w-6 h-6 cursor-se-resize" onMouseDown={handleResize}>
                <div className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-sm bg-white/90 shadow-sm flex items-center justify-center">
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                    <path d="M6 1L1 6" stroke="#444" strokeWidth="1.2" strokeLinecap="round"/>
                    <path d="M6 4L4 6" stroke="#444" strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Delete confirmation — portaled to body */}
      {typeof document !== 'undefined' && createPortal(
        <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} className="max-w-xs">
          <DialogTitle>Supprimer le logo ?</DialogTitle>
          <p className="mt-2 text-sm text-muted-foreground">Le logo sera retire de ce document.</p>
          <div className="mt-3">
            <StyledCheckbox checked={deleteFromSettings} onChange={setDeleteFromSettings} label="Supprimer aussi des parametres" />
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setDeleteDialogOpen(false)}>Annuler</Button>
            <Button variant="destructive" size="sm" onClick={() => {
              onLogoChange?.(null, deleteFromSettings)
              setDeleteDialogOpen(false); setDeleteFromSettings(false)
            }}>Supprimer</Button>
          </div>
        </Dialog>,
        document.body,
      )}

      <LogoImportModal open={importModalOpen} onClose={() => setImportModalOpen(false)}
        companyLogoUrl={companyLogoUrl}
        onSelectCompanyLogo={(save) => onLogoChange?.(companyLogoUrl!, save)}
        onSelectFile={(file, save) => onLogoUpload?.(file, save)} />
    </>
  )
}

/* ═══════════════════════════════════════════════════════════
   A4Sheet — main document component
   ═══════════════════════════════════════════════════════════ */

// Which slice of the document a sheet renders:
//  - single: the whole document on one sheet (default)
//  - first: header/client/dates + the first slice of lines, no totals/footer
//  - continuation: a "(suite)" marker + the remaining lines + totals/footer
type PageRole = 'single' | 'first' | 'continuation'

// Reference pixel dimensions for the side-by-side split layout.
const A4_SHEET_W = 960
const A4_SHEET_H = Math.round(A4_SHEET_W * (297 / 210)) // 1358 — one A4 page
const STACK_GAP = 32 // gap between the two stacked A4 sheets
const STACK_TOTAL_H = A4_SHEET_H * 2 + STACK_GAP // height of the two-sheet stack

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
  lines: DocumentLine[]
  onUpdateLine: (index: number, partial: Partial<DocumentLine>) => void
  onAddLine: (type: 'standard' | 'section') => void
  onReorderLine?: (fromIndex: number, toIndex: number) => void
  onCatalogClick?: () => void
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
  vatExemptReason?: 'none' | 'not_subject' | 'france_no_vat' | 'outside_france'
  vatOnDebits?: boolean
  footerText?: string
  documentFont?: string
  showSubject?: boolean
  showAcceptanceConditions?: boolean
  showFreeField?: boolean
  showFooterText?: boolean
  footerMode?: 'company_info' | 'custom'
  documentType?: 'quote' | 'invoice' | 'credit_note'
  bankAccountInfo?: { bankName: string | null; iban: string | null; bic: string | null } | null
  paymentMethod?: string | null
  logoBorderRadius?: number
  onLogoChange?: (logoUrl: string | null, saveToSettings: boolean) => void
  onLogoBorderRadiusChange?: (radius: number) => void
  companyLogoUrl?: string | null
  onLogoUpload?: (file: File, saveToSettings: boolean) => void
  validationErrors?: string[]
  onAcceptanceConditionsChange?: (v: string) => void
  onFreeFieldChange?: (v: string) => void
  onFooterTextChange?: (v: string) => void
  onDeliveryAddressChange?: (v: string) => void
  onIssueDateChange?: (d: string) => void
  onValidityDateChange?: (d: string) => void
  showQuantityColumn?: boolean
  showUnitColumn?: boolean
  showUnitPriceColumn?: boolean
  showVatColumn?: boolean
  // When true, a document spanning more than one A4 page is rendered as
  // separate side-by-side sheets instead of a single clipped sheet.
  paginate?: boolean
  // Current document zoom in percent (the editor's zoom slider). Used to
  // decide when the two pages should stack vertically.
  zoom?: number
}

export function A4Sheet({
  mode, logoUrl, accentColor, documentTitle, quoteNumber, onQuoteNumberChange,
  issueDate, validityDate,
  billingType, company, onCompanyFieldChange, client, onClientClick, onClearClient, onClientFieldChange,
  lines, onUpdateLine, onAddLine, onReorderLine, onCatalogClick, onRemoveLine,
  subtotal, taxAmount, discountAmount, total, tvaBreakdown,
  notes, onNotesChange, acceptanceConditions, signatureField, freeField,
  deliveryAddress, showDeliveryAddress, clientSiren, showClientSiren,
  clientVatNumber, showClientVatNumber, paymentMethods, customPaymentMethod,
  subject, onSubjectChange, template, darkMode, language,
  showNotes = true, vatExemptReason = 'none', vatOnDebits = false, footerText, documentFont = 'Lexend',
  showSubject = true, showAcceptanceConditions = false, showFreeField = false, showFooterText = false,
  footerMode = 'company_info',
  documentType = 'quote',
  bankAccountInfo, paymentMethod, logoBorderRadius = 0,
  onLogoChange, onLogoBorderRadiusChange, companyLogoUrl, onLogoUpload,
  validationErrors = [],
  onAcceptanceConditionsChange, onFreeFieldChange, onFooterTextChange, onDeliveryAddressChange,
  onIssueDateChange, onValidityDateChange,
  showQuantityColumn = true,
  showUnitColumn = true,
  showUnitPriceColumn = true,
  showVatColumn = true,
  paginate = false,
  zoom = 100,
}: A4SheetProps) {
  const isPreview = mode === 'preview'
  const ed = !isPreview // shorthand: is editable?
  const lang = language || 'fr'
  const [draggingLineIndex, setDraggingLineIndex] = useState<number | null>(null)
  const [dragOverLineIndex, setDragOverLineIndex] = useState<number | null>(null)

  const T = getTemplate(template, darkMode)
  const t = getTranslations(lang)
  const isClassique = T.id === 'classique'
  const isInvoice = documentType === 'invoice'
  const isCreditNote = documentType === 'credit_note'
  const defaultTitle = isCreditNote ? 'Avoir' : isInvoice ? t.invoice : t.quote
  const validityLabel = isInvoice ? t.dueDate : t.validity
  // Template font override takes precedence
  const effectiveFont = T.font || documentFont

  // Pagination model: a hidden instance renders the document once at the real
  // A4 width. We measure where the page-1 boundary falls between the line rows
  // (data-a4-row) to get the split point, then render two REAL separate A4
  // sheet cards — page 1 with the rows that fit, page 2 with the rest.
  const contentRef = useRef<HTMLDivElement>(null)
  const [rawPageCount, setRawPageCount] = useState(1)
  const [splitIndex, setSplitIndex] = useState(0)

  useEffect(() => {
    if (!paginate) return
    function measure() {
      const content = contentRef.current
      if (!content) return
      const total = content.scrollHeight
      if (total <= 0) return
      setRawPageCount(Math.max(1, Math.ceil((total - 8) / A4_SHEET_H)))
      // First line row whose bottom spills past page 1 → the split point.
      const budget = A4_SHEET_H - 48
      const rows = content.querySelectorAll<HTMLElement>('[data-a4-row]')
      let split = lines.length
      for (let i = 0; i < rows.length; i++) {
        if (rows[i].offsetTop + rows[i].offsetHeight > budget) {
          split = i
          break
        }
      }
      setSplitIndex(Math.max(1, Math.min(split, lines.length)))
    }
    const raf = requestAnimationFrame(measure)
    const ro = new ResizeObserver(measure)
    if (contentRef.current) ro.observe(contentRef.current)
    // Custom fonts load async and change row heights — re-measure once ready.
    if (typeof document !== 'undefined' && document.fonts?.ready) {
      document.fonts.ready.then(measure).catch(() => {})
    }
    const late = setTimeout(measure, 400)
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(late)
      ro.disconnect()
    }
  }, [paginate, lines.length, effectiveFont])

  // A document may not span more than 2 A4 pages.
  const tooMuchContent = rawPageCount > 2
  const overflows = rawPageCount > 1

  // Toast once when the document first overflows the 2-page limit.
  const wasTooMuch = useRef(false)
  useEffect(() => {
    if (tooMuchContent && !wasTooMuch.current && paginate) {
      toast.warning('Limite de page atteinte', {
        description: 'Cette facture dépasse 2 pages — supprimez du contenu pour continuer.',
      })
    }
    wasTooMuch.current = tooMuchContent
  }, [tooMuchContent, paginate])

  // The two stacked sheets are scaled down to fit the available width.
  const splitWrapRef = useRef<HTMLDivElement>(null)
  const [stackScale, setStackScale] = useState(1)
  useEffect(() => {
    if (!paginate) return
    const el = splitWrapRef.current
    if (!el) return
    const update = () => {
      const w = el.clientWidth
      if (w > 0) setStackScale(Math.min(1, w / A4_SHEET_W))
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [paginate])

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

  const hasError = (field: string) => validationErrors.includes(field)
  const errorBorder = '#ef4444'
  const detailedColumns = [
    { key: 'quantity', width: '45px', label: t.qty, visible: showQuantityColumn },
    { key: 'unit', width: '50px', label: t.unit, visible: showUnitColumn },
    { key: 'unitPrice', width: '75px', label: t.unitPriceHT, visible: showUnitPriceColumn },
    { key: 'vat', width: '45px', label: t.vat, visible: showVatColumn },
  ].filter((column) => column.visible)
  const canReorderLines = ed && typeof onReorderLine === 'function' && lines.length > 1

  const gridCols = billingType === 'detailed'
    ? [
        'minmax(120px, 1fr)',
        ...detailedColumns.map((column) => column.width),
        '80px',
        ed ? '36px' : null,
      ]
        .filter(Boolean)
        .join(' ')
    : ['minmax(150px, 1fr)', '90px', ed ? '36px' : null].filter(Boolean).join(' ')

  const gridColsPreview = billingType === 'detailed'
    ? ['minmax(120px, 1fr)', ...detailedColumns.map((column) => column.width), '80px'].join(' ')
    : 'minmax(150px, 1fr) 90px'

  const cols = isPreview ? gridColsPreview : gridCols
  const reorderLineLabel = lang === 'en' ? 'Drag to reorder' : 'Glisser pour reordonner'

  const handleLineDragStart = useCallback((index: number) => {
    setDraggingLineIndex(index)
    setDragOverLineIndex(index)
  }, [])

  const handleLineDragOver = useCallback(
    (event: React.DragEvent<HTMLDivElement>, index: number) => {
      if (!canReorderLines || draggingLineIndex === null || draggingLineIndex === index) return
      event.preventDefault()
      event.dataTransfer.dropEffect = 'move'
      setDragOverLineIndex(index)
    },
    [canReorderLines, draggingLineIndex]
  )

  const handleLineDrop = useCallback(
    (index: number) => {
      if (!canReorderLines || draggingLineIndex === null) return
      if (draggingLineIndex !== index) {
        onReorderLine?.(draggingLineIndex, index)
      }
      setDraggingLineIndex(null)
      setDragOverLineIndex(null)
    },
    [canReorderLines, draggingLineIndex, onReorderLine]
  )

  const handleLineDragEnd = useCallback(() => {
    setDraggingLineIndex(null)
    setDragOverLineIndex(null)
  }, [])

  const ie = (v: string, onChange: (s: string) => void, cls?: string, ph?: string) => (
    <InlineEdit value={v} onChange={onChange} preview={isPreview} accentColor={accentColor}
      inputBg={T.inputBg} borderDashed={T.editBorderDashed} className={cls} placeholder={ph}
      titleText={t.clickToEdit} />
  )

  const renderDocumentBody = (
    role: PageRole,
    sliceLines: DocumentLine[],
    absStart: number,
    bodyRef?: Ref<HTMLDivElement>,
    columnMode = false,
  ) => {
    const showTop = role !== 'continuation'
    const showBottom = role !== 'first'
    return (
          <div
            ref={bodyRef}
            // In column mode the body is plain block flow so the browser can
            // fragment it across the two A4 columns; padding lives on the
            // column container so each page gets its own margins.
            className={columnMode ? '' : 'flex flex-col min-h-full px-10 py-8'}
            style={{
              fontFamily: `'${effectiveFont}', 'Segoe UI', sans-serif`,
              color: T.text,
              letterSpacing: isClassique ? '0.5px' : undefined,
            }}
          >

            {/* ═══════════════════════════════════════════
                 TOP SECTION — grows with content
                ═══════════════════════════════════════════ */}
            <div className={columnMode ? '' : 'flex-1'}>

              {role === 'continuation' && (
                <div className="mb-5 text-[11px] font-semibold uppercase tracking-[1px]" style={{ color: T.textMuted }}>
                  {lang === 'en' ? 'Continued' : 'Suite'}
                </div>
              )}

              {showTop && (<>
              {/* ── Banner header for 'banner' layout templates ── */}
              {T.layout === 'banner' && (
                <div
                  className="rounded-xl px-6 py-4 mb-6 -mx-4 -mt-2"
                  style={{ backgroundColor: accentColor }}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      {ed ? (
                        <LogoEditor logoUrl={logoUrl} logoBorderRadius={logoBorderRadius} accentColor={accentColor}
                          companyLogoUrl={companyLogoUrl} onLogoChange={onLogoChange} onLogoBorderRadiusChange={onLogoBorderRadiusChange}
                          onLogoUpload={onLogoUpload} T={T} variant="banner" company={company} t={t} />
                      ) : logoUrl ? (
                        <img src={logoUrl} alt="Logo" className="h-12 w-auto max-w-[100px] object-contain mb-1" style={{ borderRadius: `${logoBorderRadius}px` }} />
                      ) : (
                        <div className="text-[18px] font-bold" style={{ color: contrastText(accentColor) }}>
                          {company?.legalName || t.society}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-[18px] font-bold uppercase tracking-[2px]" style={{ color: contrastText(accentColor) }}>
                        {documentTitle || defaultTitle}
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
                    {ed ? (
                      <LogoEditor logoUrl={logoUrl} logoBorderRadius={logoBorderRadius} accentColor={accentColor}
                        companyLogoUrl={companyLogoUrl} onLogoChange={onLogoChange} onLogoBorderRadiusChange={onLogoBorderRadiusChange}
                        onLogoUpload={onLogoUpload} T={T} variant="standard" company={company} t={t} />
                    ) : logoUrl ? (
                      <img src={logoUrl} alt="Logo" className="h-14 w-auto max-w-[110px] object-contain mb-2" style={{ borderRadius: `${logoBorderRadius}px` }} />
                    ) : null}
                    {company && (
                      <div className="text-[12px] leading-[1.6]" style={{ color: T.text }}>
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
                    {isClassique ? (
                      <>
                        <div className="text-[14px] font-semibold mb-1" style={{ color: T.text }}>
                          {documentTitle || defaultTitle}
                        </div>
                        <div className="text-[12px] leading-[1.8]" style={{ color: T.text }}>
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
                              {documentTitle || defaultTitle}
                            </span>
                          </div>
                        </div>
                        <div className="text-[12px] leading-[1.8]" style={{ color: T.text }}>
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
                  <div className="text-[12px] leading-[1.6]" style={{ color: T.text }}>
                    <div>{ie(company.legalName, (v) => onCompanyFieldChange('legalName', v), `font-semibold text-[13px]`, t.society)}</div>
                    <div>{ie(company.addressLine1 || '', (v) => onCompanyFieldChange('addressLine1', v), 'text-[12px]', t.address)}</div>
                    <div>
                      {ie(company.postalCode || '', (v) => onCompanyFieldChange('postalCode', v), 'text-[12px]', t.postalCode)}{' '}
                      {ie(company.city || '', (v) => onCompanyFieldChange('city', v), 'text-[12px]', t.city)}
                    </div>
                    <div>{ie(company.phone || '', (v) => onCompanyFieldChange('phone', v), 'text-[12px]', t.phone)}</div>
                    <div>{ie(company.email || '', (v) => onCompanyFieldChange('email', v), 'text-[12px]', t.email)}</div>
                  </div>
                  <div className="text-[12px] text-right leading-[1.8]" style={{ color: T.text }}>
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
                isClassique ? (
                  <div className="mb-4">
                    <div
                      style={{
                        border: `1px dashed ${hasError('Objet') ? errorBorder : T.editBorderDashed}`,
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
                  <div className="mb-4 text-[13px]" style={{ color: hasError('Objet') ? errorBorder : T.text }}>
                    <span className="font-semibold">{t.subject} : </span>
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
                        style={{ color: hasError('Client') ? errorBorder : (client?.displayName ? T.text : T.inputPlaceholder), borderBottomColor: hasError('Client') ? errorBorder : T.editBorderDashed }}
                        onClick={onClientClick}
                        onMouseEnter={(e) => (e.currentTarget.style.borderBottomColor = hasError('Client') ? errorBorder : accentColor)}
                        onMouseLeave={(e) => (e.currentTarget.style.borderBottomColor = hasError('Client') ? errorBorder : T.editBorderDashed)}
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
                      <div className="mt-2 pt-2" style={{ borderTop: `1px solid ${hasError('Adresse de livraison') ? errorBorder : T.borderLight}` }}>
                        <div className="text-[9px] uppercase tracking-[1px] font-semibold mb-0.5" style={{ color: hasError('Adresse de livraison') ? errorBorder : T.textMuted }}>
                          {t.deliveryAddress}
                        </div>
                        {ed ? (
                          <RichTextarea
                            value={deliveryAddress}
                            onChange={(v) => onDeliveryAddressChange?.(v)}
                            placeholder={lang === 'en' ? 'Delivery address...' : 'Adresse de livraison...'}
                            className="text-[12px] leading-[1.5]"
                            style={{ color: T.textMuted }}
                            rows={2}
                          />
                        ) : (
                          deliveryAddress && <div className="text-[12px]" style={{ color: T.textMuted }} dangerouslySetInnerHTML={{ __html: mdToHtml(deliveryAddress) }} />
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
                isClassique ? (
                  <div className="flex items-end gap-3 mb-4">
                    <div className="flex-1 text-[14px] font-semibold" style={{ color: T.text, padding: '8px' }}>
                      {documentTitle || defaultTitle}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[12px] mb-0.5" style={{ color: T.textMuted, letterSpacing: '0.4px' }}>{t.date}</span>
                      <InlineDateEdit
                        value={issueDate}
                        onChange={onIssueDateChange}
                        preview={!ed}
                        lang={lang}
                        className="flex items-center px-2.5 text-[14px] font-medium"
                        style={{
                          border: `1px solid ${T.editBorderDashed}`,
                          borderRadius: '6px',
                          height: '36px',
                          minWidth: '140px',
                          background: ed ? 'transparent' : T.docBg,
                          color: T.text,
                        }}
                      />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[12px] mb-0.5" style={{ color: T.textMuted, letterSpacing: '0.4px' }}>{validityLabel}</span>
                      <InlineDateEdit
                        value={validityDate}
                        onChange={onValidityDateChange}
                        preview={!ed}
                        lang={lang}
                        className="flex items-center px-2 text-[14px] font-medium"
                        style={{
                          border: `1px dashed ${T.editBorderDashed}`,
                          borderRadius: '6px',
                          height: '36px',
                          minWidth: '140px',
                          background: ed ? 'transparent' : T.docBg,
                          color: T.text,
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-4 mb-4 px-3 py-2.5" style={{ backgroundColor: `${accentColor}08`, border: `1px solid ${accentColor}20`, borderRadius: T.borderRadius }}>
                    <div className="text-[11px]" style={{ color: T.textMuted }}>
                      <span className="font-semibold" style={{ color: T.text }}>{t.date} :</span>{' '}
                      <InlineDateEdit
                        value={issueDate}
                        onChange={onIssueDateChange}
                        preview={!ed}
                        lang={lang}
                        className="font-medium"
                        style={{ color: T.textMuted }}
                      />
                    </div>
                    <div className="text-[11px]" style={{ color: T.textMuted }}>
                      <span className="font-semibold" style={{ color: T.text }}>{validityLabel} :</span>{' '}
                      <InlineDateEdit
                        value={validityDate}
                        onChange={onValidityDateChange}
                        preview={!ed}
                        lang={lang}
                        className="font-medium"
                        style={{ color: T.textMuted }}
                      />
                    </div>
                  </div>
                )
              )}
              </>)}

              {/* ── Lines Table ── */}
              <div className="mb-3" style={(hasError('Désignation') || hasError('Prix')) ? { outline: `2px solid ${errorBorder}`, outlineOffset: '-1px', borderRadius: T.borderRadius } : undefined}>
                {/* Header */}
                <div className="overflow-hidden" style={{ display: 'grid', gridTemplateColumns: cols, breakInside: 'avoid', breakAfter: 'avoid', borderTopLeftRadius: T.borderRadius, borderTopRightRadius: T.borderRadius }}>
                  <div className="px-2 py-2 text-[9px] font-semibold uppercase tracking-[0.5px] truncate"
                    style={{ backgroundColor: accentColor, color: contrastText(accentColor) }}>{t.designation}</div>
                  {billingType === 'detailed' && detailedColumns.map((column) => (
                    <div
                      key={column.key}
                      className={cn(
                        'px-1 py-2 text-[9px] font-semibold truncate',
                        column.key === 'unitPrice' ? 'text-right' : 'text-center',
                      )}
                      style={{ backgroundColor: accentColor, color: contrastText(accentColor) }}
                    >
                      {column.label}
                    </div>
                  ))}
                  <div className="px-2 py-2 text-[9px] font-semibold text-right truncate" style={{ backgroundColor: accentColor, color: contrastText(accentColor) }}>{t.amountHT}</div>
                  {ed && <div className="py-2" style={{ backgroundColor: accentColor }} />}
                </div>

                {/* Rows */}
                {sliceLines.map((line, i) => {
                  const idx = absStart + i
                  const isSection = line.type === 'section'
                  const ht = isSection ? 0 : (billingType === 'quick' ? line.unitPrice : line.quantity * line.unitPrice)
                  const rowBg = idx % 2 === 0 ? T.rowEven : T.rowOdd

                  return (
                    <div
                      key={line.id}
                      data-a4-row
                      className={cn('items-center', ed && 'group')}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: cols,
                        breakInside: 'avoid',
                        backgroundColor: dragOverLineIndex === idx && draggingLineIndex !== idx ? `${accentColor}${T.rowHover}` : rowBg,
                        borderBottom: `1px solid ${T.borderLight}`,
                        transition: 'background-color 0.15s',
                        opacity: draggingLineIndex === idx ? 0.65 : 1,
                      }}
                      onMouseEnter={ed ? (e) => (e.currentTarget.style.backgroundColor = `${accentColor}${T.rowHover}`) : undefined}
                      onMouseLeave={ed ? (e) => (e.currentTarget.style.backgroundColor = rowBg) : undefined}
                      onDragOver={canReorderLines ? (event) => handleLineDragOver(event, idx) : undefined}
                      onDrop={canReorderLines ? (event) => {
                        event.preventDefault()
                        handleLineDrop(idx)
                      } : undefined}
                    >
                      <div className="px-3 py-2">
                        {isPreview ? (
                          line.description
                            ? <span className={cn('text-[12px]', isSection ? 'font-bold' : '')} dangerouslySetInnerHTML={{ __html: mdToHtml(line.description) }} />
                            : <span className="text-[12px]">-</span>
                        ) : (
                          <RichTextarea
                            value={line.description}
                            onChange={(v) => onUpdateLine(idx, { description: v })}
                            placeholder={isSection ? t.sectionTitle : t.description}
                            className={cn('text-[12px]', isSection && 'font-bold')}
                            style={{ color: T.text }}
                          />
                        )}
                      </div>

                      {!isSection && billingType === 'detailed' && showQuantityColumn && (
                        <div className="px-1.5 py-2 text-center">
                          {isPreview ? <span className="text-[12px]">{line.quantity}</span>
                            : <input type="number" min="0" step="1" value={line.quantity}
                                onChange={(e) => onUpdateLine(idx, { quantity: parseFloat(e.target.value) || 0 })}
                                className="w-full bg-transparent text-[12px] text-center focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                                style={{ color: T.text }} />}
                        </div>
                      )}
                      {!isSection && billingType === 'detailed' && showUnitColumn && (
                        <div className="px-1.5 py-2 text-center">
                          {isPreview ? <span className="text-[11px]" style={{ color: T.textMuted }}>{line.unit || '-'}</span>
                            : <input type="text" value={line.unit} placeholder={t.unit}
                                onChange={(e) => onUpdateLine(idx, { unit: e.target.value })}
                                className="w-full bg-transparent text-[11px] text-center focus:outline-none"
                                style={{ color: T.textMuted }} />}
                        </div>
                      )}
                      {!isSection && billingType === 'detailed' && showUnitPriceColumn && (
                        <div className="px-1 py-2 text-right overflow-hidden">
                          {isPreview ? <span className="text-[11px] truncate block">{fmtCurrency(line.unitPrice, lang)}</span>
                            : <input type="number" min="0" step="0.01" value={line.unitPrice}
                                onChange={(e) => onUpdateLine(idx, { unitPrice: parseFloat(e.target.value) || 0 })}
                                className="w-full bg-transparent text-[12px] text-right focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                                style={{ color: T.text }} />}
                        </div>
                      )}
                      {!isSection && billingType === 'detailed' && showVatColumn && (
                        <div className="px-1.5 py-2 text-center">
                          {isPreview ? <span className="text-[11px]" style={{ color: T.textMuted }}>{line.vatRate}%</span>
                            : <div className="w-full flex justify-center">
                                <Dropdown
                                  align="right"
                                  trigger={
                                    <button
                                      className="flex justify-between items-center px-1 text-[10px] rounded cursor-pointer outline-none min-w-[36px]"
                                      style={{ border: `1px solid ${T.borderLight}`, backgroundColor: T.inputBg, color: T.text }}
                                    >
                                      <span>{line.vatRate}%</span>
                                      <ChevronDown className="h-2.5 w-2.5 opacity-50" />
                                    </button>
                                  }
                                >
                                  {['20', '10', '5.5', '0'].map(rate => (
                                    <DropdownItem
                                      key={rate}
                                      selected={line.vatRate === parseFloat(rate)}
                                      onClick={() => onUpdateLine(idx, { vatRate: parseFloat(rate) })}
                                    >
                                      {rate.replace('.', ',')}%
                                    </DropdownItem>
                                  ))}
                                </Dropdown>
                              </div>}
                        </div>
                      )}

                      {isSection && billingType === 'detailed' && detailedColumns.map((column) => (
                        <div key={`${line.id}-${column.key}`} />
                      ))}

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
                        <div className="px-0.5 py-2 flex flex-col items-center justify-center gap-0.5">
                          {canReorderLines && (
                            <button
                              type="button"
                              draggable
                              onDragStart={(event) => {
                                event.dataTransfer.effectAllowed = 'move'
                                event.dataTransfer.setData('text/plain', line.id)
                                handleLineDragStart(idx)
                              }}
                              onDragEnd={handleLineDragEnd}
                              className="w-5 h-5 rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                              style={{ color: T.inputPlaceholder }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.color = accentColor
                                e.currentTarget.style.backgroundColor = darkMode ? '#2a2a30' : '#eef2ff'
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.color = T.inputPlaceholder
                                e.currentTarget.style.backgroundColor = 'transparent'
                              }}
                              title={reorderLineLabel}
                            >
                              <GripVertical className="h-3 w-3" />
                            </button>
                          )}
                          {lines.length > 1 && (
                            <button type="button" onClick={() => onRemoveLine(idx)}
                              className="w-5 h-5 rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                              style={{ color: T.inputPlaceholder }}
                              onMouseEnter={(e) => { e.currentTarget.style.color = '#e53935'; e.currentTarget.style.backgroundColor = darkMode ? '#2a2a30' : '#fef2f2' }}
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

              {/* ── Add line dropdown (edit mode) — last page only ── */}
              {ed && showBottom && (
                <AddLineDropdown
                  isClassique={isClassique}
                  accentColor={accentColor}
                  T={T}
                  t={t}
                  onAddLine={onAddLine}
                  onCatalogClick={onCatalogClick}
                  disabled={tooMuchContent}
                  onDisabledClick={() =>
                    toast.warning('Limite de page atteinte', {
                      description: 'Supprimez du contenu avant d’ajouter de nouvelles lignes.',
                    })
                  }
                />
              )}

            </div>
            {/* ═══ END TOP SECTION ═══ */}

            {/* ═══════════════════════════════════════════
                 BOTTOM SECTION — always sticks to bottom
                ═══════════════════════════════════════════ */}
            {showBottom && (
            <div>

              {/* ── Totals ── */}
              <div className="flex justify-end mb-5" style={{ breakInside: 'avoid' }}>
                {isClassique ? (
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
                      {taxAmount > 0 && (
                        <div className="flex justify-between items-center pt-1" style={{ borderTop: `1px solid ${accentColor}30` }}>
                          <span className="text-[12px] font-semibold">{t.totalTVA}</span>
                          <span className="text-[12px] font-semibold">{fmtCurrency(taxAmount, lang)}</span>
                        </div>
                      )}
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
                    {taxAmount > 0 && (
                      <div className="flex justify-between py-1" style={{ borderBottom: `1px solid ${T.borderLight}` }}>
                        <span className="text-[10px] font-semibold" style={{ color: T.text }}>{t.totalTVA}</span>
                        <span className="text-[10px] font-semibold" style={{ color: T.text }}>{fmtCurrency(taxAmount, lang)}</span>
                      </div>
                    )}
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
              {vatExemptReason !== 'none' && (
                <div className="mb-3 text-[10px] italic" style={{ color: T.textMuted }}>
                  {vatExemptReason === 'not_subject'
                    ? (lang === 'en' ? 'VAT not applicable, article 293 B of the CGI' : 'TVA non applicable, article 293 B du CGI')
                    : vatExemptReason === 'france_no_vat'
                      ? (lang === 'en' ? 'VAT exemption, article 261 of the CGI' : 'Exonération de TVA, article 261 du CGI')
                      : (lang === 'en' ? 'VAT not applicable — service performed outside France, article 259-1 of the CGI' : 'TVA non applicable — prestation de services réalisée hors de France, article 259-1 du CGI')}
                </div>
              )}

              {vatOnDebits && (
                <div className="mb-3 text-[10px] italic" style={{ color: T.textMuted }}>
                  {lang === 'en' ? 'VAT payable on debits' : 'TVA acquittée d’après les débits'}
                </div>
              )}

              {/* ── Notes (editable, optional) ── */}
              {showNotes && (
                <div className="pt-3" style={{ borderTop: `1px solid ${T.borderLight}` }}>
                  <div className="text-[9px] uppercase tracking-[1px] font-semibold mb-1" style={{ color: T.textMuted }}>{t.conditionsAndNotes}</div>
                  {isPreview ? (
                    notes
                      ? <div className="text-[11px] leading-[1.6]" style={{ color: T.textMuted }} dangerouslySetInnerHTML={{ __html: mdToHtml(notes) }} />
                      : <p className="text-[11px] leading-[1.6] italic" style={{ color: T.inputPlaceholder }}>{t.noNotes}</p>
                  ) : (
                    <RichTextarea value={notes} onChange={onNotesChange}
                      placeholder={t.conditionsAndNotes}
                      className="text-[11px] leading-[1.6]"
                      style={{ color: T.textMuted }}
                      rows={2} />
                  )}
                </div>
              )}

              {showAcceptanceConditions && (
                <div className="mt-2">
                  <div className="text-[9px] uppercase tracking-[1px] font-semibold mb-1" style={{ color: hasError("Conditions d'acceptation") ? errorBorder : T.textMuted }}>{t.acceptanceConditions}</div>
                  {ed ? (
                    <RichTextarea
                      value={acceptanceConditions}
                      onChange={(v) => onAcceptanceConditionsChange?.(v)}
                      placeholder={lang === 'en' ? 'Acceptance conditions...' : "Conditions d'acceptation..."}
                      className="text-[11px] leading-[1.6]"
                      style={{ color: T.textMuted }}
                      rows={2}
                    />
                  ) : (
                    acceptanceConditions && <div className="text-[11px]" style={{ color: T.textMuted }} dangerouslySetInnerHTML={{ __html: mdToHtml(acceptanceConditions) }} />
                  )}
                </div>
              )}

              {showFreeField && (
                <div className="mt-2">
                  <div className="text-[9px] uppercase tracking-[1px] font-semibold mb-1" style={{ color: hasError('Champ libre') ? errorBorder : T.textMuted }}>{lang === 'en' ? 'Additional information' : 'Champ libre'}</div>
                  {ed ? (
                    <RichTextarea
                      value={freeField}
                      onChange={(v) => onFreeFieldChange?.(v)}
                      placeholder={lang === 'en' ? 'Additional text...' : 'Texte supplementaire...'}
                      className="text-[11px] leading-[1.6]"
                      style={{ color: T.textMuted }}
                      rows={2}
                    />
                  ) : (
                    freeField && <div className="text-[11px]" style={{ color: T.textMuted }} dangerouslySetInnerHTML={{ __html: mdToHtml(freeField) }} />
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

              {/* Payment method + bank account info — invoices only */}
              {isInvoice && paymentMethod && (
                <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${T.borderLight}` }}>
                  <div className="text-[9px] uppercase tracking-[1px] font-semibold mb-1.5" style={{ color: T.textMuted }}>
                    {lang === 'en' ? 'Payment method' : 'Moyen de paiement'}
                  </div>
                  <div className="text-[11px] leading-[1.7]" style={{ color: T.text }}>
                    <div className="font-semibold">
                      {paymentMethod === 'bank_transfer' ? (lang === 'en' ? 'Bank transfer' : 'Virement') : paymentMethod === 'stripe' ? (lang === 'en' ? 'Credit card (Stripe)' : 'Carte bancaire (Stripe)') : paymentMethod === 'cash' ? (lang === 'en' ? 'Cash' : 'Espèces') : ((paymentMethod === 'custom' || paymentMethod === 'other') && customPaymentMethod ? customPaymentMethod : (lang === 'en' ? 'Other' : 'Autre'))}
                    </div>
                    {paymentMethod === 'bank_transfer' && bankAccountInfo && (bankAccountInfo.iban || bankAccountInfo.bic || bankAccountInfo.bankName) && (
                      <div className="mt-1">
                        {bankAccountInfo.bankName && (
                          <div><span className="font-semibold">{lang === 'en' ? 'Bank' : 'Banque'} :</span> {bankAccountInfo.bankName}</div>
                        )}
                        {bankAccountInfo.iban && (
                          <div><span className="font-semibold">IBAN :</span> <span className="font-mono">{bankAccountInfo.iban.slice(0, 4) + ' **** **** ****'}</span></div>
                        )}
                        {bankAccountInfo.bic && (
                          <div><span className="font-semibold">BIC :</span> <span className="font-mono">{bankAccountInfo.bic.slice(0, 4) + '****'}</span></div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── Footer (company info / VAT exempt / custom text) ── */}
              {isClassique ? (
                <div className="mt-4 pt-3 text-center">
                  <div
                    style={{
                      border: `1px dashed ${T.editBorderDashed}`,
                      background: T.docBg,
                      padding: '6px 7px',
                    }}
                  >
                    {footerMode === 'custom' ? (
                      ed ? (
                        <RichTextarea
                          value={footerText || ''}
                          onChange={(v) => onFooterTextChange?.(v.slice(0, 50))}
                          placeholder={lang === 'en' ? 'Legal information' : 'Informations légales de ma société'}
                          className="text-[11px] leading-[1.6] text-center"
                          style={{ color: T.textFooter }}
                          rows={1}
                        />
                      ) : (
                        <div className="text-[11px] leading-[1.6]" style={{ color: T.textFooter }} dangerouslySetInnerHTML={{ __html: mdToHtml(footerText || '') }} />
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
                  {footerMode === 'custom' ? (
                    ed ? (
                      <RichTextarea
                        value={footerText || ''}
                        onChange={(v) => onFooterTextChange?.(v.slice(0, 50))}
                        placeholder={lang === 'en' ? 'Custom footer text...' : 'Ex: Conditions générales de vente...'}
                        className="text-[9px] leading-[1.6] text-center"
                        style={{ color: T.textFooter }}
                        rows={2}
                      />
                    ) : (
                      <div className="text-[9px] leading-[1.6]" style={{ color: T.textFooter }} dangerouslySetInnerHTML={{ __html: mdToHtml(footerText || '') }} />
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
            )}
            {/* ═══ END BOTTOM SECTION ═══ */}

          </div>
    )
  }

  // Shared visual surface of an A4 page (background gradient, shadow, scheme).
  const sheetSurface = {
    background: isClassique
      ? darkMode
        ? `linear-gradient(270deg, ${T.docBg}, #161618 23.44%, #161618 77.6%, ${T.docBg})`
        : 'linear-gradient(270deg, #fafafa, #fff 23.44%, #fff 77.6%, #fafafa)'
      : T.docBg,
    boxShadow: isClassique
      ? 'rgba(71,99,136,0.1) 0px 20px 40px -5px'
      : '0 4px 24px rgba(0,0,0,0.15), 0 1px 4px rgba(0,0,0,0.08)',
    colorScheme: (darkMode ? 'dark' : 'light') as 'dark' | 'light',
  }
  const overflowRing = overflows
    ? tooMuchContent
      ? 'ring-2 ring-red-500/60'
      : 'ring-2 ring-amber-500/60'
    : ''

  // Single A4 page frame — used when the document fits on one page.
  const renderSheetFrame = (children: ReactNode) => (
    <div
      className={cn('w-full max-w-[960px] rounded-xl relative overflow-hidden', overflowRing)}
      style={{ aspectRatio: '210 / 297', ...sheetSurface }}
    >
      <div className={cn('absolute inset-0', isPreview ? 'overflow-hidden' : 'overflow-y-auto')}>
        {children}
      </div>
    </div>
  )

  return (
    <div className="flex flex-col items-center gap-2.5">
      {/* ── Page-overflow banner ── */}
      {overflows && (
        <div
          className={cn(
            'w-full max-w-[960px] flex items-center gap-2 rounded-xl border px-3.5 py-2 text-[12px] font-medium',
            tooMuchContent
              ? 'bg-red-500/10 border-red-500/30 text-red-500'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-500'
          )}
        >
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            {tooMuchContent
              ? lang === 'en'
                ? 'This document exceeds 2 pages — remove content to continue.'
                : 'Cette facture dépasse 2 pages — supprimez du contenu pour continuer.'
              : lang === 'en'
                ? 'This document spans 2 pages.'
                : 'Cette facture s’étend sur 2 pages.'}
          </span>
        </div>
      )}

      {/* The document. When it overflows one page, it is rendered as TWO real
          separate A4 sheet cards stacked vertically — page 1 holds the rows
          that fit, page 2 ('Suite') holds the rest plus the totals/footer.
          The hidden instance below drives the split-point measurement. */}
      {paginate && overflows ? (
        <>
          {/* hidden measuring instance — full document at real A4 width */}
          <div
            aria-hidden
            inert
            className="pointer-events-none"
            style={{ position: 'absolute', left: -99999, top: 0, width: A4_SHEET_W }}
          >
            {renderDocumentBody('single', lines, 0, contentRef)}
          </div>

          <div ref={splitWrapRef} className="flex w-full justify-center">
            <div style={{ width: A4_SHEET_W * stackScale, height: STACK_TOTAL_H * stackScale }}>
              <div
                className="flex flex-col"
                style={{
                  width: A4_SHEET_W,
                  gap: STACK_GAP,
                  transform: `scale(${stackScale})`,
                  transformOrigin: 'top left',
                }}
              >
                {/* Page 1 */}
                <div
                  className={cn('shrink-0 rounded-xl relative overflow-hidden', overflowRing)}
                  style={{ width: A4_SHEET_W, height: A4_SHEET_H, ...sheetSurface }}
                >
                  <div className="absolute inset-0">
                    {renderDocumentBody('first', lines.slice(0, splitIndex), 0)}
                  </div>
                </div>
                {/* Page 2 */}
                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
                  className={cn('shrink-0 rounded-xl relative overflow-hidden', overflowRing)}
                  style={{ width: A4_SHEET_W, height: A4_SHEET_H, ...sheetSurface }}
                >
                  <div className={cn('absolute inset-0', isPreview ? 'overflow-hidden' : 'overflow-y-auto')}>
                    {renderDocumentBody('continuation', lines.slice(splitIndex), splitIndex)}
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </>
      ) : (
        renderSheetFrame(renderDocumentBody('single', lines, 0))
      )}
    </div>
  )
}
