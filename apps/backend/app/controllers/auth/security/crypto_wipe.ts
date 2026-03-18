import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import User from '#models/account/user'
import Team from '#models/team/team'
import TeamMember from '#models/team/team_member'
import keyStore from '#services/crypto/key_store'

/**
 * POST /auth/crypto/wipe
 * User cannot recover data (forgot old password).
 * Wipes ALL teams/data owned by the user and restarts from onboarding.
 * Requires { confirm: "SUPPRIMER", password: "<current password>" } in request body for safety.
 */
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

    // Verify the current password
    const passwordValid = await User.verifyCredentials(user.email, password)
      .then(() => true)
      .catch(() => false)

    if (!passwordValid) {
      return response.unauthorized({ message: 'Mot de passe incorrect' })
    }

    const newKek = keyStore.getKEK(user.id)
    if (!newKek) {
      return response.unauthorized({ code: 'SESSION_EXPIRED', message: 'Session expired. Please log in again.' })
    }

    await db.transaction(async (trx) => {
      // Find all teams owned by this user
      const ownedTeams = await Team.query({ client: trx })
        .where('ownerId', user.id)

      for (const team of ownedTeams) {
        // CASCADE delete handles: team_members, company, clients, invoices,
        // invoice_lines, quotes, quote_lines, bank_accounts, invoice_settings,
        // email_accounts, email_logs (all have ON DELETE CASCADE on team_id)
        await team.useTransaction(trx).delete()
      }

      // Remove memberships where user is NOT owner (invited teams)
      await TeamMember.query({ client: trx })
        .where('userId', user.id)
        .delete()

      // Reset user state
      user.useTransaction(trx)
      user.currentTeamId = null
      user.onboardingCompleted = false
      user.cryptoResetNeeded = false
      user.oldSaltKdf = null
      await user.save()
    })

    // Clear all cached keys
    keyStore.clear(user.id)

    // Re-store just the KEK for the fresh start
    keyStore.storeKeys(user.id, newKek, '', Buffer.alloc(0))

    return response.ok({
      message: 'Toutes les données ont été supprimées. Vous allez être redirigé vers la configuration.',
      redirectTo: '/onboarding/team',
    })
  }
}
