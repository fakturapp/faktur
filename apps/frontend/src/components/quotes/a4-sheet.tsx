'use client'

import { useState, useRef, useEffect } from 'react'
import { Trash2, Search, X, Building2, UserRound } from 'lucide-react'
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

function contrastText(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return (r * 299 + g * 587 + b * 114) / 1000 > 128 ? '#000' : '#fff'
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount)
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
  tvaBreakdown: { rate: number; base: number; amount: number }[]
  notes: string
  onNotesChange: (notes: string) => void
  acceptanceConditions: string
  signatureField: boolean
  freeField: string
  paymentMethods: string[]
  customPaymentMethod: string
}

export function A4Sheet({
  logoUrl, accentColor, documentTitle, quoteNumber, issueDate, validityDate,
  billingType, company, client, onSelectClient, onClearClient,
  lines, onUpdateLine, onAddLine, onRemoveLine,
  subtotal, taxAmount, discountAmount, total, tvaBreakdown,
  notes, onNotesChange, acceptanceConditions, signatureField, freeField,
  paymentMethods, customPaymentMethod,
}: A4SheetProps) {
  const [clientSearch, setClientSearch] = useState('')
  const [clientResults, setClientResults] = useState<ClientInfo[]>([])
  const [clientLoading, setClientLoading] = useState(false)
  const [clientOpen, setClientOpen] = useState(false)
  const clientRef = useRef<HTMLDivElement>(null)
  const clientDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!clientSearch.trim()) { setClientResults([]); return }
    if (clientDebounce.current) clearTimeout(clientDebounce.current)
    clientDebounce.current = setTimeout(async () => {
      setClientLoading(true)
      const { data } = await api.get<{ clients: ClientInfo[] }>(
        `/clients?search=${encodeURIComponent(clientSearch)}`
      )
      if (data?.clients) setClientResults(data.clients)
      setClientLoading(false)
    }, 300)
    return () => { if (clientDebounce.current) clearTimeout(clientDebounce.current) }
  }, [clientSearch])

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (clientRef.current && !clientRef.current.contains(e.target as Node)) setClientOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  const formatDate = (d: string) => {
    if (!d) return ''
    try { return new Date(d).toLocaleDateString('fr-FR') } catch { return d }
  }

  const gridCols = billingType === 'detailed'
    ? 'minmax(200px, 1fr) 70px 70px 100px 60px 100px 36px'
    : 'minmax(200px, 1fr) 100px 36px'

  return (
    <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.1)] relative overflow-hidden max-w-[860px] w-full mx-auto">
      {/* Accent left bar */}
      <div className="absolute top-0 left-0 bottom-0 w-1" style={{ backgroundColor: accentColor }} />

      <div className="p-8 md:p-12">
        {/* Header */}
        <div className="flex justify-between items-start mb-9">
          {/* Left: Logo + Company */}
          <div>
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="h-16 w-auto max-w-[120px] object-contain mb-2" />
            ) : (
              <div
                className="w-20 h-20 rounded-xl flex items-center justify-center mb-2 border-2 border-dashed"
                style={{ background: `linear-gradient(135deg, ${accentColor}22, ${accentColor}44)`, borderColor: `${accentColor}88` }}
              >
                <span className="text-[11px] font-medium text-center" style={{ color: accentColor }}>Logo</span>
              </div>
            )}
            {company && (
              <div className="text-[13px] text-[#5f6368] leading-[1.6]">
                <div className="font-semibold text-[#202124] text-sm">{company.legalName}</div>
                {company.addressLine1 && <div>{company.addressLine1}</div>}
                {(company.postalCode || company.city) && (
                  <div>{company.postalCode} {company.city}</div>
                )}
                {company.siren && <div className="text-[11px]">SIREN : {company.siren}</div>}
                {company.vatNumber && <div className="text-[11px]">N&deg; TVA : {company.vatNumber}</div>}
              </div>
            )}
          </div>

          {/* Right: DEVIS badge + meta */}
          <div className="text-right">
            <div
              className="inline-block rounded-[10px] px-6 py-3 mb-3"
              style={{ background: `${accentColor}12`, border: `1px solid ${accentColor}33` }}
            >
              <div className="text-[22px] font-bold uppercase tracking-[2px]" style={{ color: accentColor }}>
                {documentTitle || 'Devis'}
              </div>
            </div>
            <div className="text-[13px] text-[#5f6368] leading-[1.8]">
              <div>N&deg; <span className="font-semibold text-[#202124]">{quoteNumber}</span></div>
              {issueDate && <div>Date : <span className="font-medium">{formatDate(issueDate)}</span></div>}
              {validityDate && <div>Validite : <span className="font-medium">{formatDate(validityDate)}</span></div>}
            </div>
          </div>
        </div>

        {/* Client block */}
        <div ref={clientRef} className="bg-[#f8f9fa] rounded-[10px] px-5 py-4 mb-7 border border-[#eee] relative">
          <div className="text-[10px] uppercase tracking-[1px] text-[#5f6368] font-semibold mb-2">Destinataire</div>
          {client ? (
            <div className="text-[13px] leading-[1.7] group">
              <div className="font-semibold text-[#202124] text-sm">{client.displayName}</div>
              {client.address && <div className="text-[#5f6368]">{client.address}</div>}
              {(client.postalCode || client.city) && (
                <div className="text-[#5f6368]">{client.postalCode} {client.city}</div>
              )}
              {client.siren && <div className="text-[11px] text-[#5f6368]">SIRET : {client.siren}</div>}
              <button
                onClick={() => { onClearClient(); setClientOpen(true) }}
                className="absolute top-4 right-5 opacity-0 group-hover:opacity-100 transition-opacity text-[#999] hover:text-[#e53935]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="relative">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-[#999] shrink-0" />
                <input
                  type="text"
                  placeholder="Rechercher un client..."
                  value={clientSearch}
                  onChange={(e) => { setClientSearch(e.target.value); if (e.target.value.trim()) setClientOpen(true) }}
                  onFocus={() => { if (clientSearch.trim()) setClientOpen(true) }}
                  className="flex-1 bg-transparent text-sm text-[#202124] placeholder:text-[#999] focus:outline-none"
                />
              </div>
              {clientOpen && (
                <div className="absolute top-full left-0 right-0 z-50 mt-2 rounded-xl border border-[#e0e0e0] bg-white shadow-xl max-h-48 overflow-y-auto">
                  {clientLoading && <p className="text-xs text-[#999] text-center p-3 animate-pulse">Recherche...</p>}
                  {!clientLoading && clientResults.length === 0 && clientSearch.trim() && (
                    <p className="text-xs text-[#999] text-center p-3">Aucun resultat</p>
                  )}
                  {clientResults.map((c) => (
                    <button
                      key={c.id}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-[#f8f9fa] transition-colors"
                      onClick={() => { onSelectClient(c); setClientOpen(false); setClientSearch(''); setClientResults([]) }}
                    >
                      <div className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${c.type === 'company' ? 'bg-blue-50' : 'bg-green-50'}`}>
                        {c.type === 'company' ? <Building2 className="h-3.5 w-3.5 text-blue-500" /> : <UserRound className="h-3.5 w-3.5 text-green-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#202124] truncate">{c.displayName}</p>
                        {c.email && <p className="text-xs text-[#5f6368] truncate">{c.email}</p>}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Lines Table */}
        <div className="mb-6">
          {/* Table Header */}
          <div className="rounded-t-[10px] overflow-hidden" style={{ display: 'grid', gridTemplateColumns: gridCols }}>
            <div className="px-3.5 py-2.5 text-xs font-semibold uppercase tracking-[0.5px]"
              style={{ backgroundColor: accentColor, color: contrastText(accentColor) }}>Designation</div>
            {billingType === 'detailed' && (
              <>
                <div className="px-2 py-2.5 text-xs font-semibold text-center" style={{ backgroundColor: accentColor, color: contrastText(accentColor) }}>Qte</div>
                <div className="px-2 py-2.5 text-xs font-semibold text-center" style={{ backgroundColor: accentColor, color: contrastText(accentColor) }}>Unite</div>
                <div className="px-2 py-2.5 text-xs font-semibold text-right" style={{ backgroundColor: accentColor, color: contrastText(accentColor) }}>P.U. HT</div>
                <div className="px-2 py-2.5 text-xs font-semibold text-center" style={{ backgroundColor: accentColor, color: contrastText(accentColor) }}>TVA</div>
              </>
            )}
            <div className="px-3.5 py-2.5 text-xs font-semibold text-right" style={{ backgroundColor: accentColor, color: contrastText(accentColor) }}>Montant HT</div>
            <div className="px-1 py-2.5" style={{ backgroundColor: accentColor }} />
          </div>

          {/* Rows */}
          {lines.map((line, idx) => {
            const isSection = line.type === 'section'
            const montantHT = isSection ? 0 : (billingType === 'quick' ? line.unitPrice : line.quantity * line.unitPrice)

            return (
              <div
                key={line.id}
                className="border-b border-[#f0f0f0] items-center group"
                style={{
                  display: 'grid',
                  gridTemplateColumns: gridCols,
                  backgroundColor: idx % 2 === 0 ? '#fff' : '#fafbfc',
                  transition: 'background-color 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = `${accentColor}08`)}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = idx % 2 === 0 ? '#fff' : '#fafbfc')}
              >
                {/* Designation */}
                <div className="px-3.5 py-2.5">
                  <input
                    type="text"
                    value={line.description}
                    onChange={(e) => onUpdateLine(idx, { description: e.target.value })}
                    placeholder={isSection ? 'Titre de section...' : 'Description de la prestation...'}
                    className={`w-full bg-transparent text-[13px] placeholder:text-[#aaa] focus:outline-none ${isSection ? 'font-bold text-[#202124]' : 'text-[#202124]'}`}
                  />
                </div>

                {/* Standard line - detailed mode cells */}
                {!isSection && billingType === 'detailed' && (
                  <>
                    <div className="px-2 py-2.5 text-center">
                      <input type="number" min="0" step="1" value={line.quantity}
                        onChange={(e) => onUpdateLine(idx, { quantity: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-transparent text-[13px] text-center text-[#202124] focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
                    </div>
                    <div className="px-2 py-2.5 text-center">
                      <input type="text" value={line.unit} placeholder="unite"
                        onChange={(e) => onUpdateLine(idx, { unit: e.target.value })}
                        className="w-full bg-transparent text-xs text-center text-[#5f6368] placeholder:text-[#ccc] focus:outline-none" />
                    </div>
                    <div className="px-2 py-2.5 text-right">
                      <input type="number" min="0" step="0.01" value={line.unitPrice}
                        onChange={(e) => onUpdateLine(idx, { unitPrice: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-transparent text-[13px] text-right text-[#202124] focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
                    </div>
                    <div className="px-2 py-2.5 text-center">
                      <select value={line.vatRate}
                        onChange={(e) => onUpdateLine(idx, { vatRate: parseFloat(e.target.value) })}
                        className="w-full text-xs border border-[#e0e0e0] rounded-md py-1 px-1 bg-white outline-none cursor-pointer">
                        <option value="20">20%</option>
                        <option value="10">10%</option>
                        <option value="5.5">5,5%</option>
                        <option value="0">0%</option>
                      </select>
                    </div>
                  </>
                )}

                {/* Section line - empty cells for detailed mode */}
                {isSection && billingType === 'detailed' && (
                  <><div /><div /><div /><div /></>
                )}

                {/* Montant HT column */}
                {!isSection ? (
                  <div className="px-3.5 py-2.5 text-right text-[13px] font-semibold text-[#202124]">
                    {billingType === 'quick' ? (
                      <input type="number" min="0" step="0.01" value={line.unitPrice}
                        onChange={(e) => onUpdateLine(idx, { unitPrice: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-transparent text-[13px] text-right text-[#202124] font-semibold focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
                    ) : (
                      formatCurrency(montantHT)
                    )}
                  </div>
                ) : (
                  <div />
                )}

                {/* Delete button */}
                <div className="px-1 py-2.5 text-center">
                  {lines.length > 1 && (
                    <button
                      onClick={() => onRemoveLine(idx)}
                      className="w-6 h-6 rounded-full flex items-center justify-center text-[#999] hover:bg-red-50 hover:text-[#e53935] transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Add line buttons */}
        <div className="flex gap-2 mb-8">
          <button
            onClick={() => onAddLine('standard')}
            className="px-4 py-2 rounded-full text-xs font-medium cursor-pointer transition-all"
            style={{ border: `1px dashed ${accentColor}88`, background: `${accentColor}08`, color: accentColor }}
            onMouseEnter={(e) => (e.currentTarget.style.background = `${accentColor}18`)}
            onMouseLeave={(e) => (e.currentTarget.style.background = `${accentColor}08`)}
          >
            + Ligne simple
          </button>
          <button
            onClick={() => onAddLine('section')}
            className="px-4 py-2 rounded-full border border-dashed border-[#dadce0] bg-white text-[#5f6368] text-xs font-medium cursor-pointer transition-all hover:bg-[#f8f9fa]"
          >
            + Ligne de designation
          </button>
        </div>

        {/* Totals */}
        <div className="flex justify-end mb-8">
          <div className="w-[300px]">
            <div className="flex justify-between py-2 border-b border-[#f0f0f0]">
              <span className="text-[13px] text-[#5f6368]">Total HT</span>
              <span className="text-[13px] font-semibold text-[#202124]">{formatCurrency(subtotal)}</span>
            </div>
            {tvaBreakdown.map((entry) => (
              <div key={entry.rate} className="flex justify-between py-1.5 border-b border-[#f0f0f0]">
                <span className="text-xs text-[#5f6368]">TVA {entry.rate}% (base : {formatCurrency(entry.base)})</span>
                <span className="text-xs text-[#5f6368]">{formatCurrency(entry.amount)}</span>
              </div>
            ))}
            {discountAmount > 0 && (
              <div className="flex justify-between py-1.5 border-b border-[#f0f0f0]">
                <span className="text-xs text-[#5f6368]">Remise</span>
                <span className="text-xs text-[#e53935]">-{formatCurrency(discountAmount)}</span>
              </div>
            )}
            <div
              className="flex justify-between px-4 py-3 mt-2 rounded-[10px]"
              style={{ background: `${accentColor}10`, border: `1px solid ${accentColor}25` }}
            >
              <span className="text-[15px] font-bold text-[#202124]">
                Total {billingType === 'detailed' ? 'TTC' : ''}
              </span>
              <span className="text-[17px] font-bold" style={{ color: accentColor }}>
                {formatCurrency(total)}
              </span>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="border-t border-[#eee] pt-5">
          <div className="text-[10px] uppercase tracking-[1px] text-[#5f6368] font-semibold mb-2">Conditions et notes</div>
          <textarea
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder="Ajoutez vos conditions de paiement, notes..."
            className="w-full bg-transparent text-xs text-[#5f6368] leading-[1.6] placeholder:text-[#aaa] focus:outline-none resize-y min-h-[40px]"
            rows={2}
          />
        </div>

        {/* Acceptance Conditions */}
        {acceptanceConditions && (
          <div className="mt-4">
            <div className="text-[10px] uppercase tracking-[1px] text-[#5f6368] font-semibold mb-1">Conditions d&apos;acceptation</div>
            <p className="text-xs text-[#5f6368] whitespace-pre-line">{acceptanceConditions}</p>
          </div>
        )}

        {/* Free field */}
        {freeField && (
          <div className="mt-4">
            <p className="text-xs text-[#5f6368] whitespace-pre-line">{freeField}</p>
          </div>
        )}

        {/* Signature */}
        {signatureField && (
          <div className="mt-4">
            <div className="flex gap-6">
              <div className="flex-1">
                <div className="text-[10px] uppercase tracking-[1px] text-[#5f6368] font-semibold mb-1">Signature emetteur</div>
                <div className="h-16 rounded-lg border-2 border-dashed border-[#e0e0e0]" />
              </div>
              <div className="flex-1">
                <div className="text-[10px] uppercase tracking-[1px] text-[#5f6368] font-semibold mb-1">Signature client</div>
                <div className="h-16 rounded-lg border-2 border-dashed border-[#e0e0e0]" />
              </div>
            </div>
          </div>
        )}

        {/* Payment methods */}
        {paymentMethods.length > 0 && (
          <div className="mt-4">
            <div className="text-[10px] uppercase tracking-[1px] text-[#5f6368] font-semibold mb-1">Moyens de paiement</div>
            <div className="flex flex-wrap gap-1.5">
              {paymentMethods.includes('bank_transfer') && (
                <span className="text-[10px] bg-[#f8f9fa] text-[#5f6368] rounded-md px-2 py-0.5 border border-[#eee]">Virement</span>
              )}
              {paymentMethods.includes('cash') && (
                <span className="text-[10px] bg-[#f8f9fa] text-[#5f6368] rounded-md px-2 py-0.5 border border-[#eee]">Especes</span>
              )}
              {paymentMethods.includes('custom') && customPaymentMethod && (
                <span className="text-[10px] bg-[#f8f9fa] text-[#5f6368] rounded-md px-2 py-0.5 border border-[#eee]">{customPaymentMethod}</span>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 pt-4 border-t-2 border-[#f0f0f0] text-center">
          <div className="text-[10px] text-[#999] leading-[1.6]">
            {company && (
              <>
                <span className="font-semibold">{company.legalName}</span>
                {company.siren && <> &mdash; SIREN : {company.siren}</>}
                {company.vatNumber && <> &mdash; N&deg; TVA : {company.vatNumber}</>}
                <br />
                {company.addressLine1 && <>{company.addressLine1}, </>}
                {company.postalCode && <>{company.postalCode} </>}
                {company.city && <>{company.city}</>}
                {company.phone && <> &mdash; {company.phone}</>}
                {company.email && <> &mdash; {company.email}</>}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
