import type CreditNote from '#models/credit_note/credit_note'
import publicIdCodec from '#services/api/public_id_codec'

export interface ApiCreditNoteShape {
  id: string
  number: string
  status: string
  reason: string | null
  subject: string | null
  issue_date: string
  language: string
  currency: 'EUR'
  client_id: string | null
  source_invoice_id: string | null
  subtotal_cents: number
  tax_cents: number
  total_cents: number
  notes: string | null
  created_at: string
  updated_at: string | null
}

class ApiCreditNoteTransformer {
  transform(cn: CreditNote): ApiCreditNoteShape {
    return {
      id: publicIdCodec.encode('credit_note', cn.id),
      number: cn.creditNoteNumber,
      status: cn.status,
      reason: cn.reason,
      subject: cn.subject,
      issue_date: cn.issueDate,
      language: cn.language,
      currency: 'EUR',
      client_id: cn.clientId ? publicIdCodec.encode('client', cn.clientId) : null,
      source_invoice_id: cn.sourceInvoiceId
        ? publicIdCodec.encode('invoice', cn.sourceInvoiceId)
        : null,
      subtotal_cents: Math.round(Number((cn as { subtotal?: number }).subtotal ?? 0) * 100),
      tax_cents: Math.round(Number((cn as { taxAmount?: number }).taxAmount ?? 0) * 100),
      total_cents: Math.round(Number((cn as { total?: number }).total ?? 0) * 100),
      notes: cn.notes,
      created_at: cn.createdAt.toISO() ?? '',
      updated_at: cn.updatedAt?.toISO() ?? null,
    }
  }

  transformMany(items: CreditNote[]): ApiCreditNoteShape[] {
    return items.map((c) => this.transform(c))
  }
}

export default new ApiCreditNoteTransformer()
