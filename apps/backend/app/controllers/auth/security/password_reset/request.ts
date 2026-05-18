import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/account/user'
import TokenService from '#services/auth/token_service'
import PasswordResetRequested from '#events/password_reset_requested'
import { passwordResetRequestValidator } from '#validators/auth/auth_validators'

export default class Request {
  async handle({ request, response }: HttpContext) {
    const data = await request.validateUsing(passwordResetRequestValidator)

    // Vine.normalizeEmail() strips Gmail dots and "+suffix", which means
    // OAuth-registered users (whose email comes verbatim from the provider)
    // cannot be found with the normalized form. Try the normalized form first,
    // then fall back to a case-insensitive match on the raw input.
    const rawEmail = String(request.input('email', '')).trim().toLowerCase()

    let user = await User.query().whereRaw('LOWER(email) = ?', [data.email]).first()
    if (!user && rawEmail && rawEmail !== data.email.toLowerCase()) {
      user = await User.query().whereRaw('LOWER(email) = ?', [rawEmail]).first()
    }

    if (!user) {
      return response.ok({
        message: 'If an account exists with this email, a reset link has been sent.',
      })
    }

    const { token, hash: tokenHash, expiresAt } = TokenService.generatePasswordResetToken()

    user.passwordResetToken = tokenHash
    user.passwordResetExpiresAt = expiresAt
    await user.save()

    PasswordResetRequested.dispatch(user.email, token, user.fullName ?? undefined)

    return response.ok({
      message: 'If an account exists with this email, a reset link has been sent.',
    })
  }
}
