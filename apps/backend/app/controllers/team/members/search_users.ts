import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/account/user'
import TeamMember from '#models/team/team_member'

export default class SearchUsers {
  async handle({ auth, request, response }: HttpContext) {
    const user = auth.user!
    const teamId = user.currentTeamId

    if (!teamId) {
      return response.badRequest({ message: 'No team selected' })
    }

    const q = (request.qs().q || '').trim().toLowerCase()
    if (!q || q.length < 2) {
      return response.ok({ users: [] })
    }

    const existingMembers = await TeamMember.query()
      .where('teamId', teamId)
      .whereIn('status', ['active', 'pending'])
      .select('userId', 'invitedEmail')

    const excludeUserIds = existingMembers
      .map((m) => m.userId)
      .filter(Boolean)
    const excludeEmails = existingMembers
      .map((m) => m.invitedEmail?.toLowerCase())
      .filter(Boolean) as string[]

    const results = await User.query()
      .where((builder) => {
        builder
          .whereILike('email', `%${q}%`)
          .orWhereILike('fullName', `%${q}%`)
      })
      .whereNotIn('id', excludeUserIds.length > 0 ? excludeUserIds : ['__none__'])
      .where('status', 'active')
      .where('emailVerified', true)
      .limit(5)
      .select('id', 'email', 'fullName', 'avatarUrl')

    // Filter out emails already invited
    const filtered = results.filter(
      (u) => !excludeEmails.includes(u.email.toLowerCase())
    )

    return response.ok({
      users: filtered.map((u) => ({
        id: u.id,
        fullName: u.fullName,
        avatarUrl: (u as any).avatarUrl ?? null,
        emailHint: u.email.replace(/^(.{2})(.*)(@.*)$/, '$1***$3'),
      })),
    })
  }
}
