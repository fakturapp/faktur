import type { HttpContext } from '@adonisjs/core/http'
import AuthProvider from '#models/account/auth_provider'
import AuthProviderTransformer from '#transformers/auth_provider_transformer'

export default class ListProviders {
  async handle(ctx: HttpContext) {
    const { auth, response } = ctx
    const user = auth.user!

    const providers = await AuthProvider.query()
      .where('userId', user.id)
      .orderBy('createdAt', 'asc')

    return response.ok({
      providers: await ctx.serialize.withoutWrapping(AuthProviderTransformer.transform(providers)),
    })
  }
}
