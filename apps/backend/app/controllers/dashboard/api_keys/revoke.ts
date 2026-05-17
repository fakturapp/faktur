import type { HttpContext } from '@adonisjs/core/http'
import ApiKey from '#models/api/api_key'
import apiKeyService from '#services/api/api_key_service'
import auditLog from '#services/api/audit_log_service'
import publicIdCodec, { PublicIdParseError } from '#services/api/public_id_codec'

export default class Revoke {
  async handle(ctx: HttpContext) {
    const { auth, params, response } = ctx
    const user = auth.user!
    const teamId = user.currentTeamId
    if (!teamId) return response.badRequest({ message: 'No team selected' })

    let internalId: string
    try {
      internalId = publicIdCodec.decode('api_key', params.id)
    } catch (err) {
      if (err instanceof PublicIdParseError) {
        return response.notFound({ message: 'API key not found' })
      }
      throw err
    }

    const key = await ApiKey.query().where('id', internalId).where('team_id', teamId).first()
    if (!key) return response.notFound({ message: 'API key not found' })

    await apiKeyService.revoke(key.id, 'manual')

    await auditLog.emit({
      ctx,
      teamId,
      projectId: key.projectId,
      action: 'api_key.revoked',
      targetType: 'api_key',
      targetId: key.id,
      targetLabel: key.name,
      metadata: { reason: 'manual' },
    })

    return response.ok({ message: 'API key revoked' })
  }
}
