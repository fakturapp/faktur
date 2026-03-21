import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'invoice_settings'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('ai_key_mode', 10).notNullable().defaultTo('server')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('ai_key_mode')
    })
  }
}
