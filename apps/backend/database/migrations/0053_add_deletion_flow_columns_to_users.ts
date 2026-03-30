import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('deletion_token', 255).nullable()
      table.integer('deletion_step').defaultTo(0)
      table.string('deletion_code', 6).nullable()
      table.timestamp('deletion_code_expires_at').nullable()
      table.timestamp('deletion_started_at').nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('deletion_token')
      table.dropColumn('deletion_step')
      table.dropColumn('deletion_code')
      table.dropColumn('deletion_code_expires_at')
      table.dropColumn('deletion_started_at')
    })
  }
}
