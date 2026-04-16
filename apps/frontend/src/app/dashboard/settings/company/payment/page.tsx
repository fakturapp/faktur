'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Field, FieldGroup, FieldLabel, FieldDescription } from '@/components/ui/field'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/components/ui/toast'
import { Spinner } from '@/components/ui/spinner'
import { FormSelect } from '@/components/ui/dropdown'
import { Badge } from '@/components/ui/badge'
import { useCompanySettings } from '@/lib/company-settings-context'
import { useInvoiceSettings } from '@/lib/invoice-settings-context'
import { api } from '@/lib/api'
import { StripeActivationModal } from '@/components/settings/stripe-activation-modal'
import { SaveBar } from '@/components/ui/save-bar'
import { CheckboxRoot, CheckboxControl, CheckboxIndicator, CheckboxContent } from '@/components/ui/checkbox'
import { Receipt, Banknote, Coins, PenLine, Lock, CreditCard, CheckCircle, Trash2, AlertTriangle } from 'lucide-react'

export default function PaymentPage() {
  const { toast } = useToast()
  const {
    loading: companyLoading,
    noCompany,
    paymentForm,
    setPaymentForm,
    paymentHasChanges,
    paymentSaving,
    paymentSaveError,
    savePayment,
    resetPayment,
  } = useCompanySettings()

  const {
    settings: invoiceSettings,
    loading: invoiceLoading,
    hasChanges: invoiceHasChanges,
    saving: invoiceSaving,
    saveError: invoiceSaveError,
    updateSettings: updateInvoiceSettings,
    save: saveInvoiceSettings,
    resetChanges: resetInvoiceChanges,
  } = useInvoiceSettings()

  const loading = companyLoading || invoiceLoading
  const hasChanges = paymentHasChanges || invoiceHasChanges
  const saving = paymentSaving || invoiceSaving
  const saveError = paymentSaveError || invoiceSaveError

  const [stripeLoading, setStripeLoading] = useState(true)
  const [stripeConfigured, setStripeConfigured] = useState(false)
  const [stripeTestMode, setStripeTestMode] = useState(false)
  const [stripeMaskedPk, setStripeMaskedPk] = useState('')
  const [stripeMaskedSk, setStripeMaskedSk] = useState('')
  const [stripeModalOpen, setStripeModalOpen] = useState(false)
  const [webhookUrl, setWebhookUrl] = useState('')
  const [deletingStripe, setDeletingStripe] = useState(false)

  useEffect(() => {
    loadStripeConfig()
  }, [])

  async function loadStripeConfig() {
    setStripeLoading(true)
    const { data } = await api.get<{
      isConfigured: boolean
      publishableKeyMasked?: string
      secretKeyMasked?: string
      isTestMode?: boolean
      webhookUrl?: string
    }>('/settings/stripe')
    if (data) {
      setStripeConfigured(data.isConfigured)
      setStripeMaskedPk(data.publishableKeyMasked || '')
      setStripeMaskedSk(data.secretKeyMasked || '')
      setStripeTestMode(data.isTestMode || false)
      setWebhookUrl(data.webhookUrl || '')
    }
    setStripeLoading(false)
  }

  async function handleDeleteStripe() {
    setDeletingStripe(true)
    const { error } = await api.delete('/settings/stripe')
    setDeletingStripe(false)
    if (error) return toast(error, 'error')
    toast('Configuration Stripe supprimée', 'success')
    setStripeConfigured(false)
    setStripeMaskedPk('')
    setStripeMaskedSk('')
  }

  function togglePaymentMethod(method: string) {
    if (method === 'stripe' && !stripeConfigured) {
      setStripeModalOpen(true)
      return
    }
    const current = invoiceSettings.paymentMethods || []
    const methods = current.includes(method)
      ? current.filter((m) => m !== method)
      : [...current, method]
    updateInvoiceSettings({ paymentMethods: methods })
  }

  async function handleSave(e?: React.FormEvent) {
    if (e) e.preventDefault()
    const ops: Promise<void>[] = []
    if (paymentHasChanges) ops.push(savePayment())
    if (invoiceHasChanges) ops.push(saveInvoiceSettings())
    await Promise.all(ops)
  }

  function handleReset() {
    if (paymentHasChanges) resetPayment()
    if (invoiceHasChanges) resetInvoiceChanges()
  }

  if (loading) {
    return (
      <div className="space-y-6 px-4 lg:px-6 py-4 md:py-6">
        <div className="space-y-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="rounded-xl bg-surface shadow-surface p-6 space-y-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  const selectedMethods = invoiceSettings.paymentMethods || []
  const customMethod = invoiceSettings.customPaymentMethod || ''

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 px-4 lg:px-6 py-4 md:py-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Paiement</h1>
        <p className="text-muted-foreground text-sm mt-1">Devise, conditions et moyens de paiement.</p>
      </div>

      <Card>
        <CardContent className="p-6">
          {noCompany ? (
            <div className="flex flex-col items-center py-8 text-center">
              <Receipt className="h-8 w-8 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                Créez d&apos;abord votre entreprise dans la page Informations.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSave}>
              <FieldGroup>
                <h3 className="font-semibold text-foreground">Devise et conditions</h3>

                <Field>
                  <FieldLabel htmlFor="currency">Devise</FieldLabel>
                  <FormSelect
                    id="currency"
                    value={paymentForm.currency}
                    onChange={(v) => setPaymentForm((p) => ({ ...p, currency: v }))}
                    options={[
                      { value: 'EUR', label: 'EUR - Euro' },
                      { value: 'USD', label: 'USD - Dollar américain' },
                      { value: 'GBP', label: 'GBP - Livre sterling' },
                      { value: 'CHF', label: 'CHF - Franc suisse' },
                      { value: 'CAD', label: 'CAD - Dollar canadien' },
                    ]}
                  />
                  <FieldDescription>La devise utilisée par défaut sur vos factures et devis.</FieldDescription>
                </Field>

                <Field>
                  <FieldLabel htmlFor="paymentConditions">Conditions de paiement</FieldLabel>
                  <Input id="paymentConditions" value={paymentForm.paymentConditions}
                    onChange={(e) => setPaymentForm((p) => ({ ...p, paymentConditions: e.target.value }))}
                    placeholder="Ex: Paiement à 30 jours" />
                  <FieldDescription>Ces conditions seront ajoutées par défaut à vos factures.</FieldDescription>
                </Field>

                <Separator className="my-2" />

                <h3 className="font-semibold text-foreground">Moyens de paiement acceptés</h3>
                <FieldDescription>Sélectionnez les moyens de paiement que vous souhaitez afficher sur vos factures.</FieldDescription>

                <div className="space-y-3">
                  <CheckboxRoot
                    isSelected={selectedMethods.includes('bank_transfer')}
                    onChange={() => togglePaymentMethod('bank_transfer')}
                    className="flex items-center w-full gap-4 rounded-xl border border-border p-4 cursor-pointer hover:bg-surface transition-colors data-[selected=true]:border-primary/40 data-[selected=true]:bg-primary/5"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-soft">
                      <Banknote className="h-5 w-5 text-accent" />
                    </div>
                    <CheckboxContent className="flex-1 text-left">
                      <p className="text-sm font-medium text-foreground">Virement bancaire</p>
                      <p className="text-xs text-muted-foreground mt-[1px]">Vos coordonnées bancaires seront affichées sur la facture</p>
                    </CheckboxContent>
                    <CheckboxControl>
                      <CheckboxIndicator />
                    </CheckboxControl>
                  </CheckboxRoot>

                  <CheckboxRoot
                    isSelected={selectedMethods.includes('cash')}
                    onChange={() => togglePaymentMethod('cash')}
                    className="flex items-center w-full gap-4 rounded-xl border border-border p-4 cursor-pointer hover:bg-surface transition-colors data-[selected=true]:border-primary/40 data-[selected=true]:bg-primary/5"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-500/10">
                      <Coins className="h-5 w-5 text-green-500" />
                    </div>
                    <CheckboxContent className="flex-1 text-left">
                      <p className="text-sm font-medium text-foreground">Espèces</p>
                      <p className="text-xs text-muted-foreground mt-[1px]">Paiement en espèces accepté</p>
                    </CheckboxContent>
                    <CheckboxControl>
                      <CheckboxIndicator />
                    </CheckboxControl>
                  </CheckboxRoot>

                  <CheckboxRoot
                    isSelected={selectedMethods.includes('custom')}
                    onChange={() => togglePaymentMethod('custom')}
                    className="flex items-center w-full gap-4 rounded-xl border border-border p-4 cursor-pointer hover:bg-surface transition-colors data-[selected=true]:border-primary/40 data-[selected=true]:bg-primary/5"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-yellow-500/10">
                      <PenLine className="h-5 w-5 text-yellow-500" />
                    </div>
                    <CheckboxContent className="flex-1 text-left">
                      <p className="text-sm font-medium text-foreground">Autre</p>
                      <p className="text-xs text-muted-foreground mt-[1px]">Définissez un moyen de paiement personnalisé</p>
                    </CheckboxContent>
                    <CheckboxControl>
                      <CheckboxIndicator />
                    </CheckboxControl>
                  </CheckboxRoot>

                  {selectedMethods.includes('custom') && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="pl-14">
                      <Input placeholder="Ex: Chèque, PayPal, etc." value={customMethod}
                        onChange={(e) => updateInvoiceSettings({ customPaymentMethod: e.target.value })} />
                    </motion.div>
                  )}
                </div>

                <Separator className="my-2" />

                <h3 className="font-semibold text-foreground">Paiement en ligne</h3>

                <div className="space-y-3">
                  {stripeLoading ? (
                    <Skeleton className="h-20 w-full rounded-xl" />
                  ) : stripeConfigured ? (
                    <div className="rounded-xl border border-violet-500/30 bg-violet-500/5 p-4">
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-500/10">
                          <CreditCard className="h-5 w-5 text-violet-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="text-sm font-medium text-foreground">Stripe</p>
                            <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                            {stripeTestMode && (
                              <Badge variant="warning" className="text-[10px]">Mode test</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {stripeMaskedPk}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Button variant="outline" size="sm" onClick={() => setStripeModalOpen(true)}>
                            Modifier
                          </Button>
                          <Button variant="ghost" size="sm" onClick={handleDeleteStripe} disabled={deletingStripe}>
                            {deletingStripe ? <Spinner /> : <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />}
                          </Button>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center gap-2 rounded-lg bg-amber-500/5 border border-amber-500/10 px-3 py-2">
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                        <p className="text-[11px] text-amber-400">Des frais Stripe peuvent s&apos;appliquer sur chaque transaction</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4 rounded-xl border border-border p-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-500/10">
                        <CreditCard className="h-5 w-5 text-violet-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">Stripe</p>
                        <p className="text-xs text-muted-foreground">Carte bancaire, Apple Pay, Google Pay</p>
                      </div>
                      <Button size="sm" onClick={() => setStripeModalOpen(true)}>
                        Activer
                      </Button>
                    </div>
                  )}

                  <div className="flex items-center gap-4 rounded-xl border border-border p-4 opacity-50 cursor-not-allowed">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <CreditCard className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-muted-foreground">PayPal</p>
                      <p className="text-xs text-muted-foreground">Paiement via compte PayPal</p>
                    </div>
                    <Lock className="h-4 w-4 text-muted-foreground shrink-0" />
                  </div>
                </div>
              </FieldGroup>
            </form>
          )}
        </CardContent>
      </Card>

      <StripeActivationModal
        open={stripeModalOpen}
        onClose={() => setStripeModalOpen(false)}
        onActivated={() => loadStripeConfig()}
        webhookUrl={webhookUrl || `${window.location.origin.replace('dash.', 'api.')}/webhooks/stripe`}
      />

      <SaveBar
        hasChanges={hasChanges}
        saving={saving}
        error={saveError}
        onSave={() => handleSave()}
        onReset={handleReset}
      />
    </motion.div>
  )
}
