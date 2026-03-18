import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import Quote from '#models/quote/quote'
import {
  decryptModelFields,
  decryptModelFieldsArray,
  ENCRYPTED_FIELDS,
} from '#services/crypto/field_encryption_helper'

export default class Show {
  async handle(ctx: HttpContext) {
    const { auth, params, response } = ctx
    const user = auth.user!
    const teamId = user.currentTeamId
    const dek: Buffer = (ctx as any).dek

    if (!teamId) {
      return response.badRequest({ message: 'No team selected' })
    }

    const quote = await Quote.query()
      .where('id', params.id)
      .where('team_id', teamId)
      .preload('client')
      .preload('lines', (q) => q.orderBy('position', 'asc'))
      .first()

    if (!quote) {
      return response.notFound({ message: 'Quote not found' })
    }

    // Auto-transition sent → expired when validity date has passed
    if (quote.status === 'sent' && quote.validityDate) {
      const today = DateTime.now().toSQLDate()!
      if (quote.validityDate < today) {
        quote.status = 'expired'
        await quote.save()
      }
    }

    decryptModelFields(quote, [...ENCRYPTED_FIELDS.quote], dek)
    decryptModelFieldsArray(quote.lines, [...ENCRYPTED_FIELDS.quoteLine], dek)

    if (quote.client) {
      decryptModelFields(quote.client, [...ENCRYPTED_FIELDS.client], dek)
    }

    return response.ok({
      quote: {
        id: quote.id,
        quoteNumber: quote.quoteNumber,
        status: quote.status,
        subject: quote.subject,
        issueDate: quote.issueDate,
        validityDate: quote.validityDate,
        billingType: quote.billingType,
        accentColor: quote.accentColor,
        logoUrl: quote.logoUrl,
        language: quote.language,
        notes: quote.notes,
        acceptanceConditions: quote.acceptanceConditions,
        signatureField: quote.signatureField,
        documentTitle: quote.documentTitle,
        freeField: quote.freeField,
        globalDiscountType: quote.globalDiscountType,
        globalDiscountValue: quote.globalDiscountValue,
        deliveryAddress: quote.deliveryAddress,
        clientSiren: quote.clientSiren,
        clientVatNumber: quote.clientVatNumber,
        subtotal: quote.subtotal,
        taxAmount: quote.taxAmount,
        total: quote.total,
        comment: quote.comment,
        vatExemptReason: quote.vatExemptReason,
        clientId: quote.clientId,
        client: quote.client
          ? {
              id: quote.client.id,
              type: quote.client.type,
              displayName: quote.client.displayName,
              companyName: quote.client.companyName,
              firstName: quote.client.firstName,
              lastName: quote.client.lastName,
              email: quote.client.email,
              phone: quote.client.phone,
              address: quote.client.address,
              addressComplement: quote.client.addressComplement,
              postalCode: quote.client.postalCode,
              city: quote.client.city,
              country: quote.client.country,
              siren: quote.client.siren,
              vatNumber: quote.client.vatNumber,
            }
          : null,
        lines: quote.lines.map((l) => ({
          id: l.id,
          position: l.position,
          description: l.description,
          saleType: l.saleType,
          quantity: l.quantity,
          unit: l.unit,
          unitPrice: l.unitPrice,
          vatRate: l.vatRate,
          total: l.total,
        })),
        createdAt: quote.createdAt.toISO(),
      },
    })
  }
}
