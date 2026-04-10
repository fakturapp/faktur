'use client'

import { useState, useRef, useCallback, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { FormSelect } from '@/components/ui/dropdown'
import { Switch } from '@/components/ui/switch'
import { Spinner } from '@/components/ui/spinner'
import { useToast } from '@/components/ui/toast'
import { PhoneInput } from '@/components/ui/phone-input'
import { api } from '@/lib/api'
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  UserRound,
  Search,
  Check,
  Mail,
  Phone,
  MapPin,
  StickyNote,
  ChevronRight,
} from 'lucide-react'

type ClientType = 'company' | 'individual'

interface ClientForm {
  type: ClientType
  companyName: string
  siren: string
  siret: string
  vatNumber: string
  firstName: string
  lastName: string
  email: string
  phone: string
  includeInEmails: boolean
  address: string
  addressComplement: string
  postalCode: string
  city: string
  country: string
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
  enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
}

function ClientCreateContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isPopup = searchParams.get('popup') === 'true'
  const { toast } = useToast()
  const [step, setStep] = useState(1)
  const [dir, setDir] = useState(1)
  const [form, setForm] = useState<ClientForm>(initialForm)
  const [searching, setSearching] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [addressSuggestions, setAddressSuggestions] = useState<{ label: string; name: string; postcode: string; city: string }[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const addressDebounce = useRef<ReturnType<typeof setTimeout>>(undefined)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  function update<K extends keyof ClientForm>(key: K, value: ClientForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

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

  function goNext() { setDir(1); setStep((s) => Math.min(s + 1, 5)) }
  function goBack() { setDir(-1); setStep((s) => Math.max(s - 1, 1)) }

  async function handleSearchSiren() {
    const query = form.siren || form.siret
    if (!query || query.length < 9) return
    setSearching(true)
    setError('')

    const { data, error: apiError } = await api.get<{
      results: Array<{
        companyName: string; siren: string; siret: string; vatNumber: string
        address: string; postalCode: string; city: string
      }>
    }>(`/clients/search-siren?q=${encodeURIComponent(query)}`)

    setSearching(false)
    if (apiError) { setError(apiError); return }
    if (data?.results?.length) {
      const r = data.results[0]
      setForm((prev) => ({
        ...prev,
        companyName: r.companyName || prev.companyName,
        siren: r.siren || prev.siren,
        siret: r.siret || prev.siret,
        vatNumber: r.vatNumber || prev.vatNumber,
        address: r.address || prev.address,
        postalCode: r.postalCode || prev.postalCode,
        city: r.city || prev.city,
      }))
    } else {
      setError('Aucune entreprise trouvée pour ce numéro.')
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
    if (apiError) { setError(apiError); return }
    toast('Client créé', 'success')
    if (isPopup) {
      window.close()
    } else {
      router.push('/dashboard/clients')
    }
  }

  const canGoNext = () => {
    if (step === 2) {
      return form.type === 'company' ? form.companyName.trim().length > 0 : form.lastName.trim().length > 0
    }
    return true
  }

  return (
    <div className="max-w-2xl mx-auto px-4 lg:px-6 py-4 md:py-6">
      {/* Back link */}
      {!isPopup && (
        <Link
          href="/dashboard/clients"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" /> Retour aux clients
        </Link>
      )}

      <h1 className="text-2xl font-bold text-foreground mb-1">Nouveau client</h1>
      <p className="text-muted-foreground text-sm mb-6">Remplissez les informations pour creer un nouveau client.</p>

      {/* Step indicator */}
      <div className="flex items-center gap-1 mb-8">
        {steps.map((s, i) => (
          <div key={s.id} className="flex items-center">
            <div className="flex items-center gap-1.5">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-all duration-300 ${
                step === s.id
                  ? 'bg-primary text-primary-foreground scale-110'
                  : step > s.id
                  ? 'bg-primary/20 text-primary'
                  : 'bg-muted text-muted-foreground'
              }`}>
                {step > s.id ? <Check className="h-3.5 w-3.5" /> : s.id}
              </div>
              <span className={`text-sm font-medium hidden md:block transition-colors ${
                step === s.id ? 'text-foreground' : 'text-muted-foreground'
              }`}>
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 mx-2" />
            )}
          </div>
        ))}
      </div>

      {/* Content */}
      <Card>
        <CardContent className="p-6 min-h-[320px] relative overflow-hidden">
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={step}
              custom={dir}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="space-y-5"
            >
              {/* Step 1: Type */}
              {step === 1 && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-base font-semibold text-foreground mb-1">Type de client</h3>
                    <p className="text-sm text-muted-foreground">Selectionnez le type de client</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { type: 'company' as const, icon: Building2, label: 'Professionnel', desc: 'Entreprise, auto-entrepreneur, association' },
                      { type: 'individual' as const, icon: UserRound, label: 'Particulier', desc: 'Personne physique, client final' },
                    ].map((opt) => (
                      <button
                        key={opt.type}
                        onClick={() => update('type', opt.type)}
                        className={`relative rounded-xl border-2 p-5 text-left transition-all ${
                          form.type === opt.type
                            ? 'border-primary bg-primary/5 shadow-sm'
                            : 'border-border hover:border-muted-foreground/30'
                        }`}
                      >
                        {form.type === opt.type && (
                          <div className="absolute top-3 right-3">
                            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                              <Check className="h-3 w-3 text-primary-foreground" />
                            </div>
                          </div>
                        )}
                        <opt.icon className="h-6 w-6 text-primary mb-3" />
                        <p className="font-semibold text-sm text-foreground">{opt.label}</p>
                        <p className="text-xs text-muted-foreground mt-1">{opt.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 2: Info */}
              {step === 2 && form.type === 'company' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-base font-semibold text-foreground mb-1">Informations de l&apos;entreprise</h3>
                    <p className="text-sm text-muted-foreground">Recherchez par SIREN/SIRET ou remplissez manuellement</p>
                  </div>
                  <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Recherche automatique</p>
                    <div className="flex gap-2">
                      <Input placeholder="SIREN ou SIRET" value={form.siren} onChange={(e) => update('siren', e.target.value.replace(/\D/g, ''))} className="font-mono" maxLength={14} />
                      <Button variant="outline" onClick={handleSearchSiren} disabled={searching || form.siren.length < 9}>
                        {searching ? <Spinner /> : <Search className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Nom de l&apos;entreprise <span className="text-destructive">*</span></label>
                      <Input placeholder="Nom de l'entreprise" value={form.companyName} onChange={(e) => update('companyName', e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm font-medium text-foreground mb-1.5 block">SIREN / SIRET</label>
                        <Input placeholder="N° de SIREN ou SIRET" value={form.siret || form.siren} onChange={(e) => update('siret', e.target.value.replace(/\D/g, ''))} className="font-mono" maxLength={14} />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground mb-1.5 block">TVA Intracom.</label>
                        <Input placeholder="N° de TVA" value={form.vatNumber} onChange={(e) => update('vatNumber', e.target.value)} className="font-mono" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && form.type === 'individual' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-base font-semibold text-foreground mb-1">Informations du client</h3>
                    <p className="text-sm text-muted-foreground">Renseignez les informations personnelles</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Nom <span className="text-destructive">*</span></label>
                      <Input placeholder="Nom" value={form.lastName} onChange={(e) => update('lastName', e.target.value)} />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Prenom</label>
                      <Input placeholder="Prenom" value={form.firstName} onChange={(e) => update('firstName', e.target.value)} />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Contact */}
              {step === 3 && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-base font-semibold text-foreground mb-1">Coordonnees</h3>
                    <p className="text-sm text-muted-foreground">Email et telephone du client</p>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input type="email" placeholder="client@exemple.fr" value={form.email} onChange={(e) => update('email', e.target.value)} className="pl-10" />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Téléphone</label>
                      <PhoneInput value={form.phone} onChange={(v) => update('phone', v)} />
                    </div>
                    <div className="flex items-center justify-between rounded-xl border border-border p-4">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">Inclure dans les envois email</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Utiliser cette adresse par defaut</p>
                      </div>
                      <Switch checked={form.includeInEmails} onChange={(v) => update('includeInEmails', v)} />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Address */}
              {step === 4 && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-base font-semibold text-foreground mb-1">Adresse</h3>
                    <p className="text-sm text-muted-foreground">Adresse de facturation du client</p>
                  </div>
                  <div className="space-y-3">
                    <div className="relative" ref={suggestionsRef}>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Adresse</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Rechercher une adresse..."
                          value={form.address}
                          onChange={(e) => { update('address', e.target.value); searchAddress(e.target.value) }}
                          onFocus={() => { if (addressSuggestions.length > 0) setShowSuggestions(true) }}
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
                                  setForm((prev) => ({
                                    ...prev,
                                    address: s.name,
                                    postalCode: s.postcode,
                                    city: s.city,
                                  }))
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
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Complément</label>
                      <Input placeholder="Bâtiment, étage..." value={form.addressComplement} onChange={(e) => update('addressComplement', e.target.value)} />
                    </div>
                    <div className="grid grid-cols-5 gap-3">
                      <div className="col-span-2">
                        <label className="text-sm font-medium text-foreground mb-1.5 block">Code postal</label>
                        <Input placeholder="75001" value={form.postalCode} onChange={(e) => update('postalCode', e.target.value)} />
                      </div>
                      <div className="col-span-3">
                        <label className="text-sm font-medium text-foreground mb-1.5 block">Ville</label>
                        <Input placeholder="Paris" value={form.city} onChange={(e) => update('city', e.target.value)} />
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
                </div>
              )}

              {/* Step 5: Notes + recap */}
              {step === 5 && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-base font-semibold text-foreground mb-1">Notes</h3>
                    <p className="text-sm text-muted-foreground">Informations supplementaires (optionnel)</p>
                  </div>
                  <Textarea placeholder="Notes internes sur le client..." value={form.notes} onChange={(e) => update('notes', e.target.value)} rows={4} />
                  <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Recapitulatif</p>
                    <div className="space-y-1.5 text-sm">
                      <div className="flex justify-between"><span className="text-muted-foreground">Type</span><span className="font-medium text-foreground">{form.type === 'company' ? 'Professionnel' : 'Particulier'}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Nom</span><span className="font-medium text-foreground">{form.type === 'company' ? form.companyName : `${form.firstName} ${form.lastName}`.trim()}</span></div>
                      {form.email && <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span className="font-medium text-foreground">{form.email}</span></div>}
                      {form.city && <div className="flex justify-between"><span className="text-muted-foreground">Ville</span><span className="font-medium text-foreground">{form.postalCode} {form.city}</span></div>}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <div className="mt-3 rounded-lg bg-destructive/10 border border-destructive/20 p-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Footer nav */}
      <div className="flex items-center justify-between mt-6">
        <Button variant="outline" onClick={step === 1 ? () => isPopup ? window.close() : router.push('/dashboard/clients') : goBack}>
          {step === 1 ? 'Annuler' : <><ArrowLeft className="h-4 w-4 mr-1" /> Retour</>}
        </Button>
        {step < 5 ? (
          <Button onClick={goNext} disabled={!canGoNext()}>
            Suivant <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={saving || !canGoNext()}>
            {saving ? <><Spinner /> Création...</> : <><Check className="h-4 w-4 mr-1" /> Créer le client</>}
          </Button>
        )}
      </div>
    </div>
  )
}

export default function ClientCreatePage() {
  return (
    <Suspense>
      <ClientCreateContent />
    </Suspense>
  )
}
