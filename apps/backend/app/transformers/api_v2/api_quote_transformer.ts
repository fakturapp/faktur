import type Quote from '#models/quote/quote'
import type QuoteLine from '#models/quote/quote_line'
import publicIdCodec from '#services/api/public_id_codec'

export interface ApiQuoteLineShape {
  id: string
  position: number
  description: string
  sale_type: string | null
  quantity: number
  unit: string | null
  unit_price_cents: number
  vat_rate: number
  total_cents: number
}

export interface ApiQuoteShape {
  id: string
  number: string
  status: string
  subject: string | null
  issue_date: string
  validity_date: string | null
  language: string
  currency: 'EUR'
  client_id: string | null
  client_name: string | null
  subtotal_cents: number
  tax_cents: number
  total_cents: number
  global_discount_type: 'none' | 'percentage' | 'fixed'
  global_discount_value: number
  vat_exempt_reason: string
  notes: string | null
  comment: string | null
  delivery_address: string | null
  lines: ApiQuoteLineShape[]
  created_at: string
  updated_at: string | null
}

function transformLine(line: QuoteLine): ApiQuoteLineShape {
  return {
    id: publicIdCodec.encode('quote_line', line.id),
    position: Number((line as { position?: number }).position ?? 0),
    description: line.description,
    sale_type: line.saleType,
    quantity: Number(line.quantity),
    unit: line.unit,
    unit_price_cents: Math.round(Number(line.unitPrice) * 100),
    vat_rate: Number(line.vatRate),
    total_cents: Math.round(Number(line.total) * 100),
  }
}

class ApiQuoteTransformer {
  transform(quote: Quote, opts: { includeLines?: boolean } = {}): ApiQuoteShape {
    const lines = opts.includeLines
      ? ((quote.lines as QuoteLine[] | undefined) ?? []).map(transformLine)
      : []
    return {
      id: publicIdCodec.encode('quote', quote.id),
      number: quote.quoteNumber,
      status: quote.status,
      subject: quote.subject,
      issue_date: quote.issueDate,
      validity_date: quote.validityDate,
      language: quote.language,
      currency: 'EUR',
      client_id: quote.clientId ? publicIdCodec.encode('client', quote.clientId) : null,
      client_name:
        (quote as { client?: { displayName?: string } | null }).client?.displayName ?? null,
      subtotal_cents: Math.round(Number(quote.subtotal) * 100),
      tax_cents: Math.round(Number(quote.taxAmount) * 100),
      total_cents: Math.round(Number(quote.total) * 100),
      global_discount_type: quote.globalDiscountType,
      global_discount_value: Number(quote.globalDiscountValue),
      vat_exempt_reason: quote.vatExemptReason,
      notes: quote.notes,
      comment: quote.comment,
      delivery_address: quote.deliveryAddress,
      lines,
      created_at: quote.createdAt.toISO() ?? '',
      updated_at: quote.updatedAt?.toISO() ?? null,
    }
  }

  transformMany(quotes: Quote[]): ApiQuoteShape[] {
    return quotes.map((q) => this.transform(q, { includeLines: false }))
  }
}

export default new ApiQuoteTransformer()
