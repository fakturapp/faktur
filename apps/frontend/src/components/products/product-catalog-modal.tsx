'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Dialog, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/lib/api'
import { Search, Package, Briefcase, ShoppingBag, Check } from 'lucide-react'

export interface CatalogProduct {
  id: string
  name: string
  description: string | null
  unitPrice: number
  vatRate: string
  unit: string | null
  saleType: string | null
  reference: string | null
}

interface ProductCatalogModalProps {
  open: boolean
  onClose: () => void
  onSelect: (product: CatalogProduct) => void
}

const unitLabels: Record<string, string> = {
  heure: 'h',
  jour: 'j',
  unité: 'u',
  forfait: 'forfait',
  mois: 'mois',
  an: 'an',
}

export function ProductCatalogModal({ open, onClose, onSelect }: ProductCatalogModalProps) {
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState<CatalogProduct[]>([])
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setSearch('')
      setSelectedId(null)
      loadProducts()
    }
  }, [open])

  async function loadProducts() {
    setLoading(true)
    const { data } = await api.get<{ products: CatalogProduct[] }>('/products?archived=false')
    if (data?.products) {
      setProducts(data.products)
    }
    setLoading(false)
  }

  function handleSelect(product: CatalogProduct) {
    setSelectedId(product.id)
    onSelect(product)
    onClose()
  }

  const filtered = products.filter((p) => {
    if (!search) return true
    const s = search.toLowerCase()
    return (
      p.name.toLowerCase().includes(s) ||
      p.reference?.toLowerCase().includes(s) ||
      p.description?.toLowerCase().includes(s)
    )
  })

  return (
    <Dialog open={open} onClose={onClose} className="max-w-lg">
      <DialogTitle>Choisir depuis le catalogue</DialogTitle>
      <DialogDescription>
        Sélectionnez un produit ou service pour pré-remplir la ligne
      </DialogDescription>

      <div className="mt-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un produit..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
            autoFocus
          />
        </div>

        {/* List */}
        <div className="max-h-[400px] overflow-y-auto space-y-1.5">
          {loading ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg">
                <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
            ))
          ) : filtered.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                {search ? 'Aucun résultat' : 'Aucun produit dans le catalogue'}
              </p>
            </div>
          ) : (
            filtered.map((product) => (
              <button
                key={product.id}
                onClick={() => handleSelect(product)}
                className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors text-left"
              >
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                  product.saleType === 'service' ? 'bg-blue-500/10' : 'bg-green-500/10'
                }`}>
                  {product.saleType === 'service' ? (
                    <Briefcase className="h-4 w-4 text-blue-500" />
                  ) : (
                    <ShoppingBag className="h-4 w-4 text-green-500" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground truncate">{product.name}</p>
                    {product.reference && (
                      <Badge variant="muted" className="text-[10px]">{product.reference}</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    TVA {product.vatRate}%
                    {product.unit ? ` · ${unitLabels[product.unit] || product.unit}` : ''}
                  </p>
                </div>

                <p className="text-sm font-semibold text-foreground shrink-0">
                  {Number(product.unitPrice).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                </p>

                {selectedId === product.id && (
                  <Check className="h-4 w-4 text-primary shrink-0" />
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </Dialog>
  )
}
