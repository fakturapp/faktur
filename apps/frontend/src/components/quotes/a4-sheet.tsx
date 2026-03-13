'use client'

import { Input } from '@/components/ui/input'
import { ImagePlus, Plus, Trash2 } from 'lucide-react'

export interface QuoteLine {
  id: string
  description: string
  saleType: string
  quantity: number
  unit: string
  unitPrice: number
  vatRate: number
}

interface CompanyInfo {
  legalName: string
  addressLine1: string | null
  addressLine2: string | null
  postalCode: string | null
  city: string | null
  country: string
  phone: string | null
  email: string | null
  siren: string | null
  vatNumber: string | null
}

interface ClientInfo {
  displayName: string
  address: string | null
  addressComplement: string | null
  postalCode: string | null
  city: string | null
  country: string
  email: string | null
}

interface A4SheetProps {
  logoUrl: string | null
  accentColor: string
  documentTitle: string
  quoteNumber: string
  issueDate: string
  validityDate: string
  billingType: 'quick' | 'detailed'
  company: CompanyInfo | null
  client: ClientInfo | null
  lines: QuoteLine[]
  onUpdateLine: (index: number, partial: Partial<QuoteLine>) => void
  onAddLine: () => void
  onRemoveLine: (index: number) => void
  subtotal: number
  taxAmount: number
  discountAmount: number
  total: number
  notes: string
  acceptanceConditions: string
  signatureField: boolean
  freeField: string
  paymentMethods: string[]
  customPaymentMethod: string
}

export function A4Sheet({
  logoUrl,
  accentColor,
  documentTitle,
  quoteNumber,
  issueDate,
  validityDate,
  billingType,
  company,
  client,
  lines,
  onUpdateLine,
  onAddLine,
  onRemoveLine,
  subtotal,
  taxAmount,
  discountAmount,
  total,
  notes,
  acceptanceConditions,
  signatureField,
  freeField,
  paymentMethods,
  customPaymentMethod,
}: A4SheetProps) {
  const formatDate = (d: string) => {
    if (!d) return ''
    try {
      return new Date(d).toLocaleDateString('fr-FR')
    } catch {
      return d
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm max-w-[700px] mx-auto">
      <div className="flex flex-col p-6 sm:p-8">
        {/* Header: Logo + Title + Number + Date */}
        <div className="flex items-start justify-between mb-4">
          <div className="space-y-2">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Logo"
                className="h-10 w-auto max-w-[120px] object-contain"
              />
            ) : (
              <div className="h-10 w-20 rounded-md bg-gray-100 border border-dashed border-gray-300 flex items-center justify-center">
                <ImagePlus className="h-5 w-5 text-gray-300" />
              </div>
            )}
            {company && (
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-gray-800">{company.legalName}</p>
                {company.addressLine1 && (
                  <p className="text-[10px] text-gray-500">{company.addressLine1}</p>
                )}
                {company.postalCode && (
                  <p className="text-[10px] text-gray-500">
                    {company.postalCode} {company.city}
                  </p>
                )}
                {company.phone && (
                  <p className="text-[10px] text-gray-500">{company.phone}</p>
                )}
                {company.siren && (
                  <p className="text-[10px] text-gray-400">SIREN: {company.siren}</p>
                )}
              </div>
            )}
          </div>
          <div className="text-right space-y-1">
            <p className="text-sm font-bold tracking-wide" style={{ color: accentColor }}>
              {documentTitle || 'DEVIS'}
            </p>
            <p className="text-[10px] text-gray-400 font-medium">#{quoteNumber}</p>
            {issueDate && (
              <p className="text-[10px] text-gray-400">{formatDate(issueDate)}</p>
            )}
            {validityDate && (
              <p className="text-[10px] text-gray-400">
                Valide jusqu&apos;au {formatDate(validityDate)}
              </p>
            )}
          </div>
        </div>

        {/* Accent bar */}
        <div className="h-[2px] rounded-full mb-4" style={{ backgroundColor: accentColor }} />

        {/* Addresses: Emitter / Client */}
        <div className="grid grid-cols-2 gap-6 mb-5">
          <div className="space-y-1">
            <p
              className="text-[9px] font-semibold uppercase tracking-wider"
              style={{ color: accentColor }}
            >
              Emetteur
            </p>
            {company ? (
              <div className="space-y-0.5">
                <p className="text-[10px] font-medium text-gray-700">{company.legalName}</p>
                {company.addressLine1 && (
                  <p className="text-[10px] text-gray-500">{company.addressLine1}</p>
                )}
                {company.postalCode && (
                  <p className="text-[10px] text-gray-500">
                    {company.postalCode} {company.city}
                  </p>
                )}
                {company.email && (
                  <p className="text-[10px] text-gray-500">{company.email}</p>
                )}
              </div>
            ) : (
              <div className="space-y-0.5">
                <div className="h-2 w-28 rounded-full bg-gray-200" />
                <div className="h-1.5 w-36 rounded-full bg-gray-100" />
              </div>
            )}
          </div>
          <div className="space-y-1">
            <p
              className="text-[9px] font-semibold uppercase tracking-wider"
              style={{ color: accentColor }}
            >
              Client
            </p>
            {client ? (
              <div className="space-y-0.5">
                <p className="text-[10px] font-medium text-gray-700">{client.displayName}</p>
                {client.address && (
                  <p className="text-[10px] text-gray-500">{client.address}</p>
                )}
                {client.postalCode && (
                  <p className="text-[10px] text-gray-500">
                    {client.postalCode} {client.city}
                  </p>
                )}
                {client.email && (
                  <p className="text-[10px] text-gray-500">{client.email}</p>
                )}
              </div>
            ) : (
              <div className="space-y-0.5">
                <div className="h-2 w-24 rounded-full bg-gray-200" />
                <div className="h-1.5 w-32 rounded-full bg-gray-100" />
              </div>
            )}
          </div>
        </div>

        {/* Lines table */}
        <div className="flex-1 min-h-0">
          {/* Table header */}
          <div
            className="rounded-t-md px-3 py-2 flex items-center gap-2 text-[9px] font-semibold uppercase tracking-wider"
            style={{ backgroundColor: accentColor + '12', color: accentColor }}
          >
            <div className="flex-1">Description</div>
            {billingType === 'detailed' && (
              <>
                <div className="w-14 text-right">Qte</div>
                <div className="w-14 text-right">Unite</div>
                <div className="w-16 text-right">PU HT</div>
                <div className="w-14 text-right">TVA</div>
              </>
            )}
            {billingType === 'quick' && (
              <div className="w-20 text-right">Prix</div>
            )}
            <div className="w-20 text-right">Total</div>
            <div className="w-6" />
          </div>

          {/* Editable lines */}
          {lines.map((line, i) => (
            <div
              key={line.id}
              className={`px-3 py-2 flex items-center gap-2 group ${
                i < lines.length - 1 ? 'border-b border-gray-100' : ''
              }`}
            >
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Description..."
                  value={line.description}
                  onChange={(e) => onUpdateLine(i, { description: e.target.value })}
                  className="w-full bg-transparent text-[10px] text-gray-700 placeholder:text-gray-300 focus:outline-none"
                />
              </div>
              {billingType === 'detailed' && (
                <>
                  <div className="w-14">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={line.quantity}
                      onChange={(e) => onUpdateLine(i, { quantity: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-transparent text-[10px] text-gray-700 text-right focus:outline-none"
                    />
                  </div>
                  <div className="w-14">
                    <input
                      type="text"
                      placeholder="u."
                      value={line.unit}
                      onChange={(e) => onUpdateLine(i, { unit: e.target.value })}
                      className="w-full bg-transparent text-[10px] text-gray-700 text-right placeholder:text-gray-300 focus:outline-none"
                    />
                  </div>
                  <div className="w-16">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={line.unitPrice}
                      onChange={(e) => onUpdateLine(i, { unitPrice: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-transparent text-[10px] text-gray-700 text-right focus:outline-none"
                    />
                  </div>
                  <div className="w-14">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={line.vatRate}
                      onChange={(e) => onUpdateLine(i, { vatRate: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-transparent text-[10px] text-gray-700 text-right focus:outline-none"
                    />
                  </div>
                </>
              )}
              {billingType === 'quick' && (
                <div className="w-20">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={line.unitPrice}
                    onChange={(e) => onUpdateLine(i, { unitPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-transparent text-[10px] text-gray-700 text-right focus:outline-none"
                  />
                </div>
              )}
              <div className="w-20 text-right">
                <p className="text-[10px] text-gray-600 font-medium">
                  {(billingType === 'quick'
                    ? line.unitPrice
                    : line.quantity * line.unitPrice
                  ).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EUR
                </p>
              </div>
              <div className="w-6">
                {lines.length > 1 && (
                  <button
                    onClick={() => onRemoveLine(i)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-red-400"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Add line button */}
          <button
            onClick={onAddLine}
            className="w-full px-3 py-2 flex items-center gap-1.5 text-[10px] text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors rounded-b-md border-t border-gray-100"
          >
            <Plus className="h-3 w-3" /> Ajouter une ligne
          </button>
        </div>

        {/* Totals */}
        <div className="flex justify-end mt-4 mb-4">
          <div className="w-52 space-y-1.5">
            {billingType === 'detailed' && (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-[9px] text-gray-400">Sous-total HT</p>
                  <p className="text-[10px] text-gray-600 font-medium">
                    {subtotal.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EUR
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-[9px] text-gray-400">TVA</p>
                  <p className="text-[10px] text-gray-600">
                    {taxAmount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EUR
                  </p>
                </div>
                {discountAmount > 0 && (
                  <div className="flex items-center justify-between">
                    <p className="text-[9px] text-gray-400">Remise</p>
                    <p className="text-[10px] text-gray-600">
                      -{discountAmount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EUR
                    </p>
                  </div>
                )}
                <div className="h-px bg-gray-200 my-1" />
              </>
            )}
            <div
              className="flex items-center justify-between rounded-md px-3 py-2"
              style={{ backgroundColor: accentColor + '10' }}
            >
              <p className="text-[10px] font-semibold" style={{ color: accentColor }}>
                Total {billingType === 'detailed' ? 'TTC' : ''}
              </p>
              <p className="text-xs font-bold" style={{ color: accentColor }}>
                {total.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EUR
              </p>
            </div>
          </div>
        </div>

        {/* Notes */}
        {notes && (
          <div className="mb-3">
            <p className="text-[8px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
              Notes
            </p>
            <p className="text-[9px] text-gray-500 whitespace-pre-line">{notes}</p>
          </div>
        )}

        {/* Free Field */}
        {freeField && (
          <div className="mb-3">
            <p className="text-[9px] text-gray-500 whitespace-pre-line">{freeField}</p>
          </div>
        )}

        {/* Acceptance Conditions */}
        {acceptanceConditions && (
          <div className="mb-3">
            <p className="text-[8px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
              Conditions d&apos;acceptation
            </p>
            <p className="text-[9px] text-gray-500 whitespace-pre-line">{acceptanceConditions}</p>
          </div>
        )}

        {/* Signature */}
        {signatureField && (
          <div className="mb-3">
            <div className="flex gap-8">
              <div className="flex-1">
                <p className="text-[8px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                  Signature de l&apos;emetteur
                </p>
                <div className="h-12 rounded-md border border-dashed border-gray-200" />
              </div>
              <div className="flex-1">
                <p className="text-[8px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                  Signature du client
                </p>
                <div className="h-12 rounded-md border border-dashed border-gray-200" />
              </div>
            </div>
          </div>
        )}

        {/* Footer: Payment methods */}
        <div className="border-t border-gray-100 pt-3 mt-auto space-y-2">
          {paymentMethods.length > 0 && (
            <div>
              <p className="text-[8px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                Moyens de paiement acceptes
              </p>
              <div className="flex flex-wrap gap-1.5">
                {paymentMethods.includes('bank_transfer') && (
                  <span className="text-[8px] bg-gray-50 text-gray-500 rounded-md px-2 py-0.5 border border-gray-100">
                    Virement bancaire
                  </span>
                )}
                {paymentMethods.includes('cash') && (
                  <span className="text-[8px] bg-gray-50 text-gray-500 rounded-md px-2 py-0.5 border border-gray-100">
                    Especes
                  </span>
                )}
                {paymentMethods.includes('custom') && customPaymentMethod && (
                  <span className="text-[8px] bg-gray-50 text-gray-500 rounded-md px-2 py-0.5 border border-gray-100">
                    {customPaymentMethod}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
