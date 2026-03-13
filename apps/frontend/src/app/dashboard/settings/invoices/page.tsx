'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, type Variants } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Field, FieldGroup, FieldLabel, FieldDescription } from '@/components/ui/field'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/toast'
import { Spinner } from '@/components/ui/spinner'
import { api } from '@/lib/api'
import {
  FileText,
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

interface InvoiceSettings {
  billingType: 'quick' | 'detailed'
  logoUrl: string | null
  accentColor: string
  paymentMethods: string[]
  customPaymentMethod: string
}

export default function InvoiceSettingsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [settings, setSettings] = useState<InvoiceSettings>({
    billingType: 'quick',
    logoUrl: null,
    accentColor: '#6366f1',
    paymentMethods: ['bank_transfer'],
    customPaymentMethod: '',
  })

  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
    setLoading(true)
    const { data } = await api.get<{ settings: InvoiceSettings }>('/settings/invoices')
    if (data?.settings) {
      setSettings(data.settings)
    }
    setLoading(false)
  }

  async function handleSave() {
    setSaving(true)
    const { error } = await api.put('/settings/invoices', settings)
    setSaving(false)
    if (error) {
      toast(error, 'error')
    } else {
      toast('Paramètres enregistrés', 'success')
    }
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append('logo', file)

    const { data, error } = await api.upload<{ logoUrl: string }>('/settings/invoices/logo', formData)
    setUploading(false)

    if (error) {
      toast(error, 'error')
    } else if (data?.logoUrl) {
      setSettings((prev) => ({ ...prev, logoUrl: data.logoUrl }))
      toast('Logo mis à jour', 'success')
    }
  }

  function handleRemoveLogo() {
    setSettings((prev) => ({ ...prev, logoUrl: null }))
  }

  function togglePaymentMethod(method: string) {
    setSettings((prev) => ({
      ...prev,
      paymentMethods: prev.paymentMethods.includes(method)
        ? prev.paymentMethods.filter((m) => m !== method)
        : [...prev.paymentMethods, method],
    }))
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
          {/* Billing Type */}
          <motion.div variants={fadeUp} custom={1}>
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
                    onClick={() => setSettings((prev) => ({ ...prev, billingType: 'quick' }))}
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
                    onClick={() => setSettings((prev) => ({ ...prev, billingType: 'detailed' }))}
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
          <motion.div variants={fadeUp} custom={2}>
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
                  {/* Logo preview */}
                  <div className="relative group">
                    <div className="h-24 w-24 rounded-xl border-2 border-dashed border-border bg-muted/30 flex items-center justify-center overflow-hidden">
                      {settings.logoUrl ? (
                        <img
                          src={settings.logoUrl}
                          alt="Logo"
                          className="h-full w-full object-contain p-2"
                        />
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

                  {/* Upload actions */}
                  <div className="flex-1 space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Format recommande : PNG ou SVG, fond transparent, 500x500px minimum
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/svg+xml,image/jpeg"
                      className="hidden"
                      onChange={handleLogoUpload}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                    >
                      {uploading ? <><Spinner /> Envoi...</> : 'Telecharger un logo'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Accent Color */}
          <motion.div variants={fadeUp} custom={3}>
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
                  {/* Color grid */}
                  <div className="flex flex-wrap gap-2.5">
                    {accentColors.map((color) => (
                      <button
                        key={color.value}
                        onClick={() => setSettings((prev) => ({ ...prev, accentColor: color.value }))}
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

                  {/* Custom color input */}
                  <div className="flex items-center gap-3">
                    <div
                      className="h-9 w-9 rounded-lg border border-border shrink-0"
                      style={{ backgroundColor: settings.accentColor }}
                    />
                    <Input
                      value={settings.accentColor}
                      onChange={(e) => setSettings((prev) => ({ ...prev, accentColor: e.target.value }))}
                      placeholder="#6366f1"
                      className="font-mono text-sm max-w-[140px]"
                    />
                    <p className="text-xs text-muted-foreground">Code hexadecimal</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Payment Methods */}
          <motion.div variants={fadeUp} custom={4}>
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
                  {/* Bank Transfer */}
                  <button
                    onClick={() => togglePaymentMethod('bank_transfer')}
                    className={`flex w-full items-center gap-3 rounded-xl border-2 p-4 text-left transition-all ${
                      settings.paymentMethods.includes('bank_transfer')
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-muted-foreground/30'
                    }`}
                  >
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                      settings.paymentMethods.includes('bank_transfer') ? 'bg-primary/10' : 'bg-muted'
                    }`}>
                      <Banknote className={`h-5 w-5 ${
                        settings.paymentMethods.includes('bank_transfer') ? 'text-primary' : 'text-muted-foreground'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">Virement bancaire</p>
                      <p className="text-xs text-muted-foreground">IBAN, BIC et nom de la banque</p>
                    </div>
                    <div className={`h-5 w-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                      settings.paymentMethods.includes('bank_transfer')
                        ? 'border-primary bg-primary'
                        : 'border-muted-foreground/30'
                    }`}>
                      {settings.paymentMethods.includes('bank_transfer') && (
                        <Check className="h-3 w-3 text-primary-foreground" />
                      )}
                    </div>
                  </button>

                  {/* Cash */}
                  <button
                    onClick={() => togglePaymentMethod('cash')}
                    className={`flex w-full items-center gap-3 rounded-xl border-2 p-4 text-left transition-all ${
                      settings.paymentMethods.includes('cash')
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-muted-foreground/30'
                    }`}
                  >
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                      settings.paymentMethods.includes('cash') ? 'bg-primary/10' : 'bg-muted'
                    }`}>
                      <Coins className={`h-5 w-5 ${
                        settings.paymentMethods.includes('cash') ? 'text-primary' : 'text-muted-foreground'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">Especes</p>
                      <p className="text-xs text-muted-foreground">Paiement en especes</p>
                    </div>
                    <div className={`h-5 w-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                      settings.paymentMethods.includes('cash')
                        ? 'border-primary bg-primary'
                        : 'border-muted-foreground/30'
                    }`}>
                      {settings.paymentMethods.includes('cash') && (
                        <Check className="h-3 w-3 text-primary-foreground" />
                      )}
                    </div>
                  </button>

                  {/* Custom */}
                  <div>
                    <button
                      onClick={() => togglePaymentMethod('custom')}
                      className={`flex w-full items-center gap-3 rounded-xl border-2 p-4 text-left transition-all ${
                        settings.paymentMethods.includes('custom')
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-muted-foreground/30'
                      }`}
                    >
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                        settings.paymentMethods.includes('custom') ? 'bg-primary/10' : 'bg-muted'
                      }`}>
                        <PenLine className={`h-5 w-5 ${
                          settings.paymentMethods.includes('custom') ? 'text-primary' : 'text-muted-foreground'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">Autre</p>
                        <p className="text-xs text-muted-foreground">Moyen de paiement personnalise</p>
                      </div>
                      <div className={`h-5 w-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                        settings.paymentMethods.includes('custom')
                          ? 'border-primary bg-primary'
                          : 'border-muted-foreground/30'
                      }`}>
                        {settings.paymentMethods.includes('custom') && (
                          <Check className="h-3 w-3 text-primary-foreground" />
                        )}
                      </div>
                    </button>
                    {settings.paymentMethods.includes('custom') && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mt-2 ml-14"
                      >
                        <Input
                          placeholder="Ex: Cheque, PayPal, etc."
                          value={settings.customPaymentMethod}
                          onChange={(e) => setSettings((prev) => ({ ...prev, customPaymentMethod: e.target.value }))}
                          className="text-sm"
                        />
                      </motion.div>
                    )}
                  </div>

                  <Separator />

                  {/* Disabled methods */}
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider px-1">Bientot disponible</p>
                    {[
                      { name: 'Stripe', desc: 'Paiement en ligne par carte bancaire' },
                      { name: 'PayPal', desc: 'Paiement via compte PayPal' },
                    ].map((method) => (
                      <div
                        key={method.name}
                        className="flex items-center gap-3 rounded-xl border-2 border-border/50 p-4 opacity-50 cursor-not-allowed"
                      >
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

          {/* Save Button */}
          <motion.div variants={fadeUp} custom={5} className="flex justify-end">
            <Button onClick={handleSave} disabled={saving} className="min-w-[160px]">
              {saving ? <><Spinner /> Enregistrement...</> : 'Enregistrer'}
            </Button>
          </motion.div>
        </div>

        {/* Preview Column — A4-like document */}
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
                    {settings.billingType === 'quick' ? 'Facture rapide' : 'Facture complete'}
                  </p>
                </div>

                {/* A4 Document Preview */}
                <div className="p-5 bg-muted/30">
                  <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden" style={{ aspectRatio: '1 / 1.2' }}>
                    <div className="h-full flex flex-col p-6 sm:p-8">

                      {/* Document header */}
                      <div className="flex items-start justify-between mb-5">
                        <div className="space-y-2">
                          {settings.logoUrl ? (
                            <img src={settings.logoUrl} alt="Logo" className="h-10 w-auto max-w-[120px] object-contain" />
                          ) : (
                            <div className="h-10 w-20 rounded-md bg-gray-100 border border-dashed border-gray-300 flex items-center justify-center">
                              <ImagePlus className="h-5 w-5 text-gray-300" />
                            </div>
                          )}
                          <div className="space-y-0.5">
                            <div className="h-2 w-24 rounded-full bg-gray-200" />
                            <div className="h-1.5 w-32 rounded-full bg-gray-100" />
                            <div className="h-1.5 w-28 rounded-full bg-gray-100" />
                          </div>
                        </div>
                        <div className="text-right space-y-1">
                          <p className="text-sm font-bold tracking-wide" style={{ color: settings.accentColor }}>
                            FACTURE
                          </p>
                          <p className="text-[10px] text-gray-400 font-medium">#F-2025-001</p>
                          <p className="text-[10px] text-gray-400">13/03/2025</p>
                        </div>
                      </div>

                      {/* Accent divider */}
                      <div className="h-[2px] rounded-full mb-5" style={{ backgroundColor: settings.accentColor }} />

                      {/* Addresses: From / To */}
                      <div className="grid grid-cols-2 gap-6 mb-6">
                        <div className="space-y-1">
                          <p className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: settings.accentColor }}>
                            Emetteur
                          </p>
                          <div className="space-y-0.5">
                            <div className="h-2 w-28 rounded-full bg-gray-200" />
                            <div className="h-1.5 w-36 rounded-full bg-gray-100" />
                            <div className="h-1.5 w-24 rounded-full bg-gray-100" />
                            <div className="h-1.5 w-20 rounded-full bg-gray-100" />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: settings.accentColor }}>
                            Client
                          </p>
                          <div className="space-y-0.5">
                            <div className="h-2 w-24 rounded-full bg-gray-200" />
                            <div className="h-1.5 w-32 rounded-full bg-gray-100" />
                            <div className="h-1.5 w-28 rounded-full bg-gray-100" />
                          </div>
                        </div>
                      </div>

                      {/* Items table */}
                      <div className="flex-1 min-h-0">
                        {/* Table header */}
                        <div
                          className="rounded-t-md px-3 py-2 flex items-center"
                          style={{ backgroundColor: settings.accentColor + '12' }}
                        >
                          <div className="flex w-full items-center gap-2">
                            <div className="h-1.5 w-20 rounded-full" style={{ backgroundColor: settings.accentColor + '50' }} />
                            <div className="flex-1" />
                            {settings.billingType === 'detailed' && (
                              <>
                                <div className="h-1.5 w-8 rounded-full" style={{ backgroundColor: settings.accentColor + '50' }} />
                                <div className="h-1.5 w-10 rounded-full" style={{ backgroundColor: settings.accentColor + '50' }} />
                              </>
                            )}
                            <div className="h-1.5 w-8 rounded-full" style={{ backgroundColor: settings.accentColor + '50' }} />
                            <div className="h-1.5 w-12 rounded-full" style={{ backgroundColor: settings.accentColor + '50' }} />
                          </div>
                        </div>

                        {/* Table rows */}
                        {[...Array(settings.billingType === 'detailed' ? 4 : 3)].map((_, i) => (
                          <div key={i} className={`px-3 py-2.5 flex items-center ${i < (settings.billingType === 'detailed' ? 3 : 2) ? 'border-b border-gray-100' : ''}`}>
                            <div className="flex w-full items-center gap-2">
                              <div className="h-1.5 rounded-full bg-gray-200" style={{ width: `${60 + (i % 3) * 15}px` }} />
                              <div className="flex-1" />
                              {settings.billingType === 'detailed' && (
                                <>
                                  <div className="h-1.5 w-6 rounded-full bg-gray-100" />
                                  <div className="h-1.5 w-8 rounded-full bg-gray-100" />
                                </>
                              )}
                              <div className="h-1.5 w-6 rounded-full bg-gray-100" />
                              <div className="h-1.5 w-10 rounded-full bg-gray-200" />
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Totals section */}
                      <div className="flex justify-end mt-4 mb-4">
                        <div className="w-48 space-y-1.5">
                          {settings.billingType === 'detailed' && (
                            <>
                              <div className="flex items-center justify-between">
                                <p className="text-[9px] text-gray-400">Sous-total HT</p>
                                <div className="h-1.5 w-14 rounded-full bg-gray-200" />
                              </div>
                              <div className="flex items-center justify-between">
                                <p className="text-[9px] text-gray-400">TVA (20%)</p>
                                <div className="h-1.5 w-10 rounded-full bg-gray-200" />
                              </div>
                              <div className="flex items-center justify-between">
                                <p className="text-[9px] text-gray-400">Remise</p>
                                <div className="h-1.5 w-8 rounded-full bg-gray-100" />
                              </div>
                              <div className="h-px bg-gray-200 my-1" />
                            </>
                          )}
                          <div
                            className="flex items-center justify-between rounded-md px-3 py-2"
                            style={{ backgroundColor: settings.accentColor + '10' }}
                          >
                            <p className="text-[10px] font-semibold" style={{ color: settings.accentColor }}>
                              Total TTC
                            </p>
                            <p className="text-xs font-bold" style={{ color: settings.accentColor }}>
                              1 234,00 EUR
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Footer: payment methods + legal */}
                      <div className="border-t border-gray-100 pt-3 mt-auto space-y-2">
                        {settings.paymentMethods.length > 0 && (
                          <div>
                            <p className="text-[8px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                              Moyens de paiement acceptes
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {settings.paymentMethods.includes('bank_transfer') && (
                                <span className="text-[8px] bg-gray-50 text-gray-500 rounded-md px-2 py-0.5 border border-gray-100">
                                  Virement bancaire
                                </span>
                              )}
                              {settings.paymentMethods.includes('cash') && (
                                <span className="text-[8px] bg-gray-50 text-gray-500 rounded-md px-2 py-0.5 border border-gray-100">
                                  Especes
                                </span>
                              )}
                              {settings.paymentMethods.includes('custom') && settings.customPaymentMethod && (
                                <span className="text-[8px] bg-gray-50 text-gray-500 rounded-md px-2 py-0.5 border border-gray-100">
                                  {settings.customPaymentMethod}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                        {settings.billingType === 'detailed' && (
                          <div className="space-y-0.5">
                            <div className="h-1 w-full rounded-full bg-gray-50" />
                            <div className="h-1 w-4/5 rounded-full bg-gray-50" />
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
    </motion.div>
  )
}
