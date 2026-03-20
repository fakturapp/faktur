'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Select } from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { useToast } from '@/components/ui/toast'
import { api } from '@/lib/api'
import { X, Package } from 'lucide-react'
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
  const [saving, setSaving] = useState(false)

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
      toast('Produit créé')
    }

    onSaved()
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            variants={slideVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-background border-l border-border shadow-xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
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
                    <Select
                      id="productSaleType"
                      value={saleType}
                      onChange={(e) => setSaleType(e.target.value)}
                    >
                      <option value="">Non défini</option>
                      <option value="service">Service</option>
                      <option value="product">Produit</option>
                    </Select>
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
                    <Select
                      id="productUnit"
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                    >
                      <option value="">Aucune</option>
                      <option value="heure">Heure</option>
                      <option value="jour">Jour</option>
                      <option value="unité">Unité</option>
                      <option value="forfait">Forfait</option>
                      <option value="mois">Mois</option>
                      <option value="an">An</option>
                    </Select>
                  </Field>
                </div>

                <Field>
                  <FieldLabel htmlFor="productVatRate">Taux de TVA</FieldLabel>
                  <Select
                    id="productVatRate"
                    value={vatRate}
                    onChange={(e) => setVatRate(e.target.value)}
                  >
                    <option value="20">20%</option>
                    <option value="10">10%</option>
                    <option value="5.5">5,5%</option>
                    <option value="2.1">2,1%</option>
                    <option value="0">0%</option>
                  </Select>
                </Field>
              </FieldGroup>
            </form>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-3">
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
}
