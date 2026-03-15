import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'

export default class RevokeSession {
  async handle({ auth, params, response }: HttpContext) {
    const user = auth.user!
    const tokenId = params.id

    const token = await db
      .from('auth_access_tokens')
      .where('id', tokenId)
      .where('tokenable_id', user.id)
      .first()

    if (!token) {
      return response.notFound({ message: 'Session not found' })
    }

    await db.from('auth_access_tokens').where('id', tokenId).delete()

    return response.ok({ message: 'Session revoked successfully' })
  }
}
