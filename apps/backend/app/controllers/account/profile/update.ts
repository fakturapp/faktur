import type { HttpContext } from '@adonisjs/core/http'
import { updateProfileValidator } from '#validators/account_validator'
import UserTransformer from '#transformers/user_transformer'

export default class Update {
  async handle(ctx: HttpContext) {
    const { auth, request, response } = ctx
    const user = auth.user!
    const payload = await request.validateUsing(updateProfileValidator)

    if (payload.fullName !== undefined) user.fullName = payload.fullName
    if (payload.avatarUrl !== undefined) user.avatarUrl = payload.avatarUrl

    await user.save()

    return response.ok({
      message: 'Profile updated successfully',
      user: await ctx.serialize.withoutWrapping(UserTransformer.transform(user)),
    })
  }
}
