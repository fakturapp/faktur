import type RecurringInvoice from '#models/recurring_invoice/recurring_invoice'
import publicIdCodec from '#services/api/public_id_codec'

export interface ApiRecurringInvoiceShape {
  id: string
  name: string
  frequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom'
  custom_interval_days: number | null
  start_date: string
  next_execution_date: string
  end_date: string | null
  is_active: boolean
  last_generated_at: string | null
  generation_count: number
  client_id: string | null
  subject: string | null
  language: string
  notes: string | null
  created_at: string
  updated_at: string | null
}

class ApiRecurringInvoiceTransformer {
  transform(r: RecurringInvoice): ApiRecurringInvoiceShape {
    return {
      id: publicIdCodec.encode('recurring_invoice', r.id),
      name: r.name,
      frequency: r.frequency,
      custom_interval_days: r.customIntervalDays,
      start_date: r.startDate,
      next_execution_date: r.nextExecutionDate,
      end_date: r.endDate,
      is_active: r.isActive,
      last_generated_at: r.lastGeneratedAt?.toISO() ?? null,
      generation_count: r.generationCount,
      client_id: r.clientId ? publicIdCodec.encode('client', r.clientId) : null,
      subject: r.subject,
      language: r.language,
      notes: r.notes,
      created_at: r.createdAt.toISO() ?? '',
      updated_at: r.updatedAt?.toISO() ?? null,
    }
  }

  transformMany(items: RecurringInvoice[]): ApiRecurringInvoiceShape[] {
    return items.map((r) => this.transform(r))
  }
}

export default new ApiRecurringInvoiceTransformer()
