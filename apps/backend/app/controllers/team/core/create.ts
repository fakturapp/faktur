import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import Team from '#models/team/team'
import TeamMember from '#models/team/team_member'
import { createTeamValidator } from '#validators/auth/onboarding_validators'

export default class Create {
  async handle({ auth, request, response }: HttpContext) {
    const user = auth.user!
    const payload = await request.validateUsing(createTeamValidator)

    const team = await Team.create({
      name: payload.name,
      iconUrl: payload.iconUrl ?? null,
      ownerId: user.id,
    })

    await TeamMember.create({
      teamId: team.id,
      userId: user.id,
      role: 'super_admin',
      status: 'active',
      joinedAt: DateTime.now(),
    })

    // Switch to the new team and trigger onboarding flow
    user.currentTeamId = team.id
    user.onboardingCompleted = false
    await user.save()

    return response.created({
      message: 'Team created successfully',
      team: {
        id: team.id,
        name: team.name,
        iconUrl: team.iconUrl,
      },
    })
  }
}
