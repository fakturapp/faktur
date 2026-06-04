'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  AlertTriangle,
  Banknote,
  CheckCircle,
  Coins,
  CreditCard,
  Lock,
  PenLine,
  Receipt,
  Trash2,
} from '@/components/ui/icons'
import { api } from '@/lib/api'
import { useToast } from '@/components/ui/toast'
import { useCompanySettings } from '@/lib/company-settings-context'
import { useInvoiceSettings } from '@/lib/invoice-settings-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CheckboxContent, CheckboxControl, CheckboxIndicator, CheckboxRoot } from '@/components/ui/checkbox'
import { FormSelect } from '@/components/ui/dropdown'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { SaveBar } from '@/components/ui/save-bar'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { StripeActivationModal } from '@/components/settings/stripe-activation-modal'

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
    settings,
    loading: invoiceLoading,
    hasChanges: invoiceHasChanges,
    saving: invoiceSaving,
    saveError: invoiceSaveError,
    updateSettings,
    save,
    resetChanges,
    refreshSettings,
  } = useInvoiceSettings()

  const [stripeLoading, setStripeLoading] = useState(true)
  const [stripeConfigured, setStripeConfigured] = useState(false)
  const [stripeTestMode, setStripeTestMode] = useState(false)
  const [stripeMaskedPk, setStripeMaskedPk] = useState('')
  const [stripeMaskedSk, setStripeMaskedSk] = useState('')
  const [stripeModalOpen, setStripeModalOpen] = useState(false)
  const [webhookUrl, setWebhookUrl] = useState('')
  const [deletingStripe, setDeletingStripe] = useState(false)

  useEffect(() => {
    void loadStripeConfig()
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

    if (error) {
      toast(error, 'error')
      return
    }

    toast('Configuration Stripe supprimée', 'success')
    setStripeConfigured(false)
    setStripeMaskedPk('')
    setStripeMaskedSk('')
    await refreshSettings()
  }

  function togglePaymentMethod(method: string) {
    if (method === 'stripe' && !stripeConfigured) {
      setStripeModalOpen(true)
      return
    }

    const paymentMethods = settings.paymentMethods.includes(method)
      ? settings.paymentMethods.filter((current) => current !== method)
      : [...settings.paymentMethods, method]

    updateSettings({ paymentMethods })
  }

  async function handleSavePayment(e?: React.FormEvent) {
    if (e) e.preventDefault()

    const companySaved = paymentHasChanges ? await savePayment() : true
    if (!companySaved) return

    if (invoiceHasChanges) {
      await save()
    }
  }

  function handleResetPayment() {
    if (paymentHasChanges) resetPayment()
    if (invoiceHasChanges) resetChanges()
  }

  if (companyLoading || invoiceLoading) {
    return (
      <div className="space-y-6 px-4 py-4 md:py-6 lg:px-6">
        <div className="space-y-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="rounded-xl bg-surface p-6 shadow-surface space-y-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 px-4 py-4 md:py-6 lg:px-6"
    >
      <div>
        <h1 className="text-2xl font-bold text-foreground">Paiement</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Devise, conditions et moyens de paiement.
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          {noCompany ? (
            <div className="flex flex-col items-center py-8 text-center">
              <Receipt className="mb-3 h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Créez d&apos;abord votre entreprise dans la page Informations.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSavePayment}>
              <FieldGroup>
                <h3 className="font-semibold text-foreground">Devise et conditions</h3>

                <Field>
                  <FieldLabel htmlFor="currency">Devise</FieldLabel>
                  <FormSelect
                    id="currency"
                    value={paymentForm.currency}
                    onChange={(value) => setPaymentForm((prev) => ({ ...prev, currency: value }))}
                    options={[
                      { value: 'EUR', label: 'EUR - Euro' },
                      { value: 'USD', label: 'USD - Dollar americain' },
                      { value: 'GBP', label: 'GBP - Livre sterling' },
                      { value: 'CHF', label: 'CHF - Franc suisse' },
                      { value: 'CAD', label: 'CAD - Dollar canadien' },
                    ]}
                  />
                  <FieldDescription>
                    La devise utilisee par defaut sur vos factures et devis.
                  </FieldDescription>
                </Field>

                <Field>
                  <FieldLabel htmlFor="paymentConditions">Conditions de paiement</FieldLabel>
                  <Input
                    id="paymentConditions"
                    value={paymentForm.paymentConditions}
                    onChange={(e) =>
                      setPaymentForm((prev) => ({ ...prev, paymentConditions: e.target.value }))
                    }
                    placeholder="Ex: Paiement a 30 jours"
                  />
                  <FieldDescription>
                    Ces conditions seront ajoutees par defaut a vos factures.
                  </FieldDescription>
                </Field>

                <Separator className="my-2" />

                <h3 className="font-semibold text-foreground">Moyens de paiement acceptes</h3>
                <FieldDescription>
                  Selectionnez les moyens de paiement que vous souhaitez afficher sur vos factures.
                </FieldDescription>

                <div className="space-y-3">
                  <CheckboxRoot
                    isSelected={settings.paymentMethods.includes('bank_transfer')}
                    onChange={() => togglePaymentMethod('bank_transfer')}
                    className="flex w-full cursor-pointer items-center gap-4 rounded-xl border border-border p-4 transition-colors hover:bg-surface data-[selected=true]:border-primary/40 data-[selected=true]:bg-primary/5"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-soft">
                      <Banknote className="h-5 w-5 text-accent" />
                    </div>
                    <CheckboxContent className="flex-1 text-left">
                      <p className="text-sm font-medium text-foreground">Virement bancaire</p>
                      <p className="mt-[1px] text-xs text-muted-foreground">
                        Vos coordonnees bancaires seront affichees sur la facture
                      </p>
                    </CheckboxContent>
                    <CheckboxControl>
                      <CheckboxIndicator />
                    </CheckboxControl>
                  </CheckboxRoot>

                  <CheckboxRoot
                    isSelected={settings.paymentMethods.includes('cash')}
                    onChange={() => togglePaymentMethod('cash')}
                    className="flex w-full cursor-pointer items-center gap-4 rounded-xl border border-border p-4 transition-colors hover:bg-surface data-[selected=true]:border-primary/40 data-[selected=true]:bg-primary/5"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-500/10">
                      <Coins className="h-5 w-5 text-green-500" />
                    </div>
                    <CheckboxContent className="flex-1 text-left">
                      <p className="text-sm font-medium text-foreground">Especes</p>
                      <p className="mt-[1px] text-xs text-muted-foreground">
                        Paiement en especes accepte
                      </p>
                    </CheckboxContent>
                    <CheckboxControl>
                      <CheckboxIndicator />
                    </CheckboxControl>
                  </CheckboxRoot>

                  <CheckboxRoot
                    isSelected={settings.paymentMethods.includes('custom')}
                    onChange={() => togglePaymentMethod('custom')}
                    className="flex w-full cursor-pointer items-center gap-4 rounded-xl border border-border p-4 transition-colors hover:bg-surface data-[selected=true]:border-primary/40 data-[selected=true]:bg-primary/5"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-yellow-500/10">
                      <PenLine className="h-5 w-5 text-yellow-500" />
                    </div>
                    <CheckboxContent className="flex-1 text-left">
                      <p className="text-sm font-medium text-foreground">Autre</p>
                      <p className="mt-[1px] text-xs text-muted-foreground">
                        Definissez un moyen de paiement personnalise
                      </p>
                    </CheckboxContent>
                    <CheckboxControl>
                      <CheckboxIndicator />
                    </CheckboxControl>
                  </CheckboxRoot>

                  {settings.paymentMethods.includes('custom') && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="pl-14"
                    >
                      <Input
                        placeholder="Ex: Cheque, PayPal, etc."
                        value={settings.customPaymentMethod}
                        onChange={(e) => updateSettings({ customPaymentMethod: e.target.value })}
                      />
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
                        <div className="min-w-0 flex-1">
                          <div className="mb-0.5 flex items-center gap-2">
                            <p className="text-sm font-medium text-foreground">Stripe</p>
                            <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                            {stripeTestMode && (
                              <Badge variant="warning" className="text-[10px]">
                                Mode test
                              </Badge>
                            )}
                          </div>
                          <p className="truncate text-xs text-muted-foreground">{stripeMaskedPk}</p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => setStripeModalOpen(true)}>
                            Modifier
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleDeleteStripe}
                            disabled={deletingStripe}
                          >
                            {deletingStripe ? (
                              <Spinner />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                            )}
                          </Button>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center gap-2 rounded-lg border border-amber-500/10 bg-amber-500/5 px-3 py-2">
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                        <p className="text-[11px] text-amber-400">
                          Des frais Stripe peuvent s&apos;appliquer sur chaque transaction
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4 rounded-xl border border-border p-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-500/10">
                        <CreditCard className="h-5 w-5 text-violet-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">Stripe</p>
                        <p className="text-xs text-muted-foreground">
                          Carte bancaire, Apple Pay, Google Pay
                        </p>
                      </div>
                      <Button size="sm" onClick={() => setStripeModalOpen(true)}>
                        Activer
                      </Button>
                    </div>
                  )}

                  <div className="flex cursor-not-allowed items-center gap-4 rounded-xl border border-border p-4 opacity-50">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <CreditCard className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-muted-foreground">PayPal</p>
                      <p className="text-xs text-muted-foreground">
                        Paiement via compte PayPal
                      </p>
                    </div>
                    <Lock className="h-4 w-4 shrink-0 text-muted-foreground" />
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
        onActivated={async () => {
          await loadStripeConfig()
          await refreshSettings()
        }}
        webhookUrl={webhookUrl || `${window.location.origin.replace('dash.', 'api.')}/webhooks/stripe`}
      />

      <SaveBar
        hasChanges={paymentHasChanges || invoiceHasChanges}
        saving={paymentSaving || invoiceSaving}
        error={paymentSaveError || invoiceSaveError}
        onSave={() => void handleSavePayment()}
        onReset={handleResetPayment}
      />
    </motion.div>
  )
}
