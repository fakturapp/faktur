import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('email_logs', (table) => {
      table.text('from_email').alter()
      table.text('to_email').alter()
      table.text('subject').alter()
    })

    this.schema.alterTable('bank_accounts', (table) => {
      table.dropColumn('is_encrypted')
    })
  }

  async down() {
    this.schema.alterTable('email_logs', (table) => {
      table.string('from_email', 255).notNullable().alter()
      table.string('to_email', 255).notNullable().alter()
      table.string('subject', 500).notNullable().alter()
    })

    this.schema.alterTable('bank_accounts', (table) => {
      table.boolean('is_encrypted').notNullable().defaultTo(false)
    })
  }
}
