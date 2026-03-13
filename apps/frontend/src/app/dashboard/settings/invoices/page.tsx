'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
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
    transition: { delay: i * 0.06, duration: 0.4, ease: 'easeOut' },
  }),
}

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
      toast({ title: 'Erreur', description: error, variant: 'destructive' })
    } else {
      toast({ title: 'Enregistre', description: 'Vos parametres de facturation ont ete mis a jour.' })
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
      toast({ title: 'Erreur', description: error, variant: 'destructive' })
    } else if (data?.logoUrl) {
      setSettings((prev) => ({ ...prev, logoUrl: data.logoUrl }))
      toast({ title: 'Logo mis a jour', description: 'Votre logo a ete telecharge.' })
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
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-40 rounded-xl" />
            <Skeleton className="h-48 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-56 rounded-xl" />
          </div>
          <div>
            <Skeleton className="h-[500px] rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      className="max-w-4xl mx-auto space-y-6"
    >
      {/* Header */}
      <motion.div variants={fadeUp} custom={0}>
        <h1 className="text-2xl font-bold text-foreground">Facturation</h1>
        <p className="text-muted-foreground mt-1">
          Personnalisez vos factures et devis
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Column */}
        <div className="lg:col-span-2 space-y-6">
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
                            ringColor: settings.accentColor === color.value ? color.value : undefined,
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

        {/* Preview Column */}
        <motion.div variants={fadeUp} custom={2} className="lg:col-span-1">
          <div className="sticky top-6">
            <Card className="overflow-hidden border-border/50">
              <CardContent className="p-0">
                {/* Preview header */}
                <div className="p-4 border-b border-border">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium text-foreground">Apercu</p>
                  </div>
                </div>

                {/* Mini invoice preview */}
                <div className="p-4">
                  <div className="rounded-lg border border-border bg-white p-4 space-y-4">
                    {/* Header with logo and color */}
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        {settings.logoUrl ? (
                          <img src={settings.logoUrl} alt="Logo" className="h-8 w-auto" />
                        ) : (
                          <div className="h-8 w-16 rounded bg-gray-200 flex items-center justify-center">
                            <ImagePlus className="h-4 w-4 text-gray-400" />
                          </div>
                        )}
                        <p className="text-[8px] text-gray-400">Votre entreprise</p>
                      </div>
                      <div className="text-right">
                        <p
                          className="text-xs font-bold"
                          style={{ color: settings.accentColor }}
                        >
                          FACTURE
                        </p>
                        <p className="text-[8px] text-gray-400">#F-2025-001</p>
                      </div>
                    </div>

                    {/* Accent bar */}
                    <div
                      className="h-0.5 rounded-full"
                      style={{ backgroundColor: settings.accentColor }}
                    />

                    {/* Skeleton content */}
                    <div className="space-y-2">
                      <div className="flex gap-4">
                        <div className="flex-1 space-y-1">
                          <div className="h-1.5 w-12 rounded-full bg-gray-200" />
                          <div className="h-1 w-20 rounded-full bg-gray-100" />
                          <div className="h-1 w-16 rounded-full bg-gray-100" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="h-1.5 w-12 rounded-full bg-gray-200" />
                          <div className="h-1 w-20 rounded-full bg-gray-100" />
                          <div className="h-1 w-16 rounded-full bg-gray-100" />
                        </div>
                      </div>
                    </div>

                    {/* Table skeleton */}
                    <div className="space-y-1">
                      <div
                        className="h-4 rounded flex items-center px-2"
                        style={{ backgroundColor: settings.accentColor + '15' }}
                      >
                        <div className="flex w-full gap-2">
                          <div className="h-1 w-16 rounded-full" style={{ backgroundColor: settings.accentColor + '40' }} />
                          <div className="flex-1" />
                          <div className="h-1 w-6 rounded-full" style={{ backgroundColor: settings.accentColor + '40' }} />
                          <div className="h-1 w-8 rounded-full" style={{ backgroundColor: settings.accentColor + '40' }} />
                        </div>
                      </div>
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-3 rounded flex items-center px-2">
                          <div className="flex w-full gap-2">
                            <div className="h-1 w-20 rounded-full bg-gray-100" />
                            <div className="flex-1" />
                            <div className="h-1 w-4 rounded-full bg-gray-100" />
                            <div className="h-1 w-8 rounded-full bg-gray-100" />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Total */}
                    <div className="flex justify-end">
                      <div
                        className="rounded px-3 py-1.5 text-right"
                        style={{ backgroundColor: settings.accentColor + '10' }}
                      >
                        <p className="text-[7px] text-gray-400">Total TTC</p>
                        <p
                          className="text-xs font-bold"
                          style={{ color: settings.accentColor }}
                        >
                          1 234,00 EUR
                        </p>
                      </div>
                    </div>

                    {/* Payment methods footer */}
                    <div className="border-t border-gray-100 pt-2">
                      <p className="text-[7px] text-gray-400 mb-1">Moyens de paiement</p>
                      <div className="flex flex-wrap gap-1">
                        {settings.paymentMethods.includes('bank_transfer') && (
                          <span className="text-[7px] bg-gray-100 text-gray-500 rounded px-1.5 py-0.5">
                            Virement
                          </span>
                        )}
                        {settings.paymentMethods.includes('cash') && (
                          <span className="text-[7px] bg-gray-100 text-gray-500 rounded px-1.5 py-0.5">
                            Especes
                          </span>
                        )}
                        {settings.paymentMethods.includes('custom') && settings.customPaymentMethod && (
                          <span className="text-[7px] bg-gray-100 text-gray-500 rounded px-1.5 py-0.5">
                            {settings.customPaymentMethod}
                          </span>
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
