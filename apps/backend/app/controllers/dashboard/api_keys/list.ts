import type { HttpContext } from '@adonisjs/core/http'
import ApiKey from '#models/api/api_key'
import ApiProject from '#models/api/api_project'
import adminTransformer from '#transformers/api/api_key_admin_transformer'
import publicIdCodec, { PublicIdParseError } from '#services/api/public_id_codec'

export default class List {
  async handle({ auth, request, response }: HttpContext) {
    const user = auth.user!
    const teamId = user.currentTeamId
    if (!teamId) return response.badRequest({ message: 'No team selected' })

    const query = ApiKey.query().where('team_id', teamId)

    const projectIdRaw = request.input('project_id')
    if (projectIdRaw) {
      let internalId: string
      try {
        internalId = publicIdCodec.decode('api_project', String(projectIdRaw))
      } catch (err) {
        if (err instanceof PublicIdParseError) {
          return response.ok({ data: [] })
        }
        throw err
      }
      const project = await ApiProject.query()
        .where('id', internalId)
        .where('team_id', teamId)
        .first()
      if (!project) return response.ok({ data: [] })
      query.where('project_id', project.id)
    }

    const keys = await query.orderBy('created_at', 'desc')

    return response.ok({ data: adminTransformer.transformMany(keys) })
  }
}
