import { BaseCommand } from '@adonisjs/core/ace'
import { CommandOptions } from '@adonisjs/core/types/ace'

export default class BillingEnforceGrace extends BaseCommand {
  static commandName = 'billing:enforce-grace'
  static description =
    'Downgrade to free every team whose 7-day failed-payment grace period has expired.'

  static options: CommandOptions = {
    startApp: true,
  }

  async run() {
    const { enforceExpiredGrace } = await import('#services/billing/grace_enforcer')
    const downgraded = await enforceExpiredGrace()
    this.logger.info(`Grace enforcement complete: ${downgraded} team(s) downgraded to free.`)
  }
}
