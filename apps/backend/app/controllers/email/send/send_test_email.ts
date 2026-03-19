import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import EmailAccount from '#models/email/email_account'
import GmailOAuthService from '#services/email/gmail_oauth_service'
import ResendUserService from '#services/email/resend_user_service'

const testEmailValidator = vine.compile(
  vine.object({
    emailAccountId: vine.string().trim(),
  })
)

export default class SendTestEmail {
  async handle({ auth, request, response }: HttpContext) {
    const user = auth.user!
    const teamId = user.currentTeamId

    if (!teamId) {
      return response.badRequest({ message: 'No team selected' })
    }

    const payload = await request.validateUsing(testEmailValidator)

    const emailAccount = await EmailAccount.query()
      .where('id', payload.emailAccountId)
      .where('team_id', teamId)
      .first()

    if (!emailAccount) {
      return response.notFound({ message: 'Email account not found' })
    }

    if (!['gmail', 'resend'].includes(emailAccount.provider)) {
      return response.badRequest({ message: 'Provider non supporté' })
    }

    const testBody = `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 0;">
  <div style="background: #18181b; border-radius: 16px; padding: 32px; color: #fafafa;">
    <h2 style="margin: 0 0 12px; font-size: 18px; font-weight: 600;">Email de test</h2>
    <p style="margin: 0 0 20px; font-size: 14px; color: #a1a1aa; line-height: 1.6;">
      Si vous recevez cet email, votre compte <strong style="color: #fafafa;">${emailAccount.email}</strong> est correctement configuré pour envoyer des emails depuis Faktur.
    </p>
    <div style="border-top: 1px solid #27272a; padding-top: 16px; font-size: 12px; color: #71717a;">
      Envoyé automatiquement depuis Faktur
    </div>
  </div>
</div>`

    try {
      if (emailAccount.provider === 'gmail') {
        let accessToken: string
        try {
          accessToken = await GmailOAuthService.getValidAccessToken(emailAccount)
          if (emailAccount.$isDirty) {
            await emailAccount.save()
          }
        } catch {
          return response.badRequest({
            message: 'Impossible de se connecter à Gmail. Veuillez reconnecter votre compte.',
          })
        }

        await GmailOAuthService.sendEmail({
          accessToken,
          from: emailAccount.email,
          fromName: emailAccount.displayName,
          to: emailAccount.email,
          subject: 'Test — Faktur',
          body: testBody,
        })
      } else if (emailAccount.provider === 'resend') {
        if (!emailAccount.accessToken) {
          return response.badRequest({ message: 'Clé API Resend manquante' })
        }

        await ResendUserService.sendEmail({
          encryptedApiKey: emailAccount.accessToken,
          from: emailAccount.email,
          fromName: emailAccount.displayName,
          to: emailAccount.email,
          subject: 'Test — Faktur',
          body: testBody,
        })
      }
    } catch {
      return response.internalServerError({
        message: "Erreur lors de l'envoi de l'email de test. Veuillez réessayer.",
      })
    }

    return response.ok({ message: 'Email de test envoyé avec succès' })
  }
}
