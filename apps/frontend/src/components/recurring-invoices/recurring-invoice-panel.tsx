'use client'

import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { SelectRoot, SelectTrigger, SelectValue, SelectIndicator, SelectPopover } from '@/components/ui/select'
import { ListBoxRoot as ListBox, ListBoxItemRoot as ListBoxItem } from '@/components/ui/list-box'
import { Spinner } from '@/components/ui/spinner'
import { useToast } from '@/components/ui/toast'
import { api } from '@/lib/api'
import { X, RefreshCw, Plus, Trash2 } from 'lucide-react'

interface RecurringInvoicePanelProps {
  open: boolean
  editingId: string | null
  onClose: () => void
  onSaved: () => void
}

interface ClientOption {
  id: string
  displayName: string
}

interface LineForm {
  description: string
  saleType: string
  quantity: string
  unit: string
  unitPrice: string
  vatRate: string
}

const emptyLine: LineForm = {
  description: '',
  saleType: '',
  quantity: '1',
  unit: '',
  unitPrice: '',
  vatRate: '20',
}

const slideVariants = {
  hidden: { x: '100%', opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { type: 'spring' as const, damping: 30, stiffness: 300 } },
  exit: { x: '100%', opacity: 0, transition: { duration: 0.2 } },
}

const frequencyOptions = [
  { value: 'weekly', label: 'Hebdomadaire' },
  { value: 'monthly', label: 'Mensuelle' },
  { value: 'quarterly', label: 'Trimestrielle' },
  { value: 'yearly', label: 'Annuelle' },
  { value: 'custom', label: 'Personnalisee' },
]

export function RecurringInvoicePanel({ open, editingId, onClose, onSaved }: RecurringInvoicePanelProps) {
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [clients, setClients] = useState<ClientOption[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const [name, setName] = useState('')
  const [frequency, setFrequency] = useState('monthly')
  const [customIntervalDays, setCustomIntervalDays] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [dueDays, setDueDays] = useState('30')

  const [clientId, setClientId] = useState('')

  const [subject, setSubject] = useState('')
  const [notes, setNotes] = useState('')
  const [paymentTerms, setPaymentTerms] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('')

  const [lines, setLines] = useState<LineForm[]>([{ ...emptyLine }])

  const isEditing = !!editingId

  const loadClients = useCallback(async () => {
    const { data } = await api.get<{ clients: ClientOption[] }>('/clients')
    if (data?.clients) setClients(data.clients)
  }, [])

  useEffect(() => {
    if (!open) return
    loadClients()

    if (editingId) {
      setLoadingDetail(true)
      api.get<{ recurringInvoice: any }>(`/recurring-invoices/${editingId}`).then(({ data }) => {
        if (data?.recurringInvoice) {
          const r = data.recurringInvoice
          setName(r.name || '')
          setFrequency(r.frequency || 'monthly')
          setCustomIntervalDays(r.customIntervalDays ? String(r.customIntervalDays) : '')
          setStartDate(r.startDate || '')
          setEndDate(r.endDate || '')
          setDueDays(r.dueDays != null ? String(r.dueDays) : '30')
          setClientId(r.clientId || '')
          setSubject(r.subject || '')
          setNotes(r.notes || '')
          setPaymentTerms(r.paymentTerms || '')
          setPaymentMethod(r.paymentMethod || '')
          if (r.lines && r.lines.length > 0) {
            setLines(
              r.lines.map((l: any) => ({
                description: l.description || '',
                saleType: l.saleType || '',
                quantity: String(l.quantity),
                unit: l.unit || '',
                unitPrice: String(l.unitPrice),
                vatRate: String(l.vatRate),
              }))
            )
          }
        }
        setLoadingDetail(false)
      })
    } else {
      // Reset form for create
      setName('')
      setFrequency('monthly')
      setCustomIntervalDays('')
      setStartDate(new Date().toISOString().slice(0, 10))
      setEndDate('')
      setDueDays('30')
      setClientId('')
      setSubject('')
      setNotes('')
      setPaymentTerms('')
      setPaymentMethod('')
      setLines([{ ...emptyLine }])
    }
  }, [open, editingId, loadClients])

  function updateLine(index: number, field: keyof LineForm, value: string) {
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, [field]: value } : l)))
  }

  function addLine() {
    setLines((prev) => [...prev, { ...emptyLine }])
  }

  function removeLine(index: number) {
    setLines((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)))
  }

  const subtotal = lines.reduce((sum, l) => {
    const qty = parseFloat(l.quantity) || 0
    const price = parseFloat(l.unitPrice) || 0
    return sum + qty * price
  }, 0)

  const taxTotal = lines.reduce((sum, l) => {
    const qty = parseFloat(l.quantity) || 0
    const price = parseFloat(l.unitPrice) || 0
    const vat = parseFloat(l.vatRate) || 0
    return sum + qty * price * (vat / 100)
  }, 0)

  const total = subtotal + taxTotal

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || lines.length === 0) return

    setSaving(true)

    const body = {
      name: name.trim(),
      frequency,
      customIntervalDays: frequency === 'custom' ? parseInt(customIntervalDays) || 30 : undefined,
      startDate,
      endDate: endDate || undefined,
      dueDays: parseInt(dueDays) || 30,
      clientId: clientId || undefined,
      subject: subject.trim() || undefined,
      notes: notes.trim() || undefined,
      paymentTerms: paymentTerms.trim() || undefined,
      paymentMethod: paymentMethod.trim() || undefined,
      billingType: 'detailed',
      accentColor: '#4F46E5',
      language: 'fr',
      lines: lines.map((l) => ({
        description: l.description.trim(),
        saleType: l.saleType || undefined,
        quantity: parseFloat(l.quantity) || 1,
        unit: l.unit || undefined,
        unitPrice: parseFloat(l.unitPrice) || 0,
        vatRate: parseFloat(l.vatRate) || 0,
      })),
    }

    if (isEditing) {
      const { error } = await api.put(`/recurring-invoices/${editingId}`, body)
      setSaving(false)
      if (error) { toast(error, 'error'); return }
      toast('Recurrence mise a jour')
    } else {
      const { error } = await api.post('/recurring-invoices', body)
      setSaving(false)
      if (error) { toast(error, 'error'); return }
      toast('Recurrence creee')
    }

    onSaved()
  }

  const content = (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            variants={slideVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-y-0 right-0 z-[100] w-full max-w-2xl bg-white dark:bg-card/40 dark:backdrop-blur-2xl border-l border-border/20 dark:border-border/40 dark:liquid-glass flex flex-col overflow-hidden shadow-xl dark:shadow-none rounded-l-3xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/20 dark:border-border/40 relative z-10 dark:bg-card/20 dark:backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <RefreshCw className="h-4.5 w-4.5 text-primary" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">
                  {isEditing ? 'Modifier la récurrence' : 'Nouvelle récurrence'}
                </h2>
              </div>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted transition-colors">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            {loadingDetail ? (
              <div className="flex-1 flex items-center justify-center">
                <Spinner className="h-6 w-6" />
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
                {/* Recurring settings */}
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3">Parametres de recurrence</h3>
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="recName">Nom *</FieldLabel>
                      <Input
                        id="recName"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ex: Maintenance mensuelle, Abonnement..."
                        required
                        autoFocus
                      />
                    </Field>

                    <div className="grid grid-cols-2 gap-4">
                      <Field>
                        <FieldLabel htmlFor="recFrequency">Fréquence *</FieldLabel>
                        <SelectRoot selectedKey={frequency} onSelectionChange={(k) => setFrequency(k as string)}>
                          <SelectTrigger id="recFrequency">
                            <SelectValue />
                            <SelectIndicator />
                          </SelectTrigger>
                          <SelectPopover>
                            <ListBox>
                              {frequencyOptions.map((o) => (
                                <ListBoxItem key={o.value} id={o.value}>{o.label}</ListBoxItem>
                              ))}
                            </ListBox>
                          </SelectPopover>
                        </SelectRoot>
                      </Field>

                      {frequency === 'custom' && (
                        <Field>
                          <FieldLabel htmlFor="recCustomDays">Intervalle (jours)</FieldLabel>
                          <Input
                            id="recCustomDays"
                            type="number"
                            min="1"
                            value={customIntervalDays}
                            onChange={(e) => setCustomIntervalDays(e.target.value)}
                            placeholder="30"
                          />
                        </Field>
                      )}

                      <Field>
                        <FieldLabel htmlFor="recDueDays">Delai de paiement (jours)</FieldLabel>
                        <Input
                          id="recDueDays"
                          type="number"
                          min="0"
                          value={dueDays}
                          onChange={(e) => setDueDays(e.target.value)}
                          placeholder="30"
                        />
                      </Field>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <Field>
                        <FieldLabel htmlFor="recStartDate">Date de debut *</FieldLabel>
                        <Input
                          id="recStartDate"
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          required
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="recEndDate">Date de fin</FieldLabel>
                        <Input
                          id="recEndDate"
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                        />
                      </Field>
                    </div>
                  </FieldGroup>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3">Client</h3>
                  <Field>
                    <SelectRoot selectedKey={clientId} onSelectionChange={(k) => setClientId(k === 'none' ? '' : k as string)}>
                      <SelectTrigger>
                        <SelectValue />
                        <SelectIndicator />
                      </SelectTrigger>
                      <SelectPopover>
                        <ListBox>
                          <ListBoxItem id="none">Aucun client</ListBoxItem>
                          {clients.map((c) => (
                            <ListBoxItem key={c.id} id={c.id}>{c.displayName}</ListBoxItem>
                          ))}
                        </ListBox>
                      </SelectPopover>
                    </SelectRoot>
                  </Field>
                </div>

                {/* Invoice template fields */}
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3">Modele de facture</h3>
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="recSubject">Objet</FieldLabel>
                      <Input
                        id="recSubject"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="Objet de la facture generee"
                      />
                    </Field>

                    <div className="grid grid-cols-2 gap-4">
                      <Field>
                        <FieldLabel htmlFor="recPaymentTerms">Conditions de paiement</FieldLabel>
                        <Input
                          id="recPaymentTerms"
                          value={paymentTerms}
                          onChange={(e) => setPaymentTerms(e.target.value)}
                          placeholder="Ex: 30 jours net"
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="recPaymentMethod">Mode de paiement</FieldLabel>
                        <SelectRoot selectedKey={paymentMethod} onSelectionChange={(k) => setPaymentMethod(k === 'none' ? '' : k as string)}>
                          <SelectTrigger id="recPaymentMethod">
                            <SelectValue />
                            <SelectIndicator />
                          </SelectTrigger>
                          <SelectPopover>
                            <ListBox>
                              <ListBoxItem id="none">Non défini</ListBoxItem>
                              <ListBoxItem id="bank_transfer">Virement bancaire</ListBoxItem>
                              <ListBoxItem id="check">Chèque</ListBoxItem>
                              <ListBoxItem id="cash">Espèces</ListBoxItem>
                              <ListBoxItem id="card">Carte bancaire</ListBoxItem>
                              <ListBoxItem id="direct_debit">Prélèvement</ListBoxItem>
                            </ListBox>
                          </SelectPopover>
                        </SelectRoot>
                      </Field>
                    </div>

                    <Field>
                      <FieldLabel htmlFor="recNotes">Notes</FieldLabel>
                      <Textarea
                        id="recNotes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Notes visibles sur la facture"
                        rows={2}
                      />
                    </Field>
                  </FieldGroup>
                </div>

                {/* Lines */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-foreground">Lignes de facturation</h3>
                    <button
                      type="button"
                      onClick={addLine}
                      className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" /> Ajouter
                    </button>
                  </div>

                  <div className="space-y-3">
                    {lines.map((line, idx) => (
                      <div key={idx} className="rounded-lg border border-border bg-card/30 p-3 space-y-2">
                        <div className="flex items-start gap-2">
                          <div className="flex-1">
                            <Input
                              value={line.description}
                              onChange={(e) => updateLine(idx, 'description', e.target.value)}
                              placeholder="Description *"
                              className="text-sm"
                            />
                          </div>
                          {lines.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeLine(idx)}
                              className="p-1.5 rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors shrink-0 mt-1"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={line.quantity}
                            onChange={(e) => updateLine(idx, 'quantity', e.target.value)}
                            placeholder="Qte"
                            className="text-sm"
                          />
                          <SelectRoot selectedKey={line.unit} onSelectionChange={(k) => updateLine(idx, 'unit', k === 'none' ? '' : k as string)}>
                            <SelectTrigger className="text-sm">
                              <SelectValue />
                              <SelectIndicator />
                            </SelectTrigger>
                            <SelectPopover>
                              <ListBox>
                                <ListBoxItem id="none">Unité</ListBoxItem>
                                <ListBoxItem id="heure">Heure</ListBoxItem>
                                <ListBoxItem id="jour">Jour</ListBoxItem>
                                <ListBoxItem id="unite">Unité</ListBoxItem>
                                <ListBoxItem id="forfait">Forfait</ListBoxItem>
                                <ListBoxItem id="mois">Mois</ListBoxItem>
                              </ListBox>
                            </SelectPopover>
                          </SelectRoot>
                          <Input
                            type="number"
                            step="0.01"
                            value={line.unitPrice}
                            onChange={(e) => updateLine(idx, 'unitPrice', e.target.value)}
                            placeholder="Prix HT"
                            className="text-sm"
                          />
                          <SelectRoot selectedKey={line.vatRate} onSelectionChange={(k) => updateLine(idx, 'vatRate', k as string)}>
                            <SelectTrigger className="text-sm">
                              <SelectValue />
                              <SelectIndicator />
                            </SelectTrigger>
                            <SelectPopover>
                              <ListBox>
                                <ListBoxItem id="20">20%</ListBoxItem>
                                <ListBoxItem id="10">10%</ListBoxItem>
                                <ListBoxItem id="5.5">5.5%</ListBoxItem>
                                <ListBoxItem id="2.1">2.1%</ListBoxItem>
                                <ListBoxItem id="0">0%</ListBoxItem>
                              </ListBox>
                            </SelectPopover>
                          </SelectRoot>
                        </div>
                        <div className="text-right text-xs text-muted-foreground">
                          Ligne : {((parseFloat(line.quantity) || 0) * (parseFloat(line.unitPrice) || 0)).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })} HT
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Totals */}
                  <div className="mt-4 rounded-lg border border-border bg-card/50 p-3 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Sous-total HT</span>
                      <span className="font-medium text-foreground">{subtotal.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">TVA</span>
                      <span className="font-medium text-foreground">{taxTotal.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</span>
                    </div>
                    <div className="flex justify-between text-sm font-semibold border-t border-border pt-1">
                      <span className="text-foreground">Total TTC</span>
                      <span className="text-foreground">{total.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</span>
                    </div>
                  </div>
                </div>
              </form>
            )}

            {/* Footer */}
            <div className="px-6 py-4 border-t border-border/20 dark:border-border/40 relative z-10 dark:bg-card/20 dark:backdrop-blur-md flex items-center justify-end gap-3">
              <Button variant="outline" onClick={onClose} type="button">
                Annuler
              </Button>
              <Button onClick={handleSubmit} disabled={saving || !name.trim() || lines.length === 0}>
                {saving ? <><Spinner /> Enregistrement...</> : isEditing ? 'Mettre à jour' : 'Créer'}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )

  if (!mounted) return null
  return createPortal(content, document.body)
}
