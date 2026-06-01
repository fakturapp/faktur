import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('teams', (table) => {
      table.string('pending_plan', 16).nullable()
      table.string('pending_plan_period', 16).nullable()
    })
  }

  async down() {
    this.schema.alterTable('teams', (table) => {
      table.dropColumn('pending_plan')
      table.dropColumn('pending_plan_period')
    })
  }
}
