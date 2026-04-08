'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Dialog, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { Badge } from '@/components/ui/badge'
import { Pagination } from '@/components/ui/pagination'
import { Dropdown, DropdownItem } from '@/components/ui/dropdown'
import { useToast } from '@/components/ui/toast'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import {
  RefreshCw,
  FilePlus,
  ArrowLeft,
  Search,
  FileText,
  ChevronRight,
  Filter,
  Check,
  Building2,
  Lock,
} from 'lucide-react'

interface QuoteItem {
  id: string
  quoteNumber: string
  status: string
  subject: string | null
  total: number
  clientName: string | null
  issueDate: string
}

interface CreateInvoiceModalProps {
  open: boolean
  onClose: () => void
}

const statusLabels: Record<string, string> = {
  draft: 'Brouillon',
  sent: 'Envoyé',
  accepted: 'Accepté',
  refused: 'Refusé',
  expired: 'Expiré',
}

interface PaginationMeta {
  total: number
  perPage: number
  currentPage: number
  lastPage: number
}

export function CreateInvoiceModal({ open, onClose }: CreateInvoiceModalProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [quotes, setQuotes] = useState<QuoteItem[]>([])
  const [loadingQuotes, setLoadingQuotes] = useState(false)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [convertingId, setConvertingId] = useState<string | null>(null)

  const [statusFilter, setStatusFilter] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('faktur_convert_filters')
      if (saved) return JSON.parse(saved)
    } catch {}
    return ['sent', 'accepted']
  })
  const [quotePage, setQuotePage] = useState(1)
  const [quoteMeta, setQuoteMeta] = useState<PaginationMeta | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const [hasCompany, setHasCompany] = useState<boolean | null>(null)
  const [checkingCompany, setCheckingCompany] = useState(false)

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(value)
      setQuotePage(1)
    }, 300)
  }, [])

  useEffect(() => {
    if (open && hasCompany === null) {
      setCheckingCompany(true)
      api.get<{ company: unknown }>('/company').then(({ data }) => {
        setHasCompany(!!data?.company)
        setCheckingCompany(false)
      })
    }
  }, [open, hasCompany])

  useEffect(() => {
    if (!open) {
      setSearch('')
      setDebouncedSearch('')
      setQuotes([])
      setQuotePage(1)
      setQuoteMeta(null)
    }
  }, [open])

  useEffect(() => {
    if (open) {
      loadQuotes()
    }
  }, [quotePage, debouncedSearch, statusFilter, open])

  async function loadQuotes() {
    setLoadingQuotes(true)
    const params = new URLSearchParams()
    params.set('page', String(quotePage))
    params.set('perPage', '10')
    if (debouncedSearch) params.set('search', debouncedSearch)

    const { data } = await api.get<{ quotes: QuoteItem[]; meta: PaginationMeta }>(`/quotes?${params}`)
    if (data) {
      const filtered = statusFilter.length > 0
        ? data.quotes.filter((q) => statusFilter.includes(q.status))
        : data.quotes
      setQuotes(filtered)
      setQuoteMeta(data.meta)
    }
    setLoadingQuotes(false)
  }

  async function handleConvertQuote(quoteId: string) {
    setConvertingId(quoteId)
    const { data, error } = await api.post<{ invoice: { id: string; invoiceNumber: string } }>(
      `/invoices/convert-quote/${quoteId}`,
      {}
    )
    setConvertingId(null)

    if (error) {
      toast(error, 'error')
      return
    }

    if (data?.invoice) {
      toast(`Facture ${data.invoice.invoiceNumber} créée`, 'success')
      onClose()
      router.push(`/dashboard/invoices/${data.invoice.id}/edit`)
    }
  }

  function toggleStatusFilter(status: string) {
    setStatusFilter((prev) => {
      const next = prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
      try { localStorage.setItem('faktur_convert_filters', JSON.stringify(next)) } catch {}
      return next
    })
    setQuotePage(1)
  }

  return (
    <Dialog open={open} onClose={onClose} className="max-w-lg">
      <AnimatePresence mode="wait">
        {checkingCompany ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center py-12"
          >
            <Spinner className="text-primary" />
          </motion.div>
        ) : hasCompany === false ? (
          <motion.div
            key="no-company"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-4"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500/10 mx-auto mb-4">
              <Lock className="h-7 w-7 text-orange-500" />
            </div>
            <DialogTitle>Entreprise requise</DialogTitle>
            <p className="text-sm text-muted-foreground mt-2 mb-6 leading-relaxed">
              Vous devez d&apos;abord configurer votre entreprise avant de pouvoir
              créer des factures. Vos informations légales apparaîtront sur chaque document.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={onClose}>
                Annuler
              </Button>
              <Button
                className="flex-1 gap-2"
                onClick={() => { onClose(); router.push('/dashboard/company') }}
              >
                <Building2 className="h-4 w-4" /> Configurer l&apos;entreprise
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="select-quote"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <DialogTitle className="!mb-0 flex-1">Convertir un devis en facture</DialogTitle>
              <Dropdown
                align="right"
                trigger={
                  <button className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-muted/50 transition-colors relative">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    {statusFilter.length > 0 && statusFilter.length < 5 && (
                      <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-primary text-[9px] font-bold text-white flex items-center justify-center">
                        {statusFilter.length}
                      </span>
                    )}
                  </button>
                }
                className="min-w-[180px]"
              >
                {(['draft', 'sent', 'accepted', 'refused', 'expired'] as const).map((status) => (
                  <DropdownItem
                    key={status}
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleStatusFilter(status)
                    }}
                  >
                    <span className={`h-4 w-4 flex items-center justify-center rounded border ${statusFilter.includes(status) ? 'bg-primary border-primary' : 'border-border'}`}>
                      {statusFilter.includes(status) && <Check className="h-3 w-3 text-white" />}
                    </span>
                    <span>{statusLabels[status]}</span>
                  </DropdownItem>
                ))}
              </Dropdown>
            </div>

            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un devis..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>

            {statusFilter.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {statusFilter.map((s) => (
                  <Badge
                    key={s}
                    variant="muted"
                    className="text-[10px] cursor-pointer hover:opacity-70"
                    onClick={() => toggleStatusFilter(s)}
                  >
                    {statusLabels[s]} &times;
                  </Badge>
                ))}
              </div>
            )}

            <div className="max-h-[360px] overflow-y-auto -mx-1 px-1 space-y-1.5">
              {loadingQuotes ? (
                [...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-lg border border-border p-3">
                    <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-3.5 w-24" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <Skeleton className="h-3.5 w-16" />
                  </div>
                ))
              ) : quotes.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {search ? 'Aucun devis trouvé' : 'Aucun devis disponible'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Modifiez les filtres pour voir plus de devis
                  </p>
                </div>
              ) : (
                quotes.map((quote) => (
                  <button
                    key={quote.id}
                    onClick={() => handleConvertQuote(quote.id)}
                    disabled={convertingId !== null}
                    className="w-full flex items-center gap-3 rounded-lg border border-border bg-card/50 hover:bg-card/80 hover:border-primary/30 p-3 transition-all text-left group disabled:opacity-50"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{quote.quoteNumber}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {quote.clientName || quote.subject || new Date(quote.issueDate).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-medium text-foreground">
                        {Number(quote.total).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                      </p>
                    </div>
                    {convertingId === quote.id ? (
                      <Spinner className="h-4 w-4 shrink-0" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors shrink-0" />
                    )}
                  </button>
                ))
              )}
            </div>

            <Pagination meta={quoteMeta} onPageChange={setQuotePage} />
          </motion.div>
        )}
      </AnimatePresence>
    </Dialog>
  )
}
