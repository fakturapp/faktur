import * as speakeasy from 'speakeasy'
import * as QRCode from 'qrcode'
import crypto from 'node:crypto'
import EncryptionService from '#services/encryption/encryption_service'
import securityConfig from '#config/security'

interface TwoFactorSecret {
  ascii: string
  hex: string
  base32: string
  otpauth_url: string
}

interface VerifyResult {
  valid: boolean
  delta?: number
}

class TwoFactorService {
  generateSecret(email: string): TwoFactorSecret {
    const secret = speakeasy.generateSecret({
      name: `${securityConfig.twoFactor.issuer}:${email}`,
      issuer: securityConfig.twoFactor.issuer,
      length: 20,
    })

    return {
      ascii: secret.ascii,
      hex: secret.hex,
      base32: secret.base32,
      otpauth_url: secret.otpauth_url!,
    }
  }

  async generateQRCode(otpauthUrl: string): Promise<string> {
    return QRCode.toDataURL(otpauthUrl)
  }

  encryptSecret(secret: string): string {
    return EncryptionService.encrypt(secret)
  }

  decryptSecret(encryptedSecret: string): string {
    return EncryptionService.decrypt(encryptedSecret)
  }

  verifyToken(secret: string, token: string): VerifyResult {
    const verified = speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: token,
      window: securityConfig.twoFactor.window,
    })

    return { valid: verified }
  }

  generateRecoveryCodes(): string[] {
    const codes: string[] = []
    const { recoveryCodesCount, recoveryCodeLength } = securityConfig.twoFactor

    for (let i = 0; i < recoveryCodesCount; i++) {
      const code = crypto
        .randomBytes(Math.ceil(recoveryCodeLength / 2))
        .toString('hex')
        .slice(0, recoveryCodeLength)
        .toUpperCase()

      const formattedCode = `${code.slice(0, 5)}-${code.slice(5)}`
      codes.push(formattedCode)
    }

    return codes
  }

  encryptRecoveryCodes(codes: string[]): string {
    return EncryptionService.encrypt(JSON.stringify(codes))
  }

  decryptRecoveryCodes(encryptedCodes: string): string[] {
    const decrypted = EncryptionService.decrypt(encryptedCodes)
    return JSON.parse(decrypted)
  }

  verifyRecoveryCode(
    code: string,
    encryptedCodes: string
  ): { valid: boolean; remainingCodes: string[] } {
    const codes = this.decryptRecoveryCodes(encryptedCodes)
    const normalizedInput = code.replace('-', '').toLowerCase()

    const index = codes.findIndex((c) => {
      const normalizedCode = c.replace('-', '').toLowerCase()
      return EncryptionService.timingSafeEqual(normalizedInput, normalizedCode)
    })

    if (index === -1) {
      return { valid: false, remainingCodes: codes }
    }

    codes.splice(index, 1)
    return { valid: true, remainingCodes: codes }
  }
}

export default new TwoFactorService()
