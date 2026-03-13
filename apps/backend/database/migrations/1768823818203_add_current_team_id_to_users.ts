import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table
        .uuid('current_team_id')
        .nullable()
        .references('id')
        .inTable('teams')
        .onDelete('SET NULL')
      table.boolean('onboarding_completed').notNullable().defaultTo(false)
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('current_team_id')
      table.dropColumn('onboarding_completed')
    })
  }
}
