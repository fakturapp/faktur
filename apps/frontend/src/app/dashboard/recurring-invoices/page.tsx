'use client'

import { useState, useEffect } from 'react'
import { motion, type Variants } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Pagination } from '@/components/ui/pagination'
import { Dropdown, DropdownItem, DropdownSeparator } from '@/components/ui/dropdown'
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { api } from '@/lib/api'
import { useToast } from '@/components/ui/toast'
import { Spinner } from '@/components/ui/spinner'
import { RecurringInvoicePanel } from '@/components/recurring-invoices/recurring-invoice-panel'
import {
  Plus,
  Search,
  RefreshCw,
  Play,
  Pause,
  MoreHorizontal,
  Pencil,
  Trash2,
  Zap,
  CalendarClock,
} from 'lucide-react'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
} satisfies Variants

interface RecurringListItem {
  id: string
  name: string
  frequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom'
  customIntervalDays: number | null
  startDate: string
  nextExecutionDate: string
  endDate: string | null
  isActive: boolean
  lastGeneratedAt: string | null
  generationCount: number
  clientName: string | null
  clientId: string | null
  subject: string | null
  total: number
  createdAt: string
}

const frequencyLabels: Record<string, string> = {
  weekly: 'Hebdomadaire',
  monthly: 'Mensuelle',
  quarterly: 'Trimestrielle',
  yearly: 'Annuelle',
  custom: 'Personnalisée',
}

export default function RecurringInvoicesPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<RecurringListItem[]>([])
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'paused'>('all')
  const [panelOpen, setPanelOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [generatingId, setGeneratingId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<RecurringListItem | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    loadItems()
  }, [filterActive])

  async function loadItems() {
    setLoading(true)
    const params = new URLSearchParams()
    if (filterActive === 'active') params.set('active', 'true')
    if (filterActive === 'paused') params.set('active', 'false')
    const { data } = await api.get<{ recurringInvoices: RecurringListItem[] }>(`/recurring-invoices?${params}`)
    if (data?.recurringInvoices) {
      setItems(data.recurringInvoices)
    }
    setLoading(false)
  }

  async function handleGenerate(item: RecurringListItem) {
    setGeneratingId(item.id)
    const { data, error } = await api.post<{ invoice: { id: string; invoiceNumber: string } }>(`/recurring-invoices/${item.id}/generate`, {})
    setGeneratingId(null)
    if (error) { toast(error, 'error'); return }
    if (data?.invoice) {
      toast(`Facture ${data.invoice.invoiceNumber} générée`)
      loadItems()
    }
  }

  async function handleToggleActive(item: RecurringListItem) {
    setTogglingId(item.id)
    const { data, error } = await api.patch<{ recurringInvoice: { isActive: boolean } }>(`/recurring-invoices/${item.id}/toggle-active`, {})
    setTogglingId(null)
    if (error) { toast(error, 'error'); return }
    if (data?.recurringInvoice) {
      setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, isActive: data!.recurringInvoice.isActive } : i))
      toast(data.recurringInvoice.isActive ? 'Récurrence activée' : 'Récurrence mise en pause')
    }
  }

  async function handleDelete() {
    if (!deleteConfirm) return
    setDeleting(true)
    const { error } = await api.delete(`/recurring-invoices/${deleteConfirm.id}`)
    setDeleting(false)
    if (error) { toast(error, 'error'); return }
    toast('Récurrence supprimée')
    setDeleteConfirm(null)
    loadItems()
  }

  function handleEdit(item: RecurringListItem) {
    setEditingId(item.id)
    setPanelOpen(true)
  }

  function handleCreate() {
    setEditingId(null)
    setPanelOpen(true)
  }

  function handlePanelSaved() {
    setPanelOpen(false)
    setEditingId(null)
    loadItems()
  }

  const filtered = items.filter((item) => {
    if (!search) return true
    const s = search.toLowerCase()
    return (
      item.name.toLowerCase().includes(s) ||
      item.clientName?.toLowerCase().includes(s)
    )
  })

  const PER_PAGE = 20
  const totalPages = Math.ceil(filtered.length / PER_PAGE)
  const paginatedItems = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)
  const paginationMeta = filtered.length > PER_PAGE ? { total: filtered.length, perPage: PER_PAGE, currentPage: page, lastPage: totalPages } : null

  const activeCount = items.filter((i) => i.isActive).length
  const pausedCount = items.filter((i) => !i.isActive).length

  return (
    <motion.div initial="hidden" animate="visible" className="space-y-6 px-4 lg:px-6 py-4 md:py-6">
      {/* Header */}
      <motion.div variants={fadeUp} custom={0} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Factures récurrentes</h1>
          <p className="text-muted-foreground mt-1">
            {items.length} récurrence{items.length !== 1 ? 's' : ''} · {activeCount} active{activeCount !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-1.5" /> Nouvelle récurrence
        </Button>
      </motion.div>

      {/* Stats */}
      <motion.div variants={fadeUp} custom={1} className="grid grid-cols-1 gap-4 @xl/main:grid-cols-3">
        <div className="rounded-lg bg-overlay shadow-surface p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft">
              <RefreshCw className="h-4.5 w-4.5 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{items.length}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg bg-overlay shadow-surface p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-success-soft">
              <Play className="h-4.5 w-4.5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{activeCount}</p>
              <p className="text-xs text-muted-foreground">Actives</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg bg-overlay shadow-surface p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500/10">
              <Pause className="h-4.5 w-4.5 text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{pausedCount}</p>
              <p className="text-xs text-muted-foreground">En pause</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Search + filter */}
      <motion.div variants={fadeUp} custom={2} className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher une récurrence..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex rounded-lg bg-surface-secondary p-0.5">
          {[
            { id: 'all' as const, label: 'Toutes' },
            { id: 'active' as const, label: 'Actives' },
            { id: 'paused' as const, label: 'En pause' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterActive(f.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                filterActive === f.id
                  ? 'bg-overlay text-foreground shadow-surface'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* List */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 rounded-lg bg-overlay shadow-surface p-4">
              <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
              <div className="flex-1 min-w-0 space-y-1.5">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-8" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div variants={fadeUp} custom={3} className="text-center py-16">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-surface-hover mx-auto mb-4">
            <RefreshCw className="h-8 w-8 text-muted-secondary" />
          </div>
          <p className="text-lg font-medium text-foreground">
            {search ? 'Aucun résultat' : 'Aucune récurrence'}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {search
              ? 'Essayez avec un autre terme'
              : 'Automatisez vos factures en créant une récurrence'}
          </p>
          {!search && (
            <Button className="mt-4" onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-1.5" /> Nouvelle récurrence
            </Button>
          )}
        </motion.div>
      ) : (
        <div className="space-y-2">
          {paginatedItems.map((item, i) => (
            <motion.div key={item.id} variants={fadeUp} custom={3 + i * 0.3}>
              <div className="w-full flex items-center gap-4 rounded-lg bg-overlay shadow-surface hover:bg-surface-hover p-4 transition-colors group">
                {/* Icon */}
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                  item.isActive ? 'bg-success-soft' : 'bg-muted'
                }`}>
                  {item.isActive ? (
                    <RefreshCw className="h-5 w-5 text-success" />
                  ) : (
                    <Pause className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => handleEdit(item)}>
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-semibold text-foreground truncate">{item.name}</p>
                    <Badge variant="muted" className="text-[10px] shrink-0">
                      {frequencyLabels[item.frequency]}
                    </Badge>
                    {!item.isActive && (
                      <Badge variant="muted" className="text-[10px] shrink-0 text-orange-500">
                        En pause
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {item.clientName && <span className="truncate">{item.clientName}</span>}
                    <span className="flex items-center gap-1 shrink-0">
                      <CalendarClock className="h-3 w-3" />
                      Prochaine : {new Date(item.nextExecutionDate).toLocaleDateString('fr-FR')}
                    </span>
                    <span className="shrink-0">{item.generationCount} générée{item.generationCount !== 1 ? 's' : ''}</span>
                  </div>
                </div>

                {/* Amount */}
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-foreground">
                    {Number(item.total).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                  </p>
                  <p className="text-xs text-muted-foreground">TTC</p>
                </div>

                {/* Generate button */}
                <button
                  onClick={() => handleGenerate(item)}
                  disabled={generatingId === item.id}
                  className="h-8 px-3 rounded-lg flex items-center gap-1.5 text-xs font-medium bg-accent-soft text-accent hover:bg-primary/20 transition-colors shrink-0 disabled:opacity-50"
                  title="Générer la facture"
                >
                  {generatingId === item.id ? <Spinner className="h-3.5 w-3.5" /> : <Zap className="h-3.5 w-3.5" />}
                  Générer
                </button>

                {/* Actions */}
                <Dropdown
                  align="right"
                  trigger={
                    <button className="p-1.5 rounded-md hover:bg-surface-hover transition-colors">
                      <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                    </button>
                  }
                >
                  <DropdownItem onClick={() => handleEdit(item)}>
                    <Pencil className="h-4 w-4" /> Modifier
                  </DropdownItem>
                  <DropdownItem onClick={() => handleToggleActive(item)}>
                    {togglingId === item.id ? (
                      <Spinner className="h-4 w-4" />
                    ) : item.isActive ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                    {item.isActive ? 'Mettre en pause' : 'Activer'}
                  </DropdownItem>
                  <DropdownSeparator />
                  <DropdownItem destructive onClick={() => setDeleteConfirm(item)}>
                    <Trash2 className="h-4 w-4" /> Supprimer
                  </DropdownItem>
                </Dropdown>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <RecurringInvoicePanel
        open={panelOpen}
        editingId={editingId}
        onClose={() => { setPanelOpen(false); setEditingId(null) }}
        onSaved={handlePanelSaved}
      />

      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} className="max-w-sm">
        <DialogHeader showClose={false}>
          <DialogTitle>Supprimer la récurrence</DialogTitle>
          <DialogDescription>
            Êtes-vous sûr de vouloir supprimer &laquo;&nbsp;{deleteConfirm?.name}&nbsp;&raquo; ? Les factures déjà générées ne seront pas affectées.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => setDeleteConfirm(null)}>Annuler</Button>
          <Button variant="destructive" size="sm" disabled={deleting} onClick={handleDelete}>
            {deleting ? <Spinner className="h-3.5 w-3.5" /> : <Trash2 className="h-3.5 w-3.5 mr-1" />}
            Supprimer
          </Button>
        </DialogFooter>
      </Dialog>

      <Pagination meta={paginationMeta} onPageChange={(p) => { setPage(p); window.scrollTo(0, 0) }} />
    </motion.div>
  )
}
