import type { HttpContext } from '@adonisjs/core/http'
import UserTransformer from '#transformers/user_transformer'

export default class Show {
  async handle(ctx: HttpContext) {
    const { auth, response } = ctx
    const user = auth.user!

    return response.ok({
      user: await ctx.serialize.withoutWrapping(UserTransformer.transform(user)),
    })
  }
}
