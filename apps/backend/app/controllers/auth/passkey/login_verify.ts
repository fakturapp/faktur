import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import crypto from 'node:crypto'
import User from '#models/account/user'
import TeamMember from '#models/team/team_member'
import LoginHistory from '#models/account/login_history'
import AuditLog from '#models/shared/audit_log'
import passkeyService from '#services/auth/passkey_service'
import zeroAccessCryptoService from '#services/crypto/zero_access_crypto_service'
import encryptionService from '#services/encryption/encryption_service'
import keyStore from '#services/crypto/key_store'
import UserTransformer from '#transformers/user_transformer'

export default class LoginVerify {
  async handle(ctx: HttpContext) {
    const { request, response } = ctx
    const { credential } = request.only(['credential'])

    if (!credential) {
      return response.badRequest({ message: 'Missing credential response' })
    }

    try {
      const { verified, credential: passkeyCredential, error: verifyError } =
        await passkeyService.verifyAuthentication(credential)

      if (!verified || !passkeyCredential) {
        const reason = verifyError || 'unknown'
        await this.recordLoginAttempt(request, null, 'failed', `Passkey: ${reason}`)

        const messages: Record<string, string> = {
          credential_not_found: 'Cl\u00e9 d\'acc\u00e8s introuvable. Elle a peut-\u00eatre \u00e9t\u00e9 supprim\u00e9e.',
          challenge_expired: 'Le d\u00e9lai d\'authentification a expir\u00e9. Veuillez r\u00e9essayer.',
          verification_failed: 'La v\u00e9rification a \u00e9chou\u00e9. Veuillez r\u00e9essayer.',
        }

        return response.unauthorized({
          message: messages[reason] || 'L\'authentification par cl\u00e9 d\'acc\u00e8s a \u00e9chou\u00e9. Veuillez r\u00e9essayer.',
          code: 'PASSKEY_INVALID',
        })
      }

      const user = passkeyCredential.user

      if (user.status !== 'active') {
        await this.recordLoginAttempt(request, user.id, 'failed', 'Inactive account')
        return response.unauthorized({ message: 'Account is not active' })
      }

      if (user.lockedUntil && user.lockedUntil > DateTime.now()) {
        await this.recordLoginAttempt(request, user.id, 'blocked', 'Account locked')
        return response.tooManyRequests({
          message: 'Account temporarily locked',
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

      // Passkey bypasses 2FA (passkey IS a strong factor: possession + biometrics)

      // Reset failed attempts
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

      await this.recordLoginAttempt(
        request,
        user.id,
        'success',
        null,
        String(token.identifier)
      )

      await AuditLog.create({
        userId: user.id,
        action: 'user.login_passkey',
        resourceType: 'user',
        resourceId: user.id,
        ipAddress: request.ip(),
        userAgent: request.header('user-agent'),
        severity: 'info',
        metadata: { passkeyId: passkeyCredential.id },
      })

      // Zero-access crypto: decrypt KEK from passkey, load team DEK
      if (user.saltKdf && passkeyCredential.encryptedKek && !user.cryptoResetNeeded) {
        try {
          const kek = passkeyService.decryptKekFromPasskey(
            passkeyCredential.encryptedKek,
            passkeyCredential.credentialId
          )

          if (user.currentTeamId) {
            const teamMember = await TeamMember.query()
              .where('teamId', user.currentTeamId)
              .where('userId', user.id)
              .where('status', 'active')
              .first()

            if (teamMember?.encryptedTeamDek) {
              const teamDek = zeroAccessCryptoService.decryptDEK(
                teamMember.encryptedTeamDek,
                kek
              )
              keyStore.storeKeys(user.id, kek, user.currentTeamId, teamDek)
            } else {
              keyStore.storeKeys(user.id, kek, '', Buffer.alloc(0))
            }
          } else {
            keyStore.storeKeys(user.id, kek, '', Buffer.alloc(0))
          }

          // Dual-key split: encrypt KEK with sessionKey (client) then ENCRYPTION_KEY (server)
          const sessionKey = crypto.randomBytes(32)
          const layer1 = encryptionService.encryptWithCustomKey(
            kek.toString('hex'),
            sessionKey
          )
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
        } catch {
          // KEK decryption failed — login still succeeds, but vault will be locked
          keyStore.storeKeys(user.id, Buffer.alloc(0), '', Buffer.alloc(0))
        }
      }

      return response.ok({
        message: 'Login successful',
        user: await ctx.serialize.withoutWrapping(UserTransformer.transform(user)),
        token: token.value!.release(),
      })
    } catch (err: any) {
      const errMsg = err?.message || String(err)
      console.error('[Passkey Login] Error:', errMsg)
      console.error('[Passkey Login] Stack:', err?.stack)
      await this.recordLoginAttempt(request, null, 'failed', errMsg.slice(0, 200))
      return response.unauthorized({
        message: 'Passkey authentication failed',
        code: 'PASSKEY_VERIFY_FAILED',
        detail: process.env.NODE_ENV !== 'production' ? errMsg : undefined,
      })
    }
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
        // Silently fail
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
