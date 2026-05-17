import type { HttpContext } from '@adonisjs/core/http'
import ApiAuditLog from '#models/api/api_audit_log'
import ApiProject from '#models/api/api_project'
import transformer from '#transformers/api/api_audit_log_transformer'
import publicIdCodec, { PublicIdParseError } from '#services/api/public_id_codec'

export default class AuditLogs {
  async handle({ auth, params, request, response }: HttpContext) {
    const user = auth.user!
    const teamId = user.currentTeamId
    if (!teamId) return response.badRequest({ message: 'No team selected' })

    let internalId: string
    try {
      internalId = publicIdCodec.decode('api_project', params.id)
    } catch (err) {
      if (err instanceof PublicIdParseError) {
        return response.notFound({ message: 'Project not found' })
      }
      throw err
    }

    const project = await ApiProject.query()
      .where('id', internalId)
      .where('team_id', teamId)
      .first()
    if (!project) return response.notFound({ message: 'Project not found' })

    const limit = Math.min(500, Math.max(1, Number(request.input('limit', 100))))

    const logs = await ApiAuditLog.query()
      .where('team_id', teamId)
      .where('project_id', project.id)
      .orderBy('created_at', 'desc')
      .limit(limit)

    return response.ok({ data: transformer.transformMany(logs) })
  }
}
