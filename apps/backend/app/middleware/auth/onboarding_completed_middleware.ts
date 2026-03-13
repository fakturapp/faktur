import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class OnboardingCompletedMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const user = ctx.auth.user!
    if (!user.onboardingCompleted) {
      return ctx.response.forbidden({
        message: 'Onboarding not completed',
        code: 'ONBOARDING_REQUIRED',
      })
    }
    return next()
  }
}
