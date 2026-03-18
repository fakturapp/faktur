import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import TeamMember from '#models/team/team_member'
import zeroAccessCryptoService from '#services/crypto/zero_access_crypto_service'
import keyStore from '#services/crypto/key_store'

const switchValidator = vine.compile(
  vine.object({
    teamId: vine.string().trim(),
  })
)

export default class Switch {
  async handle({ auth, request, response }: HttpContext) {
    const user = auth.user!
    const payload = await request.validateUsing(switchValidator)

    const membership = await TeamMember.query()
      .where('teamId', payload.teamId)
      .where('userId', user.id)
      .where('status', 'active')
      .first()

    if (!membership) {
      return response.forbidden({ message: 'You are not a member of this team' })
    }

    user.currentTeamId = payload.teamId
    await user.save()

    // Load the DEK for the new team if KEK is available
    const kek = keyStore.getKEK(user.id)
    if (kek && membership.encryptedTeamDek) {
      const teamDek = zeroAccessCryptoService.decryptDEK(membership.encryptedTeamDek, kek)
      keyStore.storeDEK(user.id, payload.teamId, teamDek)
    }

    return response.ok({ message: 'Team switched', currentTeamId: payload.teamId })
  }
}
