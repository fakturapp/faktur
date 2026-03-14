'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Check, Zap, ClipboardList, ChevronDown, Building2, UserRound,
  Palette, Pen,
} from 'lucide-react'
import type { ClientInfo } from './a4-sheet'

/* ═══════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════ */

export interface QuoteOptions {
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
  vatExempt: boolean
  footerText: string
  showSubject: boolean
  showDeliveryAddress: boolean
  showAcceptanceConditions: boolean
  showFreeField: boolean
  showFooterText: boolean
}

interface QuoteOptionsProps {
  options: QuoteOptions
  onChange: (partial: Partial<QuoteOptions>) => void
  accentColor: string
  onAccentColorChange: (color: string) => void
  selectedClient: ClientInfo | null
  onOpenClientModal: () => void
  subtotal: number
  taxAmount: number
  discountAmount: number
  total: number
  tvaBreakdown: { rate: number; base: number; amount: number }[]
}

/* ═══════════════════════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════════════════════ */

const ACCENT_COLORS = [
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#ec4899',
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#06b6d4', '#64748b',
]

function fmtCurrency(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n)
}

/* ═══════════════════════════════════════════════════════════
   OptionCheckbox — toggle with nested content
   ═══════════════════════════════════════════════════════════ */

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
        className="flex items-center gap-2.5 cursor-pointer py-1.5 w-full text-left"
      >
        <div
          className={cn(
            'h-4 w-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors',
            checked
              ? 'border-primary bg-primary'
              : 'border-muted-foreground/30 hover:border-muted-foreground/50',
          )}
        >
          {checked && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
        </div>
        <span className="text-sm text-foreground">{label}</span>
      </button>
      {checked && children && <div className="ml-6 mt-1.5 mb-1">{children}</div>}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   QuoteOptionsPanel
   ═══════════════════════════════════════════════════════════ */

export function QuoteOptionsPanel({
  options, onChange, accentColor, onAccentColorChange,
  selectedClient, onOpenClientModal,
  subtotal, taxAmount, discountAmount, total, tvaBreakdown,
}: QuoteOptionsProps) {
  const [showSiren, setShowSiren] = useState(!!options.clientSiren)
  const [showVat, setShowVat] = useState(!!options.clientVatNumber)
  const [showTitle, setShowTitle] = useState(!!options.documentTitle)
  const [showDiscount, setShowDiscount] = useState(options.globalDiscountType !== 'none')

  return (
    <div className="space-y-4">
      {/* ── Settings card ── */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.5px] mb-4">
          Parametres
        </h3>

        {/* Billing Type */}
        <div className="mb-4">
          <label className="text-xs text-muted-foreground font-medium block mb-1.5">Type de facture</label>
          <div className="flex gap-1">
            {[
              { id: 'quick' as const, label: 'Rapide', icon: Zap },
              { id: 'detailed' as const, label: 'Complet', icon: ClipboardList },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => onChange({ billingType: t.id })}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-all',
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

        {/* Accent Color */}
        <div className="mb-4">
          <label className="text-xs text-muted-foreground font-medium flex items-center gap-1.5 mb-2">
            <Palette className="h-3 w-3" /> Couleur du bandeau
          </label>
          <div className="flex flex-wrap gap-1.5">
            {ACCENT_COLORS.map((c) => (
              <div
                key={c}
                onClick={() => onAccentColorChange(c)}
                className="w-6 h-6 rounded-full cursor-pointer transition-all"
                style={{
                  backgroundColor: c,
                  border: accentColor === c ? '2px solid currentColor' : '2px solid transparent',
                  boxShadow: accentColor === c ? `0 0 0 2px var(--card), 0 0 0 4px ${c}` : 'none',
                }}
              />
            ))}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <input
              type="color"
              value={accentColor}
              onChange={(e) => onAccentColorChange(e.target.value)}
              className="w-6 h-6 border-none p-0 cursor-pointer rounded bg-transparent"
            />
            <span className="text-[10px] text-muted-foreground">Personnalisee</span>
          </div>
        </div>



        {/* Language */}
        <div className="mb-4">
          <label className="text-xs text-muted-foreground font-medium block mb-1.5">Langue</label>
          <div className="relative">
            <select
              value={options.language}
              onChange={(e) => onChange({ language: e.target.value })}
              className="w-full appearance-none rounded-lg border border-border bg-transparent px-3 py-1.5 pr-8 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
            >
              <option value="fr">Francais</option>
              <option value="en">English</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        {/* Client */}
        <div className="mb-4">
          <label className="text-xs text-muted-foreground font-medium block mb-2">Client</label>
          {selectedClient ? (
            <div className="rounded-lg border border-border p-3 bg-card/50">
              <div className="flex items-center gap-2 mb-1">
                <div className={cn(
                  'h-7 w-7 rounded-lg flex items-center justify-center shrink-0',
                  selectedClient.type === 'company' ? 'bg-blue-500/10' : 'bg-green-500/10',
                )}>
                  {selectedClient.type === 'company'
                    ? <Building2 className="h-3.5 w-3.5 text-blue-500" />
                    : <UserRound className="h-3.5 w-3.5 text-green-500" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{selectedClient.displayName}</p>
                  <Badge variant="muted" className="text-[9px]">
                    {selectedClient.type === 'company' ? 'Pro' : 'Part.'}
                  </Badge>
                </div>
              </div>
              <button
                onClick={onOpenClientModal}
                className="w-full mt-2 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:border-muted-foreground/40 transition-colors flex items-center justify-center gap-1.5"
              >
                <Pen className="h-3 w-3" /> Modifier
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenClientModal}
              className="w-full rounded-lg border border-dashed border-border px-3 py-3 text-sm text-muted-foreground hover:text-foreground hover:border-muted-foreground/40 transition-colors"
            >
              + Selectionner un client
            </button>
          )}
        </div>

        {/* Client options */}
        <div className="mb-4 space-y-1">
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

          <OptionCheckbox
            checked={showSiren}
            onToggle={() => {
              setShowSiren(!showSiren)
              if (showSiren) onChange({ clientSiren: '' })
              else if (selectedClient?.type === 'company' && selectedClient.siren) {
                onChange({ clientSiren: selectedClient.siren })
              }
            }}
            label="SIREN"
          >
            {selectedClient?.type === 'company' ? (
              <Input
                placeholder="123456789"
                value={options.clientSiren}
                onChange={(e) => onChange({ clientSiren: e.target.value })}
                className="h-8 text-sm"
              />
            ) : (
              <p className="text-xs text-muted-foreground italic">Non applicable (client particulier)</p>
            )}
          </OptionCheckbox>

          <OptionCheckbox
            checked={showVat}
            onToggle={() => {
              setShowVat(!showVat)
              if (showVat) onChange({ clientVatNumber: '' })
              else if (selectedClient?.vatNumber) {
                onChange({ clientVatNumber: selectedClient.vatNumber })
              }
            }}
            label="TVA intracommunautaire"
          >
            <Input
              placeholder="FR12345678901"
              value={options.clientVatNumber}
              onChange={(e) => onChange({ clientVatNumber: e.target.value })}
              className="h-8 text-sm"
            />
          </OptionCheckbox>
        </div>

        {/* Additional info */}
        <div>
          <label className="text-xs text-muted-foreground font-medium block mb-2">Infos complementaires</label>
          <div className="space-y-1">
            <OptionCheckbox
              checked={options.showSubject}
              onToggle={() => onChange({ showSubject: !options.showSubject })}
              label="Objet"
            />

            <OptionCheckbox
              checked={options.showAcceptanceConditions}
              onToggle={() => {
                onChange({
                  showAcceptanceConditions: !options.showAcceptanceConditions,
                  ...(options.showAcceptanceConditions ? { acceptanceConditions: '' } : {}),
                })
              }}
              label="Conditions d'acceptation"
            />

            <OptionCheckbox
              checked={options.signatureField}
              onToggle={() => onChange({ signatureField: !options.signatureField })}
              label="Champ signature"
            />

            <OptionCheckbox
              checked={showTitle}
              onToggle={() => {
                setShowTitle(!showTitle)
                if (showTitle) onChange({ documentTitle: '' })
              }}
              label="Titre personnalise"
            >
              <Input
                placeholder="DEVIS"
                value={options.documentTitle}
                onChange={(e) => onChange({ documentTitle: e.target.value })}
                className="h-8 text-sm"
              />
            </OptionCheckbox>

            <OptionCheckbox
              checked={options.showFreeField}
              onToggle={() => {
                onChange({
                  showFreeField: !options.showFreeField,
                  ...(options.showFreeField ? { freeField: '' } : {}),
                })
              }}
              label="Champ libre"
            />

            <OptionCheckbox
              checked={showDiscount}
              onToggle={() => {
                setShowDiscount(!showDiscount)
                if (showDiscount) onChange({ globalDiscountType: 'none', globalDiscountValue: 0 })
                else onChange({ globalDiscountType: 'percentage' })
              }}
              label="Remise globale"
            >
              <div className="space-y-2">
                <div className="flex gap-1.5">
                  {([
                    { id: 'percentage' as const, label: '%' },
                    { id: 'fixed' as const, label: 'EUR' },
                  ]).map((t) => (
                    <button
                      key={t.id}
                      onClick={() => onChange({ globalDiscountType: t.id, globalDiscountValue: 0 })}
                      className={cn(
                        'rounded-md border px-3 py-1 text-xs font-medium transition-all',
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
                  className="h-8 text-sm"
                />
              </div>
            </OptionCheckbox>

            <OptionCheckbox
              checked={options.showNotes}
              onToggle={() => onChange({ showNotes: !options.showNotes })}
              label="Notes et conditions"
            />

            <OptionCheckbox
              checked={options.vatExempt}
              onToggle={() => onChange({ vatExempt: !options.vatExempt })}
              label="TVA non applicable (art. 293B)"
            />

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
        </div>
      </div>

      {/* ── Summary card ── */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.5px] mb-4">
          Recapitulatif
        </h3>

        <div className="flex justify-between mb-2">
          <span className="text-[13px] text-muted-foreground">Total HT</span>
          <span className="text-[13px] font-semibold text-foreground">{fmtCurrency(subtotal)}</span>
        </div>

        {tvaBreakdown.map((e) => (
          <div key={e.rate} className="flex justify-between mb-1.5">
            <span className="text-xs text-muted-foreground">TVA {e.rate}%</span>
            <span className="text-xs text-muted-foreground">{fmtCurrency(e.amount)}</span>
          </div>
        ))}

        {discountAmount > 0 && (
          <div className="flex justify-between mb-1.5">
            <span className="text-xs text-muted-foreground">Remise</span>
            <span className="text-xs text-red-400">-{fmtCurrency(discountAmount)}</span>
          </div>
        )}

        <div className="border-t-2 border-foreground/20 pt-2.5 mt-2.5 flex justify-between">
          <span className="text-[15px] font-bold text-foreground">Total TTC</span>
          <span className="text-[15px] font-bold" style={{ color: accentColor }}>{fmtCurrency(total)}</span>
        </div>
      </div>
    </div>
  )
}
