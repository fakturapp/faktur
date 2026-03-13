import { DateTime } from 'luxon'
import EncryptionService from '#services/encryption/encryption_service'
import securityConfig from '#config/security'

interface TokenPayload {
  token: string
  hash: string
  expiresAt: DateTime
}

class TokenService {
  generatePasswordResetToken(): TokenPayload {
    const token = EncryptionService.generateSecureToken(32)
    const hash = EncryptionService.hash(token)
    const expiresAt = DateTime.now().plus({ seconds: securityConfig.tokens.passwordResetExpiry })

    return { token, hash, expiresAt }
  }

  generateEmailVerificationToken(): TokenPayload {
    const token = EncryptionService.generateSecureToken(32)
    const hash = EncryptionService.hash(token)
    const expiresAt = DateTime.now().plus({
      seconds: securityConfig.tokens.emailVerificationExpiry,
    })

    return { token, hash, expiresAt }
  }

  verifyToken(providedToken: string, storedHash: string): boolean {
    const providedHash = EncryptionService.hash(providedToken)
    return EncryptionService.timingSafeEqual(providedHash, storedHash)
  }

  hashToken(token: string): string {
    return EncryptionService.hash(token)
  }
}

export default new TokenService()
