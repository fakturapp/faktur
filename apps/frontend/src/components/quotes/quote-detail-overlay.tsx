'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Spinner } from '@/components/ui/spinner'
import { Dropdown, DropdownItem, DropdownSeparator } from '@/components/ui/dropdown'
import { StatusDropdown, quoteStatusOptions } from '@/components/shared/status-dropdown'
import { useToast } from '@/components/ui/toast'
import { api } from '@/lib/api'
import {
  X,
  Send,
  Pencil,
  MoreHorizontal,
  Copy,
  Trash2,
  Download,
  MessageSquare,
  Clock,
} from 'lucide-react'

interface QuoteDetail {
  id: string
  quoteNumber: string
  status: 'draft' | 'sent' | 'accepted' | 'refused' | 'expired'
  subject: string | null
  issueDate: string
  validityDate: string | null
  billingType: 'quick' | 'detailed'
  subtotal: number
  taxAmount: number
  total: number
  notes: string | null
  comment: string | null
  acceptanceConditions: string | null
  client: {
    id: string
    displayName: string
    companyName: string | null
    email: string | null
    phone: string | null
    address: string | null
    postalCode: string | null
    city: string | null
    country: string | null
  } | null
  lines: {
    description: string
    saleType: string | null
    quantity: number
    unit: string | null
    unitPrice: number
    vatRate: number
    total: number
  }[]
}

interface CompanyInfo {
  legalName: string
  addressLine1: string | null
  city: string | null
  postalCode: string | null
  country: string
  phone: string | null
  email: string | null
  siren: string | null
  vatNumber: string | null
}

interface QuoteDetailOverlayProps {
  quoteId: string | null
  onClose: () => void
  onStatusChange: (id: string, newStatus: string) => void
  onDelete: (id: string) => void
}

export function QuoteDetailOverlay({ quoteId, onClose, onStatusChange, onDelete }: QuoteDetailOverlayProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [quote, setQuote] = useState<QuoteDetail | null>(null)
  const [company, setCompany] = useState<CompanyInfo | null>(null)
  const [comment, setComment] = useState('')
  const [savingComment, setSavingComment] = useState(false)
  const [duplicating, setDuplicating] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const commentTimeout = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    if (!quoteId) return
    setLoading(true)
    setQuote(null)

    Promise.all([
      api.get<{ quote: QuoteDetail }>(`/quotes/${quoteId}`),
      api.get<{ company: CompanyInfo }>('/company'),
    ]).then(([qRes, compRes]) => {
      if (qRes.data?.quote) {
        setQuote(qRes.data.quote)
        setComment(qRes.data.quote.comment || '')
      }
      if (compRes.data?.company) setCompany(compRes.data.company as CompanyInfo)
      setLoading(false)
    })
  }, [quoteId])

  const handleCommentChange = useCallback((value: string) => {
    setComment(value)
    if (commentTimeout.current) clearTimeout(commentTimeout.current)
    commentTimeout.current = setTimeout(async () => {
      setSavingComment(true)
      await api.patch(`/quotes/${quoteId}/comment`, { comment: value })
      setSavingComment(false)
    }, 800)
  }, [quoteId])

  function handleStatusUpdate(id: string, newStatus: string) {
    if (quote) setQuote({ ...quote, status: newStatus as QuoteDetail['status'] })
    onStatusChange(id, newStatus)
  }

  function handleSendEmail() {
    if (!quote?.client?.email) {
      toast('Aucun email client renseigne', 'error')
      return
    }
    const subject = encodeURIComponent(`Devis ${quote.quoteNumber}`)
    const body = encodeURIComponent(
      `Bonjour,\n\nVeuillez trouver ci-joint le devis ${quote.quoteNumber} d'un montant de ${Number(quote.total).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}.\n\nCordialement`
    )
    window.open(`mailto:${quote.client.email}?subject=${subject}&body=${body}`, '_blank')
  }

  function handleReminder() {
    if (!quote?.client?.email) {
      toast('Aucun email client renseigne', 'error')
      return
    }
    const subject = encodeURIComponent(`Relance - Devis ${quote.quoteNumber}`)
    const body = encodeURIComponent(
      `Bonjour,\n\nNous vous rappelons que le devis ${quote.quoteNumber} d'un montant de ${Number(quote.total).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })} est en attente de votre retour.\n\nCordialement`
    )
    window.open(`mailto:${quote.client.email}?subject=${subject}&body=${body}`, '_blank')
  }

  async function handleDuplicate() {
    setDuplicating(true)
    const { data, error } = await api.post<{ quote: { id: string; quoteNumber: string } }>(`/quotes/${quoteId}/duplicate`)
    setDuplicating(false)
    if (error) { toast(error, 'error'); return }
    if (data?.quote) {
      toast(`Devis ${data.quote.quoteNumber} cree`, 'success')
      onClose()
      router.push(`/dashboard/quotes/${data.quote.id}/edit`)
    }
  }

  async function handleDelete() {
    if (!quoteId) return
    setDeleting(true)
    const { error } = await api.delete(`/quotes/${quoteId}`)
    setDeleting(false)
    if (error) { toast(error, 'error'); return }
    toast('Devis supprime', 'success')
    onDelete(quoteId)
    onClose()
  }

  async function handleDownloadPdf() {
    setDownloading(true)
    const { blob, filename, error } = await api.downloadBlob(`/quotes/${quoteId}/pdf`)
    setDownloading(false)
    if (error || !blob) { toast(error || 'Erreur', 'error'); return }
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename || 'devis.pdf'
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!quoteId) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50"
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" onClick={onClose} />

        {/* Content */}
        <div className="relative z-10 flex h-full items-stretch justify-center p-6">
          {/* Preview area */}
          <div className="flex-1 flex items-start justify-end pr-4 pt-4 overflow-auto">
            {loading ? (
              <div className="w-[600px] bg-white rounded-lg shadow-xl p-8 flex items-center justify-center" style={{ minHeight: 800 }}>
                <Spinner size="lg" />
              </div>
            ) : quote ? (
              <div
                className="w-[600px] bg-white text-[#334155] rounded-lg shadow-xl origin-top-right"
                style={{ transform: 'scale(0.82)', minHeight: 800, padding: '40px' }}
              >
                {/* Company + Client */}
                <div className="flex justify-between mb-8">
                  <div className="max-w-[260px]">
                    <p className="font-bold text-sm">{company?.legalName || 'Votre entreprise'}</p>
                    {company?.addressLine1 && <p className="text-xs text-[#64748b]">{company.addressLine1}</p>}
                    {company?.postalCode && company?.city && <p className="text-xs text-[#64748b]">{company.postalCode} {company.city}</p>}
                    {company?.phone && <p className="text-xs text-[#64748b]">{company.phone}</p>}
                    {company?.email && <p className="text-xs text-[#64748b]">{company.email}</p>}
                    {company?.siren && <p className="text-xs text-[#64748b]">SIREN : {company.siren}</p>}
                  </div>
                  <div className="max-w-[220px] pt-12">
                    {quote.client && (
                      <>
                        <p className="font-bold text-sm">{quote.client.displayName}</p>
                        {quote.client.address && <p className="text-xs text-[#64748b]">{quote.client.address}</p>}
                        {quote.client.postalCode && quote.client.city && (
                          <p className="text-xs text-[#64748b]">{quote.client.postalCode} {quote.client.city}</p>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Metadata */}
                <div className="flex justify-between mb-6">
                  <p className="font-bold text-sm">{quote.quoteNumber}</p>
                  <div className="text-right text-xs text-[#64748b]">
                    <p>Emission : {new Date(quote.issueDate).toLocaleDateString('fr-FR')}</p>
                    {quote.validityDate && <p>Validite : {new Date(quote.validityDate).toLocaleDateString('fr-FR')}</p>}
                  </div>
                </div>

                {quote.subject && <p className="text-xs text-[#64748b] mb-4">Objet : {quote.subject}</p>}

                {/* Lines table */}
                <div className="mb-6">
                  <div className="flex bg-indigo-500 text-white text-[10px] font-bold rounded-t">
                    <div className="flex-1 px-2 py-1.5">Designation</div>
                    {quote.billingType === 'detailed' && (
                      <>
                        <div className="w-12 px-2 py-1.5 text-center">Qte</div>
                        <div className="w-16 px-2 py-1.5 text-right">P.U.</div>
                        <div className="w-12 px-2 py-1.5 text-center">TVA</div>
                      </>
                    )}
                    <div className="w-20 px-2 py-1.5 text-right">Montant</div>
                  </div>
                  {quote.lines.filter(l => l.saleType !== 'section').map((line, i) => (
                    <div key={i} className="flex text-[11px] border-b border-[#e2e8f0]">
                      <div className="flex-1 px-2 py-1.5 truncate">{line.description}</div>
                      {quote.billingType === 'detailed' && (
                        <>
                          <div className="w-12 px-2 py-1.5 text-center">{line.quantity}</div>
                          <div className="w-16 px-2 py-1.5 text-right">{Number(line.unitPrice).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</div>
                          <div className="w-12 px-2 py-1.5 text-center">{line.vatRate}%</div>
                        </>
                      )}
                      <div className="w-20 px-2 py-1.5 text-right">{Number(line.total).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</div>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="flex justify-end mb-8">
                  <div className="w-56">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-[#64748b]">Total HT</span>
                      <span className="font-semibold">{Number(quote.subtotal).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</span>
                    </div>
                    {quote.taxAmount > 0 && (
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-[#64748b]">TVA</span>
                        <span>{Number(quote.taxAmount).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-bold mt-2 pt-2 border-t border-[#e2e8f0]">
                      <span>Total TTC</span>
                      <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full text-xs font-bold">
                        {Number(quote.total).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                {quote.acceptanceConditions && (
                  <div className="text-[10px] text-[#94a3b8] mt-auto pt-4 border-t border-[#e2e8f0]">
                    <p>{quote.acceptanceConditions}</p>
                  </div>
                )}

                {company?.vatNumber && (
                  <div className="text-[10px] text-[#94a3b8] mt-2">
                    <p>N. TVA : {company.vatNumber}</p>
                  </div>
                )}
              </div>
            ) : null}

            {/* Download button */}
            {!loading && (
              <button
                onClick={handleDownloadPdf}
                disabled={downloading}
                className="ml-3 mt-2 h-9 w-9 rounded-full bg-card shadow-lg flex items-center justify-center text-muted-foreground hover:text-primary transition-colors shrink-0 border border-border"
              >
                <Download className={`h-4 w-4 ${downloading ? 'animate-pulse' : ''}`} />
              </button>
            )}
          </div>

          {/* Side panel */}
          <motion.div
            initial={{ x: 320 }}
            animate={{ x: 0 }}
            exit={{ x: 320 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="w-[320px] shrink-0 bg-card border-l border-border flex flex-col overflow-hidden"
          >
            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <Spinner size="lg" />
              </div>
            ) : quote ? (
              <>
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                  <h3 className="text-lg font-bold text-foreground">{quote.quoteNumber}</h3>
                  <button
                    onClick={onClose}
                    className="h-7 w-7 rounded-full bg-card shadow flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors border border-border"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="flex-1 overflow-auto">
                  {/* Status */}
                  <div className="px-5 py-4 border-b border-border">
                    <StatusDropdown
                      id={quote.id}
                      currentStatus={quote.status}
                      options={quoteStatusOptions}
                      endpoint="quotes"
                      onStatusChange={handleStatusUpdate}
                      fullWidth
                    />
                  </div>

                  {/* Expiry notice for expired quotes */}
                  {quote.status === 'expired' && (
                    <div className="px-5 py-4 border-b border-border">
                      <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Clock className="h-4 w-4 text-amber-500" />
                          <span className="text-sm font-bold text-amber-500">Expire</span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Ce devis a depasse sa date de validite. Vous pouvez le dupliquer pour en creer un nouveau.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Client */}
                  <div className="px-5 py-4 border-b border-border">
                    {quote.client ? (
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                          {quote.client.displayName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{quote.client.displayName}</p>
                          {quote.client.email && <p className="text-xs text-muted-foreground truncate">{quote.client.email}</p>}
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Aucun client</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="px-5 py-4 border-b border-border space-y-1">
                    <button
                      onClick={handleSendEmail}
                      disabled={!quote.client?.email}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-muted/50 transition-colors disabled:opacity-40 disabled:cursor-default"
                    >
                      <Send className="h-4 w-4" /> Envoyer le devis
                    </button>
                    <button
                      onClick={handleReminder}
                      disabled={!quote.client?.email}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-muted/50 transition-colors disabled:opacity-40 disabled:cursor-default"
                    >
                      <Send className="h-4 w-4" /> Relancer le client
                    </button>
                    <button
                      onClick={() => { onClose(); router.push(`/dashboard/quotes/${quote.id}/edit`) }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
                    >
                      <Pencil className="h-4 w-4" /> Modifier
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
                      <DropdownItem destructive onClick={handleDelete}>
                        {deleting ? <Spinner /> : <Trash2 className="h-4 w-4" />} Supprimer
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
      </motion.div>
    </AnimatePresence>
  )
}
