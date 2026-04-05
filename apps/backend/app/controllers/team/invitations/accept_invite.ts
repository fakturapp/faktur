import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import vine from '@vinejs/vine'
import TeamMember from '#models/team/team_member'
import Team from '#models/team/team'
import zeroAccessCryptoService from '#services/crypto/zero_access_crypto_service'
import keyStore from '#services/crypto/key_store'

const acceptInviteValidator = vine.compile(
  vine.object({
    token: vine.string().trim(),
  })
)

export default class AcceptInvite {
  async handle({ auth, request, response }: HttpContext) {
    const user = auth.user!
    const payload = await request.validateUsing(acceptInviteValidator)

    const invitation = await TeamMember.query()
      .where('invitationToken', payload.token)
      .where('status', 'pending')
      .first()

    if (!invitation) {
      return response.notFound({ message: 'Invalid or expired invitation' })
    }

    // Check email match
    if (invitation.invitedEmail && invitation.invitedEmail !== user.email) {
      return response.forbidden({
        message: 'This invitation was sent to a different email address',
      })
    }

    // Check if user already a member of this team
    const existingMember = await TeamMember.query()
      .where('teamId', invitation.teamId)
      .where('userId', user.id)
      .where('status', 'active')
      .first()

    if (existingMember) {
      await invitation.delete()
      return response.conflict({ message: 'You are already a member of this team' })
    }

    // Decrypt team DEK from invite and re-encrypt with user's KEK
    let encryptedTeamDek: string | null = null
    const kek = keyStore.getKEK(user.id)

    if (invitation.encryptedInviteDek && kek) {
      const inviteKey = zeroAccessCryptoService.deriveInviteKey(payload.token)
      const teamDek = zeroAccessCryptoService.decryptDEK(invitation.encryptedInviteDek, inviteKey)
      encryptedTeamDek = zeroAccessCryptoService.encryptDEK(teamDek, kek)

      // Cache the DEK in memory
      keyStore.storeDEK(user.id, invitation.teamId, teamDek)
    }

    // Accept invitation
    invitation.userId = user.id
    invitation.status = 'active'
    invitation.joinedAt = DateTime.now()
    invitation.invitationToken = null
    invitation.encryptedInviteDek = null
    invitation.encryptedTeamDek = encryptedTeamDek
    await invitation.save()

    // Auto-switch to the joined team
    user.currentTeamId = invitation.teamId
    await user.save()

    const team = await Team.findOrFail(invitation.teamId)

    return response.ok({
      message: 'Invitation accepted',
      team: {
        id: team.id,
        name: team.name,
      },
    })
  }
}
