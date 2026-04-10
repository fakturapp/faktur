'use client'

import { useState, useEffect, useMemo, useCallback, useRef, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/toast'
import { Spinner } from '@/components/ui/spinner'
import { useInvoiceSettings } from '@/lib/invoice-settings-context'
import { api } from '@/lib/api'
import { A4Sheet, ClientModal, type DocumentLine, type ClientInfo, type CompanyInfo } from '@/components/shared/a4-sheet'
import { DocumentOptionsPanel } from '@/components/shared/document-options'
import { Save, ArrowLeft, Eye, Pencil, SlidersHorizontal, X, FileText } from 'lucide-react'
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes'
import { ProductCatalogModal, type CatalogProduct } from '@/components/products/product-catalog-modal'
import { CollaborationToolbar, CollaborationReadOnlyBanner, CollaborationEditor } from '@/components/collaboration/collaboration-toolbar'
import { CollaborationProvider } from '@/components/collaboration/collaboration-provider'
import { SyncBroadcaster } from '@/components/collaboration/sync-broadcaster'
import { setApplyingRemote } from '@/components/collaboration/use-broadcast'

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

function EditCreditNoteContent() {
  const params = useParams()
  const searchParams = useSearchParams()
  const creditNoteId = params.id as string
  const router = useRouter()
  const { toast } = useToast()
  const { settings: invoiceSettings, companyLogoUrl, loading: settingsLoading, refreshSettings, updateSettings, uploadLogo } = useInvoiceSettings()
  const collabEnabled = invoiceSettings.collaborationEnabled

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [mode, setMode] = useState<'edit' | 'preview'>('edit')
  const editorAreaRef = useRef<HTMLDivElement>(null)
  const [creditNoteNumber, setCreditNoteNumber] = useState('')
  const [company, setCompany] = useState<CompanyInfo | null>(null)
  const [selectedClient, setSelectedClient] = useState<ClientInfo | null>(null)
  const [clientModalOpen, setClientModalOpen] = useState(false)
  const [catalogModalOpen, setCatalogModalOpen] = useState(false)
  const [accentColor, setAccentColor] = useState('#6366f1')
  const [showOptions, setShowOptions] = useState(true)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [sourceInvoice, setSourceInvoice] = useState<{ id: string; invoiceNumber: string } | null>(null)

  const [lines, setLines] = useState<DocumentLine[]>([
    { id: generateId(), type: 'standard', description: '', saleType: '', quantity: 1, unit: '', unitPrice: 0, vatRate: 20 },
  ])

  const [options, setOptions] = useState({
    billingType: 'detailed' as 'quick' | 'detailed',
    subject: '',
    issueDate: '',
    validityDate: '',
    deliveryAddress: '',
    clientSiren: '',
    clientVatNumber: '',
    language: 'fr',
    acceptanceConditions: '',
    signatureField: false,
    documentTitle: 'Avoir',
    freeField: '',
    globalDiscountType: 'none' as 'none' | 'percentage' | 'fixed',
    globalDiscountValue: 0,
    showNotes: true,
    vatExemptReason: 'not_subject' as 'none' | 'not_subject' | 'france_no_vat' | 'outside_france',
    footerText: '',
    showSubject: false,
    showDeliveryAddress: false,
    showAcceptanceConditions: false,
    showFreeField: false,
    showFooterText: false,
    footerMode: 'company_info' as 'company_info' | 'custom',
    facturX: false,
  })

  const [notes, setNotes] = useState('')
  const [isDirty, setIsDirty] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const { showModal, confirmNavigation, cancelNavigation, requestNavigation } = useUnsavedChanges(isDirty)

  useEffect(() => {
    async function init() {
      const [cnRes, companyRes] = await Promise.all([
        api.get<{ creditNote: any }>(`/credit-notes/${creditNoteId}`),
        api.get<{ company: CompanyInfo }>('/company'),
        refreshSettings(),
      ])

      if (companyRes.data?.company) {
        setCompany(companyRes.data.company)
      }

      if (cnRes.data?.creditNote) {
        const cn = cnRes.data.creditNote
        setCreditNoteNumber(cn.creditNoteNumber)
        setAccentColor(cn.accentColor || '#6366f1')
        setLogoUrl(cn.logoUrl)
        setNotes(cn.notes || '')

        setOptions({
          billingType: cn.billingType,
          subject: cn.subject || '',
          issueDate: cn.issueDate || '',
          validityDate: '',
          deliveryAddress: cn.deliveryAddress || '',
          clientSiren: cn.clientSiren || '',
          clientVatNumber: cn.clientVatNumber || '',
          language: cn.language || 'fr',
          acceptanceConditions: cn.acceptanceConditions || '',
          signatureField: cn.signatureField || false,
          documentTitle: cn.documentTitle || 'Avoir',
          freeField: cn.freeField || '',
          globalDiscountType: cn.globalDiscountType || 'none',
          globalDiscountValue: Number(cn.globalDiscountValue) || 0,
          showNotes: cn.showNotes !== false,
          vatExemptReason: cn.vatExemptReason || 'not_subject',
          footerText: cn.footerText || '',
          showSubject: !!cn.subject,
          showDeliveryAddress: !!cn.deliveryAddress,
          showAcceptanceConditions: !!cn.acceptanceConditions,
          showFreeField: !!cn.freeField,
          showFooterText: !!cn.footerText,
          footerMode: ((invoiceSettings.footerMode as string) === 'vat_exempt' ? 'company_info' : invoiceSettings.footerMode) || 'company_info',
          facturX: false,
        })

        if (cn.sourceInvoice) setSourceInvoice(cn.sourceInvoice)
        if (cn.client) setSelectedClient(cn.client)

        if (cn.lines && cn.lines.length > 0) {
          setLines(
            cn.lines.map((l: any) => ({
              id: l.id || generateId(),
              type: l.saleType === 'section' ? 'section' as const : 'standard' as const,
              description: l.description || '',
              saleType: l.saleType === 'section' ? '' : l.saleType || '',
              quantity: Number(l.quantity) || 1,
              unit: l.unit || '',
              unitPrice: Number(l.unitPrice) || 0,
              vatRate: Number(l.vatRate) || 0,
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
  }, [creditNoteId])

  useEffect(() => {
    if (!loading && searchParams.get('preview') === '1') {
      setMode('preview')
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [loading, searchParams])

  const handleUpdateLine = useCallback((index: number, partial: Partial<DocumentLine>) => {
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, ...partial } : l)))
    setIsDirty(true); setValidationErrors([])
  }, [])

  const handleAddLine = useCallback((type: 'standard' | 'section') => {
    setLines((prev) => [
      ...prev,
      { id: generateId(), type, description: '', saleType: '', quantity: 1, unit: '', unitPrice: 0, vatRate: type === 'section' ? 0 : 20 },
    ])
    setIsDirty(true); setValidationErrors([])
  }, [])

  const handleRemoveLine = useCallback((index: number) => {
    setLines((prev) => prev.filter((_, i) => i !== index))
    setIsDirty(true); setValidationErrors([])
  }, [])

  const handleOptionsChange = useCallback((partial: Partial<typeof options>) => {
    setOptions((prev) => ({ ...prev, ...partial }))
    setIsDirty(true); setValidationErrors([])
  }, [])

  const handleSelectClient = useCallback((client: ClientInfo) => {
    setSelectedClient(client)
    setValidationErrors([])
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

  const handleLogoChange = useCallback((url: string | null, saveToSettings: boolean) => {
    setLogoUrl(url)
    if (saveToSettings) {
      if (url === null) updateSettings({ logoUrl: null, logoSource: 'custom' })
      else if (url === companyLogoUrl) updateSettings({ logoSource: 'company' })
      else updateSettings({ logoUrl: url, logoSource: 'custom' })
    }
    setIsDirty(true)
  }, [companyLogoUrl, updateSettings])

  const handleLogoUpload = useCallback((file: File, saveToSettings: boolean) => {
    const reader = new FileReader()
    reader.onload = () => setLogoUrl(reader.result as string)
    reader.readAsDataURL(file)
    if (saveToSettings) { uploadLogo(file); updateSettings({ logoSource: 'custom' }) }
    setIsDirty(true)
  }, [uploadLogo, updateSettings])

  const handleLogoBorderRadiusChange = useCallback((radius: number) => {
    updateSettings({ logoBorderRadius: radius })
  }, [updateSettings])

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

  async function handleSave() {
    const errors: string[] = []
    if (!selectedClient) errors.push('Client')
    if (!lines.some((l) => l.type === 'standard' && l.description.trim())) errors.push('Designation')
    if (!lines.some((l) => l.type === 'standard' && l.unitPrice > 0)) errors.push('Prix')
    if (options.showSubject && !options.subject?.trim()) errors.push('Objet')
    if (options.showDeliveryAddress && !options.deliveryAddress?.trim()) errors.push('Adresse de livraison')
    if (options.showAcceptanceConditions && !options.acceptanceConditions?.trim()) errors.push("Conditions d'acceptation")
    if (options.showFreeField && !options.freeField?.trim()) errors.push('Champ libre')
    if (options.showFooterText && options.footerMode === 'custom' && !options.footerText?.trim()) errors.push('Pied de page')
    if (errors.length > 0) {
      setValidationErrors(errors)
      return
    }
    setValidationErrors([])
    setSaving(true)

    const payload = {
      clientId: selectedClient?.id || undefined,
      sourceInvoiceId: sourceInvoice?.id || undefined,
      subject: options.subject || undefined,
      issueDate: options.issueDate,
      billingType: options.billingType,
      accentColor,
      logoUrl: logoUrl || undefined,
      language: options.language,
      notes: notes || undefined,
      acceptanceConditions: options.acceptanceConditions || undefined,
      signatureField: options.signatureField,
      documentTitle: options.documentTitle || 'Avoir',
      freeField: options.freeField || undefined,
      globalDiscountType: options.globalDiscountType,
      globalDiscountValue: options.globalDiscountValue,
      deliveryAddress: options.deliveryAddress || undefined,
      clientSiren: options.clientSiren || undefined,
      clientVatNumber: options.clientVatNumber || undefined,
      vatExemptReason: options.vatExemptReason,
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

    const { error } = await api.put(`/credit-notes/${creditNoteId}`, payload)
    setSaving(false)

    if (error) {
      toast(error, 'error')
    } else {
      setIsDirty(false)
      toast('Avoir mis a jour', 'success')
      router.push('/dashboard/credit-notes')
    }
  }

  if (loading || settingsLoading) {
    return (
      <div className="space-y-5 px-4 lg:px-6 py-4 md:py-5">
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
        <div className="flex flex-col xl:flex-row gap-5">
          <div className="flex-1 min-w-0 flex justify-center">
            <div className="w-full max-w-[960px] rounded-xl">
              <div className="bg-card rounded-lg border border-border p-8 space-y-6" style={{ aspectRatio: '210/297' }}>
                <div className="flex justify-between">
                  <div className="space-y-2"><Skeleton className="h-10 w-20 rounded" /><Skeleton className="h-3 w-32" /><Skeleton className="h-3 w-28" /></div>
                  <div className="text-right space-y-2"><Skeleton className="h-4 w-16 ml-auto" /><Skeleton className="h-3 w-24 ml-auto" /><Skeleton className="h-3 w-20 ml-auto" /></div>
                </div>
                <Skeleton className="h-0.5 w-full" />
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-1.5"><Skeleton className="h-3 w-16" /><Skeleton className="h-3.5 w-32" /><Skeleton className="h-3 w-40" /><Skeleton className="h-3 w-28" /></div>
                  <div className="space-y-1.5"><Skeleton className="h-3 w-12" /><Skeleton className="h-3.5 w-28" /><Skeleton className="h-3 w-36" /><Skeleton className="h-3 w-24" /></div>
                </div>
                <div>
                  <Skeleton className="h-8 w-full rounded-t" />
                  {[...Array(3)].map((_, i) => (<Skeleton key={i} className="h-10 w-full rounded-none" style={{ opacity: 1 - i * 0.15 }} />))}
                </div>
              </div>
            </div>
          </div>
          <div className="w-full xl:w-[300px] xl:shrink-0 space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-xl border border-border bg-card/50 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2"><Skeleton className="h-4 w-4 rounded" /><Skeleton className="h-4 w-20" /></div>
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
    <CollaborationProvider
      documentType="credit_note"
      documentId={creditNoteId}
      enabled={!!creditNoteId && collabEnabled}
      onDocumentChange={(change) => {
        setApplyingRemote(true)
        try {
          if (change.path === 'notes') setNotes(change.value)
          else if (change.path === 'accentColor') setAccentColor(change.value)
          else if (change.path === 'lines') setLines(change.value)
          else if (change.path === 'invoiceNumber') setCreditNoteNumber(change.value)
          else if (change.path === 'client') setSelectedClient(change.value)
          else if (change.path.startsWith('options.')) {
            const key = change.path.replace('options.', '')
            setOptions((prev) => ({ ...prev, [key]: change.value }))
          }
        } finally {
          requestAnimationFrame(() => setApplyingRemote(false))
        }
      }}
      onDocumentSaved={() => {
        toast('Le document a \u00e9t\u00e9 mis \u00e0 jour par un collaborateur', 'info')
      }}
      onAccessRevoked={() => {
        toast('Votre acc\u00e8s \u00e0 ce document a \u00e9t\u00e9 r\u00e9voqu\u00e9', 'error')
        router.push('/dashboard')
      }}
    >
    <motion.div initial="hidden" animate="visible" className="space-y-5 px-4 lg:px-6 py-4 md:py-5">
      {collabEnabled && <CollaborationReadOnlyBanner />}
      {collabEnabled && <SyncBroadcaster
        notes={notes}
        accentColor={accentColor}
        lines={lines}
        options={options}
        documentNumber={creditNoteNumber}
        selectedClient={selectedClient}
      />}

      {/* Header */}
      <motion.div variants={fadeUp} custom={0} className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => {
            if (!requestNavigation('/dashboard/credit-notes')) router.push('/dashboard/credit-notes')
          }}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Modifier l&apos;avoir</h1>
            <p className="text-muted-foreground mt-0.5 text-sm">{creditNoteNumber}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {collabEnabled && <CollaborationToolbar
            documentType="credit_note"
            documentId={creditNoteId}

            className="flex items-center gap-2"
          />}
          <div className="flex rounded-lg border border-border overflow-hidden">
            <button onClick={() => setMode('edit')} className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium transition-all ${mode === 'edit' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
              <Pencil className="h-3 w-3" /> Edition
            </button>
            <button onClick={() => setMode('preview')} className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium transition-all ${mode === 'preview' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
              <Eye className="h-3 w-3" /> Apercu
            </button>
          </div>
        </div>
      </motion.div>

      {/* Source invoice */}
      {sourceInvoice && (
        <motion.div variants={fadeUp} custom={0.5} className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2.5 rounded-xl border border-border bg-card/50 px-4 py-2.5">
            <FileText className="h-4 w-4 text-primary shrink-0" />
            <span className="text-sm text-muted-foreground">Facture d&apos;origine</span>
            <Link
              href={`/dashboard/invoices/${sourceInvoice.id}/edit`}
              className="text-sm font-medium text-primary hover:underline"
            >
              {sourceInvoice.invoiceNumber}
            </Link>
          </div>
        </motion.div>
      )}

      {/* Main content */}
      <div className="flex flex-col xl:flex-row gap-5">
        <motion.div variants={fadeUp} custom={1} className="flex-1 min-w-0 order-1">
          <CollaborationEditor editorRef={editorAreaRef}>
          <div className="rounded-xl relative">
            <button onClick={() => setShowOptions(!showOptions)} className="absolute top-3 right-3 z-10 p-1.5 rounded-lg border border-border bg-card/80 backdrop-blur-sm text-muted-foreground hover:text-foreground transition-colors" title={showOptions ? 'Masquer les options' : 'Afficher les options'}>
              <SlidersHorizontal className="h-4 w-4" />
            </button>
            <A4Sheet
              mode={mode}
              logoUrl={logoUrl || (invoiceSettings.logoSource === 'company' ? companyLogoUrl : invoiceSettings.logoUrl) || companyLogoUrl}
              accentColor={accentColor}
              documentTitle={options.documentTitle}
              documentType="credit_note"
              quoteNumber={creditNoteNumber}
              issueDate={options.issueDate}
              validityDate=""
              billingType={options.billingType}
              company={company}
              client={selectedClient}
              onQuoteNumberChange={setCreditNoteNumber}
              onCompanyFieldChange={handleCompanyFieldChange}
              onClientClick={() => setClientModalOpen(true)}
              onClearClient={() => setSelectedClient(null)}
              onClientFieldChange={handleClientFieldChange}
              lines={lines}
              onUpdateLine={handleUpdateLine}
              onAddLine={handleAddLine}
              onCatalogClick={() => setCatalogModalOpen(true)}
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
              showClientSiren={!!options.clientSiren || invoiceSettings.eInvoicingEnabled}
              clientVatNumber={options.clientVatNumber}
              showClientVatNumber={!!options.clientVatNumber || invoiceSettings.eInvoicingEnabled}
              paymentMethods={[]}
              customPaymentMethod=""
              subject={options.subject}
              onSubjectChange={(v) => handleOptionsChange({ subject: v })}
              template={invoiceSettings.template}
              darkMode={invoiceSettings.darkMode}
              language={options.language}
              showNotes={options.showNotes}
              vatExemptReason={options.vatExemptReason}
              footerText={options.footerText}
              documentFont={invoiceSettings.documentFont}
              showSubject={options.showSubject}
              showAcceptanceConditions={options.showAcceptanceConditions}
              showFreeField={options.showFreeField}
              showFooterText={options.showFooterText}
              footerMode={options.footerMode}
              logoBorderRadius={invoiceSettings.logoBorderRadius}
              validationErrors={validationErrors}
              onAcceptanceConditionsChange={(v) => handleOptionsChange({ acceptanceConditions: v })}
              onFreeFieldChange={(v) => handleOptionsChange({ freeField: v })}
              onFooterTextChange={(v) => handleOptionsChange({ footerText: v })}
              onDeliveryAddressChange={(v) => handleOptionsChange({ deliveryAddress: v })}
              onIssueDateChange={(d) => handleOptionsChange({ issueDate: d })}
              onValidityDateChange={() => {}}
              companyLogoUrl={companyLogoUrl}
              onLogoChange={handleLogoChange}
              onLogoBorderRadiusChange={handleLogoBorderRadiusChange}
              onLogoUpload={handleLogoUpload}
            />
          </div>
          </CollaborationEditor>
        </motion.div>

        <AnimatePresence>
          {showOptions && (
            <motion.div initial={{ opacity: 0, x: 20, width: 0 }} animate={{ opacity: 1, x: 0, width: 300 }} exit={{ opacity: 0, x: 20, width: 0 }} transition={{ duration: 0.25, ease: 'easeInOut' }} className="xl:shrink-0 order-2 overflow-hidden">
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
                  documentType="credit_note"
                  eInvoicingEnabled={invoiceSettings.eInvoicingEnabled}
                  notes={notes}
                  onNotesChange={setNotes}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Sticky save bar */}
      <div className="sticky bottom-4 z-20 flex flex-col items-center gap-2 pointer-events-none">
        <AnimatePresence>
          {validationErrors.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.2 }}
              className="pointer-events-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-destructive/10 border border-destructive/20 backdrop-blur-xl"
            >
              <span className="h-2 w-2 rounded-full bg-destructive animate-pulse shrink-0" />
              <span className="text-sm text-destructive font-medium">Champs obligatoires manquants</span>
              <button onClick={() => setValidationErrors([])} className="text-destructive/60 hover:text-destructive transition-colors shrink-0 ml-1">
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        <motion.div
          variants={fadeUp}
          custom={3}
          className="pointer-events-auto inline-flex items-center gap-4 px-5 py-2.5 rounded-2xl bg-card/90 backdrop-blur-xl border border-border/50 shadow-lg shadow-black/5"
        >
          <div className="text-sm text-muted-foreground">
            Total : <span className="font-bold text-foreground">{total.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</span>
          </div>
          <Button onClick={handleSave} disabled={saving} size="sm" className="min-w-[140px] rounded-xl">
            {saving ? (<><Spinner /> Enregistrement...</>) : (<><Save className="h-4 w-4 mr-1.5" /> Sauvegarder</>)}
          </Button>
        </motion.div>
      </div>

      <ClientModal open={clientModalOpen} onClose={() => setClientModalOpen(false)} onSelect={handleSelectClient} />

      <ProductCatalogModal
        open={catalogModalOpen}
        onClose={() => setCatalogModalOpen(false)}
        onSelect={(product: CatalogProduct) => {
          const newLine: DocumentLine = {
            id: generateId(),
            type: 'standard',
            description: product.name + (product.description ? `\n${product.description}` : ''),
            saleType: product.saleType || '',
            quantity: 1,
            unit: product.unit || '',
            unitPrice: Number(product.unitPrice),
            vatRate: Number(product.vatRate),
          }
          setLines((prev) => [...prev, newLine])
          setIsDirty(true)
        }}
      />

      <Dialog open={showModal} onClose={cancelNavigation} className="max-w-sm">
        <DialogHeader showClose={false}>
          <DialogTitle>Modifications non enregistrees</DialogTitle>
          <DialogDescription>Vous avez des modifications non enregistrees. Que souhaitez-vous faire ?</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={cancelNavigation}>Annuler</Button>
          <Button variant="ghost" size="sm" onClick={() => confirmNavigation('/dashboard/credit-notes')}>Ignorer</Button>
          <Button size="sm" onClick={async () => { cancelNavigation(); await handleSave() }}><Save className="h-3.5 w-3.5 mr-1" /> Enregistrer</Button>
        </DialogFooter>
      </Dialog>
    </motion.div>
    </CollaborationProvider>
  )
}

export default function EditCreditNotePage() {
  return (
    <Suspense>
      <EditCreditNoteContent />
    </Suspense>
  )
}
