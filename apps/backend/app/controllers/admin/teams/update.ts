import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import Team from '#models/team/team'

const updateTeamValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(2).maxLength(100).optional(),
    plan: vine.enum(['free', 'pro', 'team'] as const).optional(),
  })
)

export default class UpdateTeam {
  async handle({ params, request, response }: HttpContext) {
    const team = await Team.find(params.id)
    if (!team) {
      return response.notFound({ message: 'Équipe introuvable' })
    }

    const payload = await request.validateUsing(updateTeamValidator)

    if (payload.name !== undefined) team.name = payload.name
    if (payload.plan !== undefined) team.plan = payload.plan

    await team.save()

    return response.ok({
      message: 'Équipe mise à jour',
      team: {
        id: team.id,
        name: team.name,
        plan: team.plan,
        encryptionMode: team.encryptionMode,
      },
    })
  }
}
