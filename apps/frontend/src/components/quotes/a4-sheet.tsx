'use client'

import { useState, useRef, useEffect } from 'react'
import { ImagePlus, Plus, Trash2, Search, ChevronDown, X, Building2, UserRound } from 'lucide-react'
import { api } from '@/lib/api'

export interface QuoteLine {
  id: string
  type: 'standard' | 'section'
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

export interface ClientInfo {
  id: string
  type: 'company' | 'individual'
  displayName: string
  companyName: string | null
  firstName: string | null
  lastName: string | null
  email: string | null
  phone: string | null
  address: string | null
  addressComplement: string | null
  postalCode: string | null
  city: string | null
  country: string
  siren: string | null
  vatNumber: string | null
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
  onSelectClient: (client: ClientInfo) => void
  onClearClient: () => void
  lines: QuoteLine[]
  onUpdateLine: (index: number, partial: Partial<QuoteLine>) => void
  onAddLine: (type: 'standard' | 'section') => void
  onRemoveLine: (index: number) => void
  subtotal: number
  taxAmount: number
  discountAmount: number
  total: number
  notes: string
  onNotesChange: (notes: string) => void
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
  onSelectClient,
  onClearClient,
  lines,
  onUpdateLine,
  onAddLine,
  onRemoveLine,
  subtotal,
  taxAmount,
  discountAmount,
  total,
  notes,
  onNotesChange,
  acceptanceConditions,
  signatureField,
  freeField,
  paymentMethods,
  customPaymentMethod,
}: A4SheetProps) {
  // Client search
  const [clientSearch, setClientSearch] = useState('')
  const [clientResults, setClientResults] = useState<ClientInfo[]>([])
  const [clientLoading, setClientLoading] = useState(false)
  const [clientOpen, setClientOpen] = useState(false)
  const clientRef = useRef<HTMLDivElement>(null)
  const clientDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Add line menu
  const [addMenuOpen, setAddMenuOpen] = useState(false)
  const addMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!clientSearch.trim()) {
      setClientResults([])
      return
    }
    if (clientDebounce.current) clearTimeout(clientDebounce.current)
    clientDebounce.current = setTimeout(async () => {
      setClientLoading(true)
      const { data } = await api.get<{ clients: ClientInfo[] }>(
        `/clients?search=${encodeURIComponent(clientSearch)}`
      )
      if (data?.clients) setClientResults(data.clients)
      setClientLoading(false)
    }, 300)
    return () => {
      if (clientDebounce.current) clearTimeout(clientDebounce.current)
    }
  }, [clientSearch])

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (clientRef.current && !clientRef.current.contains(e.target as Node)) setClientOpen(false)
      if (addMenuRef.current && !addMenuRef.current.contains(e.target as Node)) setAddMenuOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  const formatDate = (d: string) => {
    if (!d) return ''
    try {
      return new Date(d).toLocaleDateString('fr-FR')
    } catch {
      return d
    }
  }

  const fmt = (n: number) =>
    n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  return (
    <div
      className="bg-white rounded-xl shadow-md border border-gray-200 w-full max-w-[680px] mx-auto"
      style={{ aspectRatio: '210 / 297' }}
    >
      <div className="h-full flex flex-col p-6 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {/* Header: Logo + Company left, Title right */}
        <div className="flex items-start justify-between mb-3">
          <div className="space-y-1.5">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="h-8 w-auto max-w-[100px] object-contain" />
            ) : (
              <div className="h-8 w-16 rounded bg-gray-100 border border-dashed border-gray-300 flex items-center justify-center">
                <ImagePlus className="h-3.5 w-3.5 text-gray-300" />
              </div>
            )}
            {company && (
              <div className="space-y-0.5">
                <p className="text-[11px] font-semibold text-gray-800">{company.legalName}</p>
                {company.addressLine1 && (
                  <p className="text-[10px] text-gray-500">{company.addressLine1}</p>
                )}
                {company.postalCode && (
                  <p className="text-[10px] text-gray-500">
                    {company.postalCode} {company.city}
                  </p>
                )}
                {company.phone && <p className="text-[10px] text-gray-500">{company.phone}</p>}
                {company.email && <p className="text-[10px] text-gray-500">{company.email}</p>}
                {company.siren && (
                  <p className="text-[10px] text-gray-400">SIREN: {company.siren}</p>
                )}
              </div>
            )}
          </div>
          <div className="text-right space-y-0.5">
            <p className="text-base font-bold tracking-wide" style={{ color: accentColor }}>
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
        <div className="h-[2px] rounded-full mb-3" style={{ backgroundColor: accentColor }} />

        {/* Addresses: Emitter / Client */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Emitter */}
          <div>
            <p
              className="text-[8px] font-semibold uppercase tracking-wider mb-1"
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
              <div className="space-y-1">
                <div className="h-2 w-24 rounded bg-gray-100" />
                <div className="h-1.5 w-32 rounded bg-gray-50" />
              </div>
            )}
          </div>

          {/* Client - inline search */}
          <div ref={clientRef}>
            <p
              className="text-[8px] font-semibold uppercase tracking-wider mb-1"
              style={{ color: accentColor }}
            >
              Client
            </p>
            {client ? (
              <div className="relative group">
                <div className="flex items-start justify-between">
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-medium text-gray-700">
                      {client.displayName}
                    </p>
                    {client.address && (
                      <p className="text-[10px] text-gray-500">{client.address}</p>
                    )}
                    {(client.postalCode || client.city) && (
                      <p className="text-[10px] text-gray-500">
                        {client.postalCode} {client.city}
                      </p>
                    )}
                    {client.email && (
                      <p className="text-[10px] text-gray-500">{client.email}</p>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      onClearClient()
                      setClientOpen(true)
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-gray-500 mt-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setClientOpen(true)}
                  className="flex items-center gap-1.5 text-[10px] text-gray-300 cursor-pointer rounded border border-dashed border-gray-200 px-2 py-1.5 hover:border-gray-300 hover:text-gray-400 transition-colors w-full"
                >
                  <Search className="h-3 w-3 shrink-0" />
                  <span>Selectionner un client</span>
                </button>

                {clientOpen && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-lg border border-gray-200 bg-white shadow-xl min-w-[220px]">
                    <div className="p-2">
                      <input
                        type="text"
                        autoFocus
                        placeholder="Rechercher..."
                        value={clientSearch}
                        onChange={(e) => setClientSearch(e.target.value)}
                        className="w-full text-[11px] text-gray-700 px-2 py-1.5 border border-gray-200 rounded focus:outline-none focus:border-gray-400"
                      />
                    </div>
                    <div className="max-h-36 overflow-y-auto">
                      {clientLoading && (
                        <p className="text-[10px] text-gray-400 text-center p-2 animate-pulse">
                          Recherche...
                        </p>
                      )}
                      {!clientLoading && clientResults.length === 0 && clientSearch.trim() && (
                        <p className="text-[10px] text-gray-400 text-center p-2">Aucun resultat</p>
                      )}
                      {clientResults.map((c) => (
                        <button
                          key={c.id}
                          className="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-gray-50 transition-colors"
                          onClick={() => {
                            onSelectClient(c)
                            setClientOpen(false)
                            setClientSearch('')
                            setClientResults([])
                          }}
                        >
                          <div
                            className={`h-5 w-5 rounded flex items-center justify-center shrink-0 ${
                              c.type === 'company' ? 'bg-blue-50' : 'bg-green-50'
                            }`}
                          >
                            {c.type === 'company' ? (
                              <Building2 className="h-2.5 w-2.5 text-blue-500" />
                            ) : (
                              <UserRound className="h-2.5 w-2.5 text-green-500" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-medium text-gray-700 truncate">
                              {c.displayName}
                            </p>
                            {c.email && (
                              <p className="text-[9px] text-gray-400 truncate">{c.email}</p>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Lines table */}
        <div className="flex-1 min-h-0">
          {/* Table header */}
          <div
            className="rounded-t-md px-3 py-1.5 flex items-center gap-2 text-[8px] font-semibold uppercase tracking-wider"
            style={{ backgroundColor: accentColor + '12', color: accentColor }}
          >
            <div className="flex-1">Designation</div>
            {billingType === 'detailed' && (
              <>
                <div className="w-12 text-right">Qte</div>
                <div className="w-12 text-right">Unite</div>
                <div className="w-14 text-right">PU HT</div>
                <div className="w-12 text-right">TVA</div>
              </>
            )}
            {billingType === 'quick' && <div className="w-16 text-right">Montant HT</div>}
            <div className="w-16 text-right">Total</div>
            <div className="w-5" />
          </div>

          {/* Lines */}
          {lines.map((line, i) => (
            <div key={line.id}>
              {line.type === 'section' ? (
                <div className="px-3 py-1.5 flex items-center gap-2 group border-b border-gray-100 bg-gray-50/50">
                  <input
                    type="text"
                    placeholder="Titre de section..."
                    value={line.description}
                    onChange={(e) => onUpdateLine(i, { description: e.target.value })}
                    className="flex-1 bg-transparent text-[10px] font-bold text-gray-800 placeholder:text-gray-300 placeholder:font-normal focus:outline-none"
                  />
                  <div className="w-5">
                    {lines.length > 1 && (
                      <button
                        onClick={() => onRemoveLine(i)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-red-400"
                      >
                        <Trash2 className="h-2.5 w-2.5" />
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div
                  className={`px-3 py-1.5 flex items-center gap-2 group ${
                    i < lines.length - 1 ? 'border-b border-gray-100' : ''
                  }`}
                >
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Designation..."
                      value={line.description}
                      onChange={(e) => onUpdateLine(i, { description: e.target.value })}
                      className="w-full bg-transparent text-[10px] text-gray-700 placeholder:text-gray-300 focus:outline-none"
                    />
                  </div>
                  {billingType === 'detailed' && (
                    <>
                      <div className="w-12">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={line.quantity}
                          onChange={(e) =>
                            onUpdateLine(i, { quantity: parseFloat(e.target.value) || 0 })
                          }
                          className="w-full bg-transparent text-[10px] text-gray-700 text-right focus:outline-none"
                        />
                      </div>
                      <div className="w-12">
                        <input
                          type="text"
                          placeholder="u."
                          value={line.unit}
                          onChange={(e) => onUpdateLine(i, { unit: e.target.value })}
                          className="w-full bg-transparent text-[10px] text-gray-700 text-right placeholder:text-gray-300 focus:outline-none"
                        />
                      </div>
                      <div className="w-14">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={line.unitPrice}
                          onChange={(e) =>
                            onUpdateLine(i, { unitPrice: parseFloat(e.target.value) || 0 })
                          }
                          className="w-full bg-transparent text-[10px] text-gray-700 text-right focus:outline-none"
                        />
                      </div>
                      <div className="w-12">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={line.vatRate}
                          onChange={(e) =>
                            onUpdateLine(i, { vatRate: parseFloat(e.target.value) || 0 })
                          }
                          className="w-full bg-transparent text-[10px] text-gray-700 text-right focus:outline-none"
                        />
                      </div>
                    </>
                  )}
                  {billingType === 'quick' && (
                    <div className="w-16">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={line.unitPrice}
                        onChange={(e) =>
                          onUpdateLine(i, { unitPrice: parseFloat(e.target.value) || 0 })
                        }
                        className="w-full bg-transparent text-[10px] text-gray-700 text-right focus:outline-none"
                      />
                    </div>
                  )}
                  <div className="w-16 text-right">
                    <p className="text-[10px] text-gray-600 font-medium">
                      {fmt(
                        billingType === 'quick'
                          ? line.unitPrice
                          : line.quantity * line.unitPrice
                      )}{' '}
                      &euro;
                    </p>
                  </div>
                  <div className="w-5">
                    {lines.length > 1 && (
                      <button
                        onClick={() => onRemoveLine(i)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-red-400"
                      >
                        <Trash2 className="h-2.5 w-2.5" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Add line - split button */}
          <div ref={addMenuRef} className="relative border-t border-gray-100">
            <div className="flex">
              <button
                onClick={() => onAddLine('standard')}
                className="flex-1 px-3 py-1.5 flex items-center gap-1 text-[10px] font-medium hover:bg-gray-50 transition-colors rounded-bl-md"
                style={{ color: accentColor }}
              >
                <Plus className="h-3 w-3" /> Ligne simple
              </button>
              <button
                onClick={() => setAddMenuOpen(!addMenuOpen)}
                className="px-2 py-1.5 hover:bg-gray-50 transition-colors rounded-br-md border-l border-gray-100"
                style={{ color: accentColor }}
              >
                <ChevronDown className="h-3 w-3" />
              </button>
            </div>
            {addMenuOpen && (
              <div className="absolute top-full left-0 z-50 mt-0.5 rounded-lg border border-gray-200 bg-white shadow-lg py-0.5 min-w-[160px]">
                <button
                  className="w-full px-3 py-1.5 text-left text-[10px] text-gray-700 hover:bg-gray-50"
                  onClick={() => {
                    onAddLine('standard')
                    setAddMenuOpen(false)
                  }}
                >
                  Ligne simple
                </button>
                <button
                  className="w-full px-3 py-1.5 text-left text-[10px] text-gray-700 hover:bg-gray-50"
                  onClick={() => {
                    onAddLine('section')
                    setAddMenuOpen(false)
                  }}
                >
                  Ligne de designation
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Totals */}
        <div className="flex justify-end mt-3 mb-3">
          <div className="w-44 space-y-1">
            {billingType === 'detailed' && (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-[9px] text-gray-400">Sous-total HT</p>
                  <p className="text-[10px] text-gray-600 font-medium">{fmt(subtotal)} &euro;</p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-[9px] text-gray-400">TVA</p>
                  <p className="text-[10px] text-gray-600">{fmt(taxAmount)} &euro;</p>
                </div>
                {discountAmount > 0 && (
                  <div className="flex items-center justify-between">
                    <p className="text-[9px] text-gray-400">Remise</p>
                    <p className="text-[10px] text-gray-600">-{fmt(discountAmount)} &euro;</p>
                  </div>
                )}
                <div className="h-px bg-gray-200 my-0.5" />
              </>
            )}
            <div
              className="flex items-center justify-between rounded-md px-2 py-1.5"
              style={{ backgroundColor: accentColor + '10' }}
            >
              <p className="text-[10px] font-semibold" style={{ color: accentColor }}>
                Total {billingType === 'detailed' ? 'TTC' : ''}
              </p>
              <p className="text-xs font-bold" style={{ color: accentColor }}>
                {fmt(total)} &euro;
              </p>
            </div>
          </div>
        </div>

        {/* Notes - always visible, editable inline */}
        <div className="mb-2">
          <textarea
            placeholder="Notes..."
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            rows={2}
            className="w-full bg-transparent text-[10px] text-gray-500 placeholder:text-gray-300 focus:outline-none resize-none leading-relaxed"
          />
        </div>

        {/* Free Field */}
        {freeField && (
          <div className="mb-2">
            <p className="text-[10px] text-gray-500 whitespace-pre-line">{freeField}</p>
          </div>
        )}

        {/* Acceptance Conditions */}
        {acceptanceConditions && (
          <div className="mb-2">
            <p className="text-[8px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">
              Conditions d&apos;acceptation
            </p>
            <p className="text-[10px] text-gray-500 whitespace-pre-line">{acceptanceConditions}</p>
          </div>
        )}

        {/* Signature */}
        {signatureField && (
          <div className="mb-2">
            <div className="flex gap-6">
              <div className="flex-1">
                <p className="text-[8px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">
                  Signature emetteur
                </p>
                <div className="h-10 rounded border border-dashed border-gray-200" />
              </div>
              <div className="flex-1">
                <p className="text-[8px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">
                  Signature client
                </p>
                <div className="h-10 rounded border border-dashed border-gray-200" />
              </div>
            </div>
          </div>
        )}

        {/* Footer: Payment methods */}
        <div className="border-t border-gray-100 pt-2 mt-auto">
          {paymentMethods.length > 0 && (
            <div>
              <p className="text-[7px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">
                Moyens de paiement
              </p>
              <div className="flex flex-wrap gap-1">
                {paymentMethods.includes('bank_transfer') && (
                  <span className="text-[7px] bg-gray-50 text-gray-500 rounded px-1.5 py-0.5 border border-gray-100">
                    Virement
                  </span>
                )}
                {paymentMethods.includes('cash') && (
                  <span className="text-[7px] bg-gray-50 text-gray-500 rounded px-1.5 py-0.5 border border-gray-100">
                    Especes
                  </span>
                )}
                {paymentMethods.includes('custom') && customPaymentMethod && (
                  <span className="text-[7px] bg-gray-50 text-gray-500 rounded px-1.5 py-0.5 border border-gray-100">
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
