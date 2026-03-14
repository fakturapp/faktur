import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'invoice_settings'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.boolean('e_invoicing_enabled').defaultTo(false)
      table.string('pdp_provider', 50).nullable()
      table.text('pdp_api_key').nullable()
      table.boolean('pdp_sandbox').defaultTo(true)
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('e_invoicing_enabled')
      table.dropColumn('pdp_provider')
      table.dropColumn('pdp_api_key')
      table.dropColumn('pdp_sandbox')
    })
  }
}
