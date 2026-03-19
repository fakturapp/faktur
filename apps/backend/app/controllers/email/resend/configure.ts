import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import EmailAccount from '#models/email/email_account'
import EncryptionService from '#services/encryption/encryption_service'
import ResendUserService from '#services/email/resend_user_service'

const configureResendValidator = vine.compile(
  vine.object({
    apiKey: vine.string().trim().minLength(10),
    fromEmail: vine.string().trim().email(),
    displayName: vine.string().trim().optional(),
  })
)

export default class ConfigureResend {
  async handle({ auth, request, response }: HttpContext) {
    const user = auth.user!
    const teamId = user.currentTeamId

    if (!teamId) {
      return response.badRequest({ message: 'No team selected' })
    }

    const payload = await request.validateUsing(configureResendValidator)

    // Validate the API key
    const isValid = await ResendUserService.validateApiKey(payload.apiKey)
    if (!isValid) {
      return response.badRequest({
        message: 'Clé API Resend invalide. Vérifiez votre clé et réessayez.',
      })
    }

    // Encrypt the API key before storage
    const encryptedApiKey = EncryptionService.encrypt(payload.apiKey)

    // Upsert: update if a Resend account already exists for this team+email
    const existing = await EmailAccount.query()
      .where('team_id', teamId)
      .where('provider', 'resend')
      .where('email', payload.fromEmail)
      .first()

    if (existing) {
      existing.accessToken = encryptedApiKey
      existing.displayName = payload.displayName || null
      existing.isActive = true
      await existing.save()

      return response.ok({
        message: 'Compte Resend mis à jour',
        emailAccount: {
          id: existing.id,
          provider: existing.provider,
          email: existing.email,
          displayName: existing.displayName,
          isDefault: existing.isDefault,
        },
      })
    }

    // Check if any email account exists for this team (to set default)
    const existingCount = await EmailAccount.query()
      .where('team_id', teamId)
      .count('* as total')

    const isFirst = Number(existingCount[0].$extras.total) === 0

    const account = await EmailAccount.create({
      teamId,
      provider: 'resend',
      email: payload.fromEmail,
      displayName: payload.displayName || null,
      accessToken: encryptedApiKey,
      isDefault: isFirst,
      isActive: true,
    })

    return response.created({
      message: 'Compte Resend configuré',
      emailAccount: {
        id: account.id,
        provider: account.provider,
        email: account.email,
        displayName: account.displayName,
        isDefault: account.isDefault,
      },
    })
  }
}
