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
  ChevronRight,
  Download,
  ArrowLeft,
  Trash2,
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
  createdAt: string
}

export default function InvoiceDraftsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [invoices, setInvoices] = useState<InvoiceListItem[]>([])
  const [search, setSearch] = useState('')
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    loadDrafts()
  }, [])

  async function loadDrafts() {
    setLoading(true)
    const { data } = await api.get<{ invoices: InvoiceListItem[] }>('/invoices?status=draft')
    if (data?.invoices) {
      setInvoices(data.invoices)
    }
    setLoading(false)
  }

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

  async function handleDelete(e: React.MouseEvent, invoiceId: string) {
    e.preventDefault()
    e.stopPropagation()
    setDeletingId(invoiceId)
    const { error } = await api.delete(`/invoices/${invoiceId}`)
    setDeletingId(null)
    if (error) {
      toast(error, 'error')
      return
    }
    setInvoices((prev) => prev.filter((inv) => inv.id !== invoiceId))
    toast('Brouillon supprime', 'success')
  }

  const filtered = invoices.filter((inv) => {
    if (!search) return true
    return (
      inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      inv.subject?.toLowerCase().includes(search.toLowerCase()) ||
      inv.clientName?.toLowerCase().includes(search.toLowerCase())
    )
  })

  return (
    <motion.div initial="hidden" animate="visible" className="space-y-6 px-4 lg:px-6 py-4 md:py-6">
      {/* Header */}
      <motion.div variants={fadeUp} custom={0} className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/invoices"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border hover:bg-muted/50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 text-muted-foreground" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Brouillons</h1>
            <p className="text-muted-foreground mt-1">
              {invoices.length} facture{invoices.length > 1 ? 's' : ''} en brouillon
            </p>
          </div>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-1.5" /> Creer une facture
        </Button>
      </motion.div>

      {/* Search */}
      <motion.div variants={fadeUp} custom={1}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un brouillon..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </motion.div>

      {/* Drafts list */}
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
                </div>
              </div>
              <Skeleton className="h-4 w-20 ml-auto" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div variants={fadeUp} custom={2} className="text-center py-16">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50 mx-auto mb-4">
            <FileText className="h-8 w-8 text-muted-foreground/50" />
          </div>
          <p className="text-lg font-medium text-foreground">
            {search ? 'Aucun resultat' : 'Aucun brouillon'}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {search
              ? 'Essayez avec d\'autres criteres de recherche'
              : 'Vos factures en brouillon apparaitront ici'}
          </p>
          {!search && (
            <Button className="mt-4" onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-1.5" /> Creer une facture
            </Button>
          )}
        </motion.div>
      ) : (
        <div className="space-y-2">
          {filtered.map((invoice, i) => (
            <motion.div key={invoice.id} variants={fadeUp} custom={2 + i * 0.3}>
              <Link
                href={`/dashboard/invoices/${invoice.id}/edit`}
                className="w-full flex items-center gap-4 rounded-xl border border-border bg-card/50 hover:bg-card/80 p-4 transition-colors text-left group"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-400/10">
                  <FileText className="h-5 w-5 text-zinc-400" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {invoice.invoiceNumber}
                    </p>
                    <Badge variant="muted" className="text-[10px] shrink-0 text-zinc-400 bg-zinc-400/10">
                      Brouillon
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

                <div className="text-right shrink-0">
                  <p className="text-sm font-medium text-foreground">
                    {Number(invoice.total).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                  </p>
                  <p className="text-xs text-muted-foreground">TTC</p>
                </div>

                <button
                  onClick={(e) => handleDownloadPdf(e, invoice.id)}
                  disabled={downloadingId === invoice.id}
                  className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors shrink-0"
                  title="Telecharger le PDF"
                >
                  <Download className={`h-4 w-4 ${downloadingId === invoice.id ? 'animate-pulse' : ''}`} />
                </button>

                <button
                  onClick={(e) => handleDelete(e, invoice.id)}
                  disabled={deletingId === invoice.id}
                  className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                  title="Supprimer le brouillon"
                >
                  <Trash2 className={`h-4 w-4 ${deletingId === invoice.id ? 'animate-pulse' : ''}`} />
                </button>

                <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors shrink-0" />
              </Link>
            </motion.div>
          ))}
        </div>
      )}

      <CreateInvoiceModal open={showCreateModal} onClose={() => setShowCreateModal(false)} />
    </motion.div>
  )
}
