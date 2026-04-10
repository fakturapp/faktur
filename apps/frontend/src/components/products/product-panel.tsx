'use client'

import { useState, useEffect } from 'react'
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
import { X, Package } from 'lucide-react'
import { useTrackFeature } from '@/hooks/use-analytics'
import type { ProductListItem } from '@/app/dashboard/products/page'

interface ProductPanelProps {
  open: boolean
  product: ProductListItem | null
  onClose: () => void
  onSaved: () => void
}

const slideVariants = {
  hidden: { x: '100%', opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { type: 'spring' as const, damping: 30, stiffness: 300 } },
  exit: { x: '100%', opacity: 0, transition: { duration: 0.2 } },
}

export function ProductPanel({ open, product, onClose, onSaved }: ProductPanelProps) {
  const { toast } = useToast()
  const trackFeature = useTrackFeature()
  const [saving, setSaving] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [unitPrice, setUnitPrice] = useState('')
  const [vatRate, setVatRate] = useState('20')
  const [unit, setUnit] = useState('')
  const [saleType, setSaleType] = useState('')
  const [reference, setReference] = useState('')

  const isEditing = !!product

  useEffect(() => {
    if (product) {
      setName(product.name)
      setDescription(product.description || '')
      setUnitPrice(String(product.unitPrice))
      setVatRate(product.vatRate)
      setUnit(product.unit || '')
      setSaleType(product.saleType || '')
      setReference(product.reference || '')
    } else {
      setName('')
      setDescription('')
      setUnitPrice('')
      setVatRate('20')
      setUnit('')
      setSaleType('')
      setReference('')
    }
  }, [product, open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return

    setSaving(true)

    const body = {
      name: name.trim(),
      description: description.trim() || null,
      unitPrice: parseFloat(unitPrice) || 0,
      vatRate,
      unit: unit || null,
      saleType: saleType || null,
      reference: reference.trim() || null,
    }

    if (isEditing) {
      const { error } = await api.put(`/products/${product!.id}`, body)
      setSaving(false)
      if (error) {
        toast(error, 'error')
        return
      }
      toast('Produit mis à jour')
    } else {
      const { error } = await api.post('/products', body)
      setSaving(false)
      if (error) {
        toast(error, 'error')
        return
      }
      trackFeature('product.create')
      toast('Produit créé')
    }

    onSaved()
  }

  const content = (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            variants={slideVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-y-0 right-0 z-[100] w-full max-w-lg bg-white dark:bg-card/40 dark:backdrop-blur-2xl border-l border-border/20 dark:border-border/40 dark:liquid-glass flex flex-col overflow-hidden shadow-xl dark:shadow-none rounded-l-3xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/20 dark:border-border/40 relative z-10 dark:bg-card/20 dark:backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <Package className="h-4.5 w-4.5 text-primary" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">
                  {isEditing ? 'Modifier le produit' : 'Nouveau produit'}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
                type="button"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="productName">Nom *</FieldLabel>
                  <Input
                    id="productName"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Consultation, Design logo..."
                    required
                    autoFocus
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="productDescription">Description</FieldLabel>
                  <Textarea
                    id="productDescription"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Description optionnelle du produit ou service"
                    rows={3}
                  />
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="productSaleType">Type</FieldLabel>
                    <SelectRoot selectedKey={saleType} onSelectionChange={(k) => setSaleType(k === 'none' ? '' : k as string)}>
                      <SelectTrigger id="productSaleType">
                        <SelectValue />
                        <SelectIndicator />
                      </SelectTrigger>
                      <SelectPopover>
                        <ListBox>
                          <ListBoxItem id="none">Non défini</ListBoxItem>
                          <ListBoxItem id="service">Service</ListBoxItem>
                          <ListBoxItem id="product">Produit</ListBoxItem>
                        </ListBox>
                      </SelectPopover>
                    </SelectRoot>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="productReference">Référence</FieldLabel>
                    <Input
                      id="productReference"
                      value={reference}
                      onChange={(e) => setReference(e.target.value)}
                      placeholder="REF-001"
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="productUnitPrice">Prix unitaire HT *</FieldLabel>
                    <Input
                      id="productUnitPrice"
                      type="number"
                      step="0.01"
                      min="0"
                      value={unitPrice}
                      onChange={(e) => setUnitPrice(e.target.value)}
                      placeholder="0.00"
                      required
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="productUnit">Unité</FieldLabel>
                    <SelectRoot selectedKey={unit} onSelectionChange={(k) => setUnit(k === 'none' ? '' : k as string)}>
                      <SelectTrigger id="productUnit">
                        <SelectValue />
                        <SelectIndicator />
                      </SelectTrigger>
                      <SelectPopover>
                        <ListBox>
                          <ListBoxItem id="none">Aucune</ListBoxItem>
                          <ListBoxItem id="heure">Heure</ListBoxItem>
                          <ListBoxItem id="jour">Jour</ListBoxItem>
                          <ListBoxItem id="unité">Unité</ListBoxItem>
                          <ListBoxItem id="forfait">Forfait</ListBoxItem>
                          <ListBoxItem id="mois">Mois</ListBoxItem>
                          <ListBoxItem id="an">An</ListBoxItem>
                        </ListBox>
                      </SelectPopover>
                    </SelectRoot>
                  </Field>
                </div>

                <Field className="mb-20">
                  <FieldLabel htmlFor="productVatRate">Taux de TVA</FieldLabel>
                  <SelectRoot selectedKey={vatRate} onSelectionChange={(k) => setVatRate(k as string)}>
                    <SelectTrigger id="productVatRate">
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
                </Field>
              </FieldGroup>
            </form>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-border/20 dark:border-border/40 relative z-10 dark:bg-card/20 dark:backdrop-blur-md flex items-center justify-end gap-3">
              <Button variant="outline" onClick={onClose} type="button">
                Annuler
              </Button>
              <Button onClick={handleSubmit} disabled={saving || !name.trim()}>
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
