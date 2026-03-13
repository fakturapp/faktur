'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Spinner } from '@/components/ui/spinner'
import { api } from '@/lib/api'
import {
  X,
  Building2,
  UserRound,
  Search,
  ArrowRight,
  ArrowLeft,
  Check,
  MapPin,
  Mail,
  Phone,
  StickyNote,
  ChevronRight,
} from 'lucide-react'

interface ClientCreatePanelProps {
  open: boolean
  onClose: () => void
  onCreated: () => void
}

type ClientType = 'company' | 'individual'

interface ClientForm {
  type: ClientType
  // Company
  companyName: string
  siren: string
  siret: string
  vatNumber: string
  // Individual
  firstName: string
  lastName: string
  // Contact
  email: string
  phone: string
  includeInEmails: boolean
  // Address
  address: string
  addressComplement: string
  postalCode: string
  city: string
  country: string
  // Notes
  notes: string
}

const initialForm: ClientForm = {
  type: 'company',
  companyName: '',
  siren: '',
  siret: '',
  vatNumber: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  includeInEmails: true,
  address: '',
  addressComplement: '',
  postalCode: '',
  city: '',
  country: 'FR',
  notes: '',
}

const steps = [
  { id: 1, label: 'Type', icon: UserRound },
  { id: 2, label: 'Informations', icon: Building2 },
  { id: 3, label: 'Contact', icon: Mail },
  { id: 4, label: 'Adresse', icon: MapPin },
  { id: 5, label: 'Notes', icon: StickyNote },
]

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
}

export function ClientCreatePanel({ open, onClose, onCreated }: ClientCreatePanelProps) {
  const [step, setStep] = useState(1)
  const [dir, setDir] = useState(1)
  const [form, setForm] = useState<ClientForm>(initialForm)
  const [searching, setSearching] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function update<K extends keyof ClientForm>(key: K, value: ClientForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function goNext() {
    setDir(1)
    setStep((s) => Math.min(s + 1, 5))
  }

  function goBack() {
    setDir(-1)
    setStep((s) => Math.max(s - 1, 1))
  }

  function handleClose() {
    setStep(1)
    setDir(1)
    setForm(initialForm)
    setError('')
    onClose()
  }

  async function handleSearchSiren() {
    const query = form.siren || form.siret
    if (!query || query.length < 9) return

    setSearching(true)
    setError('')

    const { data, error: apiError } = await api.get<{
      companyName: string
      siren: string
      siret: string
      vatNumber: string
      address: string
      postalCode: string
      city: string
    }>(`/clients/search-siren?q=${encodeURIComponent(query)}`)

    setSearching(false)

    if (apiError) {
      setError(apiError)
      return
    }

    if (data) {
      setForm((prev) => ({
        ...prev,
        companyName: data.companyName || prev.companyName,
        siren: data.siren || prev.siren,
        siret: data.siret || prev.siret,
        vatNumber: data.vatNumber || prev.vatNumber,
        address: data.address || prev.address,
        postalCode: data.postalCode || prev.postalCode,
        city: data.city || prev.city,
      }))
    }
  }

  async function handleSubmit() {
    setSaving(true)
    setError('')

    const payload = {
      type: form.type,
      companyName: form.type === 'company' ? form.companyName : null,
      siren: form.type === 'company' ? form.siren : null,
      siret: form.type === 'company' ? form.siret : null,
      vatNumber: form.type === 'company' ? form.vatNumber : null,
      firstName: form.type === 'individual' ? form.firstName : null,
      lastName: form.type === 'individual' ? form.lastName : null,
      email: form.email || null,
      phone: form.phone || null,
      includeInEmails: form.includeInEmails,
      address: form.address || null,
      addressComplement: form.addressComplement || null,
      postalCode: form.postalCode || null,
      city: form.city || null,
      country: form.country,
      notes: form.notes || null,
    }

    const { error: apiError } = await api.post('/clients', payload)
    setSaving(false)

    if (apiError) {
      setError(apiError)
      return
    }

    handleClose()
    onCreated()
  }

  const canGoNext = () => {
    switch (step) {
      case 1: return true
      case 2:
        return form.type === 'company'
          ? form.companyName.trim().length > 0
          : form.lastName.trim().length > 0
      case 3: return true
      case 4: return true
      case 5: return true
      default: return true
    }
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
              <h2 className="text-lg font-bold text-foreground">Nouveau client</h2>
              <button
                onClick={handleClose}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Step indicator */}
            <div className="px-6 py-3 border-b border-border">
              <div className="flex items-center gap-1">
                {steps.map((s, i) => (
                  <div key={s.id} className="flex items-center">
                    <div className="flex items-center gap-1.5">
                      <div
                        className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-all duration-300 ${
                          step === s.id
                            ? 'bg-primary text-primary-foreground scale-110'
                            : step > s.id
                            ? 'bg-primary/20 text-primary'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {step > s.id ? <Check className="h-3.5 w-3.5" /> : s.id}
                      </div>
                      <span
                        className={`text-xs font-medium hidden sm:block transition-colors ${
                          step === s.id ? 'text-foreground' : 'text-muted-foreground'
                        }`}
                      >
                        {s.label}
                      </span>
                    </div>
                    {i < steps.length - 1 && (
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 mx-1.5" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto relative">
              <AnimatePresence mode="wait" custom={dir}>
                <motion.div
                  key={step}
                  custom={dir}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  className="p-6 space-y-5"
                >
                  {/* Step 1: Type */}
                  {step === 1 && (
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-base font-semibold text-foreground mb-1">Type de client</h3>
                        <p className="text-sm text-muted-foreground">
                          Selectionnez le type de client que vous souhaitez creer
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => update('type', 'company')}
                          className={`relative rounded-xl border-2 p-5 text-left transition-all ${
                            form.type === 'company'
                              ? 'border-primary bg-primary/5 shadow-sm'
                              : 'border-border hover:border-muted-foreground/30'
                          }`}
                        >
                          {form.type === 'company' && (
                            <div className="absolute top-3 right-3">
                              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                                <Check className="h-3 w-3 text-primary-foreground" />
                              </div>
                            </div>
                          )}
                          <Building2 className="h-6 w-6 text-primary mb-3" />
                          <p className="font-semibold text-sm text-foreground">Professionnel</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Entreprise, auto-entrepreneur, association
                          </p>
                        </button>

                        <button
                          onClick={() => update('type', 'individual')}
                          className={`relative rounded-xl border-2 p-5 text-left transition-all ${
                            form.type === 'individual'
                              ? 'border-primary bg-primary/5 shadow-sm'
                              : 'border-border hover:border-muted-foreground/30'
                          }`}
                        >
                          {form.type === 'individual' && (
                            <div className="absolute top-3 right-3">
                              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                                <Check className="h-3 w-3 text-primary-foreground" />
                              </div>
                            </div>
                          )}
                          <UserRound className="h-6 w-6 text-primary mb-3" />
                          <p className="font-semibold text-sm text-foreground">Particulier</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Personne physique, client final
                          </p>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Information */}
                  {step === 2 && form.type === 'company' && (
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-base font-semibold text-foreground mb-1">Informations de l&apos;entreprise</h3>
                        <p className="text-sm text-muted-foreground">
                          Recherchez par SIREN/SIRET ou remplissez manuellement
                        </p>
                      </div>

                      {/* SIREN search */}
                      <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Recherche automatique
                        </p>
                        <div className="flex gap-2">
                          <Input
                            placeholder="SIREN ou SIRET"
                            value={form.siren}
                            onChange={(e) => update('siren', e.target.value.replace(/\D/g, ''))}
                            className="font-mono"
                            maxLength={14}
                          />
                          <Button
                            variant="outline"
                            onClick={handleSearchSiren}
                            disabled={searching || (form.siren.length < 9)}
                          >
                            {searching ? <Spinner /> : <Search className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium text-foreground mb-1.5 block">
                            Nom de l&apos;entreprise <span className="text-destructive">*</span>
                          </label>
                          <Input
                            placeholder="Nom de l'entreprise"
                            value={form.companyName}
                            onChange={(e) => update('companyName', e.target.value)}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-sm font-medium text-foreground mb-1.5 block">
                              SIREN / SIRET
                            </label>
                            <Input
                              placeholder="N° de SIREN ou SIRET"
                              value={form.siret || form.siren}
                              onChange={(e) => update('siret', e.target.value.replace(/\D/g, ''))}
                              className="font-mono"
                              maxLength={14}
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium text-foreground mb-1.5 block">
                              TVA Intracom.
                            </label>
                            <Input
                              placeholder="N° de TVA"
                              value={form.vatNumber}
                              onChange={(e) => update('vatNumber', e.target.value)}
                              className="font-mono"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {step === 2 && form.type === 'individual' && (
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-base font-semibold text-foreground mb-1">Informations du client</h3>
                        <p className="text-sm text-muted-foreground">
                          Renseignez les informations personnelles
                        </p>
                      </div>

                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-sm font-medium text-foreground mb-1.5 block">
                              Nom <span className="text-destructive">*</span>
                            </label>
                            <Input
                              placeholder="Nom"
                              value={form.lastName}
                              onChange={(e) => update('lastName', e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium text-foreground mb-1.5 block">
                              Prenom
                            </label>
                            <Input
                              placeholder="Prenom"
                              value={form.firstName}
                              onChange={(e) => update('firstName', e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Contact */}
                  {step === 3 && (
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-base font-semibold text-foreground mb-1">Coordonnees</h3>
                        <p className="text-sm text-muted-foreground">
                          Email et telephone du client
                        </p>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium text-foreground mb-1.5 block">Email</label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              type="email"
                              placeholder="client@exemple.fr"
                              value={form.email}
                              onChange={(e) => update('email', e.target.value)}
                              className="pl-10"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-foreground mb-1.5 block">Telephone</label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              type="tel"
                              placeholder="06 12 34 56 78"
                              value={form.phone}
                              onChange={(e) => update('phone', e.target.value)}
                              className="pl-10"
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between rounded-xl border border-border p-4">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-foreground">Inclure dans les envois email</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Utiliser cette adresse par defaut pour les envois de documents
                            </p>
                          </div>
                          <Switch
                            checked={form.includeInEmails}
                            onChange={(v) => update('includeInEmails', v)}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 4: Address */}
                  {step === 4 && (
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-base font-semibold text-foreground mb-1">Adresse</h3>
                        <p className="text-sm text-muted-foreground">
                          Adresse de facturation du client
                        </p>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium text-foreground mb-1.5 block">Adresse</label>
                          <Input
                            placeholder="Adresse"
                            value={form.address}
                            onChange={(e) => update('address', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-foreground mb-1.5 block">Complement d&apos;adresse</label>
                          <Input
                            placeholder="Batiment, etage, etc."
                            value={form.addressComplement}
                            onChange={(e) => update('addressComplement', e.target.value)}
                          />
                        </div>
                        <div className="grid grid-cols-5 gap-3">
                          <div className="col-span-2">
                            <label className="text-sm font-medium text-foreground mb-1.5 block">Code postal</label>
                            <Input
                              placeholder="75001"
                              value={form.postalCode}
                              onChange={(e) => update('postalCode', e.target.value)}
                              maxLength={10}
                            />
                          </div>
                          <div className="col-span-3">
                            <label className="text-sm font-medium text-foreground mb-1.5 block">Ville</label>
                            <Input
                              placeholder="Paris"
                              value={form.city}
                              onChange={(e) => update('city', e.target.value)}
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-foreground mb-1.5 block">Pays</label>
                          <Select
                            value={form.country}
                            onChange={(e) => update('country', e.target.value)}
                          >
                            <option value="FR">France</option>
                            <option value="BE">Belgique</option>
                            <option value="CH">Suisse</option>
                            <option value="LU">Luxembourg</option>
                            <option value="DE">Allemagne</option>
                            <option value="ES">Espagne</option>
                            <option value="IT">Italie</option>
                            <option value="GB">Royaume-Uni</option>
                            <option value="US">Etats-Unis</option>
                            <option value="CA">Canada</option>
                            <option value="OTHER">Autre</option>
                          </Select>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 5: Notes */}
                  {step === 5 && (
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-base font-semibold text-foreground mb-1">Notes</h3>
                        <p className="text-sm text-muted-foreground">
                          Ajoutez des informations supplementaires (optionnel)
                        </p>
                      </div>

                      <Textarea
                        placeholder="Notes internes sur le client..."
                        value={form.notes}
                        onChange={(e) => update('notes', e.target.value)}
                        rows={6}
                      />

                      {/* Summary */}
                      <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                          Recapitulatif
                        </p>
                        <div className="space-y-1.5 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Type</span>
                            <span className="font-medium text-foreground">
                              {form.type === 'company' ? 'Professionnel' : 'Particulier'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Nom</span>
                            <span className="font-medium text-foreground">
                              {form.type === 'company'
                                ? form.companyName
                                : `${form.firstName} ${form.lastName}`.trim()}
                            </span>
                          </div>
                          {form.email && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Email</span>
                              <span className="font-medium text-foreground">{form.email}</span>
                            </div>
                          )}
                          {form.city && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Ville</span>
                              <span className="font-medium text-foreground">
                                {form.postalCode} {form.city}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Error */}
            {error && (
              <div className="mx-6 mb-2 rounded-lg bg-destructive/10 border border-destructive/20 p-3">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-border">
              <Button
                variant="outline"
                onClick={step === 1 ? handleClose : goBack}
              >
                {step === 1 ? (
                  'Annuler'
                ) : (
                  <><ArrowLeft className="h-4 w-4 mr-1" /> Retour</>
                )}
              </Button>

              {step < 5 ? (
                <Button onClick={goNext} disabled={!canGoNext()}>
                  Suivant <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={saving || !canGoNext()}>
                  {saving ? <><Spinner /> Creation...</> : (
                    <><Check className="h-4 w-4 mr-1" /> Creer le client</>
                  )}
                </Button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
