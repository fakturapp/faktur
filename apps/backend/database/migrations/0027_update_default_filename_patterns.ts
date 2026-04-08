import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'invoice_settings'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('quote_filename_pattern', 255).defaultTo('DEV-{annee}-{numero}').alter()
      table.string('invoice_filename_pattern', 255).defaultTo('FAC-{annee}-{numero}').alter()
    })

    this.defer(async (db) => {
      await db
        .from(this.tableName)
        .where('quote_filename_pattern', 'DEV-{numero}')
        .update({ quote_filename_pattern: 'DEV-{annee}-{numero}' })

      await db
        .from(this.tableName)
        .where('invoice_filename_pattern', 'FAC-{numero}')
        .update({ invoice_filename_pattern: 'FAC-{annee}-{numero}' })
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('quote_filename_pattern', 255).defaultTo('DEV-{numero}').alter()
      table.string('invoice_filename_pattern', 255).defaultTo('FAC-{numero}').alter()
    })

    this.defer(async (db) => {
      await db
        .from(this.tableName)
        .where('quote_filename_pattern', 'DEV-{annee}-{numero}')
        .update({ quote_filename_pattern: 'DEV-{numero}' })

      await db
        .from(this.tableName)
        .where('invoice_filename_pattern', 'FAC-{annee}-{numero}')
        .update({ invoice_filename_pattern: 'FAC-{numero}' })
    })
  }
}
