'use client'

import { useState, useRef } from 'react'
import { motion, type Variants } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useInvoiceSettings } from '@/lib/invoice-settings-context'
import { getTemplate } from '@/lib/invoice-templates'
import { TemplateThumbnail } from '@/components/shared/template-thumbnail'
import { InvoicePreview } from '@/components/settings/invoice-preview'
import { TemplateModal } from '@/components/settings/template-modal'
import { Spinner } from '@/components/ui/spinner'
import { useToast } from '@/components/ui/toast'
import {
  ImagePlus,
  Palette,
  Check,
  Trash2,
  ChevronRight,
  Moon,
  Sun,
  Type,
  LayoutTemplate,
  Building2,
  Eye,
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

export default function InvoiceAppearancePage() {
  const { toast } = useToast()
  const { settings, companyLogoUrl, loading, updateSettings, uploadLogo, refreshCompanyLogo } = useInvoiceSettings()
  const [uploading, setUploading] = useState(false)
  const [templateModalOpen, setTemplateModalOpen] = useState(false)
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

  if (loading) {
    return (
      <div className="space-y-6 px-4 lg:px-6 py-4 md:py-6">
        {}
        <div className="space-y-2">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-64" />
        </div>
        {}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="space-y-6">
            {}
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
            {}
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
            {}
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
          {}
          <div className="rounded-xl border border-border/50 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4 rounded" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-3 w-28" />
            </div>
            <div className="p-4 bg-surface">
              <Skeleton className="w-full rounded-lg" style={{ aspectRatio: '210/270' }} />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <motion.div initial="hidden" animate="visible" className="space-y-6 px-4 lg:px-6 py-4 md:py-6">
      {}
      <motion.div variants={fadeUp} custom={0}>
        <h1 className="text-2xl font-bold text-foreground">Apparence</h1>
        <p className="text-muted-foreground mt-1">Personnalisez l&apos;apparence de vos factures et devis</p>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {}
        <div className="space-y-6">
          {}
          <motion.div variants={fadeUp} custom={1}>
            <Card className="overflow-hidden border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft">
                    <LayoutTemplate className="h-4.5 w-4.5 text-accent" />
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
                    <p className="text-xs text-accent mt-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      Changer de modèle <ChevronRight className="h-3 w-3" />
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-accent transition-colors shrink-0" />
                </button>
                <button onClick={() => updateSettings({ darkMode: !settings.darkMode })}
                  className={`mt-3 w-full flex items-center gap-3 rounded-xl border-2 p-3 text-left transition-all ${
                    settings.darkMode ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/30'
                  }`}>
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${settings.darkMode ? 'bg-accent-soft' : 'bg-muted'}`}>
                    {settings.darkMode ? <Moon className="h-4 w-4 text-accent" /> : <Sun className="h-4 w-4 text-muted-foreground" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">Mode sombre</p>
                    <p className="text-xs text-muted-foreground">Appliquer le thème sombre au document</p>
                  </div>
                  <div className={`h-5 w-5 rounded-md border-2 flex items-center justify-center transition-colors ${settings.darkMode ? 'border-primary bg-primary' : 'border-muted-foreground/30'}`}>
                    {settings.darkMode && <Check className="h-3 w-3 text-accent-foreground" />}
                  </div>
                </button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Logo */}
          <motion.div variants={fadeUp} custom={2}>
            <Card className="overflow-hidden border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft">
                    <ImagePlus className="h-4.5 w-4.5 text-accent" />
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
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg shrink-0 ${settings.logoSource === 'custom' ? 'bg-accent-soft' : 'bg-muted'}`}>
                      <ImagePlus className={`h-4 w-4 ${settings.logoSource === 'custom' ? 'text-accent' : 'text-muted-foreground'}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-foreground">Logo personnalisé</p>
                      <p className="text-[10px] text-muted-foreground">Importer votre propre logo</p>
                    </div>
                    {settings.logoSource === 'custom' && (
                      <div className="h-4 w-4 rounded-md border-2 border-primary bg-primary flex items-center justify-center shrink-0 ml-auto">
                        <Check className="h-2.5 w-2.5 text-accent-foreground" />
                      </div>
                    )}
                  </button>
                  <button onClick={() => { updateSettings({ logoSource: 'company' }); refreshCompanyLogo() }}
                    className={`flex items-center gap-2.5 rounded-xl border-2 p-3 text-left transition-all ${
                      settings.logoSource === 'company' ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/30'
                    }`}>
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg shrink-0 ${settings.logoSource === 'company' ? 'bg-accent-soft' : 'bg-muted'}`}>
                      <Building2 className={`h-4 w-4 ${settings.logoSource === 'company' ? 'text-accent' : 'text-muted-foreground'}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-foreground">Logo entreprise</p>
                      <p className="text-[10px] text-muted-foreground">Utiliser celui de l&apos;entreprise</p>
                    </div>
                    {settings.logoSource === 'company' && (
                      <div className="h-4 w-4 rounded-md border-2 border-primary bg-primary flex items-center justify-center shrink-0 ml-auto">
                        <Check className="h-2.5 w-2.5 text-accent-foreground" />
                      </div>
                    )}
                  </button>
                </div>

                {settings.logoSource === 'custom' ? (
                  <div className="flex items-start gap-6">
                    <div className="relative group">
                      <div className="h-24 w-24 border-2 border-dashed border-border bg-surface flex items-center justify-center overflow-hidden" style={{ borderRadius: `${settings.logoBorderRadius}px` }}>
                        {settings.logoUrl ? (
                          <img src={settings.logoUrl} alt="Logo" className="h-full w-full object-contain p-2" style={{ borderRadius: `${settings.logoBorderRadius}px` }} />
                        ) : (
                          <ImagePlus className="h-8 w-8 text-muted-secondary" />
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
                    <div className="h-16 w-16 bg-surface flex items-center justify-center overflow-hidden shrink-0" style={{ borderRadius: `${settings.logoBorderRadius}px` }}>
                      {companyLogoUrl ? (
                        <img src={companyLogoUrl} alt="Logo entreprise" className="h-full w-full object-contain p-2" style={{ borderRadius: `${settings.logoBorderRadius}px` }} />
                      ) : (
                        <Building2 className="h-6 w-6 text-muted-secondary" />
                      )}
                    </div>
                    <div className="flex-1">
                      {companyLogoUrl ? (
                        <p className="text-sm text-muted-foreground">Le logo de votre entreprise sera utilisé sur vos documents.</p>
                      ) : (
                        <p className="text-sm text-muted-foreground">Aucun logo d&apos;entreprise configuré. Ajoutez-en un dans la page <a href="/dashboard/company" className="text-accent underline underline-offset-2">Entreprise</a>.</p>
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
          </motion.div>

          {/* Accent Color */}
          <motion.div variants={fadeUp} custom={3}>
            <Card className="overflow-hidden border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft">
                    <Palette className="h-4.5 w-4.5 text-accent" />
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
          </motion.div>

          {/* Document Font */}
          <motion.div variants={fadeUp} custom={4}>
            <Card className="overflow-hidden border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft">
                    <Type className="h-4.5 w-4.5 text-accent" />
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
                          <Check className="h-3 w-3 text-accent-foreground" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Preview Column */}
        <motion.div variants={fadeUp} custom={2}>
          <InvoicePreview />
        </motion.div>
      </div>

      {/* Template Modal */}
      <TemplateModal
        open={templateModalOpen}
        onClose={() => setTemplateModalOpen(false)}
        accentColor={settings.accentColor}
        currentTemplate={settings.template}
        onSelect={(id) => updateSettings({ template: id })}
      />
    </motion.div>
  )
}
