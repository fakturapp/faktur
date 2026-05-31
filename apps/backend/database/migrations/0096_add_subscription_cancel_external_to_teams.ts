import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('teams', (table) => {
      table.boolean('subscription_cancel_external').notNullable().defaultTo(false)
    })
  }

  async down() {
    this.schema.alterTable('teams', (table) => {
      table.dropColumn('subscription_cancel_external')
    })
  }
}
