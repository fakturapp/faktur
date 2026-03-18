import type { HttpContext } from '@adonisjs/core/http'
import Quote from '#models/quote/quote'
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

    const quote = await Quote.query()
      .where('id', params.id)
      .where('team_id', teamId)
      .first()

    if (!quote) {
      return response.notFound({ message: 'Quote not found' })
    }

    const { comment } = request.only(['comment'])
    quote.comment = comment ? zeroAccessCryptoService.encryptField(comment, dek) : null
    await quote.save()

    return response.ok({ message: 'Comment updated' })
  }
}
