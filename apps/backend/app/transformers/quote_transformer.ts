import type Quote from '#models/quote/quote'
import { BaseTransformer } from '@adonisjs/core/transformers'
import ClientTransformer from '#transformers/client_transformer'
import QuoteLineTransformer from '#transformers/quote_line_transformer'

export default class QuoteTransformer extends BaseTransformer<Quote> {
  toObject() {
    return {
      ...this.pick(this.resource, [
        'id',
        'quoteNumber',
        'status',
        'subject',
        'issueDate',
        'validityDate',
        'billingType',
        'accentColor',
        'logoUrl',
        'language',
        'notes',
        'acceptanceConditions',
        'signatureField',
        'documentTitle',
        'freeField',
        'globalDiscountType',
        'globalDiscountValue',
        'deliveryAddress',
        'clientSiren',
        'clientVatNumber',
        'subtotal',
        'taxAmount',
        'total',
        'comment',
        'vatExemptReason',
        'clientId',
        'clientSnapshot',
        'companySnapshot',
        'createdAt',
      ]),
      clientName: this.resource.client?.displayName || null,
      client: ClientTransformer.transform(this.whenLoaded(this.resource.client)),
      lines: QuoteLineTransformer.transform(this.whenLoaded(this.resource.lines)),
    }
  }
}
