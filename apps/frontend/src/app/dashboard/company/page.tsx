'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Field, FieldGroup, FieldLabel, FieldDescription } from '@/components/ui/field'
import { Tabs } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/components/ui/toast'
import { api } from '@/lib/api'
import { Select } from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { Building2, CreditCard, Receipt, Search, Info, Banknote, Coins, PenLine, Lock, ImagePlus, Trash2, Eye, EyeOff } from 'lucide-react'

interface Company {
  id: string
  legalName: string
  tradeName: string | null
  siren: string | null
  siret: string | null
  vatNumber: string | null
  legalForm: string | null
  addressLine1: string | null
  addressLine2: string | null
  city: string | null
  postalCode: string | null
  country: string
  phone: string | null
  email: string | null
  website: string | null
  logoUrl: string | null
  iban: string | null
  bic: string | null
  bankName: string | null
  paymentConditions: string | null
  currency: string
}

const tabs = [
  { id: 'info', label: 'Informations', icon: <Building2 className="h-4 w-4" /> },
  { id: 'bank', label: 'Banque', icon: <CreditCard className="h-4 w-4" /> },
  { id: 'payment', label: 'Paiement', icon: <Receipt className="h-4 w-4" /> },
]

export default function CompanyPage() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('info')
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [noCompany, setNoCompany] = useState(false)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    legalName: '',
    tradeName: '',
    siren: '',
    siret: '',
    vatNumber: '',
    legalForm: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    postalCode: '',
    phone: '',
    email: '',
    website: '',
  })

  const [bankForm, setBankForm] = useState({
    iban: '',
    bic: '',
    bankName: '',
  })
  const [showIban, setShowIban] = useState(false)
  const [showBic, setShowBic] = useState(false)

  const maskIban = (iban: string) => {
    const clean = iban.replace(/\s/g, '')
    if (clean.length <= 8) return '••••  ••••'
    return clean.slice(0, 4) + ' •••• •••• •••• •••• ' + clean.slice(-4)
  }

  const maskBic = (bic: string) => {
    if (bic.length <= 4) return '••••••••'
    return bic.slice(0, 4) + '••••'
  }

  const [paymentForm, setPaymentForm] = useState({
    paymentConditions: '',
    currency: 'EUR',
    paymentMethods: ['bank_transfer'] as string[],
    customPaymentMethod: '',
  })

  useEffect(() => {
    api.get<{ company: Company }>('/company').then(({ data, error }) => {
      if (data?.company) {
        setCompany(data.company)
        setLogoUrl(data.company.logoUrl)
        setForm({
          legalName: data.company.legalName || '',
          tradeName: data.company.tradeName || '',
          siren: data.company.siren || '',
          siret: data.company.siret || '',
          vatNumber: data.company.vatNumber || '',
          legalForm: data.company.legalForm || '',
          addressLine1: data.company.addressLine1 || '',
          addressLine2: data.company.addressLine2 || '',
          city: data.company.city || '',
          postalCode: data.company.postalCode || '',
          phone: data.company.phone || '',
          email: data.company.email || '',
          website: data.company.website || '',
        })
        setBankForm({
          iban: data.company.iban || '',
          bic: data.company.bic || '',
          bankName: data.company.bankName || '',
        })
        setPaymentForm({
          paymentConditions: data.company.paymentConditions || '',
          currency: data.company.currency || 'EUR',
          paymentMethods: (data.company as any).paymentMethods || ['bank_transfer'],
          customPaymentMethod: (data.company as any).customPaymentMethod || '',
        })
      } else {
        setNoCompany(true)
      }
      setLoading(false)
    })
  }, [])

  function updateForm(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSaveInfo(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    if (noCompany) {
      const { data, error } = await api.post<{ company: Company }>('/onboarding/company', form)
      setSaving(false)
      if (error) return toast(error, 'error')
      setNoCompany(false)
      setCompany(data?.company || null)
      toast('Entreprise créée', 'success')
    } else {
      const { error } = await api.put('/company', form)
      setSaving(false)
      if (error) return toast(error, 'error')
      toast('Informations mises à jour', 'success')
    }
  }

  async function handleSaveBank(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const { error } = await api.put('/company/bank', bankForm)
    setSaving(false)
    if (error) return toast(error, 'error')
    toast('Coordonnées bancaires mises à jour', 'success')
  }

  function togglePaymentMethod(method: string) {
    setPaymentForm((p) => {
      const methods = p.paymentMethods.includes(method)
        ? p.paymentMethods.filter((m) => m !== method)
        : [...p.paymentMethods, method]
      return { ...p, paymentMethods: methods }
    })
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const formData = new FormData()
    formData.append('logo', file)
    const { data, error } = await api.upload<{ logoUrl: string }>('/company/logo', formData)
    setUploading(false)
    if (error) return toast(error, 'error')
    if (data?.logoUrl) {
      setLogoUrl(data.logoUrl)
      toast('Logo mis à jour', 'success')
    }
  }

  async function handleRemoveLogo() {
    const { error } = await api.put('/company', { logoUrl: null })
    if (error) return toast(error, 'error')
    setLogoUrl(null)
    toast('Logo supprimé', 'success')
  }

  async function handleSavePayment(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const { error } = await api.put('/company', {
      paymentConditions: paymentForm.paymentConditions,
      currency: paymentForm.currency,
      paymentMethods: paymentForm.paymentMethods,
      customPaymentMethod: paymentForm.customPaymentMethod,
    })
    setSaving(false)
    if (error) return toast(error, 'error')
    toast('Conditions de paiement mises à jour', 'success')
  }

  if (loading) {
    return (
      <div className="space-y-6 px-4 lg:px-6 py-4 md:py-6">
        {/* Header */}
        <div className="space-y-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
        {/* Tabs */}
        <div className="flex gap-2">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-9 w-32 rounded-lg" />
          ))}
        </div>
        {/* Card with form fields */}
        <div className="rounded-2xl border border-border/50 p-6 space-y-5">
          {/* Logo section */}
          <div className="flex items-start gap-6">
            <Skeleton className="h-24 w-24 rounded-xl shrink-0" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-3.5 w-full max-w-xs" />
              <Skeleton className="h-8 w-32 rounded-lg" />
            </div>
          </div>
          <Skeleton className="h-px w-full" />
          {/* Form fields */}
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          ))}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Skeleton className="h-3.5 w-16" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3.5 w-16" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          </div>
          <Skeleton className="h-10 w-28 rounded-lg" />
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 px-4 lg:px-6 py-4 md:py-6"
    >
      <div>
        <h1 className="text-2xl font-bold text-foreground">Entreprise</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Gérez les informations de votre entreprise.
        </p>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Info tab */}
      {activeTab === 'info' && (
        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSaveInfo}>
              <FieldGroup>
                {/* Company Logo */}
                <h3 className="font-semibold text-foreground">Logo de l&apos;entreprise</h3>
                <div className="flex items-start gap-6">
                  <div className="relative group">
                    <div className="h-24 w-24 rounded-xl border-2 border-dashed border-border bg-muted/30 flex items-center justify-center overflow-hidden">
                      {logoUrl ? (
                        <img src={logoUrl} alt="Logo" className="h-full w-full object-contain p-2" />
                      ) : (
                        <ImagePlus className="h-8 w-8 text-muted-foreground/50" />
                      )}
                    </div>
                    {logoUrl && (
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                  <div className="flex-1 space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Ce logo apparaitra sur vos factures, devis et documents. Format recommande : PNG ou SVG, fond transparent.
                    </p>
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/png,image/svg+xml,image/jpeg,image/webp"
                      className="hidden"
                      onChange={handleLogoUpload}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => logoInputRef.current?.click()}
                      disabled={uploading || noCompany}
                    >
                      {uploading ? <><Spinner className="text-foreground" /> Envoi...</> : 'Telecharger un logo'}
                    </Button>
                    {noCompany && (
                      <p className="text-xs text-muted-foreground">Enregistrez d&apos;abord les informations de l&apos;entreprise.</p>
                    )}
                  </div>
                </div>

                <Separator />
                <h3 className="font-semibold text-foreground">Informations légales</h3>

                <Field>
                  <FieldLabel htmlFor="legalName">Raison sociale *</FieldLabel>
                  <Input id="legalName" value={form.legalName} onChange={(e) => updateForm('legalName', e.target.value)} required />
                </Field>

                <Field>
                  <FieldLabel htmlFor="tradeName">Nom commercial</FieldLabel>
                  <Input id="tradeName" value={form.tradeName} onChange={(e) => updateForm('tradeName', e.target.value)} />
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="siren">SIREN</FieldLabel>
                    <Input id="siren" value={form.siren} onChange={(e) => updateForm('siren', e.target.value)} maxLength={9} />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="siret">SIRET</FieldLabel>
                    <Input id="siret" value={form.siret} onChange={(e) => updateForm('siret', e.target.value)} maxLength={14} />
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="vatNumber">N° TVA</FieldLabel>
                    <Input id="vatNumber" value={form.vatNumber} onChange={(e) => updateForm('vatNumber', e.target.value)} />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="legalForm">Forme juridique</FieldLabel>
                    <Input id="legalForm" value={form.legalForm} onChange={(e) => updateForm('legalForm', e.target.value)} />
                  </Field>
                </div>

                <Separator />
                <h3 className="font-semibold text-foreground">Adresse</h3>

                <Field>
                  <FieldLabel htmlFor="addressLine1">Adresse ligne 1</FieldLabel>
                  <Input id="addressLine1" value={form.addressLine1} onChange={(e) => updateForm('addressLine1', e.target.value)} />
                </Field>

                <Field>
                  <FieldLabel htmlFor="addressLine2">Adresse ligne 2</FieldLabel>
                  <Input id="addressLine2" value={form.addressLine2} onChange={(e) => updateForm('addressLine2', e.target.value)} />
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="postalCode">Code postal</FieldLabel>
                    <Input id="postalCode" value={form.postalCode} onChange={(e) => updateForm('postalCode', e.target.value)} />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="city">Ville</FieldLabel>
                    <Input id="city" value={form.city} onChange={(e) => updateForm('city', e.target.value)} />
                  </Field>
                </div>

                <Separator />
                <h3 className="font-semibold text-foreground">Contact</h3>

                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="phone">Téléphone</FieldLabel>
                    <Input id="phone" value={form.phone} onChange={(e) => updateForm('phone', e.target.value)} />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="companyEmail">Email</FieldLabel>
                    <Input id="companyEmail" type="email" value={form.email} onChange={(e) => updateForm('email', e.target.value)} />
                  </Field>
                </div>

                <Field>
                  <FieldLabel htmlFor="website">Site web</FieldLabel>
                  <Input id="website" value={form.website} onChange={(e) => updateForm('website', e.target.value)} />
                </Field>

                <Button type="submit" disabled={saving}>
                  {saving ? <><Spinner className="text-primary-foreground" /> Enregistrement...</> : 'Enregistrer'}
                </Button>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Bank tab */}
      {activeTab === 'bank' && (
        <Card>
          <CardContent className="p-6">
            {noCompany ? (
              <div className="flex flex-col items-center py-8 text-center">
                <CreditCard className="h-8 w-8 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">
                  Créez d&apos;abord votre entreprise dans l&apos;onglet Informations.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSaveBank}>
                <FieldGroup>
                  <h3 className="font-semibold text-foreground">Coordonnées bancaires</h3>
                  <FieldDescription>
                    Ces informations apparaîtront sur vos factures.
                  </FieldDescription>

                  <Field>
                    <FieldLabel htmlFor="iban">IBAN</FieldLabel>
                    <div className="relative">
                      <Input
                        id="iban"
                        value={showIban ? bankForm.iban : (bankForm.iban ? maskIban(bankForm.iban) : '')}
                        onChange={(e) => { if (showIban) setBankForm((p) => ({ ...p, iban: e.target.value })) }}
                        onFocus={() => setShowIban(true)}
                        placeholder="FR76 XXXX XXXX XXXX XXXX XXXX XXX"
                        className="pr-10"
                        readOnly={!showIban}
                      />
                      <button
                        type="button"
                        onClick={() => setShowIban((v) => !v)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showIban ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </Field>

                  <div className="grid grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel htmlFor="bic">BIC / SWIFT</FieldLabel>
                      <div className="relative">
                        <Input
                          id="bic"
                          value={showBic ? bankForm.bic : (bankForm.bic ? maskBic(bankForm.bic) : '')}
                          onChange={(e) => { if (showBic) setBankForm((p) => ({ ...p, bic: e.target.value })) }}
                          onFocus={() => setShowBic(true)}
                          className="pr-10"
                          readOnly={!showBic}
                        />
                        <button
                          type="button"
                          onClick={() => setShowBic((v) => !v)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showBic ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="bankName">Nom de la banque</FieldLabel>
                      <Input id="bankName" value={bankForm.bankName} onChange={(e) => setBankForm((p) => ({ ...p, bankName: e.target.value }))} />
                    </Field>
                  </div>

                  <Button type="submit" disabled={saving}>
                    {saving ? <><Spinner className="text-primary-foreground" /> Enregistrement...</> : 'Enregistrer'}
                  </Button>
                </FieldGroup>
              </form>
            )}
          </CardContent>
        </Card>
      )}

      {/* Payment tab */}
      {activeTab === 'payment' && (
        <Card>
          <CardContent className="p-6">
            {noCompany ? (
              <div className="flex flex-col items-center py-8 text-center">
                <Receipt className="h-8 w-8 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">
                  Créez d&apos;abord votre entreprise dans l&apos;onglet Informations.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSavePayment}>
                <FieldGroup>
                  <h3 className="font-semibold text-foreground">Devise et conditions</h3>

                  <Field>
                    <FieldLabel htmlFor="currency">Devise</FieldLabel>
                    <Select
                      id="currency"
                      value={paymentForm.currency}
                      onChange={(e) => setPaymentForm((p) => ({ ...p, currency: e.target.value }))}
                    >
                      <option value="EUR">EUR - Euro</option>
                      <option value="USD">USD - Dollar américain</option>
                      <option value="GBP">GBP - Livre sterling</option>
                      <option value="CHF">CHF - Franc suisse</option>
                      <option value="CAD">CAD - Dollar canadien</option>
                    </Select>
                    <FieldDescription>
                      La devise utilisée par défaut sur vos factures et devis.
                    </FieldDescription>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="paymentConditions">Conditions de paiement</FieldLabel>
                    <Input
                      id="paymentConditions"
                      value={paymentForm.paymentConditions}
                      onChange={(e) => setPaymentForm((p) => ({ ...p, paymentConditions: e.target.value }))}
                      placeholder="Ex: Paiement à 30 jours"
                    />
                    <FieldDescription>
                      Ces conditions seront ajoutées par défaut à vos factures.
                    </FieldDescription>
                  </Field>

                  <Separator className="my-2" />

                  <h3 className="font-semibold text-foreground">Moyens de paiement acceptés</h3>
                  <FieldDescription>
                    Sélectionnez les moyens de paiement que vous souhaitez afficher sur vos factures.
                  </FieldDescription>

                  <div className="space-y-3">
                    {/* Virement bancaire */}
                    <label className="flex items-center gap-4 rounded-xl border border-border p-4 cursor-pointer hover:bg-muted/30 transition-colors has-[:checked]:border-primary/40 has-[:checked]:bg-primary/5">
                      <input
                        type="checkbox"
                        checked={paymentForm.paymentMethods.includes('bank_transfer')}
                        onChange={() => togglePaymentMethod('bank_transfer')}
                        className="sr-only"
                      />
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <Banknote className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">Virement bancaire</p>
                        <p className="text-xs text-muted-foreground">Vos coordonnées bancaires seront affichées sur la facture</p>
                      </div>
                      <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${paymentForm.paymentMethods.includes('bank_transfer') ? 'bg-primary border-primary' : 'border-muted-foreground/30'}`}>
                        {paymentForm.paymentMethods.includes('bank_transfer') && (
                          <svg className="h-3 w-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </label>

                    {/* Espèces */}
                    <label className="flex items-center gap-4 rounded-xl border border-border p-4 cursor-pointer hover:bg-muted/30 transition-colors has-[:checked]:border-primary/40 has-[:checked]:bg-primary/5">
                      <input
                        type="checkbox"
                        checked={paymentForm.paymentMethods.includes('cash')}
                        onChange={() => togglePaymentMethod('cash')}
                        className="sr-only"
                      />
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-500/10">
                        <Coins className="h-5 w-5 text-green-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">Espèces</p>
                        <p className="text-xs text-muted-foreground">Paiement en espèces accepté</p>
                      </div>
                      <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${paymentForm.paymentMethods.includes('cash') ? 'bg-primary border-primary' : 'border-muted-foreground/30'}`}>
                        {paymentForm.paymentMethods.includes('cash') && (
                          <svg className="h-3 w-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </label>

                    {/* Autre (custom) */}
                    <label className="flex items-center gap-4 rounded-xl border border-border p-4 cursor-pointer hover:bg-muted/30 transition-colors has-[:checked]:border-primary/40 has-[:checked]:bg-primary/5">
                      <input
                        type="checkbox"
                        checked={paymentForm.paymentMethods.includes('custom')}
                        onChange={() => togglePaymentMethod('custom')}
                        className="sr-only"
                      />
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-yellow-500/10">
                        <PenLine className="h-5 w-5 text-yellow-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">Autre</p>
                        <p className="text-xs text-muted-foreground">Définissez un moyen de paiement personnalisé</p>
                      </div>
                      <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${paymentForm.paymentMethods.includes('custom') ? 'bg-primary border-primary' : 'border-muted-foreground/30'}`}>
                        {paymentForm.paymentMethods.includes('custom') && (
                          <svg className="h-3 w-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </label>

                    {paymentForm.paymentMethods.includes('custom') && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="pl-14"
                      >
                        <Input
                          placeholder="Ex: Chèque, PayPal, etc."
                          value={paymentForm.customPaymentMethod}
                          onChange={(e) => setPaymentForm((p) => ({ ...p, customPaymentMethod: e.target.value }))}
                        />
                      </motion.div>
                    )}
                  </div>

                  <Separator className="my-2" />

                  <h3 className="font-semibold text-muted-foreground text-sm">Paiement en ligne</h3>
                  <div className="space-y-3 opacity-50">
                    {/* Stripe - disabled */}
                    <div className="flex items-center gap-4 rounded-xl border border-border p-4 cursor-not-allowed">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <CreditCard className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-muted-foreground">Stripe</p>
                        <p className="text-xs text-muted-foreground">Carte bancaire, Apple Pay, Google Pay</p>
                      </div>
                      <Lock className="h-4 w-4 text-muted-foreground shrink-0" />
                    </div>

                    {/* PayPal - disabled */}
                    <div className="flex items-center gap-4 rounded-xl border border-border p-4 cursor-not-allowed">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <CreditCard className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-muted-foreground">PayPal</p>
                        <p className="text-xs text-muted-foreground">Paiement via compte PayPal</p>
                      </div>
                      <Lock className="h-4 w-4 text-muted-foreground shrink-0" />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
                    <Info className="h-5 w-5 text-primary shrink-0" />
                    <p className="text-sm text-foreground">
                      L&apos;intégration des paiements en ligne (Stripe, PayPal) arrive bientôt.
                    </p>
                  </div>

                  <Button type="submit" disabled={saving}>
                    {saving ? <><Spinner className="text-primary-foreground" /> Enregistrement...</> : 'Enregistrer'}
                  </Button>
                </FieldGroup>
              </form>
            )}
          </CardContent>
        </Card>
      )}
    </motion.div>
  )
}
