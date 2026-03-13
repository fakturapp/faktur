import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import crypto from 'node:crypto'
import vine from '@vinejs/vine'
import TeamMember from '#models/team/team_member'
import User from '#models/account/user'
import EmailService from '#services/email/email_service'
import env from '#start/env'

const inviteValidator = vine.compile(
  vine.object({
    email: vine.string().trim().email(),
    role: vine.enum(['viewer', 'member', 'admin']),
  })
)

export default class Invite {
  async handle({ auth, request, response }: HttpContext) {
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

    const member = await TeamMember.create({
      teamId: user.currentTeamId,
      userId: existingUser?.id ?? null as any,
      role: payload.role,
      status: 'pending',
      invitationToken: token,
      invitedEmail: payload.email,
      invitedAt: DateTime.now(),
    })

    const frontendUrl = env.get('FRONTEND_URL') || 'http://localhost:3000'
    const inviteUrl = `${frontendUrl}/invite/${token}`

    // Send invitation email
    EmailService.sendTeamInviteEmail(
      payload.email,
      user.fullName || user.email,
      inviteUrl
    ).catch(() => {})

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
