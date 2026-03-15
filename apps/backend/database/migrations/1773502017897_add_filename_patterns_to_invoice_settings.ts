import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'invoice_settings'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('quote_filename_pattern', 255).defaultTo('DEV-{numero}')
      table.string('invoice_filename_pattern', 255).defaultTo('FAC-{numero}')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('quote_filename_pattern')
      table.dropColumn('invoice_filename_pattern')
    })
  }
}
