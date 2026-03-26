'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/toast'
import { PhoneInput } from '@/components/ui/phone-input'
import { api } from '@/lib/api'
import {
  ArrowLeft,
  Building2,
  UserRound,
  Mail,
  Phone,
  MapPin,
  StickyNote,
  Save,
  Trash2,
  FileText,
  Receipt,
} from 'lucide-react'

interface Client {
  id: string
  type: 'company' | 'individual'
  companyName: string | null
  firstName: string | null
  lastName: string | null
  siren: string | null
  siret: string | null
  vatNumber: string | null
  email: string | null
  phone: string | null
  includeInEmails: boolean
  address: string | null
  addressComplement: string | null
  postalCode: string | null
  city: string | null
  country: string
  notes: string | null
  invoiceCount: number
  quoteCount: number
  totalRevenue: number
  createdAt: string
}

const tabItems = [
  { id: 'info', label: 'Informations', icon: Building2 },
  { id: 'contacts', label: 'Contacts', icon: Mail },
  { id: 'notes', label: 'Notes', icon: StickyNote },
]

export default function ClientEditPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('info')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [client, setClient] = useState<Client | null>(null)

  const [form, setForm] = useState({
    companyName: '', firstName: '', lastName: '',
    siren: '', siret: '', vatNumber: '',
    email: '', phone: '', includeInEmails: true,
    address: '', addressComplement: '', postalCode: '', city: '', country: 'FR',
    notes: '',
  })

  const [addressSuggestions, setAddressSuggestions] = useState<{ label: string; name: string; postcode: string; city: string }[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const addressDebounce = useRef<ReturnType<typeof setTimeout>>(undefined)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  const searchAddress = useCallback((query: string) => {
    if (addressDebounce.current) clearTimeout(addressDebounce.current)
    if (query.length < 3) { setAddressSuggestions([]); setShowSuggestions(false); return }
    addressDebounce.current = setTimeout(async () => {
      try {
        const res = await fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&limit=5`)
        const data = await res.json()
        if (data?.features?.length) {
          setAddressSuggestions(data.features.map((f: any) => ({
            label: f.properties.label,
            name: f.properties.name,
            postcode: f.properties.postcode,
            city: f.properties.city,
          })))
          setShowSuggestions(true)
        } else {
          setAddressSuggestions([])
          setShowSuggestions(false)
        }
      } catch { setAddressSuggestions([]); setShowSuggestions(false) }
    }, 300)
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => { loadClient() }, [id])

  async function loadClient() {
    setLoading(true)
    const { data } = await api.get<{ client: Client }>(`/clients/${id}`)
    if (data?.client) {
      setClient(data.client)
      setForm({
        companyName: data.client.companyName || '',
        firstName: data.client.firstName || '',
        lastName: data.client.lastName || '',
        siren: data.client.siren || '',
        siret: data.client.siret || '',
        vatNumber: data.client.vatNumber || '',
        email: data.client.email || '',
        phone: data.client.phone || '',
        includeInEmails: data.client.includeInEmails,
        address: data.client.address || '',
        addressComplement: data.client.addressComplement || '',
        postalCode: data.client.postalCode || '',
        city: data.client.city || '',
        country: data.client.country || 'FR',
        notes: data.client.notes || '',
      })
    }
    setLoading(false)
  }

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSave() {
    setSaving(true)
    const { error } = await api.put(`/clients/${id}`, form)
    setSaving(false)
    if (error) {
      toast(error, 'error')
    } else {
      toast('Client mis à jour', 'success')
    }
  }

  async function handleDelete() {
    setDeleting(true)
    const { error } = await api.delete(`/clients/${id}`)
    setDeleting(false)
    if (error) {
      toast(error, 'error')
    } else {
      toast('Client supprimé', 'success')
      router.push('/dashboard/clients')
    }
  }

  const displayName = client?.type === 'company'
    ? client.companyName
    : `${client?.firstName || ''} ${client?.lastName || ''}`.trim()

  if (loading) {
    return (
      <div className="px-4 lg:px-6 py-4 md:py-6 space-y-6">
        {/* Back link */}
        <Skeleton className="h-4 w-32" />
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-11 w-11 rounded-xl" />
            <div className="space-y-1.5">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
          </div>
        </div>
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card/50 p-4 flex items-center gap-3">
              <Skeleton className="h-4 w-4 rounded shrink-0" />
              <div className="space-y-1.5">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ))}
        </div>
        {/* Tabs */}
        <div className="flex gap-2">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-9 w-28 rounded-lg" />
          ))}
        </div>
        {/* Form card */}
        <div className="rounded-2xl border border-border/50 p-6 space-y-5">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          ))}
          <Skeleton className="h-10 w-28 rounded-lg" />
        </div>
      </div>
    )
  }

  if (!client) {
    return (
      <div className="text-center py-20 px-4 lg:px-6">
        <p className="text-muted-foreground">Client introuvable.</p>
        <Link href="/dashboard/clients"><Button variant="outline" className="mt-4">Retour</Button></Link>
      </div>
    )
  }

  function formatCurrency(amount: number) {
    return amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
  }

  return (
    <div className="px-4 lg:px-6 py-4 md:py-6">
      <Link href="/dashboard/clients" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
        <ArrowLeft className="h-4 w-4" /> Retour aux clients
      </Link>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            {client.type === 'company' ? <Building2 className="h-5 w-5 text-primary" /> : <UserRound className="h-5 w-5 text-primary" />}
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">{displayName}</h1>
            <Badge variant="muted">{client.type === 'company' ? 'Professionnel' : 'Particulier'}</Badge>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="rounded-xl border border-border bg-card/50 p-4 flex items-center gap-3">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-lg font-bold text-foreground">{client.invoiceCount}</p>
            <p className="text-xs text-muted-foreground">Factures</p>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card/50 p-4 flex items-center gap-3">
          <Receipt className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-lg font-bold text-foreground">{client.quoteCount}</p>
            <p className="text-xs text-muted-foreground">Devis</p>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card/50 p-4">
          <p className="text-lg font-bold text-foreground">{formatCurrency(client.totalRevenue)}</p>
          <p className="text-xs text-muted-foreground">CA total</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border mb-6">
        {tabItems.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === tab.id ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
            {activeTab === tab.id && (
              <motion.div layoutId="edit-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }} />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <Card>
        <CardContent className="p-6">
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
              {activeTab === 'info' && (
                <div className="space-y-5">
                  {client.type === 'company' ? (
                    <>
                      <div><label className="text-sm font-medium text-foreground mb-1.5 block">Nom de l&apos;entreprise</label><Input value={form.companyName} onChange={(e) => update('companyName', e.target.value)} /></div>
                      <div className="grid grid-cols-2 gap-3">
                        <div><label className="text-sm font-medium text-foreground mb-1.5 block">SIREN / SIRET</label><Input value={form.siret || form.siren} onChange={(e) => update('siret', e.target.value)} className="font-mono" /></div>
                        <div><label className="text-sm font-medium text-foreground mb-1.5 block">TVA Intracom.</label><Input value={form.vatNumber} onChange={(e) => update('vatNumber', e.target.value)} className="font-mono" /></div>
                      </div>
                    </>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      <div><label className="text-sm font-medium text-foreground mb-1.5 block">Nom</label><Input value={form.lastName} onChange={(e) => update('lastName', e.target.value)} /></div>
                      <div><label className="text-sm font-medium text-foreground mb-1.5 block">Prenom</label><Input value={form.firstName} onChange={(e) => update('firstName', e.target.value)} /></div>
                    </div>
                  )}
                  <div className="h-px bg-border" />
                  <div className="flex items-center gap-2 mb-2"><MapPin className="h-4 w-4 text-primary" /><span className="text-sm font-semibold text-foreground">Adresse</span></div>
                  <div className="relative" ref={suggestionsRef}>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Adresse</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        value={form.address}
                        onChange={(e) => { update('address', e.target.value); searchAddress(e.target.value) }}
                        onFocus={() => { if (addressSuggestions.length > 0) setShowSuggestions(true) }}
                        placeholder="Rechercher une adresse..."
                        className="pl-10"
                        autoComplete="off"
                      />
                    </div>
                    <AnimatePresence>
                      {showSuggestions && addressSuggestions.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          transition={{ duration: 0.15 }}
                          className="absolute z-30 top-full mt-1 w-full rounded-lg border border-border bg-card shadow-lg overflow-hidden"
                        >
                          {addressSuggestions.map((s, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => {
                                setForm((prev) => ({ ...prev, address: s.name, postalCode: s.postcode, city: s.city }))
                                setShowSuggestions(false)
                              }}
                              className="w-full text-left px-3 py-2.5 text-sm text-foreground hover:bg-muted/50 transition-colors flex items-center gap-2 border-b border-border last:border-b-0"
                            >
                            <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <span className="truncate">{s.label}</span>
                          </button>
                        ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <div><label className="text-sm font-medium text-foreground mb-1.5 block">Complément</label><Input value={form.addressComplement} onChange={(e) => update('addressComplement', e.target.value)} /></div>
                  <div className="grid grid-cols-5 gap-3">
                    <div className="col-span-2"><label className="text-sm font-medium text-foreground mb-1.5 block">Code postal</label><Input value={form.postalCode} onChange={(e) => update('postalCode', e.target.value)} /></div>
                    <div className="col-span-3"><label className="text-sm font-medium text-foreground mb-1.5 block">Ville</label><Input value={form.city} onChange={(e) => update('city', e.target.value)} /></div>
                  </div>
                  <div><label className="text-sm font-medium text-foreground mb-1.5 block">Pays</label>
                    <Select value={form.country} onChange={(e) => update('country', e.target.value)}>
                      <option value="FR">France</option><option value="BE">Belgique</option><option value="CH">Suisse</option><option value="LU">Luxembourg</option><option value="DE">Allemagne</option><option value="ES">Espagne</option><option value="IT">Italie</option><option value="GB">Royaume-Uni</option><option value="US">Etats-Unis</option><option value="CA">Canada</option><option value="OTHER">Autre</option>
                    </Select>
                  </div>
                </div>
              )}
              {activeTab === 'contacts' && (
                <div className="space-y-5">
                  <div><label className="text-sm font-medium text-foreground mb-1.5 block">Email</label><div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="client@exemple.fr" className="pl-10" /></div></div>
                  <div><label className="text-sm font-medium text-foreground mb-1.5 block">Téléphone</label><PhoneInput value={form.phone} onChange={(v) => update('phone', v)} /></div>
                  <div className="flex items-center justify-between rounded-xl border border-border p-4">
                    <div><p className="text-sm font-medium text-foreground">Inclure dans les envois email</p><p className="text-xs text-muted-foreground mt-0.5">Utiliser cette adresse par defaut</p></div>
                    <Switch checked={form.includeInEmails} onChange={(v) => update('includeInEmails', v)} />
                  </div>
                </div>
              )}
              {activeTab === 'notes' && (
                <div className="space-y-4">
                  <Textarea placeholder="Notes internes sur le client..." value={form.notes} onChange={(e) => update('notes', e.target.value)} rows={8} />
                  <p className="text-xs text-muted-foreground">Ces notes sont visibles uniquement par votre équipe.</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="flex items-center justify-between mt-6">
        <div>
          {confirmDelete ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-destructive">Confirmer ?</span>
              <Button size="sm" variant="outline" onClick={() => setConfirmDelete(false)}>Non</Button>
              <Button size="sm" variant="outline" onClick={handleDelete} disabled={deleting} className="text-destructive hover:bg-destructive/10">
                {deleting ? <Spinner /> : 'Oui, supprimer'}
              </Button>
            </div>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setConfirmDelete(true)} className="text-destructive hover:bg-destructive/10 hover:text-destructive">
              <Trash2 className="h-3.5 w-3.5 mr-1" /> Supprimer
            </Button>
          )}
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <><Spinner /> Enregistrement...</> : <><Save className="h-4 w-4 mr-1" /> Enregistrer</>}
        </Button>
      </div>
    </div>
  )
}
