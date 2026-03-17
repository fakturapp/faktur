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
import { useEmail } from '@/lib/email-context'
import {
  X,
  Send,
  Pencil,
  MoreHorizontal,
  Copy,
  Trash2,
  Download,
  AlertTriangle,
  MessageSquare,
  History,
} from 'lucide-react'

interface InvoiceDetail {
  id: string
  invoiceNumber: string
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
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
  const { settings: invoiceSettings, companyLogoUrl } = useInvoiceSettings()
  const [loading, setLoading] = useState(true)
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null)
  const [company, setCompany] = useState<CompanyInfo | null>(null)
  const [comment, setComment] = useState('')
  const [savingComment, setSavingComment] = useState(false)
  const [duplicating, setDuplicating] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [bankAccountInfo, setBankAccountInfo] = useState<{ bankName: string | null; iban: string | null; bic: string | null } | null>(null)
  const [emailModalOpen, setEmailModalOpen] = useState(false)
  const [emailModalMode, setEmailModalMode] = useState<'send' | 'reminder'>('send')
  const [emailHistoryOpen, setEmailHistoryOpen] = useState(false)
  const { hasEmailConfigured } = useEmail()
  const commentTimeout = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    if (!invoiceId) return
    setLoading(true)
    setInvoice(null)
    setBankAccountInfo(null)

    Promise.all([
      api.get<{ invoice: InvoiceDetail }>(`/invoices/${invoiceId}`),
      api.get<{ company: CompanyInfo }>('/company'),
    ]).then(async ([invRes, compRes]) => {
      if (invRes.data?.invoice) {
        setInvoice(invRes.data.invoice)
        setComment(invRes.data.invoice.comment || '')
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
  }, [invoiceId])

  // Convert API lines to DocumentLine format for A4Sheet
  const sheetLines: DocumentLine[] = useMemo(() => {
    if (!invoice?.lines) return []
    return invoice.lines.map((l) => ({
      id: l.id || Math.random().toString(36).slice(2),
      type: (l.saleType === 'section' ? 'section' : 'standard') as 'standard' | 'section',
      description: l.description || '',
      saleType: l.saleType === 'section' ? '' : l.saleType || '',
      quantity: l.quantity || 1,
      unit: l.unit || '',
      unitPrice: l.unitPrice || 0,
      vatRate: l.vatRate || 0,
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
    const discVal = invoice.globalDiscountValue || 0
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
    if (invoice) setInvoice({ ...invoice, status: newStatus as InvoiceDetail['status'] })
    onStatusChange(id, newStatus)
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
  }

  // Always use current settings logo so preview stays in sync with PDF
  const effectiveLogoUrl = invoiceSettings.logoSource === 'company' ? companyLogoUrl : (invoiceSettings.logoUrl || invoice?.logoUrl || null)

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
            className="flex-1 flex items-center justify-center overflow-auto py-6 px-4"
          >
            {loading ? (
              <div className="w-[600px] aspect-[210/297] bg-white rounded-xl shadow-xl flex items-center justify-center">
                <Spinner size="lg" />
              </div>
            ) : invoice ? (
              <div className="w-full max-w-[700px] shrink-0">
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
                  company={company}
                  onCompanyFieldChange={noop}
                  client={invoice.client}
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
                {/* Download button */}
                <div className="flex justify-center mt-3">
                  <button
                    onClick={handleDownloadPdf}
                    disabled={downloading}
                    className="h-9 px-4 rounded-full bg-card shadow-lg flex items-center gap-2 text-sm font-medium transition-colors border border-border"
                  >
                    {downloading ? <Spinner className="h-4 w-4" /> : <Download className="h-4 w-4 text-muted-foreground" />}
                    <span className="text-foreground">{downloading ? 'Téléchargement...' : 'Télécharger'}</span>
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
            className="w-[320px] shrink-0 bg-card border-l border-border flex flex-col overflow-hidden rounded-l-2xl"
          >
            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <Spinner size="lg" />
              </div>
            ) : invoice ? (
              <>
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                  <h3 className="text-lg font-bold text-foreground">{invoice.invoiceNumber}</h3>
                  <button
                    onClick={onClose}
                    className="h-7 w-7 rounded-full bg-card shadow flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors border border-border"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="flex-1 overflow-auto">
                  {/* Prominent Edit button */}
                  <div className="px-5 pt-4 pb-2 relative group/edit">
                    <Button
                      className="w-full h-11 text-sm font-semibold gap-2"
                      disabled={invoice.status === 'paid'}
                      onClick={() => { onClose(); router.push(`/dashboard/invoices/${invoice.id}/edit`) }}
                    >
                      <Pencil className="h-4 w-4" />
                      Modifier la facture
                    </Button>
                    {invoice.status === 'paid' && (
                      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 translate-y-1 group-hover/edit:opacity-100 group-hover/edit:translate-y-0 transition-all duration-200 pointer-events-none z-20 whitespace-nowrap px-3 py-1.5 rounded-xl bg-zinc-900 text-white text-xs shadow-lg">
                        Changez le statut pour pouvoir modifier la facture
                      </div>
                    )}
                  </div>

                  {/* Status */}
                  <div className="px-5 py-3 border-b border-border">
                    <StatusDropdown
                      id={invoice.id}
                      currentStatus={invoice.status}
                      options={invoiceStatusOptions}
                      endpoint="invoices"
                      onStatusChange={handleStatusUpdate}
                      fullWidth
                    />
                  </div>

                  {/* Recovery section for overdue */}
                  {invoice.status === 'overdue' && (
                    <div className="px-5 py-4 border-b border-border">
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
                          className="mt-2 px-3 py-1 rounded-full bg-card shadow-sm text-xs font-semibold text-red-500 border border-border hover:bg-muted/50 transition-colors disabled:opacity-40 disabled:cursor-default"
                        >
                          Envoyer une relance
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Client */}
                  <div className="px-5 py-4 border-b border-border">
                    {invoice.client ? (
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
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
                  <div className="px-5 py-4 border-b border-border space-y-1">
                    <div className="relative group/send">
                      <button
                        onClick={handleSendEmail}
                        disabled={!hasEmailConfigured || invoice.status !== 'draft'}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-muted/50 transition-colors disabled:opacity-40 disabled:cursor-default"
                      >
                        <Send className="h-4 w-4" /> Envoyer la facture
                      </button>
                      {!hasEmailConfigured && (
                        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 translate-y-1 group-hover/send:opacity-100 group-hover/send:translate-y-0 transition-all duration-200 pointer-events-none z-20 whitespace-nowrap px-3 py-1.5 rounded-xl bg-zinc-900 text-white text-xs shadow-lg">
                          Configurez un compte email dans les paramètres
                        </div>
                      )}
                      {hasEmailConfigured && invoice.status !== 'draft' && (
                        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 translate-y-1 group-hover/send:opacity-100 group-hover/send:translate-y-0 transition-all duration-200 pointer-events-none z-20 whitespace-nowrap px-3 py-1.5 rounded-xl bg-zinc-900 text-white text-xs shadow-lg">
                          {invoice.status === 'sent' || invoice.status === 'overdue' ? 'Facture déjà envoyée — utilisez Relancer' : 'Non disponible pour ce statut'}
                        </div>
                      )}
                    </div>
                    <div className="relative group/reminder">
                      <button
                        onClick={handleReminder}
                        disabled={!hasEmailConfigured || invoice.status === 'draft' || invoice.status === 'paid' || invoice.status === 'cancelled'}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-muted/50 transition-colors disabled:opacity-40 disabled:cursor-default"
                      >
                        <Send className="h-4 w-4" /> Relancer la facture
                      </button>
                      {!hasEmailConfigured && (
                        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 translate-y-1 group-hover/reminder:opacity-100 group-hover/reminder:translate-y-0 transition-all duration-200 pointer-events-none z-20 whitespace-nowrap px-3 py-1.5 rounded-xl bg-zinc-900 text-white text-xs shadow-lg">
                          Configurez un compte email dans les paramètres
                        </div>
                      )}
                      {hasEmailConfigured && invoice.status === 'draft' && (
                        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 translate-y-1 group-hover/reminder:opacity-100 group-hover/reminder:translate-y-0 transition-all duration-200 pointer-events-none z-20 whitespace-nowrap px-3 py-1.5 rounded-xl bg-zinc-900 text-white text-xs shadow-lg">
                          Envoyez d&apos;abord la facture
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => setEmailHistoryOpen(true)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
                    >
                      <History className="h-4 w-4" /> Historique des emails
                    </button>

                    {/* Plus d'actions */}
                    <Dropdown
                      align="left"
                      trigger={
                        <button className="w-full flex items-center justify-center gap-2 mt-2 px-3 py-2 rounded-full bg-card shadow-sm text-sm font-semibold text-muted-foreground border border-border hover:text-foreground transition-colors">
                          <MoreHorizontal className="h-4 w-4" /> Plus d&apos;actions
                        </button>
                      }
                      className="min-w-[200px]"
                    >
                      <DropdownItem onClick={handleDuplicate}>
                        {duplicating ? <Spinner /> : <Copy className="h-4 w-4" />} Dupliquer
                      </DropdownItem>
                      <DropdownSeparator />
                      <DropdownItem destructive onClick={() => setShowDeleteConfirm(true)}>
                        <Trash2 className="h-4 w-4" /> Supprimer
                      </DropdownItem>
                    </Dropdown>
                  </div>

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
                      className="w-full rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none resize-none focus:border-primary/50 transition-colors"
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
      </motion.div>
      )}
    </AnimatePresence>
  )
}
