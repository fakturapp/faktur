'use client'

import { useState, useEffect } from 'react'
import { motion, type Variants } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Field, FieldGroup, FieldLabel, FieldDescription } from '@/components/ui/field'
import { FormSelect } from '@/components/ui/dropdown'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { useToast } from '@/components/ui/toast'
import { useEmail } from '@/lib/email-context'
import { api } from '@/lib/api'
import { Bell, Save, Info } from 'lucide-react'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
} satisfies Variants

interface ReminderSettings {
  enabled: boolean
  daysBeforeDue: number | null
  daysAfterDue: number | null
  repeatIntervalDays: number | null
  emailSubjectTemplate: string | null
  emailBodyTemplate: string | null
  autoSend: boolean
  emailAccountId: string | null
}

export default function ReminderSettingsPage() {
  const { toast } = useToast()
  const { accounts, loading: accountsLoading } = useEmail()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [enabled, setEnabled] = useState(false)
  const [daysBeforeDue, setDaysBeforeDue] = useState('')
  const [daysAfterDue, setDaysAfterDue] = useState('7')
  const [repeatIntervalDays, setRepeatIntervalDays] = useState('')
  const [emailSubjectTemplate, setEmailSubjectTemplate] = useState(
    'Rappel : Facture {numero} en attente de paiement'
  )
  const [emailBodyTemplate, setEmailBodyTemplate] = useState(
    "Bonjour,\n\nNous vous rappelons que la facture {numero} d'un montant de {montant} est arrivee a echeance le {date_echeance}.\n\nMerci de bien vouloir proceder au reglement.\n\nCordialement"
  )
  const [autoSend, setAutoSend] = useState(false)
  const [emailAccountId, setEmailAccountId] = useState('')

  useEffect(() => {
    async function load() {
      const { data } = await api.get<{ reminderSettings: ReminderSettings }>('/reminders/settings')
      if (data?.reminderSettings) {
        const s = data.reminderSettings
        setEnabled(s.enabled)
        setDaysBeforeDue(s.daysBeforeDue ? String(s.daysBeforeDue) : '')
        setDaysAfterDue(s.daysAfterDue ? String(s.daysAfterDue) : '')
        setRepeatIntervalDays(s.repeatIntervalDays ? String(s.repeatIntervalDays) : '')
        setEmailSubjectTemplate(s.emailSubjectTemplate || '')
        setEmailBodyTemplate(s.emailBodyTemplate || '')
        setAutoSend(s.autoSend)
        setEmailAccountId(s.emailAccountId || '')
      }
      setLoading(false)
    }
    load()
  }, [])

  async function handleSave() {
    setSaving(true)
    const { error } = await api.put('/reminders/settings', {
      enabled,
      daysBeforeDue: daysBeforeDue ? parseInt(daysBeforeDue) : null,
      daysAfterDue: daysAfterDue ? parseInt(daysAfterDue) : null,
      repeatIntervalDays: repeatIntervalDays ? parseInt(repeatIntervalDays) : null,
      emailSubjectTemplate: emailSubjectTemplate.trim() || null,
      emailBodyTemplate: emailBodyTemplate.trim() || null,
      autoSend,
      emailAccountId: emailAccountId || null,
    })
    setSaving(false)
    if (error) {
      toast(error, 'error')
      return
    }
    toast('Parametres de relance mis a jour')
  }

  if (loading) {
    return (
      <div className="space-y-6 px-4 lg:px-6 py-4 md:py-6">
        <div>
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-72 mt-2" />
        </div>
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-xl" />
        ))}
      </div>
    )
  }

  return (
    <motion.div initial="hidden" animate="visible" className="space-y-6 px-4 lg:px-6 py-4 md:py-6">
      {}
      <motion.div variants={fadeUp} custom={0}>
        <h1 className="text-2xl font-bold text-foreground">Relances automatiques</h1>
        <p className="text-muted-foreground mt-1">
          Configurez les rappels de paiement pour vos factures en retard
        </p>
      </motion.div>

      {}
      <motion.div variants={fadeUp} custom={1}>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-soft">
                  <Bell className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Activer les relances</p>
                  <p className="text-xs text-muted-foreground">
                    Les relances seront disponibles pour les factures envoyees et en retard
                  </p>
                </div>
              </div>
              <Switch checked={enabled} onChange={setEnabled} />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {enabled && (
        <>
          {}
          <motion.div variants={fadeUp} custom={2}>
            <Card>
              <CardContent className="p-5 space-y-4">
                <h3 className="text-sm font-semibold text-foreground">Calendrier des relances</h3>

                <FieldGroup>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Field>
                      <FieldLabel htmlFor="daysBefore">Jours avant echeance</FieldLabel>
                      <Input
                        id="daysBefore"
                        type="number"
                        min="1"
                        max="90"
                        value={daysBeforeDue}
                        onChange={(e) => setDaysBeforeDue(e.target.value)}
                        placeholder="Ex: 3"
                      />
                      <FieldDescription>Rappel preventif</FieldDescription>
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="daysAfter">Jours apres echeance</FieldLabel>
                      <Input
                        id="daysAfter"
                        type="number"
                        min="1"
                        max="90"
                        value={daysAfterDue}
                        onChange={(e) => setDaysAfterDue(e.target.value)}
                        placeholder="Ex: 7"
                      />
                      <FieldDescription>Premiere relance</FieldDescription>
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="repeatInterval">Repeter tous les (jours)</FieldLabel>
                      <Input
                        id="repeatInterval"
                        type="number"
                        min="1"
                        max="90"
                        value={repeatIntervalDays}
                        onChange={(e) => setRepeatIntervalDays(e.target.value)}
                        placeholder="Ex: 7"
                      />
                      <FieldDescription>Apres la 1ere relance</FieldDescription>
                    </Field>
                  </div>
                </FieldGroup>
              </CardContent>
            </Card>
          </motion.div>

          {}
          <motion.div variants={fadeUp} custom={3}>
            <Card>
              <CardContent className="p-5 space-y-4">
                <h3 className="text-sm font-semibold text-foreground">Compte email</h3>
                <Field>
                  <FieldLabel htmlFor="emailAccount">Compte utilise pour les relances</FieldLabel>
                  <FormSelect
                    id="emailAccount"
                    value={emailAccountId}
                    onChange={setEmailAccountId}
                    placeholder="Selectionner un compte"
                    options={[
                      { value: '', label: 'Selectionner un compte' },
                      ...accounts.map((a) => ({ value: a.id, label: `${a.email} (${a.provider})` })),
                    ]}
                  />
                  {accounts.length === 0 && !accountsLoading && (
                    <p className="text-xs text-orange-500 mt-1">
                      Aucun compte email configure. Ajoutez-en un dans Parametres &gt; Email.
                    </p>
                  )}
                </Field>
              </CardContent>
            </Card>
          </motion.div>

          {}
          <motion.div variants={fadeUp} custom={4}>
            <Card>
              <CardContent className="p-5 space-y-4">
                <h3 className="text-sm font-semibold text-foreground">Modele d&apos;email</h3>

                <div className="flex items-start gap-2 rounded-lg bg-primary/5 border border-primary/10 p-3">
                  <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground">
                    Variables disponibles : <code className="text-primary">{'{numero}'}</code>,{' '}
                    <code className="text-primary">{'{montant}'}</code>,{' '}
                    <code className="text-primary">{'{date_echeance}'}</code>,{' '}
                    <code className="text-primary">{'{date_emission}'}</code>,{' '}
                    <code className="text-primary">{'{client}'}</code>
                  </p>
                </div>

                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="subjectTemplate">Objet de l&apos;email</FieldLabel>
                    <Input
                      id="subjectTemplate"
                      value={emailSubjectTemplate}
                      onChange={(e) => setEmailSubjectTemplate(e.target.value)}
                      placeholder="Rappel : Facture {numero}"
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="bodyTemplate">Corps de l&apos;email</FieldLabel>
                    <Textarea
                      id="bodyTemplate"
                      value={emailBodyTemplate}
                      onChange={(e) => setEmailBodyTemplate(e.target.value)}
                      rows={6}
                      placeholder="Bonjour, ..."
                    />
                  </Field>
                </FieldGroup>
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}

      {}
      <motion.div variants={fadeUp} custom={5} className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <><Spinner /> Enregistrement...</>
          ) : (
            <><Save className="h-4 w-4 mr-1.5" /> Enregistrer</>
          )}
        </Button>
      </motion.div>
    </motion.div>
  )
}
