import type { HttpContext } from '@adonisjs/core/http'
import AuthProvider from '#models/account/auth_provider'
import keyStore from '#services/crypto/key_store'

export default class Me {
  async handle({ auth, response }: HttpContext) {
    const user = auth.user!

    const googleProvider = await AuthProvider.query()
      .where('userId', user.id)
      .where('provider', 'google')
      .first()

    // Check if vault is locked (crypto enabled but DEK not in memory)
    const vaultLocked =
      user.saltKdf && user.currentTeamId
        ? !keyStore.isUnlocked(user.id, user.currentTeamId)
        : false

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
        hasGoogleProvider: !!googleProvider,
        vaultLocked,
      },
    })
  }
}
