import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'client_contacts'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table
        .uuid('client_id')
        .notNullable()
        .references('id')
        .inTable('clients')
        .onDelete('CASCADE')
      table
        .uuid('team_id')
        .notNullable()
        .references('id')
        .inTable('teams')
        .onDelete('CASCADE')
      table.string('first_name', 100).nullable()
      table.string('last_name', 100).nullable()
      table.string('email', 255).nullable()
      table.string('phone', 50).nullable()
      table.string('role', 100).nullable()
      table.text('notes').nullable()
      table.boolean('is_primary').notNullable().defaultTo(false)
      table.boolean('include_in_emails').notNullable().defaultTo(false)
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index(['client_id'])
      table.index(['team_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
