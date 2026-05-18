import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'api_credit_usage'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.timestamp('session_started_at', { useTz: true }).nullable()
      table.integer('session_count').notNullable().defaultTo(0)
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('session_started_at')
      table.dropColumn('session_count')
    })
  }
}
