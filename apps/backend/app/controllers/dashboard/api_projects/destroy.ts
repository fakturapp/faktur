import type { HttpContext } from '@adonisjs/core/http'
import ApiProject from '#models/api/api_project'
import ApiKey from '#models/api/api_key'
import publicIdCodec, { PublicIdParseError } from '#services/api/public_id_codec'

export default class Destroy {
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
    if (project.isDefault) {
      return response.unprocessableEntity({
        code: 'cannot_delete_default_project',
        message: 'Le projet par défaut ne peut pas être supprimé.',
      })
    }

    const remaining = await ApiKey.query()
      .where('project_id', project.id)
      .whereNull('revoked_at')
      .count('* as total')
      .first()
    const active = Number((remaining as any)?.$extras.total ?? 0)
    if (active > 0) {
      return response.unprocessableEntity({
        code: 'project_has_active_keys',
        message: `Ce projet contient ${active} clé(s) active(s). Révoque-les d'abord ou archive le projet.`,
      })
    }

    await project.delete()
    return response.ok({ message: 'Project deleted' })
  }
}
