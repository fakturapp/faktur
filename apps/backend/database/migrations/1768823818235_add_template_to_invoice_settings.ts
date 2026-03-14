import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'invoice_settings'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('template', 30).notNullable().defaultTo('classique')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('template')
    })
  }
}
