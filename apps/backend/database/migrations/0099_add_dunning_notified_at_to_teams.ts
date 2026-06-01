import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('teams', (table) => {
      table.timestamp('subscription_dunning_notified_at').nullable()
    })
  }

  async down() {
    this.schema.alterTable('teams', (table) => {
      table.dropColumn('subscription_dunning_notified_at')
    })
  }
}
