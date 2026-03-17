import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import GmailOAuthService from '#services/email/gmail_oauth_service'
import EncryptionService from '#services/encryption/encryption_service'
import EmailAccount from '#models/email/email_account'
import env from '#start/env'

export default class GmailCallback {
  async handle({ request, response }: HttpContext) {
    const code = request.input('code')
    const stateParam = request.input('state')
    const error = request.input('error')

    const frontendUrl = env.get('FRONTEND_URL', 'http://localhost:3000')

    if (error || !code || !stateParam) {
      return response.redirect(`${frontendUrl}/dashboard/settings/email?error=oauth_cancelled`)
    }

    let state: { teamId: string; userId: string; returnTo?: string }
    try {
      state = JSON.parse(EncryptionService.decrypt(stateParam))
    } catch {
      return response.redirect(`${frontendUrl}/dashboard/settings/email?error=invalid_state`)
    }

    try {
      const tokenData = await GmailOAuthService.exchangeCode(code)

      // Upsert: update if same team+email+provider exists, otherwise create
      const existing = await EmailAccount.query()
        .where('team_id', state.teamId)
        .where('email', tokenData.email)
        .where('provider', 'gmail')
        .first()

      if (existing) {
        existing.merge({
          accessToken: tokenData.accessToken,
          refreshToken: tokenData.refreshToken,
          tokenExpiresAt: DateTime.fromJSDate(tokenData.expiresAt),
          displayName: tokenData.displayName,
          isActive: true,
        })
        await existing.save()
      } else {
        // Check if this is the first email account (make it default)
        const accountCount = await EmailAccount.query()
          .where('team_id', state.teamId)
          .count('* as total')
        const isFirst = Number(accountCount[0].$extras.total) === 0

        await EmailAccount.create({
          teamId: state.teamId,
          provider: 'gmail',
          email: tokenData.email,
          displayName: tokenData.displayName,
          accessToken: tokenData.accessToken,
          refreshToken: tokenData.refreshToken,
          tokenExpiresAt: DateTime.fromJSDate(tokenData.expiresAt),
          isDefault: isFirst,
          isActive: true,
        })
      }

      const returnTo = state.returnTo || '/dashboard/settings/email'
      const separator = returnTo.includes('?') ? '&' : '?'
      return response.redirect(`${frontendUrl}${returnTo}${separator}connected=true`)
    } catch {
      return response.redirect(`${frontendUrl}/dashboard/settings/email?error=oauth_failed`)
    }
  }
}
