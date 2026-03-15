'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/toast'
import { Spinner } from '@/components/ui/spinner'
import { useInvoiceSettings } from '@/lib/invoice-settings-context'
import { api } from '@/lib/api'
import { A4Sheet, ClientModal, type DocumentLine, type ClientInfo, type CompanyInfo } from '@/components/shared/a4-sheet'
import { DocumentOptionsPanel } from '@/components/shared/document-options'
import { Save, ArrowLeft, Eye, Pencil, SlidersHorizontal } from 'lucide-react'
import { Dialog, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes'
import { FirstDocumentBanner } from '@/components/shared/first-document-banner'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.05, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
} satisfies Variants

function generateId() {
  return Math.random().toString(36).substring(2, 9)
}

function getToday() {
  return new Date().toISOString().split('T')[0]
}

function getDefaultValidity() {
  const d = new Date()
  d.setDate(d.getDate() + 30)
  return d.toISOString().split('T')[0]
}

export default function NewQuotePage() {
  const router = useRouter()
  const { toast } = useToast()
  const { settings: invoiceSettings, companyLogoUrl, loading: settingsLoading } = useInvoiceSettings()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [mode, setMode] = useState<'edit' | 'preview'>('edit')
  const [quoteNumber, setQuoteNumber] = useState('')
  const [company, setCompany] = useState<CompanyInfo | null>(null)
  const [selectedClient, setSelectedClient] = useState<ClientInfo | null>(null)
  const [clientModalOpen, setClientModalOpen] = useState(false)
  const [accentColor, setAccentColor] = useState('#6366f1')
  const [showOptions, setShowOptions] = useState(true)

  const [lines, setLines] = useState<DocumentLine[]>([
    { id: generateId(), type: 'standard', description: '', saleType: '', quantity: 1, unit: '', unitPrice: 0, vatRate: 20 },
  ])

  const [options, setOptions] = useState({
    billingType: 'quick' as 'quick' | 'detailed',
    subject: '',
    issueDate: getToday(),
    validityDate: getDefaultValidity(),
    deliveryAddress: '',
    clientSiren: '',
    clientVatNumber: '',
    language: 'fr',
    acceptanceConditions: '',
    signatureField: false,
    documentTitle: '',
    freeField: '',
    globalDiscountType: 'none' as 'none' | 'percentage' | 'fixed',
    globalDiscountValue: 0,
    showNotes: true,
    vatExempt: false,
    footerText: '',
    showSubject: true,
    showDeliveryAddress: false,
    showAcceptanceConditions: false,
    showFreeField: false,
    showFooterText: false,
    footerMode: 'vat_exempt' as 'company_info' | 'vat_exempt' | 'custom',
    facturX: false,
  })

  const [notes, setNotes] = useState('')
  const [isDirty, setIsDirty] = useState(false)
  const { showModal, setShowModal, confirmNavigation, cancelNavigation } = useUnsavedChanges(isDirty)

  // Initialize
  useEffect(() => {
    async function init() {
      const [numberRes, companyRes] = await Promise.all([
        api.get<{ nextNumber: string }>('/quotes/next-number'),
        api.get<{ company: CompanyInfo }>('/company'),
      ])
      if (numberRes.data?.nextNumber) setQuoteNumber(numberRes.data.nextNumber)
      if (companyRes.data?.company) setCompany(companyRes.data.company)
      setLoading(false)
    }
    init()
  }, [])

  // Sync from settings (including defaults)
  useEffect(() => {
    if (!settingsLoading) {
      setOptions((prev) => ({
        ...prev,
        billingType: invoiceSettings.billingType,
        subject: invoiceSettings.defaultSubject || prev.subject,
        acceptanceConditions: invoiceSettings.defaultAcceptanceConditions || prev.acceptanceConditions,
        signatureField: invoiceSettings.defaultSignatureField || prev.signatureField,
        freeField: invoiceSettings.defaultFreeField || prev.freeField,
        showNotes: invoiceSettings.defaultShowNotes ?? prev.showNotes,
        vatExempt: invoiceSettings.defaultVatExempt || prev.vatExempt,
        footerText: invoiceSettings.defaultFooterText || prev.footerText,
        showDeliveryAddress: invoiceSettings.defaultShowDeliveryAddress || prev.showDeliveryAddress,
        language: invoiceSettings.defaultLanguage || prev.language,
        showSubject: !!(invoiceSettings.defaultSubject) || prev.showSubject,
        showAcceptanceConditions: !!(invoiceSettings.defaultAcceptanceConditions) || prev.showAcceptanceConditions,
        showFreeField: !!(invoiceSettings.defaultFreeField) || prev.showFreeField,
        showFooterText: !!(invoiceSettings.defaultFooterText) || prev.showFooterText,
        footerMode: invoiceSettings.footerMode || prev.footerMode,
      }))
      setAccentColor(invoiceSettings.accentColor)
    }
  }, [settingsLoading, invoiceSettings])

  // Handlers
  const handleUpdateLine = useCallback((index: number, partial: Partial<DocumentLine>) => {
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, ...partial } : l)))
    setIsDirty(true)
  }, [])

  const handleAddLine = useCallback((type: 'standard' | 'section') => {
    setLines((prev) => [
      ...prev,
      { id: generateId(), type, description: '', saleType: '', quantity: 1, unit: '', unitPrice: 0, vatRate: type === 'section' ? 0 : 20 },
    ])
    setIsDirty(true)
  }, [])

  const handleRemoveLine = useCallback((index: number) => {
    setLines((prev) => prev.filter((_, i) => i !== index))
    setIsDirty(true)
  }, [])

  const handleOptionsChange = useCallback((partial: Partial<typeof options>) => {
    setOptions((prev) => ({ ...prev, ...partial }))
    setIsDirty(true)
  }, [])

  const handleSelectClient = useCallback((client: ClientInfo) => {
    setSelectedClient(client)
    setOptions((prev) => ({
      ...prev,
      clientSiren: client.siren || prev.clientSiren,
      clientVatNumber: client.vatNumber || prev.clientVatNumber,
    }))
    setIsDirty(true)
  }, [])

  const handleClientFieldChange = useCallback((field: keyof ClientInfo, value: string) => {
    setSelectedClient((prev) => prev ? { ...prev, [field]: value } : prev)
    setIsDirty(true)
  }, [])

  const handleCompanyFieldChange = useCallback((field: keyof CompanyInfo, value: string) => {
    setCompany((prev) => prev ? { ...prev, [field]: value } : prev)
    setIsDirty(true)
  }, [])

  // Calculations
  const { subtotal, taxAmount, discountAmount, total, tvaBreakdown } = useMemo(() => {
    let sub = 0, tax = 0
    const tvaMap: Record<number, { base: number; amount: number }> = {}

    for (const line of lines) {
      if (line.type === 'section') continue
      const lt = options.billingType === 'quick' ? line.unitPrice : line.quantity * line.unitPrice
      const lTax = options.billingType === 'detailed' ? lt * (line.vatRate / 100) : 0
      sub += lt; tax += lTax

      if (options.billingType === 'detailed') {
        const rate = line.vatRate
        if (!tvaMap[rate]) tvaMap[rate] = { base: 0, amount: 0 }
        tvaMap[rate].base += lt; tvaMap[rate].amount += lTax
      }
    }

    let disc = 0
    if (options.globalDiscountType === 'percentage' && options.globalDiscountValue > 0) {
      disc = sub * (options.globalDiscountValue / 100)
    } else if (options.globalDiscountType === 'fixed' && options.globalDiscountValue > 0) {
      disc = options.globalDiscountValue
    }

    return {
      subtotal: Math.round(sub * 100) / 100,
      taxAmount: Math.round(tax * 100) / 100,
      discountAmount: Math.round(disc * 100) / 100,
      total: Math.round((sub + tax - disc) * 100) / 100,
      tvaBreakdown: Object.entries(tvaMap).map(([rate, data]) => ({
        rate: Number(rate),
        base: Math.round(data.base * 100) / 100,
        amount: Math.round(data.amount * 100) / 100,
      })),
    }
  }, [lines, options.billingType, options.globalDiscountType, options.globalDiscountValue])

  // Save
  async function handleSave() {
    if (!lines.some((l) => l.type === 'standard' && l.description.trim())) {
      toast('Ajoutez au moins une ligne avec une description', 'error')
      return
    }

    setSaving(true)

    const payload = {
      clientId: selectedClient?.id || undefined,
      subject: options.subject || undefined,
      issueDate: options.issueDate,
      validityDate: options.validityDate || undefined,
      billingType: options.billingType,
      accentColor,
      logoUrl: (invoiceSettings.logoSource === 'company' ? companyLogoUrl : invoiceSettings.logoUrl) || undefined,
      language: options.language,
      notes: notes || undefined,
      acceptanceConditions: options.acceptanceConditions || undefined,
      signatureField: options.signatureField,
      documentTitle: options.documentTitle || undefined,
      freeField: options.freeField || undefined,
      globalDiscountType: options.globalDiscountType,
      globalDiscountValue: options.globalDiscountValue,
      deliveryAddress: options.deliveryAddress || undefined,
      clientSiren: options.clientSiren || undefined,
      clientVatNumber: options.clientVatNumber || undefined,
      lines: lines
        .filter((l) => l.description.trim())
        .map((l) => ({
          description: l.description,
          saleType: l.type === 'section' ? 'section' : l.saleType || undefined,
          quantity: l.type === 'section' ? 1 : options.billingType === 'quick' ? 1 : l.quantity,
          unit: l.type === 'section' ? undefined : l.unit || undefined,
          unitPrice: l.type === 'section' ? 0 : l.unitPrice,
          vatRate: l.type === 'section' ? 0 : options.billingType === 'quick' ? 0 : l.vatRate,
        })),
    }

    const { error } = await api.post('/quotes', payload)
    setSaving(false)

    if (error) {
      toast(error, 'error')
    } else {
      setIsDirty(false)
      toast('Devis créé', 'success')
      router.push('/dashboard/quotes')
    }
  }

  // Loading skeleton
  if (loading || settingsLoading) {
    return (
      <div className="space-y-5 px-4 lg:px-6 py-4 md:py-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-6 w-40" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <Skeleton className="h-9 w-28 rounded-lg" />
          </div>
        </div>
        {/* Content */}
        <div className="flex flex-col xl:flex-row gap-5">
          {/* A4 sheet area */}
          <div className="flex-1 min-w-0 flex justify-center">
            <div className="w-full max-w-[794px] bg-muted/30 rounded-xl p-6">
              <div className="bg-card rounded-lg border border-border p-8 space-y-6" style={{ aspectRatio: '210/297' }}>
                {/* Doc header */}
                <div className="flex justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-10 w-20 rounded" />
                    <Skeleton className="h-3 w-32" />
                    <Skeleton className="h-3 w-28" />
                  </div>
                  <div className="text-right space-y-2">
                    <Skeleton className="h-4 w-16 ml-auto" />
                    <Skeleton className="h-3 w-24 ml-auto" />
                    <Skeleton className="h-3 w-20 ml-auto" />
                  </div>
                </div>
                <Skeleton className="h-0.5 w-full" />
                {/* Addresses */}
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-1.5">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-3.5 w-32" />
                    <Skeleton className="h-3 w-40" />
                    <Skeleton className="h-3 w-28" />
                  </div>
                  <div className="space-y-1.5">
                    <Skeleton className="h-3 w-12" />
                    <Skeleton className="h-3.5 w-28" />
                    <Skeleton className="h-3 w-36" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                {/* Table */}
                <div>
                  <Skeleton className="h-8 w-full rounded-t" />
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full rounded-none" style={{ opacity: 1 - i * 0.15 }} />
                  ))}
                </div>
                {/* Totals */}
                <div className="flex justify-end">
                  <div className="w-48 space-y-2">
                    <div className="flex justify-between"><Skeleton className="h-3 w-20" /><Skeleton className="h-3 w-16" /></div>
                    <div className="flex justify-between"><Skeleton className="h-3 w-16" /><Skeleton className="h-3 w-12" /></div>
                    <Skeleton className="h-8 w-full rounded" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Options sidebar */}
          <div className="w-full xl:w-[300px] xl:shrink-0 space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-xl border border-border bg-card/50 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4 rounded" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <Skeleton className="h-4 w-4 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <motion.div initial="hidden" animate="visible" className="space-y-5 px-4 lg:px-6 py-4 md:py-5">
      {/* ── Header ── */}
      <motion.div variants={fadeUp} custom={0} className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => {
            if (isDirty) { setShowModal(true) } else { router.push('/dashboard/quotes') }
          }}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Nouveau devis</h1>
            <p className="text-muted-foreground mt-0.5 text-sm">{quoteNumber}</p>
          </div>
        </div>

        {/* Mode toggle */}
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-border overflow-hidden">
            <button
              onClick={() => setMode('edit')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium transition-all ${
                mode === 'edit'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Pencil className="h-3 w-3" /> Edition
            </button>
            <button
              onClick={() => setMode('preview')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium transition-all ${
                mode === 'preview'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Eye className="h-3 w-3" /> Apercu
            </button>
          </div>
        </div>
      </motion.div>

      {/* ── Main content: A4 Sheet (center) + Sidebar (right) ── */}
      <div className="flex flex-col xl:flex-row gap-5 max-w-[1400px] mx-auto">
        {/* A4 Sheet */}
        <motion.div variants={fadeUp} custom={1} className="flex-1 min-w-0 order-1">
          <div className="bg-muted/30 rounded-xl p-6 relative">
          {/* Toggle options button */}
          <button
            onClick={() => setShowOptions(!showOptions)}
            className="absolute top-3 right-3 z-10 p-1.5 rounded-lg border border-border bg-card/80 backdrop-blur-sm text-muted-foreground hover:text-foreground transition-colors"
            title={showOptions ? 'Masquer les options' : 'Afficher les options'}
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>
          <FirstDocumentBanner
            documentType="quote"
            currentNumber={quoteNumber}
            onNumberChange={setQuoteNumber}
          />
          <A4Sheet
            mode={mode}
            logoUrl={invoiceSettings.logoSource === 'company' ? companyLogoUrl : invoiceSettings.logoUrl}
            accentColor={accentColor}
            documentTitle={options.documentTitle}
            quoteNumber={quoteNumber}
            issueDate={options.issueDate}
            validityDate={options.validityDate}
            billingType={options.billingType}
            company={company}
            client={selectedClient}
            onQuoteNumberChange={setQuoteNumber}
            onCompanyFieldChange={handleCompanyFieldChange}
            onClientClick={() => setClientModalOpen(true)}
            onClearClient={() => setSelectedClient(null)}
            onClientFieldChange={handleClientFieldChange}
            lines={lines}
            onUpdateLine={handleUpdateLine}
            onAddLine={handleAddLine}
            onRemoveLine={handleRemoveLine}
            subtotal={subtotal}
            taxAmount={taxAmount}
            discountAmount={discountAmount}
            total={total}
            tvaBreakdown={tvaBreakdown}
            notes={notes}
            onNotesChange={setNotes}
            acceptanceConditions={options.acceptanceConditions}
            signatureField={options.signatureField}
            freeField={options.freeField}
            deliveryAddress={options.deliveryAddress}
            showDeliveryAddress={options.showDeliveryAddress}
            clientSiren={options.clientSiren}
            showClientSiren={!!options.clientSiren}
            clientVatNumber={options.clientVatNumber}
            showClientVatNumber={!!options.clientVatNumber}
            paymentMethods={invoiceSettings.paymentMethods}
            customPaymentMethod={invoiceSettings.customPaymentMethod}
            subject={options.subject}
            onSubjectChange={(v) => handleOptionsChange({ subject: v })}
            template={invoiceSettings.template}
            darkMode={invoiceSettings.darkMode}
            language={options.language}
            showNotes={options.showNotes}
            vatExempt={options.vatExempt}
            footerText={options.footerText}
            documentFont={invoiceSettings.documentFont}
            showSubject={options.showSubject}
            showAcceptanceConditions={options.showAcceptanceConditions}
            showFreeField={options.showFreeField}
            showFooterText={options.showFooterText}
            footerMode={options.footerMode}
            onAcceptanceConditionsChange={(v) => handleOptionsChange({ acceptanceConditions: v })}
            onFreeFieldChange={(v) => handleOptionsChange({ freeField: v })}
            onFooterTextChange={(v) => handleOptionsChange({ footerText: v })}
            onDeliveryAddressChange={(v) => handleOptionsChange({ deliveryAddress: v })}
            onIssueDateChange={(d) => handleOptionsChange({ issueDate: d })}
            onValidityDateChange={(d) => handleOptionsChange({ validityDate: d })}
          />
          </div>
        </motion.div>

        {/* Right Sidebar */}
        <AnimatePresence>
          {showOptions && (
            <motion.div
              initial={{ opacity: 0, x: 20, width: 0 }}
              animate={{ opacity: 1, x: 0, width: 300 }}
              exit={{ opacity: 0, x: 20, width: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="xl:shrink-0 order-2 overflow-hidden"
            >
              <div className="xl:sticky xl:top-4 w-[300px]">
                <DocumentOptionsPanel
                  options={options}
                  onChange={handleOptionsChange}
                  accentColor={accentColor}
                  onAccentColorChange={setAccentColor}
                  selectedClient={selectedClient}
                  onOpenClientModal={() => setClientModalOpen(true)}
                  subtotal={subtotal}
                  taxAmount={taxAmount}
                  discountAmount={discountAmount}
                  total={total}
                  tvaBreakdown={tvaBreakdown}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Sticky save bar ── */}
      <motion.div
        variants={fadeUp}
        custom={3}
        className="sticky bottom-0 -mx-4 lg:-mx-6 px-4 lg:px-6 py-4 bg-background/80 backdrop-blur-md border-t border-border"
      >
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Total :{' '}
            <span className="font-bold text-foreground">
              {total.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
            </span>
          </div>
          <Button onClick={handleSave} disabled={saving} className="min-w-[160px]">
            {saving ? (
              <><Spinner /> Enregistrement...</>
            ) : (
              <><Save className="h-4 w-4 mr-1.5" /> Sauvegarder</>
            )}
          </Button>
        </div>
      </motion.div>

      {/* ── Client Modal ── */}
      <ClientModal
        open={clientModalOpen}
        onClose={() => setClientModalOpen(false)}
        onSelect={handleSelectClient}
      />

      {/* ── Unsaved changes dialog ── */}
      <Dialog open={showModal} onClose={cancelNavigation} className="max-w-sm">
        <DialogTitle>Modifications non enregistrées</DialogTitle>
        <p className="mt-2 text-sm text-muted-foreground">
          Vous avez des modifications non enregistrées. Que souhaitez-vous faire ?
        </p>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={cancelNavigation}>
            Annuler
          </Button>
          <Button variant="ghost" size="sm" onClick={() => { setIsDirty(false); confirmNavigation(); router.push('/dashboard/quotes') }}>
            Ignorer
          </Button>
          <Button size="sm" onClick={async () => { confirmNavigation(); await handleSave() }}>
            <Save className="h-3.5 w-3.5 mr-1" /> Enregistrer
          </Button>
        </DialogFooter>
      </Dialog>
    </motion.div>
  )
}
