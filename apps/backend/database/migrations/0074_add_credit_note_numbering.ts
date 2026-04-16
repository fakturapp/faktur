import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('invoice_settings', (table) => {
      table.string('credit_note_filename_pattern').notNullable().defaultTo('AV-{annee}-{numero}')
      table.string('next_credit_note_number').nullable()
    })
  }

  async down() {
    this.schema.alterTable('invoice_settings', (table) => {
      table.dropColumn('credit_note_filename_pattern')
      table.dropColumn('next_credit_note_number')
    })
  }
}
