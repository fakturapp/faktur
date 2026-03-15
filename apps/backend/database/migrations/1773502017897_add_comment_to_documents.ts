import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('invoices', (table) => {
      table.text('comment').nullable()
    })
    this.schema.alterTable('quotes', (table) => {
      table.text('comment').nullable()
    })
  }

  async down() {
    this.schema.alterTable('invoices', (table) => {
      table.dropColumn('comment')
    })
    this.schema.alterTable('quotes', (table) => {
      table.dropColumn('comment')
    })
  }
}
