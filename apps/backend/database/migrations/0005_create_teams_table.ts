import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'teams'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.string('name').notNullable()
      table.string('icon_url', 500).nullable()
      table
        .uuid('owner_id')
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })

    // Add current_team_id FK on users now that teams table exists
    this.schema.alterTable('users', (table) => {
      table
        .uuid('current_team_id')
        .nullable()
        .references('id')
        .inTable('teams')
        .onDelete('SET NULL')
    })
  }

  async down() {
    this.schema.alterTable('users', (table) => {
      table.dropColumn('current_team_id')
    })
    this.schema.dropTable(this.tableName)
  }
}