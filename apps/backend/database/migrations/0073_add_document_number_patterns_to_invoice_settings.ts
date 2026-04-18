import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'invoice_settings'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('quote_number_pattern', 255).nullable()
      table.string('invoice_number_pattern', 255).nullable()
    })

    this.defer(async (db) => {
      await db.from(this.tableName).update({
        quote_number_pattern: db.raw('quote_filename_pattern'),
        invoice_number_pattern: db.raw('invoice_filename_pattern'),
      })

      await db.raw(
        `alter table ${this.tableName}
         alter column quote_number_pattern set default 'DEV-{numero}',
         alter column invoice_number_pattern set default 'FAC-{numero}'`
      )
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('quote_number_pattern')
      table.dropColumn('invoice_number_pattern')
    })
  }
}
