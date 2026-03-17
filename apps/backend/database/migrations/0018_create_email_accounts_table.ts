import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'email_accounts'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table
        .uuid('team_id')
        .notNullable()
        .references('id')
        .inTable('teams')
        .onDelete('CASCADE')
      table.string('provider', 20).notNullable().defaultTo('gmail')
      table.string('email', 255).notNullable()
      table.string('display_name', 255).nullable()
      table.text('access_token').nullable()
      table.text('refresh_token').nullable()
      table.timestamp('token_expires_at').nullable()
      table.string('smtp_host', 255).nullable()
      table.integer('smtp_port').nullable()
      table.string('smtp_username', 255).nullable()
      table.text('smtp_password').nullable()
      table.boolean('is_default').notNullable().defaultTo(false)
      table.boolean('is_active').notNullable().defaultTo(true)
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.unique(['team_id', 'email', 'provider'])
      table.index(['team_id'], 'idx_email_accounts_team_id')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
