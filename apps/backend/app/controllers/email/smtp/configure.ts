import type { HttpContext } from '@adonisjs/core/http'
import EmailAccount from '#models/email/email_account'
import EncryptionService from '#services/encryption/encryption_service'
import SmtpService from '#services/email/smtp_service'
import { configureSmtpValidator } from '#validators/email_validator'

export default class ConfigureSmtp {
  async handle({ auth, request, response }: HttpContext) {
    const user = auth.user!
    const teamId = user.currentTeamId

    if (!teamId) {
      return response.badRequest({ message: 'No team selected' })
    }

    const payload = await request.validateUsing(configureSmtpValidator)

    const isValid = await SmtpService.validateConnection({
      host: payload.host,
      port: payload.port,
      username: payload.username,
      password: payload.password,
    })

    if (!isValid) {
      return response.badRequest({
        message: 'Connexion SMTP impossible. Vérifiez vos paramètres et réessayez.',
      })
    }

    const encryptedUsername = EncryptionService.encrypt(payload.username)
    const encryptedPassword = EncryptionService.encrypt(payload.password)

    const existing = await EmailAccount.query()
      .where('team_id', teamId)
      .where('provider', 'smtp')
      .where('email', payload.fromEmail)
      .first()

    if (existing) {
      existing.smtpHost = payload.host
      existing.smtpPort = payload.port
      existing.smtpUsername = encryptedUsername
      existing.smtpPassword = encryptedPassword
      existing.displayName = payload.displayName || null
      existing.isActive = true
      await existing.save()

      return response.ok({
        message: 'Compte SMTP mis à jour',
        emailAccount: {
          id: existing.id,
          provider: existing.provider,
          email: existing.email,
          displayName: existing.displayName,
          isDefault: existing.isDefault,
        },
      })
    }

    const existingCount = await EmailAccount.query().where('team_id', teamId).count('* as cnt')

    const isFirst = Number(existingCount[0].$extras.cnt) === 0

    const account = await EmailAccount.create({
      teamId,
      provider: 'smtp',
      email: payload.fromEmail,
      displayName: payload.displayName || null,
      smtpHost: payload.host,
      smtpPort: payload.port,
      smtpUsername: encryptedUsername,
      smtpPassword: encryptedPassword,
      isDefault: isFirst,
      isActive: true,
    })

    return response.created({
      message: 'Compte SMTP configuré',
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
