import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    // Update team_members: add invitation fields
    this.schema.alterTable('team_members', (table) => {
      table.string('invitation_token').nullable().unique()
      table.string('invited_email').nullable()
    })

    // Update users: add security verification code fields
    this.schema.alterTable('users', (table) => {
      table.string('security_code').nullable()
      table.timestamp('security_code_expires_at').nullable()
    })

    // Migrate existing 'owner' roles to 'super_admin'
    this.defer(async (db) => {
      await db.from('team_members').where('role', 'owner').update({ role: 'super_admin' })
    })
  }

  async down() {
    this.schema.alterTable('team_members', (table) => {
      table.dropColumn('invitation_token')
      table.dropColumn('invited_email')
    })

    this.schema.alterTable('users', (table) => {
      table.dropColumn('security_code')
      table.dropColumn('security_code_expires_at')
    })

    this.defer(async (db) => {
      await db.from('team_members').where('role', 'super_admin').update({ role: 'owner' })
    })
  }
}
