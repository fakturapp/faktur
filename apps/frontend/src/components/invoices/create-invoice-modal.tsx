'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Dialog, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { useToast } from '@/components/ui/toast'
import { api } from '@/lib/api'
import {
  RefreshCw,
  FilePlus,
  ArrowLeft,
  Search,
  FileText,
  ChevronRight,
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

export function CreateInvoiceModal({ open, onClose }: CreateInvoiceModalProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [step, setStep] = useState<'choose' | 'select-quote'>('choose')
  const [quotes, setQuotes] = useState<QuoteItem[]>([])
  const [loadingQuotes, setLoadingQuotes] = useState(false)
  const [search, setSearch] = useState('')
  const [convertingId, setConvertingId] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      setStep('choose')
      setSearch('')
      setQuotes([])
    }
  }, [open])

  async function loadQuotes() {
    setLoadingQuotes(true)
    const { data } = await api.get<{ quotes: QuoteItem[] }>('/quotes')
    if (data?.quotes) {
      setQuotes(data.quotes.filter((q) => q.status === 'sent' || q.status === 'accepted'))
    }
    setLoadingQuotes(false)
  }

  function handleConvertChoice() {
    setStep('select-quote')
    loadQuotes()
  }

  function handleBlankChoice() {
    onClose()
    router.push('/dashboard/invoices/new')
  }

  async function handleConvertQuote(quoteId: string) {
    setConvertingId(quoteId)
    const { data, error } = await api.post<{ invoice: { id: string; invoiceNumber: string } }>(
      `/invoices/convert-quote/${quoteId}`
    )
    setConvertingId(null)

    if (error) {
      toast(error, 'error')
      return
    }

    if (data?.invoice) {
      toast(`Facture ${data.invoice.invoiceNumber} creee`, 'success')
      onClose()
      router.push(`/dashboard/invoices/${data.invoice.id}/edit`)
    }
  }

  const filteredQuotes = quotes.filter((q) => {
    if (!search) return true
    return (
      q.quoteNumber.toLowerCase().includes(search.toLowerCase()) ||
      q.subject?.toLowerCase().includes(search.toLowerCase()) ||
      q.clientName?.toLowerCase().includes(search.toLowerCase())
    )
  })

  return (
    <Dialog open={open} onClose={onClose} className="max-w-lg">
      <AnimatePresence mode="wait">
        {step === 'choose' ? (
          <motion.div
            key="choose"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <DialogTitle>Creer une facture</DialogTitle>
            <p className="text-sm text-muted-foreground mt-1 mb-5">
              Choisissez comment creer votre facture
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleConvertChoice}
                className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card/50 hover:bg-card/80 hover:border-primary/30 p-6 transition-all text-center group"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                  <RefreshCw className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Convertir un devis</p>
                  <p className="text-xs text-muted-foreground mt-0.5">A partir d'un devis existant</p>
                </div>
              </button>

              <button
                onClick={handleBlankChoice}
                className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card/50 hover:bg-card/80 hover:border-primary/30 p-6 transition-all text-center group"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/10 group-hover:bg-green-500/20 transition-colors">
                  <FilePlus className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Facture vierge</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Creer de zero</p>
                </div>
              </button>
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
              <button
                onClick={() => setStep('choose')}
                className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-muted/50 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 text-muted-foreground" />
              </button>
              <DialogTitle className="!mb-0">Selectionner un devis</DialogTitle>
            </div>

            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un devis..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

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
              ) : filteredQuotes.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {search ? 'Aucun devis trouve' : 'Aucun devis disponible'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Seuls les devis envoyes ou acceptes peuvent etre convertis
                  </p>
                </div>
              ) : (
                filteredQuotes.map((quote) => (
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
          </motion.div>
        )}
      </AnimatePresence>
    </Dialog>
  )
}
