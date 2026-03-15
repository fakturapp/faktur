'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/toast'
import { Spinner } from '@/components/ui/spinner'
import { useInvoiceSettings } from '@/lib/invoice-settings-context'
import { api } from '@/lib/api'
import { A4Sheet, ClientModal, type QuoteLine, type ClientInfo, type CompanyInfo } from '@/components/quotes/a4-sheet'
import { QuoteOptionsPanel } from '@/components/quotes/quote-options'
import { Save, ArrowLeft, Eye, Pencil, Download, SlidersHorizontal } from 'lucide-react'
import { Dialog, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes'

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

export default function EditQuotePage() {
  const router = useRouter()
  const params = useParams()
  const quoteId = params.id as string
  const { toast } = useToast()
  const { settings: invoiceSettings, loading: settingsLoading } = useInvoiceSettings()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [mode, setMode] = useState<'edit' | 'preview'>('edit')
  const [quoteNumber, setQuoteNumber] = useState('')
  const [company, setCompany] = useState<CompanyInfo | null>(null)
  const [selectedClient, setSelectedClient] = useState<ClientInfo | null>(null)
  const [clientModalOpen, setClientModalOpen] = useState(false)
  const [accentColor, setAccentColor] = useState('#6366f1')
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [showOptions, setShowOptions] = useState(true)

  const [lines, setLines] = useState<QuoteLine[]>([])

  const [options, setOptions] = useState({
    billingType: 'quick' as 'quick' | 'detailed',
    subject: '',
    issueDate: '',
    validityDate: '',
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
    facturX: false,
  })

  const [notes, setNotes] = useState('')
  const [isDirty, setIsDirty] = useState(false)
  const { showModal, setShowModal, confirmNavigation, cancelNavigation } = useUnsavedChanges(isDirty)

  // Load quote and company
  useEffect(() => {
    async function init() {
      const [quoteRes, companyRes] = await Promise.all([
        api.get<{ quote: any }>(`/quotes/${quoteId}`),
        api.get<{ company: CompanyInfo }>('/company'),
      ])

      if (companyRes.data?.company) setCompany(companyRes.data.company)

      if (quoteRes.data?.quote) {
        const q = quoteRes.data.quote
        setQuoteNumber(q.quoteNumber)
        setAccentColor(q.accentColor || '#6366f1')
        setLogoUrl(q.logoUrl)
        setNotes(q.notes || '')

        setOptions({
          billingType: q.billingType,
          subject: q.subject || '',
          issueDate: q.issueDate || '',
          validityDate: q.validityDate || '',
          deliveryAddress: q.deliveryAddress || '',
          clientSiren: q.clientSiren || '',
          clientVatNumber: q.clientVatNumber || '',
          language: q.language || 'fr',
          acceptanceConditions: q.acceptanceConditions || '',
          signatureField: q.signatureField || false,
          documentTitle: q.documentTitle || '',
          freeField: q.freeField || '',
          globalDiscountType: q.globalDiscountType || 'none',
          globalDiscountValue: q.globalDiscountValue || 0,
          showNotes: q.showNotes !== false,
          vatExempt: q.vatExempt || false,
          footerText: q.footerText || '',
          showSubject: true,
          showDeliveryAddress: !!q.deliveryAddress,
          showAcceptanceConditions: !!q.acceptanceConditions,
          showFreeField: !!q.freeField,
          showFooterText: !!q.footerText,
          facturX: q.facturX || false,
        })

        if (q.client) setSelectedClient(q.client)

        if (q.lines && q.lines.length > 0) {
          setLines(
            q.lines.map((l: any) => ({
              id: l.id || generateId(),
              type: l.saleType === 'section' ? 'section' as const : 'standard' as const,
              description: l.description || '',
              saleType: l.saleType === 'section' ? '' : l.saleType || '',
              quantity: l.quantity || 1,
              unit: l.unit || '',
              unitPrice: l.unitPrice || 0,
              vatRate: l.vatRate || 0,
            })),
          )
        } else {
          setLines([
            { id: generateId(), type: 'standard', description: '', saleType: '', quantity: 1, unit: '', unitPrice: 0, vatRate: 20 },
          ])
        }
      }

      setLoading(false)
    }
    init()
  }, [quoteId])

  // Handlers
  const handleUpdateLine = useCallback((index: number, partial: Partial<QuoteLine>) => {
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
      logoUrl: logoUrl || undefined,
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

    const { error } = await api.put(`/quotes/${quoteId}`, payload)
    setSaving(false)

    if (error) {
      toast(error, 'error')
    } else {
      setIsDirty(false)
      toast('Devis mis a jour', 'success')
      router.push('/dashboard/quotes')
    }
  }

  async function handleDownloadPdf() {
    setDownloading(true)
    const { blob, filename, error } = await api.downloadBlob(`/quotes/${quoteId}/pdf`)
    setDownloading(false)
    if (error || !blob) {
      toast(error || 'Erreur lors du telechargement', 'error')
      return
    }
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename || 'devis.pdf'
    a.click()
    URL.revokeObjectURL(url)
  }

  // Loading skeleton
  if (loading || settingsLoading) {
    return (
      <div className="space-y-5 px-4 lg:px-6 py-4 md:py-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-9 rounded-lg" />
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
            <h1 className="text-2xl font-bold text-foreground">Modifier le devis</h1>
            <p className="text-muted-foreground mt-0.5 text-sm">{quoteNumber}</p>
          </div>
        </div>

        {/* Mode toggle + Download */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleDownloadPdf} disabled={downloading}>
            <Download className={`h-3.5 w-3.5 mr-1.5 ${downloading ? 'animate-pulse' : ''}`} />
            {downloading ? 'PDF...' : 'PDF'}
          </Button>
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
          <A4Sheet
            mode={mode}
            logoUrl={logoUrl || invoiceSettings.logoUrl}
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
                <QuoteOptionsPanel
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
        <DialogTitle>Modifications non enregistrees</DialogTitle>
        <p className="mt-2 text-sm text-muted-foreground">
          Vous avez des modifications non enregistrees. Que souhaitez-vous faire ?
        </p>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={cancelNavigation}>
            Annuler
          </Button>
          <Button variant="ghost" size="sm" onClick={() => { confirmNavigation(); router.push('/dashboard/quotes') }}>
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
