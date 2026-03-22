import type { HttpContext } from '@adonisjs/core/http'
import TeamMember from '#models/team/team_member'
import TeamMemberTransformer from '#transformers/team_member_transformer'

export default class Members {
  async handle(ctx: HttpContext) {
    const { auth, response } = ctx
    const user = auth.user!

    if (!user.currentTeamId) {
      return response.notFound({ message: 'No team found' })
    }

    const members = await TeamMember.query().where('teamId', user.currentTeamId).preload('user')

    return response.ok({
      members: await ctx.serialize.withoutWrapping(TeamMemberTransformer.transform(members)),
    })
  }
}
