import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('team_members', (table) => {
      table.text('encrypted_recovery_key').nullable()
    })
  }

  async down() {
    this.schema.alterTable('team_members', (table) => {
      table.dropColumn('encrypted_recovery_key')
    })
  }
}
