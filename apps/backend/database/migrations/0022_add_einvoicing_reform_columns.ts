import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('invoices', (table) => {
      table.string('operation_category').nullable()
    })

    this.schema.alterTable('invoice_settings', (table) => {
      table.string('default_operation_category').nullable()
    })
  }

  async down() {
    this.schema.alterTable('invoices', (table) => {
      table.dropColumn('operation_category')
    })

    this.schema.alterTable('invoice_settings', (table) => {
      table.dropColumn('default_operation_category')
    })
  }
}
