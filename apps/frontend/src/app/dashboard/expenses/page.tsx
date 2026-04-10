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
import { ExpensePanel } from '@/components/expenses/expense-panel'
import {
  Plus,
  Search,
  Wallet,
  MoreHorizontal,
  Pencil,
  Trash2,
  TrendingDown,
  Receipt,
  CalendarDays,
} from 'lucide-react'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
} satisfies Variants

interface ExpenseListItem {
  id: string
  description: string
  amount: number
  vatAmount: number
  vatRate: number
  currency: string
  expenseDate: string
  paymentMethod: string | null
  supplier: string | null
  notes: string | null
  receiptUrl: string | null
  isDeductible: boolean
  categoryId: string | null
  categoryName: string | null
  categoryColor: string | null
  createdAt: string
}

interface Totals {
  amount: number
  vat: number
  ttc: number
}

export default function ExpensesPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<ExpenseListItem[]>([])
  const [page, setPage] = useState(1)
  const [totals, setTotals] = useState<Totals>({ amount: 0, vat: 0, ttc: 0 })
  const [search, setSearch] = useState('')
  const [panelOpen, setPanelOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<ExpenseListItem | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<ExpenseListItem | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    loadItems()
  }, [])

  async function loadItems() {
    setLoading(true)
    const { data } = await api.get<{ expenses: ExpenseListItem[]; totals: Totals }>('/expenses')
    if (data?.expenses) {
      setItems(data.expenses)
      setTotals(data.totals)
    }
    setLoading(false)
  }

  async function handleDelete() {
    if (!deleteConfirm) return
    setDeleting(true)
    const { error } = await api.delete(`/expenses/${deleteConfirm.id}`)
    setDeleting(false)
    if (error) { toast(error, 'error'); return }
    toast('Depense supprimee')
    setDeleteConfirm(null)
    loadItems()
  }

  function handleEdit(item: ExpenseListItem) {
    setEditingExpense(item)
    setPanelOpen(true)
  }

  function handleCreate() {
    setEditingExpense(null)
    setPanelOpen(true)
  }

  function handlePanelSaved() {
    setPanelOpen(false)
    setEditingExpense(null)
    loadItems()
  }

  const filtered = items.filter((item) => {
    if (!search) return true
    const s = search.toLowerCase()
    return (
      item.description.toLowerCase().includes(s) ||
      item.supplier?.toLowerCase().includes(s) ||
      item.categoryName?.toLowerCase().includes(s)
    )
  })

  const PER_PAGE = 20
  const totalPages = Math.ceil(filtered.length / PER_PAGE)
  const paginatedExpenses = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)
  const expensePaginationMeta = filtered.length > PER_PAGE ? { total: filtered.length, perPage: PER_PAGE, currentPage: page, lastPage: totalPages } : null

  // Group by month (paginated)
  const grouped: Record<string, ExpenseListItem[]> = {}
  for (const item of paginatedExpenses) {
    const key = item.expenseDate.slice(0, 7) // YYYY-MM
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(item)
  }
  const sortedMonths = Object.keys(grouped).sort((a, b) => b.localeCompare(a))

  const monthLabel = (key: string) => {
    const [y, m] = key.split('-')
    const date = new Date(parseInt(y), parseInt(m) - 1)
    return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
  }

  return (
    <motion.div initial="hidden" animate="visible" className="space-y-6 px-4 lg:px-6 py-4 md:py-6">
      {/* Header */}
      <motion.div variants={fadeUp} custom={0} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Depenses</h1>
          <p className="text-muted-foreground mt-1">
            {items.length} depense{items.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-1.5" /> Nouvelle depense
        </Button>
      </motion.div>

      {/* Stats */}
      <motion.div variants={fadeUp} custom={1} className="grid grid-cols-1 gap-4 @xl/main:grid-cols-3">
        <div className="rounded-lg bg-overlay shadow-surface p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-danger-soft">
              <TrendingDown className="h-4.5 w-4.5 text-danger" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {totals.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
              </p>
              <p className="text-xs text-muted-foreground">Total HT</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg bg-overlay shadow-surface p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500/10">
              <Receipt className="h-4.5 w-4.5 text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {totals.vat.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
              </p>
              <p className="text-xs text-muted-foreground">TVA</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg bg-overlay shadow-surface p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft">
              <Wallet className="h-4.5 w-4.5 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {totals.ttc.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
              </p>
              <p className="text-xs text-muted-foreground">Total TTC</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Search */}
      <motion.div variants={fadeUp} custom={2} className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher une depense..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </motion.div>

      {/* List */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 rounded-lg bg-overlay shadow-surface p-4">
              <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
              <div className="flex-1 min-w-0 space-y-1.5">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div variants={fadeUp} custom={3} className="text-center py-16">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-surface-hover mx-auto mb-4">
            <Wallet className="h-8 w-8 text-muted-secondary" />
          </div>
          <p className="text-lg font-medium text-foreground">
            {search ? 'Aucun resultat' : 'Aucune depense'}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {search ? 'Essayez avec un autre terme' : 'Commencez par ajouter vos depenses professionnelles'}
          </p>
          {!search && (
            <Button className="mt-4" onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-1.5" /> Nouvelle depense
            </Button>
          )}
        </motion.div>
      ) : (
        <div className="space-y-6">
          {sortedMonths.map((monthKey, mi) => (
            <motion.div key={monthKey} variants={fadeUp} custom={3 + mi * 0.3}>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2 capitalize">
                {monthLabel(monthKey)}
              </h3>
              <div className="space-y-2">
                {grouped[monthKey].map((item) => (
                  <div key={item.id} className="w-full flex items-center gap-4 rounded-lg bg-overlay shadow-surface hover:bg-surface-hover p-4 transition-colors group">
                    {/* Icon */}
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                      style={{ backgroundColor: item.categoryColor ? `${item.categoryColor}15` : undefined }}
                    >
                      <Wallet
                        className="h-5 w-5"
                        style={{ color: item.categoryColor || undefined }}
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => handleEdit(item)}>
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-semibold text-foreground truncate">{item.description}</p>
                        {item.categoryName && (
                          <Badge variant="muted" className="text-[10px] shrink-0">
                            {item.categoryName}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {item.supplier && <span className="truncate">{item.supplier}</span>}
                        <span className="flex items-center gap-1 shrink-0">
                          <CalendarDays className="h-3 w-3" />
                          {new Date(item.expenseDate).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    </div>

                    {/* Amount */}
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-foreground">
                        {Number(item.amount).toLocaleString('fr-FR', { style: 'currency', currency: item.currency || 'EUR' })}
                      </p>
                      <p className="text-xs text-muted-foreground">HT</p>
                    </div>

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
                      <DropdownSeparator />
                      <DropdownItem destructive onClick={() => setDeleteConfirm(item)}>
                        <Trash2 className="h-4 w-4" /> Supprimer
                      </DropdownItem>
                    </Dropdown>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <ExpensePanel
        open={panelOpen}
        expense={editingExpense}
        onClose={() => { setPanelOpen(false); setEditingExpense(null) }}
        onSaved={handlePanelSaved}
      />

      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} className="max-w-sm">
        <DialogHeader showClose={false}>
          <DialogTitle>Supprimer la depense</DialogTitle>
          <DialogDescription>
            Etes-vous sur de vouloir supprimer cette depense ? Cette action est irreversible.
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

      <Pagination meta={expensePaginationMeta} onPageChange={(p) => { setPage(p); window.scrollTo(0, 0) }} />
    </motion.div>
  )
}
