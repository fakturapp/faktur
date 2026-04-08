import type { HttpContext } from '@adonisjs/core/http'
import TeamMember from '#models/team/team_member'
import Team from '#models/team/team'
import User from '#models/account/user'
import { validateDeletionSession } from './_helpers.js'

export default class Teams {
  async handle({ auth, request, response }: HttpContext) {
    const user = auth.user!
    const token = request.header('x-deletion-token')

    const error = validateDeletionSession(user, token)
    if (error) return response.badRequest({ message: error })

    const memberships = await TeamMember.query()
      .where('userId', user.id)
      .where('status', 'active')

    const teams: {
      id: string
      name: string
      role: string
      memberCount: number
      members: { userId: string; displayName: string; email: string; role: string }[]
    }[] = []

    for (const membership of memberships) {
      const team = await Team.find(membership.teamId)
      if (!team) continue

      const teamMembers = await TeamMember.query()
        .where('teamId', team.id)
        .where('status', 'active')

      const members: { userId: string; displayName: string; email: string; role: string }[] = []
      if (membership.role === 'super_admin') {
        for (const m of teamMembers) {
          if (m.userId === user.id) continue
          const memberUser = await User.find(m.userId)
          if (memberUser) {
            members.push({
              userId: memberUser.id,
              displayName: memberUser.fullName || memberUser.email,
              email: memberUser.email,
              role: m.role,
            })
          }
        }
      }

      teams.push({
        id: team.id,
        name: team.name,
        role: membership.role,
        memberCount: teamMembers.length,
        members,
      })
    }

    return response.ok({ teams })
  }
}
