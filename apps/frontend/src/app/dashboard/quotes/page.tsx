'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { motion, type Variants } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Pagination } from '@/components/ui/pagination'
import { api } from '@/lib/api'
import { useToast } from '@/components/ui/toast'
import { StatusDropdown, quoteStatusOptions } from '@/components/shared/status-dropdown'
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
  CalendarDays,
  TrendingUp,
} from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'
import { QuoteDetailOverlay } from '@/components/quotes/quote-detail-overlay'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
} satisfies Variants

interface QuoteListItem {
  id: string
  quoteNumber: string
  status: 'draft' | 'sent' | 'accepted' | 'refused' | 'expired'
  subject: string | null
  issueDate: string
  validityDate: string | null
  subtotal: number
  taxAmount: number
  total: number
  clientName: string | null
  clientId: string | null
  createdAt: string
}

interface PaginationMeta {
  total: number
  perPage: number
  currentPage: number
  lastPage: number
}

export default function QuotesPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [quotes, setQuotes] = useState<QuoteListItem[]>([])
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState<PaginationMeta | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null)
  const [monthlyStats, setMonthlyStats] = useState<{ totalQuoted: number; totalAccepted: number; trend: number } | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(value)
      setPage(1)
    }, 300)
  }, [])

  async function handleDownloadPdf(e: React.MouseEvent, quoteId: string) {
    e.preventDefault()
    e.stopPropagation()
    setDownloadingId(quoteId)
    const { blob, filename, error } = await api.downloadBlob(`/quotes/${quoteId}/pdf`)
    setDownloadingId(null)
    if (error || !blob) {
      toast(error || 'Erreur lors du téléchargement', 'error')
      return
    }
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename || 'devis.pdf'
    a.click()
    URL.revokeObjectURL(url)
  }

  useEffect(() => {
    api.get<{ stats: { totalQuoted: { value: number; trend: number }; totalAccepted: { value: number } } }>('/dashboard/stats').then(({ data }) => {
      if (data?.stats) {
        setMonthlyStats({
          totalQuoted: data.stats.totalQuoted.value,
          totalAccepted: data.stats.totalAccepted.value,
          trend: data.stats.totalQuoted.trend,
        })
      }
    })
  }, [])

  useEffect(() => {
    loadQuotes()
  }, [page, debouncedSearch, filterStatus])

  async function loadQuotes() {
    setLoading(true)
    const params = new URLSearchParams()
    params.set('page', String(page))
    params.set('perPage', '20')
    if (debouncedSearch) params.set('search', debouncedSearch)
    if (filterStatus !== 'all') params.set('status', filterStatus)

    const { data } = await api.get<{ quotes: QuoteListItem[]; meta: PaginationMeta }>(`/quotes?${params}`)
    if (data) {
      setQuotes(data.quotes)
      setMeta(data.meta)
    }
    setLoading(false)
  }

  const currentMonth = useMemo(() => {
    const now = new Date()
    return now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }).replace(/^\w/, (c) => c.toUpperCase())
  }, [])

  const groupedQuotes = useMemo(() => {
    const groups: { key: string; label: string; total: number; items: QuoteListItem[] }[] = []
    const map = new Map<string, { label: string; total: number; items: QuoteListItem[] }>()

    for (const q of quotes) {
      const d = new Date(q.issueDate)
      const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`
      if (!map.has(key)) {
        const label = d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }).replace(/^\w/, (c) => c.toUpperCase())
        map.set(key, { label, total: 0, items: [] })
      }
      const group = map.get(key)!
      group.total += Number(q.total)
      group.items.push(q)
    }

    for (const [key, data] of map) {
      groups.push({ key, ...data })
    }

    return groups
  }, [quotes])

  function handleStatusChange(id: string, newStatus: string) {
    setQuotes((prev) => prev.map((q) => (q.id === id ? { ...q, status: newStatus as QuoteListItem['status'] } : q)))
  }

  function handleFilterChange(status: string) {
    setFilterStatus(status)
    setPage(1)
  }

  function handleDeleteFromOverlay(id: string) {
    setQuotes((prev) => prev.filter((q) => q.id !== id))
    if (meta) setMeta({ ...meta, total: meta.total - 1 })
  }

  return (
    <motion.div initial="hidden" animate="visible" className="space-y-6 px-4 lg:px-6 py-4 md:py-6">
      {/* Header */}
      <motion.div variants={fadeUp} custom={0} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Devis</h1>
          <p className="text-muted-foreground mt-1">
            {meta?.total ?? 0} devis au total
          </p>
        </div>
        <Link href="/dashboard/quotes/new">
          <Button>
            <Plus className="h-4 w-4 mr-1.5" /> Créer un devis
          </Button>
        </Link>
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
                {monthlyStats.totalQuoted.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
              </p>
              <p className="text-xs text-muted-foreground mt-1">devisé ce mois</p>
            </div>
            <div className="text-right space-y-2">
              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-500/10 text-green-500 text-xs font-semibold">
                <TrendingUp className="h-3 w-3" />
                {monthlyStats.trend > 0 ? '+' : ''}{monthlyStats.trend}%
              </div>
              <div>
                <p className="text-lg font-bold text-green-500">
                  {monthlyStats.totalAccepted.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                </p>
                <p className="text-xs text-muted-foreground">accepté</p>
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
            placeholder="Rechercher un devis..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex rounded-lg border border-border bg-muted/30 p-0.5">
          {[
            { id: 'all', label: 'Tous' },
            { id: 'draft', label: 'Brouillon' },
            { id: 'sent', label: 'Envoyé' },
            { id: 'accepted', label: 'Accepté' },
            { id: 'refused', label: 'Refusé' },
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

      {/* Quotes list */}
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
      ) : quotes.length === 0 ? (
        <motion.div variants={fadeUp} custom={2} className="text-center py-16">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50 mx-auto mb-4">
            <FileText className="h-8 w-8 text-muted-foreground/50" />
          </div>
          <p className="text-lg font-medium text-foreground">
            {debouncedSearch || filterStatus !== 'all' ? 'Aucun resultat' : 'Aucun devis'}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {debouncedSearch || filterStatus !== 'all'
              ? 'Essayez avec d\'autres criteres de recherche'
              : 'Commencez par créer votre premier devis'}
          </p>
          {!debouncedSearch && filterStatus === 'all' && (
            <Link href="/dashboard/quotes/new">
              <Button className="mt-4">
                <Plus className="h-4 w-4 mr-1.5" /> Créer un devis
              </Button>
            </Link>
          )}
        </motion.div>
      ) : (
        <div className="space-y-4">
          {groupedQuotes.map((group, gi) => (
            <div key={group.key}>
              {/* Month header */}
              <motion.div variants={fadeUp} custom={2 + gi * 0.2} className="flex items-center justify-between mb-2 px-1">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-sm font-semibold text-foreground">{group.label}</span>
                  <span className="text-xs text-muted-foreground">({group.items.length})</span>
                </div>
                <span className="text-sm font-semibold text-foreground">
                  {group.total.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                </span>
              </motion.div>

              {/* Quotes in this month */}
              <div className="space-y-2">
                {group.items.map((quote, i) => (
                  <motion.div key={quote.id} variants={fadeUp} custom={2 + gi * 0.2 + (i + 1) * 0.05}>
                    <div
                      onClick={() => setSelectedQuoteId(quote.id)}
                      className="w-full flex items-center gap-4 rounded-xl border border-border bg-card/50 hover:bg-card/80 p-4 transition-colors text-left group cursor-pointer"
                    >
                      {/* Icon */}
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        {quote.status === 'draft' && <FileText className="h-5 w-5 text-muted-foreground" />}
                        {quote.status === 'sent' && <Send className="h-5 w-5 text-blue-400" />}
                        {quote.status === 'accepted' && <CheckCircle2 className="h-5 w-5 text-green-400" />}
                        {quote.status === 'refused' && <XCircle className="h-5 w-5 text-red-400" />}
                        {quote.status === 'expired' && <Clock className="h-5 w-5 text-amber-400" />}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-sm font-semibold text-foreground truncate">
                            {quote.quoteNumber}
                          </p>
                          <StatusDropdown
                            id={quote.id}
                            currentStatus={quote.status}
                            options={quoteStatusOptions}
                            endpoint="quotes"
                            onStatusChange={handleStatusChange}
                          />
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          {quote.clientName && (
                            <span className="truncate">{quote.clientName}</span>
                          )}
                          {quote.subject && (
                            <span className="truncate">{quote.subject}</span>
                          )}
                          <span className="shrink-0">
                            {new Date(quote.issueDate).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                      </div>

                      {/* Amount */}
                      <div className="text-right shrink-0">
                        <p className="text-sm font-medium text-foreground">
                          {Number(quote.total).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                        </p>
                        <p className="text-xs text-muted-foreground">TTC</p>
                      </div>

                      {/* PDF download */}
                      <button
                        onClick={(e) => handleDownloadPdf(e, quote.id)}
                        disabled={downloadingId === quote.id}
                        className="h-8 rounded-lg flex items-center gap-1.5 px-2.5 text-xs font-medium text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors shrink-0"
                        title={`Télécharger ${quote.quoteNumber}`}
                      >
                        {downloadingId === quote.id ? <Spinner className="h-3.5 w-3.5" /> : <Download className="h-3.5 w-3.5" />}
                        <span className="hidden @[600px]:inline">{quote.quoteNumber}</span>
                      </button>

                      <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors shrink-0" />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Pagination meta={meta} onPageChange={setPage} />

      <QuoteDetailOverlay
        quoteId={selectedQuoteId}
        onClose={() => setSelectedQuoteId(null)}
        onStatusChange={handleStatusChange}
        onDelete={handleDeleteFromOverlay}
      />
    </motion.div>
  )
}
