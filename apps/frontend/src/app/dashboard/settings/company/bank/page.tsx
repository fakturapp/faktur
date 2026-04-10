'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Field, FieldLabel, FieldDescription } from '@/components/ui/field'
import { useToast } from '@/components/ui/toast'
import { Spinner } from '@/components/ui/spinner'
import { Dialog, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { IbanInput } from '@/components/ui/iban-input'
import { useCompanySettings, type BankAccountItem, type BankAccountForm } from '@/lib/company-settings-context'
import { api } from '@/lib/api'
import { CreditCard, Banknote, Plus, Shield, Star, Pencil, Trash2 } from 'lucide-react'
import { CheckboxRoot, CheckboxControl, CheckboxIndicator, CheckboxContent } from '@/components/ui/checkbox'

const BANK_DOMAINS: Record<string, string> = {
  'bnp paribas': 'bnpparibas.com', 'bnp': 'bnpparibas.com',
  'société générale': 'societegenerale.com', 'societe generale': 'societegenerale.com',
  'crédit agricole': 'credit-agricole.fr', 'credit agricole': 'credit-agricole.fr',
  'caisse d\'épargne': 'caisse-epargne.fr', 'caisse d\'epargne': 'caisse-epargne.fr',
  'lcl': 'lcl.fr', 'crédit lyonnais': 'lcl.fr', 'credit lyonnais': 'lcl.fr',
  'cic': 'cic.fr', 'crédit mutuel': 'creditmutuel.fr', 'credit mutuel': 'creditmutuel.fr',
  'la banque postale': 'labanquepostale.fr', 'banque postale': 'labanquepostale.fr',
  'boursorama': 'boursorama.com', 'boursobank': 'boursorama.com',
  'hsbc': 'hsbc.fr', 'banque populaire': 'banquepopulaire.fr',
  'fortuneo': 'fortuneo.fr', 'ing': 'ing.fr', 'n26': 'n26.com',
  'revolut': 'revolut.com', 'qonto': 'qonto.com', 'shine': 'shine.fr',
  'monabanq': 'monabanq.com', 'hello bank': 'hellobank.fr',
  'axa banque': 'axabanque.fr', 'crédit du nord': 'credit-du-nord.fr', 'credit du nord': 'credit-du-nord.fr',
  'milleis': 'milleis.fr', 'bred': 'bred.fr', 'bforbank': 'bforbank.com',
  'orange bank': 'orangebank.fr', 'wise': 'wise.com', 'paypal': 'paypal.com', 'stripe': 'stripe.com',
}

function getBankLogoUrl(bankName: string | null): string | null {
  if (!bankName) return null
  const normalized = bankName.toLowerCase().trim()
  if (BANK_DOMAINS[normalized]) return `https://logo.clearbit.com/${BANK_DOMAINS[normalized]}`
  for (const [key, domain] of Object.entries(BANK_DOMAINS)) {
    if (normalized.includes(key) || key.includes(normalized)) return `https://logo.clearbit.com/${domain}`
  }
  return null
}

export default function BankPage() {
  const { toast } = useToast()
  const { loading, noCompany, bankAccounts, bankLoading, loadBankAccounts } = useCompanySettings()

  const [bankDialogOpen, setBankDialogOpen] = useState(false)
  const [bankEditId, setBankEditId] = useState<string | null>(null)
  const [bankSaving, setBankSaving] = useState(false)
  const [bankDeleting, setBankDeleting] = useState<string | null>(null)
  const [bankForm, setBankForm] = useState<BankAccountForm>({
    label: '', bankName: '', iban: '', bic: '', isDefault: false,
  })

  function openBankDialog(account?: BankAccountItem) {
    if (account) {
      setBankEditId(account.id)
      api.get<{ bankAccount: any }>(`/company/bank-accounts/${account.id}`).then(({ data }) => {
        if (data?.bankAccount) {
          const rawIban = (data.bankAccount.iban || '').replace(/\s/g, '').toUpperCase()
          const formattedIban = rawIban.replace(/(.{4})/g, '$1 ').trim()
          setBankForm({
            label: data.bankAccount.label,
            bankName: data.bankAccount.bankName || '',
            iban: formattedIban,
            bic: (data.bankAccount.bic || '').toUpperCase(),
            isDefault: data.bankAccount.isDefault,
          })
        }
      })
    } else {
      setBankEditId(null)
      setBankForm({ label: '', bankName: '', iban: '', bic: '', isDefault: false })
    }
    setBankDialogOpen(true)
  }

  async function handleSaveBankAccount() {
    if (!bankForm.label.trim()) { toast('Le libellé est requis', 'error'); return }
    setBankSaving(true)
    const payload = {
      label: bankForm.label,
      bankName: bankForm.bankName || undefined,
      iban: bankForm.iban.replace(/\s/g, '') || undefined,
      bic: bankForm.bic || undefined,
      isDefault: bankForm.isDefault,
    }
    const { error } = bankEditId
      ? await api.put(`/company/bank-accounts/${bankEditId}`, payload)
      : await api.post('/company/bank-accounts', payload)
    setBankSaving(false)
    if (error) return toast(error, 'error')
    toast(bankEditId ? 'Compte bancaire mis à jour' : 'Compte bancaire ajouté', 'success')
    setBankDialogOpen(false)
    loadBankAccounts()
  }

  async function handleDeleteBank(id: string) {
    setBankDeleting(id)
    const { error } = await api.delete(`/company/bank-accounts/${id}`)
    setBankDeleting(null)
    if (error) return toast(error, 'error')
    toast('Compte bancaire supprimé', 'success')
    loadBankAccounts()
  }

  if (loading) {
    return (
      <div className="space-y-6 px-4 lg:px-6 py-4 md:py-6">
        <div className="space-y-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="rounded-xl bg-surface shadow-surface p-6 space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 px-4 lg:px-6 py-4 md:py-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Banque</h1>
        <p className="text-muted-foreground text-sm mt-1">Gérez vos comptes bancaires pour les factures.</p>
      </div>

      <Card>
        <CardContent className="p-6">
          {noCompany ? (
            <div className="flex flex-col items-center py-8 text-center">
              <CreditCard className="h-8 w-8 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                Créez d&apos;abord votre entreprise dans la page Informations.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-foreground">Coordonnées bancaires</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">Gérez vos comptes bancaires pour les factures.</p>
                </div>
                <Button size="sm" onClick={() => openBankDialog()}>
                  <Plus className="h-3.5 w-3.5 mr-1.5" /> Ajouter
                </Button>
              </div>

              {bankLoading ? (
                <div className="flex justify-center py-8"><Spinner /></div>
              ) : bankAccounts.length === 0 ? (
                <div className="flex flex-col items-center py-10 text-center">
                  <CreditCard className="h-8 w-8 text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">Aucun compte bancaire enregistré.</p>
                  <p className="text-xs text-muted-foreground mt-1">Ajoutez un compte pour l&apos;afficher sur vos factures.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {bankAccounts.map((account) => {
                    const logoUrl = getBankLogoUrl(account.bankName)
                    return (
                      <div key={account.id} className="flex items-center gap-4 rounded-xl border border-border p-4 hover:bg-surface transition-colors">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-soft overflow-hidden">
                          {logoUrl ? (
                            <img src={logoUrl} alt={account.bankName || ''} className="h-6 w-6 object-contain"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden') }} />
                          ) : null}
                          <Banknote className={`h-5 w-5 text-accent ${logoUrl ? 'hidden' : ''}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-foreground truncate">{account.label}</p>
                            {account.isDefault && <Badge variant="default" className="text-[10px] shrink-0">Par défaut</Badge>}
                          </div>
                          <div className="flex items-center gap-3 mt-0.5">
                            {account.bankName && <span className="text-xs text-muted-foreground">{account.bankName}</span>}
                            {account.ibanMasked && <span className="text-xs text-muted-foreground font-mono">{account.ibanMasked}</span>}
                            {account.bicMasked && <span className="text-xs text-muted-foreground font-mono">{account.bicMasked}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button onClick={() => openBankDialog(account)}
                            className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-surface-hover transition-colors">
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => handleDeleteBank(account.id)} disabled={bankDeleting === account.id}
                            className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                            {bankDeleting === account.id ? <Spinner className="h-3.5 w-3.5" /> : <Trash2 className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bank account add/edit dialog */}
      <Dialog open={bankDialogOpen} onClose={() => setBankDialogOpen(false)} className="max-w-md">
        <DialogHeader onClose={() => setBankDialogOpen(false)}>
          <DialogTitle>{bankEditId ? 'Modifier le compte bancaire' : 'Ajouter un compte bancaire'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <Field>
            <FieldLabel htmlFor="bankLabel">Libellé *</FieldLabel>
            <Input id="bankLabel" value={bankForm.label} onChange={(e) => setBankForm((p) => ({ ...p, label: e.target.value }))} placeholder="Ex: Ma banque principale" />
          </Field>
          <Field>
            <FieldLabel htmlFor="bankNameField">Nom de la banque</FieldLabel>
            <div className="flex items-center gap-3">
              {getBankLogoUrl(bankForm.bankName) && (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-white overflow-hidden">
                  <img src={getBankLogoUrl(bankForm.bankName)!} alt={bankForm.bankName} className="h-6 w-6 object-contain" />
                </div>
              )}
              <Input id="bankNameField" value={bankForm.bankName} onChange={(e) => setBankForm((p) => ({ ...p, bankName: e.target.value }))} placeholder="Ex: BNP Paribas" className="flex-1" />
            </div>
          </Field>
          <Field>
            <FieldLabel htmlFor="bankIban">IBAN</FieldLabel>
            <IbanInput id="bankIban" value={bankForm.iban} onChange={(raw) => setBankForm((p) => ({ ...p, iban: raw }))} />
            <FieldDescription>{bankForm.iban.replace(/\s/g, '').length}/34 caractères</FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor="bankBic">BIC / SWIFT</FieldLabel>
            <Input id="bankBic" value={bankForm.bic}
              onChange={(e) => { const raw = e.target.value.replace(/\s/g, '').toUpperCase().slice(0, 11); setBankForm((p) => ({ ...p, bic: raw })) }}
              placeholder="BNPAFRPP" className="font-mono tracking-wider" maxLength={11} />
            <FieldDescription>{bankForm.bic.length}/11 caractères</FieldDescription>
          </Field>
          <div className="space-y-3">
            <div className="flex items-center gap-3 rounded-lg bg-surface-hover px-3 py-2">
              <Shield className="h-4 w-4 text-accent shrink-0" />
              <div>
                <span className="text-sm font-medium text-foreground">Chiffrement zero-access</span>
                <span className="text-xs text-muted-foreground block">L&apos;IBAN et le BIC sont automatiquement chiffrés (AES-256-GCM).</span>
              </div>
            </div>
            <CheckboxRoot 
              isSelected={bankForm.isDefault} 
              onChange={(checked) => setBankForm((p) => ({ ...p, isDefault: checked }))} 
              className="flex items-center gap-3 cursor-pointer"
            >
              <CheckboxControl>
                <CheckboxIndicator />
              </CheckboxControl>
              <CheckboxContent>
                <span className="text-sm font-medium text-foreground flex items-center gap-1.5"><Star className="h-3.5 w-3.5" /> Compte par défaut</span>
                <span className="text-xs text-muted-foreground mt-[1px] block">Ce compte sera sélectionné par défaut sur les nouvelles factures.</span>
              </CheckboxContent>
            </CheckboxRoot>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => setBankDialogOpen(false)}>Annuler</Button>
          <Button size="sm" onClick={handleSaveBankAccount} disabled={bankSaving}>
            {bankSaving ? <><Spinner className="h-3.5 w-3.5" /> Enregistrement...</> : bankEditId ? 'Mettre à jour' : 'Ajouter'}
          </Button>
        </DialogFooter>
      </Dialog>
    </motion.div>
  )
}
