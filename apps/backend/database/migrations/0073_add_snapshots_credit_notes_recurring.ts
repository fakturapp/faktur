import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('credit_notes', (table) => {
      table.text('client_snapshot').nullable()
      table.text('company_snapshot').nullable()
    })

    this.schema.alterTable('recurring_invoices', (table) => {
      table.text('client_snapshot').nullable()
      table.text('company_snapshot').nullable()
    })
  }

  async down() {
    this.schema.alterTable('credit_notes', (table) => {
      table.dropColumn('client_snapshot')
      table.dropColumn('company_snapshot')
    })

    this.schema.alterTable('recurring_invoices', (table) => {
      table.dropColumn('client_snapshot')
      table.dropColumn('company_snapshot')
    })
  }
}
