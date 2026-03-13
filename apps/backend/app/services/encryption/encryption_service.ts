import crypto, { type CipherGCM, type DecipherGCM } from 'node:crypto'
import env from '#start/env'

class EncryptionService {
  private algorithm = 'aes-256-gcm' as const
  private keyLength = 32
  private ivLength = 16

  private getKey(): Buffer {
    const keyString = env.get('ENCRYPTION_KEY') || env.get('APP_KEY')
    return crypto.scryptSync(keyString, 'salt', this.keyLength)
  }

  encrypt(plaintext: string): string {
    const key = this.getKey()
    const iv = crypto.randomBytes(this.ivLength)
    const cipher = crypto.createCipheriv(this.algorithm, key, iv) as CipherGCM

    let encrypted = cipher.update(plaintext, 'utf8', 'hex')
    encrypted += cipher.final('hex')

    const tag = cipher.getAuthTag()
    return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`
  }

  decrypt(ciphertext: string): string {
    const [ivHex, tagHex, encrypted] = ciphertext.split(':')

    if (!ivHex || !tagHex || !encrypted) {
      throw new Error('Invalid ciphertext format')
    }

    const key = this.getKey()
    const iv = Buffer.from(ivHex, 'hex')
    const tag = Buffer.from(tagHex, 'hex')

    const decipher = crypto.createDecipheriv(this.algorithm, key, iv) as DecipherGCM
    decipher.setAuthTag(tag)

    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
  }

  hash(value: string): string {
    return crypto.createHash('sha256').update(value).digest('hex')
  }

  generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex')
  }

  timingSafeEqual(a: string, b: string): boolean {
    const bufA = Buffer.from(a)
    const bufB = Buffer.from(b)

    if (bufA.length !== bufB.length) {
      return false
    }

    return crypto.timingSafeEqual(bufA, bufB)
  }
}

export default new EncryptionService()
