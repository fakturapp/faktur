'use client'

import { useState, useEffect, useMemo, useCallback, Suspense } from 'react'
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
import { Save, ArrowLeft, Eye, Pencil, SlidersHorizontal, Download, Link2, Unlink, X, Sparkles, Settings } from 'lucide-react'
import { Dialog, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes'
import { ProductCatalogModal, type CatalogProduct } from '@/components/products/product-catalog-modal'
import { Tabs } from '@/components/ui/tabs'
import { AiChatSidebar } from '@/components/ai/ai-chat-sidebar'
import { AiSheetOverlay } from '@/components/ai/ai-sheet-overlay'

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

function addDays(dateStr: string | null | undefined, days: number) {
  const base = dateStr ? new Date(dateStr) : new Date()
  base.setDate(base.getDate() + days)
  return base.toISOString().split('T')[0]
}

function EditInvoiceContent() {
  const params = useParams()
  const searchParams = useSearchParams()
  const invoiceId = params.id as string
  const router = useRouter()
  const { toast } = useToast()
  const { settings: invoiceSettings, companyLogoUrl, loading: settingsLoading, refreshSettings } = useInvoiceSettings()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [mode, setMode] = useState<'edit' | 'preview'>('edit')
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [company, setCompany] = useState<CompanyInfo | null>(null)
  const [selectedClient, setSelectedClient] = useState<ClientInfo | null>(null)
  const [clientModalOpen, setClientModalOpen] = useState(false)
  const [catalogModalOpen, setCatalogModalOpen] = useState(false)
  const [accentColor, setAccentColor] = useState('#6366f1')
  const [showOptions, setShowOptions] = useState(true)
  const [sidebarTab, setSidebarTab] = useState<'options' | 'chat'>('options')
  const [aiProcessing, setAiProcessing] = useState(false)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [sourceQuote, setSourceQuote] = useState<{ id: string; quoteNumber: string } | null>(null)
  const [unlinking, setUnlinking] = useState(false)
  const [showUnlinkConfirm, setShowUnlinkConfirm] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<string>('')
  const [bankAccountId, setBankAccountId] = useState<string>('')
  const [bankAccounts, setBankAccounts] = useState<{ id: string; label: string; bankName: string | null; isDefault: boolean }[]>([])
  const [bankAccountInfo, setBankAccountInfo] = useState<{ bankName: string | null; iban: string | null; bic: string | null } | null>(null)
  const [loadingBankAccount, setLoadingBankAccount] = useState(false)

  const [lines, setLines] = useState<DocumentLine[]>([
    { id: generateId(), type: 'standard', description: '', saleType: '', quantity: 1, unit: '', unitPrice: 0, vatRate: 20 },
  ])

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
    documentTitle: 'Facture',
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

  // Load invoice and company
  useEffect(() => {
    async function init() {
      const [invoiceRes, companyRes, bankRes] = await Promise.all([
        api.get<{ invoice: any }>(`/invoices/${invoiceId}`),
        api.get<{ company: CompanyInfo }>('/company'),
        api.get<{ bankAccounts: any[] }>('/company/bank-accounts'),
        refreshSettings(),
      ])

      if (bankRes.data?.bankAccounts) {
        setBankAccounts(bankRes.data.bankAccounts.map((a: any) => ({
          id: a.id, label: a.label, bankName: a.bankName, isDefault: a.isDefault,
        })))
      }

      if (companyRes.data?.company) {
        setCompany(companyRes.data.company)
      }

      if (invoiceRes.data?.invoice) {
        const inv = invoiceRes.data.invoice
        setInvoiceNumber(inv.invoiceNumber)
        setAccentColor(inv.accentColor || '#6366f1')
        setLogoUrl(inv.logoUrl)
        setNotes(inv.notes || '')

        setOptions({
          billingType: inv.billingType,
          subject: inv.subject || '',
          issueDate: inv.issueDate || '',
          validityDate: inv.dueDate || addDays(inv.issueDate, 30),
          deliveryAddress: inv.deliveryAddress || '',
          clientSiren: inv.clientSiren || '',
          clientVatNumber: inv.clientVatNumber || '',
          language: inv.language || 'fr',
          acceptanceConditions: inv.acceptanceConditions || '',
          signatureField: inv.signatureField || false,
          documentTitle: inv.documentTitle || 'Facture',
          freeField: inv.freeField || '',
          globalDiscountType: inv.globalDiscountType || 'none',
          globalDiscountValue: inv.globalDiscountValue || 0,
          showNotes: inv.showNotes !== false,
          vatExemptReason: inv.vatExemptReason || 'not_subject',
          footerText: inv.footerText || '',
          showSubject: !!inv.subject,
          showDeliveryAddress: !!inv.deliveryAddress,
          showAcceptanceConditions: !!inv.acceptanceConditions,
          showFreeField: !!inv.freeField,
          showFooterText: !!inv.footerText,
          footerMode: ((invoiceSettings.footerMode as string) === 'vat_exempt' ? 'company_info' : invoiceSettings.footerMode) || 'company_info',
          facturX: inv.facturX || false,
        })

        if (inv.paymentMethod) setPaymentMethod(inv.paymentMethod)
        if (inv.bankAccountId) {
          setBankAccountId(inv.bankAccountId)
          // Load full bank account info for A4Sheet preview
          api.get<{ bankAccount: any }>(`/company/bank-accounts/${inv.bankAccountId}`).then(({ data }) => {
            if (data?.bankAccount) {
              setBankAccountInfo({
                bankName: data.bankAccount.bankName,
                iban: data.bankAccount.iban,
                bic: data.bankAccount.bic,
              })
            }
          })
        }
        if (inv.sourceQuote) setSourceQuote(inv.sourceQuote)
        if (inv.client) setSelectedClient(inv.client)

        if (inv.lines && inv.lines.length > 0) {
          setLines(
            inv.lines.map((l: any) => ({
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
  }, [invoiceId])

  // Auto-open preview mode from ?preview=1 query param
  useEffect(() => {
    if (!loading && searchParams.get('preview') === '1') {
      setMode('preview')
      // Clean URL without re-render/navigation
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [loading, searchParams])

  // Handlers
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

  const handleBankAccountChange = useCallback((id: string) => {
    setBankAccountId(id)
    setIsDirty(true)
    if (id) {
      setLoadingBankAccount(true)
      api.get<{ bankAccount: any }>(`/company/bank-accounts/${id}`).then(({ data }) => {
        if (data?.bankAccount) {
          setBankAccountInfo({
            bankName: data.bankAccount.bankName,
            iban: data.bankAccount.iban,
            bic: data.bankAccount.bic,
          })
        }
        setLoadingBankAccount(false)
      })
    } else {
      setBankAccountInfo(null)
    }
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
    const errors: string[] = []
    if (!selectedClient) errors.push('Client')
    if (!lines.some((l) => l.type === 'standard' && l.description.trim())) errors.push('Désignation')
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
      subject: options.subject || undefined,
      issueDate: options.issueDate,
      dueDate: options.validityDate || undefined,
      billingType: options.billingType,
      accentColor,
      logoUrl: logoUrl || undefined,
      language: options.language,
      notes: notes || undefined,
      acceptanceConditions: options.acceptanceConditions || undefined,
      signatureField: options.signatureField,
      documentTitle: options.documentTitle || 'Facture',
      freeField: options.freeField || undefined,
      globalDiscountType: options.globalDiscountType,
      globalDiscountValue: options.globalDiscountValue,
      deliveryAddress: options.deliveryAddress || undefined,
      clientSiren: options.clientSiren || undefined,
      clientVatNumber: options.clientVatNumber || undefined,
      paymentMethod: paymentMethod || undefined,
      bankAccountId: bankAccountId || undefined,
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

    const { error } = await api.put(`/invoices/${invoiceId}`, payload)
    setSaving(false)

    if (error) {
      toast(error, 'error')
    } else {
      setIsDirty(false)
      toast('Facture mise à jour', 'success')
      router.push('/dashboard/invoices')
    }
  }

  async function handleDownloadPdf() {
    setDownloading(true)
    const { blob, filename, error } = await api.downloadBlob(`/invoices/${invoiceId}/pdf`)
    setDownloading(false)
    if (error || !blob) {
      toast(error || 'Erreur lors du téléchargement', 'error')
      return
    }
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename || 'facture.pdf'
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleUnlinkQuote() {
    setUnlinking(true)
    const { error } = await api.patch(`/invoices/${invoiceId}/unlink-quote`, {})
    setUnlinking(false)
    if (error) {
      toast(error, 'error')
      return
    }
    setSourceQuote(null)
    toast('Devis délié', 'success')
  }

  // Loading skeleton
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
    <motion.div initial="hidden" animate="visible" className="space-y-5 px-4 lg:px-6 py-4 md:py-5">
      {/* Header */}
      <motion.div variants={fadeUp} custom={0} className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => {
            if (!requestNavigation('/dashboard/invoices')) router.push('/dashboard/invoices')
          }}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Modifier la facture</h1>
            <p className="text-muted-foreground mt-0.5 text-sm">{invoiceNumber}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleDownloadPdf} disabled={downloading}>
            {downloading ? <Spinner className="h-3.5 w-3.5 mr-1.5" /> : <Download className="h-3.5 w-3.5 mr-1.5" />}
            {downloading ? 'Téléchargement...' : 'Télécharger'}
          </Button>
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


      {/* Linked quote */}
      {sourceQuote && (
        <motion.div variants={fadeUp} custom={0.5} className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2.5 rounded-xl border border-border bg-card/50 px-4 py-2.5">
            <Link2 className="h-4 w-4 text-primary shrink-0" />
            <span className="text-sm text-muted-foreground">Lié au devis</span>
            <Link
              href={`/dashboard/quotes/${sourceQuote.id}/edit`}
              className="text-sm font-medium text-primary hover:underline"
            >
              {sourceQuote.quoteNumber}
            </Link>
            <button
              onClick={() => setShowUnlinkConfirm(true)}
              disabled={unlinking}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors ml-1"
              title="Délier le devis"
            >
              <Unlink className={`h-3.5 w-3.5 ${unlinking ? 'animate-pulse' : ''}`} />
            </button>
          </div>
        </motion.div>
      )}

      {/* Main content */}
      <div className="flex flex-col xl:flex-row gap-5">
        <motion.div variants={fadeUp} custom={1} className="flex-1 min-w-0 order-1">
          <div className="rounded-xl relative">
            <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
              {invoiceSettings.aiEnabled && (
                <button onClick={() => { setShowOptions(true); setSidebarTab('chat') }} className="p-1.5 rounded-lg border border-border bg-card/80 backdrop-blur-sm text-purple-500 hover:text-purple-400 hover:bg-purple-500/10 transition-colors" title="Chat IA">
                  <Sparkles className="h-4 w-4" />
                </button>
              )}
              <button onClick={() => setShowOptions(!showOptions)} className="p-1.5 rounded-lg border border-border bg-card/80 backdrop-blur-sm text-muted-foreground hover:text-foreground transition-colors" title={showOptions ? 'Masquer les options' : 'Afficher les options'}>
                <SlidersHorizontal className="h-4 w-4" />
              </button>
            </div>
            <div className="relative">
            <AiSheetOverlay open={aiProcessing} />
            <A4Sheet
              mode={mode}
              logoUrl={logoUrl || (invoiceSettings.logoSource === 'company' ? companyLogoUrl : invoiceSettings.logoUrl)}
              accentColor={accentColor}
              documentTitle={options.documentTitle}
              documentType="invoice"
              quoteNumber={invoiceNumber}
              issueDate={options.issueDate}
              validityDate={options.validityDate}
              billingType={options.billingType}
              company={company}
              client={selectedClient}
              onQuoteNumberChange={setInvoiceNumber}
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
              paymentMethods={invoiceSettings.paymentMethods}
              customPaymentMethod={invoiceSettings.customPaymentMethod}
              bankAccountInfo={bankAccountInfo}
              paymentMethod={paymentMethod}
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
              onValidityDateChange={(d) => handleOptionsChange({ validityDate: d })}
            />
            </div>
          </div>
        </motion.div>

        <AnimatePresence>
          {showOptions && (
            <motion.div initial={{ opacity: 0, x: 20, width: 0 }} animate={{ opacity: 1, x: 0, width: 300 }} exit={{ opacity: 0, x: 20, width: 0 }} transition={{ duration: 0.25, ease: 'easeInOut' }} className="xl:shrink-0 order-2 overflow-hidden">
              <div className="xl:sticky xl:top-4 w-[300px]">
                {invoiceSettings.aiEnabled && (
                  <Tabs
                    tabs={[
                      { id: 'options', label: 'Options', icon: <Settings className="h-3.5 w-3.5" /> },
                      { id: 'chat', label: 'Chat IA', icon: <Sparkles className="h-3.5 w-3.5" /> },
                    ]}
                    activeTab={sidebarTab}
                    onChange={(id) => setSidebarTab(id as 'options' | 'chat')}
                    className="mb-3"
                  />
                )}

                {sidebarTab === 'options' ? (
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
                    documentType="invoice"
                    paymentMethod={paymentMethod}
                    onPaymentMethodChange={(v) => { setPaymentMethod(v); setIsDirty(true) }}
                    bankAccounts={bankAccounts}
                    bankAccountId={bankAccountId}
                    onBankAccountChange={handleBankAccountChange}
                    loadingBankAccount={loadingBankAccount}
                    eInvoicingEnabled={invoiceSettings.eInvoicingEnabled}
                    notes={notes}
                    onNotesChange={setNotes}
                  />
                ) : (
                  <AiChatSidebar
                    documentType="invoice"
                    subject={options.subject}
                    lines={lines.filter((l) => l.type === 'standard').map((l) => ({
                      description: l.description,
                      quantity: l.quantity,
                      unitPrice: l.unitPrice,
                      vatRate: l.vatRate,
                    }))}
                    notes={notes}
                    acceptanceConditions={options.acceptanceConditions}
                    onProcessingChange={setAiProcessing}
                    onDocumentUpdate={(doc) => {
                      if (doc.subject) handleOptionsChange({ subject: doc.subject })
                      if (doc.notes !== undefined) setNotes(doc.notes)
                      if (doc.acceptanceConditions !== undefined) {
                        handleOptionsChange({ acceptanceConditions: doc.acceptanceConditions, showAcceptanceConditions: !!doc.acceptanceConditions })
                      }
                      if (doc.lines) {
                        setLines(doc.lines.map((l) => ({
                          id: generateId(),
                          type: 'standard' as const,
                          description: l.description,
                          saleType: '',
                          quantity: l.quantity,
                          unit: '',
                          unitPrice: l.unitPrice,
                          vatRate: l.vatRate,
                        })))
                      }
                    }}
                  />
                )}
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
          <Button onClick={handleSave} disabled={saving || loadingBankAccount} size="sm" className="min-w-[140px] rounded-xl">
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
        <DialogTitle>Modifications non enregistrées</DialogTitle>
        <p className="mt-2 text-sm text-muted-foreground">Vous avez des modifications non enregistrées. Que souhaitez-vous faire ?</p>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={cancelNavigation}>Annuler</Button>
          <Button variant="ghost" size="sm" onClick={() => confirmNavigation('/dashboard/invoices')}>Ignorer</Button>
          <Button size="sm" onClick={async () => { cancelNavigation(); await handleSave() }}><Save className="h-3.5 w-3.5 mr-1" /> Enregistrer</Button>
        </DialogFooter>
      </Dialog>

      <Dialog open={showUnlinkConfirm} onClose={() => setShowUnlinkConfirm(false)} className="max-w-sm">
        <DialogTitle>Délier le devis</DialogTitle>
        <DialogDescription>
          Êtes-vous sûr de vouloir délier le devis {sourceQuote?.quoteNumber} de cette facture ? Cette action est réversible.
        </DialogDescription>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => setShowUnlinkConfirm(false)}>Annuler</Button>
          <Button variant="destructive" size="sm" disabled={unlinking} onClick={async () => { await handleUnlinkQuote(); setShowUnlinkConfirm(false) }}>
            {unlinking ? <Spinner className="h-3.5 w-3.5" /> : <Unlink className="h-3.5 w-3.5 mr-1" />}
            Délier
          </Button>
        </DialogFooter>
      </Dialog>
    </motion.div>
  )
}

export default function EditInvoicePage() {
  return (
    <Suspense>
      <EditInvoiceContent />
    </Suspense>
  )
}
