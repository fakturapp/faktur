import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import { DateTime } from 'luxon'
import apiKeyService from '#services/api/api_key_service'
import apiResponse from '#services/api/api_response'
import Team from '#models/team/team'
import TeamMember from '#models/team/team_member'
import teamEncryptionService from '#services/crypto/team_encryption_service'
import keyStore from '#services/crypto/key_store'
import featureFlag from '#services/api/api_v2_feature_flag'

export default class ApiKeyMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const startedAt = Date.now()
    ctx.apiStartedAt = startedAt

    const clientIp = ctx.request.ip()
    ctx.apiClientIp = clientIp

    const token = apiKeyService.extractFromHeader(ctx.request.header('authorization'))
    if (!token || !apiKeyService.looksLikeApiKey(token)) {
      return apiResponse.unauthorized(
        ctx.response,
        'invalid_token',
        'A valid API key is required. Send it as `Authorization: Bearer fk_live_…`.',
        ctx.requestId
      )
    }

    const apiKey = await apiKeyService.findActiveByToken(token)
    if (!apiKey) {
      return apiResponse.unauthorized(
        ctx.response,
        'invalid_token',
        'API key is invalid, revoked, or expired.',
        ctx.requestId
      )
    }

    if (apiKey.expiresAt && DateTime.now() > apiKey.expiresAt) {
      return apiResponse.unauthorized(
        ctx.response,
        'token_expired',
        `API key expired on ${apiKey.expiresAt.toISODate()}.`,
        ctx.requestId
      )
    }

    if (!apiKeyService.isAllowedIp(apiKey, clientIp)) {
      return apiResponse.forbidden(
        ctx.response,
        'ip_not_allowed',
        `Request from ${clientIp} is not in the allowed IPs list for this key.`,
        ctx.requestId
      )
    }

    const team = await Team.find(apiKey.teamId)
    if (!team) {
      return apiResponse.unauthorized(
        ctx.response,
        'token_revoked',
        'API key is no longer linked to a team.',
        ctx.requestId
      )
    }

    if (team.encryptionMode !== 'standard') {
      return apiResponse.forbidden(
        ctx.response,
        'team_mode_private',
        'The Faktur API is not available for teams in Private encryption mode. Switch this team to Standard mode in your account settings.',
        ctx.requestId
      )
    }

    if (!featureFlag.isEnabled(team.id)) {
      return apiResponse.forbidden(
        ctx.response,
        'team_inactive',
        'The Faktur API is not enabled for this team yet. Contact support to join the beta.',
        ctx.requestId
      )
    }

    const member = await TeamMember.query()
      .where('teamId', team.id)
      .whereNotNull('encrypted_team_dek')
      .where('status', 'active')
      .first()

    const dekOwnerId = apiKey.createdByUserId ?? team.ownerId
    let dek = keyStore.getDEK(dekOwnerId, team.id)
    if (!dek) {
      const decrypted = member ? teamEncryptionService.unwrapDekForMembership(team, member) : null
      if (!decrypted) {
        return apiResponse.error(ctx.response, 500, {
          code: 'internal_error',
          message: 'Unable to resolve the encryption key for this team.',
          request_id: ctx.requestId,
        })
      }
      keyStore.storeServerDek(dekOwnerId, team.id, decrypted)
      dek = decrypted
    }

    ctx.apiKey = apiKey
    ctx.team = team
    ctx.dek = dek

    return next()
  }
}
