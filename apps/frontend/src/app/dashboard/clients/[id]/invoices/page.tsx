'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, FileText, Receipt, FileMinus2, Plus, ChevronRight } from 'lucide-react'

type Tab = 'invoices' | 'quotes' | 'credit-notes'

interface ClientInfo {
  id: string
  displayName: string
  type: 'company' | 'individual'
  invoiceCount: number
  quoteCount: number
  totalRevenue: number
}

interface DocumentItem {
  id: string
  number: string
  status: string
  issueDate: string
  total: number
}

interface InvoiceApiItem {
  id: string
  invoiceNumber: string
  status: string
  issueDate: string
  total: number
}

interface QuoteApiItem {
  id: string
  quoteNumber: string
  status: string
  issueDate: string
  total: number
}

interface CreditNoteApiItem {
  id: string
  creditNoteNumber: string
  status: string
  issueDate: string
  total: number
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Brouillon',
  sent: 'Envoyée',
  paid: 'Payée',
  paid_unconfirmed: 'En attente',
  partial: 'Partielle',
  overdue: 'En retard',
  cancelled: 'Annulée',
  accepted: 'Acceptée',
  refused: 'Refusée',
  expired: 'Expirée',
  finalized: 'Finalisée',
}

const STATUS_VARIANTS: Record<string, 'success' | 'warning' | 'danger' | 'default' | 'muted'> = {
  paid: 'success',
  accepted: 'success',
  finalized: 'success',
  sent: 'default',
  paid_unconfirmed: 'warning',
  partial: 'warning',
  overdue: 'danger',
  cancelled: 'muted',
  refused: 'danger',
  expired: 'muted',
  draft: 'muted',
}

function formatCurrency(n: number) {
  return Number(n).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
}

function formatDate(d: string) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function ClientInvoicesPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialTab = (searchParams.get('tab') as Tab) || 'invoices'

  const [activeTab, setActiveTab] = useState<Tab>(initialTab)
  const [client, setClient] = useState<ClientInfo | null>(null)
  const [clientLoading, setClientLoading] = useState(true)
  const [invoices, setInvoices] = useState<DocumentItem[]>([])
  const [quotes, setQuotes] = useState<DocumentItem[]>([])
  const [creditNotes, setCreditNotes] = useState<DocumentItem[]>([])
  const [loadingList, setLoadingList] = useState(true)

  useEffect(() => {
    if (!id) return
    setClientLoading(true)
    api.get<{ client: ClientInfo }>(`/clients/${id}`).then(({ data }) => {
      if (data?.client) setClient(data.client)
      setClientLoading(false)
    })
  }, [id])

  useEffect(() => {
    if (!id) return
    setLoadingList(true)
    Promise.all([
      api.get<{ invoices: InvoiceApiItem[] }>(`/invoices?clientId=${id}&perPage=100`),
      api.get<{ quotes: QuoteApiItem[] }>(`/quotes?clientId=${id}&perPage=100`),
      api.get<{ creditNotes: CreditNoteApiItem[] }>(`/credit-notes?clientId=${id}&perPage=100`),
    ]).then(([invRes, quoRes, cnRes]) => {
      setInvoices(
        (invRes.data?.invoices ?? []).map((i) => ({
          id: i.id,
          number: i.invoiceNumber,
          status: i.status,
          issueDate: i.issueDate,
          total: Number(i.total),
        }))
      )
      setQuotes(
        (quoRes.data?.quotes ?? []).map((q) => ({
          id: q.id,
          number: q.quoteNumber,
          status: q.status,
          issueDate: q.issueDate,
          total: Number(q.total),
        }))
      )
      setCreditNotes(
        (cnRes.data?.creditNotes ?? []).map((cn) => ({
          id: cn.id,
          number: cn.creditNoteNumber,
          status: cn.status,
          issueDate: cn.issueDate,
          total: Number(cn.total),
        }))
      )
      setLoadingList(false)
    })
  }, [id])

  const currentItems = useMemo(() => {
    if (activeTab === 'invoices') return invoices
    if (activeTab === 'quotes') return quotes
    return creditNotes
  }, [activeTab, invoices, quotes, creditNotes])

  const detailHref = (item: DocumentItem) => {
    if (activeTab === 'invoices') return `/dashboard/invoices?open=${item.id}`
    if (activeTab === 'quotes') return `/dashboard/quotes?open=${item.id}`
    return `/dashboard/credit-notes?open=${item.id}`
  }

  const emptyState = useMemo(() => {
    if (activeTab === 'invoices') {
      return {
        title: 'Aucune facture',
        description: "Ce client n'a pas encore de facture.",
        cta: {
          label: 'Créer une facture',
          href: `/dashboard/invoices/new?clientId=${id}`,
          icon: FileText,
        },
      }
    }
    if (activeTab === 'quotes') {
      return {
        title: 'Aucun devis',
        description: "Ce client n'a pas encore de devis.",
        cta: {
          label: 'Créer un devis',
          href: `/dashboard/quotes/new?clientId=${id}`,
          icon: Receipt,
        },
      }
    }
    return {
      title: 'Aucun avoir',
      description: "Ce client n'a pas d'avoir.",
      cta: null,
    }
  }, [activeTab, id])

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 px-4 lg:px-6 py-4 md:py-6"
    >
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.push(`/dashboard/clients/${id}/edit`)}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Retour au client
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          {clientLoading ? (
            <Skeleton className="h-8 w-60" />
          ) : (
            <h1 className="text-2xl font-bold text-foreground">
              {client?.displayName || 'Client'}
            </h1>
          )}
          <p className="text-muted-foreground text-sm mt-1">Documents associés à ce client.</p>
        </div>

        <div className="flex gap-2">
          <Link href={`/dashboard/invoices/new?clientId=${id}`}>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Nouvelle facture
            </Button>
          </Link>
          <Link href={`/dashboard/quotes/new?clientId=${id}`}>
            <Button size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-1" />
              Nouveau devis
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatCard
          icon={FileText}
          label="Factures"
          value={client?.invoiceCount ?? 0}
          loading={clientLoading}
          active={activeTab === 'invoices'}
          onClick={() => setActiveTab('invoices')}
        />
        <StatCard
          icon={Receipt}
          label="Devis"
          value={client?.quoteCount ?? 0}
          loading={clientLoading}
          active={activeTab === 'quotes'}
          onClick={() => setActiveTab('quotes')}
        />
        <StatCard
          icon={FileMinus2}
          label="Avoirs"
          value={creditNotes.length}
          loading={loadingList}
          active={activeTab === 'credit-notes'}
          onClick={() => setActiveTab('credit-notes')}
        />
      </div>

      <div className="rounded-xl bg-surface shadow-surface">
        {loadingList ? (
          <div className="p-6 space-y-3">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        ) : currentItems.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center">
            <p className="text-lg font-medium text-foreground">{emptyState.title}</p>
            <p className="text-sm text-muted-foreground mt-1">{emptyState.description}</p>
            {emptyState.cta && (
              <Link href={emptyState.cta.href} className="mt-4">
                <Button size="sm">
                  <emptyState.cta.icon className="h-4 w-4 mr-1" />
                  {emptyState.cta.label}
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {currentItems.map((item) => {
              const variant = STATUS_VARIANTS[item.status] ?? 'default'
              return (
                <li key={item.id}>
                  <Link
                    href={detailHref(item)}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-surface-hover transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground truncate">{item.number}</p>
                        <Badge variant={variant}>{STATUS_LABELS[item.status] ?? item.status}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDate(item.issueDate)}
                      </p>
                    </div>
                    <div className="text-sm font-semibold text-foreground">
                      {formatCurrency(item.total)}
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </motion.div>
  )
}

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number | string
  loading: boolean
  active: boolean
  onClick: () => void
}

function StatCard({ icon: Icon, label, value, loading, active, onClick }: StatCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-colors ${
        active ? 'border-primary/40 bg-primary/5' : 'border-border bg-surface hover:bg-surface-hover'
      }`}
    >
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" />
        <span className="text-xs uppercase tracking-wide">{label}</span>
      </div>
      {loading ? (
        <Skeleton className="h-6 w-12" />
      ) : (
        <p className="text-xl font-bold text-foreground">{value}</p>
      )}
    </button>
  )
}
