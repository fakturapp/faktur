'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Field, FieldGroup, FieldLabel, FieldDescription, FieldError } from '@/components/ui/field'
import { Dialog, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { useAuth } from '@/lib/auth'
import { api } from '@/lib/api'
import { Spinner } from '@/components/ui/spinner'
import { PhoneInput } from '@/components/ui/phone-input'
import { IbanInput } from '@/components/ui/iban-input'
import { Building2, Search, Phone, Mail, Globe, ChevronLeft, ChevronRight, MapPin, CreditCard, AlertTriangle, Check } from 'lucide-react'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
} satisfies Variants

const stepTransition = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] as const } },
  exit: { opacity: 0, x: -20, transition: { duration: 0.2 } },
}

interface SearchResult {
  siren: string
  siret: string | null
  legalName: string
  tradeName: string | null
  legalForm: string | null
  vatNumber: string | null
  addressLine1: string | null
  city: string | null
  postalCode: string | null
}

const STEPS = [
  { id: 'search', title: 'Recherche', icon: Search },
  { id: 'identity', title: 'Identité', icon: Building2 },
  { id: 'address', title: 'Adresse', icon: MapPin },
  { id: 'contact', title: 'Contact', icon: Phone },
]

const legalForms = [
  'Auto-entrepreneur',
  'EI (Entreprise Individuelle)',
  'EIRL',
  'EURL',
  'SARL',
  'SAS',
  'SASU',
  'SA',
  'SCI',
  'SNC',
  'Association',
  'Autre',
]

const countries = [
  'France',
  'Belgique',
  'Suisse',
  'Luxembourg',
  'Canada',
  'Autre',
]

export default function OnboardingCompanyPage() {
  const router = useRouter()
  const { refreshUser } = useAuth()
  const [step, setStep] = useState(0)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [showSkipConfirm, setShowSkipConfirm] = useState(false)

  const [form, setForm] = useState({
    legalName: '',
    tradeName: '',
    siren: '',
    siret: '',
    vatNumber: '',
    legalForm: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    postalCode: '',
    country: 'France',
    phone: '',
    email: '',
    website: '',
    iban: '',
    bic: '',
    bankName: '',
  })

  function updateForm(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSearch() {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) return
    setSearching(true)
    const { data } = await api.get<{ results: SearchResult[] }>(
      `/onboarding/company/search?q=${encodeURIComponent(searchQuery)}`
    )
    setSearching(false)
    setSearchResults(data?.results || [])
  }

  function selectResult(result: SearchResult) {
    setForm({
      ...form,
      legalName: result.legalName,
      siren: result.siren || '',
      siret: result.siret || '',
      vatNumber: result.vatNumber || '',
      legalForm: result.legalForm || '',
      addressLine1: result.addressLine1 || '',
      city: result.city || '',
      postalCode: result.postalCode || '',
      tradeName: result.tradeName || '',
    })
    setSearchResults([])
    setStep(1)
  }

  function goManual() {
    setSearchResults([])
    setStep(1)
  }

  function nextStep() {
    setStep((s) => Math.min(s + 1, STEPS.length - 1))
  }

  function prevStep() {
    setStep((s) => Math.max(s - 1, 0))
  }

  async function handleSubmit() {
    setError('')
    setLoading(true)
    const { error: err } = await api.post('/onboarding/company', form)
    setLoading(false)
    if (err) return setError(err)
    await refreshUser()
    router.push('/onboarding/personalization')
  }

  async function handleSkip() {
    setLoading(true)
    const { error: err } = await api.post('/onboarding/skip', {})
    setLoading(false)
    if (err) return setError(err)
    await refreshUser()
    router.push('/onboarding/personalization')
  }

  return (
    <motion.div initial="hidden" animate="visible">
      <Card className="overflow-hidden border-border/50">
        <CardContent className="p-0">
          {/* Stepper */}
          <div className="px-8 pt-6 pb-4">
            <div className="flex items-center">
              {STEPS.map((s, i) => {
                const Icon = s.icon
                const isCompleted = i < step
                const isActive = i === step
                return (
                  <div key={s.id} className="flex items-center flex-1 last:flex-none">
                    <button
                      type="button"
                      onClick={() => i < step && setStep(i)}
                      disabled={i > step}
                      className="flex items-center gap-2 shrink-0 group"
                    >
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium transition-all duration-300 ${
                          isCompleted
                            ? 'bg-primary text-primary-foreground'
                            : isActive
                              ? 'bg-primary/10 text-primary ring-2 ring-primary/30'
                              : 'bg-muted text-muted-foreground'
                        } ${i < step ? 'cursor-pointer group-hover:ring-2 group-hover:ring-primary/20' : ''}`}
                      >
                        {isCompleted ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                      </div>
                      <span
                        className={`text-sm font-medium hidden sm:block transition-colors ${
                          isActive ? 'text-foreground' : 'text-muted-foreground'
                        }`}
                      >
                        {s.title}
                      </span>
                    </button>
                    {i < STEPS.length - 1 && (
                      <div className="flex-1 mx-3">
                        <div className="h-px bg-border relative">
                          <div
                            className="absolute inset-y-0 left-0 bg-primary transition-all duration-500"
                            style={{ width: i < step ? '100%' : '0%' }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="border-t border-border" />

          {/* Step content */}
          <div className="px-8 py-6">
            <AnimatePresence mode="wait">
              {/* Step 0: Search */}
              {step === 0 && (
                <motion.div key="search" {...stepTransition}>
                  <FieldGroup>
                    <motion.div variants={fadeUp} custom={0} className="flex flex-col items-center gap-3 text-center mb-2">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                        <Building2 className="h-7 w-7 text-primary" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold">Votre entreprise</h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Recherchez par SIREN/SIRET ou nom pour pré-remplir vos informations.
                        </p>
                      </div>
                    </motion.div>

                    {error && (
                      <motion.div variants={fadeUp} custom={1}>
                        <FieldError className="text-center bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                          {error}
                        </FieldError>
                      </motion.div>
                    )}

                    <motion.div variants={fadeUp} custom={2}>
                      <Field>
                        <FieldLabel>Rechercher votre entreprise</FieldLabel>
                        <div className="flex gap-2">
                          <Input
                            placeholder="SIREN, SIRET ou nom d'entreprise..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearch())}
                          />
                          <Button type="button" variant="outline" onClick={handleSearch} disabled={searching}>
                            {searching ? <Spinner className="h-4 w-4" /> : <Search className="h-4 w-4" />}
                          </Button>
                        </div>
                        <FieldDescription>
                          Recherche dans l&apos;annuaire des entreprises françaises (INSEE)
                        </FieldDescription>
                      </Field>

                      {searchResults.length > 0 && (
                        <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-border divide-y divide-border">
                          {searchResults.map((r, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => selectResult(r)}
                              className="w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors"
                            >
                              <p className="text-sm font-medium text-foreground">{r.legalName}</p>
                              <p className="text-xs text-muted-foreground">
                                SIREN : {r.siren} {r.city && `— ${r.postalCode} ${r.city}`}
                              </p>
                            </button>
                          ))}
                        </div>
                      )}
                    </motion.div>

                    <motion.div variants={fadeUp} custom={3} className="text-center">
                      <button
                        type="button"
                        onClick={goManual}
                        className="text-sm text-primary underline underline-offset-4 hover:text-primary/80"
                      >
                        Saisir manuellement
                      </button>
                    </motion.div>
                  </FieldGroup>
                </motion.div>
              )}

              {/* Step 1: Identity */}
              {step === 1 && (
                <motion.div key="identity" {...stepTransition}>
                  <FieldGroup>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold">Identité de l&apos;entreprise</h2>
                        <p className="text-xs text-muted-foreground">Informations légales et fiscales</p>
                      </div>
                    </div>

                    <Field>
                      <FieldLabel htmlFor="legalName">Raison sociale *</FieldLabel>
                      <Input id="legalName" value={form.legalName} onChange={(e) => updateForm('legalName', e.target.value)} required />
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="tradeName">Nom commercial</FieldLabel>
                      <Input id="tradeName" placeholder="Nom d'usage (facultatif)" value={form.tradeName} onChange={(e) => updateForm('tradeName', e.target.value)} />
                      <FieldDescription>Si différent de la raison sociale</FieldDescription>
                    </Field>

                    <div className="grid grid-cols-2 gap-4">
                      <Field>
                        <FieldLabel htmlFor="siren">SIREN</FieldLabel>
                        <Input id="siren" value={form.siren} onChange={(e) => updateForm('siren', e.target.value)} maxLength={9} placeholder="123 456 789" />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="siret">SIRET</FieldLabel>
                        <Input id="siret" value={form.siret} onChange={(e) => updateForm('siret', e.target.value)} maxLength={14} placeholder="123 456 789 00012" />
                      </Field>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <Field>
                        <FieldLabel htmlFor="vatNumber">N° TVA intracommunautaire</FieldLabel>
                        <Input id="vatNumber" value={form.vatNumber} onChange={(e) => updateForm('vatNumber', e.target.value)} placeholder="FR 12 345678901" />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="legalForm">Forme juridique</FieldLabel>
                        <select
                          id="legalForm"
                          value={form.legalForm}
                          onChange={(e) => updateForm('legalForm', e.target.value)}
                          className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                        >
                          <option value="">Sélectionner...</option>
                          {legalForms.map((f) => (
                            <option key={f} value={f}>{f}</option>
                          ))}
                        </select>
                      </Field>
                    </div>
                  </FieldGroup>
                </motion.div>
              )}

              {/* Step 2: Address */}
              {step === 2 && (
                <motion.div key="address" {...stepTransition}>
                  <FieldGroup>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                        <MapPin className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold">Adresse</h2>
                        <p className="text-xs text-muted-foreground">Siège social de l&apos;entreprise</p>
                      </div>
                    </div>

                    <Field>
                      <FieldLabel htmlFor="addressLine1">Adresse</FieldLabel>
                      <Input id="addressLine1" value={form.addressLine1} onChange={(e) => updateForm('addressLine1', e.target.value)} placeholder="12 rue de la Paix" />
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="addressLine2">Complément d&apos;adresse</FieldLabel>
                      <Input id="addressLine2" value={form.addressLine2} onChange={(e) => updateForm('addressLine2', e.target.value)} placeholder="Bâtiment A, 2e étage (facultatif)" />
                    </Field>

                    <div className="grid grid-cols-3 gap-4">
                      <Field>
                        <FieldLabel htmlFor="postalCode">Code postal</FieldLabel>
                        <Input id="postalCode" value={form.postalCode} onChange={(e) => updateForm('postalCode', e.target.value)} placeholder="75001" />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="city">Ville</FieldLabel>
                        <Input id="city" value={form.city} onChange={(e) => updateForm('city', e.target.value)} placeholder="Paris" />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="country">Pays</FieldLabel>
                        <select
                          id="country"
                          value={form.country}
                          onChange={(e) => updateForm('country', e.target.value)}
                          className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                        >
                          {countries.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </Field>
                    </div>
                  </FieldGroup>
                </motion.div>
              )}

              {/* Step 3: Contact & Bank */}
              {step === 3 && (
                <motion.div key="contact" {...stepTransition}>
                  <FieldGroup>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                        <Phone className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold">Contact & Banque</h2>
                        <p className="text-xs text-muted-foreground">Coordonnées et informations bancaires</p>
                      </div>
                    </div>

                    <Field>
                      <FieldLabel htmlFor="phone">Téléphone</FieldLabel>
                      <PhoneInput id="phone" value={form.phone} onChange={(v) => updateForm('phone', v)} />
                    </Field>

                    <div className="grid grid-cols-2 gap-4">
                      <Field>
                        <FieldLabel htmlFor="email">
                          <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> Email</span>
                        </FieldLabel>
                        <Input id="email" type="email" placeholder="contact@entreprise.fr" value={form.email} onChange={(e) => updateForm('email', e.target.value)} />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="website">
                          <span className="flex items-center gap-1.5"><Globe className="h-3.5 w-3.5" /> Site web</span>
                        </FieldLabel>
                        <Input id="website" type="url" placeholder="https://www.entreprise.fr" value={form.website} onChange={(e) => updateForm('website', e.target.value)} />
                      </Field>
                    </div>

                    <div className="border-t border-border pt-4 mt-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <CreditCard className="h-3 w-3" /> Coordonnées bancaires (facultatif)
                      </p>

                      <div className="space-y-4">
                        <Field>
                          <FieldLabel htmlFor="iban">IBAN</FieldLabel>
                          <IbanInput id="iban" value={form.iban} onChange={(v) => updateForm('iban', v)} />
                          <FieldDescription>Sera chiffré avec le chiffrement zero-access</FieldDescription>
                        </Field>

                        <div className="grid grid-cols-2 gap-4">
                          <Field>
                            <FieldLabel htmlFor="bic">BIC</FieldLabel>
                            <Input
                              id="bic"
                              placeholder="BNPAFRPP"
                              value={form.bic}
                              onChange={(e) => updateForm('bic', e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 11))}
                              maxLength={11}
                              className="font-mono tracking-wider uppercase"
                            />
                          </Field>
                          <Field>
                            <FieldLabel htmlFor="bankName">Nom de la banque</FieldLabel>
                            <Input id="bankName" placeholder="BNP Paribas" value={form.bankName} onChange={(e) => updateForm('bankName', e.target.value)} />
                          </Field>
                        </div>
                      </div>
                    </div>
                  </FieldGroup>
                </motion.div>
              )}
            </AnimatePresence>

            {error && step > 0 && (
              <div className="mt-4">
                <FieldError className="text-center bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                  {error}
                </FieldError>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="border-t border-border px-8 py-4">
            <div className="flex items-center gap-3">
              {step === 0 ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => router.push('/onboarding/team')}
                  className="gap-1.5"
                >
                  <ChevronLeft className="h-4 w-4" /> Précédent
                </Button>
              ) : (
                <Button type="button" variant="ghost" onClick={prevStep} className="gap-1.5">
                  <ChevronLeft className="h-4 w-4" /> Précédent
                </Button>
              )}

              <div className="flex-1" />

              <Button
                type="button"
                variant="outline"
                onClick={() => setShowSkipConfirm(true)}
                disabled={loading}
              >
                Passer cette étape
              </Button>

              {step < STEPS.length - 1 ? (
                <Button type="button" onClick={nextStep} className="gap-1.5" disabled={step === 1 && !form.legalName.trim()}>
                  Suivant <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading || !form.legalName.trim()}
                  className="gap-1.5"
                >
                  {loading ? <><Spinner /> Enregistrement...</> : 'Continuer'}
                </Button>
              )}
            </div>

            <p className="text-center text-xs text-muted-foreground mt-3">
              Vous pourrez compléter ces informations plus tard dans les paramètres.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Skip confirmation modal */}
      <Dialog open={showSkipConfirm} onClose={() => setShowSkipConfirm(false)} className="max-w-sm">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 shrink-0">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
          </div>
          <DialogTitle className="mb-0">Passer cette étape ?</DialogTitle>
        </div>
        <DialogDescription>
          Sans les informations de votre entreprise, vous ne pourrez pas créer de factures ni de devis.
          Vous pourrez les compléter plus tard dans les paramètres.
        </DialogDescription>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => setShowSkipConfirm(false)}>
            Rester ici
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-amber-500/30 text-amber-500 hover:bg-amber-500/10"
            onClick={() => { setShowSkipConfirm(false); handleSkip() }}
            disabled={loading}
          >
            {loading ? <><Spinner className="h-3.5 w-3.5" /> Passage...</> : 'Passer quand même'}
          </Button>
        </DialogFooter>
      </Dialog>
    </motion.div>
  )
}
