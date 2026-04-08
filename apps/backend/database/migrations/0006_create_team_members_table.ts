import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'team_members'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.uuid('team_id').notNullable().references('id').inTable('teams').onDelete('CASCADE')
      table.uuid('user_id').nullable().references('id').inTable('users').onDelete('CASCADE')
      table.string('role').notNullable().defaultTo('member')
      table.string('status').notNullable().defaultTo('active')
      table.timestamp('invited_at').nullable()
      table.timestamp('joined_at').nullable()
      table.string('invitation_token').nullable().unique()
      table.string('invited_email').nullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })

    this.schema.raw(`
      CREATE UNIQUE INDEX team_members_team_user_unique
      ON team_members (team_id, user_id)
      WHERE user_id IS NOT NULL
    `)
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
