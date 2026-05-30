import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('teams', (table) => {
      table.timestamp('subscription_started_at').nullable()
    })
  }

  async down() {
    this.schema.alterTable('teams', (table) => {
      table.dropColumn('subscription_started_at')
    })
  }
}
