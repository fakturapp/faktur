import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('users', (table) => {
      table.text('salt_kdf').nullable()
      table.integer('key_version').defaultTo(1)
    })

    this.schema.alterTable('team_members', (table) => {
      table.text('encrypted_team_dek').nullable()
      table.integer('dek_version').defaultTo(1)
      table.text('encrypted_invite_dek').nullable()
    })
  }

  async down() {
    this.schema.alterTable('users', (table) => {
      table.dropColumn('salt_kdf')
      table.dropColumn('key_version')
    })

    this.schema.alterTable('team_members', (table) => {
      table.dropColumn('encrypted_team_dek')
      table.dropColumn('dek_version')
      table.dropColumn('encrypted_invite_dek')
    })
  }
}
