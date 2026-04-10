'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/components/ui/toast'
import { Spinner } from '@/components/ui/spinner'
import { Dialog, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { PhoneInput } from '@/components/ui/phone-input'
import { useCompanySettings, type Company } from '@/lib/company-settings-context'
import { api } from '@/lib/api'
import {
  Building2, Plus, Pencil, AlertCircle, MapPin, Phone, Globe,
  ChevronLeft, ChevronRight as ChevronRightIcon, ImagePlus, Trash2,
} from 'lucide-react'

const editSteps = [
  { id: 'identity', label: 'Identité', icon: Building2, tooltip: 'Raison sociale, SIREN, N° TVA, forme juridique' },
  { id: 'address', label: 'Adresse', icon: MapPin, tooltip: 'Adresse complète de votre entreprise' },
  { id: 'contact', label: 'Contact', icon: Phone, tooltip: 'Téléphone, email et site web' },
  { id: 'logo', label: 'Logo', icon: ImagePlus, tooltip: 'Logo affiché sur vos documents' },
]

export default function CompanyInfoPage() {
  const { toast } = useToast()
  const { loading, noCompany, logoUrl, form, setCompany, setNoCompany, setForm, setLogoUrl } = useCompanySettings()

  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editStep, setEditStep] = useState(0)
  const [editForm, setEditForm] = useState({ ...form })
  const [editLogoUrl, setEditLogoUrl] = useState<string | null>(null)
  const [stepErrors, setStepErrors] = useState<string[]>([])
  const editLogoRef = useRef<HTMLInputElement>(null)

  function openEditModal() {
    setEditForm({ ...form })
    setEditLogoUrl(logoUrl)
    setEditStep(0)
    setStepErrors([])
    setEditModalOpen(true)
  }

  function validateStep(step: number): string[] {
    const errors: string[] = []
    if (step === 0) {
      if (!editForm.legalName.trim()) errors.push('Raison sociale')
      if (!editForm.siren.trim()) errors.push('SIREN')
      if (!editForm.siret.trim()) errors.push('SIRET')
    }
    if (step === 1) {
      if (!editForm.addressLine1.trim()) errors.push('Adresse')
      if (!editForm.postalCode.trim()) errors.push('Code postal')
      if (!editForm.city.trim()) errors.push('Ville')
    }
    return errors
  }

  function handleEditNext() {
    const errors = validateStep(editStep)
    if (errors.length > 0) { setStepErrors(errors); return }
    setStepErrors([])
    if (editStep < editSteps.length - 1) setEditStep(editStep + 1)
  }

  function handleEditPrev() {
    setStepErrors([])
    if (editStep > 0) setEditStep(editStep - 1)
  }

  async function handleEditSave() {
    const errors = validateStep(editStep)
    if (errors.length > 0) { setStepErrors(errors); return }
    setStepErrors([])
    setSaving(true)
    if (noCompany) {
      const { data, error } = await api.post<{ company: Company }>('/onboarding/company', editForm)
      setSaving(false)
      if (error) return toast(error, 'error')
      setNoCompany(false)
      setCompany(data?.company || null)
      toast('Entreprise créée', 'success')
    } else {
      const { error } = await api.put('/company', editForm)
      setSaving(false)
      if (error) return toast(error, 'error')
      toast('Informations mises à jour', 'success')
    }
    setForm({ ...editForm })
    setLogoUrl(editLogoUrl)
    setEditModalOpen(false)
  }

  function updateEditForm(field: string, value: string) {
    setEditForm((prev) => ({ ...prev, [field]: value }))
    setStepErrors([])
  }

  async function handleEditLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const formData = new FormData()
    formData.append('logo', file)
    const { data, error } = await api.upload<{ logoUrl: string }>('/company/logo', formData)
    setUploading(false)
    if (error) return toast(error, 'error')
    if (data?.logoUrl) { setEditLogoUrl(data.logoUrl); toast('Logo mis à jour', 'success') }
  }

  async function handleEditRemoveLogo() {
    const { error } = await api.put('/company', { logoUrl: null })
    if (error) return toast(error, 'error')
    setEditLogoUrl(null)
    toast('Logo supprimé', 'success')
  }

  if (loading) {
    return (
      <div className="space-y-6 px-4 lg:px-6 py-4 md:py-6">
        <div className="space-y-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="rounded-xl bg-surface shadow-surface p-6 space-y-5">
          <div className="flex items-start gap-6">
            <Skeleton className="h-24 w-24 rounded-xl shrink-0" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-3.5 w-full max-w-xs" />
              <Skeleton className="h-8 w-32 rounded-lg" />
            </div>
          </div>
          <Skeleton className="h-px w-full" />
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 px-4 lg:px-6 py-4 md:py-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Informations</h1>
        <p className="text-muted-foreground text-sm mt-1">Informations générales de votre entreprise.</p>
      </div>

      {noCompany ? (
        <Card>
          <CardContent className="p-6 flex flex-col items-center py-12 text-center">
            <Building2 className="h-10 w-10 text-muted-secondary mb-4" />
            <p className="text-lg font-semibold text-foreground mb-1">Aucune entreprise</p>
            <p className="text-sm text-muted-foreground mb-4">Créez votre entreprise pour commencer à facturer.</p>
            <Button onClick={openEditModal}>
              <Plus className="h-4 w-4 mr-1.5" /> Créer mon entreprise
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-6 mb-6">
              <div className="h-20 w-20 rounded-xl bg-surface flex items-center justify-center overflow-hidden shrink-0">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="h-full w-full object-contain p-2" />
                ) : (
                  <Building2 className="h-8 w-8 text-muted-secondary" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-bold text-foreground truncate">{form.legalName || 'Mon entreprise'}</h3>
                {form.tradeName && <p className="text-sm text-muted-foreground mt-0.5">{form.tradeName}</p>}
                {form.legalForm && <p className="text-xs text-muted-foreground mt-1">{form.legalForm}</p>}
              </div>
              <Button variant="outline" size="sm" onClick={openEditModal}>
                <Pencil className="h-3.5 w-3.5 mr-1.5" /> Modifier
              </Button>
            </div>

            <Separator className="mb-6" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
              {[
                { label: 'SIREN', value: form.siren },
                { label: 'SIRET', value: form.siret },
                { label: 'N° TVA', value: form.vatNumber },
                { label: 'Forme juridique', value: form.legalForm },
              ].map((item) => (
                <div key={item.label}>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{item.label}</span>
                  <p className="text-sm text-foreground mt-0.5">{item.value || <span className="text-muted-secondary italic">Non renseigné</span>}</p>
                </div>
              ))}
            </div>

            <Separator className="my-6" />

            <div className="flex items-start gap-3 mb-4">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Adresse</span>
                <p className="text-sm text-foreground mt-0.5">
                  {form.addressLine1 || form.city ? (
                    <>{form.addressLine1}{form.addressLine2 ? `, ${form.addressLine2}` : ''}<br />{form.postalCode} {form.city}</>
                  ) : (
                    <span className="text-muted-secondary italic">Non renseignée</span>
                  )}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-start gap-3">
                <Phone className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Téléphone</span>
                  <p className="text-sm text-foreground mt-0.5">{form.phone || <span className="text-muted-secondary italic">—</span>}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Building2 className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Email</span>
                  <p className="text-sm text-foreground mt-0.5">{form.email || <span className="text-muted-secondary italic">—</span>}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Globe className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Site web</span>
                  <p className="text-sm text-foreground mt-0.5">{form.website || <span className="text-muted-secondary italic">—</span>}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Multi-step edit modal */}
      <Dialog open={editModalOpen} onClose={() => setEditModalOpen(false)} className="max-w-lg">
        <DialogTitle>Modifier les informations</DialogTitle>

        <div className="flex items-center gap-1 mt-4 mb-6">
          {editSteps.map((step, i) => (
            <div key={step.id} className="flex-1 group relative">
              <button
                onClick={() => {
                  const errors = validateStep(editStep)
                  if (i > editStep && errors.length > 0) { setStepErrors(errors); return }
                  setStepErrors([])
                  setEditStep(i)
                }}
                className={`w-full h-2 rounded-full transition-colors cursor-pointer ${
                  i <= editStep ? 'bg-primary' : 'bg-muted'
                } ${i < editStep ? 'bg-primary/80' : ''}`}
              />
              <div className="absolute -top-9 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 whitespace-nowrap px-2.5 py-1 rounded-md bg-foreground text-background text-[11px] shadow-lg">
                {step.label} — {step.tooltip}
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 mb-4">
          {(() => { const StepIcon = editSteps[editStep].icon; return <StepIcon className="h-4 w-4 text-primary" /> })()}
          <span className="text-sm font-semibold text-foreground">{editSteps[editStep].label}</span>
          <span className="text-xs text-muted-foreground ml-auto">Étape {editStep + 1} sur {editSteps.length}</span>
        </div>

        <div className="space-y-4 min-h-[200px]">
          {editStep === 0 && (
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="editLegalName">Raison sociale *</FieldLabel>
                <Input id="editLegalName" value={editForm.legalName} onChange={(e) => updateEditForm('legalName', e.target.value)} className={stepErrors.includes('Raison sociale') ? 'border-red-500' : ''} />
              </Field>
              <Field>
                <FieldLabel htmlFor="editTradeName">Nom commercial</FieldLabel>
                <Input id="editTradeName" value={editForm.tradeName} onChange={(e) => updateEditForm('tradeName', e.target.value)} />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="editSiren">SIREN *</FieldLabel>
                  <Input id="editSiren" value={editForm.siren} onChange={(e) => updateEditForm('siren', e.target.value)} maxLength={9} className={stepErrors.includes('SIREN') ? 'border-red-500' : ''} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="editSiret">SIRET *</FieldLabel>
                  <Input id="editSiret" value={editForm.siret} onChange={(e) => updateEditForm('siret', e.target.value)} maxLength={14} className={stepErrors.includes('SIRET') ? 'border-red-500' : ''} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="editVatNumber">N° TVA</FieldLabel>
                  <Input id="editVatNumber" value={editForm.vatNumber} onChange={(e) => updateEditForm('vatNumber', e.target.value)} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="editLegalForm">Forme juridique</FieldLabel>
                  <Input id="editLegalForm" value={editForm.legalForm} onChange={(e) => updateEditForm('legalForm', e.target.value)} />
                </Field>
              </div>
            </FieldGroup>
          )}

          {editStep === 1 && (
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="editAddress1">Adresse ligne 1 *</FieldLabel>
                <Input id="editAddress1" value={editForm.addressLine1} onChange={(e) => updateEditForm('addressLine1', e.target.value)} className={stepErrors.includes('Adresse') ? 'border-red-500' : ''} />
              </Field>
              <Field>
                <FieldLabel htmlFor="editAddress2">Adresse ligne 2</FieldLabel>
                <Input id="editAddress2" value={editForm.addressLine2} onChange={(e) => updateEditForm('addressLine2', e.target.value)} />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="editPostalCode">Code postal *</FieldLabel>
                  <Input id="editPostalCode" value={editForm.postalCode} onChange={(e) => updateEditForm('postalCode', e.target.value)} className={stepErrors.includes('Code postal') ? 'border-red-500' : ''} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="editCity">Ville *</FieldLabel>
                  <Input id="editCity" value={editForm.city} onChange={(e) => updateEditForm('city', e.target.value)} className={stepErrors.includes('Ville') ? 'border-red-500' : ''} />
                </Field>
              </div>
            </FieldGroup>
          )}

          {editStep === 2 && (
            <FieldGroup>
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="editPhone">Téléphone</FieldLabel>
                  <PhoneInput id="editPhone" value={editForm.phone} onChange={(v) => updateEditForm('phone', v)} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="editEmail">Email</FieldLabel>
                  <Input id="editEmail" type="email" value={editForm.email} onChange={(e) => updateEditForm('email', e.target.value)} />
                </Field>
              </div>
              <Field>
                <FieldLabel htmlFor="editWebsite">Site web</FieldLabel>
                <Input id="editWebsite" value={editForm.website} onChange={(e) => updateEditForm('website', e.target.value)} />
              </Field>
            </FieldGroup>
          )}

          {editStep === 3 && (
            <div className="space-y-4">
              <div className="flex items-start gap-6">
                <div className="relative group">
                  <div className="h-24 w-24 rounded-xl border-2 border-dashed border-border bg-surface flex items-center justify-center overflow-hidden">
                    {editLogoUrl ? (
                      <img src={editLogoUrl} alt="Logo" className="h-full w-full object-contain p-2" />
                    ) : (
                      <ImagePlus className="h-8 w-8 text-muted-secondary" />
                    )}
                  </div>
                  {editLogoUrl && (
                    <button type="button" onClick={handleEditRemoveLogo}
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
                <div className="flex-1 space-y-3">
                  <p className="text-sm text-muted-foreground">Ce logo apparaîtra sur vos factures, devis et documents. Format recommandé : PNG ou SVG, fond transparent.</p>
                  <input ref={editLogoRef} type="file" accept="image/png,image/svg+xml,image/jpeg,image/webp" className="hidden" onChange={handleEditLogoUpload} />
                  <Button type="button" variant="outline" size="sm" onClick={() => editLogoRef.current?.click()} disabled={uploading}>
                    {uploading ? <><Spinner className="text-foreground" /> Envoi...</> : 'Télécharger un logo'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        <AnimatePresence>
          {stepErrors.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }}
              className="flex items-center gap-2 mt-3 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
              <AlertCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />
              <span className="text-xs text-red-500">{stepErrors.join(', ')} obligatoire{stepErrors.length > 1 ? 's' : ''}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <DialogFooter className="mt-4">
          <div className="flex items-center justify-between w-full">
            <Button variant="ghost" size="sm" onClick={handleEditPrev} disabled={editStep === 0}>
              <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Précédent
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditModalOpen(false)}>Annuler</Button>
              {editStep < editSteps.length - 1 ? (
                <Button size="sm" onClick={handleEditNext}>
                  Suivant <ChevronRightIcon className="h-3.5 w-3.5 ml-1" />
                </Button>
              ) : (
                <Button size="sm" onClick={handleEditSave} disabled={saving}>
                  {saving ? <><Spinner className="h-3.5 w-3.5" /> Enregistrement...</> : 'Enregistrer'}
                </Button>
              )}
            </div>
          </div>
        </DialogFooter>
      </Dialog>
    </motion.div>
  )
}
