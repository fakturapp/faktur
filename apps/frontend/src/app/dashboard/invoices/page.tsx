'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, type Variants } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/lib/api'
import { useToast } from '@/components/ui/toast'
import {
  Plus,
  Search,
  FileText,
  Clock,
  CheckCircle2,
  ChevronRight,
  Send,
  XCircle,
  Download,
  Ban,
} from 'lucide-react'
import { CreateInvoiceModal } from '@/components/invoices/create-invoice-modal'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
} satisfies Variants

interface InvoiceListItem {
  id: string
  invoiceNumber: string
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  subject: string | null
  issueDate: string
  dueDate: string | null
  subtotal: number
  taxAmount: number
  total: number
  clientName: string | null
  clientId: string | null
  sourceQuoteId: string | null
  createdAt: string
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  draft: { label: 'Brouillon', color: 'text-zinc-400', bgColor: 'bg-zinc-400/10' },
  sent: { label: 'Envoyee', color: 'text-blue-400', bgColor: 'bg-blue-400/10' },
  paid: { label: 'Payee', color: 'text-green-400', bgColor: 'bg-green-400/10' },
  overdue: { label: 'En retard', color: 'text-red-400', bgColor: 'bg-red-400/10' },
  cancelled: { label: 'Annulee', color: 'text-orange-400', bgColor: 'bg-orange-400/10' },
}

export default function InvoicesPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [invoices, setInvoices] = useState<InvoiceListItem[]>([])
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

  async function handleDownloadPdf(e: React.MouseEvent, invoiceId: string) {
    e.preventDefault()
    e.stopPropagation()
    setDownloadingId(invoiceId)
    const { blob, filename, error } = await api.downloadBlob(`/invoices/${invoiceId}/pdf`)
    setDownloadingId(null)
    if (error || !blob) {
      toast(error || 'Erreur lors du telechargement', 'error')
      return
    }
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename || 'facture.pdf'
    a.click()
    URL.revokeObjectURL(url)
  }

  useEffect(() => {
    loadInvoices()
  }, [])

  async function loadInvoices() {
    setLoading(true)
    const { data } = await api.get<{ invoices: InvoiceListItem[] }>('/invoices')
    if (data?.invoices) {
      setInvoices(data.invoices)
    }
    setLoading(false)
  }

  const filtered = invoices.filter((inv) => {
    const matchesSearch =
      !search ||
      inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      inv.subject?.toLowerCase().includes(search.toLowerCase()) ||
      inv.clientName?.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = filterStatus === 'all' || inv.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const totalAmount = invoices.reduce((sum, inv) => sum + Number(inv.total), 0)
  const pendingCount = invoices.filter((inv) => inv.status === 'sent').length
  const paidCount = invoices.filter((inv) => inv.status === 'paid').length

  return (
    <motion.div initial="hidden" animate="visible" className="space-y-6 px-4 lg:px-6 py-4 md:py-6">
      {/* Header */}
      <motion.div variants={fadeUp} custom={0} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Factures</h1>
          <p className="text-muted-foreground mt-1">
            {invoices.length} facture{invoices.length > 1 ? 's' : ''} au total
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-1.5" /> Creer une facture
        </Button>
      </motion.div>

      {/* Stats */}
      <motion.div variants={fadeUp} custom={1} className="grid grid-cols-1 gap-4 @xl/main:grid-cols-3">
        <div className="rounded-xl border border-border bg-card/50 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <FileText className="h-4.5 w-4.5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {totalAmount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
              </p>
              <p className="text-xs text-muted-foreground">Montant total</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card/50 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10">
              <Clock className="h-4.5 w-4.5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{pendingCount}</p>
              <p className="text-xs text-muted-foreground">En attente</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card/50 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-500/10">
              <CheckCircle2 className="h-4.5 w-4.5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{paidCount}</p>
              <p className="text-xs text-muted-foreground">Payees</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Search + filter */}
      <motion.div variants={fadeUp} custom={2} className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher une facture..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex rounded-lg border border-border bg-muted/30 p-0.5">
          {[
            { id: 'all', label: 'Tous' },
            { id: 'draft', label: 'Brouillon' },
            { id: 'sent', label: 'Envoyee' },
            { id: 'paid', label: 'Payee' },
            { id: 'overdue', label: 'En retard' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterStatus(f.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                filterStatus === f.id
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Invoices list */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 rounded-xl border border-border bg-card/50 p-4">
              <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16 rounded-full" />
                </div>
                <div className="flex items-center gap-4">
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              <div className="text-right space-y-1.5 shrink-0">
                <Skeleton className="h-4 w-20 ml-auto" />
                <Skeleton className="h-3 w-8 ml-auto" />
              </div>
              <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
              <Skeleton className="h-4 w-4 shrink-0" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div variants={fadeUp} custom={3} className="text-center py-16">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50 mx-auto mb-4">
            <FileText className="h-8 w-8 text-muted-foreground/50" />
          </div>
          <p className="text-lg font-medium text-foreground">
            {search || filterStatus !== 'all' ? 'Aucun resultat' : 'Aucune facture'}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {search || filterStatus !== 'all'
              ? 'Essayez avec d\'autres criteres de recherche'
              : 'Commencez par creer votre premiere facture'}
          </p>
          {!search && filterStatus === 'all' && (
            <Button className="mt-4" onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-1.5" /> Creer une facture
            </Button>
          )}
        </motion.div>
      ) : (
        <div className="space-y-2">
          {filtered.map((invoice, i) => {
            const cfg = statusConfig[invoice.status]
            return (
              <motion.div key={invoice.id} variants={fadeUp} custom={3 + i * 0.3}>
                <Link
                  href={`/dashboard/invoices/${invoice.id}/edit`}
                  className="w-full flex items-center gap-4 rounded-xl border border-border bg-card/50 hover:bg-card/80 p-4 transition-colors text-left group"
                >
                  {/* Icon */}
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    {invoice.status === 'draft' && <FileText className="h-5 w-5 text-zinc-400" />}
                    {invoice.status === 'sent' && <Send className="h-5 w-5 text-blue-400" />}
                    {invoice.status === 'paid' && <CheckCircle2 className="h-5 w-5 text-green-400" />}
                    {invoice.status === 'overdue' && <Clock className="h-5 w-5 text-red-400" />}
                    {invoice.status === 'cancelled' && <Ban className="h-5 w-5 text-orange-400" />}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {invoice.invoiceNumber}
                      </p>
                      <Badge variant="muted" className={`text-[10px] shrink-0 ${cfg.color} ${cfg.bgColor}`}>
                        {cfg.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {invoice.clientName && (
                        <span className="truncate">{invoice.clientName}</span>
                      )}
                      {invoice.subject && (
                        <span className="truncate">{invoice.subject}</span>
                      )}
                      <span className="shrink-0">
                        {new Date(invoice.issueDate).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="text-right shrink-0">
                    <p className="text-sm font-medium text-foreground">
                      {Number(invoice.total).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                    </p>
                    <p className="text-xs text-muted-foreground">TTC</p>
                  </div>

                  {/* PDF download */}
                  <button
                    onClick={(e) => handleDownloadPdf(e, invoice.id)}
                    disabled={downloadingId === invoice.id}
                    className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors shrink-0"
                    title="Telecharger le PDF"
                  >
                    <Download className={`h-4 w-4 ${downloadingId === invoice.id ? 'animate-pulse' : ''}`} />
                  </button>

                  <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors shrink-0" />
                </Link>
              </motion.div>
            )
          })}
        </div>
      )}

      <CreateInvoiceModal open={showCreateModal} onClose={() => setShowCreateModal(false)} />
    </motion.div>
  )
}
