import type { HttpContext } from '@adonisjs/core/http'

export default class Me {
  async handle({ auth, response }: HttpContext) {
    const user = auth.user!
    return response.ok({
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        avatarUrl: user.avatarUrl,
        emailVerified: user.emailVerified,
        twoFactorEnabled: user.twoFactorEnabled,
        onboardingCompleted: user.onboardingCompleted,
        currentTeamId: user.currentTeamId,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
        cryptoResetNeeded: user.cryptoResetNeeded || false,
      },
    })
  }
}
