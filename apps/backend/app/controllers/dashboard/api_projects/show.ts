import type { HttpContext } from '@adonisjs/core/http'
import ApiProject from '#models/api/api_project'
import ApiKey from '#models/api/api_key'
import transformer from '#transformers/api/api_project_transformer'
import publicIdCodec, { PublicIdParseError } from '#services/api/public_id_codec'

export default class Show {
  async handle({ auth, params, response }: HttpContext) {
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

    const keysCount = await ApiKey.query()
      .where('project_id', project.id)
      .whereNull('revoked_at')
      .count('* as total')
      .first()

    return response.ok({
      data: transformer.transform(project, Number((keysCount as any)?.$extras.total ?? 0)),
    })
  }
}
