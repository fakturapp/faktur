import type { HttpContext } from '@adonisjs/core/http'
import Invoice from '#models/invoice/invoice'
import zeroAccessCryptoService from '#services/crypto/zero_access_crypto_service'

export default class UpdateComment {
  async handle(ctx: HttpContext) {
    const { auth, params, request, response } = ctx
    const user = auth.user!
    const teamId = user.currentTeamId
    const dek: Buffer = (ctx as any).dek

    if (!teamId) {
      return response.badRequest({ message: 'No team selected' })
    }

    const invoice = await Invoice.query()
      .where('id', params.id)
      .where('team_id', teamId)
      .first()

    if (!invoice) {
      return response.notFound({ message: 'Invoice not found' })
    }

    const { comment } = request.only(['comment'])
    invoice.comment = comment ? zeroAccessCryptoService.encryptField(comment, dek) : null
    await invoice.save()

    return response.ok({ message: 'Comment updated' })
  }
}
