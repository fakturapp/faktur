'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, type Variants } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/lib/api'
import {
  Plus,
  Search,
  Building2,
  UserRound,
  Mail,
  Phone,
  MapPin,
  Users,
  ChevronRight,
} from 'lucide-react'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
} satisfies Variants

interface ClientListItem {
  id: string
  type: 'company' | 'individual'
  displayName: string
  companyName: string | null
  firstName: string | null
  lastName: string | null
  email: string | null
  phone: string | null
  city: string | null
  country: string
  invoiceCount: number
  totalRevenue: number
  createdAt: string
}

export default function ClientsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [clients, setClients] = useState<ClientListItem[]>([])
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'company' | 'individual'>('all')

  useEffect(() => {
    loadClients()
  }, [])

  async function loadClients() {
    setLoading(true)
    const { data } = await api.get<{ clients: ClientListItem[] }>('/clients')
    if (data?.clients) {
      setClients(data.clients)
    }
    setLoading(false)
  }

  const filtered = clients.filter((c) => {
    const matchesSearch =
      !search ||
      c.displayName.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.city?.toLowerCase().includes(search.toLowerCase())
    const matchesType = filterType === 'all' || c.type === filterType
    return matchesSearch && matchesType
  })

  const companyCount = clients.filter((c) => c.type === 'company').length
  const individualCount = clients.filter((c) => c.type === 'individual').length

  return (
    <motion.div initial="hidden" animate="visible" className="space-y-6 px-4 lg:px-6 py-4 md:py-6">
      {/* Header */}
      <motion.div variants={fadeUp} custom={0} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Clients</h1>
          <p className="text-muted-foreground mt-1">
            {clients.length} client{clients.length !== 1 ? 's' : ''} au total
          </p>
        </div>
        <Link href="/dashboard/clients/create">
          <Button>
            <Plus className="h-4 w-4 mr-1.5" /> Nouveau client
          </Button>
        </Link>
      </motion.div>

      {/* Stats */}
      <motion.div variants={fadeUp} custom={1} className="grid grid-cols-1 gap-4 @xl/main:grid-cols-3">
        <div className="rounded-xl border border-border bg-card/50 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Users className="h-4.5 w-4.5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{clients.length}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card/50 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10">
              <Building2 className="h-4.5 w-4.5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{companyCount}</p>
              <p className="text-xs text-muted-foreground">Professionnels</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card/50 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-500/10">
              <UserRound className="h-4.5 w-4.5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{individualCount}</p>
              <p className="text-xs text-muted-foreground">Particuliers</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Search + filter */}
      <motion.div variants={fadeUp} custom={2} className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex rounded-lg border border-border bg-muted/30 p-0.5">
          {[
            { id: 'all' as const, label: 'Tous' },
            { id: 'company' as const, label: 'Pro' },
            { id: 'individual' as const, label: 'Part.' },
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

      {/* Client list */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 rounded-xl border border-border bg-card/50 p-4">
              <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-10 rounded-full" />
                </div>
                <div className="flex items-center gap-4">
                  <Skeleton className="h-3 w-36" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <div className="text-right space-y-1.5 shrink-0">
                <Skeleton className="h-4 w-20 ml-auto" />
                <Skeleton className="h-3 w-16 ml-auto" />
              </div>
              <Skeleton className="h-4 w-4 shrink-0" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div variants={fadeUp} custom={3} className="text-center py-16">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50 mx-auto mb-4">
            <Users className="h-8 w-8 text-muted-foreground/50" />
          </div>
          <p className="text-lg font-medium text-foreground">
            {search ? 'Aucun resultat' : 'Aucun client'}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {search
              ? 'Essayez avec un autre terme de recherche'
              : 'Commencez par ajouter votre premier client'}
          </p>
          {!search && (
            <Link href="/dashboard/clients/create">
              <Button className="mt-4">
                <Plus className="h-4 w-4 mr-1.5" /> Ajouter un client
              </Button>
            </Link>
          )}
        </motion.div>
      ) : (
        <div className="space-y-2">
          {filtered.map((client, i) => (
            <motion.div key={client.id} variants={fadeUp} custom={3 + i * 0.3}>
            <Link
              href={`/dashboard/clients/${client.id}/edit`}
              className="w-full flex items-center gap-4 rounded-xl border border-border bg-card/50 hover:bg-card/80 p-4 transition-colors text-left group"
            >
              {/* Icon */}
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                client.type === 'company' ? 'bg-blue-500/10' : 'bg-green-500/10'
              }`}>
                {client.type === 'company' ? (
                  <Building2 className="h-5 w-5 text-blue-500" />
                ) : (
                  <UserRound className="h-5 w-5 text-green-500" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {client.displayName}
                  </p>
                  <Badge variant="muted" className="text-[10px] shrink-0">
                    {client.type === 'company' ? 'Pro' : 'Part.'}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  {client.email && (
                    <span className="flex items-center gap-1 truncate">
                      <Mail className="h-3 w-3" /> {client.email}
                    </span>
                  )}
                  {client.phone && (
                    <span className="flex items-center gap-1 shrink-0">
                      <Phone className="h-3 w-3" /> {client.phone}
                    </span>
                  )}
                  {client.city && (
                    <span className="flex items-center gap-1 shrink-0">
                      <MapPin className="h-3 w-3" /> {client.city}
                    </span>
                  )}
                </div>
              </div>

              {/* Revenue + arrow */}
              <div className="text-right shrink-0">
                {client.totalRevenue > 0 && (
                  <p className="text-sm font-medium text-foreground">
                    {(client.totalRevenue / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  {client.invoiceCount} facture{client.invoiceCount !== 1 ? 's' : ''}
                </p>
              </div>

              <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors shrink-0" />
            </Link>
            </motion.div>
          ))}
        </div>
      )}

    </motion.div>
  )
}
