'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { FormSelect } from '@/components/ui/dropdown'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { Skeleton } from '@/components/ui/skeleton'
import { PhoneInput } from '@/components/ui/phone-input'
import { api } from '@/lib/api'
import { useToast } from '@/components/ui/toast'
import {
  X,
  Building2,
  UserRound,
  MapPin,
  Mail,
  Phone,
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

interface ClientEditPanelProps {
  open: boolean
  clientId: string | null
  onClose: () => void
  onUpdated: () => void
  onDeleted: () => void
}

const tabItems = [
  { id: 'info', label: 'Informations' },
  { id: 'contacts', label: 'Contacts' },
  { id: 'notes', label: 'Notes' },
]

export function ClientEditPanel({ open, clientId, onClose, onUpdated, onDeleted }: ClientEditPanelProps) {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('info')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [client, setClient] = useState<Client | null>(null)

  const [form, setForm] = useState({
    companyName: '',
    firstName: '',
    lastName: '',
    siren: '',
    siret: '',
    vatNumber: '',
    email: '',
    phone: '',
    includeInEmails: true,
    address: '',
    addressComplement: '',
    postalCode: '',
    city: '',
    country: 'FR',
    notes: '',
  })

  useEffect(() => {
    if (open && clientId) {
      loadClient()
      setActiveTab('info')
      setConfirmDelete(false)
    }
  }, [open, clientId])

  async function loadClient() {
    setLoading(true)
    const { data } = await api.get<{ client: Client }>(`/clients/${clientId}`)
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
    const { error } = await api.put(`/clients/${clientId}`, form)
    setSaving(false)

    if (error) {
      toast(error, 'error')
    } else {
      toast('Client mis à jour', 'success')
      onUpdated()
    }
  }

  async function handleDelete() {
    setDeleting(true)
    const { error } = await api.delete(`/clients/${clientId}`)
    setDeleting(false)

    if (error) {
      toast(error, 'error')
    } else {
      toast('Client supprimé', 'success')
      onClose()
      onDeleted()
    }
  }

  function handleClose() {
    setConfirmDelete(false)
    onClose()
  }

  const displayName = client?.type === 'company'
    ? client.companyName
    : `${client?.firstName || ''} ${client?.lastName || ''}`.trim()

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-card border-l border-border shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div className="flex items-center gap-3 min-w-0">
                {loading ? (
                  <>
                    <Skeleton className="h-9 w-9 rounded-lg" />
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      {client?.type === 'company' ? (
                        <Building2 className="h-4.5 w-4.5 text-primary" />
                      ) : (
                        <UserRound className="h-4.5 w-4.5 text-primary" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{displayName}</p>
                      <Badge variant="muted" className="text-[10px]">
                        {client?.type === 'company' ? 'Professionnel' : 'Particulier'}
                      </Badge>
                    </div>
                  </>
                )}
              </div>
              <button
                onClick={handleClose}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Stats bar */}
            {!loading && client && (
              <div className="grid grid-cols-3 border-b border-border">
                <div className="flex items-center gap-2 px-4 py-3 border-r border-border">
                  <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {client.invoiceCount} facture{client.invoiceCount !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex items-center gap-2 px-4 py-3 border-r border-border">
                  <Receipt className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {client.quoteCount} devis
                  </span>
                </div>
                <div className="flex items-center gap-2 px-4 py-3">
                  <span className="text-xs font-medium text-foreground">
                    {client.totalRevenue.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                  </span>
                </div>
              </div>
            )}

            {/* Tabs */}
            <div className="flex border-b border-border">
              {tabItems.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab.label}
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="client-tab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                      transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }}
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-6 space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <div className="grid grid-cols-2 gap-3">
                    <Skeleton className="h-10" />
                    <Skeleton className="h-10" />
                  </div>
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="p-6"
                  >
                    {/* Info tab */}
                    {activeTab === 'info' && (
                      <div className="space-y-5">
                        {client?.type === 'company' ? (
                          <>
                            <div className="flex items-center gap-2 mb-4">
                              <Building2 className="h-4 w-4 text-primary" />
                              <span className="text-sm font-semibold text-foreground">Informations de l&apos;entreprise</span>
                            </div>

                            <div>
                              <label className="text-sm font-medium text-foreground mb-1.5 block">Nom de l&apos;entreprise</label>
                              <Input
                                value={form.companyName}
                                onChange={(e) => update('companyName', e.target.value)}
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-sm font-medium text-foreground mb-1.5 block">SIREN / SIRET</label>
                                <Input
                                  value={form.siret || form.siren}
                                  onChange={(e) => update('siret', e.target.value)}
                                  className="font-mono"
                                />
                              </div>
                              <div>
                                <label className="text-sm font-medium text-foreground mb-1.5 block">TVA Intracom.</label>
                                <Input
                                  value={form.vatNumber}
                                  onChange={(e) => update('vatNumber', e.target.value)}
                                  className="font-mono"
                                />
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex items-center gap-2 mb-4">
                              <UserRound className="h-4 w-4 text-primary" />
                              <span className="text-sm font-semibold text-foreground">Informations personnelles</span>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-sm font-medium text-foreground mb-1.5 block">Nom</label>
                                <Input
                                  value={form.lastName}
                                  onChange={(e) => update('lastName', e.target.value)}
                                />
                              </div>
                              <div>
                                <label className="text-sm font-medium text-foreground mb-1.5 block">Prenom</label>
                                <Input
                                  value={form.firstName}
                                  onChange={(e) => update('firstName', e.target.value)}
                                />
                              </div>
                            </div>
                          </>
                        )}

                        <div className="h-px bg-border my-2" />

                        <div className="flex items-center gap-2 mb-4">
                          <MapPin className="h-4 w-4 text-primary" />
                          <span className="text-sm font-semibold text-foreground">Adresse</span>
                        </div>

                        <div>
                          <label className="text-sm font-medium text-foreground mb-1.5 block">Adresse</label>
                          <Input
                            value={form.address}
                            onChange={(e) => update('address', e.target.value)}
                            placeholder="Adresse"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-foreground mb-1.5 block">Complement</label>
                          <Input
                            value={form.addressComplement}
                            onChange={(e) => update('addressComplement', e.target.value)}
                            placeholder="Batiment, etage..."
                          />
                        </div>
                        <div className="grid grid-cols-5 gap-3">
                          <div className="col-span-2">
                            <label className="text-sm font-medium text-foreground mb-1.5 block">Code postal</label>
                            <Input
                              value={form.postalCode}
                              onChange={(e) => update('postalCode', e.target.value)}
                            />
                          </div>
                          <div className="col-span-3">
                            <label className="text-sm font-medium text-foreground mb-1.5 block">Ville</label>
                            <Input
                              value={form.city}
                              onChange={(e) => update('city', e.target.value)}
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-foreground mb-1.5 block">Pays</label>
                          <FormSelect
                            value={form.country}
                            onChange={(v) => update('country', v)}
                            options={[
                              { value: 'FR', label: 'France' },
                              { value: 'BE', label: 'Belgique' },
                              { value: 'CH', label: 'Suisse' },
                              { value: 'LU', label: 'Luxembourg' },
                              { value: 'DE', label: 'Allemagne' },
                              { value: 'ES', label: 'Espagne' },
                              { value: 'IT', label: 'Italie' },
                              { value: 'GB', label: 'Royaume-Uni' },
                              { value: 'US', label: 'Etats-Unis' },
                              { value: 'CA', label: 'Canada' },
                              { value: 'OTHER', label: 'Autre' },
                            ]}
                          />
                        </div>
                      </div>
                    )}

                    {/* Contacts tab */}
                    {activeTab === 'contacts' && (
                      <div className="space-y-5">
                        <div className="flex items-center gap-2 mb-4">
                          <Mail className="h-4 w-4 text-primary" />
                          <span className="text-sm font-semibold text-foreground">Coordonnees</span>
                        </div>

                        <div>
                          <label className="text-sm font-medium text-foreground mb-1.5 block">Email</label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              type="email"
                              value={form.email}
                              onChange={(e) => update('email', e.target.value)}
                              placeholder="client@exemple.fr"
                              className="pl-10"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-sm font-medium text-foreground mb-1.5 block">Téléphone</label>
                          <PhoneInput value={form.phone} onChange={(v) => update('phone', v)} />
                        </div>

                        <div className="flex items-center justify-between rounded-xl border border-border p-4">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-foreground">Inclure dans les envois email</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Utiliser cette adresse par defaut
                            </p>
                          </div>
                          <Switch
                            checked={form.includeInEmails}
                            onChange={(v) => update('includeInEmails', v)}
                          />
                        </div>
                      </div>
                    )}

                    {/* Notes tab */}
                    {activeTab === 'notes' && (
                      <div className="space-y-5">
                        <div className="flex items-center gap-2 mb-4">
                          <StickyNote className="h-4 w-4 text-primary" />
                          <span className="text-sm font-semibold text-foreground">Notes internes</span>
                        </div>

                        <Textarea
                          placeholder="Notes internes sur le client..."
                          value={form.notes}
                          onChange={(e) => update('notes', e.target.value)}
                          rows={8}
                        />

                        <p className="text-xs text-muted-foreground">
                          Ces notes sont visibles uniquement par votre équipe et ne sont pas incluses dans les documents.
                        </p>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              )}
            </div>

            {/* Footer */}
            {!loading && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-border">
                <div>
                  {confirmDelete ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-destructive">Confirmer ?</span>
                      <Button size="sm" variant="outline" onClick={() => setConfirmDelete(false)}>
                        Non
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleDelete} disabled={deleting} className="text-destructive hover:bg-destructive/10">
                        {deleting ? <Spinner /> : 'Oui, supprimer'}
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setConfirmDelete(true)}
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" /> Supprimer
                    </Button>
                  )}
                </div>

                <Button onClick={handleSave} disabled={saving}>
                  {saving ? <><Spinner /> Enregistrement...</> : (
                    <><Save className="h-4 w-4 mr-1" /> Enregistrer</>
                  )}
                </Button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
