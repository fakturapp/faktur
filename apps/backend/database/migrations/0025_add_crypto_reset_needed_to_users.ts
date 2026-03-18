import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('users', (table) => {
      table.boolean('crypto_reset_needed').notNullable().defaultTo(false)
      table.text('old_salt_kdf').nullable()
    })
  }

  async down() {
    this.schema.alterTable('users', (table) => {
      table.dropColumn('crypto_reset_needed')
      table.dropColumn('old_salt_kdf')
    })
  }
}
