'use client'

import { useState, useEffect } from 'react'
import { motion, type Variants } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/lib/api'
import { ProductPanel } from '@/components/products/product-panel'
import {
  Plus,
  Search,
  Package,
  Briefcase,
  ShoppingBag,
  Archive,
  MoreHorizontal,
  Pencil,
  Trash2,
  ArchiveRestore,
} from 'lucide-react'
import { Dropdown, DropdownItem, DropdownSeparator } from '@/components/ui/dropdown'
import { useToast } from '@/components/ui/toast'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
} satisfies Variants

export interface ProductListItem {
  id: string
  name: string
  description: string | null
  unitPrice: number
  vatRate: string
  unit: string | null
  saleType: string | null
  reference: string | null
  isArchived: boolean
  createdAt: string
}

const unitLabels: Record<string, string> = {
  heure: 'h',
  jour: 'j',
  unité: 'u',
  forfait: 'forfait',
  mois: 'mois',
  an: 'an',
}

export default function ProductsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState<ProductListItem[]>([])
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'service' | 'product' | 'archived'>('all')
  const [panelOpen, setPanelOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<ProductListItem | null>(null)

  useEffect(() => {
    loadProducts()
  }, [filterType])

  async function loadProducts() {
    setLoading(true)
    const archived = filterType === 'archived' ? 'true' : 'false'
    const { data } = await api.get<{ products: ProductListItem[] }>(`/products?archived=${archived}`)
    if (data?.products) {
      setProducts(data.products)
    }
    setLoading(false)
  }

  async function handleDelete(product: ProductListItem) {
    const { error } = await api.delete(`/products/${product.id}`)
    if (error) {
      toast(error, 'error')
      return
    }
    toast('Produit supprimé')
    loadProducts()
  }

  async function handleToggleArchive(product: ProductListItem) {
    const { error } = await api.put(`/products/${product.id}`, { isArchived: !product.isArchived })
    if (error) {
      toast(error, 'error')
      return
    }
    toast(product.isArchived ? 'Produit restauré' : 'Produit archivé')
    loadProducts()
  }

  function handleEdit(product: ProductListItem) {
    setEditingProduct(product)
    setPanelOpen(true)
  }

  function handleCreate() {
    setEditingProduct(null)
    setPanelOpen(true)
  }

  function handlePanelClose() {
    setPanelOpen(false)
    setEditingProduct(null)
  }

  function handlePanelSaved() {
    handlePanelClose()
    loadProducts()
  }

  const filtered = products.filter((p) => {
    const matchesSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.reference?.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase())
    if (filterType === 'archived') return matchesSearch
    const matchesType = filterType === 'all' || p.saleType === filterType
    return matchesSearch && matchesType
  })

  const serviceCount = products.filter((p) => p.saleType === 'service' && !p.isArchived).length
  const productCount = products.filter((p) => p.saleType === 'product' && !p.isArchived).length

  return (
    <motion.div initial="hidden" animate="visible" className="space-y-6 px-4 lg:px-6 py-4 md:py-6">
      {/* Header */}
      <motion.div variants={fadeUp} custom={0} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Catalogue</h1>
          <p className="text-muted-foreground mt-1">
            {products.length} produit{products.length !== 1 ? 's' : ''} / service{products.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-1.5" /> Nouveau produit
        </Button>
      </motion.div>

      {/* Stats */}
      <motion.div variants={fadeUp} custom={1} className="grid grid-cols-1 gap-4 @xl/main:grid-cols-3">
        <div className="rounded-xl border border-border bg-card/50 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Package className="h-4.5 w-4.5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{products.filter((p) => !p.isArchived).length}</p>
              <p className="text-xs text-muted-foreground">Total actifs</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card/50 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10">
              <Briefcase className="h-4.5 w-4.5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{serviceCount}</p>
              <p className="text-xs text-muted-foreground">Services</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card/50 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-500/10">
              <ShoppingBag className="h-4.5 w-4.5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{productCount}</p>
              <p className="text-xs text-muted-foreground">Produits</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Search + filter */}
      <motion.div variants={fadeUp} custom={2} className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un produit ou service..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex rounded-lg border border-border bg-muted/30 p-0.5">
          {[
            { id: 'all' as const, label: 'Tous' },
            { id: 'service' as const, label: 'Services' },
            { id: 'product' as const, label: 'Produits' },
            { id: 'archived' as const, label: 'Archivés' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                filterType === f.id
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Product list */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 rounded-xl border border-border bg-card/50 p-4">
              <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
              <div className="flex-1 min-w-0 space-y-1.5">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-4" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div variants={fadeUp} custom={3} className="text-center py-16">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50 mx-auto mb-4">
            <Package className="h-8 w-8 text-muted-foreground/50" />
          </div>
          <p className="text-lg font-medium text-foreground">
            {search ? 'Aucun résultat' : filterType === 'archived' ? 'Aucun produit archivé' : 'Aucun produit'}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {search
              ? 'Essayez avec un autre terme de recherche'
              : 'Commencez par ajouter votre premier produit ou service'}
          </p>
          {!search && filterType !== 'archived' && (
            <Button className="mt-4" onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-1.5" /> Ajouter un produit
            </Button>
          )}
        </motion.div>
      ) : (
        <div className="space-y-2">
          {filtered.map((product, i) => (
            <motion.div key={product.id} variants={fadeUp} custom={3 + i * 0.3}>
              <div
                onClick={() => handleEdit(product)}
                className="w-full flex items-center gap-4 rounded-xl border border-border bg-card/50 hover:bg-card/80 p-4 transition-colors text-left cursor-pointer group"
              >
                {/* Icon */}
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                  product.isArchived
                    ? 'bg-muted'
                    : product.saleType === 'service'
                      ? 'bg-blue-500/10'
                      : 'bg-green-500/10'
                }`}>
                  {product.isArchived ? (
                    <Archive className="h-5 w-5 text-muted-foreground" />
                  ) : product.saleType === 'service' ? (
                    <Briefcase className="h-5 w-5 text-blue-500" />
                  ) : (
                    <ShoppingBag className="h-5 w-5 text-green-500" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {product.name}
                    </p>
                    {product.reference && (
                      <Badge variant="muted" className="text-[10px] shrink-0">
                        {product.reference}
                      </Badge>
                    )}
                    {product.isArchived && (
                      <Badge variant="muted" className="text-[10px] shrink-0">
                        Archivé
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {product.saleType && (
                      <span>{product.saleType === 'service' ? 'Service' : 'Produit'}</span>
                    )}
                    {product.unit && (
                      <span>/ {unitLabels[product.unit] || product.unit}</span>
                    )}
                    <span>TVA {product.vatRate}%</span>
                  </div>
                </div>

                {/* Price */}
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-foreground">
                    {Number(product.unitPrice).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    HT{product.unit ? ` / ${unitLabels[product.unit] || product.unit}` : ''}
                  </p>
                </div>

                {/* Actions */}
                <div onClick={(e) => e.stopPropagation()}>
                  <Dropdown
                    align="right"
                    trigger={
                      <button className="p-1.5 rounded-md hover:bg-muted transition-colors">
                        <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                      </button>
                    }
                  >
                    <DropdownItem onClick={() => handleEdit(product)}>
                      <Pencil className="h-4 w-4" /> Modifier
                    </DropdownItem>
                    <DropdownItem onClick={() => handleToggleArchive(product)}>
                      {product.isArchived ? (
                        <><ArchiveRestore className="h-4 w-4" /> Restaurer</>
                      ) : (
                        <><Archive className="h-4 w-4" /> Archiver</>
                      )}
                    </DropdownItem>
                    <DropdownSeparator />
                    <DropdownItem destructive onClick={() => handleDelete(product)}>
                      <Trash2 className="h-4 w-4" /> Supprimer
                    </DropdownItem>
                  </Dropdown>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create/Edit panel */}
      <ProductPanel
        open={panelOpen}
        product={editingProduct}
        onClose={handlePanelClose}
        onSaved={handlePanelSaved}
      />
    </motion.div>
  )
}
