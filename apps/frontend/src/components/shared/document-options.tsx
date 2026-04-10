'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Check, Zap, ClipboardList, ChevronDown, ChevronRight, Building2, UserRound,
  Palette, Pen, Info, Landmark, Banknote, CreditCard, MoreHorizontal, Shield,
} from 'lucide-react'
import { Tooltip } from '@/components/ui/tooltip'
import { SelectRoot, SelectTrigger, SelectValue, SelectIndicator, SelectPopover } from '@/components/ui/select'
import { ListBoxRoot as ListBox, ListBoxItemRoot as ListBoxItem } from '@/components/ui/list-box'
import { AiGenerateButton } from '@/components/ai/ai-generate-button'
import type { ClientInfo } from './a4-sheet'


export interface DocumentOptions {
  billingType: 'quick' | 'detailed'
  subject: string
  issueDate: string
  validityDate: string
  deliveryAddress: string
  clientSiren: string
  clientVatNumber: string
  language: string
  acceptanceConditions: string
  signatureField: boolean
  documentTitle: string
  freeField: string
  globalDiscountType: 'none' | 'percentage' | 'fixed'
  globalDiscountValue: number
  showNotes: boolean
  vatExemptReason: 'none' | 'not_subject' | 'france_no_vat' | 'outside_france'
  footerText: string
  showSubject: boolean
  showDeliveryAddress: boolean
  showAcceptanceConditions: boolean
  showFreeField: boolean
  showFooterText: boolean
  facturX: boolean
}

interface DocumentOptionsProps {
  options: DocumentOptions
  onChange: (partial: Partial<DocumentOptions>) => void
  accentColor: string
  onAccentColorChange: (color: string) => void
  selectedClient: ClientInfo | null
  onOpenClientModal: () => void
  subtotal: number
  taxAmount: number
  discountAmount: number
  total: number
  tvaBreakdown: { rate: number; base: number; amount: number }[]
  documentType?: 'invoice' | 'quote' | 'credit_note'
  paymentMethod?: string
  onPaymentMethodChange?: (value: string) => void
  bankAccounts?: { id: string; label: string; bankName: string | null; isDefault: boolean }[]
  bankAccountId?: string
  onBankAccountChange?: (id: string) => void
  loadingBankAccount?: boolean
  eInvoicingEnabled?: boolean
  notes?: string
  onNotesChange?: (notes: string) => void
  enabledPaymentMethods?: string[]
  customPaymentMethodLabel?: string
  stripeConfigured?: boolean
}


const ACCENT_COLORS = [
  '#6366f1', '#3b82f6', '#8b5cf6', '#ec4899', '#ef4444',
  '#f97316', '#22c55e', '#14b8a6', '#6b7280', '#18181b',
]

function fmtCurrency(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n)
}


function CollapsibleSection({
  title, defaultOpen = false, children,
}: {
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="border-b border-border last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full py-2.5 px-1 text-left group"
      >
        <motion.div animate={{ rotate: open ? 90 : 0 }} transition={{ duration: 0.15 }}>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
        </motion.div>
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.5px] group-hover:text-foreground transition-colors">
          {title}
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="pb-3 px-1">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}


function OptionCheckbox({
  checked, onToggle, label, children,
}: {
  checked: boolean
  onToggle: () => void
  label: string
  children?: React.ReactNode
}) {
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center gap-2 cursor-pointer py-1 w-full text-left"
      >
        <div
          className={cn(
            'h-3.5 w-3.5 rounded border flex-shrink-0 flex items-center justify-center transition-colors',
            checked
              ? 'border-primary bg-primary'
              : 'border-muted-foreground/30 hover:border-muted-foreground/50',
          )}
        >
          {checked && <Check className="h-2 w-2 text-primary-foreground" />}
        </div>
        <span className="text-[13px] text-foreground">{label}</span>
      </button>
      {checked && children && <div className="ml-5.5 mt-1 mb-1">{children}</div>}
    </div>
  )
}


export function DocumentOptionsPanel({
  options, onChange, accentColor, onAccentColorChange,
  selectedClient, onOpenClientModal,
  subtotal, taxAmount, discountAmount, total, tvaBreakdown,
  documentType = 'invoice',
  paymentMethod = '', onPaymentMethodChange,
  bankAccounts = [], bankAccountId = '', onBankAccountChange, loadingBankAccount = false,
  eInvoicingEnabled = false,
  notes, onNotesChange,
  enabledPaymentMethods,
  customPaymentMethodLabel,
  stripeConfigured = false,
}: DocumentOptionsProps) {
  const [showSiren, setShowSiren] = useState(!!options.clientSiren || eInvoicingEnabled)
  const [showVat, setShowVat] = useState(!!options.clientVatNumber || eInvoicingEnabled)
  const [showTitle, setShowTitle] = useState(!!options.documentTitle)
  const [showDiscount, setShowDiscount] = useState(options.globalDiscountType !== 'none')

  return (
    <div className="space-y-3">
      {}
      <div className="rounded-3xl border border-border/40 bg-card/40 backdrop-blur-2xl liquid-glass px-4 py-2 shadow-overlay overflow-hidden">

        {}
        <CollapsibleSection title="Document" defaultOpen>
          {}
          <div className="mb-3">
            <label className="text-xs text-muted-foreground font-medium block mb-1">Type</label>
            <div className="flex gap-1">
              {[
                { id: 'quick' as const, label: 'Rapide', icon: Zap },
                { id: 'detailed' as const, label: 'Complet', icon: ClipboardList },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => onChange({ billingType: t.id })}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all',
                    options.billingType === t.id
                      ? 'border-primary bg-primary/5 text-foreground'
                      : 'border-border text-muted-foreground hover:border-muted-foreground/40',
                  )}
                >
                  <t.icon className="h-3 w-3" /> {t.label}
                </button>
              ))}
            </div>
          </div>

          {}
          <div className="mb-3">
            <label className="text-xs text-muted-foreground font-medium flex items-center gap-1.5 mb-1.5">
              <Palette className="h-3 w-3" /> Couleur
            </label>
            <div className="flex flex-wrap gap-1.5">
              {ACCENT_COLORS.map((c) => (
                <div
                  key={c}
                  onClick={() => onAccentColorChange(c)}
                  className="w-5 h-5 rounded-full cursor-pointer transition-all"
                  style={{
                    backgroundColor: c,
                    border: accentColor === c ? '2px solid currentColor' : '2px solid transparent',
                    boxShadow: accentColor === c ? `0 0 0 2px var(--card), 0 0 0 3px ${c}` : 'none',
                  }}
                />
              ))}
              <input
                type="color"
                value={accentColor}
                onChange={(e) => onAccentColorChange(e.target.value)}
                className="w-5 h-5 border-none p-0 cursor-pointer rounded bg-transparent"
                title="Personnalisee"
              />
            </div>
          </div>

          {/* Language */}
          <div className="mb-3">
            <label className="text-xs text-muted-foreground font-medium block mb-1">Langue</label>
            <div className="relative">
              <SelectRoot selectedKey={options.language} onSelectionChange={(k) => onChange({ language: k as string })}>
                <SelectTrigger>
                  <SelectValue />
                  <SelectIndicator />
                </SelectTrigger>
                <SelectPopover>
                  <ListBox>
                    <ListBoxItem id="fr">Français</ListBoxItem>
                    <ListBoxItem id="en">English</ListBoxItem>
                  </ListBox>
                </SelectPopover>
              </SelectRoot>
            </div>
          </div>

          {/* Custom title */}
          <OptionCheckbox
            checked={showTitle}
            onToggle={() => {
              setShowTitle(!showTitle)
              if (showTitle) onChange({ documentTitle: '' })
            }}
            label="Titre personnalisé"
          >
            <Input
              placeholder="DEVIS"
              value={options.documentTitle}
              onChange={(e) => onChange({ documentTitle: e.target.value })}
              className="h-7 text-sm"
            />
          </OptionCheckbox>
        </CollapsibleSection>

        {/* ── Client section ── */}
        <CollapsibleSection title="Client" defaultOpen>
          {/* Client selector */}
          <div className="mb-2">
            {selectedClient ? (
              <div className="rounded-lg border border-border p-2.5 bg-card/50">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    'h-6 w-6 rounded-lg flex items-center justify-center shrink-0',
                    selectedClient.type === 'company' ? 'bg-blue-500/10' : 'bg-green-500/10',
                  )}>
                    {selectedClient.type === 'company'
                      ? <Building2 className="h-3 w-3 text-blue-500" />
                      : <UserRound className="h-3 w-3 text-green-500" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-foreground truncate">{selectedClient.displayName}</p>
                  </div>
                  <Badge variant="muted" className="text-[9px] shrink-0">
                    {selectedClient.type === 'company' ? 'Pro' : 'Part.'}
                  </Badge>
                </div>
                <button
                  onClick={onOpenClientModal}
                  className="w-full mt-2 rounded-md border border-border px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground hover:border-muted-foreground/40 transition-colors flex items-center justify-center gap-1"
                >
                  <Pen className="h-2.5 w-2.5" /> Modifier
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenClientModal}
                className="w-full rounded-lg border border-dashed border-border px-3 py-2.5 text-[13px] text-muted-foreground hover:text-foreground hover:border-muted-foreground/40 transition-colors"
              >
                + Selectionner un client
              </button>
            )}
          </div>

          <OptionCheckbox
            checked={options.showDeliveryAddress}
            onToggle={() => {
              if (options.showDeliveryAddress) {
                onChange({ showDeliveryAddress: false, deliveryAddress: '' })
              } else {
                const addr = selectedClient
                  ? [selectedClient.address, selectedClient.addressComplement, `${selectedClient.postalCode || ''} ${selectedClient.city || ''}`].filter(Boolean).join('\n')
                  : ''
                onChange({ showDeliveryAddress: true, deliveryAddress: addr })
              }
            }}
            label="Adresse de livraison"
          />

          {eInvoicingEnabled && (
            <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 p-2 mb-2">
              <Shield className="h-3.5 w-3.5 text-primary shrink-0" />
              <p className="text-[10px] text-primary font-medium">E-facturation active — SIREN et TVA obligatoires</p>
            </div>
          )}

          <OptionCheckbox
            checked={showSiren || eInvoicingEnabled}
            onToggle={() => {
              if (eInvoicingEnabled) return
              setShowSiren(!showSiren)
              if (showSiren) onChange({ clientSiren: '' })
              else if (selectedClient?.type === 'company' && selectedClient.siren) {
                onChange({ clientSiren: selectedClient.siren })
              }
            }}
            label={eInvoicingEnabled ? 'SIREN (obligatoire)' : 'SIREN'}
          >
            {selectedClient?.type === 'company' ? (
              <Input
                placeholder="123456789"
                value={options.clientSiren}
                onChange={(e) => onChange({ clientSiren: e.target.value })}
                className={cn('h-7 text-sm', eInvoicingEnabled && options.clientSiren && 'bg-muted text-muted-foreground')}
                readOnly={eInvoicingEnabled && !!options.clientSiren}
              />
            ) : (
              <p className="text-[11px] text-muted-foreground italic">Non applicable (client particulier)</p>
            )}
          </OptionCheckbox>

          <OptionCheckbox
            checked={showVat || eInvoicingEnabled}
            onToggle={() => {
              if (eInvoicingEnabled) return
              setShowVat(!showVat)
              if (showVat) onChange({ clientVatNumber: '' })
              else if (selectedClient?.vatNumber) {
                onChange({ clientVatNumber: selectedClient.vatNumber })
              }
            }}
            label={eInvoicingEnabled ? 'TVA intracommunautaire (obligatoire)' : 'TVA intracommunautaire'}
          >
            <Input
              placeholder="FR12345678901"
              value={options.clientVatNumber}
              onChange={(e) => onChange({ clientVatNumber: e.target.value })}
              className={cn('h-7 text-sm', eInvoicingEnabled && options.clientVatNumber && 'bg-muted text-muted-foreground')}
              readOnly={eInvoicingEnabled && !!options.clientVatNumber}
            />
          </OptionCheckbox>
        </CollapsibleSection>

        {/* ── Moyen de paiement section (invoices only) ── */}
        {documentType === 'invoice' && onPaymentMethodChange && (() => {
          const filterable = [
            { id: 'bank_transfer', label: 'Virement', icon: Landmark, enabledKey: 'bank_transfer' },
            { id: 'cash', label: 'Espèces', icon: Banknote, enabledKey: 'cash' },
            {
              id: 'other',
              label: customPaymentMethodLabel?.trim() || 'Autre',
              icon: MoreHorizontal,
              enabledKey: 'custom',
            },
          ]
          const visibleFilterable = enabledPaymentMethods
            ? filterable.filter((m) => enabledPaymentMethods.includes(m.enabledKey))
            : filterable
          const visibleMethods = [
            ...(visibleFilterable.find((m) => m.id === 'bank_transfer') ? [visibleFilterable.find((m) => m.id === 'bank_transfer')!] : []),
            ...(stripeConfigured || !enabledPaymentMethods ? [{ id: 'stripe', label: 'Carte', icon: CreditCard, enabledKey: 'stripe' }] : []),
            ...visibleFilterable.filter((m) => m.id !== 'bank_transfer'),
          ]
          if (visibleMethods.length === 0) return null
          return (
          <CollapsibleSection title="Paiement">
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground font-medium block mb-1">Moyen de paiement</label>
              <div className="flex gap-1 flex-wrap">
                {visibleMethods.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      onPaymentMethodChange(paymentMethod === t.id ? '' : t.id)
                      if (paymentMethod === t.id && onBankAccountChange) onBankAccountChange('')
                    }}
                    className={cn(
                      'flex-1 min-w-[72px] flex items-center justify-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all',
                      paymentMethod === t.id
                        ? 'border-primary bg-primary/5 text-foreground'
                        : 'border-border text-muted-foreground hover:border-muted-foreground/40',
                    )}
                  >
                    <t.icon className="h-3 w-3" /> {t.label}
                  </button>
                ))}
              </div>
              {paymentMethod === 'bank_transfer' && bankAccounts.length > 0 && onBankAccountChange && (
                <div>
                  <label className="text-xs text-muted-foreground font-medium block mb-1">Compte bancaire</label>
                  <div className="relative">
                    <SelectRoot selectedKey={bankAccountId} onSelectionChange={(k) => onBankAccountChange(k === 'none' ? '' : k as string)} isDisabled={loadingBankAccount}>
                      <SelectTrigger>
                        <SelectValue />
                        {loadingBankAccount ? (
                          <svg viewBox="25 25 50 50" className="h-3.5 w-3.5 text-muted-foreground animate-spinner-rotate">
                            <circle r={20} cy={50} cx={50} className="animate-spinner-dash fill-none stroke-current stroke-2" strokeLinecap="round" />
                          </svg>
                        ) : (
                          <SelectIndicator />
                        )}
                      </SelectTrigger>
                      <SelectPopover>
                        <ListBox>
                          <ListBoxItem id="none">Sélectionner un compte</ListBoxItem>
                          {bankAccounts.map((a) => (
                            <ListBoxItem key={a.id} id={a.id}>{a.label}{a.isDefault ? ' (défaut)' : ''}</ListBoxItem>
                          ))}
                        </ListBox>
                      </SelectPopover>
                    </SelectRoot>
                  </div>
                </div>
              )}
              {paymentMethod === 'bank_transfer' && bankAccounts.length === 0 && (
                <p className="text-[11px] text-muted-foreground italic">
                  Aucun compte bancaire configuré. Ajoutez-en un dans les paramètres de votre entreprise.
                </p>
              )}
            </div>
          </CollapsibleSection>
          )
        })()}

        {/* ── Options section ── */}
        <CollapsibleSection title="Options">
          <div className="space-y-0.5">
            <OptionCheckbox
              checked={options.showSubject}
              onToggle={() => onChange({ showSubject: !options.showSubject })}
              label="Objet"
            >
              <AiGenerateButton
                type="invoice_subject"
                context={selectedClient?.displayName || ''}
                language={options.language}
                onGenerated={(text) => onChange({ subject: text })}
                size="sm"
                label="Générer"
              />
            </OptionCheckbox>

            <OptionCheckbox
              checked={options.showAcceptanceConditions}
              onToggle={() => {
                onChange({
                  showAcceptanceConditions: !options.showAcceptanceConditions,
                  ...(options.showAcceptanceConditions ? { acceptanceConditions: '' } : {}),
                })
              }}
              label="Conditions d'acceptation"
            >
              <AiGenerateButton
                type="acceptance_conditions"
                language={options.language}
                onGenerated={(text) => onChange({ acceptanceConditions: text })}
                size="sm"
                label="Générer"
              />
            </OptionCheckbox>

            <OptionCheckbox
              checked={options.signatureField}
              onToggle={() => onChange({ signatureField: !options.signatureField })}
              label="Champ signature"
            />

            <OptionCheckbox
              checked={options.showFreeField}
              onToggle={() => {
                onChange({
                  showFreeField: !options.showFreeField,
                  ...(options.showFreeField ? { freeField: '' } : {}),
                })
              }}
              label="Champ libre"
            >
              <AiGenerateButton
                type="free_text"
                context={`${documentType === 'invoice' ? 'Facture' : documentType === 'quote' ? 'Devis' : 'Avoir'} pour ${selectedClient?.displayName || 'client'}`}
                language={options.language}
                onGenerated={(text) => onChange({ freeField: text })}
                size="sm"
                label="Générer"
              />
            </OptionCheckbox>

            <OptionCheckbox
              checked={showDiscount}
              onToggle={() => {
                setShowDiscount(!showDiscount)
                if (showDiscount) onChange({ globalDiscountType: 'none', globalDiscountValue: 0 })
                else onChange({ globalDiscountType: 'percentage' })
              }}
              label="Remise globale"
            >
              <div className="space-y-1.5">
                <div className="flex gap-1.5">
                  {([
                    { id: 'percentage' as const, label: '%' },
                    { id: 'fixed' as const, label: 'EUR' },
                  ]).map((t) => (
                    <button
                      key={t.id}
                      onClick={() => onChange({ globalDiscountType: t.id, globalDiscountValue: 0 })}
                      className={cn(
                        'rounded-md border px-3 py-0.5 text-xs font-medium transition-all',
                        options.globalDiscountType === t.id
                          ? 'border-primary bg-primary/5 text-foreground'
                          : 'border-border text-muted-foreground hover:border-muted-foreground/40',
                      )}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder={options.globalDiscountType === 'percentage' ? 'Ex: 10' : 'Ex: 100.00'}
                  value={options.globalDiscountValue || ''}
                  onChange={(e) => onChange({ globalDiscountValue: parseFloat(e.target.value) || 0 })}
                  className="h-7 text-sm"
                />
              </div>
            </OptionCheckbox>

            <OptionCheckbox
              checked={options.showNotes}
              onToggle={() => onChange({ showNotes: !options.showNotes })}
              label="Notes et conditions"
            >
              {onNotesChange && (
                <AiGenerateButton
                  type="invoice_notes"
                  context={`${documentType === 'invoice' ? 'Facture' : documentType === 'quote' ? 'Devis' : 'Avoir'}`}
                  language={options.language}
                  onGenerated={onNotesChange}
                  size="sm"
                  label="Générer"
                />
              )}
            </OptionCheckbox>

            <OptionCheckbox
              checked={options.showFooterText}
              onToggle={() => {
                onChange({
                  showFooterText: !options.showFooterText,
                  ...(options.showFooterText ? { footerText: '' } : {}),
                })
              }}
              label="Texte de pied de page"
            />
          </div>
        </CollapsibleSection>

        {/* ── TVA section ── */}
        <CollapsibleSection title="TVA" defaultOpen>
          <div>
            <label className="text-xs text-muted-foreground font-medium block mb-1">Exonération</label>
            <div className="relative">
              <SelectRoot selectedKey={options.vatExemptReason} onSelectionChange={(k) => onChange({ vatExemptReason: k as DocumentOptions['vatExemptReason'] })}>
                <SelectTrigger>
                  <SelectValue />
                  <SelectIndicator />
                </SelectTrigger>
                <SelectPopover>
                  <ListBox>
                    <ListBoxItem id="none">Aucun motif</ListBoxItem>
                    <ListBoxItem id="not_subject">Non soumis à la TVA (art. 293B)</ListBoxItem>
                    <ListBoxItem id="france_no_vat">Exonération TVA (art. 261)</ListBoxItem>
                    <ListBoxItem id="outside_france">Prestation hors France (art. 259-1)</ListBoxItem>
                  </ListBox>
                </SelectPopover>
              </SelectRoot>
            </div>
          </div>
        </CollapsibleSection>
      </div>

      {/* ── Summary card ── */}
      <div className="rounded-[2rem] border border-border/40 bg-card/40 backdrop-blur-2xl liquid-glass px-5 py-4 shadow-overlay relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.5px] mb-3">
          Recapitulatif
        </h3>

        <div className="flex justify-between mb-1.5">
          <span className="text-[13px] text-muted-foreground">Total HT</span>
          <span className="text-[13px] font-semibold text-foreground">{fmtCurrency(subtotal)}</span>
        </div>

        {tvaBreakdown.map((e) => (
          <div key={e.rate} className="flex justify-between mb-1">
            <span className="text-xs text-muted-foreground">TVA {e.rate}%</span>
            <span className="text-xs text-muted-foreground">{fmtCurrency(e.amount)}</span>
          </div>
        ))}

        {discountAmount > 0 && (
          <div className="flex justify-between mb-1">
            <span className="text-xs text-muted-foreground">Remise</span>
            <span className="text-xs text-red-400">-{fmtCurrency(discountAmount)}</span>
          </div>
        )}

        <div className="border-t-2 border-foreground/20 pt-2 mt-2 flex justify-between">
          <span className="text-[15px] font-bold text-foreground">Total TTC</span>
          <span className="text-[15px] font-bold" style={{ color: accentColor }}>{fmtCurrency(total)}</span>
        </div>
      </div>
    </div>
  )
}
