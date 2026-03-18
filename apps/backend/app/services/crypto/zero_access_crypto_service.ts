import crypto from 'node:crypto'
import argon2 from 'argon2'

class ZeroAccessCryptoService {
  private algorithm = 'aes-256-gcm' as const
  private ivLength = 16
  private keyLength = 32
  private formatVersion = 'v1'

  /**
   * Derive a KEK (Key Encryption Key) from user password + salt using Argon2id.
   * The KEK is NEVER stored — only derived in memory when the user provides their password.
   */
  async deriveKEK(password: string, salt: Buffer): Promise<Buffer> {
    const kek = await argon2.hash(password, {
      type: argon2.argon2id,
      salt,
      memoryCost: 65536, // 64 MB
      timeCost: 3,
      parallelism: 4,
      hashLength: this.keyLength,
      raw: true,
    })
    return Buffer.from(kek)
  }

  /**
   * Generate a random salt for KDF (32 bytes).
   */
  generateSalt(): Buffer {
    return crypto.randomBytes(this.keyLength)
  }

  /**
   * Generate a random DEK (Data Encryption Key) — 32 bytes.
   */
  generateDEK(): Buffer {
    return crypto.randomBytes(this.keyLength)
  }

  /**
   * Encrypt a DEK with a KEK using AES-256-GCM.
   * Returns hex string: iv:tag:ciphertext
   */
  encryptDEK(dek: Buffer, kek: Buffer): string {
    const iv = crypto.randomBytes(this.ivLength)
    const cipher = crypto.createCipheriv(this.algorithm, kek, iv)

    const encrypted = Buffer.concat([cipher.update(dek), cipher.final()])
    const tag = cipher.getAuthTag()

    return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`
  }

  /**
   * Decrypt a DEK with a KEK.
   * Input format: iv:tag:ciphertext (hex)
   */
  decryptDEK(encryptedDek: string, kek: Buffer): Buffer {
    const [ivHex, tagHex, ciphertextHex] = encryptedDek.split(':')
    if (!ivHex || !tagHex || !ciphertextHex) {
      throw new Error('Invalid encrypted DEK format')
    }

    const iv = Buffer.from(ivHex, 'hex')
    const tag = Buffer.from(tagHex, 'hex')
    const ciphertext = Buffer.from(ciphertextHex, 'hex')

    const decipher = crypto.createDecipheriv(this.algorithm, kek, iv)
    decipher.setAuthTag(tag)

    return Buffer.concat([decipher.update(ciphertext), decipher.final()])
  }

  /**
   * Encrypt a plaintext field value with a DEK.
   * Returns: "v1:iv:tag:ciphertext" (all hex)
   */
  encryptField(value: string, dek: Buffer): string {
    const iv = crypto.randomBytes(this.ivLength)
    const cipher = crypto.createCipheriv(this.algorithm, dek, iv)

    let encrypted = cipher.update(value, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    const tag = cipher.getAuthTag()

    return `${this.formatVersion}:${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`
  }

  /**
   * Decrypt a field value with a DEK.
   * Input format: "v1:iv:tag:ciphertext"
   */
  decryptField(ciphertext: string, dek: Buffer): string {
    const parts = ciphertext.split(':')
    if (parts.length !== 4 || parts[0] !== this.formatVersion) {
      throw new Error('Invalid encrypted field format')
    }

    const [, ivHex, tagHex, encryptedHex] = parts
    const iv = Buffer.from(ivHex!, 'hex')
    const tag = Buffer.from(tagHex!, 'hex')

    const decipher = crypto.createDecipheriv(this.algorithm, dek, iv)
    decipher.setAuthTag(tag)

    let decrypted = decipher.update(encryptedHex!, 'hex', 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
  }

  /**
   * Check if a string value is an encrypted field (starts with "v1:").
   */
  isEncryptedField(value: string): boolean {
    return value.startsWith(`${this.formatVersion}:`)
  }

  /**
   * Derive an invite key from an invite token using HKDF.
   * Used to encrypt the team DEK in invitation flow.
   */
  deriveInviteKey(inviteToken: string): Buffer {
    const ikm = Buffer.from(inviteToken, 'hex')
    return crypto.hkdfSync('sha256', ikm, Buffer.alloc(0), 'factorpro-invite-key', this.keyLength)
  }
}

export default new ZeroAccessCryptoService()
