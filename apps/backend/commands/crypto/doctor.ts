import { BaseCommand, flags } from '@adonisjs/core/ace'
import { CommandOptions } from '@adonisjs/core/types/ace'
import Team from '#models/team/team'
import TeamMember from '#models/team/team_member'
import teamEncryptionService from '#services/crypto/team_encryption_service'

export default class CryptoDoctor extends BaseCommand {
  static commandName = 'crypto:doctor'
  static description =
    'Inspect every team and verify that DEK wraps match the declared encryption mode.'

  static options: CommandOptions = {
    startApp: true,
  }

  @flags.string({ description: 'Limit to a single team UUID' })
  declare team: string

  async run() {
    const query = Team.query()
    if (this.team) query.where('id', this.team)
    const teams = await query

    let ok = 0
    let missing = 0
    let mismatch = 0

    for (const team of teams) {
      const members = await TeamMember.query()
        .where('teamId', team.id)
        .whereIn('status', ['active', 'pending'])

      let teamOk = true
      let dekResolved: Buffer | null = null

      for (const m of members) {
        if (!m.encryptedTeamDek) {
          missing++
          teamOk = false
          this.logger.warning(`team=${team.id} member=${m.id} has no encrypted_team_dek`)
          continue
        }

        if (team.encryptionMode === 'standard') {
          const dek = teamEncryptionService.unwrapDekForMembership(team, m)
          if (!dek || dek.length !== 32) {
            mismatch++
            teamOk = false
            this.logger.error(
              `team=${team.id} mode=standard member=${m.id} DEK decryption failed or wrong length`
            )
          } else {
            dekResolved = dek
          }
        } else {
          const parts = m.encryptedTeamDek.split(':')
          if (parts.length !== 3) {
            mismatch++
            teamOk = false
            this.logger.error(
              `team=${team.id} mode=private member=${m.id} encrypted_team_dek wrap shape invalid`
            )
          }
        }
      }

      if (teamOk) {
        ok++
        if (team.encryptionMode === 'standard' && dekResolved) {
          this.logger.info(
            `team=${team.id} mode=standard ✓ DEK resolves (${members.length} members)`
          )
        } else {
          this.logger.info(`team=${team.id} mode=${team.encryptionMode} ✓ wraps look valid`)
        }
      }
    }

    this.logger.info(`\nSummary: ok=${ok} missing=${missing} mismatch=${mismatch}`)
    if (missing > 0 || mismatch > 0) {
      this.exitCode = 1
    }
  }
}
