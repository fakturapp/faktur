import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'oauth_codes'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))

      table.string('code_hash', 128).notNullable().unique()

      table
        .uuid('oauth_app_id')
        .notNullable()
        .references('id')
        .inTable('oauth_apps')
        .onDelete('CASCADE')
      table
        .uuid('user_id')
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')

      table.text('redirect_uri').notNullable()

      table.specificType('scopes', 'text[]').notNullable()

      table.string('code_challenge', 128).nullable()
      table.string('code_challenge_method', 10).nullable()

      table.timestamp('expires_at').notNullable()
      table.timestamp('used_at').nullable()

      table.string('client_ip', 45).nullable()
      table.text('user_agent').nullable()

      table.timestamp('created_at').notNullable()

      table.index(['code_hash'], 'idx_oauth_codes_code_hash')
      table.index(['expires_at'], 'idx_oauth_codes_expires_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
