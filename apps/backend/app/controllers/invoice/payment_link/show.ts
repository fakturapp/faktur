import type { HttpContext } from '@adonisjs/core/http'
import PaymentLink from '#models/invoice/payment_link'
import env from '#start/env'

export default class Show {
  async handle(ctx: HttpContext) {
    const { auth, params, response } = ctx
    const user = auth.user!
    const teamId = user.currentTeamId

    if (!teamId) {
      return response.badRequest({ message: 'No team selected' })
    }

    const paymentLink = await PaymentLink.query()
      .where('invoice_id', params.invoiceId)
      .where('team_id', teamId)
      .orderBy('created_at', 'desc')
      .first()

    if (!paymentLink) {
      return response.ok({ paymentLink: null })
    }

    const checkoutUrl = env.get('CHECKOUT_URL') || env.get('FRONTEND_URL') || 'http://localhost:3000'

    return response.ok({
      paymentLink: {
        id: paymentLink.id,
        isActive: paymentLink.isActive,
        isExpired: paymentLink.isExpired,
        isPasswordProtected: !!paymentLink.passwordHash,
        paymentMethod: paymentLink.paymentMethod,
        paymentType: paymentLink.paymentType,
        showIban: paymentLink.showIban,
        expirationType: paymentLink.expirationType,
        expiresAt: paymentLink.expiresAt?.toISO() || null,
        paidAt: paymentLink.paidAt?.toISO() || null,
        confirmedAt: paymentLink.confirmedAt?.toISO() || null,
        amount: paymentLink.amount,
        currency: paymentLink.currency,
        invoiceNumber: paymentLink.invoiceNumber,
        url: paymentLink.isActive ? `${checkoutUrl}/checkout/${paymentLink.tokenHash}/pay` : null,
        createdAt: paymentLink.createdAt.toISO(),
      },
    })
  }
}
