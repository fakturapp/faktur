import { BaseCommand } from '@adonisjs/core/ace'
import { CommandOptions } from '@adonisjs/core/types/ace'

export default class StorageSeedTest extends BaseCommand {
  static commandName = 'storage:seed-test'
  static description =
    'TEST ONLY: fill a chosen team storage with fake test data to a target percentage, or clean it.'

  static options: CommandOptions = {
    startApp: true,
  }

  async run() {
    const { randomUUID } = await import('node:crypto')
    const { default: User } = await import('#models/account/user')
    const { default: TeamMember } = await import('#models/team/team_member')
    const { default: Team } = await import('#models/team/team')
    const { default: StorageFile } = await import('#models/storage/storage_file')
    const { default: storageService, QUOTA_BYTES } = await import('#services/storage/storage_service')

    const users = await User.query().select('id', 'email').orderBy('email').limit(300)
    if (users.length === 0) {
      this.logger.error('Aucun utilisateur en base.')
      return
    }

    const userId = await this.prompt.choice(
      'Choisir un utilisateur',
      users.map((u) => ({ name: u.id, message: u.email }))
    )

    const memberships = await TeamMember.query()
      .where('userId', userId)
      .where('status', 'active')
      .preload('team')

    if (memberships.length === 0) {
      this.logger.error("Cet utilisateur n'a aucune équipe active.")
      return
    }

    const teamId = await this.prompt.choice(
      'Choisir une équipe',
      memberships.map((m) => ({ name: m.teamId, message: `${m.team.name}  (${m.team.plan})` }))
    )

    const team = await Team.findOrFail(teamId)

    const action = await this.prompt.choice('Action', [
      { name: 'fill', message: 'Remplir avec des données de test' },
      { name: 'clean', message: 'Nettoyer les données de test (seed-test/)' },
    ])

    if (action === 'clean') {
      await StorageFile.query().where('teamId', teamId).where('objectKey', 'like', 'seed-test/%').delete()
      const after = await storageService.usage(teamId, team.plan)
      this.logger.info(`Données de test supprimées. Usage: ${after.percent}% (${after.totalBytes} o).`)
      return
    }

    const targetStr = await this.prompt.choice('Niveau de remplissage cible', [
      { name: '80', message: '80%  (déclenche la bannière rouge)' },
      { name: '95', message: '95%' },
      { name: '100', message: '100%  (plein)' },
      { name: '110', message: '110%  (dépassement, bloque création/upload)' },
    ])
    const target = Number(targetStr)

    const quota = QUOTA_BYTES[team.plan] ?? QUOTA_BYTES.free
    const usage = await storageService.usage(teamId, team.plan)
    const targetBytes = Math.floor((quota * target) / 100)
    let need = targetBytes - usage.totalBytes

    if (need <= 0) {
      this.logger.info(`Déjà à ${usage.percent}% — rien à ajouter pour atteindre ${target}%.`)
      return
    }

    const chunk = Math.max(512 * 1024, Math.ceil(need / 40))
    let created = 0
    while (need > 0) {
      const size = Math.min(chunk, need)
      await StorageFile.create({
        id: randomUUID(),
        teamId,
        category: 'payment_link_pdf',
        objectKey: `seed-test/${teamId}/${randomUUID()}.pdf`,
        publicUrl: `seed-test://${teamId}/${created}`,
        sizeBytes: size,
        contentType: 'application/pdf',
        originalName: `donnees-test-${created + 1}.pdf`,
        isOrphaned: true,
      })
      need -= size
      created++
    }

    const after = await storageService.usage(teamId, team.plan)
    this.logger.info(
      `${created} fichier(s) de test créé(s) sur « ${team.name} ». Usage: ${after.percent}% (${after.totalBytes} / ${quota} o).`
    )
    this.logger.info("Pour nettoyer: relancez la commande et choisissez « Nettoyer », ou utilisez « Optimiser » dans la page Stockage.")
  }
}
