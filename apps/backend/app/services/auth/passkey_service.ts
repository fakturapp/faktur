import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
  type VerifiedRegistrationResponse,
  type VerifiedAuthenticationResponse,
  type AuthenticatorTransportFuture,
  type RegistrationResponseJSON,
  type AuthenticationResponseJSON,
} from '@simplewebauthn/server'
import { DateTime } from 'luxon'
import crypto from 'node:crypto'
import env from '#start/env'
import securityConfig from '#config/security'
import PasskeyCredential from '#models/account/passkey_credential'
import PasskeyChallenge from '#models/account/passkey_challenge'
import zeroAccessCryptoService from '#services/crypto/zero_access_crypto_service'

class PasskeyService {
  private get rpID(): string {
    const explicit = env.get('WEBAUTHN_RP_ID')
    if (explicit) return explicit

    // Derive from FRONTEND_URL: extract registrable domain
    const frontendUrl = env.get('FRONTEND_URL')
    if (frontendUrl) {
      try {
        const hostname = new URL(frontendUrl).hostname
        const parts = hostname.split('.')
        if (parts.length >= 2 && hostname !== 'localhost') {
          return parts.slice(-2).join('.')
        }
        return hostname
      } catch {}
    }
    return 'localhost'
  }

  private get origin(): string {
    return env.get('WEBAUTHN_ORIGIN') || env.get('FRONTEND_URL') || 'http://localhost:3000'
  }

  private get rpName(): string {
    return securityConfig.webauthn.rpName
  }

  private get timeout(): number {
    return securityConfig.webauthn.timeout
  }

  /**
   * Generate registration options for a user (authenticated).
   */
  async generateRegistrationOptions(userId: string, email: string) {
    const existingCredentials = await PasskeyCredential.query().where('userId', userId)

    const excludeCredentials = existingCredentials.map((cred) => ({
      id: cred.credentialId,
      type: 'public-key' as const,
      transports: cred.transports
        ? (JSON.parse(cred.transports) as AuthenticatorTransportFuture[])
        : undefined,
    }))

    const options = await generateRegistrationOptions({
      rpName: this.rpName,
      rpID: this.rpID,
      userName: email,
      attestationType: 'none',
      excludeCredentials,
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
      },
      timeout: this.timeout,
    })

    // Store challenge in DB with 60s TTL
    await PasskeyChallenge.create({
      userId,
      challenge: options.challenge,
      type: 'registration',
      expiresAt: DateTime.now().plus({ seconds: 60 }),
    })

    return options
  }

  /**
   * Verify registration response and store the credential.
   */
  async verifyRegistration(
    userId: string,
    response: RegistrationResponseJSON,
    friendlyName: string
  ): Promise<{ credential: PasskeyCredential; verified: boolean }> {
    const challengeRecord = await PasskeyChallenge.query()
      .where('userId', userId)
      .where('type', 'registration')
      .where('expiresAt', '>', DateTime.now().toSQL()!)
      .orderBy('createdAt', 'desc')
      .first()

    if (!challengeRecord) {
      throw new Error('Challenge expired or not found')
    }

    let verification: VerifiedRegistrationResponse
    try {
      verification = await verifyRegistrationResponse({
        response,
        expectedChallenge: challengeRecord.challenge,
        expectedOrigin: this.origin,
        expectedRPID: this.rpID,
      })
    } finally {
      // Always delete the challenge after use
      await challengeRecord.delete()
    }

    if (!verification.verified || !verification.registrationInfo) {
      return { credential: null as any, verified: false }
    }

    const { credential, credentialBackedUp } = verification.registrationInfo

    const passkey = await PasskeyCredential.create({
      userId,
      credentialId: Buffer.from(credential.id).toString('base64url'),
      publicKey: Buffer.from(credential.publicKey).toString('base64url'),
      counter: credential.counter,
      transports: credential.transports
        ? JSON.stringify(credential.transports)
        : null,
      friendlyName,
      backedUp: credentialBackedUp,
    })

    return { credential: passkey, verified: true }
  }

  /**
   * Generate authentication options (public — no user required).
   */
  async generateAuthenticationOptions(email?: string) {
    let allowCredentials: { id: string; type: 'public-key'; transports?: AuthenticatorTransportFuture[] }[] | undefined

    // If email provided, limit to that user's credentials
    if (email) {
      const { default: User } = await import('#models/account/user')
      const user = await User.findBy('email', email)
      if (user) {
        const credentials = await PasskeyCredential.query().where('userId', user.id)
        allowCredentials = credentials.map((cred) => ({
          id: cred.credentialId,
          type: 'public-key' as const,
          transports: cred.transports
            ? (JSON.parse(cred.transports) as AuthenticatorTransportFuture[])
            : undefined,
        }))
      }
    }

    const options = await generateAuthenticationOptions({
      rpID: this.rpID,
      allowCredentials,
      userVerification: 'preferred',
      timeout: this.timeout,
    })

    // Store challenge in DB (5 minute expiry for slow biometric prompts)
    await PasskeyChallenge.create({
      userId: null,
      challenge: options.challenge,
      type: 'authentication',
      expiresAt: DateTime.now().plus({ minutes: 5 }),
    })

    return options
  }

  /**
   * Verify authentication response and return the credential + user.
   */
  async verifyAuthentication(
    response: AuthenticationResponseJSON
  ): Promise<{
    verified: boolean
    credential: PasskeyCredential | null
    error?: string
  }> {
    const credentialIdB64 = response.id

    // Try multiple encoding variants to find the credential
    const candidates = [credentialIdB64]
    if (response.rawId && response.rawId !== credentialIdB64) {
      candidates.push(response.rawId)
    }
    // Also try re-encoding: decode base64url then re-encode (normalizes padding)
    try {
      const decoded = Buffer.from(credentialIdB64, 'base64url')
      const reencoded = decoded.toString('base64url')
      if (reencoded !== credentialIdB64) candidates.push(reencoded)
      // Also try standard base64
      const b64std = decoded.toString('base64')
      if (b64std !== credentialIdB64) candidates.push(b64std)
    } catch {}

    let credential: PasskeyCredential | null = null
    for (const candidateId of candidates) {
      credential = await PasskeyCredential.query()
        .where('credentialId', candidateId)
        .preload('user')
        .first()
      if (credential) break
    }

    if (!credential) {
      return { verified: false, credential: null, error: 'credential_not_found' }
    }

    // Find a valid challenge — get ALL recent authentication challenges
    // and try each one (handles race conditions with multiple tabs)
    const challengeRecords = await PasskeyChallenge.query()
      .where('type', 'authentication')
      .where('expiresAt', '>', DateTime.now().toSQL()!)
      .orderBy('createdAt', 'desc')
      .limit(5)

    if (challengeRecords.length === 0) {
      return { verified: false, credential: null, error: 'challenge_expired' }
    }

    // Try each challenge until one works
    let challengeRecord: PasskeyChallenge | null = null

    let verification: VerifiedAuthenticationResponse | null = null
    let lastError: string | null = null

    for (const challenge of challengeRecords) {
      try {
        verification = await verifyAuthenticationResponse({
          response,
          expectedChallenge: challenge.challenge,
          expectedOrigin: this.origin,
          expectedRPID: this.rpID,
          credential: {
            id: credential.credentialId,
            publicKey: Buffer.from(credential.publicKey, 'base64url'),
            counter: credential.counter,
            transports: credential.transports
              ? (JSON.parse(credential.transports) as AuthenticatorTransportFuture[])
              : undefined,
          },
        })
        challengeRecord = challenge
        break // Found the right challenge
      } catch (err: any) {
        lastError = err?.message || String(err)
        // Wrong challenge, try next one
        continue
      }
    }

    // Clean up the used challenge (and any others that were tried)
    for (const ch of challengeRecords) {
      await ch.delete().catch(() => {})
    }

    if (!verification || !verification.verified) {
      return { verified: false, credential: null, error: lastError || 'verification_failed' }
    }

    // Update counter (clone detection)
    credential.counter = verification.authenticationInfo.newCounter
    credential.lastUsedAt = DateTime.now()
    await credential.save()

    return { verified: true, credential }
  }

  /**
   * Derive a passkey key from credential ID using HKDF.
   * Used to encrypt/decrypt the KEK for passkey-based login.
   */
  derivePasskeyKey(credentialId: string): Buffer {
    const ikm = Buffer.from(credentialId, 'base64url')
    return Buffer.from(
      crypto.hkdfSync('sha256', ikm, Buffer.alloc(0), 'factorpro-passkey-kek', 32)
    )
  }

  /**
   * Encrypt KEK with passkey-derived key.
   */
  encryptKekForPasskey(kek: Buffer, credentialId: string): string {
    const passkeyKey = this.derivePasskeyKey(credentialId)
    return zeroAccessCryptoService.encryptDEK(kek, passkeyKey)
  }

  /**
   * Decrypt KEK with passkey-derived key.
   */
  decryptKekFromPasskey(encryptedKek: string, credentialId: string): Buffer {
    const passkeyKey = this.derivePasskeyKey(credentialId)
    return zeroAccessCryptoService.decryptDEK(encryptedKek, passkeyKey)
  }

  /**
   * Cleanup expired challenges.
   */
  async cleanupExpiredChallenges() {
    await PasskeyChallenge.query()
      .where('expiresAt', '<', DateTime.now().toSQL()!)
      .delete()
  }
}

export default new PasskeyService()
