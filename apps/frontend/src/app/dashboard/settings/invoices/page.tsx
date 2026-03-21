'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs } from '@/components/ui/tabs'
import { useToast } from '@/components/ui/toast'
import { Spinner } from '@/components/ui/spinner'
import { Dialog, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { useInvoiceSettings } from '@/lib/invoice-settings-context'
import { TEMPLATES, getTemplate } from '@/lib/invoice-templates'
import { TemplateThumbnail } from '@/components/shared/template-thumbnail'
import { Badge } from '@/components/ui/badge'
import { AnthropicIcon } from '@/components/icons/anthropic-icon'
import { GoogleIcon } from '@/components/icons/google-icon'
import { GroqIcon } from '@/components/icons/groq-icon'
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
  EyeOff,
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
  Settings2,
  Paintbrush,
  FileText,
  Building2,
  FlaskConical,
  Sparkles,
  Bot,
  Key,
  ExternalLink,
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

const settingsTabs = [
  { id: 'apparence', label: 'Apparence', icon: <Paintbrush className="h-4 w-4" /> },
  { id: 'options', label: 'Options', icon: <Settings2 className="h-4 w-4" /> },
  { id: 'defauts', label: 'Valeurs par defaut', icon: <ClipboardList className="h-4 w-4" /> },
  { id: 'efacturation', label: 'E-Facturation', icon: <FileCheck className="h-4 w-4" />, badge: 'Bêta' },
  { id: 'ia', label: 'Intelligence artificielle', icon: <Sparkles className="h-4 w-4" /> },
]

/* ═══════════════════════════════════════════════════════════
   TemplateModal
   ═══════════════════════════════════════════════════════════ */

function TemplateModal({
  open, onClose, accentColor, currentTemplate, onSelect,
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
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
            className="relative z-10 w-full max-w-3xl rounded-2xl border border-border bg-card shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Choisir un modèle</h2>
                <p className="text-sm text-muted-foreground mt-0.5">9 modèles de mise en page pour vos documents</p>
              </div>
              <button onClick={onClose} className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-5 gap-4">
                {TEMPLATES.map((tpl) => (
                  <TemplateThumbnail key={tpl.id} tpl={tpl} accentColor={accentColor} selected={currentTemplate === tpl.id} size="lg"
                    onClick={() => { onSelect(tpl.id); onClose() }} />
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
   InvoiceSettingsPage — main page with tabs
   ═══════════════════════════════════════════════════════════ */

export default function InvoiceSettingsPage() {
  const { toast } = useToast()
  const { settings, companyLogoUrl, loading, updateSettings, uploadLogo, refreshCompanyLogo } = useInvoiceSettings()
  const [uploading, setUploading] = useState(false)
  const [templateModalOpen, setTemplateModalOpen] = useState(false)
  const [showEInvoicingModal, setShowEInvoicingModal] = useState(false)
  const [showBetaWarningModal, setShowBetaWarningModal] = useState(false)
  const [activeTab, setActiveTab] = useState('apparence')
  const [aiKeyMode, setAiKeyMode] = useState<'server' | 'custom'>('server')
  const [showAiKey, setShowAiKey] = useState(false)
  const [showPdpKey, setShowPdpKey] = useState(false)
  const [aiKeyModalProvider, setAiKeyModalProvider] = useState<'claude' | 'gemini' | 'groq' | null>(null)
  const [aiKeyModalValue, setAiKeyModalValue] = useState('')
  const [aiKeyModalShow, setAiKeyModalShow] = useState(false)
  const [aiDeleteConfirmProvider, setAiDeleteConfirmProvider] = useState<'claude' | 'gemini' | 'groq' | null>(null)

  useEffect(() => {
    const hasAnyKey = settings.aiApiKeyClaude || settings.aiApiKeyGemini || settings.aiApiKeyGroq ||
      (settings.aiCustomApiKey && settings.aiCustomApiKey !== '••••••••')
    if (hasAnyKey) {
      setAiKeyMode('custom')
    } else if (settings.aiCustomApiKey === '••••••••') {
      setAiKeyMode('custom')
    }
  }, [settings.aiCustomApiKey, settings.aiApiKeyClaude, settings.aiApiKeyGemini, settings.aiApiKeyGroq])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const currentTemplate = getTemplate(settings.template, settings.darkMode)
  const effectiveLogoUrl = settings.logoSource === 'company' ? companyLogoUrl : settings.logoUrl

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      await uploadLogo(file)
      toast('Logo mis à jour', 'success')
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
        {/* Header */}
        <div className="space-y-2">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-64" />
        </div>
        {/* Tabs */}
        <div className="flex gap-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-9 w-28 rounded-lg" />
          ))}
        </div>
        {/* Two-column layout */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="space-y-6">
            {/* Template card */}
            <div className="rounded-xl border border-border/50 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Skeleton className="h-9 w-9 rounded-lg" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-3 w-56" />
                </div>
              </div>
              <div className="flex items-center gap-4 rounded-xl border border-border p-4">
                <Skeleton className="w-16 rounded" style={{ aspectRatio: '210/297' }} />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-40" />
                </div>
                <Skeleton className="h-5 w-5 rounded" />
              </div>
            </div>
            {/* Logo card */}
            <div className="rounded-xl border border-border/50 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Skeleton className="h-9 w-9 rounded-lg" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-3 w-44" />
                </div>
              </div>
              <div className="flex items-start gap-6">
                <Skeleton className="h-24 w-24 rounded-xl shrink-0" />
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-3.5 w-full max-w-xs" />
                  <Skeleton className="h-8 w-32 rounded-lg" />
                </div>
              </div>
            </div>
            {/* Color card */}
            <div className="rounded-xl border border-border/50 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Skeleton className="h-9 w-9 rounded-lg" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-44" />
                  <Skeleton className="h-3 w-52" />
                </div>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {[...Array(10)].map((_, i) => (
                  <Skeleton key={i} className="h-9 w-9 rounded-lg" />
                ))}
              </div>
            </div>
          </div>
          {/* Preview */}
          <div className="rounded-xl border border-border/50 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4 rounded" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-3 w-28" />
            </div>
            <div className="p-4 bg-muted/30">
              <Skeleton className="w-full rounded-lg" style={{ aspectRatio: '210/270' }} />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <motion.div initial="hidden" animate="visible" className="space-y-6 px-4 lg:px-6 py-4 md:py-6">
      {/* Header */}
      <motion.div variants={fadeUp} custom={0}>
        <h1 className="text-2xl font-bold text-foreground">Facturation</h1>
        <p className="text-muted-foreground mt-1">Personnalisez vos factures et devis</p>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={fadeUp} custom={1}>
        <Tabs tabs={settingsTabs} activeTab={activeTab} onChange={setActiveTab} />
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Settings Column */}
        <div className="space-y-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >

              {/* ═══════════════════════════════════════
                   TAB: APPARENCE
                   ═══════════════════════════════════════ */}
              {activeTab === 'apparence' && (<>
                {/* Template Selector */}
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
                    <button onClick={() => setTemplateModalOpen(true)}
                      className="w-full flex items-center gap-4 rounded-xl border-2 border-border p-4 text-left transition-all hover:border-primary/40 hover:bg-primary/5 group">
                      <div className="w-16 shrink-0">
                        <TemplateThumbnail tpl={currentTemplate} accentColor={settings.accentColor} selected={false} size="sm" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground">{currentTemplate.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{currentTemplate.description}</p>
                        <p className="text-xs text-primary mt-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          Changer de modèle <ChevronRight className="h-3 w-3" />
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                    </button>
                    <button onClick={() => updateSettings({ darkMode: !settings.darkMode })}
                      className={`mt-3 w-full flex items-center gap-3 rounded-xl border-2 p-3 text-left transition-all ${
                        settings.darkMode ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/30'
                      }`}>
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${settings.darkMode ? 'bg-primary/10' : 'bg-muted'}`}>
                        {settings.darkMode ? <Moon className="h-4 w-4 text-primary" /> : <Sun className="h-4 w-4 text-muted-foreground" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">Mode sombre</p>
                        <p className="text-xs text-muted-foreground">Appliquer le thème sombre au document</p>
                      </div>
                      <div className={`h-5 w-5 rounded-md border-2 flex items-center justify-center transition-colors ${settings.darkMode ? 'border-primary bg-primary' : 'border-muted-foreground/30'}`}>
                        {settings.darkMode && <Check className="h-3 w-3 text-primary-foreground" />}
                      </div>
                    </button>
                  </CardContent>
                </Card>

                {/* Logo */}
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

                    {/* Logo source selector */}
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      <button onClick={() => updateSettings({ logoSource: 'custom' })}
                        className={`flex items-center gap-2.5 rounded-xl border-2 p-3 text-left transition-all ${
                          settings.logoSource === 'custom' ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/30'
                        }`}>
                        <div className={`flex h-8 w-8 items-center justify-center rounded-lg shrink-0 ${settings.logoSource === 'custom' ? 'bg-primary/10' : 'bg-muted'}`}>
                          <ImagePlus className={`h-4 w-4 ${settings.logoSource === 'custom' ? 'text-primary' : 'text-muted-foreground'}`} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-foreground">Logo personnalisé</p>
                          <p className="text-[10px] text-muted-foreground">Importer votre propre logo</p>
                        </div>
                        {settings.logoSource === 'custom' && (
                          <div className="h-4 w-4 rounded-md border-2 border-primary bg-primary flex items-center justify-center shrink-0 ml-auto">
                            <Check className="h-2.5 w-2.5 text-primary-foreground" />
                          </div>
                        )}
                      </button>
                      <button onClick={() => { updateSettings({ logoSource: 'company' }); refreshCompanyLogo() }}
                        className={`flex items-center gap-2.5 rounded-xl border-2 p-3 text-left transition-all ${
                          settings.logoSource === 'company' ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/30'
                        }`}>
                        <div className={`flex h-8 w-8 items-center justify-center rounded-lg shrink-0 ${settings.logoSource === 'company' ? 'bg-primary/10' : 'bg-muted'}`}>
                          <Building2 className={`h-4 w-4 ${settings.logoSource === 'company' ? 'text-primary' : 'text-muted-foreground'}`} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-foreground">Logo entreprise</p>
                          <p className="text-[10px] text-muted-foreground">Utiliser celui de l&apos;entreprise</p>
                        </div>
                        {settings.logoSource === 'company' && (
                          <div className="h-4 w-4 rounded-md border-2 border-primary bg-primary flex items-center justify-center shrink-0 ml-auto">
                            <Check className="h-2.5 w-2.5 text-primary-foreground" />
                          </div>
                        )}
                      </button>
                    </div>

                    {settings.logoSource === 'custom' ? (
                      <div className="flex items-start gap-6">
                        <div className="relative group">
                          <div className="h-24 w-24 border-2 border-dashed border-border bg-muted/30 flex items-center justify-center overflow-hidden" style={{ borderRadius: `${settings.logoBorderRadius}px` }}>
                            {settings.logoUrl ? (
                              <img src={settings.logoUrl} alt="Logo" className="h-full w-full object-contain p-2" style={{ borderRadius: `${settings.logoBorderRadius}px` }} />
                            ) : (
                              <ImagePlus className="h-8 w-8 text-muted-foreground/50" />
                            )}
                          </div>
                          {settings.logoUrl && (
                            <button onClick={handleRemoveLogo}
                              className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                        <div className="flex-1 space-y-3">
                          <p className="text-sm text-muted-foreground">Format recommandé : PNG ou SVG, fond transparent, 500x500px minimum</p>
                          <input ref={fileInputRef} type="file" accept="image/png,image/svg+xml,image/jpeg" className="hidden" onChange={handleLogoUpload} />
                          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                            {uploading ? <><Spinner /> Envoi...</> : 'Télécharger un logo'}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-4 rounded-xl border border-border p-4">
                        <div className="h-16 w-16 bg-muted/30 flex items-center justify-center overflow-hidden shrink-0" style={{ borderRadius: `${settings.logoBorderRadius}px` }}>
                          {companyLogoUrl ? (
                            <img src={companyLogoUrl} alt="Logo entreprise" className="h-full w-full object-contain p-2" style={{ borderRadius: `${settings.logoBorderRadius}px` }} />
                          ) : (
                            <Building2 className="h-6 w-6 text-muted-foreground/50" />
                          )}
                        </div>
                        <div className="flex-1">
                          {companyLogoUrl ? (
                            <p className="text-sm text-muted-foreground">Le logo de votre entreprise sera utilisé sur vos documents.</p>
                          ) : (
                            <p className="text-sm text-muted-foreground">Aucun logo d&apos;entreprise configuré. Ajoutez-en un dans la page <a href="/dashboard/company" className="text-primary underline underline-offset-2">Entreprise</a>.</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Border Radius Slider */}
                    {effectiveLogoUrl && (
                      <div className="mt-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-medium text-muted-foreground">Arrondi du logo</label>
                          <span className="text-xs text-muted-foreground tabular-nums">{settings.logoBorderRadius}px</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={50}
                          value={settings.logoBorderRadius}
                          onChange={(e) => updateSettings({ logoBorderRadius: Number(e.target.value) })}
                          className="w-full h-1.5 bg-muted rounded-full appearance-none cursor-pointer accent-primary"
                        />
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                          <span>Carré</span>
                          <span>Arrondi</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Accent Color */}
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
                          <button key={color.value} onClick={() => updateSettings({ accentColor: color.value })} className="group relative" title={color.name}>
                            <div className={`h-9 w-9 rounded-lg transition-all ${
                              settings.accentColor === color.value ? 'ring-2 ring-offset-2 ring-offset-card scale-110' : 'hover:scale-105'
                            }`} style={{ backgroundColor: color.value, ...(settings.accentColor === color.value ? { '--tw-ring-color': color.value } as React.CSSProperties : {}) }} />
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
                        <Input value={settings.accentColor} onChange={(e) => updateSettings({ accentColor: e.target.value })} placeholder="#6366f1" className="font-mono text-sm max-w-[140px]" />
                        <p className="text-xs text-muted-foreground">Code hexadecimal</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Document Font */}
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
                        <button key={font.id} onClick={() => updateSettings({ documentFont: font.id })}
                          className={`flex items-center gap-3 rounded-xl border-2 p-3 text-left transition-all ${
                            settings.documentFont === font.id ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/30'
                          }`}>
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
              </>)}

              {/* ═══════════════════════════════════════
                   TAB: OPTIONS
                   ═══════════════════════════════════════ */}
              {activeTab === 'options' && (<>
                {/* Billing Type */}
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
                      <button onClick={() => updateSettings({ billingType: 'quick' })}
                        className={`relative rounded-xl border-2 p-4 text-left transition-all ${
                          settings.billingType === 'quick' ? 'border-primary bg-primary/5 shadow-sm' : 'border-border hover:border-muted-foreground/30 hover:bg-muted/30'
                        }`}>
                        {settings.billingType === 'quick' && (
                          <div className="absolute top-3 right-3"><div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary"><Check className="h-3 w-3 text-primary-foreground" /></div></div>
                        )}
                        <Zap className="h-5 w-5 text-primary mb-2" />
                        <p className="font-medium text-sm text-foreground">Rapide</p>
                        <p className="text-xs text-muted-foreground mt-1">Facturation simplifiee avec les informations essentielles</p>
                      </button>
                      <button onClick={() => updateSettings({ billingType: 'detailed' })}
                        className={`relative rounded-xl border-2 p-4 text-left transition-all ${
                          settings.billingType === 'detailed' ? 'border-primary bg-primary/5 shadow-sm' : 'border-border hover:border-muted-foreground/30 hover:bg-muted/30'
                        }`}>
                        {settings.billingType === 'detailed' && (
                          <div className="absolute top-3 right-3"><div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary"><Check className="h-3 w-3 text-primary-foreground" /></div></div>
                        )}
                        <ClipboardList className="h-5 w-5 text-primary mb-2" />
                        <p className="font-medium text-sm text-foreground">Complet</p>
                        <p className="text-xs text-muted-foreground mt-1">Factures détaillées avec TVA, remises, conditions et mentions</p>
                      </button>
                    </div>
                  </CardContent>
                </Card>

                {/* Payment Methods */}
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
                      <button onClick={() => togglePaymentMethod('bank_transfer')}
                        className={`flex w-full items-center gap-3 rounded-xl border-2 p-4 text-left transition-all ${
                          settings.paymentMethods.includes('bank_transfer') ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/30'
                        }`}>
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

                      <button onClick={() => togglePaymentMethod('cash')}
                        className={`flex w-full items-center gap-3 rounded-xl border-2 p-4 text-left transition-all ${
                          settings.paymentMethods.includes('cash') ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/30'
                        }`}>
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${settings.paymentMethods.includes('cash') ? 'bg-primary/10' : 'bg-muted'}`}>
                          <Coins className={`h-5 w-5 ${settings.paymentMethods.includes('cash') ? 'text-primary' : 'text-muted-foreground'}`} />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">Espèces</p>
                          <p className="text-xs text-muted-foreground">Paiement en especes</p>
                        </div>
                        <div className={`h-5 w-5 rounded-md border-2 flex items-center justify-center transition-colors ${settings.paymentMethods.includes('cash') ? 'border-primary bg-primary' : 'border-muted-foreground/30'}`}>
                          {settings.paymentMethods.includes('cash') && <Check className="h-3 w-3 text-primary-foreground" />}
                        </div>
                      </button>

                      <div>
                        <button onClick={() => togglePaymentMethod('custom')}
                          className={`flex w-full items-center gap-3 rounded-xl border-2 p-4 text-left transition-all ${
                            settings.paymentMethods.includes('custom') ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/30'
                          }`}>
                          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${settings.paymentMethods.includes('custom') ? 'bg-primary/10' : 'bg-muted'}`}>
                            <PenLine className={`h-5 w-5 ${settings.paymentMethods.includes('custom') ? 'text-primary' : 'text-muted-foreground'}`} />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-foreground">Autre</p>
                            <p className="text-xs text-muted-foreground">Moyen de paiement personnalisé</p>
                          </div>
                          <div className={`h-5 w-5 rounded-md border-2 flex items-center justify-center transition-colors ${settings.paymentMethods.includes('custom') ? 'border-primary bg-primary' : 'border-muted-foreground/30'}`}>
                            {settings.paymentMethods.includes('custom') && <Check className="h-3 w-3 text-primary-foreground" />}
                          </div>
                        </button>
                        {settings.paymentMethods.includes('custom') && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mt-2 ml-14">
                            <Input placeholder="Ex: Chèque, PayPal, etc." value={settings.customPaymentMethod} onChange={(e) => updateSettings({ customPaymentMethod: e.target.value })} className="text-sm" />
                          </motion.div>
                        )}
                      </div>

                      <Separator />

                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider px-1">Bientôt disponible</p>
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
              </>)}

              {/* ═══════════════════════════════════════
                   TAB: VALEURS PAR DEFAUT
                   ═══════════════════════════════════════ */}
              {activeTab === 'defauts' && (<>
                <Card className="overflow-hidden border-border/50">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                        <ClipboardList className="h-4.5 w-4.5 text-primary" />
                      </div>
                      <div>
                        <h2 className="text-base font-semibold text-foreground">Valeurs par defaut des devis</h2>
                        <p className="text-xs text-muted-foreground">Pre-remplissage automatique lors de la creation d&apos;un devis</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {/* Default Subject */}
                      <div>
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">Objet par defaut</label>
                        <Input
                          placeholder="Ex: Developpement site web"
                          value={settings.defaultSubject || ''}
                          onChange={(e) => updateSettings({ defaultSubject: e.target.value || null })}
                          className="text-sm"
                        />
                      </div>

                      {/* Default Acceptance Conditions */}
                      <div>
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">Conditions d&apos;acceptation</label>
                        <textarea
                          placeholder="Conditions d'acceptation par defaut..."
                          value={settings.defaultAcceptanceConditions || ''}
                          onChange={(e) => updateSettings({ defaultAcceptanceConditions: e.target.value || null })}
                          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-y min-h-[60px]"
                          rows={2}
                        />
                      </div>

                      {/* Default Free Field */}
                      <div>
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">Champ libre</label>
                        <textarea
                          placeholder="Texte supplementaire par defaut..."
                          value={settings.defaultFreeField || ''}
                          onChange={(e) => updateSettings({ defaultFreeField: e.target.value || null })}
                          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-y min-h-[60px]"
                          rows={2}
                        />
                      </div>

                      {/* Footer Mode */}
                      <div>
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">Pied de page du document</label>
                        <div className="space-y-2">
                          {([
                            { id: 'company_info' as const, label: 'Informations entreprise', desc: 'Raison sociale, SIREN, TVA, adresse' },
                            { id: 'custom' as const, label: 'Texte personnalisé', desc: 'Saisissez votre propre texte de pied de page' },
                          ]).map((opt) => (
                            <button key={opt.id} onClick={() => updateSettings({ footerMode: opt.id })}
                              className={`flex w-full items-center gap-3 rounded-xl border-2 p-3 text-left transition-all ${
                                settings.footerMode === opt.id ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/30'
                              }`}>
                              <div className="flex-1">
                                <p className="text-sm font-medium text-foreground">{opt.label}</p>
                                <p className="text-xs text-muted-foreground">{opt.desc}</p>
                              </div>
                              <div className={`h-5 w-5 rounded-md border-2 flex items-center justify-center transition-colors shrink-0 ${
                                settings.footerMode === opt.id ? 'border-primary bg-primary' : 'border-muted-foreground/30'
                              }`}>
                                {settings.footerMode === opt.id && <Check className="h-3 w-3 text-primary-foreground" />}
                              </div>
                            </button>
                          ))}
                        </div>
                        {settings.footerMode === 'custom' && (
                          <div className="mt-2">
                            <Input
                              placeholder="Ex: Conditions générales de vente..."
                              value={settings.defaultFooterText || ''}
                              onChange={(e) => updateSettings({ defaultFooterText: e.target.value?.slice(0, 50) || null })}
                              className="text-sm"
                              maxLength={50}
                            />
                            <p className="text-[10px] text-muted-foreground mt-1">50 caracteres max.</p>
                          </div>
                        )}
                      </div>

                      <Separator />

                      {/* Toggle options */}
                      {[
                        { key: 'defaultSignatureField' as const, label: 'Champ de signature', desc: 'Afficher les zones de signature émetteur/client' },
                        { key: 'defaultShowNotes' as const, label: 'Notes et conditions', desc: 'Afficher la zone de notes et conditions' },
                        { key: 'defaultShowDeliveryAddress' as const, label: 'Adresse de livraison', desc: 'Afficher un champ adresse de livraison' },
                      ].map((opt) => (
                        <div key={opt.key} className="flex items-center justify-between rounded-xl border-2 border-border p-3">
                          <div>
                            <p className="text-sm font-medium text-foreground">{opt.label}</p>
                            <p className="text-xs text-muted-foreground">{opt.desc}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => updateSettings({ [opt.key]: !settings[opt.key] })}
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors shrink-0 ${
                              settings[opt.key] ? 'bg-primary' : 'bg-muted-foreground/30'
                            }`}
                          >
                            <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform shadow-sm ${
                              settings[opt.key] ? 'translate-x-[18px]' : 'translate-x-[3px]'
                            }`} />
                          </button>
                        </div>
                      ))}

                      <Separator />

                      {/* Default Language */}
                      <div>
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">Langue par defaut</label>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { id: 'fr', label: 'Francais' },
                            { id: 'en', label: 'English' },
                          ].map((lang) => (
                            <button key={lang.id} onClick={() => updateSettings({ defaultLanguage: lang.id })}
                              className={`rounded-xl border-2 p-3 text-left transition-all ${
                                settings.defaultLanguage === lang.id ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/30'
                              }`}>
                              <p className="text-sm font-medium text-foreground">{lang.label}</p>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Filename Patterns */}
                <Card className="overflow-hidden border-border/50">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                        <FileText className="h-4.5 w-4.5 text-primary" />
                      </div>
                      <div>
                        <h2 className="text-base font-semibold text-foreground">Nommage des fichiers</h2>
                        <p className="text-xs text-muted-foreground">Format du nom de fichier lors de l&apos;export PDF</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">Nom de fichier des devis</label>
                        <Input
                          placeholder="DEV-{numéro}"
                          value={settings.quoteFilenamePattern}
                          onChange={(e) => updateSettings({ quoteFilenamePattern: e.target.value })}
                          className="text-sm font-mono"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">Nom de fichier des factures</label>
                        <Input
                          placeholder="FAC-{numéro}"
                          value={settings.invoiceFilenamePattern}
                          onChange={(e) => updateSettings({ invoiceFilenamePattern: e.target.value })}
                          className="text-sm font-mono"
                        />
                      </div>

                      <div className="rounded-lg border border-border p-3 space-y-2">
                        <p className="text-xs font-medium text-foreground mb-2">Variables disponibles</p>
                        {[
                          { var: '{numero}', desc: 'Numéro du document (ex: DEV-001)' },
                          { var: '{date}', desc: 'Date d\'émission (ex: 2026-03-15)' },
                          { var: '{client}', desc: 'Nom du client' },
                          { var: '{entreprise}', desc: 'Nom de votre entreprise' },
                        ].map((v) => (
                          <div key={v.var} className="flex items-center gap-2">
                            <code className="text-[11px] font-mono bg-muted px-1.5 py-0.5 rounded text-primary">{v.var}</code>
                            <span className="text-[11px] text-muted-foreground">{v.desc}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>)}

              {/* ═══════════════════════════════════════
                   TAB: E-FACTURATION
                   ═══════════════════════════════════════ */}
              {/* ═══════════════════════════════════════
                   TAB: INTELLIGENCE ARTIFICIELLE
                   ═══════════════════════════════════════ */}
              {activeTab === 'ia' && (<>
                <Card className="overflow-hidden border-border/50">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                        <Sparkles className="h-4.5 w-4.5 text-primary" />
                      </div>
                      <div>
                        <h2 className="text-base font-semibold text-foreground">Intelligence artificielle</h2>
                        <p className="text-xs text-muted-foreground">Génération de texte, suggestions et résumés automatiques</p>
                      </div>
                    </div>

                    {/* Info banner */}
                    <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 mb-4">
                      <Bot className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <p className="text-xs text-foreground leading-relaxed">
                        L&apos;IA vous aide à rédiger des emails, pré-remplir des factures depuis l&apos;historique client, générer des relances personnalisées et obtenir un résumé de votre activité sur le tableau de bord.
                      </p>
                    </div>

                    {/* Toggle activation */}
                    <div className="flex items-center justify-between rounded-xl border-2 border-border p-4 mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${settings.aiEnabled ? 'bg-primary/10' : 'bg-muted'}`}>
                          <Sparkles className={`h-5 w-5 ${settings.aiEnabled ? 'text-primary' : 'text-muted-foreground'}`} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">Activer l&apos;assistant IA</p>
                          <p className="text-xs text-muted-foreground">Active les fonctionnalités d&apos;IA dans toute l&apos;application</p>
                        </div>
                      </div>
                      <button type="button"
                        onClick={() => updateSettings({ aiEnabled: !settings.aiEnabled })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ${
                          settings.aiEnabled ? 'bg-primary' : 'bg-muted-foreground/30'
                        }`}>
                        <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform shadow-sm ${
                          settings.aiEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>

                    {/* Configuration (visible when enabled) */}
                    <AnimatePresence>
                      {settings.aiEnabled && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                          <div className="space-y-4 pt-2">
                            <Separator />

                            {/* API Source */}
                            <div>
                              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                <Key className="h-3 w-3" />
                                Source API
                              </label>
                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  onClick={() => {
                                    setAiKeyMode('server')
                                    updateSettings({ aiCustomApiKey: null })
                                    setShowAiKey(false)
                                  }}
                                  className={`rounded-xl border-2 p-3 text-left transition-all ${
                                    aiKeyMode === 'server' ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/30'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 mb-1">
                                    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10">
                                      <Sparkles className="h-3 w-3 text-primary" />
                                    </div>
                                    <p className="text-xs font-semibold text-foreground">API de Faktur</p>
                                  </div>
                                  <p className="text-[10px] text-muted-foreground">Utiliser la clé du serveur</p>
                                </button>
                                <button
                                  onClick={() => setAiKeyMode('custom')}
                                  className={`rounded-xl border-2 p-3 text-left transition-all ${
                                    aiKeyMode === 'custom' ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/30'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 mb-1">
                                    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-500/10">
                                      <Key className="h-3 w-3 text-amber-500" />
                                    </div>
                                    <p className="text-xs font-semibold text-foreground">Mes propres clés</p>
                                  </div>
                                  <p className="text-[10px] text-muted-foreground">Utiliser mes clés API perso</p>
                                </button>
                              </div>
                            </div>

                            {/* Per-provider API keys (visible in custom mode) */}
                            <AnimatePresence>
                              {aiKeyMode === 'custom' && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                  <div className="space-y-2">
                                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block">Mes clés API</label>
                                    {([
                                      { id: 'gemini' as const, name: 'Gemini', desc: 'Google AI', icon: <GoogleIcon className="h-4 w-4" />, iconBg: 'bg-blue-500/10', key: settings.aiApiKeyGemini, link: 'https://aistudio.google.com/apikey' },
                                      { id: 'groq' as const, name: 'Groq', desc: 'Llama 3.3', icon: <GroqIcon className="h-4 w-4 text-orange-500" />, iconBg: 'bg-orange-500/10', key: settings.aiApiKeyGroq, link: 'https://console.groq.com/keys' },
                                      { id: 'claude' as const, name: 'Claude', desc: 'Anthropic', icon: <AnthropicIcon className="h-4 w-4 text-violet-500" />, iconBg: 'bg-violet-500/10', key: settings.aiApiKeyClaude, link: 'https://console.anthropic.com/settings/keys' },
                                    ]).map((p) => (
                                      <div key={p.id} className="flex items-center gap-3 rounded-xl border-2 border-border p-3">
                                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${p.iconBg}`}>
                                          {p.icon}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className="text-xs font-semibold text-foreground">{p.name}</p>
                                          {p.key ? (
                                            <p className="text-[10px] text-muted-foreground font-mono truncate">{p.key}</p>
                                          ) : (
                                            <p className="text-[10px] text-muted-foreground">Non configurée</p>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                          {p.key && (
                                            <button
                                              onClick={() => setAiDeleteConfirmProvider(p.id)}
                                              className="text-[10px] text-destructive/70 hover:text-destructive transition-colors px-1.5 py-1 rounded"
                                            >
                                              <Trash2 className="h-3 w-3" />
                                            </button>
                                          )}
                                          <button
                                            onClick={() => {
                                              setAiKeyModalProvider(p.id)
                                              setAiKeyModalValue('')
                                              setAiKeyModalShow(false)
                                            }}
                                            className="text-[10px] text-primary hover:text-primary/80 font-medium transition-colors px-2 py-1 rounded-lg border border-primary/20 hover:bg-primary/5"
                                          >
                                            {p.key ? 'Modifier' : 'Configurer'}
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>

                            {/* Provider selector */}
                            <div>
                              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">Fournisseur IA</label>
                              <div className="grid grid-cols-3 gap-2">
                                {([
                                  {
                                    id: 'gemini' as const,
                                    name: 'Gemini',
                                    desc: 'Google AI',
                                    badge: 'Gratuit',
                                    badgeColor: 'bg-emerald-500/10 text-emerald-600',
                                    icon: <GoogleIcon className="h-4 w-4" />,
                                    iconBg: 'bg-blue-500/10',
                                    hasKey: !!settings.aiApiKeyGemini,
                                  },
                                  {
                                    id: 'groq' as const,
                                    name: 'Groq',
                                    desc: 'Llama 3.3',
                                    badge: 'Gratuit',
                                    badgeColor: 'bg-emerald-500/10 text-emerald-600',
                                    icon: <GroqIcon className="h-4 w-4 text-orange-500" />,
                                    iconBg: 'bg-orange-500/10',
                                    hasKey: !!settings.aiApiKeyGroq,
                                  },
                                  {
                                    id: 'claude' as const,
                                    name: 'Claude',
                                    desc: 'Anthropic',
                                    badge: 'Payant',
                                    badgeColor: 'bg-amber-500/10 text-amber-600',
                                    icon: <AnthropicIcon className="h-4 w-4 text-violet-500" />,
                                    iconBg: 'bg-violet-500/10',
                                    hasKey: !!settings.aiApiKeyClaude,
                                  },
                                ]).map((provider) => {
                                  const disabled = aiKeyMode === 'custom' && !provider.hasKey
                                  return (
                                    <button key={provider.id}
                                      disabled={disabled}
                                      onClick={() => {
                                        const defaultModels: Record<string, string> = {
                                          claude: 'claude-sonnet-4-5-20250929',
                                          gemini: 'gemini-2.5-flash-lite',
                                          groq: 'llama-3.3-70b-versatile',
                                        }
                                        updateSettings({ aiProvider: provider.id, aiModel: defaultModels[provider.id] })
                                      }}
                                      className={`rounded-xl border-2 p-3 text-left transition-all relative ${
                                        settings.aiProvider === provider.id ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/30'
                                      } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}>
                                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg mb-2 ${provider.iconBg}`}>
                                        {provider.icon}
                                      </div>
                                      <p className="text-xs font-semibold text-foreground">{provider.name}</p>
                                      <p className="text-[10px] text-muted-foreground">{provider.desc}</p>
                                      <span className={`absolute top-2 right-2 text-[9px] font-medium px-1.5 py-0.5 rounded-full ${provider.badgeColor}`}>
                                        {provider.badge}
                                      </span>
                                    </button>
                                  )
                                })}
                              </div>
                            </div>

                            {/* Model selector (changes based on provider) */}
                            <div>
                              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">Modèle</label>
                              <div className="grid grid-cols-2 gap-2">
                                {settings.aiProvider === 'claude' && ([
                                  { id: 'claude-sonnet-4-5-20250929', name: 'Claude Sonnet', desc: 'Rapide et économique', badge: 'Rapide' },
                                  { id: 'claude-opus-4-6', name: 'Claude Opus', desc: 'Plus puissant', badge: 'Intelligent' },
                                ].map((model) => (
                                  <button key={model.id} onClick={() => updateSettings({ aiModel: model.id })}
                                    className={`rounded-xl border-2 p-3 text-left transition-all relative ${
                                      settings.aiModel === model.id ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/30'
                                    }`}>
                                    <p className="text-xs font-medium text-foreground">{model.name}</p>
                                    <p className="text-[10px] text-muted-foreground">{model.desc}</p>
                                    <span className="absolute top-2 right-2 text-[8px] font-medium px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">{model.badge}</span>
                                  </button>
                                )))}
                                {settings.aiProvider === 'gemini' && ([
                                  { id: 'gemini-2.5-flash-lite', name: 'Flash Lite', desc: '1 000 req/jour gratuit', badge: 'Rapide' },
                                  { id: 'gemini-2.5-flash', name: 'Flash', desc: '250 req/jour gratuit', badge: 'Intelligent' },
                                  { id: 'gemini-2.5-pro', name: 'Pro', desc: '100 req/jour gratuit', badge: 'Intelligent' },
                                ].map((model) => (
                                  <button key={model.id} onClick={() => updateSettings({ aiModel: model.id })}
                                    className={`rounded-xl border-2 p-3 text-left transition-all relative ${
                                      settings.aiModel === model.id ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/30'
                                    }`}>
                                    <p className="text-xs font-medium text-foreground">{model.name}</p>
                                    <p className="text-[10px] text-muted-foreground">{model.desc}</p>
                                    <span className="absolute top-2 right-2 text-[8px] font-medium px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">{model.badge}</span>
                                  </button>
                                )))}
                                {settings.aiProvider === 'groq' && ([
                                  { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B', desc: 'Puissant, gratuit', badge: 'Intelligent' },
                                  { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B', desc: 'Ultra rapide', badge: 'Rapide' },
                                ].map((model) => (
                                  <button key={model.id} onClick={() => updateSettings({ aiModel: model.id })}
                                    className={`rounded-xl border-2 p-3 text-left transition-all relative ${
                                      settings.aiModel === model.id ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/30'
                                    }`}>
                                    <p className="text-xs font-medium text-foreground">{model.name}</p>
                                    <p className="text-[10px] text-muted-foreground">{model.desc}</p>
                                    <span className="absolute top-2 right-2 text-[8px] font-medium px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">{model.badge}</span>
                                  </button>
                                )))}
                              </div>
                            </div>

                            {/* Features list */}
                            <div className="rounded-lg border border-border p-3 space-y-2">
                              <p className="text-xs font-medium text-foreground mb-2">Fonctionnalités disponibles</p>
                              {[
                                'Rédaction assistée des sujets et corps d\'email',
                                'Pré-remplissage intelligent des lignes de facture',
                                'Résumé financier IA sur le tableau de bord',
                                'Relances de paiement personnalisées',
                                'Génération de descriptions et notes',
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
              </>)}

              {activeTab === 'efacturation' && (<>
                <Card className="overflow-hidden border-border/50">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                        <FileCheck className="h-4.5 w-4.5 text-primary" />
                      </div>
                      <div>
                        <h2 className="text-base font-semibold text-foreground">Facturation électronique</h2>
                        <p className="text-xs text-muted-foreground">Réforme 2026 — Factur-X, PDP et e-reporting</p>
                      </div>
                    </div>

                    {/* Info banner */}
                    <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 mb-4">
                      <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <p className="text-xs text-foreground leading-relaxed">
                        A partir de septembre 2026, toutes les entreprises françaises doivent émettre des factures électroniques au format structuré (Factur-X, UBL ou CII) via une Plateforme de Dématérialisation Partenaire (PDP).
                      </p>
                    </div>

                    {/* Toggle activation */}
                    <div className="flex items-center justify-between rounded-xl border-2 border-border p-4 mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${settings.eInvoicingEnabled ? 'bg-primary/10' : 'bg-muted'}`}>
                          <Shield className={`h-5 w-5 ${settings.eInvoicingEnabled ? 'text-primary' : 'text-muted-foreground'}`} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">Activer la facturation électronique</p>
                          <p className="text-xs text-muted-foreground">Genere automatiquement le format Factur-X pour vos documents</p>
                        </div>
                      </div>
                      <button type="button"
                        onClick={() => {
                          if (!settings.eInvoicingEnabled) setShowEInvoicingModal(true)
                          else updateSettings({ eInvoicingEnabled: false })
                        }}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ${
                          settings.eInvoicingEnabled ? 'bg-primary' : 'bg-muted-foreground/30'
                        }`}>
                        <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform shadow-sm ${
                          settings.eInvoicingEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>

                    {/* PDP Configuration */}
                    <AnimatePresence>
                      {settings.eInvoicingEnabled && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                          <div className="space-y-4 pt-2">
                            <Separator />

                            {/* B2Brouter API key (optional — sandbox by default) */}
                            <div>
                              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">Clé API B2Brouter (optionnel)</label>
                              <div className="relative">
                                <Input
                                  type={showPdpKey ? 'text' : 'password'}
                                  placeholder="Laissez vide pour le mode sandbox..."
                                  value={settings.pdpApiKey === '••••••••' ? '' : (settings.pdpApiKey || '')}
                                  onChange={(e) => updateSettings({ pdpApiKey: e.target.value, pdpProvider: e.target.value ? 'b2brouter' : 'sandbox' })}
                                  className="text-sm pr-10 font-mono"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowPdpKey(!showPdpKey)}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                  {showPdpKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                              </div>
                              <p className="text-[10px] text-muted-foreground mt-1">
                                {settings.pdpApiKey && settings.pdpApiKey !== '••••••••'
                                  ? 'Connecté à B2Brouter — les factures seront envoyées à la PDP'
                                  : 'Mode sandbox actif — les factures sont générées localement sans envoi PDP'}
                              </p>
                            </div>

                            {/* Default operation category */}
                            <div>
                              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">Categorie d&apos;operation par defaut</label>
                              <div className="grid grid-cols-3 gap-2">
                                {[
                                  { id: 'service', name: 'Prestation', desc: 'Services' },
                                  { id: 'goods', name: 'Livraison', desc: 'Biens' },
                                  { id: 'mixed', name: 'Mixte', desc: 'Les deux' },
                                ].map((cat) => (
                                  <button key={cat.id} onClick={() => updateSettings({ defaultOperationCategory: cat.id as any })}
                                    className={`rounded-xl border-2 p-3 text-left transition-all ${
                                      settings.defaultOperationCategory === cat.id ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/30'
                                    }`}>
                                    <p className="text-xs font-medium text-foreground">{cat.name}</p>
                                    <p className="text-[10px] text-muted-foreground">{cat.desc}</p>
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Sandbox indicator */}
                            <div className="flex items-center gap-2 rounded-lg border border-border p-3">
                              <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0" />
                              <div>
                                <p className="text-xs font-medium text-foreground">
                                  {settings.pdpApiKey && settings.pdpApiKey !== '••••••••' ? 'Mode production' : 'Mode sandbox'}
                                </p>
                                <p className="text-[10px] text-muted-foreground">
                                  {settings.pdpApiKey && settings.pdpApiKey !== '••••••••'
                                    ? 'Les factures sont envoyees via B2Brouter vers la DGFiP'
                                    : 'Aucune facture n\'est envoyee — generation Factur-X locale uniquement'}
                                </p>
                              </div>
                            </div>

                            <div className="rounded-lg border border-border p-3 space-y-2">
                              <p className="text-xs font-medium text-foreground mb-2">Fonctionnalites incluses</p>
                              {[
                                'Generation automatique Factur-X EN16931 (PDF/A-3)',
                                'Mentions obligatoires reforme 2026',
                                'SIREN client et categorie d\'operation',
                                'Envoi via B2Brouter vers la DGFiP (avec cle API)',
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
              </>)}

            </motion.div>
          </AnimatePresence>

          {/* Auto-save indicator */}
          <motion.div variants={fadeUp} custom={7} className="flex justify-end">
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-green-500" />
              Enregistrement automatique
            </p>
          </motion.div>
        </div>

        {/* Preview Column */}
        <motion.div variants={fadeUp} custom={2}>
          <div className="sticky top-6">
            <Card className="overflow-hidden border-border/50">
              <CardContent className="p-0">
                <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium text-foreground">Apercu du document</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {currentTemplate.name} &middot; {settings.billingType === 'quick' ? 'Rapide' : 'Complet'}
                  </p>
                </div>
                <div className="p-4 bg-muted/30">
                  <div className="rounded-lg shadow-sm overflow-hidden relative mx-auto"
                    style={{
                      aspectRatio: '210 / 270', maxHeight: '420px', backgroundColor: currentTemplate.docBg,
                      border: settings.darkMode ? '1px solid #3f3f46' : '1px solid #e5e7eb',
                    }}>
                    <div className="h-full flex flex-col p-5 relative">
                      {/* Banner header */}
                      {currentTemplate.layout === 'banner' && (
                        <div className="rounded-lg px-4 py-3 mb-4 -mx-2 -mt-2" style={{ backgroundColor: settings.accentColor }}>
                          <div className="flex justify-between items-center">
                            {effectiveLogoUrl ? (
                              <img src={effectiveLogoUrl} alt="Logo" className="h-7 w-auto max-w-[80px] object-contain" style={{ borderRadius: `${settings.logoBorderRadius}px` }} />
                            ) : (
                              <div className="h-2.5 w-16 rounded-full" style={{ backgroundColor: '#fff', opacity: 0.5 }} />
                            )}
                            <p className="text-xs font-bold tracking-wide" style={{ color: '#fff' }}>FACTURE</p>
                          </div>
                        </div>
                      )}
                      {/* Standard header */}
                      {currentTemplate.layout !== 'banner' && (
                        <div className="flex items-start justify-between mb-5">
                          <div className="space-y-2">
                            {effectiveLogoUrl ? (
                              <img src={effectiveLogoUrl} alt="Logo" className="h-10 w-auto max-w-[120px] object-contain" style={{ borderRadius: `${settings.logoBorderRadius}px` }} />
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
                      <div className="h-[2px] rounded-full mb-5" style={{ backgroundColor: settings.accentColor }} />
                      {/* Addresses */}
                      <div className="grid grid-cols-2 gap-6 mb-6">
                        <div className="space-y-1">
                          <p className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: settings.accentColor }}>Émetteur</p>
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
                                <span className="text-[8px] rounded-md px-2 py-0.5" style={{ backgroundColor: currentTemplate.paymentBadgeBg, border: `1px solid ${currentTemplate.paymentBadgeBorder}`, color: currentTemplate.paymentBadgeText }}>Espèces</span>
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
      <TemplateModal open={templateModalOpen} onClose={() => setTemplateModalOpen(false)}
        accentColor={settings.accentColor} currentTemplate={settings.template}
        onSelect={(id) => updateSettings({ template: id })} />

      {/* E-Invoicing Confirmation Modal */}
      <Dialog open={showEInvoicingModal} onClose={() => setShowEInvoicingModal(false)}>
        <div className="p-6 max-w-md">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <FileCheck className="h-6 w-6 text-primary" />
            </div>
            <div>
              <DialogTitle>Activer la facturation électronique</DialogTitle>
              <DialogDescription>Réforme obligatoire à partir de septembre 2026</DialogDescription>
            </div>
          </div>
          <div className="space-y-3 mb-6">
            <p className="text-sm text-muted-foreground leading-relaxed">
              En activant cette option, vos documents seront générés au format Factur-X (PDF/A-3) conforme aux exigences de la réforme française.
            </p>
            <div className="rounded-lg border border-border p-3 space-y-2">
              {[
                'Vos PDF incluront les métadonnées XML structurées',
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
            <Button variant="ghost" onClick={() => setShowEInvoicingModal(false)}>Annuler</Button>
            <Button onClick={() => { updateSettings({ eInvoicingEnabled: true }); setShowEInvoicingModal(false); setShowBetaWarningModal(true) }}>
              <FileCheck className="h-4 w-4 mr-2" /> Activer
            </Button>
          </DialogFooter>
        </div>
      </Dialog>

      {/* Beta Warning Modal */}
      <Dialog open={showBetaWarningModal} onClose={() => setShowBetaWarningModal(false)}>
        <div className="p-6 max-w-md">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-500/10">
              <FlaskConical className="h-6 w-6 text-yellow-500" />
            </div>
            <div>
              <DialogTitle className="flex items-center gap-2">
                Fonctionnalité en bêta
                <span className="px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-500 text-[10px] font-semibold uppercase tracking-wide">Bêta</span>
              </DialogTitle>
              <DialogDescription>Aperçu anticipé de la facturation électronique</DialogDescription>
            </div>
          </div>
          <div className="space-y-3 mb-6">
            <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4 space-y-2">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />
                <p className="text-sm text-foreground leading-relaxed">
                  Cette fonctionnalité est actuellement en <strong>version bêta</strong>. Elle peut présenter des dysfonctionnements ou ne pas fonctionner correctement dans certains cas.
                </p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Nous travaillons activement sur cette fonctionnalité. Elle sera <strong className="text-foreground">pleinement opérationnelle avant septembre 2026</strong>, bien avant l&apos;entrée en vigueur de la réforme.
            </p>
            <div className="rounded-lg border border-border p-3 space-y-2">
              {[
                'Les formats générés peuvent évoluer',
                'Certaines PDP ne sont pas encore connectées',
                'Vos données existantes ne seront pas affectées',
              ].map((item) => (
                <div key={item} className="flex items-start gap-2">
                  <Info className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                  <span className="text-xs text-muted-foreground">{item}</span>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => { setShowBetaWarningModal(false); toast('Facturation électronique activée', 'success') }}>
              J&apos;ai compris
            </Button>
          </DialogFooter>
        </div>
      </Dialog>

      {/* AI API Key Configuration Modal */}
      <Dialog open={aiKeyModalProvider !== null} onClose={() => setAiKeyModalProvider(null)}>
        <div className="p-6 max-w-md">
          <div className="flex items-center gap-3 mb-4">
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${
              aiKeyModalProvider === 'claude' ? 'bg-violet-500/10' : aiKeyModalProvider === 'gemini' ? 'bg-blue-500/10' : 'bg-orange-500/10'
            }`}>
              {aiKeyModalProvider === 'claude' && <AnthropicIcon className="h-6 w-6 text-violet-500" />}
              {aiKeyModalProvider === 'gemini' && <GoogleIcon className="h-6 w-6" />}
              {aiKeyModalProvider === 'groq' && <GroqIcon className="h-6 w-6 text-orange-500" />}
            </div>
            <div>
              <DialogTitle>
                Clé API {aiKeyModalProvider === 'claude' ? 'Claude (Anthropic)' : aiKeyModalProvider === 'gemini' ? 'Gemini (Google)' : 'Groq'}
              </DialogTitle>
              <DialogDescription>Entrez votre clé API personnelle</DialogDescription>
            </div>
          </div>
          <div className="space-y-3 mb-6">
            <div className="relative">
              <Input
                type={aiKeyModalShow ? 'text' : 'password'}
                value={aiKeyModalValue}
                onChange={(e) => setAiKeyModalValue(e.target.value)}
                placeholder={aiKeyModalProvider === 'claude' ? 'sk-ant-api03-...' : aiKeyModalProvider === 'gemini' ? 'AIzaSy...' : 'gsk_...'}
                className="pr-10 font-mono text-sm"
              />
              <button
                type="button"
                onClick={() => setAiKeyModalShow(!aiKeyModalShow)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {aiKeyModalShow ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <a
              href={aiKeyModalProvider === 'claude' ? 'https://console.anthropic.com/settings/keys' : aiKeyModalProvider === 'gemini' ? 'https://aistudio.google.com/apikey' : 'https://console.groq.com/keys'}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors"
            >
              <ExternalLink className="h-3 w-3" />
              Obtenir une clé {aiKeyModalProvider === 'claude' ? 'Anthropic' : aiKeyModalProvider === 'gemini' ? 'Google AI' : 'Groq'}
            </a>
            <div className="flex items-start gap-2 rounded-lg border border-border p-3">
              <Shield className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Votre clé est chiffrée de bout en bout et ne sera jamais visible en clair après l&apos;enregistrement.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAiKeyModalProvider(null)}>Annuler</Button>
            <Button
              disabled={!aiKeyModalValue.trim()}
              onClick={() => {
                if (!aiKeyModalProvider || !aiKeyModalValue.trim()) return
                const keyField = aiKeyModalProvider === 'claude' ? 'aiApiKeyClaude' : aiKeyModalProvider === 'gemini' ? 'aiApiKeyGemini' : 'aiApiKeyGroq'
                updateSettings({ [keyField]: aiKeyModalValue.trim() })
                toast('Clé API enregistrée', 'success')
                setAiKeyModalProvider(null)
                setAiKeyModalValue('')
                setAiKeyModalShow(false)
              }}
            >
              <Key className="h-4 w-4 mr-2" /> Enregistrer
            </Button>
          </DialogFooter>
        </div>
      </Dialog>

      {/* AI API Key Delete Confirmation Modal */}
      <Dialog open={aiDeleteConfirmProvider !== null} onClose={() => setAiDeleteConfirmProvider(null)}>
        <div className="p-6 max-w-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10">
              <Trash2 className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <DialogTitle>Supprimer la clé API</DialogTitle>
              <DialogDescription>
                {aiDeleteConfirmProvider === 'claude' ? 'Claude (Anthropic)' : aiDeleteConfirmProvider === 'gemini' ? 'Gemini (Google)' : 'Groq'}
              </DialogDescription>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
            Êtes-vous sûr de vouloir supprimer cette clé API ? Vous devrez en saisir une nouvelle pour utiliser ce fournisseur avec vos propres clés.
          </p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAiDeleteConfirmProvider(null)}>Annuler</Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (!aiDeleteConfirmProvider) return
                const keyField = aiDeleteConfirmProvider === 'claude' ? 'aiApiKeyClaude' : aiDeleteConfirmProvider === 'gemini' ? 'aiApiKeyGemini' : 'aiApiKeyGroq'
                updateSettings({ [keyField]: null })
                // If we just deleted the key for the active provider, switch to another provider that has a key
                if (settings.aiProvider === aiDeleteConfirmProvider) {
                  const fallbacks = ['gemini', 'groq', 'claude'] as const
                  const defaultModels: Record<string, string> = { claude: 'claude-sonnet-4-5-20250929', gemini: 'gemini-2.5-flash-lite', groq: 'llama-3.3-70b-versatile' }
                  const next = fallbacks.find((p) => p !== aiDeleteConfirmProvider && settings[`aiApiKey${p.charAt(0).toUpperCase() + p.slice(1)}` as keyof typeof settings])
                  if (next) {
                    updateSettings({ aiProvider: next, aiModel: defaultModels[next] })
                  }
                }
                toast('Clé API supprimée', 'success')
                setAiDeleteConfirmProvider(null)
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" /> Supprimer
            </Button>
          </DialogFooter>
        </div>
      </Dialog>
    </motion.div>
  )
}
