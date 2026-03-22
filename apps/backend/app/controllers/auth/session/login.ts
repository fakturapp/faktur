import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import User from '#models/account/user'
import TeamMember from '#models/team/team_member'
import LoginHistory from '#models/account/login_history'
import AuditLog from '#models/shared/audit_log'
import { loginValidator } from '#validators/auth/auth_validators'
import TwoFactorService from '#services/auth/two_factor_service'
import TurnstileService from '#services/security/turnstile_service'
import crypto from 'node:crypto'
import zeroAccessCryptoService from '#services/crypto/zero_access_crypto_service'
import encryptionService from '#services/encryption/encryption_service'
import keyStore from '#services/crypto/key_store'
import UserTransformer from '#transformers/user_transformer'

export default class Login {
  async handle(ctx: HttpContext) {
    const { request, response } = ctx
    const { email, password, code, turnstileToken } = request.only([
      'email',
      'password',
      'code',
      'turnstileToken',
    ])

    await request.validateUsing(loginValidator)

    // Verify Turnstile captcha
    const turnstileValid = await TurnstileService.verifyToken(turnstileToken || '', request.ip())
    if (!turnstileValid) {
      return response.forbidden({ message: 'Captcha verification failed' })
    }

    // Timing-safe credential verification: User.verifyCredentials performs a fake
    // hash comparison when the user doesn't exist, ensuring identical response time
    // regardless of whether the email exists in the database.
    let user: User
    try {
      user = await User.verifyCredentials(email, password)
    } catch {
      // In the error path (timing no longer matters), look up the user to
      // increment failed attempts and check lockout.
      const existingUser = await User.findBy('email', email)
      if (existingUser) {
        existingUser.failedLoginAttempts += 1
        if (existingUser.failedLoginAttempts >= 5) {
          existingUser.lockedUntil = DateTime.now().plus({ minutes: 15 })
        }
        await existingUser.save()

        if (existingUser.lockedUntil && existingUser.lockedUntil > DateTime.now()) {
          await this.recordLoginAttempt(request, existingUser.id, 'blocked', 'Account locked')
          return response.tooManyRequests({
            message: 'Account temporarily locked due to too many failed attempts',
            lockedUntil: existingUser.lockedUntil.toISO(),
          })
        }

        await this.recordLoginAttempt(request, existingUser.id, 'failed', 'Invalid credentials')
      } else {
        await this.recordLoginAttempt(request, null, 'failed', 'Invalid credentials')
      }
      return response.unauthorized({ message: 'Invalid email or password' })
    }

    // Credentials valid — now check account status and lockout
    if (user.status !== 'active') {
      await this.recordLoginAttempt(request, user.id, 'failed', 'Inactive account')
      return response.unauthorized({ message: 'Invalid email or password' })
    }

    if (user.lockedUntil && user.lockedUntil > DateTime.now()) {
      await this.recordLoginAttempt(request, user.id, 'blocked', 'Account locked')
      return response.tooManyRequests({
        message: 'Account temporarily locked due to too many failed attempts',
        lockedUntil: user.lockedUntil.toISO(),
      })
    }

    if (!user.emailVerified) {
      return response.ok({
        requiresEmailVerification: true,
        email: user.email,
        message: 'Please verify your email address before logging in',
      })
    }

    if (user.twoFactorEnabled) {
      if (!code) {
        return response.ok({
          requiresTwoFactor: true,
          userId: user.id,
          message: 'Two-factor authentication required',
        })
      }

      if (code.includes('-') && user.recoveryCodesEncrypted) {
        const result = TwoFactorService.verifyRecoveryCode(code, user.recoveryCodesEncrypted)
        if (result.valid) {
          user.recoveryCodesEncrypted = TwoFactorService.encryptRecoveryCodes(result.remainingCodes)
          await user.save()
          await AuditLog.create({
            userId: user.id,
            action: 'user.recovery_code_used',
            resourceType: 'user',
            resourceId: user.id,
            ipAddress: request.ip(),
            userAgent: request.header('user-agent'),
            severity: 'warning',
            metadata: { remainingCodes: result.remainingCodes.length },
          })
        } else {
          await this.recordLoginAttempt(request, user.id, 'failed', 'Invalid recovery code')
          return response.unauthorized({ message: 'Invalid verification code' })
        }
      } else {
        if (!user.twoFactorSecretEncrypted) {
          return response.badRequest({ message: '2FA configuration error' })
        }
        const secret = TwoFactorService.decryptSecret(user.twoFactorSecretEncrypted)
        const isValid = TwoFactorService.verifyToken(secret, code)

        if (!isValid.valid) {
          await this.recordLoginAttempt(request, user.id, 'failed', 'Invalid 2FA code')
          return response.unauthorized({ message: 'Invalid verification code' })
        }
      }
    }

    user.failedLoginAttempts = 0
    user.lockedUntil = null
    user.lastLoginAt = DateTime.now()
    await user.save()

    const token = await User.accessTokens.create(user, ['*'], {
      expiresIn: '15 days',
    })

    // Store IP and user agent on the token
    await db
      .from('auth_access_tokens')
      .where('id', String(token.identifier))
      .update({
        ip_address: request.ip(),
        user_agent: (request.header('user-agent') || '').slice(0, 512),
      })

    await this.recordLoginAttempt(request, user.id, 'success', null, String(token.identifier))

    await AuditLog.create({
      userId: user.id,
      action: 'user.login',
      resourceType: 'user',
      resourceId: user.id,
      ipAddress: request.ip(),
      userAgent: request.header('user-agent'),
      severity: 'info',
    })

    // Zero-access crypto: derive KEK and load team DEK into memory
    if (user.saltKdf) {
      const salt = Buffer.from(user.saltKdf, 'hex')
      const kek = await zeroAccessCryptoService.deriveKEK(password, salt)

      // If crypto reset is needed (password was reset without old password),
      // the DEKs are still encrypted with the OLD KEK — skip loading them.
      if (!user.cryptoResetNeeded) {
        if (user.currentTeamId) {
          const teamMember = await TeamMember.query()
            .where('teamId', user.currentTeamId)
            .where('userId', user.id)
            .where('status', 'active')
            .first()

          if (teamMember?.encryptedTeamDek) {
            const teamDek = zeroAccessCryptoService.decryptDEK(teamMember.encryptedTeamDek, kek)
            keyStore.storeKeys(user.id, kek, user.currentTeamId, teamDek)
          } else {
            keyStore.storeKeys(user.id, kek, '', Buffer.alloc(0))
          }
        } else {
          keyStore.storeKeys(user.id, kek, '', Buffer.alloc(0))
        }
      } else {
        // Store only the KEK (new one), no DEKs yet
        keyStore.storeKeys(user.id, kek, '', Buffer.alloc(0))
      }

      // Dual-key split: encrypt KEK with sessionKey (client) then ENCRYPTION_KEY (server)
      const sessionKey = crypto.randomBytes(32)
      const layer1 = encryptionService.encryptWithCustomKey(kek.toString('hex'), sessionKey)
      const layer2 = encryptionService.encrypt(layer1)
      await db
        .from('auth_access_tokens')
        .where('id', String(token.identifier))
        .update({ encrypted_kek: layer2 })

      return response.ok({
        message: 'Login successful',
        user: await ctx.serialize.withoutWrapping(UserTransformer.transform(user)),
        token: token.value!.release(),
        vaultKey: sessionKey.toString('hex'),
      })
    }

    return response.ok({
      message: 'Login successful',
      user: await ctx.serialize.withoutWrapping(UserTransformer.transform(user)),
      token: token.value!.release(),
    })
  }

  private async recordLoginAttempt(
    request: HttpContext['request'],
    userId: string | null,
    status: 'success' | 'failed' | 'blocked',
    failureReason: string | null,
    tokenIdentifier?: string
  ) {
    let country: string | null = null
    let city: string | null = null

    if (status === 'success') {
      try {
        const ip = request.ip()
        if (ip && ip !== '::1' && ip !== '127.0.0.1') {
          const res = await fetch(`http://ip-api.com/json/${ip}`)
          if (res.ok) {
            const data = (await res.json()) as any
            if (data.status === 'success') {
              country = data.country
              city = data.city
            }
          }
        }
      } catch {
        // Silently fail if location service is unreachable
      }
    }

    await LoginHistory.create({
      userId: userId ?? undefined,
      tokenIdentifier: tokenIdentifier ?? undefined,
      ipAddress: request.ip(),
      userAgent: request.header('user-agent') ?? undefined,
      status,
      failureReason: failureReason ?? undefined,
      isSuspicious: false,
      country: country ?? undefined,
      city: city ?? undefined,
    })
  }
}
