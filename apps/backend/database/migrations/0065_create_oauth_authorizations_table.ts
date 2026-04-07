import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'oauth_authorizations'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))

      table
        .uuid('user_id')
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
      table
        .uuid('oauth_app_id')
        .notNullable()
        .references('id')
        .inTable('oauth_apps')
        .onDelete('CASCADE')

      // Scopes the user has granted to this app
      table.specificType('scopes', 'text[]').notNullable()

      // First approval
      table.timestamp('first_authorized_at').notNullable()
      // Last time the user went through the consent screen
      table.timestamp('last_authorized_at').notNullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.unique(['user_id', 'oauth_app_id'], 'uq_oauth_auth_user_app')
      table.index(['user_id'], 'idx_oauth_auth_user_id')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
