import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('invoices', (table) => {
      table.text('company_snapshot').nullable()
    })

    this.schema.alterTable('quotes', (table) => {
      table.text('company_snapshot').nullable()
    })
  }

  async down() {
    this.schema.alterTable('invoices', (table) => {
      table.dropColumn('company_snapshot')
    })

    this.schema.alterTable('quotes', (table) => {
      table.dropColumn('company_snapshot')
    })
  }
}
