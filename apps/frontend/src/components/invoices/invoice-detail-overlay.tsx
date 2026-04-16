'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Spinner } from '@/components/ui/spinner'
import { Button } from '@/components/ui/button'
import { Dropdown, DropdownItem, DropdownSeparator } from '@/components/ui/dropdown'
import { Dialog, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { StatusDropdown, invoiceStatusOptions } from '@/components/shared/status-dropdown'
import { useToast } from '@/components/ui/toast'
import { useInvoiceSettings } from '@/lib/invoice-settings-context'
import { api } from '@/lib/api'
import { A4Sheet, type DocumentLine, type ClientInfo, type CompanyInfo } from '@/components/shared/a4-sheet'
import { SendEmailModal } from '@/components/shared/send-email-modal'
import { EmailHistoryModal } from '@/components/shared/email-history-modal'
import { useTrackFeature } from '@/hooks/use-analytics'
import { useEmail } from '@/lib/email-context'
import { PaymentLinkModal } from '@/components/invoices/payment-link-modal'
import { PaymentLinkCard } from '@/components/invoices/payment-link-card'
import { ConfirmPaymentModal } from '@/components/invoices/confirm-payment-modal'
import { MarkPaidInfoModal } from '@/components/invoices/mark-paid-info-modal'
import {
  X,
  Send,
  Pencil,
  MoreHorizontal,
  Copy,
  Trash2,
  Download,
  Printer,
  AlertTriangle,
  MessageSquare,
  History,
  FileMinus2,
  Link2,
} from 'lucide-react'

interface InvoiceDetail {
  id: string
  invoiceNumber: string
  status: 'draft' | 'sent' | 'paid' | 'paid_unconfirmed' | 'overdue' | 'cancelled'
  subject: string | null
  issueDate: string
  dueDate: string | null
  billingType: 'quick' | 'detailed'
  accentColor: string | null
  logoUrl: string | null
  language: string | null
  subtotal: number
  taxAmount: number
  total: number
  notes: string | null
  comment: string | null
  sourceQuoteId: string | null
  sourceQuote: { id: string; quoteNumber: string } | null
  paymentTerms: string | null
  paymentMethod: string | null
  bankAccountId: string | null
  documentTitle: string | null
  acceptanceConditions: string | null
  signatureField: boolean
  freeField: string | null
  globalDiscountType: string | null
  globalDiscountValue: number | null
  deliveryAddress: string | null
  clientSiren: string | null
  clientVatNumber: string | null
  clientId: string | null
  clientSnapshot?: string | null
  companySnapshot?: string | null
  client: ClientInfo | null
  vatExemptReason?: 'none' | 'not_subject' | 'france_no_vat' | 'outside_france'
  lines: {
    id: string
    description: string
    saleType: string | null
    quantity: number
    unit: string | null
    unitPrice: number
    vatRate: number
    total: number
  }[]
}

interface InvoiceDetailOverlayProps {
  invoiceId: string | null
  onClose: () => void
  onStatusChange: (id: string, newStatus: string) => void
  onDelete: (id: string) => void
}

const noop = () => {}

export function InvoiceDetailOverlay({ invoiceId, onClose, onStatusChange, onDelete }: InvoiceDetailOverlayProps) {
  const router = useRouter()
  const { toast } = useToast()
  const trackFeature = useTrackFeature()
  const { settings: invoiceSettings, companyLogoUrl } = useInvoiceSettings()
  const [loading, setLoading] = useState(true)
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null)
  const [company, setCompany] = useState<CompanyInfo | null>(null)
  const [comment, setComment] = useState('')
  const [savingComment, setSavingComment] = useState(false)
  const [duplicating, setDuplicating] = useState(false)
  const [creatingCreditNote, setCreatingCreditNote] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [printing, setPrinting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [bankAccountInfo, setBankAccountInfo] = useState<{ bankName: string | null; iban: string | null; bic: string | null } | null>(null)
  const [emailModalOpen, setEmailModalOpen] = useState(false)
  const [emailModalMode, setEmailModalMode] = useState<'send' | 'reminder'>('send')
  const [emailHistoryOpen, setEmailHistoryOpen] = useState(false)
  const [paymentLinkModalOpen, setPaymentLinkModalOpen] = useState(false)
  const [confirmPaymentModalOpen, setConfirmPaymentModalOpen] = useState(false)
  const [markPaidInfoModalOpen, setMarkPaidInfoModalOpen] = useState(false)
  const [paymentLinkInfo, setPaymentLinkInfo] = useState<{
    id: string
    isActive: boolean
    isExpired: boolean
    isPasswordProtected: boolean
    paidAt: string | null
    confirmedAt: string | null
    expiresAt: string | null
  } | null>(null)
  const [paymentLinkUrl, setPaymentLinkUrl] = useState<string | null>(null)
  const [hasStripeConfigured, setHasStripeConfigured] = useState(false)
  const { hasEmailConfigured } = useEmail()
  const commentTimeout = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    if (!invoiceId) return
    setLoading(true)
    setInvoice(null)
    setBankAccountInfo(null)

    Promise.all([
      api.get<{ invoice: InvoiceDetail & { paymentLink?: any } }>(`/invoices/${invoiceId}`),
      api.get<{ company: CompanyInfo }>('/company'),
    ]).then(async ([invRes, compRes]) => {
      if (invRes.data?.invoice) {
        setInvoice(invRes.data.invoice)
        setComment(invRes.data.invoice.comment || '')
        // Load payment link info
        if (invRes.data.invoice.paymentLink) {
          setPaymentLinkInfo(invRes.data.invoice.paymentLink)
        } else {
          setPaymentLinkInfo(null)
        }
        // Fetch bank account info if invoice has a linked bank account
        if (invRes.data.invoice.bankAccountId) {
          const { data: bankData } = await api.get<{ bankAccount: { bankName: string | null; iban: string | null; bic: string | null } }>(`/company/bank-accounts/${invRes.data.invoice.bankAccountId}`)
          if (bankData?.bankAccount) {
            setBankAccountInfo(bankData.bankAccount)
          }
        }
      }
      if (compRes.data?.company) setCompany(compRes.data.company as CompanyInfo)
      setLoading(false)
    })

    // Check Stripe config
    api.get<{ isConfigured: boolean }>('/settings/stripe').then(({ data: stripeData }) => {
      if (stripeData) setHasStripeConfigured(stripeData.isConfigured)
    })
  }, [invoiceId])

  // Convert API lines to DocumentLine format for A4Sheet
  const sheetLines: DocumentLine[] = useMemo(() => {
    if (!invoice?.lines) return []
    return invoice.lines.map((l) => ({
      id: l.id || Math.random().toString(36).slice(2),
      type: (l.saleType === 'section' ? 'section' : 'standard') as 'standard' | 'section',
      description: l.description || '',
      saleType: l.saleType === 'section' ? '' : l.saleType || '',
      quantity: Number(l.quantity) || 1,
      unit: l.unit || '',
      unitPrice: Number(l.unitPrice) || 0,
      vatRate: Number(l.vatRate) || 0,
    }))
  }, [invoice?.lines])

  // Calculate tvaBreakdown for A4Sheet
  const { subtotal, taxAmount, discountAmount, total, tvaBreakdown } = useMemo(() => {
    if (!invoice) return { subtotal: 0, taxAmount: 0, discountAmount: 0, total: 0, tvaBreakdown: [] }
    const billingType = invoice.billingType
    let sub = 0, tax = 0
    const tvaMap: Record<number, { base: number; amount: number }> = {}

    for (const line of sheetLines) {
      if (line.type === 'section') continue
      const lt = billingType === 'quick' ? line.unitPrice : line.quantity * line.unitPrice
      const lTax = billingType === 'detailed' ? lt * (line.vatRate / 100) : 0
      sub += lt; tax += lTax
      if (billingType === 'detailed') {
        if (!tvaMap[line.vatRate]) tvaMap[line.vatRate] = { base: 0, amount: 0 }
        tvaMap[line.vatRate].base += lt; tvaMap[line.vatRate].amount += lTax
      }
    }

    let disc = 0
    const discType = invoice.globalDiscountType || 'none'
    const discVal = Number(invoice.globalDiscountValue) || 0
    if (discType === 'percentage' && discVal > 0) disc = sub * (discVal / 100)
    else if (discType === 'fixed' && discVal > 0) disc = discVal

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
  }, [invoice, sheetLines])

  const handleCommentChange = useCallback((value: string) => {
    setComment(value)
    if (commentTimeout.current) clearTimeout(commentTimeout.current)
    commentTimeout.current = setTimeout(async () => {
      setSavingComment(true)
      await api.patch(`/invoices/${invoiceId}/comment`, { comment: value })
      setSavingComment(false)
    }, 800)
  }, [invoiceId])

  function handleStatusUpdate(id: string, newStatus: string) {
    if (newStatus === 'paid' && invoice?.status !== 'paid_unconfirmed') {
      // Show mark-paid info modal when manually setting to paid
      setMarkPaidInfoModalOpen(true)
      return
    }
    if (invoice) setInvoice({ ...invoice, status: newStatus as InvoiceDetail['status'] })
    onStatusChange(id, newStatus)
  }

  async function handleMarkPaidSubmit(data: { paymentDate?: string; paymentMethod?: string; notes?: string }) {
    if (!invoice) return
    const { error } = await api.patch(`/invoices/${invoice.id}/status`, {
      status: 'paid',
      paidDate: data.paymentDate,
      paymentMethod: data.paymentMethod,
      notes: data.notes,
    })
    if (error) { toast(error, 'error'); return }
    setInvoice({ ...invoice, status: 'paid' })
    onStatusChange(invoice.id, 'paid')
    setMarkPaidInfoModalOpen(false)
  }

  function handleMarkPaidSkip() {
    if (!invoice) return
    api.patch(`/invoices/${invoice.id}/status`, { status: 'paid' })
    setInvoice({ ...invoice, status: 'paid' })
    onStatusChange(invoice.id, 'paid')
    setMarkPaidInfoModalOpen(false)
  }

  function handlePaymentConfirmed() {
    if (!invoice) return
    setInvoice({ ...invoice, status: 'paid' })
    setPaymentLinkInfo(null)
    onStatusChange(invoice.id, 'paid')
  }

  async function handlePaymentLinkDeleted() {
    setPaymentLinkInfo(null)
    setPaymentLinkUrl(null)
    // Re-fetch to get latest state
    const { data } = await api.get<{ paymentLink: any }>(`/invoices/${invoiceId}/payment-link`)
    if (data?.paymentLink) {
      setPaymentLinkInfo(data.paymentLink)
    }
  }

  function handleSendEmail() {
    setEmailModalMode('send')
    setEmailModalOpen(true)
  }

  function handleReminder() {
    setEmailModalMode('reminder')
    setEmailModalOpen(true)
  }

  function handleEmailSent() {
    if (invoice && invoice.status === 'draft') {
      setInvoice({ ...invoice, status: 'sent' })
      onStatusChange(invoice.id, 'sent')
    }
  }

  async function handleDuplicate() {
    setDuplicating(true)
    const { data, error } = await api.post<{ invoice: { id: string; invoiceNumber: string } }>(`/invoices/${invoiceId}/duplicate`, {})
    setDuplicating(false)
    if (error) { toast(error, 'error'); return }
    if (data?.invoice) {
      toast(`Facture ${data.invoice.invoiceNumber} créée`, 'success')
      onClose()
      router.push(`/dashboard/invoices/${data.invoice.id}/edit`)
    }
  }

  async function handleCreateCreditNote() {
    setCreatingCreditNote(true)
    const { data, error } = await api.post<{ creditNote: { id: string; creditNoteNumber: string } }>(`/credit-notes/convert-invoice/${invoiceId}`, {})
    setCreatingCreditNote(false)
    if (error) { toast(error, 'error'); return }
    if (data?.creditNote) {
      trackFeature('credit_note.create')
      toast(`Avoir ${data.creditNote.creditNoteNumber} créé`, 'success')
      onClose()
      router.push(`/dashboard/credit-notes/${data.creditNote.id}/edit`)
    }
  }

  async function handleDelete() {
    if (!invoiceId) return
    setDeleting(true)
    const { error } = await api.delete(`/invoices/${invoiceId}`)
    setDeleting(false)
    if (error) { toast(error, 'error'); return }
    toast('Facture supprimée', 'success')
    setShowDeleteConfirm(false)
    onDelete(invoiceId)
    onClose()
  }

  async function handleDownloadPdf() {
    setDownloading(true)
    const { blob, filename, error } = await api.downloadBlob(`/invoices/${invoiceId}/pdf`)
    setDownloading(false)
    if (error || !blob) { toast(error || 'Erreur', 'error'); return }
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename || 'facture.pdf'
    a.click()
    URL.revokeObjectURL(url)
    trackFeature('invoice.export_pdf')
  }

  async function handlePrint() {
    setPrinting(true)
    const { blob, error } = await api.downloadBlob(`/invoices/${invoiceId}/pdf`)
    setPrinting(false)
    if (error || !blob) { toast(error || 'Erreur', 'error'); return }
    const url = URL.createObjectURL(blob)
    const iframe = document.createElement('iframe')
    iframe.style.position = 'fixed'
    iframe.style.top = '-10000px'
    iframe.style.left = '-10000px'
    iframe.style.width = '0'
    iframe.style.height = '0'
    iframe.src = url
    document.body.appendChild(iframe)
    iframe.onload = () => {
      iframe.contentWindow?.print()
      setTimeout(() => {
        document.body.removeChild(iframe)
        URL.revokeObjectURL(url)
      }, 1000)
    }
  }

  // Always use current settings logo so preview stays in sync with PDF
  const effectiveLogoUrl = invoiceSettings.logoSource === 'company' ? companyLogoUrl : (invoiceSettings.logoUrl || invoice?.logoUrl || null)

  const effectiveClient = useMemo(() => {
    if (invoice?.clientSnapshot) {
      try { return JSON.parse(invoice.clientSnapshot) } catch { return invoice.client }
    }
    return invoice?.client || null
  }, [invoice?.clientSnapshot, invoice?.client])

  const effectiveCompany = useMemo(() => {
    if (invoice?.companySnapshot) {
      try { return JSON.parse(invoice.companySnapshot) as CompanyInfo } catch { return company }
    }
    return company
  }, [invoice?.companySnapshot, company])

  return (
    <AnimatePresence>
      {invoiceId && (
      <motion.div
        key="overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 z-50"
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 bg-background/60 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Content */}
        <div className="relative z-10 flex h-full items-stretch">
          {/* Preview area — centered */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
            className="flex-1 flex justify-center overflow-auto py-6 px-4"
          >
            {loading ? (
              <div className="w-full max-w-[700px] aspect-[210/297] bg-white rounded-xl shadow-xl flex items-center justify-center my-auto">
                <Spinner size="lg" />
              </div>
            ) : invoice ? (
              <div className="w-full max-w-[700px] my-auto">
                <A4Sheet
                  mode="preview"
                  logoUrl={effectiveLogoUrl}
                  accentColor={invoice.accentColor || '#6366f1'}
                  documentTitle={invoice.documentTitle || 'Facture'}
                  documentType="invoice"
                  quoteNumber={invoice.invoiceNumber}
                  onQuoteNumberChange={noop}
                  issueDate={invoice.issueDate || ''}
                  validityDate={invoice.dueDate || ''}
                  billingType={invoice.billingType}
                  company={effectiveCompany}
                  onCompanyFieldChange={noop}
                  client={effectiveClient}
                  onClientClick={noop}
                  onClearClient={noop}
                  onClientFieldChange={noop}
                  lines={sheetLines}
                  onUpdateLine={noop}
                  onAddLine={noop}
                  onRemoveLine={noop}
                  subtotal={subtotal}
                  taxAmount={taxAmount}
                  discountAmount={discountAmount}
                  total={total}
                  tvaBreakdown={tvaBreakdown}
                  notes={invoice.notes || ''}
                  onNotesChange={noop}
                  acceptanceConditions={invoice.acceptanceConditions || ''}
                  signatureField={invoice.signatureField}
                  freeField={invoice.freeField || ''}
                  deliveryAddress={invoice.deliveryAddress || ''}
                  showDeliveryAddress={!!invoice.deliveryAddress}
                  clientSiren={invoice.clientSiren || ''}
                  showClientSiren={!!invoice.clientSiren}
                  clientVatNumber={invoice.clientVatNumber || ''}
                  showClientVatNumber={!!invoice.clientVatNumber}
                  paymentMethods={invoiceSettings.paymentMethods}
                  customPaymentMethod={invoiceSettings.customPaymentMethod}
                  paymentMethod={invoice.paymentMethod}
                  bankAccountInfo={bankAccountInfo}
                  subject={invoice.subject || ''}
                  onSubjectChange={noop}
                  template={invoiceSettings.template}
                  darkMode={invoiceSettings.darkMode}
                  language={invoice.language || 'fr'}
                  showNotes={!!invoice.notes}
                  showSubject={!!invoice.subject}
                  showAcceptanceConditions={!!invoice.acceptanceConditions}
                  showFreeField={!!invoice.freeField}
                  footerMode={invoiceSettings.footerMode}
                  documentFont={invoiceSettings.documentFont}
                  vatExemptReason={invoice.vatExemptReason || 'none'}
                />
                {/* Download & Print buttons */}
                <div className="flex justify-center gap-2 mt-3">
                  <button
                    onClick={handleDownloadPdf}
                    disabled={downloading}
                    className="h-9 px-4 rounded-full bg-overlay shadow-overlay flex items-center gap-2 text-sm font-medium transition-colors"
                  >
                    {downloading ? <Spinner className="h-4 w-4" /> : <Download className="h-4 w-4 text-muted-foreground" />}
                    <span className="text-foreground">{downloading ? 'Téléchargement...' : 'Télécharger'}</span>
                  </button>
                  <button
                    onClick={handlePrint}
                    disabled={printing}
                    className="h-9 px-4 rounded-full bg-overlay shadow-overlay flex items-center gap-2 text-sm font-medium transition-colors"
                  >
                    {printing ? <Spinner className="h-4 w-4" /> : <Printer className="h-4 w-4 text-muted-foreground" />}
                    <span className="text-foreground">{printing ? 'Préparation...' : 'Imprimer'}</span>
                  </button>
                </div>
              </div>
            ) : null}
          </motion.div>

          {/* Side panel */}
          <motion.div
            initial={{ x: 320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 320, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
            className="w-[320px] shrink-0 bg-overlay border-l border-separator flex flex-col overflow-hidden rounded-l-2xl"
          >
            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <Spinner size="lg" />
              </div>
            ) : invoice ? (
              <>
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-separator">
                  <h3 className="text-lg font-bold text-foreground">{invoice.invoiceNumber}</h3>
                  <button
                    onClick={onClose}
                    className="h-7 w-7 rounded-full bg-overlay shadow-surface flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="flex-1 overflow-auto">
                  {/* Prominent Edit button */}
                  <div className="px-5 pt-4 pb-2 relative group/edit">
                    <Button
                      className="w-full h-11 text-sm font-semibold gap-2"
                      disabled={invoice.status === 'paid' || invoice.status === 'paid_unconfirmed' || !!paymentLinkInfo?.isActive}
                      onClick={() => { onClose(); router.push(`/dashboard/invoices/${invoice.id}/edit`) }}
                    >
                      <Pencil className="h-4 w-4" />
                      Modifier la facture
                    </Button>
                    {paymentLinkInfo?.isActive && (
                      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 translate-y-1 group-hover/edit:opacity-100 group-hover/edit:translate-y-0 transition-all duration-200 pointer-events-none z-20 whitespace-nowrap px-3 py-1.5 rounded-xl bg-foreground text-background text-xs shadow-lg">
                        Supprimez le lien de paiement pour modifier la facture
                      </div>
                    )}
                    {!paymentLinkInfo?.isActive && (invoice.status === 'paid' || invoice.status === 'paid_unconfirmed') && (
                      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 translate-y-1 group-hover/edit:opacity-100 group-hover/edit:translate-y-0 transition-all duration-200 pointer-events-none z-20 whitespace-nowrap px-3 py-1.5 rounded-xl bg-foreground text-background text-xs shadow-lg">
                        Changez le statut pour pouvoir modifier la facture
                      </div>
                    )}
                  </div>

                  {/* Status */}
                  <div className="px-5 py-3 border-b border-separator">
                    <StatusDropdown
                      id={invoice.id}
                      currentStatus={invoice.status}
                      options={invoiceStatusOptions}
                      endpoint="invoices"
                      onStatusChange={handleStatusUpdate}
                      fullWidth
                      readOnlyStatuses={['paid_unconfirmed']}
                    />
                  </div>

                  {/* Recovery section for overdue */}
                  {invoice.status === 'overdue' && (
                    <div className="px-5 py-4 border-b border-separator">
                      <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                          <span className="text-sm font-bold text-red-500">Impayée</span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Cette facture est en retard de paiement. Envoyez une relance au client.
                        </p>
                        <button
                          onClick={handleReminder}
                          disabled={!hasEmailConfigured}
                          className="mt-2 px-3 py-1 rounded-full bg-overlay shadow-surface text-xs font-semibold text-red-500 hover:bg-surface-hover transition-colors disabled:opacity-40 disabled:cursor-default"
                        >
                          Envoyer une relance
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Client */}
                  <div className="px-5 py-4 border-b border-separator">
                    {invoice.client ? (
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-accent-soft flex items-center justify-center text-accent font-bold text-sm shrink-0">
                          {invoice.client.displayName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{invoice.client.displayName}</p>
                          {invoice.client.email && <p className="text-xs text-muted-foreground truncate">{invoice.client.email}</p>}
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Aucun client</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="px-5 py-4 border-b border-separator space-y-1">
                    <div className="relative group/send">
                      <button
                        onClick={handleSendEmail}
                        disabled={!hasEmailConfigured || invoice.status !== 'draft'}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-surface-hover transition-colors disabled:opacity-40 disabled:cursor-default"
                      >
                        <Send className="h-4 w-4" /> Envoyer la facture
                      </button>
                      {!hasEmailConfigured && (
                        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 translate-y-1 group-hover/send:opacity-100 group-hover/send:translate-y-0 transition-all duration-200 pointer-events-none z-20 whitespace-nowrap px-3 py-1.5 rounded-xl bg-foreground text-background text-xs shadow-lg">
                          Configurez un compte email dans les paramètres
                        </div>
                      )}
                      {hasEmailConfigured && invoice.status !== 'draft' && (
                        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 translate-y-1 group-hover/send:opacity-100 group-hover/send:translate-y-0 transition-all duration-200 pointer-events-none z-20 whitespace-nowrap px-3 py-1.5 rounded-xl bg-foreground text-background text-xs shadow-lg">
                          {invoice.status === 'sent' || invoice.status === 'overdue' ? 'Facture déjà envoyée — utilisez Relancer' : 'Non disponible pour ce statut'}
                        </div>
                      )}
                    </div>
                    <div className="relative group/reminder">
                      <button
                        onClick={handleReminder}
                        disabled={!hasEmailConfigured || invoice.status === 'draft' || invoice.status === 'paid' || invoice.status === 'cancelled'}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-surface-hover transition-colors disabled:opacity-40 disabled:cursor-default"
                      >
                        <Send className="h-4 w-4" /> Relancer la facture
                      </button>
                      {!hasEmailConfigured && (
                        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 translate-y-1 group-hover/reminder:opacity-100 group-hover/reminder:translate-y-0 transition-all duration-200 pointer-events-none z-20 whitespace-nowrap px-3 py-1.5 rounded-xl bg-foreground text-background text-xs shadow-lg">
                          Configurez un compte email dans les paramètres
                        </div>
                      )}
                      {hasEmailConfigured && invoice.status === 'draft' && (
                        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 translate-y-1 group-hover/reminder:opacity-100 group-hover/reminder:translate-y-0 transition-all duration-200 pointer-events-none z-20 whitespace-nowrap px-3 py-1.5 rounded-xl bg-foreground text-background text-xs shadow-lg">
                          Envoyez d&apos;abord la facture
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => setEmailHistoryOpen(true)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-surface-hover transition-colors"
                    >
                      <History className="h-4 w-4" /> Historique des emails
                    </button>

                    {/* Plus d'actions */}
                    <Dropdown
                      align="left"
                      trigger={
                        <button className="w-full flex items-center justify-center gap-2 mt-2 px-3 py-2 rounded-full bg-overlay shadow-surface text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
                          <MoreHorizontal className="h-4 w-4" /> Plus d&apos;actions
                        </button>
                      }
                      className="min-w-[200px]"
                    >
                      <DropdownItem onClick={handleDuplicate}>
                        {duplicating ? <Spinner /> : <Copy className="h-4 w-4" />} Dupliquer
                      </DropdownItem>
                      <DropdownItem onClick={handleCreateCreditNote}>
                        {creatingCreditNote ? <Spinner /> : <FileMinus2 className="h-4 w-4" />} Créer un avoir
                      </DropdownItem>
                      <DropdownSeparator />
                      <DropdownItem destructive onClick={() => setShowDeleteConfirm(true)}>
                        <Trash2 className="h-4 w-4" /> Supprimer
                      </DropdownItem>
                    </Dropdown>
                  </div>

                  {/* Payment link section */}
                  <PaymentLinkCard
                    invoiceId={invoice.id}
                    invoiceStatus={invoice.status}
                    paymentLink={paymentLinkInfo}
                    linkUrl={paymentLinkUrl}
                    onDeleted={handlePaymentLinkDeleted}
                    onConfirmClick={() => setConfirmPaymentModalOpen(true)}
                  />

                  {/* Payment link button - show when no active link and not paid */}
                  {!paymentLinkInfo?.isActive && invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
                    <div className="px-5 py-3 border-b border-separator">
                      <button
                        onClick={() => setPaymentLinkModalOpen(true)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-surface-hover transition-colors"
                      >
                        <Link2 className="h-4 w-4" /> Lien de paiement
                      </button>
                    </div>
                  )}

                  {/* Comment */}
                  <div className="px-5 py-4">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Commentaire</span>
                      {savingComment && <Spinner className="h-3 w-3" />}
                    </div>
                    <textarea
                      rows={3}
                      placeholder="Ajouter un commentaire..."
                      value={comment}
                      onChange={(e) => handleCommentChange(e.target.value)}
                      className="w-full rounded-lg bg-field shadow-field px-3 py-2 text-sm text-field-foreground placeholder:text-field-placeholder outline-none resize-none focus:ring-2 focus:ring-accent/40 transition-colors"
                    />
                  </div>
                </div>
              </>
            ) : null}
          </motion.div>
        </div>

        {/* Delete confirmation dialog */}
        <Dialog open={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} className="max-w-sm">
          <DialogTitle>Supprimer la facture</DialogTitle>
          <DialogDescription>
            Êtes-vous sûr de vouloir supprimer la facture {invoice?.invoiceNumber} ? Cette action est irréversible.
          </DialogDescription>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowDeleteConfirm(false)}>Annuler</Button>
            <Button variant="destructive" size="sm" disabled={deleting} onClick={handleDelete}>
              {deleting ? <Spinner className="h-3.5 w-3.5" /> : <Trash2 className="h-3.5 w-3.5 mr-1" />}
              Supprimer
            </Button>
          </DialogFooter>
        </Dialog>

        {/* Send email modal */}
        {invoice && (
          <SendEmailModal
            open={emailModalOpen}
            onClose={() => setEmailModalOpen(false)}
            documentType="invoice"
            documentId={invoice.id}
            documentNumber={invoice.invoiceNumber}
            clientEmail={invoice.client?.email || null}
            clientName={invoice.client?.displayName || null}
            total={invoice.total}
            emailType={emailModalMode}
            onSent={handleEmailSent}
          />
        )}

        {/* Email history modal */}
        {invoice && (
          <EmailHistoryModal
            open={emailHistoryOpen}
            onClose={() => setEmailHistoryOpen(false)}
            documentType="invoice"
            documentId={invoice.id}
            documentNumber={invoice.invoiceNumber}
          />
        )}

        {/* Payment link modal */}
        {invoice && (
          <PaymentLinkModal
            open={paymentLinkModalOpen}
            onClose={() => setPaymentLinkModalOpen(false)}
            invoiceId={invoice.id}
            invoiceNumber={invoice.invoiceNumber}
            invoicePaymentMethod={invoice.paymentMethod}
            invoiceDueDate={invoice.dueDate}
            hasBankAccount={!!invoice.bankAccountId}
            hasStripeConfigured={hasStripeConfigured}
            enabledPaymentMethods={invoiceSettings.paymentMethods}
            customPaymentMethodLabel={invoiceSettings.customPaymentMethod}
            onCreated={(link) => {
              setPaymentLinkInfo({
                id: link.id,
                isActive: true,
                isExpired: false,
                isPasswordProtected: false,
                paidAt: null,
                confirmedAt: null,
                expiresAt: link.expiresAt,
              })
              setPaymentLinkUrl(link.url)
            }}
          />
        )}

        {/* Confirm payment modal */}
        {invoice && (
          <ConfirmPaymentModal
            open={confirmPaymentModalOpen}
            onClose={() => setConfirmPaymentModalOpen(false)}
            invoiceId={invoice.id}
            invoiceNumber={invoice.invoiceNumber}
            onConfirmed={handlePaymentConfirmed}
          />
        )}

        {/* Mark paid info modal */}
        <MarkPaidInfoModal
          open={markPaidInfoModalOpen}
          onClose={() => setMarkPaidInfoModalOpen(false)}
          onSubmit={handleMarkPaidSubmit}
          onSkip={handleMarkPaidSkip}
        />
      </motion.div>
      )}
    </AnimatePresence>
  )
}
