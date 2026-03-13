import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'

export default class Sessions {
  async handle({ auth, response }: HttpContext) {
    const user = auth.user!
    const currentTokenId = user.currentAccessToken.identifier

    const tokens = await db
      .from('auth_access_tokens')
      .where('tokenable_id', user.id)
      .where('type', 'auth_token')
      .where((query) => {
        query.whereNull('expires_at').orWhere('expires_at', '>', new Date().toISOString())
      })
      .orderBy('last_used_at', 'desc')
      .select('id', 'name', 'created_at', 'last_used_at', 'expires_at')

    const sessions = tokens.map((token) => ({
      id: token.id,
      name: token.name,
      isCurrent: String(token.id) === String(currentTokenId),
      createdAt: token.created_at,
      lastUsedAt: token.last_used_at,
      expiresAt: token.expires_at,
    }))

    return response.ok({ sessions })
  }
}
