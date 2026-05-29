import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import { parseUserAgent } from '#services/analytics/user_agent_parser'
import { formatIp } from '#services/http/ip_formatter'

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
      .select('id', 'name', 'created_at', 'last_used_at', 'expires_at', 'ip_address', 'user_agent')

    const sessions = tokens.map((token) => {
      const ua = token.user_agent || ''
      const parsed = parseUserAgent(ua)
      const ip = formatIp(token.ip_address)
      return {
        id: token.id,
        name: token.name,
        isCurrent: String(token.id) === String(currentTokenId),
        createdAt: token.created_at,
        lastUsedAt: token.last_used_at,
        expiresAt: token.expires_at,
        ipAddress: ip.value || null,
        ipDisplay: ip.display || null,
        ipShort: ip.short || null,
        ipKind: ip.kind,
        userAgent: ua || null,
        browser: parsed.browser !== 'Unknown' ? parsed.browser : null,
        browserVersion: parsed.browserVersion || null,
        os: parsed.os !== 'Unknown' ? parsed.os : null,
        deviceType: parsed.deviceType,
      }
    })

    return response.ok({ sessions })
  }
}
