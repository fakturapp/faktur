import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('invoices', (table) => {
      table
        .string('vat_exempt_reason', 20)
        .notNullable()
        .defaultTo('none')
    })

    this.schema.alterTable('quotes', (table) => {
      table
        .string('vat_exempt_reason', 20)
        .notNullable()
        .defaultTo('none')
    })
  }

  async down() {
    this.schema.alterTable('invoices', (table) => {
      table.dropColumn('vat_exempt_reason')
    })

    this.schema.alterTable('quotes', (table) => {
      table.dropColumn('vat_exempt_reason')
    })
  }
}
