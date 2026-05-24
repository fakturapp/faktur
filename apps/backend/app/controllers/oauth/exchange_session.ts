import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import crypto from 'node:crypto'
import db from '@adonisjs/lucid/services/db'
import User from '#models/account/user'
import Team from '#models/team/team'
import TeamMember from '#models/team/team_member'
import oauthTokenService from '#services/oauth/oauth_token_service'
import { extractOauthRequestContext } from '#services/oauth/oauth_request_context'
import keyStore from '#services/crypto/key_store'
import encryptionService from '#services/encryption/encryption_service'
import UserTransformer from '#transformers/user_transformer'

export default class ExchangeSession {
  async handle(ctx: HttpContext) {
    const { request, response } = ctx
    const authHeader = request.header('authorization') || ''
    const match = authHeader.match(/^Bearer (.+)$/i)
    if (!match) {
      return response.unauthorized({
        error: 'invalid_request',
        error_description: 'Missing Authorization: Bearer <access_token> header',
      })
    }
    const rawAccessToken = match[1]

    const oauthToken = await oauthTokenService.findActiveByAccessToken(rawAccessToken)
    if (!oauthToken) {
      return response.unauthorized({
        error: 'invalid_token',
        error_description: 'OAuth access token is invalid, expired or revoked',
      })
    }

    if (!oauthToken.scopes.includes('profile')) {
      return response.forbidden({
        error: 'insufficient_scope',
        error_description: "The 'profile' scope is required to exchange for a session",
      })
    }

    const user = await User.find(oauthToken.userId)
    if (!user || user.status !== 'active') {
      return response.unauthorized({
        error: 'invalid_token',
        error_description: 'User not found or inactive',
      })
    }

    const reqCtx = extractOauthRequestContext(ctx)
    if (reqCtx.deviceName && !oauthToken.deviceName) {
      oauthToken.deviceName = reqCtx.deviceName
    }
    if (reqCtx.deviceOs && !oauthToken.deviceOs) {
      oauthToken.deviceOs = reqCtx.deviceOs
    }
    if (reqCtx.devicePlatform && !oauthToken.devicePlatform) {
      oauthToken.devicePlatform = reqCtx.devicePlatform
    }
    await oauthTokenService.touch(oauthToken, reqCtx.ip, reqCtx.userAgent)

    const token = await User.accessTokens.create(user, ['*'], {
      expiresIn: '1 day',
    })

    await db
      .from('auth_access_tokens')
      .where('id', String(token.identifier))
      .update({
        ip_address: reqCtx.ip,
        user_agent: (reqCtx.userAgent || '').slice(0, 512),
      })

    user.lastLoginAt = DateTime.now()
    await user.save()

    let vaultKey: string | null = null
    const existingKek = keyStore.getKEK(user.id)
    if (existingKek) {
      const sessionKey = crypto.randomBytes(32)
      const layer1 = encryptionService.encryptWithCustomKey(existingKek.toString('hex'), sessionKey)
      const layer2 = encryptionService.encrypt(layer1)
      await db
        .from('auth_access_tokens')
        .where('id', String(token.identifier))
        .update({ encrypted_kek: layer2 })
      vaultKey = sessionKey.toString('hex')
    }

    const memberships = await TeamMember.query()
      .where('user_id', user.id)
      .where('status', 'active')
      .preload('team')
      .orderBy('joined_at', 'asc')

    const teams = memberships
      .filter((m) => !!m.team)
      .map((m) => ({
        id: m.team.id,
        name: m.team.name,
        iconUrl: m.team.iconUrl ?? null,
        encryptionMode: m.team.encryptionMode as 'private' | 'standard',
        locked: m.team.encryptionMode === 'private' && vaultKey === null,
        role: m.role,
      }))

    let currentTeamEncryptionMode: 'private' | 'standard' | null = null
    if (user.currentTeamId) {
      const current = teams.find((t) => t.id === user.currentTeamId)
      if (current) {
        currentTeamEncryptionMode = current.encryptionMode
      } else {
        const team = await Team.find(user.currentTeamId)
        currentTeamEncryptionMode = team?.encryptionMode ?? null
      }
    }
    const vaultRequired = currentTeamEncryptionMode === 'private'
    const allUnlockedOrStandard = teams.every((t) => !t.locked)

    return response.ok({
      message: 'Session exchanged',
      user: UserTransformer.transform(user),
      token: token.value!.release(),
      vaultKey,
      vaultLocked: vaultRequired && vaultKey === null,
      vaultRequired,
      currentTeamEncryptionMode,
      teams,
      allUnlockedOrStandard,
    })
  }
}
