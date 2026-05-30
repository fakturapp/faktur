import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('teams', (table) => {
      table.string('plan', 16).notNullable().defaultTo('free')
    })

    this.schema.raw(`
      ALTER TABLE teams
      ADD CONSTRAINT teams_plan_check
      CHECK (plan IN ('free', 'pro', 'team'))
    `)
  }

  async down() {
    this.schema.raw(`ALTER TABLE teams DROP CONSTRAINT IF EXISTS teams_plan_check`)
    this.schema.alterTable('teams', (table) => {
      table.dropColumn('plan')
    })
  }
}
