import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('invoices', (table) => {
      table.text('client_snapshot').nullable()
    })

    this.schema.alterTable('quotes', (table) => {
      table.text('client_snapshot').nullable()
    })

    this.defer(async (db) => {
      await db
        .from('invoice_settings')
        .whereIn('invoice_filename_pattern', ['FAC-{numero}', 'FAC-{annee}-{numero}'])
        .update({ invoice_filename_pattern: 'FAK-{annee}-{numero}' })
    })
  }

  async down() {
    this.schema.alterTable('invoices', (table) => {
      table.dropColumn('client_snapshot')
    })

    this.schema.alterTable('quotes', (table) => {
      table.dropColumn('client_snapshot')
    })
  }
}
