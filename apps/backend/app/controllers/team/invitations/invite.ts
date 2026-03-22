import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import crypto from 'node:crypto'
import vine from '@vinejs/vine'
import mail from '@adonisjs/mail/services/main'
import TeamMember from '#models/team/team_member'
import User from '#models/account/user'
import TeamInviteNotification from '#mails/team_invite_notification'
import env from '#start/env'
import zeroAccessCryptoService from '#services/crypto/zero_access_crypto_service'
import keyStore from '#services/crypto/key_store'

const inviteValidator = vine.compile(
  vine.object({
    email: vine.string().trim().email(),
    role: vine.enum(['viewer', 'member', 'admin']),
  })
)

export default class Invite {
  async handle(ctx: HttpContext) {
    const { auth, request, response } = ctx
    const user = auth.user!

    if (!user.currentTeamId) {
      return response.notFound({ message: 'No team found' })
    }

    const currentMember = await TeamMember.query()
      .where('teamId', user.currentTeamId)
      .where('userId', user.id)
      .first()

    if (!currentMember || !['super_admin', 'admin'].includes(currentMember.role)) {
      return response.forbidden({ message: 'Only admins can invite members' })
    }

    const payload = await request.validateUsing(inviteValidator)

    // Check if user already a member
    const existingUser = await User.findBy('email', payload.email)
    if (existingUser) {
      const existingMember = await TeamMember.query()
        .where('teamId', user.currentTeamId)
        .where('userId', existingUser.id)
        .first()

      if (existingMember && existingMember.status === 'active') {
        return response.conflict({ message: 'This user is already a member of the team' })
      }
    }

    // Check if pending invitation exists for this email
    const existingInvite = await TeamMember.query()
      .where('teamId', user.currentTeamId)
      .where('invitedEmail', payload.email)
      .where('status', 'pending')
      .first()

    if (existingInvite) {
      return response.conflict({ message: 'An invitation is already pending for this email' })
    }

    const token = crypto.randomBytes(32).toString('hex')

    // Encrypt team DEK with invite key derived from token
    const teamDek = keyStore.getDEK(user.id, user.currentTeamId)
    let encryptedInviteDek: string | null = null
    if (teamDek) {
      const inviteKey = zeroAccessCryptoService.deriveInviteKey(token)
      encryptedInviteDek = zeroAccessCryptoService.encryptDEK(teamDek, inviteKey)
    }

    const member = await TeamMember.create({
      teamId: user.currentTeamId,
      userId: existingUser?.id ?? (null as any),
      role: payload.role,
      status: 'pending',
      invitationToken: token,
      invitedEmail: payload.email,
      invitedAt: DateTime.now(),
      encryptedInviteDek,
    })

    const frontendUrl = env.get('FRONTEND_URL') || 'http://localhost:3000'
    const inviteUrl = `${frontendUrl}/invite/${token}`

    // Send invitation email
    mail.sendLater(new TeamInviteNotification(payload.email, user.fullName || user.email, inviteUrl))

    return response.created({
      message: 'Invitation sent',
      invitation: {
        id: member.id,
        email: payload.email,
        role: payload.role,
        inviteUrl,
        token,
      },
    })
  }
}
