'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Spinner } from '@/components/ui/spinner'
import { Button } from '@/components/ui/button'
import { Dropdown, DropdownItem, DropdownSeparator } from '@/components/ui/dropdown'
import { Dialog, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { StatusDropdown, creditNoteStatusOptions } from '@/components/shared/status-dropdown'
import { useToast } from '@/components/ui/toast'
import { useInvoiceSettings } from '@/lib/invoice-settings-context'
import { api } from '@/lib/api'
import { A4Sheet, type DocumentLine, type ClientInfo, type CompanyInfo } from '@/components/shared/a4-sheet'
import { SendEmailModal } from '@/components/shared/send-email-modal'
import { EmailHistoryModal } from '@/components/shared/email-history-modal'
import { useEmail } from '@/lib/email-context'
import {
  X,
  Pencil,
  MoreHorizontal,
  Copy,
  Trash2,
  Download,
  Printer,
  MessageSquare,
  FileText,
  Send,
  Mail,
} from 'lucide-react'

interface CreditNoteDetail {
  id: string
  creditNoteNumber: string
  status: 'draft' | 'sent' | 'finalized'
  reason: string | null
  subject: string | null
  issueDate: string
  billingType: 'quick' | 'detailed'
  accentColor: string | null
  logoUrl: string | null
  language: string | null
  subtotal: number
  taxAmount: number
  total: number
  notes: string | null
  comment: string | null
  sourceInvoiceId: string | null
  sourceInvoice: { id: string; invoiceNumber: string } | null
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

interface CreditNoteDetailOverlayProps {
  creditNoteId: string | null
  onClose: () => void
  onStatusChange: (id: string, newStatus: string) => void
  onDelete: (id: string) => void
}

const noop = () => {}

export function CreditNoteDetailOverlay({ creditNoteId, onClose, onStatusChange, onDelete }: CreditNoteDetailOverlayProps) {
  const router = useRouter()
  const { toast } = useToast()
  const { settings: invoiceSettings, companyLogoUrl } = useInvoiceSettings()
  const { hasEmailConfigured } = useEmail()
  const [loading, setLoading] = useState(true)
  const [creditNote, setCreditNote] = useState<CreditNoteDetail | null>(null)
  const [company, setCompany] = useState<CompanyInfo | null>(null)
  const [comment, setComment] = useState('')
  const [savingComment, setSavingComment] = useState(false)
  const [duplicating, setDuplicating] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [printing, setPrinting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showSendEmail, setShowSendEmail] = useState(false)
  const [showEmailHistory, setShowEmailHistory] = useState(false)
  const commentTimeout = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    if (!creditNoteId) return
    setLoading(true)
    setCreditNote(null)

    Promise.all([
      api.get<{ creditNote: CreditNoteDetail }>(`/credit-notes/${creditNoteId}`),
      api.get<{ company: CompanyInfo }>('/company'),
    ]).then(([cnRes, compRes]) => {
      if (cnRes.data?.creditNote) {
        setCreditNote(cnRes.data.creditNote)
        setComment(cnRes.data.creditNote.comment || '')
      }
      if (compRes.data?.company) setCompany(compRes.data.company as CompanyInfo)
      setLoading(false)
    })
  }, [creditNoteId])

  const sheetLines: DocumentLine[] = useMemo(() => {
    if (!creditNote?.lines) return []
    return creditNote.lines.map((l) => ({
      id: l.id || Math.random().toString(36).slice(2),
      type: (l.saleType === 'section' ? 'section' : 'standard') as 'standard' | 'section',
      description: l.description || '',
      saleType: l.saleType === 'section' ? '' : l.saleType || '',
      quantity: l.quantity || 1,
      unit: l.unit || '',
      unitPrice: l.unitPrice || 0,
      vatRate: l.vatRate || 0,
    }))
  }, [creditNote?.lines])

  const { subtotal, taxAmount, discountAmount, total, tvaBreakdown } = useMemo(() => {
    if (!creditNote) return { subtotal: 0, taxAmount: 0, discountAmount: 0, total: 0, tvaBreakdown: [] }
    const billingType = creditNote.billingType
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
    const discType = creditNote.globalDiscountType || 'none'
    const discVal = creditNote.globalDiscountValue || 0
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
  }, [creditNote, sheetLines])

  const handleCommentChange = useCallback((value: string) => {
    setComment(value)
    if (commentTimeout.current) clearTimeout(commentTimeout.current)
    commentTimeout.current = setTimeout(async () => {
      setSavingComment(true)
      await api.patch(`/credit-notes/${creditNoteId}/comment`, { comment: value })
      setSavingComment(false)
    }, 800)
  }, [creditNoteId])

  function handleStatusUpdate(id: string, newStatus: string) {
    if (creditNote) setCreditNote({ ...creditNote, status: newStatus as CreditNoteDetail['status'] })
    onStatusChange(id, newStatus)
  }

  async function handleDuplicate() {
    setDuplicating(true)
    const { data, error } = await api.post<{ creditNote: { id: string; creditNoteNumber: string } }>(`/credit-notes/${creditNoteId}/duplicate`, {})
    setDuplicating(false)
    if (error) { toast(error, 'error'); return }
    if (data?.creditNote) {
      toast(`Avoir ${data.creditNote.creditNoteNumber} créé`, 'success')
      onClose()
      router.push(`/dashboard/credit-notes/${data.creditNote.id}/edit`)
    }
  }

  async function handleDelete() {
    if (!creditNoteId) return
    setDeleting(true)
    const { error } = await api.delete(`/credit-notes/${creditNoteId}`)
    setDeleting(false)
    if (error) { toast(error, 'error'); return }
    toast('Avoir supprimé', 'success')
    setShowDeleteConfirm(false)
    onDelete(creditNoteId)
    onClose()
  }

  async function handleDownloadPdf() {
    if (!creditNote) return
    setDownloading(true)
    const { blob, filename, error } = await api.downloadBlob(`/credit-notes/${creditNote.id}/pdf`)
    setDownloading(false)
    if (error || !blob) { toast(error || 'Erreur', 'error'); return }
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename || `${creditNote.creditNoteNumber}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handlePrint() {
    if (!creditNote) return
    setPrinting(true)
    const { blob, error } = await api.downloadBlob(`/credit-notes/${creditNote.id}/pdf`)
    setPrinting(false)
    if (error || !blob) { toast(error || 'Erreur', 'error'); return }
    const url = URL.createObjectURL(blob)
    const w = window.open(url)
    if (w) { w.onload = () => w.print() }
  }

  function handleSendEmail() {
    setShowSendEmail(true)
  }

  function handleEmailSent() {
    if (creditNote && creditNote.status === 'draft') {
      setCreditNote({ ...creditNote, status: 'sent' })
      onStatusChange(creditNote.id, 'sent')
    }
  }

  const effectiveLogoUrl = invoiceSettings.logoSource === 'company' ? companyLogoUrl : (invoiceSettings.logoUrl || creditNote?.logoUrl || null)

  return (
    <AnimatePresence>
      {creditNoteId && (
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
          {/* Preview area */}
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
            ) : creditNote ? (
              <div className="w-full max-w-[700px] shrink-0">
                <A4Sheet
                  mode="preview"
                  logoUrl={effectiveLogoUrl}
                  accentColor={creditNote.accentColor || '#6366f1'}
                  documentTitle={creditNote.documentTitle || 'Avoir'}
                  documentType="credit_note"
                  quoteNumber={creditNote.creditNoteNumber}
                  onQuoteNumberChange={noop}
                  issueDate={creditNote.issueDate || ''}
                  validityDate=""
                  billingType={creditNote.billingType}
                  company={company}
                  onCompanyFieldChange={noop}
                  client={creditNote.client}
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
                  notes={creditNote.notes || ''}
                  onNotesChange={noop}
                  acceptanceConditions={creditNote.acceptanceConditions || ''}
                  signatureField={creditNote.signatureField}
                  freeField={creditNote.freeField || ''}
                  deliveryAddress={creditNote.deliveryAddress || ''}
                  showDeliveryAddress={!!creditNote.deliveryAddress}
                  clientSiren={creditNote.clientSiren || ''}
                  showClientSiren={!!creditNote.clientSiren}
                  clientVatNumber={creditNote.clientVatNumber || ''}
                  showClientVatNumber={!!creditNote.clientVatNumber}
                  paymentMethods={[]}
                  customPaymentMethod=""
                  subject={creditNote.subject || ''}
                  onSubjectChange={noop}
                  template={invoiceSettings.template}
                  darkMode={invoiceSettings.darkMode}
                  language={creditNote.language || 'fr'}
                  showNotes={!!creditNote.notes}
                  showSubject={!!creditNote.subject}
                  showAcceptanceConditions={!!creditNote.acceptanceConditions}
                  showFreeField={!!creditNote.freeField}
                  footerMode={invoiceSettings.footerMode}
                  documentFont={invoiceSettings.documentFont}
                  vatExemptReason={creditNote.vatExemptReason || 'none'}
                />
                <div className="flex justify-center gap-2 mt-3">
                  <button
                    onClick={handleDownloadPdf}
                    disabled={downloading}
                    className="h-9 px-4 rounded-full bg-card shadow-lg flex items-center gap-2 text-sm font-medium transition-colors border border-border"
                  >
                    {downloading ? <Spinner className="h-4 w-4" /> : <Download className="h-4 w-4 text-muted-foreground" />}
                    <span className="text-foreground">{downloading ? 'Téléchargement...' : 'Télécharger'}</span>
                  </button>
                  <button
                    onClick={handlePrint}
                    disabled={printing}
                    className="h-9 px-4 rounded-full bg-card shadow-lg flex items-center gap-2 text-sm font-medium transition-colors border border-border"
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
            className="w-[320px] shrink-0 bg-card border-l border-border flex flex-col overflow-hidden rounded-l-2xl"
          >
            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <Spinner size="lg" />
              </div>
            ) : creditNote ? (
              <>
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                  <h3 className="text-lg font-bold text-foreground">{creditNote.creditNoteNumber}</h3>
                  <button
                    onClick={onClose}
                    className="h-7 w-7 rounded-full bg-card shadow flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors border border-border"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="flex-1 overflow-auto">
                  {/* Actions */}
                  <div className="px-5 pt-4 pb-2 space-y-2">
                    <Button
                      className="w-full h-11 text-sm font-semibold gap-2"
                      disabled={creditNote.status === 'finalized'}
                      onClick={() => { onClose(); router.push(`/dashboard/credit-notes/${creditNote.id}/edit`) }}
                    >
                      <Pencil className="h-4 w-4" />
                      Modifier l&apos;avoir
                    </Button>
                    {hasEmailConfigured && (
                      <Button
                        variant="outline"
                        className="w-full h-11 text-sm font-semibold gap-2"
                        onClick={handleSendEmail}
                      >
                        <Send className="h-4 w-4" />
                        Envoyer par email
                      </Button>
                    )}
                  </div>

                  {/* Status */}
                  <div className="px-5 py-3 border-b border-border">
                    <StatusDropdown
                      id={creditNote.id}
                      currentStatus={creditNote.status}
                      options={creditNoteStatusOptions}
                      endpoint="credit-notes"
                      onStatusChange={handleStatusUpdate}
                      fullWidth
                    />
                  </div>

                  {/* Source invoice */}
                  {creditNote.sourceInvoice && (
                    <div className="px-5 py-4 border-b border-border">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Facture d&apos;origine</span>
                      </div>
                      <button
                        onClick={() => { onClose(); router.push(`/dashboard/invoices`) }}
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        {creditNote.sourceInvoice.invoiceNumber}
                      </button>
                    </div>
                  )}

                  {/* Client */}
                  <div className="px-5 py-4 border-b border-border">
                    {creditNote.client ? (
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                          {creditNote.client.displayName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{creditNote.client.displayName}</p>
                          {creditNote.client.email && <p className="text-xs text-muted-foreground truncate">{creditNote.client.email}</p>}
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Aucun client</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="px-5 py-4 border-b border-border space-y-1">
                    <Dropdown
                      align="left"
                      trigger={
                        <button className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-full bg-card shadow-sm text-sm font-semibold text-muted-foreground border border-border hover:text-foreground transition-colors">
                          <MoreHorizontal className="h-4 w-4" /> Plus d&apos;actions
                        </button>
                      }
                      className="min-w-[200px]"
                    >
                      <DropdownItem onClick={() => setShowEmailHistory(true)}>
                        <Mail className="h-4 w-4" /> Historique emails
                      </DropdownItem>
                      <DropdownSeparator />
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

        {/* Delete confirmation */}
        <Dialog open={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} className="max-w-sm">
          <DialogTitle>Supprimer l&apos;avoir</DialogTitle>
          <DialogDescription>
            Êtes-vous sûr de vouloir supprimer l&apos;avoir {creditNote?.creditNoteNumber} ? Cette action est irréversible.
          </DialogDescription>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowDeleteConfirm(false)}>Annuler</Button>
            <Button variant="destructive" size="sm" disabled={deleting} onClick={handleDelete}>
              {deleting ? <Spinner className="h-3.5 w-3.5" /> : <Trash2 className="h-3.5 w-3.5 mr-1" />}
              Supprimer
            </Button>
          </DialogFooter>
        </Dialog>

        {creditNote && (
          <>
            <SendEmailModal
              open={showSendEmail}
              onClose={() => setShowSendEmail(false)}
              documentType="credit_note"
              documentId={creditNote.id}
              documentNumber={creditNote.creditNoteNumber}
              clientEmail={creditNote.client?.email || null}
              clientName={creditNote.client?.displayName || null}
              total={creditNote.total}
              onSent={handleEmailSent}
            />
            <EmailHistoryModal
              open={showEmailHistory}
              onClose={() => setShowEmailHistory(false)}
              documentType="credit_note"
              documentId={creditNote.id}
              documentNumber={creditNote.creditNoteNumber}
            />
          </>
        )}
      </motion.div>
      )}
    </AnimatePresence>
  )
}
