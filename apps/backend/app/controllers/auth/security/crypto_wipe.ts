import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import User from '#models/account/user'
import Team from '#models/team/team'
import TeamMember from '#models/team/team_member'
import keyStore from '#services/crypto/key_store'
import keyStoreWarmer from '#services/crypto/key_store_warmer'

export default class CryptoWipe {
  async handle({ auth, request, response }: HttpContext) {
    const user = auth.user!

    if (!user.cryptoResetNeeded) {
      return response.badRequest({ message: 'No crypto reset needed' })
    }

    const { confirm, password } = request.only(['confirm', 'password'])
    if (confirm !== 'SUPPRIMER') {
      return response.unprocessableEntity({ message: 'Confirmation required: type SUPPRIMER' })
    }

    if (!password) {
      return response.badRequest({ message: 'Password is required' })
    }

    const passwordValid = await User.verifyCredentials(user.email, password)
      .then(() => true)
      .catch(() => false)

    if (!passwordValid) {
      return response.unauthorized({ message: 'Mot de passe incorrect' })
    }

    const newKek =
      keyStore.getKEK(user.id) ||
      (await keyStoreWarmer.warmKekFromRequest(
        user.id,
        String(user.currentAccessToken.identifier),
        request.header('X-Vault-Key')
      ))

    if (!newKek) {
      return response.unauthorized({
        code: 'SESSION_EXPIRED',
        message: 'Session expired. Please log in again.',
      })
    }

    await db.transaction(async (trx) => {
      const ownedTeams = await Team.query({ client: trx }).where('ownerId', user.id)

      for (const team of ownedTeams) {
        await team.useTransaction(trx).delete()
      }

      await TeamMember.query({ client: trx }).where('userId', user.id).delete()

      user.useTransaction(trx)
      user.currentTeamId = null
      user.onboardingCompleted = false
      user.cryptoResetNeeded = false
      user.oldSaltKdf = null
      await user.save()
    })

    keyStore.clear(user.id)

    keyStore.storeKeys(user.id, newKek, '', Buffer.alloc(0))

    return response.ok({
      message:
        'Toutes les données ont été supprimées. Vous allez être redirigé vers la configuration.',
      redirectTo: '/onboarding/team',
    })
  }
}
