import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import vine from '@vinejs/vine'
import User from '#models/account/user'
import AuthProvider from '#models/account/auth_provider'
import LoginHistory from '#models/account/login_history'
import AuditLog from '#models/shared/audit_log'
import GoogleAuthService from '#services/auth/google_auth_service'
import zeroAccessCryptoService from '#services/crypto/zero_access_crypto_service'
import keyStore from '#services/crypto/key_store'
import securityConfig from '#config/security'

const googleRegisterValidator = vine.compile(
  vine.object({
    googleData: vine.string(),
    password: vine.string().minLength(securityConfig.password.minLength).maxLength(128).confirmed(),
    acceptTerms: vine.accepted(),
    acceptPrivacy: vine.accepted(),
  })
)

export default class GoogleRegister {
  async handle({ request, response }: HttpContext) {
    const data = await request.validateUsing(googleRegisterValidator)

    let profile
    try {
      profile = GoogleAuthService.decryptProfileData(data.googleData)
    } catch {
      return response.badRequest({ message: 'Invalid or expired Google data' })
    }

    // Check if email already taken
    const existingUser = await User.findBy('email', profile.email)
    if (existingUser) {
      return response.conflict({ message: 'An account with this email already exists' })
    }

    // Check if Google account already linked
    const existingProvider = await AuthProvider.query()
      .where('provider', 'google')
      .where('providerUserId', profile.sub)
      .first()
    if (existingProvider) {
      return response.conflict({ message: 'This Google account is already linked to another user' })
    }

    const saltKdf = zeroAccessCryptoService.generateSalt()

    const user = await User.create({
      fullName: profile.name,
      email: profile.email,
      password: data.password,
      avatarUrl: profile.picture,
      emailVerified: true,
      twoFactorEnabled: false,
      status: 'active',
      failedLoginAttempts: 0,
      saltKdf: saltKdf.toString('hex'),
      keyVersion: 1,
      lastLoginAt: DateTime.now(),
    })

    await AuthProvider.create({
      userId: user.id,
      provider: 'google',
      providerUserId: profile.sub,
      email: profile.email,
      displayName: profile.name,
      avatarUrl: profile.picture,
    })

    const token = await User.accessTokens.create(user, ['*'], {
      expiresIn: '7 days',
    })

    await db
      .from('auth_access_tokens')
      .where('id', String(token.identifier))
      .update({
        ip_address: request.ip(),
        user_agent: (request.header('user-agent') || '').slice(0, 512),
      })

    await LoginHistory.create({
      userId: user.id,
      tokenIdentifier: String(token.identifier),
      ipAddress: request.ip(),
      userAgent: request.header('user-agent') ?? undefined,
      status: 'success',
      isSuspicious: false,
    })

    await AuditLog.create({
      userId: user.id,
      action: 'user.registered.google',
      resourceType: 'user',
      resourceId: user.id,
      ipAddress: request.ip(),
      userAgent: request.header('user-agent'),
      severity: 'info',
    })

    // Derive KEK from password (password was provided, so crypto works normally)
    const salt = Buffer.from(user.saltKdf!, 'hex')
    const kek = await zeroAccessCryptoService.deriveKEK(data.password, salt)
    keyStore.storeKeys(user.id, kek, '', Buffer.alloc(0))

    return response.created({
      message: 'Registration successful',
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        avatarUrl: user.avatarUrl,
        emailVerified: user.emailVerified,
        twoFactorEnabled: user.twoFactorEnabled,
        onboardingCompleted: user.onboardingCompleted,
        currentTeamId: user.currentTeamId,
        cryptoResetNeeded: user.cryptoResetNeeded || false,
      },
      token: token.value!.release(),
    })
  }
}
