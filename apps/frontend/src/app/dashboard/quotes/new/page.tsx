'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, type Variants } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/toast'
import { Spinner } from '@/components/ui/spinner'
import { useInvoiceSettings } from '@/lib/invoice-settings-context'
import { api } from '@/lib/api'
import { A4Sheet, type QuoteLine, type ClientInfo } from '@/components/quotes/a4-sheet'
import { QuoteOptionsPanel } from '@/components/quotes/quote-options'
import { Save, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
} satisfies Variants

interface CompanyInfo {
  legalName: string
  addressLine1: string | null
  addressLine2: string | null
  postalCode: string | null
  city: string | null
  country: string
  phone: string | null
  email: string | null
  siren: string | null
  vatNumber: string | null
}

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
  const { settings: invoiceSettings, loading: settingsLoading } = useInvoiceSettings()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [quoteNumber, setQuoteNumber] = useState('')
  const [company, setCompany] = useState<CompanyInfo | null>(null)
  const [selectedClient, setSelectedClient] = useState<ClientInfo | null>(null)

  const [lines, setLines] = useState<QuoteLine[]>([
    {
      id: generateId(),
      type: 'standard',
      description: '',
      saleType: '',
      quantity: 1,
      unit: '',
      unitPrice: 0,
      vatRate: 20,
    },
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
  })

  const [notes, setNotes] = useState('')

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

  useEffect(() => {
    if (!settingsLoading) {
      setOptions((prev) => ({ ...prev, billingType: invoiceSettings.billingType }))
    }
  }, [settingsLoading, invoiceSettings.billingType])

  const handleUpdateLine = useCallback((index: number, partial: Partial<QuoteLine>) => {
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, ...partial } : l)))
  }, [])

  const handleAddLine = useCallback((type: 'standard' | 'section') => {
    setLines((prev) => [
      ...prev,
      {
        id: generateId(),
        type,
        description: '',
        saleType: '',
        quantity: 1,
        unit: '',
        unitPrice: 0,
        vatRate: type === 'section' ? 0 : 20,
      },
    ])
  }, [])

  const handleRemoveLine = useCallback((index: number) => {
    setLines((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const handleOptionsChange = useCallback((partial: Partial<typeof options>) => {
    setOptions((prev) => ({ ...prev, ...partial }))
  }, [])

  const handleSelectClient = useCallback((client: ClientInfo) => {
    setSelectedClient(client)
    setOptions((prev) => ({
      ...prev,
      clientSiren: client.siren || prev.clientSiren,
      clientVatNumber: client.vatNumber || prev.clientVatNumber,
    }))
  }, [])

  const { subtotal, taxAmount, discountAmount, total } = useMemo(() => {
    let sub = 0
    let tax = 0
    for (const line of lines) {
      if (line.type === 'section') continue
      const lt = options.billingType === 'quick' ? line.unitPrice : line.quantity * line.unitPrice
      const lTax = options.billingType === 'detailed' ? lt * (line.vatRate / 100) : 0
      sub += lt
      tax += lTax
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
    }
  }, [lines, options.billingType, options.globalDiscountType, options.globalDiscountValue])

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
      accentColor: invoiceSettings.accentColor,
      logoUrl: invoiceSettings.logoUrl || undefined,
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
      toast('Devis cree', 'success')
      router.push('/dashboard/quotes')
    }
  }

  if (loading || settingsLoading) {
    return (
      <div className="space-y-6 px-4 lg:px-6 py-4 md:py-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6 items-start">
          <div className="flex justify-center">
            <Skeleton className="w-full max-w-[680px] rounded-xl" style={{ aspectRatio: '210/297' }} />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-48 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <motion.div initial="hidden" animate="visible" className="space-y-6 px-4 lg:px-6 py-4 md:py-6">
      {/* Header */}
      <motion.div variants={fadeUp} custom={0} className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/quotes">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Nouveau devis</h1>
            <p className="text-muted-foreground mt-0.5 text-sm">{quoteNumber}</p>
          </div>
        </div>
      </motion.div>

      {/* Main grid */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6 items-start">
        {/* Left: A4 Sheet */}
        <motion.div variants={fadeUp} custom={1} className="flex justify-center">
          <A4Sheet
            logoUrl={invoiceSettings.logoUrl}
            accentColor={invoiceSettings.accentColor}
            documentTitle={options.documentTitle}
            quoteNumber={quoteNumber}
            issueDate={options.issueDate}
            validityDate={options.validityDate}
            billingType={options.billingType}
            company={company}
            client={selectedClient}
            onSelectClient={handleSelectClient}
            onClearClient={() => setSelectedClient(null)}
            lines={lines}
            onUpdateLine={handleUpdateLine}
            onAddLine={handleAddLine}
            onRemoveLine={handleRemoveLine}
            subtotal={subtotal}
            taxAmount={taxAmount}
            discountAmount={discountAmount}
            total={total}
            notes={notes}
            onNotesChange={setNotes}
            acceptanceConditions={options.acceptanceConditions}
            signatureField={options.signatureField}
            freeField={options.freeField}
            paymentMethods={invoiceSettings.paymentMethods}
            customPaymentMethod={invoiceSettings.customPaymentMethod}
          />
        </motion.div>

        {/* Right: Sidebar - Options only */}
        <motion.div variants={fadeUp} custom={2} className="xl:sticky xl:top-4">
          <QuoteOptionsPanel options={options} onChange={handleOptionsChange} />
        </motion.div>
      </div>

      {/* Sticky save bar */}
      <motion.div
        variants={fadeUp}
        custom={3}
        className="sticky bottom-0 -mx-4 lg:-mx-6 px-4 lg:px-6 py-4 bg-background/80 backdrop-blur-md border-t border-border"
      >
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Total:{' '}
            <span className="font-bold text-foreground">
              {total.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
            </span>
          </div>
          <Button onClick={handleSave} disabled={saving} className="min-w-[160px]">
            {saving ? (
              <>
                <Spinner /> Enregistrement...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-1.5" /> Sauvegarder
              </>
            )}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}
