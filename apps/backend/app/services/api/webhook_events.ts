export const WEBHOOK_EVENT_TYPES = [
  'invoice.created',
  'invoice.updated',
  'invoice.sent',
  'invoice.paid',
  'invoice.partially_paid',
  'invoice.overdue',
  'invoice.deleted',
  'quote.created',
  'quote.updated',
  'quote.sent',
  'quote.accepted',
  'quote.rejected',
  'quote.expired',
  'quote.converted',
  'credit_note.created',
  'credit_note.sent',
  'client.created',
  'client.updated',
  'client.deleted',
  'product.created',
  'product.updated',
  'product.deleted',
  'expense.created',
  'expense.updated',
  'expense.deleted',
  'recurring_invoice.generated',
  'payment.received',
  'reminder.sent',
  'einvoicing.submitted',
  'einvoicing.status_changed',
] as const

export type WebhookEventType = (typeof WEBHOOK_EVENT_TYPES)[number]

export const WEBHOOK_EVENT_CATEGORIES: Record<string, WebhookEventType[]> = {
  Invoices: [
    'invoice.created',
    'invoice.updated',
    'invoice.sent',
    'invoice.paid',
    'invoice.partially_paid',
    'invoice.overdue',
    'invoice.deleted',
  ],
  Quotes: [
    'quote.created',
    'quote.updated',
    'quote.sent',
    'quote.accepted',
    'quote.rejected',
    'quote.expired',
    'quote.converted',
  ],
  CreditNotes: ['credit_note.created', 'credit_note.sent'],
  Clients: ['client.created', 'client.updated', 'client.deleted'],
  Products: ['product.created', 'product.updated', 'product.deleted'],
  Expenses: ['expense.created', 'expense.updated', 'expense.deleted'],
  Recurring: ['recurring_invoice.generated'],
  Payments: ['payment.received'],
  Reminders: ['reminder.sent'],
  EInvoicing: ['einvoicing.submitted', 'einvoicing.status_changed'],
}

export function isKnownEvent(type: string): type is WebhookEventType {
  return (WEBHOOK_EVENT_TYPES as readonly string[]).includes(type)
}
