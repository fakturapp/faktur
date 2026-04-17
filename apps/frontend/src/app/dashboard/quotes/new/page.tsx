'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/toast'
import { Spinner } from '@/components/ui/spinner'
import { useInvoiceSettings } from '@/lib/invoice-settings-context'
import { useCompanySettings } from '@/lib/company-settings-context'
import { api } from '@/lib/api'
import { A4Sheet, ClientModal, type DocumentLine, type ClientInfo, type CompanyInfo } from '@/components/shared/a4-sheet'
import { DocumentOptionsPanel } from '@/components/shared/document-options'
import { Save, ArrowLeft, Eye, Pencil, SlidersHorizontal, X, Lock, Building2, Sparkles, Settings } from 'lucide-react'
import { retrieveAiDocument, clearAiDocument } from '@/lib/ai-document'
import { Tabs } from '@/components/ui/tabs'
import { AiChatSidebar } from '@/components/ai/ai-chat-sidebar'
import { AiSheetOverlay } from '@/components/ai/ai-sheet-overlay'
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes'
import { useTrackFeature } from '@/hooks/use-analytics'
import { FirstDocumentBanner } from '@/components/shared/first-document-banner'
import { ProductCatalogModal, type CatalogProduct } from '@/components/products/product-catalog-modal'
import { DocumentZoom, loadDocumentZoom, useZoomSpacing } from '@/components/shared/document-zoom'

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

const QUOTE_OPTIONS_KEY = 'faktur_quote_options'

function loadSavedOptions(): Partial<Record<string, any>> | null {
  try {
    const raw = localStorage.getItem(QUOTE_OPTIONS_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function saveOptionsToStorage(opts: Record<string, any>) {
  try {
    const toSave = {
      billingType: opts.billingType,
      language: opts.language,
      signatureField: opts.signatureField,
      freeField: opts.freeField,
      showNotes: opts.showNotes,
      vatExemptReason: opts.vatExemptReason,
      footerText: opts.footerText,
      showSubject: opts.showSubject,
      showDeliveryAddress: opts.showDeliveryAddress,
      showAcceptanceConditions: opts.showAcceptanceConditions,
      showFreeField: opts.showFreeField,
      showFooterText: opts.showFooterText,
      showQuantityColumn: opts.showQuantityColumn,
      showUnitColumn: opts.showUnitColumn,
      showUnitPriceColumn: opts.showUnitPriceColumn,
      showVatColumn: opts.showVatColumn,
      footerMode: opts.footerMode,
    }
    localStorage.setItem(QUOTE_OPTIONS_KEY, JSON.stringify(toSave))
  } catch { }
}

export default function NewQuotePage() {
  const router = useRouter()
  const { toast } = useToast()
  const trackFeature = useTrackFeature()
  const { settings: invoiceSettings, companyLogoUrl, loading: settingsLoading, refreshSettings, updateSettings, uploadLogo } = useInvoiceSettings()
  const { paymentForm: companyPaymentForm } = useCompanySettings()
  const defaultVatRate = Number.isFinite(Number(invoiceSettings.defaultVatRate))
    ? Number(invoiceSettings.defaultVatRate)
    : 20

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [mode, setMode] = useState<'edit' | 'preview'>('edit')
  const [docZoom, setDocZoom] = useState(100)
  useEffect(() => setDocZoom(loadDocumentZoom()), [])
  const a4SheetRef = useRef<HTMLDivElement>(null)
  const zoomSpacing = useZoomSpacing(a4SheetRef, docZoom)
  const [quoteNumber, setQuoteNumber] = useState('')
  const [company, setCompany] = useState<CompanyInfo | null>(null)
  const [selectedClient, setSelectedClient] = useState<ClientInfo | null>(null)
  const [clientModalOpen, setClientModalOpen] = useState(false)
  const [catalogModalOpen, setCatalogModalOpen] = useState(false)
  const [accentColor, setAccentColor] = useState('#6366f1')
  const [showOptions, setShowOptions] = useState(true)

  const [sidebarTab, setSidebarTab] = useState<'options' | 'chat'>('options')
  const [aiProcessing, setAiProcessing] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const aiRetryRef = useRef<(() => void) | null>(null)

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
    vatExemptReason: 'not_subject' as 'none' | 'not_subject' | 'france_no_vat' | 'outside_france',
    footerText: '',
    showSubject: false,
    showDeliveryAddress: false,
    showAcceptanceConditions: false,
    showFreeField: false,
    showFooterText: false,
    showQuantityColumn: true,
    showUnitColumn: true,
    showUnitPriceColumn: true,
    showVatColumn: true,
    footerMode: 'company_info' as 'company_info' | 'custom',
    facturX: false,
  })

  const [notes, setNotes] = useState('')
  const [isDirty, setIsDirty] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [localLogoUrl, setLocalLogoUrl] = useState<string | null | undefined>(undefined)
  const { showModal, confirmNavigation, cancelNavigation, requestNavigation } = useUnsavedChanges(isDirty)

  useEffect(() => {
    async function init() {
      const [numberRes, companyRes] = await Promise.all([
        api.get<{ nextNumber: string }>('/quotes/next-number'),
        api.get<{ company: CompanyInfo }>('/company'),
        refreshSettings(),
      ])
      if (numberRes.data?.nextNumber) setQuoteNumber(numberRes.data.nextNumber)
      if (companyRes.data?.company) setCompany(companyRes.data.company)
      setLoading(false)
    }
    init()
  }, [])

  useEffect(() => {
    if (!settingsLoading) {
      const saved = loadSavedOptions()
      setOptions((prev) => ({
        ...prev,
        billingType: invoiceSettings.billingType || saved?.billingType || prev.billingType,
        subject: saved?.subject || invoiceSettings.defaultSubject || prev.subject,
        acceptanceConditions: saved?.acceptanceConditions || invoiceSettings.defaultAcceptanceConditions || prev.acceptanceConditions,
        signatureField: saved?.signatureField ?? invoiceSettings.defaultSignatureField ?? prev.signatureField,
        freeField: saved?.freeField || invoiceSettings.defaultFreeField || prev.freeField,
        showNotes: saved?.showNotes ?? invoiceSettings.defaultShowNotes ?? prev.showNotes,
        vatExemptReason: saved?.vatExemptReason || (invoiceSettings.defaultVatExempt ? 'not_subject' : prev.vatExemptReason),
        footerText: saved?.footerText || invoiceSettings.defaultFooterText || prev.footerText,
        showDeliveryAddress: saved?.showDeliveryAddress ?? invoiceSettings.defaultShowDeliveryAddress ?? prev.showDeliveryAddress,
        language: saved?.language || invoiceSettings.defaultLanguage || prev.language,
        showSubject: saved?.showSubject ?? (!!(invoiceSettings.defaultSubject) || prev.showSubject),
        showAcceptanceConditions: saved?.showAcceptanceConditions ?? (!!(invoiceSettings.defaultAcceptanceConditions) || prev.showAcceptanceConditions),
        showFreeField: saved?.showFreeField ?? (!!(invoiceSettings.defaultFreeField) || prev.showFreeField),
        showFooterText: saved?.showFooterText ?? (!!(invoiceSettings.defaultFooterText) || prev.showFooterText),
        showQuantityColumn: invoiceSettings.defaultShowQuantityColumn ?? saved?.showQuantityColumn ?? prev.showQuantityColumn,
        showUnitColumn: invoiceSettings.defaultShowUnitColumn ?? saved?.showUnitColumn ?? prev.showUnitColumn,
        showUnitPriceColumn: invoiceSettings.defaultShowUnitPriceColumn ?? saved?.showUnitPriceColumn ?? prev.showUnitPriceColumn,
        showVatColumn: invoiceSettings.defaultShowVatColumn ?? saved?.showVatColumn ?? prev.showVatColumn,
        footerMode: saved?.footerMode || invoiceSettings.footerMode || prev.footerMode,
      }))
      setLines((prev) => {
        if (prev.length !== 1) return prev
        const [line] = prev
        if (
          line.type !== 'standard' ||
          line.description ||
          line.saleType ||
          line.unit ||
          line.quantity !== 1 ||
          line.unitPrice !== 0
        ) {
          return prev
        }
        return [{ ...line, vatRate: defaultVatRate }]
      })
      setAccentColor(invoiceSettings.accentColor)
    }
  }, [defaultVatRate, settingsLoading, invoiceSettings])

  useEffect(() => {
    if (loading || settingsLoading) return
    const aiDoc = retrieveAiDocument()
    if (aiDoc && aiDoc.type === 'quote') {
      clearAiDocument()
      setOptions((prev) => ({
        ...prev,
        subject: aiDoc.subject,
        showSubject: true,
        billingType: 'detailed',
        acceptanceConditions: aiDoc.acceptanceConditions || prev.acceptanceConditions,
        showAcceptanceConditions: !!(aiDoc.acceptanceConditions) || prev.showAcceptanceConditions,
      }))
      setNotes(aiDoc.notes || '')
      setLines(
        aiDoc.lines.map((line) => ({
          id: generateId(),
          type: 'standard' as const,
          description: line.description,
          saleType: '',
          quantity: line.quantity,
          unit: '',
          unitPrice: line.unitPrice,
          vatRate: line.vatRate,
        }))
      )
      if (aiDoc.clientId) {
        api.get<{ client: ClientInfo }>(
          `/clients/${aiDoc.clientId}`
        ).then(({ data }) => {
          if (data?.client) {
            setSelectedClient(data.client)
            setOptions((prev) => ({
              ...prev,
              clientSiren: data.client.siren || prev.clientSiren,
              clientVatNumber: data.client.vatNumber || prev.clientVatNumber,
            }))
          }
        })
      }
      setSidebarTab('chat')
      setIsDirty(true)
    }
  }, [loading, settingsLoading])

  // Handlers
  const handleUpdateLine = useCallback((index: number, partial: Partial<DocumentLine>) => {
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, ...partial } : l)))
    setIsDirty(true); setValidationErrors([])
  }, [])

  const handleAddLine = useCallback((type: 'standard' | 'section') => {
    setLines((prev) => [
      ...prev,
      { id: generateId(), type, description: '', saleType: '', quantity: 1, unit: '', unitPrice: 0, vatRate: type === 'section' ? 0 : defaultVatRate },
    ])
    setIsDirty(true); setValidationErrors([])
  }, [defaultVatRate])

  const handleRemoveLine = useCallback((index: number) => {
    setLines((prev) => prev.filter((_, i) => i !== index))
    setIsDirty(true); setValidationErrors([])
  }, [])

  const handleReorderLine = useCallback((fromIndex: number, toIndex: number) => {
    setLines((prev) => {
      if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= prev.length || toIndex >= prev.length) {
        return prev
      }
      const next = [...prev]
      const [moved] = next.splice(fromIndex, 1)
      next.splice(toIndex, 0, moved)
      return next
    })
    setIsDirty(true); setValidationErrors([])
  }, [])

  const handleOptionsChange = useCallback((partial: Partial<typeof options>) => {
    setOptions((prev) => {
      const next = { ...prev, ...partial }
      saveOptionsToStorage(next)
      return next
    })
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

  const effectiveLogoUrl = localLogoUrl !== undefined
    ? localLogoUrl
    : (invoiceSettings.logoSource === 'company' ? companyLogoUrl : invoiceSettings.logoUrl) || companyLogoUrl

  const handleLogoChange = useCallback((url: string | null, saveToSettings: boolean) => {
    setLocalLogoUrl(url)
    if (saveToSettings) {
      if (url === null) updateSettings({ logoUrl: null, logoSource: 'custom' })
      else if (url === companyLogoUrl) updateSettings({ logoSource: 'company' })
      else updateSettings({ logoUrl: url, logoSource: 'custom' })
    }
    setIsDirty(true)
  }, [companyLogoUrl, updateSettings])

  const handleLogoUpload = useCallback((file: File, saveToSettings: boolean) => {
    const reader = new FileReader()
    reader.onload = () => setLocalLogoUrl(reader.result as string)
    reader.readAsDataURL(file)
    if (saveToSettings) { uploadLogo(file); updateSettings({ logoSource: 'custom' }) }
    setIsDirty(true)
  }, [uploadLogo, updateSettings])

  const handleLogoBorderRadiusChange = useCallback((radius: number) => {
    updateSettings({ logoBorderRadius: radius })
  }, [updateSettings])

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
      subject: options.showSubject ? (options.subject || undefined) : undefined,
      issueDate: options.issueDate,
      validityDate: options.validityDate || undefined,
      billingType: options.billingType,
      accentColor,
      logoUrl: (invoiceSettings.logoSource === 'company' ? companyLogoUrl : invoiceSettings.logoUrl) || undefined,
      language: options.language,
      notes: notes || undefined,
      acceptanceConditions: options.showAcceptanceConditions ? (options.acceptanceConditions || undefined) : undefined,
      signatureField: options.signatureField,
      documentTitle: options.documentTitle || undefined,
      freeField: options.showFreeField ? (options.freeField || undefined) : undefined,
      globalDiscountType: options.globalDiscountType,
      globalDiscountValue: options.globalDiscountValue,
      deliveryAddress: options.showDeliveryAddress ? (options.deliveryAddress || undefined) : undefined,
      clientSiren: options.clientSiren || undefined,
      clientVatNumber: options.clientVatNumber || undefined,
      showQuantityColumn: options.showQuantityColumn,
      showUnitColumn: options.showUnitColumn,
      showUnitPriceColumn: options.showUnitPriceColumn,
      showVatColumn: options.showVatColumn,
      vatExemptReason: options.vatExemptReason,
      clientSnapshot: selectedClient ? {
        id: selectedClient.id,
        type: selectedClient.type,
        displayName: selectedClient.displayName,
        companyName: selectedClient.companyName,
        firstName: selectedClient.firstName,
        lastName: selectedClient.lastName,
        email: selectedClient.email,
        phone: selectedClient.phone,
        address: selectedClient.address,
        addressComplement: selectedClient.addressComplement,
        postalCode: selectedClient.postalCode,
        city: selectedClient.city,
        country: selectedClient.country,
        siren: selectedClient.siren,
        vatNumber: selectedClient.vatNumber,
      } : undefined,
      companySnapshot: company ? {
        legalName: company.legalName,
        addressLine1: company.addressLine1,
        addressLine2: company.addressLine2,
        postalCode: company.postalCode,
        city: company.city,
        country: company.country,
        phone: company.phone,
        email: company.email,
        siren: company.siren,
        vatNumber: company.vatNumber,
      } : undefined,
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
      trackFeature('quote.create')
      toast('Devis créé', 'success')
      router.push('/dashboard/quotes')
    }
  }

  // Loading skeleton
  // Blocage si pas d'entreprise configurée
  if (!loading && !settingsLoading && !company) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md mx-auto px-6"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-500/10 mx-auto mb-5">
            <Lock className="h-8 w-8 text-orange-500" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Entreprise requise</h2>
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
            Vous devez configurer les informations de votre entreprise avant de pouvoir
            créer des devis. Ces informations apparaîtront sur chaque document généré.
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => router.push('/dashboard')}>
              Retour
            </Button>
            <Button className="gap-2" onClick={() => router.push('/dashboard/company')}>
              <Building2 className="h-4 w-4" /> Configurer l&apos;entreprise
            </Button>
          </div>
        </motion.div>
      </div>
    )
  }

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
            <div className="w-full max-w-[960px] rounded-xl">
              <div className="bg-white dark:bg-zinc-900 rounded-sm p-10 relative overflow-hidden" style={{ aspectRatio: '210/297' }}>
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.03] to-transparent skeleton-shimmer" />
                <div className="flex justify-between mb-12">
                  <div className="space-y-3">
                    <Skeleton className="h-10 w-24 rounded-xl bg-primary/10" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-28" />
                  </div>
                  <div className="text-right space-y-3">
                    <Skeleton className="h-6 w-40 ml-auto rounded-lg" />
                    <Skeleton className="h-3 w-32 ml-auto" />
                    <Skeleton className="h-3 w-24 ml-auto" />
                  </div>
                </div>
                
                <Skeleton className="h-px w-full bg-border/40 my-8" />
                
                <div className="grid grid-cols-2 gap-12 mb-12">
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-20 bg-muted/40" />
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-16 bg-muted/40" />
                    <Skeleton className="h-5 w-36" />
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-4 w-28" />
                  </div>
                </div>
                
                <div className="mt-12">
                  <Skeleton className="h-10 w-full rounded-t-xl bg-muted/30" />
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full rounded-none border-t border-border/20" style={{ opacity: 1 - i * 0.15 }} />
                  ))}
                </div>
                
                <div className="flex justify-end mt-8">
                  <div className="w-64 space-y-3">
                    <div className="flex justify-between"><Skeleton className="h-4 w-24" /><Skeleton className="h-4 w-20" /></div>
                    <div className="flex justify-between"><Skeleton className="h-4 w-20" /><Skeleton className="h-4 w-16" /></div>
                    <Skeleton className="h-px w-full bg-border/40" />
                    <div className="flex justify-between items-center mt-2">
                       <Skeleton className="h-6 w-20 bg-primary/10" />
                       <Skeleton className="h-7 w-28 bg-primary/20" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="w-full xl:w-[300px] xl:shrink-0 space-y-4">
            <div className="mb-3 flex justify-between gap-2">
               <Skeleton className="h-9 flex-1 rounded-xl bg-muted/30" />
               <Skeleton className="h-9 flex-1 rounded-xl bg-muted/30" />
            </div>
            {[...Array(2)].map((_, i) => (
              <div key={i} className="rounded-3xl border border-border/40 bg-card/40 backdrop-blur-md liquid-glass px-5 py-4 shadow-overlay relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.03] to-transparent skeleton-shimmer" />
                <div className="flex items-center justify-between mb-4">
                  <Skeleton className="h-5 w-24 bg-muted/40 rounded-lg" />
                  <Skeleton className="h-4 w-4 rounded-full bg-muted/30" />
                </div>
                <div className="space-y-3">
                  <Skeleton className="h-8 w-full rounded-lg bg-muted/20" />
                  <Skeleton className="h-8 w-full rounded-lg bg-muted/20" />
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
            if (!requestNavigation('/dashboard/quotes')) router.push('/dashboard/quotes')
          }}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Nouveau devis</h1>
            <p className="text-muted-foreground mt-0.5 text-sm">{quoteNumber}</p>
          </div>
        </div>

        {/* Mode toggle */}
        <div className="flex items-center gap-3">
          <DocumentZoom value={docZoom} onChange={setDocZoom} />
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
      <div className="flex flex-col xl:flex-row gap-5">
        {/* A4 Sheet */}
        <motion.div variants={fadeUp} custom={1} className="flex-1 min-w-0 order-1">
          <div className="rounded-xl relative">
          {/* Toggle options + AI button */}
          <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
            {invoiceSettings.aiEnabled && (
              <button onClick={() => { setShowOptions(true); setSidebarTab('chat') }} className="p-1.5 rounded-lg border border-border bg-card/80 backdrop-blur-sm text-purple-500 hover:text-purple-400 hover:bg-purple-500/10 transition-colors" title="Faktur AI">
                <Sparkles className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={() => setShowOptions(!showOptions)}
              className="p-1.5 rounded-lg border border-border bg-card/80 backdrop-blur-sm text-muted-foreground hover:text-foreground transition-colors"
              title={showOptions ? 'Masquer les options' : 'Afficher les options'}
            >
              <SlidersHorizontal className="h-4 w-4" />
            </button>
          </div>
          <FirstDocumentBanner
            documentType="quote"
            currentNumber={quoteNumber}
            onNumberChange={setQuoteNumber}
          />
          <div ref={a4SheetRef} className="relative" style={{ transform: `scale(${docZoom / 100})`, transformOrigin: 'top center', ...zoomSpacing }}>
          <AiSheetOverlay
            open={aiProcessing}
            error={aiError}
            onRetry={() => aiRetryRef.current?.()}
            onDismissError={() => setAiError(null)}
          />
          <A4Sheet
            mode={mode}
            logoUrl={effectiveLogoUrl}
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
            onReorderLine={handleReorderLine}
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
            showClientSiren={!!options.clientSiren}
            clientVatNumber={options.clientVatNumber}
            showClientVatNumber={!!options.clientVatNumber}
            paymentMethods={companyPaymentForm.paymentMethods}
            customPaymentMethod={companyPaymentForm.customPaymentMethod}
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
            showQuantityColumn={options.showQuantityColumn}
            showUnitColumn={options.showUnitColumn}
            showUnitPriceColumn={options.showUnitPriceColumn}
            showVatColumn={options.showVatColumn}
            footerMode={options.footerMode}
            validationErrors={validationErrors}
            onAcceptanceConditionsChange={(v) => handleOptionsChange({ acceptanceConditions: v })}
            onFreeFieldChange={(v) => handleOptionsChange({ freeField: v })}
            onFooterTextChange={(v) => handleOptionsChange({ footerText: v })}
            onDeliveryAddressChange={(v) => handleOptionsChange({ deliveryAddress: v })}
            onIssueDateChange={(d) => handleOptionsChange({ issueDate: d })}
            onValidityDateChange={(d) => handleOptionsChange({ validityDate: d })}
            logoBorderRadius={invoiceSettings.logoBorderRadius}
            companyLogoUrl={companyLogoUrl}
            onLogoChange={handleLogoChange}
            onLogoBorderRadiusChange={handleLogoBorderRadiusChange}
            onLogoUpload={handleLogoUpload}
          />
          </div>
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
                {invoiceSettings.aiEnabled && (
                  <Tabs
                    tabs={[
                      { id: 'options', label: 'Options', icon: <Settings className="h-3.5 w-3.5" /> },
                      { id: 'chat', label: 'Faktur AI', icon: <Sparkles className="h-3.5 w-3.5" /> },
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
                    documentType="quote"
                    notes={notes}
                    onNotesChange={setNotes}
                  />
                ) : (
                  <AiChatSidebar
                    documentType="quote"
                    subject={options.subject}
                    lines={lines.filter((l) => l.type === 'standard').map((l) => ({
                      description: l.description,
                      quantity: l.quantity,
                      unitPrice: l.unitPrice,
                      vatRate: l.vatRate,
                    }))}
                    notes={notes}
                    acceptanceConditions={options.acceptanceConditions}
                    clientName={selectedClient?.displayName}
                    clientSiren={selectedClient?.siren || undefined}
                    clientVatNumber={selectedClient?.vatNumber || undefined}
                    clientAddress={selectedClient ? [selectedClient.address, selectedClient.postalCode, selectedClient.city].filter(Boolean).join(', ') : undefined}
                    clientEmail={selectedClient?.email || undefined}
                    onProcessingChange={setAiProcessing}
                    onErrorChange={setAiError}
                    onRetryRef={aiRetryRef}
                    onDocumentUpdate={(doc) => {
                      if (doc.subject) handleOptionsChange({ subject: doc.subject })
                      if (doc.notes !== undefined) setNotes(doc.notes)
                      if (doc.acceptanceConditions !== undefined) {
                        handleOptionsChange({ acceptanceConditions: doc.acceptanceConditions, showAcceptanceConditions: !!doc.acceptanceConditions })
                      }
                      if (doc.lines) {
                        handleOptionsChange({ billingType: 'detailed' })
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

      {/* ── Sticky save bar ── */}
      <div className="fixed bottom-4 left-0 right-0 z-20 flex flex-col items-center gap-2 pointer-events-none">
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

      {/* ── Client Modal ── */}
      <ClientModal
        open={clientModalOpen}
        onClose={() => setClientModalOpen(false)}
        onSelect={handleSelectClient}
      />

      {/* ── Product Catalog Modal ── */}
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

      {/* ── Unsaved changes dialog ── */}
      <Dialog open={showModal} onClose={cancelNavigation} className="max-w-sm">
        <DialogHeader showClose={false}>
          <DialogTitle>Modifications non enregistrées</DialogTitle>
          <DialogDescription>
            Vous avez des modifications non enregistrées. Que souhaitez-vous faire ?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={cancelNavigation}>
            Annuler
          </Button>
          <Button variant="ghost" size="sm" onClick={() => confirmNavigation('/dashboard/quotes')}>
            Ignorer
          </Button>
          <Button size="sm" onClick={async () => { cancelNavigation(); await handleSave() }}>
            <Save className="h-3.5 w-3.5 mr-1" /> Enregistrer
          </Button>
        </DialogFooter>
      </Dialog>
    </motion.div>
  )
}
