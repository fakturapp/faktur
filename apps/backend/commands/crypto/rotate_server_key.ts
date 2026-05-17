import { BaseCommand, flags } from '@adonisjs/core/ace'
import { CommandOptions } from '@adonisjs/core/types/ace'
import crypto, { type CipherGCM, type DecipherGCM } from 'node:crypto'
import Team from '#models/team/team'
import TeamMember from '#models/team/team_member'
import encryptionService from '#services/encryption/encryption_service'

const ALGO = 'aes-256-gcm'
const IV_LEN = 16
const KEY_LEN = 32

function deriveKey(raw: string): Buffer {
  return crypto.scryptSync(raw, 'salt', KEY_LEN)
}

function decryptWith(raw: string, ciphertext: string): string {
  const [ivHex, tagHex, encrypted] = ciphertext.split(':')
  if (!ivHex || !tagHex || !encrypted) throw new Error('Invalid ciphertext format')
  const key = deriveKey(raw)
  const decipher = crypto.createDecipheriv(ALGO, key, Buffer.from(ivHex, 'hex')) as DecipherGCM
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'))
  let out = decipher.update(encrypted, 'hex', 'utf8')
  out += decipher.final('utf8')
  return out
}

function encryptWith(raw: string, plaintext: string): string {
  const key = deriveKey(raw)
  const iv = crypto.randomBytes(IV_LEN)
  const cipher = crypto.createCipheriv(ALGO, key, iv) as CipherGCM
  let out = cipher.update(plaintext, 'utf8', 'hex')
  out += cipher.final('hex')
  const tag = cipher.getAuthTag()
  return `${iv.toString('hex')}:${tag.toString('hex')}:${out}`
}

export default class CryptoRotateServerKey extends BaseCommand {
  static commandName = 'crypto:rotate-server-key'
  static description =
    'Rotate the server master key (ENCRYPTION_KEY). Provide the OLD key with --old; the new key must already be set in .env.'

  static options: CommandOptions = {
    startApp: true,
  }

  @flags.string({ description: 'Previous ENCRYPTION_KEY value (raw, as it was in .env)' })
  declare old: string

  @flags.boolean({ description: 'Dry-run — do not write changes' })
  declare dry: boolean

  async run() {
    if (!this.old) {
      this.logger.error('Missing --old=<previous ENCRYPTION_KEY>')
      this.exitCode = 1
      return
    }

    const probe = encryptWith(this.old, 'probe')
    try {
      decryptWith(this.old, probe)
    } catch {
      this.logger.error('Provided --old key does not validate. Aborting.')
      this.exitCode = 1
      return
    }

    const standardTeams = await Team.query().where('encryptionMode', 'standard')
    this.logger.info(`Found ${standardTeams.length} standard-mode team(s). Rewrapping team DEKs...`)

    let rotated = 0
    let skipped = 0

    for (const team of standardTeams) {
      const members = await TeamMember.query().where('teamId', team.id)
      const wraps = new Map<string, string>()

      for (const m of members) {
        if (!m.encryptedTeamDek) {
          skipped++
          continue
        }
        try {
          const dekHex = decryptWith(this.old, m.encryptedTeamDek)
          const fresh = encryptionService.encrypt(dekHex)
          wraps.set(m.id, fresh)
        } catch (err) {
          this.logger.warning(`Team ${team.id} member ${m.id}: cannot decrypt with old key`)
          skipped++
        }
      }

      if (!this.dry) {
        for (const m of members) {
          const next = wraps.get(m.id)
          if (next) {
            m.encryptedTeamDek = next
            await m.save()
            rotated++
          }
        }
      } else {
        rotated += wraps.size
      }
    }

    this.logger.success(
      `${this.dry ? '[DRY-RUN] ' : ''}Rotated ${rotated} team DEK wraps, skipped ${skipped}.`
    )
    this.logger.warning(
      'Reminder: other server-encrypted fields (2FA secrets, recovery codes, recovery keys, layer-2 KEK wraps) must be rotated separately. This command only covers team DEK wraps.'
    )
  }
}
