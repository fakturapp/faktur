'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion, type Variants } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Pagination } from '@/components/ui/pagination'
import { api } from '@/lib/api'
import { useToast } from '@/components/ui/toast'
import { StatusDropdown, creditNoteStatusOptions } from '@/components/shared/status-dropdown'
import {
  Search,
  FileMinus2,
  ChevronRight,
  Send,
  CheckCircle2,
  FileEdit,
  CalendarDays,
} from 'lucide-react'
import { CreditNoteDetailOverlay } from '@/components/credit-notes/credit-note-detail-overlay'
import { useActiveEditors, ActiveEditorsBadge } from '@/components/collaboration/active-editors-badge'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
} satisfies Variants

interface CreditNoteListItem {
  id: string
  creditNoteNumber: string
  status: 'draft' | 'sent' | 'finalized'
  subject: string | null
  reason: string | null
  issueDate: string
  subtotal: number
  taxAmount: number
  total: number
  clientName: string | null
  clientId: string | null
  sourceInvoiceId: string | null
  createdAt: string
}

interface PaginationMeta {
  total: number
  perPage: number
  currentPage: number
  lastPage: number
}

export default function CreditNotesPage() {
  const router = useRouter()
  const { toast } = useToast()
  const activeEditors = useActiveEditors('credit_note')
  const [loading, setLoading] = useState(true)
  const [creditNotes, setCreditNotes] = useState<CreditNoteListItem[]>([])
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState<PaginationMeta | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(value)
      setPage(1)
    }, 300)
  }, [])

  useEffect(() => {
    loadCreditNotes()
  }, [page, debouncedSearch, filterStatus])

  async function loadCreditNotes() {
    setLoading(true)
    const params = new URLSearchParams()
    params.set('page', String(page))
    params.set('perPage', '20')
    if (debouncedSearch) params.set('search', debouncedSearch)
    if (filterStatus !== 'all') params.set('status', filterStatus)

    const { data } = await api.get<{ creditNotes: CreditNoteListItem[]; meta: PaginationMeta }>(`/credit-notes?${params}`)
    if (data) {
      setCreditNotes(data.creditNotes)
      setMeta(data.meta)
    }
    setLoading(false)
  }

  const groupedCreditNotes = useMemo(() => {
    const groups: { key: string; label: string; total: number; items: CreditNoteListItem[] }[] = []
    const map = new Map<string, { label: string; total: number; items: CreditNoteListItem[] }>()

    for (const cn of creditNotes) {
      const d = new Date(cn.issueDate)
      const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`
      if (!map.has(key)) {
        const label = d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }).replace(/^\w/, (c) => c.toUpperCase())
        map.set(key, { label, total: 0, items: [] })
      }
      const group = map.get(key)!
      group.total += Number(cn.total)
      group.items.push(cn)
    }

    for (const [key, data] of map) {
      groups.push({ key, ...data })
    }

    return groups
  }, [creditNotes])

  function handleStatusChange(id: string, newStatus: string) {
    setCreditNotes((prev) => prev.map((cn) => (cn.id === id ? { ...cn, status: newStatus as CreditNoteListItem['status'] } : cn)))
  }

  function handleFilterChange(status: string) {
    setFilterStatus(status)
    setPage(1)
  }

  function handleDeleteFromOverlay(id: string) {
    setCreditNotes((prev) => prev.filter((cn) => cn.id !== id))
    if (meta) setMeta({ ...meta, total: meta.total - 1 })
  }

  return (
    <motion.div initial="hidden" animate="visible" className="space-y-6 px-4 lg:px-6 py-4 md:py-6">
      {/* Header */}
      <motion.div variants={fadeUp} custom={0} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Avoirs</h1>
          <p className="text-muted-foreground mt-1">
            {meta?.total ?? 0} avoir{(meta?.total ?? 0) > 1 ? 's' : ''} au total
          </p>
        </div>
      </motion.div>

      {/* Search + filter */}
      <motion.div variants={fadeUp} custom={1} className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un avoir..."
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
            { id: 'finalized', label: 'Finalisé' },
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

      {/* Credit notes list */}
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
              <div className="text-right space-y-1.5 shrink-0">
                <Skeleton className="h-4 w-20 ml-auto" />
                <Skeleton className="h-3 w-8 ml-auto" />
              </div>
              <Skeleton className="h-4 w-4 shrink-0" />
            </div>
          ))}
        </div>
      ) : creditNotes.length === 0 ? (
        <motion.div variants={fadeUp} custom={2} className="text-center py-16">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50 mx-auto mb-4">
            <FileMinus2 className="h-8 w-8 text-muted-foreground/50" />
          </div>
          <p className="text-lg font-medium text-foreground">
            {debouncedSearch || filterStatus !== 'all' ? 'Aucun résultat' : 'Aucun avoir'}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {debouncedSearch || filterStatus !== 'all'
              ? 'Essayez avec d\'autres critères de recherche'
              : 'Les avoirs sont créés depuis une facture existante'}
          </p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {groupedCreditNotes.map((group, gi) => (
            <div key={group.key}>
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

              <div className="space-y-2">
                {group.items.map((cn, i) => (
                  <motion.div key={cn.id} variants={fadeUp} custom={2 + gi * 0.2 + (i + 1) * 0.05}>
                    <div
                      onClick={() => setSelectedId(cn.id)}
                      className="w-full flex items-center gap-4 rounded-xl border border-border bg-card/50 hover:bg-card/80 p-4 transition-colors text-left group cursor-pointer"
                    >
                      {/* Icon */}
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        {cn.status === 'draft' && <FileEdit className="h-5 w-5 text-muted-foreground" />}
                        {cn.status === 'sent' && <Send className="h-5 w-5 text-blue-400" />}
                        {cn.status === 'finalized' && <CheckCircle2 className="h-5 w-5 text-green-400" />}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-sm font-semibold text-foreground truncate">
                            {cn.creditNoteNumber}
                          </p>
                          <StatusDropdown
                            id={cn.id}
                            currentStatus={cn.status}
                            options={creditNoteStatusOptions}
                            endpoint="credit-notes"
                            onStatusChange={handleStatusChange}
                          />
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          {cn.clientName && (
                            <span className="truncate">{cn.clientName}</span>
                          )}
                          {cn.subject && (
                            <span className="truncate">{cn.subject}</span>
                          )}
                          <span className="shrink-0">
                            {new Date(cn.issueDate).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                      </div>

                      {/* Amount */}
                      <div className="text-right shrink-0">
                        <p className="text-sm font-medium text-foreground">
                          {Number(cn.total).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                        </p>
                        <p className="text-xs text-muted-foreground">TTC</p>
                      </div>

                      {/* Active editors */}
                      <ActiveEditorsBadge
                        documentId={cn.id}
                        documentType="credit_note"
                        editors={activeEditors}
                      />

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

      <CreditNoteDetailOverlay
        creditNoteId={selectedId}
        onClose={() => setSelectedId(null)}
        onStatusChange={handleStatusChange}
        onDelete={handleDeleteFromOverlay}
      />
    </motion.div>
  )
}
