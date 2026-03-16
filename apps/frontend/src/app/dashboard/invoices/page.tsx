'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { motion, type Variants } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Pagination } from '@/components/ui/pagination'
import { api } from '@/lib/api'
import { useToast } from '@/components/ui/toast'
import { StatusDropdown, invoiceStatusOptions } from '@/components/shared/status-dropdown'
import {
  Plus,
  Search,
  FileText,
  Clock,
  CheckCircle2,
  ChevronRight,
  Send,
  Download,
  Ban,
  TrendingUp,
  CalendarDays,
} from 'lucide-react'
import { CreateInvoiceModal } from '@/components/invoices/create-invoice-modal'
import { InvoiceDetailOverlay } from '@/components/invoices/invoice-detail-overlay'

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

interface PaginationMeta {
  total: number
  perPage: number
  currentPage: number
  lastPage: number
}

export default function InvoicesPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [invoices, setInvoices] = useState<InvoiceListItem[]>([])
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState<PaginationMeta | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null)
  const [monthlyStats, setMonthlyStats] = useState<{ totalInvoiced: number; totalCollected: number; trend: number } | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(value)
      setPage(1)
    }, 300)
  }, [])

  async function handleDownloadPdf(e: React.MouseEvent, invoiceId: string) {
    e.preventDefault()
    e.stopPropagation()
    setDownloadingId(invoiceId)
    const { blob, filename, error } = await api.downloadBlob(`/invoices/${invoiceId}/pdf`)
    setDownloadingId(null)
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

  useEffect(() => {
    api.get<{ stats: { totalInvoiced: { value: number; trend: number }; totalCollected: { value: number } } }>('/dashboard/stats').then(({ data }) => {
      if (data?.stats) {
        setMonthlyStats({
          totalInvoiced: data.stats.totalInvoiced.value,
          totalCollected: data.stats.totalCollected.value,
          trend: data.stats.totalInvoiced.trend,
        })
      }
    })
  }, [])

  useEffect(() => {
    loadInvoices()
  }, [page, debouncedSearch, filterStatus])

  async function loadInvoices() {
    setLoading(true)
    const params = new URLSearchParams()
    params.set('page', String(page))
    params.set('perPage', '20')
    if (debouncedSearch) params.set('search', debouncedSearch)
    if (filterStatus !== 'all') params.set('status', filterStatus)

    const { data } = await api.get<{ invoices: InvoiceListItem[]; meta: PaginationMeta }>(`/invoices?${params}`)
    if (data) {
      setInvoices(data.invoices)
      setMeta(data.meta)
    }
    setLoading(false)
  }

  const currentMonth = useMemo(() => {
    const now = new Date()
    return now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }).replace(/^\w/, (c) => c.toUpperCase())
  }, [])

  const monthInvoiceCount = useMemo(() => {
    const now = new Date()
    const y = now.getFullYear()
    const m = now.getMonth()
    return invoices.filter((inv) => {
      const d = new Date(inv.issueDate)
      return d.getFullYear() === y && d.getMonth() === m
    }).length
  }, [invoices])

  function handleStatusChange(id: string, newStatus: string) {
    setInvoices((prev) => prev.map((inv) => (inv.id === id ? { ...inv, status: newStatus as InvoiceListItem['status'] } : inv)))
  }

  function handleFilterChange(status: string) {
    setFilterStatus(status)
    setPage(1)
  }

  function handleDeleteFromOverlay(id: string) {
    setInvoices((prev) => prev.filter((inv) => inv.id !== id))
    if (meta) setMeta({ ...meta, total: meta.total - 1 })
  }

  return (
    <motion.div initial="hidden" animate="visible" className="space-y-6 px-4 lg:px-6 py-4 md:py-6">
      {/* Header */}
      <motion.div variants={fadeUp} custom={0} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Factures</h1>
          <p className="text-muted-foreground mt-1">
            {meta?.total ?? 0} facture{(meta?.total ?? 0) > 1 ? 's' : ''} au total
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-1.5" /> Créer une facture
        </Button>
      </motion.div>

      {/* Monthly summary */}
      {monthlyStats && (
        <motion.div variants={fadeUp} custom={0.5} className="rounded-2xl border border-border bg-card/50 p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <CalendarDays className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{currentMonth}</span>
              </div>
              <p className="text-3xl font-bold text-foreground">
                {monthlyStats.totalInvoiced.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
              </p>
              <p className="text-xs text-muted-foreground mt-1">facturé ce mois</p>
            </div>
            <div className="text-right space-y-2">
              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-500/10 text-green-500 text-xs font-semibold">
                <TrendingUp className="h-3 w-3" />
                {monthlyStats.trend > 0 ? '+' : ''}{monthlyStats.trend}%
              </div>
              <div>
                <p className="text-lg font-bold text-green-500">
                  {monthlyStats.totalCollected.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                </p>
                <p className="text-xs text-muted-foreground">encaissé</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Search + filter */}
      <motion.div variants={fadeUp} custom={1} className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher une facture..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex rounded-lg border border-border bg-muted/30 p-0.5">
          {[
            { id: 'all', label: 'Tous' },
            { id: 'draft', label: 'Brouillon' },
            { id: 'sent', label: 'Envoyée' },
            { id: 'paid', label: 'Payée' },
            { id: 'overdue', label: 'En retard' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => handleFilterChange(f.id)}
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
      ) : invoices.length === 0 ? (
        <motion.div variants={fadeUp} custom={2} className="text-center py-16">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50 mx-auto mb-4">
            <FileText className="h-8 w-8 text-muted-foreground/50" />
          </div>
          <p className="text-lg font-medium text-foreground">
            {debouncedSearch || filterStatus !== 'all' ? 'Aucun resultat' : 'Aucune facture'}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {debouncedSearch || filterStatus !== 'all'
              ? 'Essayez avec d\'autres criteres de recherche'
              : 'Commencez par créer votre première facture'}
          </p>
          {!debouncedSearch && filterStatus === 'all' && (
            <Button className="mt-4" onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-1.5" /> Créer une facture
            </Button>
          )}
        </motion.div>
      ) : (
        <div className="space-y-2">
          {invoices.map((invoice, i) => {
            return (
              <motion.div key={invoice.id} variants={fadeUp} custom={2 + i * 0.3}>
                <div
                  onClick={() => setSelectedInvoiceId(invoice.id)}
                  className="w-full flex items-center gap-4 rounded-xl border border-border bg-card/50 hover:bg-card/80 p-4 transition-colors text-left group cursor-pointer"
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
                      <StatusDropdown
                        id={invoice.id}
                        currentStatus={invoice.status}
                        options={invoiceStatusOptions}
                        endpoint="invoices"
                        onStatusChange={handleStatusChange}
                      />
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
                    className={`h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors shrink-0 ${downloadingId === invoice.id ? 'download-shimmer' : ''}`}
                    title="Télécharger le PDF"
                  >
                    <Download className="h-4 w-4" />
                  </button>

                  <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors shrink-0" />
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      <Pagination meta={meta} onPageChange={setPage} />

      <CreateInvoiceModal open={showCreateModal} onClose={() => setShowCreateModal(false)} />

      <InvoiceDetailOverlay
        invoiceId={selectedInvoiceId}
        onClose={() => setSelectedInvoiceId(null)}
        onStatusChange={handleStatusChange}
        onDelete={handleDeleteFromOverlay}
      />
    </motion.div>
  )
}
