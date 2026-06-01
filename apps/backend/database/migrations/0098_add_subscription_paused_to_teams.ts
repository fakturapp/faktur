import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('teams', (table) => {
      table.boolean('subscription_paused').notNullable().defaultTo(false)
    })
  }

  async down() {
    this.schema.alterTable('teams', (table) => {
      table.dropColumn('subscription_paused')
    })
  }
}
