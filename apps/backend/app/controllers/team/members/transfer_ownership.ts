import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import hash from '@adonisjs/core/services/hash'
import TeamMember from '#models/team/team_member'
import Team from '#models/team/team'

const transferValidator = vine.compile(
  vine.object({
    memberId: vine.string().trim(),
    password: vine.string(),
  })
)

export default class TransferOwnership {
  async handle({ auth, request, response }: HttpContext) {
    const user = auth.user!

    if (!user.currentTeamId) {
      return response.notFound({ message: 'No team found' })
    }

    const payload = await request.validateUsing(transferValidator)

    const isValid = await hash.verify(user.password, payload.password)
    if (!isValid) {
      return response.unauthorized({ message: 'Mot de passe incorrect' })
    }

    const currentMember = await TeamMember.query()
      .where('teamId', user.currentTeamId)
      .where('userId', user.id)
      .first()

    if (!currentMember || currentMember.role !== 'super_admin') {
      return response.forbidden({ message: 'Only the Super Admin can transfer ownership' })
    }

    const targetMember = await TeamMember.query()
      .where('id', payload.memberId)
      .where('teamId', user.currentTeamId)
      .where('status', 'active')
      .first()

    if (!targetMember) {
      return response.notFound({ message: 'Member not found' })
    }

    if (targetMember.userId === user.id) {
      return response.badRequest({ message: 'Cannot transfer ownership to yourself' })
    }

    targetMember.role = 'super_admin'
    await targetMember.save()

    currentMember.role = 'admin'
    await currentMember.save()

    const team = await Team.findOrFail(user.currentTeamId)
    team.ownerId = targetMember.userId
    await team.save()

    return response.ok({
      message: 'Ownership transferred successfully',
    })
  }
}
