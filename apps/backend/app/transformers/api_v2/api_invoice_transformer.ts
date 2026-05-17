import type Invoice from '#models/invoice/invoice'
import type InvoiceLine from '#models/invoice/invoice_line'
import publicIdCodec from '#services/api/public_id_codec'

export interface ApiInvoiceLineShape {
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

export interface ApiInvoiceShape {
  id: string
  number: string
  status: string
  subject: string | null
  issue_date: string
  due_date: string | null
  paid_date: string | null
  language: string
  currency: 'EUR'
  client_id: string | null
  client_name: string | null
  bank_account_id: string | null
  source_quote_id: string | null
  subtotal_cents: number
  tax_cents: number
  total_cents: number
  global_discount_type: 'none' | 'percentage' | 'fixed'
  global_discount_value: number
  vat_exempt_reason: string
  vat_on_debits: boolean
  payment_terms: string | null
  payment_method: string | null
  notes: string | null
  comment: string | null
  delivery_address: string | null
  operation_category: 'service' | 'goods' | 'mixed' | null
  lines: ApiInvoiceLineShape[]
  created_at: string
  updated_at: string | null
}

function transformLine(line: InvoiceLine): ApiInvoiceLineShape {
  return {
    id: publicIdCodec.encode('invoice_line', line.id),
    position: line.position,
    description: line.description,
    sale_type: line.saleType,
    quantity: Number(line.quantity),
    unit: line.unit,
    unit_price_cents: Math.round(Number(line.unitPrice) * 100),
    vat_rate: Number(line.vatRate),
    total_cents: Math.round(Number(line.total) * 100),
  }
}

class ApiInvoiceTransformer {
  transform(invoice: Invoice, opts: { includeLines?: boolean } = {}): ApiInvoiceShape {
    const lines = opts.includeLines
      ? ((invoice.lines as InvoiceLine[] | undefined) ?? []).map(transformLine)
      : []
    return {
      id: publicIdCodec.encode('invoice', invoice.id),
      number: invoice.invoiceNumber,
      status: invoice.status,
      subject: invoice.subject,
      issue_date: invoice.issueDate,
      due_date: invoice.dueDate,
      paid_date: invoice.paidDate,
      language: invoice.language,
      currency: 'EUR',
      client_id: invoice.clientId ? publicIdCodec.encode('client', invoice.clientId) : null,
      client_name:
        (invoice as { client?: { displayName?: string } | null }).client?.displayName ?? null,
      bank_account_id: invoice.bankAccountId
        ? publicIdCodec.encode('bank_account', invoice.bankAccountId)
        : null,
      source_quote_id: invoice.sourceQuoteId
        ? publicIdCodec.encode('quote', invoice.sourceQuoteId)
        : null,
      subtotal_cents: Math.round(Number(invoice.subtotal) * 100),
      tax_cents: Math.round(Number(invoice.taxAmount) * 100),
      total_cents: Math.round(Number(invoice.total) * 100),
      global_discount_type: invoice.globalDiscountType,
      global_discount_value: Number(invoice.globalDiscountValue),
      vat_exempt_reason: invoice.vatExemptReason,
      vat_on_debits: invoice.vatOnDebits,
      payment_terms: invoice.paymentTerms,
      payment_method: invoice.paymentMethod,
      notes: invoice.notes,
      comment: invoice.comment,
      delivery_address: invoice.deliveryAddress,
      operation_category: invoice.operationCategory,
      lines,
      created_at: invoice.createdAt.toISO() ?? '',
      updated_at: invoice.updatedAt?.toISO() ?? null,
    }
  }

  transformMany(invoices: Invoice[]): ApiInvoiceShape[] {
    return invoices.map((i) => this.transform(i, { includeLines: false }))
  }
}

export default new ApiInvoiceTransformer()
