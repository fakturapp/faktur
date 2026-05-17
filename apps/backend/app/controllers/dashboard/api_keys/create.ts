import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import Team from '#models/team/team'
import apiKeyService from '#services/api/api_key_service'
import scopeChecker from '#services/api/scope_checker'
import adminTransformer from '#transformers/api/api_key_admin_transformer'
import { createApiKeyValidator } from '#validators/api/api_key_dashboard_validators'

export default class Create {
  async handle({ auth, request, response }: HttpContext) {
    const user = auth.user!
    const teamId = user.currentTeamId
    if (!teamId) return response.badRequest({ message: 'No team selected' })

    const team = await Team.find(teamId)
    if (!team) return response.notFound({ message: 'Team not found' })
    if (team.encryptionMode !== 'standard') {
      return response.status(403).send({
        code: 'team_mode_private',
        message:
          'API keys require Standard encryption mode. Migrate your team from Private to Standard to enable the public API.',
      })
    }

    const payload = await createApiKeyValidator.validate(request.body())
    const invalidScopes = payload.scopes.filter((s) => !scopeChecker.validate(s))
    if (invalidScopes.length > 0) {
      return response.unprocessableEntity({
        code: 'invalid_scopes',
        message: `Unknown scopes: ${invalidScopes.join(', ')}`,
      })
    }

    let expiresAt: DateTime | null = null
    if (payload.expires_at) {
      const parsed = DateTime.fromISO(payload.expires_at)
      if (!parsed.isValid) {
        return response.unprocessableEntity({
          code: 'invalid_expires_at',
          message: 'expires_at must be a valid ISO 8601 datetime',
        })
      }
      expiresAt = parsed.toUTC()
    }

    const created = await apiKeyService.create({
      teamId: team.id,
      createdByUserId: user.id,
      name: payload.name,
      scopes: payload.scopes,
      rateLimitTier: payload.rate_limit_tier ?? 'default',
      allowedIps: payload.allowed_ips ?? null,
      expiresAt,
    })

    return response.created({
      data: adminTransformer.transform(created.record),
      plaintext: created.plaintext,
      message: 'Copy this API key now. For security reasons, it will not be shown again.',
    })
  }
}
