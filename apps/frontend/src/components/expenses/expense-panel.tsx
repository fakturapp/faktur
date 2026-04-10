'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { FormSelect } from '@/components/ui/dropdown'
import { Switch } from '@/components/ui/switch'
import { Spinner } from '@/components/ui/spinner'
import { useToast } from '@/components/ui/toast'
import { api } from '@/lib/api'
import { X, Wallet, Plus } from 'lucide-react'

interface ExpensePanelProps {
  open: boolean
  expense: ExpenseData | null
  onClose: () => void
  onSaved: () => void
}

interface ExpenseData {
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
}

interface CategoryOption {
  id: string
  name: string
  color: string | null
}

const slideVariants = {
  hidden: { x: '100%', opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { type: 'spring' as const, damping: 30, stiffness: 300 } },
  exit: { x: '100%', opacity: 0, transition: { duration: 0.2 } },
}

const vatRates = [
  { value: '0', label: '0%' },
  { value: '5.5', label: '5,5%' },
  { value: '10', label: '10%' },
  { value: '20', label: '20%' },
]

const paymentMethods = [
  { value: '', label: 'Non specifie' },
  { value: 'card', label: 'Carte bancaire' },
  { value: 'transfer', label: 'Virement' },
  { value: 'cash', label: 'Especes' },
  { value: 'check', label: 'Cheque' },
  { value: 'direct_debit', label: 'Prelevement' },
]

export function ExpensePanel({ open, expense, onClose, onSaved }: ExpensePanelProps) {
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [categories, setCategories] = useState<CategoryOption[]>([])
  const [newCategoryName, setNewCategoryName] = useState('')
  const [creatingCategory, setCreatingCategory] = useState(false)

  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [vatRate, setVatRate] = useState('20')
  const [currency, setCurrency] = useState('EUR')
  const [expenseDate, setExpenseDate] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('')
  const [supplier, setSupplier] = useState('')
  const [notes, setNotes] = useState('')
  const [isDeductible, setIsDeductible] = useState(true)
  const [categoryId, setCategoryId] = useState('')

  const isEditing = !!expense

  const loadCategories = useCallback(async () => {
    const { data } = await api.get<{ categories: CategoryOption[] }>('/expenses/categories')
    if (data?.categories) setCategories(data.categories)
  }, [])

  useEffect(() => {
    if (open) {
      loadCategories()
      if (expense) {
        setDescription(expense.description)
        setAmount(String(expense.amount))
        setVatRate(String(expense.vatRate))
        setCurrency(expense.currency || 'EUR')
        setExpenseDate(expense.expenseDate?.slice(0, 10) || '')
        setPaymentMethod(expense.paymentMethod || '')
        setSupplier(expense.supplier || '')
        setNotes(expense.notes || '')
        setIsDeductible(expense.isDeductible)
        setCategoryId(expense.categoryId || '')
      } else {
        setDescription('')
        setAmount('')
        setVatRate('20')
        setCurrency('EUR')
        setExpenseDate(new Date().toISOString().slice(0, 10))
        setPaymentMethod('')
        setSupplier('')
        setNotes('')
        setIsDeductible(true)
        setCategoryId('')
      }
    }
  }, [open, expense, loadCategories])

  async function handleCreateCategory() {
    if (!newCategoryName.trim()) return
    setCreatingCategory(true)
    const { data, error } = await api.post<{ category: CategoryOption }>('/expenses/categories', {
      name: newCategoryName.trim(),
    })
    setCreatingCategory(false)
    if (error) { toast(error, 'error'); return }
    if (data?.category) {
      setCategories((prev) => [...prev, data.category])
      setCategoryId(data.category.id)
      setNewCategoryName('')
    }
  }

  async function handleSave() {
    if (!description.trim()) { toast('La description est requise', 'error'); return }
    if (!amount || Number(amount) < 0) { toast('Le montant est invalide', 'error'); return }
    if (!expenseDate) { toast('La date est requise', 'error'); return }

    setSaving(true)
    const body = {
      description: description.trim(),
      amount: Number(amount),
      vatRate: Number(vatRate),
      currency,
      expenseDate,
      paymentMethod: paymentMethod || undefined,
      supplier: supplier.trim() || undefined,
      notes: notes.trim() || undefined,
      isDeductible,
      categoryId: categoryId || undefined,
    }

    const { error } = isEditing
      ? await api.put(`/expenses/${expense.id}`, body)
      : await api.post('/expenses', body)

    setSaving(false)
    if (error) { toast(error, 'error'); return }
    toast(isEditing ? 'Depense modifiee' : 'Depense creee')
    onSaved()
  }

  const computedVat = (Number(amount) || 0) * (Number(vatRate) || 0) / 100
  const computedTtc = (Number(amount) || 0) + computedVat

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed right-0 top-0 z-50 h-full w-full max-w-lg bg-background border-l border-border shadow-2xl flex flex-col"
            variants={slideVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <Wallet className="h-4.5 w-4.5 text-primary" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">
                  {isEditing ? 'Modifier la depense' : 'Nouvelle depense'}
                </h2>
              </div>
              <button onClick={onClose} className="rounded-md p-1.5 hover:bg-muted transition-colors">
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
              {/* Description */}
              <FieldGroup>
                <Field>
                  <FieldLabel>Description *</FieldLabel>
                  <Input
                    placeholder="Ex: Abonnement logiciel..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </Field>
              </FieldGroup>

              {/* Amount & VAT */}
              <FieldGroup>
                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel>Montant HT *</FieldLabel>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </Field>
                  <Field>
                    <FieldLabel>Taux TVA</FieldLabel>
                    <FormSelect
                      value={vatRate}
                      onChange={setVatRate}
                      options={vatRates}
                    />
                  </Field>
                </div>

                {/* Computed totals */}
                <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-2.5 text-sm">
                  <span className="text-muted-foreground">TVA</span>
                  <span className="font-medium text-foreground">
                    {computedVat.toLocaleString('fr-FR', { style: 'currency', currency })}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-primary/5 px-4 py-2.5 text-sm">
                  <span className="font-medium text-foreground">Total TTC</span>
                  <span className="font-bold text-foreground">
                    {computedTtc.toLocaleString('fr-FR', { style: 'currency', currency })}
                  </span>
                </div>
              </FieldGroup>

              {/* Date & Payment */}
              <FieldGroup>
                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel>Date *</FieldLabel>
                    <Input
                      type="date"
                      value={expenseDate}
                      onChange={(e) => setExpenseDate(e.target.value)}
                    />
                  </Field>
                  <Field>
                    <FieldLabel>Moyen de paiement</FieldLabel>
                    <FormSelect
                      value={paymentMethod}
                      onChange={setPaymentMethod}
                      options={paymentMethods}
                    />
                  </Field>
                </div>
              </FieldGroup>

              {/* Supplier */}
              <FieldGroup>
                <Field>
                  <FieldLabel>Fournisseur</FieldLabel>
                  <Input
                    placeholder="Nom du fournisseur"
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                  />
                </Field>
              </FieldGroup>

              {/* Category */}
              <FieldGroup>
                <Field>
                  <FieldLabel>Categorie</FieldLabel>
                  <FormSelect
                    value={categoryId}
                    onChange={setCategoryId}
                    options={[
                      { value: '', label: 'Sans categorie' },
                      ...categories.map((cat) => ({ value: cat.id, label: cat.name })),
                    ]}
                  />
                </Field>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Nouvelle categorie..."
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateCategory()}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={creatingCategory || !newCategoryName.trim()}
                    onClick={handleCreateCategory}
                  >
                    {creatingCategory ? <Spinner className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </FieldGroup>

              {/* Notes */}
              <FieldGroup>
                <Field>
                  <FieldLabel>Notes</FieldLabel>
                  <Textarea
                    placeholder="Notes supplementaires..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </Field>
              </FieldGroup>

              {/* Deductible toggle */}
              <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-foreground">Deductible</p>
                  <p className="text-xs text-muted-foreground">Cette depense est deductible fiscalement</p>
                </div>
                <Switch checked={isDeductible} onChange={setIsDeductible} />
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-border px-6 py-4 flex items-center gap-3">
              <Button variant="outline" className="flex-1" onClick={onClose}>
                Annuler
              </Button>
              <Button className="flex-1" disabled={saving} onClick={handleSave}>
                {saving ? <Spinner className="h-4 w-4" /> : isEditing ? 'Enregistrer' : 'Creer'}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
