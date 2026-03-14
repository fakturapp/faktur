'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/toast'
import { Spinner } from '@/components/ui/spinner'
import { Dialog, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { useInvoiceSettings } from '@/lib/invoice-settings-context'
import { TEMPLATES, getTemplate, type TemplateConfig } from '@/lib/invoice-templates'
import {
  ImagePlus,
  Palette,
  Banknote,
  Coins,
  PenLine,
  Lock,
  Check,
  Trash2,
  Eye,
  Zap,
  ClipboardList,
  LayoutTemplate,
  X,
  ChevronRight,
  Moon,
  Sun,
  Type,
  FileCheck,
  Info,
  Shield,
  AlertTriangle,
} from 'lucide-react'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
} satisfies Variants

const accentColors = [
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Bleu', value: '#3b82f6' },
  { name: 'Violet', value: '#8b5cf6' },
  { name: 'Rose', value: '#ec4899' },
  { name: 'Rouge', value: '#ef4444' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Vert', value: '#22c55e' },
  { name: 'Turquoise', value: '#14b8a6' },
  { name: 'Gris', value: '#6b7280' },
  { name: 'Noir', value: '#18181b' },
]

/* ═══════════════════════════════════════════════════════════
   TemplateThumbnail — realistic mini A4 skeleton per layout
   ═══════════════════════════════════════════════════════════ */

function TemplateThumbnail({
  tpl,
  accentColor,
  selected,
  size = 'sm',
  onClick,
}: {
  tpl: TemplateConfig
  accentColor: string
  selected: boolean
  size?: 'sm' | 'lg'
  onClick?: () => void
}) {
  const T = tpl
  const isLg = size === 'lg'
  const p = isLg ? 'p-3.5' : 'p-2'
  const contrastCol = '#ffffff'

  const Wrapper = onClick ? 'button' : 'div'

  return (
    <Wrapper onClick={onClick} className="group text-center w-full">
      <div
        className={`relative rounded-lg overflow-hidden transition-all ${
          selected
            ? 'ring-2 ring-primary ring-offset-2 ring-offset-card shadow-lg'
            : 'border border-border/60 hover:border-border hover:shadow-md'
        }`}
        style={{ aspectRatio: '210 / 297' }}
      >
        <div className={`h-full w-full ${p} flex flex-col relative`} style={{ backgroundColor: T.docBg }}>

          {/* ── CLASSIQUE: standard layout ── */}
          {T.id === 'classique' && (<>
            <div className="flex justify-between items-start mb-2">
              <div className="space-y-0.5">
                <div className="h-1.5 w-6 rounded-full" style={{ backgroundColor: T.borderLight }} />
                <div className="h-1 w-8 rounded-full" style={{ backgroundColor: T.borderLight }} />
              </div>
              <div className="rounded px-1.5 py-0.5" style={{ backgroundColor: `${accentColor}15` }}>
                <div className="h-1.5 w-5 rounded-full" style={{ backgroundColor: accentColor, opacity: 0.7 }} />
              </div>
            </div>
            <div className="rounded px-1 py-1 mb-2" style={{ backgroundColor: T.clientBlockBg, border: `0.5px solid ${T.clientBlockBorder}` }}>
              <div className="h-0.5 w-4 rounded-full mb-0.5" style={{ backgroundColor: T.textMuted, opacity: 0.3 }} />
              <div className="h-1 w-6 rounded-full mb-0.5" style={{ backgroundColor: T.text, opacity: 0.2 }} />
              <div className="h-0.5 w-8 rounded-full" style={{ backgroundColor: T.textMuted, opacity: 0.15 }} />
            </div>
          </>)}

          {/* ── MODERNE: full-width colored banner ── */}
          {T.id === 'moderne' && (<>
            <div className="rounded-md px-2 py-1.5 mb-2 -mx-1 -mt-1" style={{ backgroundColor: accentColor }}>
              <div className="flex justify-between items-center">
                <div className="h-2 w-7 rounded-full" style={{ backgroundColor: contrastCol, opacity: 0.6 }} />
                <div className="text-right">
                  <div className="h-1.5 w-5 rounded-full ml-auto" style={{ backgroundColor: contrastCol, opacity: 0.9 }} />
                  <div className="h-0.5 w-4 rounded-full ml-auto mt-0.5" style={{ backgroundColor: contrastCol, opacity: 0.5 }} />
                </div>
              </div>
            </div>
            <div className="flex gap-2 mb-2">
              <div className="flex-1 space-y-0.5">
                <div className="h-0.5 w-4 rounded-full" style={{ backgroundColor: T.textMuted, opacity: 0.3 }} />
                <div className="h-1 w-5 rounded-full" style={{ backgroundColor: T.text, opacity: 0.2 }} />
              </div>
              <div className="flex-1 space-y-0.5">
                <div className="h-0.5 w-4 rounded-full" style={{ backgroundColor: T.textMuted, opacity: 0.3 }} />
                <div className="h-1 w-6 rounded-full" style={{ backgroundColor: T.text, opacity: 0.2 }} />
              </div>
            </div>
          </>)}

          {/* ── COMPACT: sharp corners, tight, data-dense ── */}
          {T.id === 'compact' && (<>
            <div className="flex justify-between items-start mb-1">
              <div className="h-2 w-8 rounded-none bg-gray-200" />
              <div className="text-right space-y-0.5">
                <div className="h-1.5 w-5 rounded-none" style={{ backgroundColor: accentColor, opacity: 0.7 }} />
                <div className="h-0.5 w-4 rounded-none bg-gray-300" />
              </div>
            </div>
            <div className="border border-gray-300 px-1 py-0.5 mb-1">
              <div className="h-1 w-5 rounded-none bg-gray-200 mb-0.5" />
              <div className="h-0.5 w-8 rounded-none bg-gray-100" />
            </div>
          </>)}

          {/* ── ELEGANCE: thin lines, no backgrounds ── */}
          {T.id === 'elegance' && (<>
            <div className="flex justify-between items-start mb-1.5">
              <div className="space-y-0.5">
                <div className="h-1.5 w-7 rounded-full" style={{ backgroundColor: T.text, opacity: 0.15 }} />
                <div className="h-0.5 w-10 rounded-full" style={{ backgroundColor: T.textMuted, opacity: 0.1 }} />
              </div>
              <div className="h-1.5 w-6 rounded-full" style={{ backgroundColor: accentColor, opacity: 0.5 }} />
            </div>
            <div className="h-px mb-2" style={{ backgroundColor: accentColor, opacity: 0.3 }} />
            <div className="mb-2 pb-1" style={{ borderBottom: `0.5px solid ${T.borderLight}` }}>
              <div className="h-0.5 w-3 rounded-full mb-0.5" style={{ backgroundColor: accentColor, opacity: 0.4 }} />
              <div className="h-1 w-6 rounded-full" style={{ backgroundColor: T.text, opacity: 0.15 }} />
              <div className="h-0.5 w-8 rounded-full mt-0.5" style={{ backgroundColor: T.textMuted, opacity: 0.1 }} />
            </div>
          </>)}

          {/* ── AUDACIEUX: large bold banner, geometric ── */}
          {T.id === 'audacieux' && (<>
            <div className="rounded-xl px-2 py-2.5 mb-2 -mx-1 -mt-1 relative overflow-hidden" style={{ backgroundColor: accentColor }}>
              <div className="absolute -right-2 -top-2 w-8 h-8 rounded-full" style={{ backgroundColor: contrastCol, opacity: 0.08 }} />
              <div className="absolute -right-1 -bottom-3 w-6 h-6 rounded-full" style={{ backgroundColor: contrastCol, opacity: 0.05 }} />
              <div className="h-2.5 w-8 rounded-full mb-1" style={{ backgroundColor: contrastCol, opacity: 0.9 }} />
              <div className="h-1 w-5 rounded-full" style={{ backgroundColor: contrastCol, opacity: 0.5 }} />
            </div>
            <div className="rounded-lg px-1 py-1 mb-1.5" style={{ backgroundColor: T.clientBlockBg, border: `0.5px solid ${T.clientBlockBorder}` }}>
              <div className="h-1 w-5 rounded-full mb-0.5" style={{ backgroundColor: T.text, opacity: 0.2 }} />
              <div className="h-0.5 w-7 rounded-full" style={{ backgroundColor: T.textMuted, opacity: 0.15 }} />
            </div>
          </>)}

          {/* ── LATERAL: colored sidebar ── */}
          {T.id === 'lateral' && (<>
            <div className="absolute top-0 left-0 bottom-0 flex" style={{ width: '28%' }}>
              <div className="h-full w-full flex flex-col p-1.5 pt-2" style={{ backgroundColor: accentColor }}>
                <div className="h-2 w-5 rounded-full mb-1.5" style={{ backgroundColor: contrastCol, opacity: 0.8 }} />
                <div className="h-0.5 w-full rounded-full mb-0.5" style={{ backgroundColor: contrastCol, opacity: 0.3 }} />
                <div className="h-0.5 w-4/5 rounded-full mb-0.5" style={{ backgroundColor: contrastCol, opacity: 0.2 }} />
                <div className="h-0.5 w-3/5 rounded-full mb-2" style={{ backgroundColor: contrastCol, opacity: 0.2 }} />
                <div className="h-0.5 w-full rounded-full mb-0.5" style={{ backgroundColor: contrastCol, opacity: 0.15 }} />
                <div className="h-0.5 w-4/5 rounded-full" style={{ backgroundColor: contrastCol, opacity: 0.15 }} />
              </div>
            </div>
            <div style={{ marginLeft: '30%' }}>
              <div className="flex justify-between items-start mb-1.5">
                <div className="h-1 w-6 rounded-full" style={{ backgroundColor: T.text, opacity: 0.2 }} />
                <div className="h-1.5 w-5 rounded-full" style={{ backgroundColor: accentColor, opacity: 0.6 }} />
              </div>
              <div className="rounded px-1 py-0.5 mb-1.5" style={{ backgroundColor: T.clientBlockBg, border: `0.5px solid ${T.clientBlockBorder}` }}>
                <div className="h-1 w-5 rounded-full mb-0.5" style={{ backgroundColor: T.text, opacity: 0.15 }} />
                <div className="h-0.5 w-7 rounded-full" style={{ backgroundColor: T.textMuted, opacity: 0.1 }} />
              </div>
            </div>
          </>)}

          {/* ── MINIMALISTE: ultra-clean ── */}
          {T.id === 'minimaliste' && (<>
            <div className="flex justify-between items-start mb-3">
              <div className="h-2 w-7 rounded-full" style={{ backgroundColor: T.text, opacity: 0.1 }} />
              <div className="h-1 w-5 rounded-full" style={{ backgroundColor: accentColor, opacity: 0.4 }} />
            </div>
            <div className="h-px mb-3" style={{ backgroundColor: T.borderLight }} />
            <div className="space-y-0.5 mb-2">
              <div className="h-0.5 w-4 rounded-full" style={{ backgroundColor: T.textMuted, opacity: 0.2 }} />
              <div className="h-1 w-6 rounded-full" style={{ backgroundColor: T.text, opacity: 0.12 }} />
            </div>
          </>)}

          {/* ── DUO: two-color split header ── */}
          {T.id === 'duo' && (<>
            <div className="flex -mx-1 -mt-1 mb-2 overflow-hidden rounded-md">
              <div className="flex-1 px-1.5 py-1.5" style={{ backgroundColor: accentColor }}>
                <div className="h-2 w-6 rounded-full" style={{ backgroundColor: contrastCol, opacity: 0.7 }} />
                <div className="h-0.5 w-5 rounded-full mt-0.5" style={{ backgroundColor: contrastCol, opacity: 0.3 }} />
              </div>
              <div className="flex-1 px-1.5 py-1.5" style={{ backgroundColor: '#1e293b' }}>
                <div className="h-1.5 w-5 rounded-full ml-auto" style={{ backgroundColor: contrastCol, opacity: 0.8 }} />
                <div className="h-0.5 w-4 rounded-full ml-auto mt-0.5" style={{ backgroundColor: contrastCol, opacity: 0.4 }} />
              </div>
            </div>
            <div className="flex gap-1.5 mb-2">
              <div className="flex-1 space-y-0.5">
                <div className="h-1 w-5 rounded-full" style={{ backgroundColor: T.text, opacity: 0.2 }} />
                <div className="h-0.5 w-7 rounded-full" style={{ backgroundColor: T.textMuted, opacity: 0.12 }} />
              </div>
              <div className="flex-1 rounded px-1 py-0.5" style={{ backgroundColor: T.clientBlockBg, border: `0.5px solid ${T.clientBlockBorder}` }}>
                <div className="h-1 w-4 rounded-full" style={{ backgroundColor: T.text, opacity: 0.15 }} />
              </div>
            </div>
          </>)}

          {/* ── LIGNE: accent line separators ── */}
          {T.id === 'ligne' && (<>
            <div className="flex justify-between items-start mb-1">
              <div className="space-y-0.5">
                <div className="h-1.5 w-6 rounded-full" style={{ backgroundColor: T.text, opacity: 0.15 }} />
                <div className="h-0.5 w-9 rounded-full" style={{ backgroundColor: T.textMuted, opacity: 0.1 }} />
              </div>
              <div className="h-1.5 w-5 rounded-full" style={{ backgroundColor: accentColor, opacity: 0.6 }} />
            </div>
            <div className="h-[2px] mb-1.5 rounded-full" style={{ backgroundColor: accentColor, opacity: 0.5 }} />
            <div className="space-y-0.5 mb-1.5 pb-1" style={{ borderBottom: `1.5px solid ${accentColor}40` }}>
              <div className="h-1 w-5 rounded-full" style={{ backgroundColor: T.text, opacity: 0.15 }} />
              <div className="h-0.5 w-8 rounded-full" style={{ backgroundColor: T.textMuted, opacity: 0.1 }} />
            </div>
          </>)}

          {/* ── TIIME: dashed borders, purple accent, clean ── */}
          {T.id === 'tiime' && (<>
            <div className="flex justify-between items-start mb-2">
              <div className="space-y-0.5">
                <div className="h-2 w-8 rounded" style={{ backgroundColor: '#bfcee1', opacity: 0.4 }} />
                <div className="h-0.5 w-10 rounded-full" style={{ backgroundColor: '#88A0BF', opacity: 0.2 }} />
                <div className="h-0.5 w-7 rounded-full" style={{ backgroundColor: '#88A0BF', opacity: 0.15 }} />
              </div>
              <div className="space-y-0.5 mt-2">
                <div className="h-1 w-6 rounded-full border border-dashed" style={{ borderColor: '#bfcee1' }} />
                <div className="h-1 w-8 rounded-full border border-dashed" style={{ borderColor: '#bfcee1' }} />
              </div>
            </div>
            <div className="mb-1.5 pb-1">
              <div className="h-1 w-5 rounded-full" style={{ backgroundColor: accentColor, opacity: 0.6 }} />
            </div>
          </>)}

          {/* ── Common: table + totals (except lateral which offsets) ── */}
          <div style={T.id === 'lateral' ? { marginLeft: '30%' } : undefined} className="flex-1 flex flex-col">
            {/* Table header (shown for all) */}
            {!['classique', 'sombre', 'moderne', 'compact', 'elegance', 'audacieux', 'lateral', 'minimaliste', 'duo', 'ligne'].includes('_skip_') && (
              <>
                <div className="px-0.5 py-0.5 mb-px" style={{ backgroundColor: accentColor, borderRadius: T.id === 'compact' ? '0' : '2px 2px 0 0' }}>
                  <div className="flex gap-1">
                    <div className="h-0.5 w-4 rounded-full" style={{ backgroundColor: contrastCol, opacity: 0.6 }} />
                    <div className="flex-1" />
                    <div className="h-0.5 w-2 rounded-full" style={{ backgroundColor: contrastCol, opacity: 0.6 }} />
                  </div>
                </div>

                {/* Rows */}
                {[0, 1, 2].map((i) => (
                  <div key={i} className="px-0.5 py-[2px]" style={{ backgroundColor: i % 2 === 0 ? T.rowEven : T.rowOdd, borderBottom: `0.5px solid ${T.borderLight}` }}>
                    <div className="flex gap-0.5 items-center">
                      <div className="h-0.5 rounded-full" style={{ backgroundColor: T.text, opacity: 0.15, width: `${8 + i * 2}px` }} />
                      <div className="flex-1" />
                      <div className="h-0.5 w-2 rounded-full" style={{ backgroundColor: T.text, opacity: 0.1 }} />
                    </div>
                  </div>
                ))}
              </>
            )}

            <div className="flex-1" />

            {/* Total */}
            <div className="flex justify-end mt-1">
              <div className="rounded px-1 py-0.5" style={{ backgroundColor: `${accentColor}15`, borderRadius: T.id === 'compact' ? '0' : '3px' }}>
                <div className="h-1 w-6 rounded-full" style={{ backgroundColor: accentColor, opacity: 0.5 }} />
              </div>
            </div>

            {/* Footer */}
            <div className="mt-1 pt-0.5" style={{ borderTop: `0.5px solid ${T.footerBorder}` }}>
              <div className="h-0.5 w-full rounded-full" style={{ backgroundColor: T.textFooter, opacity: 0.15 }} />
            </div>
          </div>
        </div>

        {/* Selected check */}
        {selected && (
          <div className="absolute top-1.5 right-1.5">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary shadow">
              <Check className="h-3 w-3 text-primary-foreground" />
            </div>
          </div>
        )}
      </div>
      <p className={`text-[11px] mt-1.5 font-medium transition-colors ${selected ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`}>
        {T.name}
      </p>
      {isLg && (
        <p className="text-[10px] text-muted-foreground mt-0.5">{T.description}</p>
      )}
    </Wrapper>
  )
}

/* ═══════════════════════════════════════════════════════════
   TemplateModal — full modal for choosing templates
   ═══════════════════════════════════════════════════════════ */

function TemplateModal({
  open,
  onClose,
  accentColor,
  currentTemplate,
  onSelect,
}: {
  open: boolean
  onClose: () => void
  accentColor: string
  currentTemplate: string
  onSelect: (id: string) => void
}) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
            className="relative z-10 w-full max-w-3xl rounded-2xl border border-border bg-card shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Choisir un modele</h2>
                <p className="text-sm text-muted-foreground mt-0.5">11 modeles de mise en page pour vos documents</p>
              </div>
              <button
                onClick={onClose}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Template grid */}
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-5 gap-4">
                {TEMPLATES.map((tpl) => (
                  <TemplateThumbnail
                    key={tpl.id}
                    tpl={tpl}
                    accentColor={accentColor}
                    selected={currentTemplate === tpl.id}
                    size="lg"
                    onClick={() => {
                      onSelect(tpl.id)
                      onClose()
                    }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

/* ═══════════════════════════════════════════════════════════
   InvoiceSettingsPage — main page
   ═══════════════════════════════════════════════════════════ */

export default function InvoiceSettingsPage() {
  const { toast } = useToast()
  const { settings, loading, updateSettings, uploadLogo } = useInvoiceSettings()
  const [uploading, setUploading] = useState(false)
  const [templateModalOpen, setTemplateModalOpen] = useState(false)
  const [showEInvoicingModal, setShowEInvoicingModal] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const currentTemplate = getTemplate(settings.template, settings.darkMode)

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      await uploadLogo(file)
      toast('Logo mis a jour', 'success')
    } catch {
      toast('Erreur lors de l\'envoi du logo', 'error')
    }
    setUploading(false)
  }

  function handleRemoveLogo() {
    updateSettings({ logoUrl: null })
  }

  function togglePaymentMethod(method: string) {
    const current = settings.paymentMethods
    const updated = current.includes(method)
      ? current.filter((m) => m !== method)
      : [...current, method]
    updateSettings({ paymentMethods: updated })
  }

  if (loading) {
    return (
      <div className="space-y-6 px-4 lg:px-6 py-4 md:py-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="space-y-6">
            <Skeleton className="h-40 rounded-xl" />
            <Skeleton className="h-48 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-56 rounded-xl" />
          </div>
          <Skeleton className="h-[600px] rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      className="space-y-6 px-4 lg:px-6 py-4 md:py-6"
    >
      {/* Header */}
      <motion.div variants={fadeUp} custom={0}>
        <h1 className="text-2xl font-bold text-foreground">Facturation</h1>
        <p className="text-muted-foreground mt-1">
          Personnalisez vos factures et devis
        </p>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Settings Column */}
        <div className="space-y-6">

          {/* Template Selector — card with current + change button */}
          <motion.div variants={fadeUp} custom={1}>
            <Card className="overflow-hidden border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                    <LayoutTemplate className="h-4.5 w-4.5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-foreground">Modele de document</h2>
                    <p className="text-xs text-muted-foreground">Choisissez l&apos;apparence de vos factures et devis</p>
                  </div>
                </div>

                {/* Current template preview + change */}
                <button
                  onClick={() => setTemplateModalOpen(true)}
                  className="w-full flex items-center gap-4 rounded-xl border-2 border-border p-4 text-left transition-all hover:border-primary/40 hover:bg-primary/5 group"
                >
                  {/* Mini preview */}
                  <div className="w-16 shrink-0">
                    <TemplateThumbnail
                      tpl={currentTemplate}
                      accentColor={settings.accentColor}
                      selected={false}
                      size="sm"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{currentTemplate.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{currentTemplate.description}</p>
                    <p className="text-xs text-primary mt-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      Changer de modele <ChevronRight className="h-3 w-3" />
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                </button>

                {/* Dark mode toggle */}
                <button
                  onClick={() => updateSettings({ darkMode: !settings.darkMode })}
                  className={`mt-3 w-full flex items-center gap-3 rounded-xl border-2 p-3 text-left transition-all ${
                    settings.darkMode
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-muted-foreground/30'
                  }`}
                >
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${settings.darkMode ? 'bg-primary/10' : 'bg-muted'}`}>
                    {settings.darkMode ? <Moon className="h-4 w-4 text-primary" /> : <Sun className="h-4 w-4 text-muted-foreground" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">Mode sombre</p>
                    <p className="text-xs text-muted-foreground">Appliquer le theme sombre au document</p>
                  </div>
                  <div className={`h-5 w-5 rounded-md border-2 flex items-center justify-center transition-colors ${settings.darkMode ? 'border-primary bg-primary' : 'border-muted-foreground/30'}`}>
                    {settings.darkMode && <Check className="h-3 w-3 text-primary-foreground" />}
                  </div>
                </button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Billing Type */}
          <motion.div variants={fadeUp} custom={2}>
            <Card className="overflow-hidden border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                    <ClipboardList className="h-4.5 w-4.5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-foreground">Modele de facturation</h2>
                    <p className="text-xs text-muted-foreground">Choisissez le type de facture par defaut</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => updateSettings({ billingType: 'quick' })}
                    className={`relative rounded-xl border-2 p-4 text-left transition-all ${
                      settings.billingType === 'quick'
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-border hover:border-muted-foreground/30 hover:bg-muted/30'
                    }`}
                  >
                    {settings.billingType === 'quick' && (
                      <div className="absolute top-3 right-3">
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                          <Check className="h-3 w-3 text-primary-foreground" />
                        </div>
                      </div>
                    )}
                    <Zap className="h-5 w-5 text-primary mb-2" />
                    <p className="font-medium text-sm text-foreground">Rapide</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Facturation simplifiee avec les informations essentielles
                    </p>
                  </button>

                  <button
                    onClick={() => updateSettings({ billingType: 'detailed' })}
                    className={`relative rounded-xl border-2 p-4 text-left transition-all ${
                      settings.billingType === 'detailed'
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-border hover:border-muted-foreground/30 hover:bg-muted/30'
                    }`}
                  >
                    {settings.billingType === 'detailed' && (
                      <div className="absolute top-3 right-3">
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                          <Check className="h-3 w-3 text-primary-foreground" />
                        </div>
                      </div>
                    )}
                    <ClipboardList className="h-5 w-5 text-primary mb-2" />
                    <p className="font-medium text-sm text-foreground">Complet</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Factures detaillees avec TVA, remises, conditions et mentions
                    </p>
                  </button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Logo */}
          <motion.div variants={fadeUp} custom={3}>
            <Card className="overflow-hidden border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                    <ImagePlus className="h-4.5 w-4.5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-foreground">Logo</h2>
                    <p className="text-xs text-muted-foreground">Apparait sur vos factures et devis</p>
                  </div>
                </div>

                <div className="flex items-start gap-6">
                  <div className="relative group">
                    <div className="h-24 w-24 rounded-xl border-2 border-dashed border-border bg-muted/30 flex items-center justify-center overflow-hidden">
                      {settings.logoUrl ? (
                        <img src={settings.logoUrl} alt="Logo" className="h-full w-full object-contain p-2" />
                      ) : (
                        <ImagePlus className="h-8 w-8 text-muted-foreground/50" />
                      )}
                    </div>
                    {settings.logoUrl && (
                      <button
                        onClick={handleRemoveLogo}
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                  <div className="flex-1 space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Format recommande : PNG ou SVG, fond transparent, 500x500px minimum
                    </p>
                    <input ref={fileInputRef} type="file" accept="image/png,image/svg+xml,image/jpeg" className="hidden" onChange={handleLogoUpload} />
                    <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                      {uploading ? <><Spinner /> Envoi...</> : 'Telecharger un logo'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Accent Color */}
          <motion.div variants={fadeUp} custom={4}>
            <Card className="overflow-hidden border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                    <Palette className="h-4.5 w-4.5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-foreground">Couleur des factures et devis</h2>
                    <p className="text-xs text-muted-foreground">Couleur d&apos;accent utilisee dans vos documents</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2.5">
                    {accentColors.map((color) => (
                      <button
                        key={color.value}
                        onClick={() => updateSettings({ accentColor: color.value })}
                        className="group relative"
                        title={color.name}
                      >
                        <div
                          className={`h-9 w-9 rounded-lg transition-all ${
                            settings.accentColor === color.value
                              ? 'ring-2 ring-offset-2 ring-offset-card scale-110'
                              : 'hover:scale-105'
                          }`}
                          style={{
                            backgroundColor: color.value,
                            ...(settings.accentColor === color.value ? { '--tw-ring-color': color.value } as React.CSSProperties : {}),
                          }}
                        />
                        {settings.accentColor === color.value && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Check className="h-4 w-4 text-white drop-shadow-md" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg border border-border shrink-0" style={{ backgroundColor: settings.accentColor }} />
                    <Input
                      value={settings.accentColor}
                      onChange={(e) => updateSettings({ accentColor: e.target.value })}
                      placeholder="#6366f1"
                      className="font-mono text-sm max-w-[140px]"
                    />
                    <p className="text-xs text-muted-foreground">Code hexadecimal</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Document Font */}
          <motion.div variants={fadeUp} custom={5}>
            <Card className="overflow-hidden border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                    <Type className="h-4.5 w-4.5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-foreground">Police des documents</h2>
                    <p className="text-xs text-muted-foreground">Police utilisee sur les factures, devis et PDF</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'Lexend', label: 'Lexend', desc: 'Par defaut' },
                    { id: 'Inter', label: 'Inter', desc: 'Geometrique' },
                    { id: 'Poppins', label: 'Poppins', desc: 'Moderne' },
                    { id: 'Roboto', label: 'Roboto', desc: 'Classique' },
                    { id: 'Open Sans', label: 'Open Sans', desc: 'Lisible' },
                    { id: 'Lato', label: 'Lato', desc: 'Elegante' },
                    { id: 'Montserrat', label: 'Montserrat', desc: 'Professionnel' },
                    { id: 'Nunito', label: 'Nunito', desc: 'Arrondie' },
                  ].map((font) => (
                    <button
                      key={font.id}
                      onClick={() => updateSettings({ documentFont: font.id })}
                      className={`flex items-center gap-3 rounded-xl border-2 p-3 text-left transition-all ${
                        settings.documentFont === font.id ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/30'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground" style={{ fontFamily: `'${font.id}', sans-serif` }}>{font.label}</p>
                        <p className="text-[10px] text-muted-foreground">{font.desc}</p>
                      </div>
                      {settings.documentFont === font.id && (
                        <div className="h-5 w-5 rounded-md border-2 border-primary bg-primary flex items-center justify-center shrink-0">
                          <Check className="h-3 w-3 text-primary-foreground" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Payment Methods */}
          <motion.div variants={fadeUp} custom={6}>
            <Card className="overflow-hidden border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                    <Banknote className="h-4.5 w-4.5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-foreground">Moyens de paiement</h2>
                    <p className="text-xs text-muted-foreground">Modes de paiement affiches sur vos documents</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => togglePaymentMethod('bank_transfer')}
                    className={`flex w-full items-center gap-3 rounded-xl border-2 p-4 text-left transition-all ${
                      settings.paymentMethods.includes('bank_transfer') ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/30'
                    }`}
                  >
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${settings.paymentMethods.includes('bank_transfer') ? 'bg-primary/10' : 'bg-muted'}`}>
                      <Banknote className={`h-5 w-5 ${settings.paymentMethods.includes('bank_transfer') ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">Virement bancaire</p>
                      <p className="text-xs text-muted-foreground">IBAN, BIC et nom de la banque</p>
                    </div>
                    <div className={`h-5 w-5 rounded-md border-2 flex items-center justify-center transition-colors ${settings.paymentMethods.includes('bank_transfer') ? 'border-primary bg-primary' : 'border-muted-foreground/30'}`}>
                      {settings.paymentMethods.includes('bank_transfer') && <Check className="h-3 w-3 text-primary-foreground" />}
                    </div>
                  </button>

                  <button
                    onClick={() => togglePaymentMethod('cash')}
                    className={`flex w-full items-center gap-3 rounded-xl border-2 p-4 text-left transition-all ${
                      settings.paymentMethods.includes('cash') ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/30'
                    }`}
                  >
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${settings.paymentMethods.includes('cash') ? 'bg-primary/10' : 'bg-muted'}`}>
                      <Coins className={`h-5 w-5 ${settings.paymentMethods.includes('cash') ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">Especes</p>
                      <p className="text-xs text-muted-foreground">Paiement en especes</p>
                    </div>
                    <div className={`h-5 w-5 rounded-md border-2 flex items-center justify-center transition-colors ${settings.paymentMethods.includes('cash') ? 'border-primary bg-primary' : 'border-muted-foreground/30'}`}>
                      {settings.paymentMethods.includes('cash') && <Check className="h-3 w-3 text-primary-foreground" />}
                    </div>
                  </button>

                  <div>
                    <button
                      onClick={() => togglePaymentMethod('custom')}
                      className={`flex w-full items-center gap-3 rounded-xl border-2 p-4 text-left transition-all ${
                        settings.paymentMethods.includes('custom') ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/30'
                      }`}
                    >
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${settings.paymentMethods.includes('custom') ? 'bg-primary/10' : 'bg-muted'}`}>
                        <PenLine className={`h-5 w-5 ${settings.paymentMethods.includes('custom') ? 'text-primary' : 'text-muted-foreground'}`} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">Autre</p>
                        <p className="text-xs text-muted-foreground">Moyen de paiement personnalise</p>
                      </div>
                      <div className={`h-5 w-5 rounded-md border-2 flex items-center justify-center transition-colors ${settings.paymentMethods.includes('custom') ? 'border-primary bg-primary' : 'border-muted-foreground/30'}`}>
                        {settings.paymentMethods.includes('custom') && <Check className="h-3 w-3 text-primary-foreground" />}
                      </div>
                    </button>
                    {settings.paymentMethods.includes('custom') && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mt-2 ml-14">
                        <Input placeholder="Ex: Cheque, PayPal, etc." value={settings.customPaymentMethod} onChange={(e) => updateSettings({ customPaymentMethod: e.target.value })} className="text-sm" />
                      </motion.div>
                    )}
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider px-1">Bientot disponible</p>
                    {[
                      { name: 'Stripe', desc: 'Paiement en ligne par carte bancaire' },
                      { name: 'PayPal', desc: 'Paiement via compte PayPal' },
                    ].map((method) => (
                      <div key={method.name} className="flex items-center gap-3 rounded-xl border-2 border-border/50 p-4 opacity-50 cursor-not-allowed">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                          <Lock className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">{method.name}</p>
                          <p className="text-xs text-muted-foreground">{method.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* E-Invoicing — Facturation electronique */}
          <motion.div variants={fadeUp} custom={6}>
            <Card className="overflow-hidden border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                    <FileCheck className="h-4.5 w-4.5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-foreground">Facturation electronique</h2>
                    <p className="text-xs text-muted-foreground">Reforme 2026 — Factur-X, PDP et e-reporting</p>
                  </div>
                </div>

                {/* Info banner */}
                <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 mb-4">
                  <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-foreground leading-relaxed">
                      A partir de septembre 2026, toutes les entreprises francaises doivent emettre des factures electroniques au format structure (Factur-X, UBL ou CII) via une Plateforme de Dematerialisation Partenaire (PDP).
                    </p>
                  </div>
                </div>

                {/* Toggle activation */}
                <div className="flex items-center justify-between rounded-xl border-2 border-border p-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${settings.eInvoicingEnabled ? 'bg-primary/10' : 'bg-muted'}`}>
                      <Shield className={`h-5 w-5 ${settings.eInvoicingEnabled ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Activer la facturation electronique</p>
                      <p className="text-xs text-muted-foreground">Genere automatiquement le format Factur-X pour vos documents</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (!settings.eInvoicingEnabled) {
                        setShowEInvoicingModal(true)
                      } else {
                        updateSettings({ eInvoicingEnabled: false })
                      }
                    }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ${
                      settings.eInvoicingEnabled ? 'bg-primary' : 'bg-muted-foreground/30'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 rounded-full bg-white transition-transform shadow-sm ${
                        settings.eInvoicingEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* PDP Configuration (only when enabled) */}
                <AnimatePresence>
                  {settings.eInvoicingEnabled && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-4 pt-2">
                        <Separator />

                        {/* PDP Provider */}
                        <div>
                          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">Plateforme PDP</label>
                          <div className="grid grid-cols-2 gap-2">
                            {[
                              { id: 'chorus_pro', name: 'Chorus Pro (PPF)', desc: 'Portail public gratuit' },
                              { id: 'b2brouter', name: 'B2Brouter', desc: 'PDP privee avec API' },
                              { id: 'seqino', name: 'Seqino', desc: 'API marque blanche' },
                              { id: 'other', name: 'Autre PDP', desc: 'Configuration manuelle' },
                            ].map((pdp) => (
                              <button
                                key={pdp.id}
                                onClick={() => updateSettings({ pdpProvider: pdp.id })}
                                className={`rounded-xl border-2 p-3 text-left transition-all ${
                                  settings.pdpProvider === pdp.id
                                    ? 'border-primary bg-primary/5'
                                    : 'border-border hover:border-muted-foreground/30'
                                }`}
                              >
                                <p className="text-xs font-medium text-foreground">{pdp.name}</p>
                                <p className="text-[10px] text-muted-foreground">{pdp.desc}</p>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* API Key */}
                        {settings.pdpProvider && settings.pdpProvider !== 'chorus_pro' && (
                          <div>
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">Cle API PDP</label>
                            <Input
                              type="password"
                              placeholder="Votre cle API..."
                              value={settings.pdpApiKey === '••••••••' ? '' : (settings.pdpApiKey || '')}
                              onChange={(e) => updateSettings({ pdpApiKey: e.target.value })}
                              className="text-sm"
                            />
                            <p className="text-[10px] text-muted-foreground mt-1">
                              Obtenez votre cle API depuis le tableau de bord de votre PDP
                            </p>
                          </div>
                        )}

                        {/* Sandbox mode */}
                        <div className="flex items-center justify-between rounded-lg border border-border p-3">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-yellow-500" />
                            <div>
                              <p className="text-xs font-medium text-foreground">Mode sandbox</p>
                              <p className="text-[10px] text-muted-foreground">Tester sans envoyer de vraies factures</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => updateSettings({ pdpSandbox: !settings.pdpSandbox })}
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors shrink-0 ${
                              settings.pdpSandbox ? 'bg-yellow-500' : 'bg-muted-foreground/30'
                            }`}
                          >
                            <span
                              className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform shadow-sm ${
                                settings.pdpSandbox ? 'translate-x-[18px]' : 'translate-x-[3px]'
                              }`}
                            />
                          </button>
                        </div>

                        {/* Features list */}
                        <div className="rounded-lg border border-border p-3 space-y-2">
                          <p className="text-xs font-medium text-foreground mb-2">Fonctionnalites incluses</p>
                          {[
                            'Generation automatique Factur-X (PDF/A-3)',
                            'Envoi via PDP vers la DGFiP',
                            'E-reporting automatique',
                            'Archivage certifie 10 ans',
                            'Suivi des statuts en temps reel',
                          ].map((feature) => (
                            <div key={feature} className="flex items-center gap-2">
                              <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                              <span className="text-[11px] text-muted-foreground">{feature}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>

          {/* Auto-save indicator */}
          <motion.div variants={fadeUp} custom={7} className="flex justify-end">
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-green-500" />
              Enregistrement automatique
            </p>
          </motion.div>
        </div>

        {/* Preview Column — A4-like document using current template */}
        <motion.div variants={fadeUp} custom={2}>
          <div className="sticky top-6">
            <Card className="overflow-hidden border-border/50">
              <CardContent className="p-0">
                {/* Preview header */}
                <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium text-foreground">Apercu du document</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {currentTemplate.name} &middot; {settings.billingType === 'quick' ? 'Rapide' : 'Complet'}
                  </p>
                </div>

                {/* A4 Document Preview */}
                <div className="p-4 bg-muted/30">
                  <div
                    className="rounded-lg shadow-sm overflow-hidden relative mx-auto"
                    style={{
                      aspectRatio: '210 / 270',
                      maxHeight: '420px',
                      backgroundColor: currentTemplate.docBg,
                      border: settings.darkMode ? '1px solid #3f3f46' : '1px solid #e5e7eb',
                    }}
                  >
                    <div className="h-full flex flex-col p-5 relative">

                      {/* Banner header */}
                      {currentTemplate.layout === 'banner' && (
                        <div className="rounded-lg px-4 py-3 mb-4 -mx-2 -mt-2" style={{ backgroundColor: settings.accentColor }}>
                          <div className="flex justify-between items-center">
                            {settings.logoUrl ? (
                              <img src={settings.logoUrl} alt="Logo" className="h-7 w-auto max-w-[80px] object-contain" />
                            ) : (
                              <div className="h-2.5 w-16 rounded-full" style={{ backgroundColor: '#fff', opacity: 0.5 }} />
                            )}
                            <p className="text-xs font-bold tracking-wide" style={{ color: '#fff' }}>
                              FACTURE
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Standard header */}
                      {currentTemplate.layout !== 'banner' && (
                        <div className="flex items-start justify-between mb-5">
                          <div className="space-y-2">
                            {settings.logoUrl ? (
                              <img src={settings.logoUrl} alt="Logo" className="h-10 w-auto max-w-[120px] object-contain" />
                            ) : (
                              <div className="h-10 w-20 border border-dashed flex items-center justify-center" style={{ borderRadius: currentTemplate.borderRadius, backgroundColor: currentTemplate.borderLight, borderColor: currentTemplate.editBorderDashed }}>
                                <ImagePlus className="h-5 w-5" style={{ color: currentTemplate.editBorderDashed }} />
                              </div>
                            )}
                            <div className="space-y-0.5">
                              <div className="h-2 w-24 rounded-full" style={{ backgroundColor: currentTemplate.borderLight }} />
                              <div className="h-1.5 w-32 rounded-full" style={{ backgroundColor: currentTemplate.borderLight, opacity: 0.6 }} />
                              <div className="h-1.5 w-28 rounded-full" style={{ backgroundColor: currentTemplate.borderLight, opacity: 0.6 }} />
                            </div>
                          </div>
                          <div className="text-right space-y-1">
                            <p className="text-sm font-bold tracking-wide" style={{ color: settings.accentColor }}>FACTURE</p>
                            <p className="text-[10px] font-medium" style={{ color: currentTemplate.textMuted }}>#F-2026-001</p>
                            <p className="text-[10px]" style={{ color: currentTemplate.textMuted }}>14/03/2026</p>
                          </div>
                        </div>
                      )}

                      {/* Accent divider */}
                      <div className="h-[2px] rounded-full mb-5" style={{ backgroundColor: settings.accentColor }} />

                      {/* Addresses */}
                      <div className="grid grid-cols-2 gap-6 mb-6">
                        <div className="space-y-1">
                          <p className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: settings.accentColor }}>Emetteur</p>
                          <div className="space-y-0.5">
                            <div className="h-2 w-28 rounded-full" style={{ backgroundColor: currentTemplate.borderLight }} />
                            <div className="h-1.5 w-36 rounded-full" style={{ backgroundColor: currentTemplate.borderLight, opacity: 0.6 }} />
                            <div className="h-1.5 w-24 rounded-full" style={{ backgroundColor: currentTemplate.borderLight, opacity: 0.6 }} />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: settings.accentColor }}>Client</p>
                          <div className="space-y-0.5">
                            <div className="h-2 w-24 rounded-full" style={{ backgroundColor: currentTemplate.borderLight }} />
                            <div className="h-1.5 w-32 rounded-full" style={{ backgroundColor: currentTemplate.borderLight, opacity: 0.6 }} />
                            <div className="h-1.5 w-28 rounded-full" style={{ backgroundColor: currentTemplate.borderLight, opacity: 0.6 }} />
                          </div>
                        </div>
                      </div>

                      {/* Items table */}
                      <div className="flex-1 min-h-0">
                        <div className="px-3 py-2 flex items-center" style={{ backgroundColor: settings.accentColor + '12', borderTopLeftRadius: currentTemplate.borderRadius, borderTopRightRadius: currentTemplate.borderRadius }}>
                          <div className="flex w-full items-center gap-2">
                            <div className="h-1.5 w-20 rounded-full" style={{ backgroundColor: settings.accentColor + '50' }} />
                            <div className="flex-1" />
                            {settings.billingType === 'detailed' && (<>
                              <div className="h-1.5 w-8 rounded-full" style={{ backgroundColor: settings.accentColor + '50' }} />
                              <div className="h-1.5 w-10 rounded-full" style={{ backgroundColor: settings.accentColor + '50' }} />
                            </>)}
                            <div className="h-1.5 w-8 rounded-full" style={{ backgroundColor: settings.accentColor + '50' }} />
                            <div className="h-1.5 w-12 rounded-full" style={{ backgroundColor: settings.accentColor + '50' }} />
                          </div>
                        </div>
                        {[...Array(settings.billingType === 'detailed' ? 4 : 3)].map((_, i) => (
                          <div key={i} className="px-3 py-2.5 flex items-center" style={{ backgroundColor: i % 2 === 0 ? currentTemplate.rowEven : currentTemplate.rowOdd, borderBottom: i < (settings.billingType === 'detailed' ? 3 : 2) ? `1px solid ${currentTemplate.borderLight}` : undefined }}>
                            <div className="flex w-full items-center gap-2">
                              <div className="h-1.5 rounded-full" style={{ width: `${60 + (i % 3) * 15}px`, backgroundColor: currentTemplate.borderLight }} />
                              <div className="flex-1" />
                              {settings.billingType === 'detailed' && (<>
                                <div className="h-1.5 w-6 rounded-full" style={{ backgroundColor: currentTemplate.borderLight, opacity: 0.6 }} />
                                <div className="h-1.5 w-8 rounded-full" style={{ backgroundColor: currentTemplate.borderLight, opacity: 0.6 }} />
                              </>)}
                              <div className="h-1.5 w-6 rounded-full" style={{ backgroundColor: currentTemplate.borderLight, opacity: 0.6 }} />
                              <div className="h-1.5 w-10 rounded-full" style={{ backgroundColor: currentTemplate.borderLight }} />
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Totals */}
                      <div className="flex justify-end mt-4 mb-4">
                        <div className="w-48 space-y-1.5">
                          {settings.billingType === 'detailed' && (<>
                            <div className="flex items-center justify-between">
                              <p className="text-[9px]" style={{ color: currentTemplate.textMuted }}>Sous-total HT</p>
                              <div className="h-1.5 w-14 rounded-full" style={{ backgroundColor: currentTemplate.borderLight }} />
                            </div>
                            <div className="flex items-center justify-between">
                              <p className="text-[9px]" style={{ color: currentTemplate.textMuted }}>TVA (20%)</p>
                              <div className="h-1.5 w-10 rounded-full" style={{ backgroundColor: currentTemplate.borderLight }} />
                            </div>
                            <div className="h-px my-1" style={{ backgroundColor: currentTemplate.borderLight }} />
                          </>)}
                          <div className="flex items-center justify-between px-3 py-2" style={{ backgroundColor: settings.accentColor + currentTemplate.totalBg, borderRadius: currentTemplate.borderRadius }}>
                            <p className="text-[10px] font-semibold" style={{ color: settings.accentColor }}>Total TTC</p>
                            <p className="text-xs font-bold" style={{ color: settings.accentColor }}>1 234,00 EUR</p>
                          </div>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="pt-3 mt-auto space-y-2" style={{ borderTop: `1px solid ${currentTemplate.borderLight}` }}>
                        {settings.paymentMethods.length > 0 && (
                          <div>
                            <p className="text-[8px] font-semibold uppercase tracking-wider mb-1" style={{ color: currentTemplate.textMuted }}>Moyens de paiement</p>
                            <div className="flex flex-wrap gap-1.5">
                              {settings.paymentMethods.includes('bank_transfer') && (
                                <span className="text-[8px] rounded-md px-2 py-0.5" style={{ backgroundColor: currentTemplate.paymentBadgeBg, border: `1px solid ${currentTemplate.paymentBadgeBorder}`, color: currentTemplate.paymentBadgeText }}>Virement</span>
                              )}
                              {settings.paymentMethods.includes('cash') && (
                                <span className="text-[8px] rounded-md px-2 py-0.5" style={{ backgroundColor: currentTemplate.paymentBadgeBg, border: `1px solid ${currentTemplate.paymentBadgeBorder}`, color: currentTemplate.paymentBadgeText }}>Especes</span>
                              )}
                              {settings.paymentMethods.includes('custom') && settings.customPaymentMethod && (
                                <span className="text-[8px] rounded-md px-2 py-0.5" style={{ backgroundColor: currentTemplate.paymentBadgeBg, border: `1px solid ${currentTemplate.paymentBadgeBorder}`, color: currentTemplate.paymentBadgeText }}>{settings.customPaymentMethod}</span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>

      {/* Template Selection Modal */}
      <TemplateModal
        open={templateModalOpen}
        onClose={() => setTemplateModalOpen(false)}
        accentColor={settings.accentColor}
        currentTemplate={settings.template}
        onSelect={(id) => updateSettings({ template: id })}
      />

      {/* E-Invoicing Confirmation Modal */}
      <Dialog open={showEInvoicingModal} onClose={() => setShowEInvoicingModal(false)}>
        <div className="p-6 max-w-md">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <FileCheck className="h-6 w-6 text-primary" />
            </div>
            <div>
              <DialogTitle>Activer la facturation electronique</DialogTitle>
              <DialogDescription>Reforme obligatoire a partir de septembre 2026</DialogDescription>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <p className="text-sm text-muted-foreground leading-relaxed">
              En activant cette option, vos documents seront generes au format Factur-X (PDF/A-3) conforme aux exigences de la reforme francaise.
            </p>
            <div className="rounded-lg border border-border p-3 space-y-2">
              {[
                'Vos PDF incluront les metadonnees XML structurees',
                'Compatible avec toutes les PDP agreees',
                'Aucun impact sur vos documents existants',
              ].map((item) => (
                <div key={item} className="flex items-start gap-2">
                  <Check className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                  <span className="text-xs text-foreground">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowEInvoicingModal(false)}>
              Annuler
            </Button>
            <Button
              onClick={() => {
                updateSettings({ eInvoicingEnabled: true })
                setShowEInvoicingModal(false)
                toast('Facturation electronique activee', 'success')
              }}
            >
              <FileCheck className="h-4 w-4 mr-2" />
              Activer
            </Button>
          </DialogFooter>
        </div>
      </Dialog>
    </motion.div>
  )
}
