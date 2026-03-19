'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, type Variants } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Field, FieldGroup, FieldLabel, FieldDescription, FieldError } from '@/components/ui/field'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { useAuth } from '@/lib/auth'
import { api } from '@/lib/api'
import { Spinner } from '@/components/ui/spinner'
import { Building2, Search, Phone, Mail, Globe, ChevronLeft, MapPin, CreditCard, AlertTriangle } from 'lucide-react'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
} satisfies Variants

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
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [showManual, setShowManual] = useState(false)
  const [showBankFields, setShowBankFields] = useState(false)
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
    setShowManual(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
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
        <CardContent className="p-8">
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <motion.div variants={fadeUp} custom={0} className="flex flex-col items-center gap-4 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                  <Building2 className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Votre entreprise</h1>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Recherchez par SIREN/SIRET ou nom pour pré-remplir vos informations.
                    <br />
                    <span className="text-xs text-muted-foreground/70">
                      Ces informations apparaîtront sur vos factures et devis.
                    </span>
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

              {/* Recherche SIREN */}
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

              {(showManual || form.legalName) && (
                <>
                  <motion.div variants={fadeUp} custom={3}>
                    <Separator className="my-2" />
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mt-3 mb-1 flex items-center gap-1.5">
                      <Building2 className="h-3 w-3" /> Identité
                    </p>
                  </motion.div>

                  <motion.div variants={fadeUp} custom={4}>
                    <Field>
                      <FieldLabel htmlFor="legalName">Raison sociale *</FieldLabel>
                      <Input id="legalName" value={form.legalName} onChange={(e) => updateForm('legalName', e.target.value)} required />
                    </Field>
                  </motion.div>

                  <motion.div variants={fadeUp} custom={5}>
                    <Field>
                      <FieldLabel htmlFor="tradeName">Nom commercial</FieldLabel>
                      <Input id="tradeName" placeholder="Nom d'usage (facultatif)" value={form.tradeName} onChange={(e) => updateForm('tradeName', e.target.value)} />
                      <FieldDescription>Si différent de la raison sociale</FieldDescription>
                    </Field>
                  </motion.div>

                  <motion.div variants={fadeUp} custom={6} className="grid grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel htmlFor="siren">SIREN</FieldLabel>
                      <Input id="siren" value={form.siren} onChange={(e) => updateForm('siren', e.target.value)} maxLength={9} placeholder="123 456 789" />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="siret">SIRET</FieldLabel>
                      <Input id="siret" value={form.siret} onChange={(e) => updateForm('siret', e.target.value)} maxLength={14} placeholder="123 456 789 00012" />
                    </Field>
                  </motion.div>

                  <motion.div variants={fadeUp} custom={7} className="grid grid-cols-2 gap-4">
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
                  </motion.div>

                  <motion.div variants={fadeUp} custom={8}>
                    <Separator className="my-2" />
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mt-3 mb-1 flex items-center gap-1.5">
                      <MapPin className="h-3 w-3" /> Adresse
                    </p>
                  </motion.div>

                  <motion.div variants={fadeUp} custom={9}>
                    <Field>
                      <FieldLabel htmlFor="addressLine1">Adresse</FieldLabel>
                      <Input id="addressLine1" value={form.addressLine1} onChange={(e) => updateForm('addressLine1', e.target.value)} placeholder="12 rue de la Paix" />
                    </Field>
                  </motion.div>

                  <motion.div variants={fadeUp} custom={10}>
                    <Field>
                      <FieldLabel htmlFor="addressLine2">Complément d&apos;adresse</FieldLabel>
                      <Input id="addressLine2" value={form.addressLine2} onChange={(e) => updateForm('addressLine2', e.target.value)} placeholder="Bâtiment A, 2e étage (facultatif)" />
                    </Field>
                  </motion.div>

                  <motion.div variants={fadeUp} custom={11} className="grid grid-cols-3 gap-4">
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
                  </motion.div>

                  <motion.div variants={fadeUp} custom={12}>
                    <Separator className="my-2" />
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mt-3 mb-1 flex items-center gap-1.5">
                      <Phone className="h-3 w-3" /> Contact
                    </p>
                  </motion.div>

                  <motion.div variants={fadeUp} custom={13} className="grid grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel htmlFor="phone">
                        <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> Téléphone</span>
                      </FieldLabel>
                      <Input id="phone" type="tel" placeholder="+33 1 23 45 67 89" value={form.phone} onChange={(e) => updateForm('phone', e.target.value)} />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="email">
                        <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> Email</span>
                      </FieldLabel>
                      <Input id="email" type="email" placeholder="contact@entreprise.fr" value={form.email} onChange={(e) => updateForm('email', e.target.value)} />
                    </Field>
                  </motion.div>

                  <motion.div variants={fadeUp} custom={14}>
                    <Field>
                      <FieldLabel htmlFor="website">
                        <span className="flex items-center gap-1.5"><Globe className="h-3.5 w-3.5" /> Site web</span>
                      </FieldLabel>
                      <Input id="website" type="url" placeholder="https://www.entreprise.fr" value={form.website} onChange={(e) => updateForm('website', e.target.value)} />
                    </Field>
                  </motion.div>

                  {/* Coordonnées bancaires (optionnel) */}
                  <motion.div variants={fadeUp} custom={15}>
                    <Separator className="my-2" />
                    <button
                      type="button"
                      onClick={() => setShowBankFields(!showBankFields)}
                      className="text-xs font-medium text-muted-foreground uppercase tracking-wider mt-3 mb-1 flex items-center gap-1.5 hover:text-foreground transition-colors"
                    >
                      <CreditCard className="h-3 w-3" />
                      Coordonnées bancaires (facultatif)
                      <span className="text-primary text-[10px] ml-1">{showBankFields ? '▲' : '▼'}</span>
                    </button>
                  </motion.div>

                  {showBankFields && (
                    <>
                      <motion.div variants={fadeUp} custom={16}>
                        <Field>
                          <FieldLabel htmlFor="iban">IBAN</FieldLabel>
                          <Input id="iban" placeholder="FR76 1234 5678 9012 3456 7890 123" value={form.iban} onChange={(e) => updateForm('iban', e.target.value)} />
                          <FieldDescription>Sera chiffré avec le chiffrement zero-access</FieldDescription>
                        </Field>
                      </motion.div>

                      <motion.div variants={fadeUp} custom={17} className="grid grid-cols-2 gap-4">
                        <Field>
                          <FieldLabel htmlFor="bic">BIC</FieldLabel>
                          <Input id="bic" placeholder="BNPAFRPP" value={form.bic} onChange={(e) => updateForm('bic', e.target.value)} />
                        </Field>
                        <Field>
                          <FieldLabel htmlFor="bankName">Nom de la banque</FieldLabel>
                          <Input id="bankName" placeholder="BNP Paribas" value={form.bankName} onChange={(e) => updateForm('bankName', e.target.value)} />
                        </Field>
                      </motion.div>
                    </>
                  )}
                </>
              )}

              {!showManual && !form.legalName && (
                <motion.div variants={fadeUp} custom={3}>
                  <button
                    type="button"
                    onClick={() => setShowManual(true)}
                    className="text-sm text-primary underline underline-offset-4 hover:text-primary/80"
                  >
                    Saisir manuellement
                  </button>
                </motion.div>
              )}

              <motion.div variants={fadeUp} custom={18} className="flex gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => router.push('/onboarding/team')}
                  className="gap-1.5"
                >
                  <ChevronLeft className="h-4 w-4" /> Précédent
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowSkipConfirm(true)}
                  disabled={loading}
                >
                  Passer cette étape
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={loading || !form.legalName.trim()}
                >
                  {loading ? <><Spinner /> Enregistrement...</> : 'Continuer'}
                </Button>
              </motion.div>

              <motion.div variants={fadeUp} custom={19}>
                <FieldDescription className="text-center">
                  Vous pourrez compléter ces informations plus tard dans les paramètres.
                </FieldDescription>
              </motion.div>
            </FieldGroup>
          </form>
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
