import type { HttpContext } from '@adonisjs/core/http'
import Team from '#models/team/team'
import TeamTransformer from '#transformers/team_transformer'

export default class Show {
  async handle(ctx: HttpContext) {
    const { auth, response } = ctx
    const user = auth.user!

    if (!user.currentTeamId) {
      return response.notFound({ message: 'No team found' })
    }

    const team = await Team.query()
      .where('id', user.currentTeamId)
      .preload('members', (q) => {
        q.preload('user')
      })
      .preload('company')
      .firstOrFail()

    const currentMember = team.members.find((member) => member.userId === user.id)
    const canAccessRecoveryKey =
      !!currentMember && ['super_admin', 'admin'].includes(currentMember.role)
    const serializedTeam = await ctx.serialize.withoutWrapping(TeamTransformer.transform(team))

    return response.ok({
      team: {
        ...serializedTeam,
        recoveryKeyAvailable: canAccessRecoveryKey && !!currentMember?.encryptedRecoveryKey,
        recoveryKeyUnavailableReason:
          canAccessRecoveryKey && !currentMember?.encryptedRecoveryKey ? 'legacy_team' : null,
      },
    })
  }
}
