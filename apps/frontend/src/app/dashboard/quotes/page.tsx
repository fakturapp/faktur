'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, type Variants } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/lib/api'
import {
  Plus,
  Search,
  FileText,
  Clock,
  CheckCircle2,
  ChevronRight,
  Send,
  XCircle,
} from 'lucide-react'

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

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  draft: { label: 'Brouillon', color: 'text-zinc-400', bgColor: 'bg-zinc-400/10' },
  sent: { label: 'Envoye', color: 'text-blue-400', bgColor: 'bg-blue-400/10' },
  accepted: { label: 'Accepte', color: 'text-green-400', bgColor: 'bg-green-400/10' },
  refused: { label: 'Refuse', color: 'text-red-400', bgColor: 'bg-red-400/10' },
  expired: { label: 'Expire', color: 'text-amber-400', bgColor: 'bg-amber-400/10' },
}

export default function QuotesPage() {
  const [loading, setLoading] = useState(true)
  const [quotes, setQuotes] = useState<QuoteListItem[]>([])
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  useEffect(() => {
    loadQuotes()
  }, [])

  async function loadQuotes() {
    setLoading(true)
    const { data } = await api.get<{ quotes: QuoteListItem[] }>('/quotes')
    if (data?.quotes) {
      setQuotes(data.quotes)
    }
    setLoading(false)
  }

  const filtered = quotes.filter((q) => {
    const matchesSearch =
      !search ||
      q.quoteNumber.toLowerCase().includes(search.toLowerCase()) ||
      q.subject?.toLowerCase().includes(search.toLowerCase()) ||
      q.clientName?.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = filterStatus === 'all' || q.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const totalAmount = quotes.reduce((sum, q) => sum + Number(q.total), 0)
  const pendingCount = quotes.filter((q) => q.status === 'sent').length
  const acceptedCount = quotes.filter((q) => q.status === 'accepted').length

  return (
    <motion.div initial="hidden" animate="visible" className="space-y-6 px-4 lg:px-6 py-4 md:py-6">
      {/* Header */}
      <motion.div variants={fadeUp} custom={0} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Devis</h1>
          <p className="text-muted-foreground mt-1">
            {quotes.length} devis au total
          </p>
        </div>
        <Link href="/dashboard/quotes/new">
          <Button>
            <Plus className="h-4 w-4 mr-1.5" /> Creer un devis
          </Button>
        </Link>
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
              <p className="text-2xl font-bold text-foreground">{acceptedCount}</p>
              <p className="text-xs text-muted-foreground">Acceptes</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Search + filter */}
      <motion.div variants={fadeUp} custom={2} className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un devis..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex rounded-lg border border-border bg-muted/30 p-0.5">
          {[
            { id: 'all', label: 'Tous' },
            { id: 'draft', label: 'Brouillon' },
            { id: 'sent', label: 'Envoye' },
            { id: 'accepted', label: 'Accepte' },
            { id: 'refused', label: 'Refuse' },
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

      {/* Quotes list */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div variants={fadeUp} custom={3} className="text-center py-16">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50 mx-auto mb-4">
            <FileText className="h-8 w-8 text-muted-foreground/50" />
          </div>
          <p className="text-lg font-medium text-foreground">
            {search || filterStatus !== 'all' ? 'Aucun resultat' : 'Aucun devis'}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {search || filterStatus !== 'all'
              ? 'Essayez avec d\'autres criteres de recherche'
              : 'Commencez par creer votre premier devis'}
          </p>
          {!search && filterStatus === 'all' && (
            <Link href="/dashboard/quotes/new">
              <Button className="mt-4">
                <Plus className="h-4 w-4 mr-1.5" /> Creer un devis
              </Button>
            </Link>
          )}
        </motion.div>
      ) : (
        <div className="space-y-2">
          {filtered.map((quote, i) => {
            const cfg = statusConfig[quote.status]
            return (
              <motion.div key={quote.id} variants={fadeUp} custom={3 + i * 0.3}>
                <Link
                  href={`/dashboard/quotes/${quote.id}/edit`}
                  className="w-full flex items-center gap-4 rounded-xl border border-border bg-card/50 hover:bg-card/80 p-4 transition-colors text-left group"
                >
                  {/* Icon */}
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    {quote.status === 'draft' && <FileText className="h-5 w-5 text-zinc-400" />}
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
                      <Badge variant="muted" className={`text-[10px] shrink-0 ${cfg.color} ${cfg.bgColor}`}>
                        {cfg.label}
                      </Badge>
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

                  <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors shrink-0" />
                </Link>
              </motion.div>
            )
          })}
        </div>
      )}
    </motion.div>
  )
}
