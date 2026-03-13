'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Field, FieldGroup, FieldLabel, FieldDescription, FieldError } from '@/components/ui/field'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/lib/auth'
import { api } from '@/lib/api'
import { Spinner } from '@/components/ui/spinner'
import { Building2, Search } from 'lucide-react'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: 'easeOut' },
  }),
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

export default function OnboardingCompanyPage() {
  const router = useRouter()
  const { refreshUser } = useAuth()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [showManual, setShowManual] = useState(false)

  const [form, setForm] = useState({
    legalName: '',
    tradeName: '',
    siren: '',
    siret: '',
    vatNumber: '',
    legalForm: '',
    addressLine1: '',
    city: '',
    postalCode: '',
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
    router.push('/dashboard')
  }

  async function handleSkip() {
    setLoading(true)
    const { error: err } = await api.post('/onboarding/skip', {})
    setLoading(false)
    if (err) return setError(err)
    await refreshUser()
    router.push('/dashboard')
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

              {/* SIREN Search */}
              <motion.div variants={fadeUp} custom={2}>
                <Field>
                  <FieldLabel>Rechercher votre entreprise</FieldLabel>
                  <div className="flex gap-2">
                    <Input
                      placeholder="SIREN, SIRET ou nom..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearch())}
                    />
                    <Button type="button" variant="outline" onClick={handleSearch} disabled={searching}>
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
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
                          SIREN: {r.siren} {r.city && `- ${r.postalCode} ${r.city}`}
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
                  </motion.div>

                  <motion.div variants={fadeUp} custom={4}>
                    <Field>
                      <FieldLabel htmlFor="legalName">Raison sociale *</FieldLabel>
                      <Input id="legalName" value={form.legalName} onChange={(e) => updateForm('legalName', e.target.value)} required />
                    </Field>
                  </motion.div>

                  <motion.div variants={fadeUp} custom={5} className="grid grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel htmlFor="siren">SIREN</FieldLabel>
                      <Input id="siren" value={form.siren} onChange={(e) => updateForm('siren', e.target.value)} maxLength={9} />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="siret">SIRET</FieldLabel>
                      <Input id="siret" value={form.siret} onChange={(e) => updateForm('siret', e.target.value)} maxLength={14} />
                    </Field>
                  </motion.div>

                  <motion.div variants={fadeUp} custom={6} className="grid grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel htmlFor="vatNumber">N° TVA</FieldLabel>
                      <Input id="vatNumber" value={form.vatNumber} onChange={(e) => updateForm('vatNumber', e.target.value)} />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="legalForm">Forme juridique</FieldLabel>
                      <Input id="legalForm" placeholder="SAS, SARL..." value={form.legalForm} onChange={(e) => updateForm('legalForm', e.target.value)} />
                    </Field>
                  </motion.div>

                  <motion.div variants={fadeUp} custom={7}>
                    <Field>
                      <FieldLabel htmlFor="addressLine1">Adresse</FieldLabel>
                      <Input id="addressLine1" value={form.addressLine1} onChange={(e) => updateForm('addressLine1', e.target.value)} />
                    </Field>
                  </motion.div>

                  <motion.div variants={fadeUp} custom={8} className="grid grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel htmlFor="postalCode">Code postal</FieldLabel>
                      <Input id="postalCode" value={form.postalCode} onChange={(e) => updateForm('postalCode', e.target.value)} />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="city">Ville</FieldLabel>
                      <Input id="city" value={form.city} onChange={(e) => updateForm('city', e.target.value)} />
                    </Field>
                  </motion.div>
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

              <motion.div variants={fadeUp} custom={9} className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={handleSkip}
                  disabled={loading}
                >
                  Passer cette étape
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={loading || !form.legalName.trim()}
                >
                  {loading ? <><Spinner /> Enregistrement...</> : 'Terminer'}
                </Button>
              </motion.div>

              <motion.div variants={fadeUp} custom={10}>
                <FieldDescription className="text-center">
                  Vous pourrez compléter ces informations plus tard.
                </FieldDescription>
              </motion.div>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  )
}
