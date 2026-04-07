import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'oauth_tokens'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))

      // SHA-256 of the raw access token; the raw token is only handed to the
      // OAuth app on /token response and never stored server-side.
      table.string('access_token_hash', 128).notNullable().unique()
      // Same for the refresh token — separate hash column so a refresh
      // token lookup cannot match on the access token index.
      table.string('refresh_token_hash', 128).notNullable().unique()

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

      // Scopes copied from the authorization code that minted this token
      table.specificType('scopes', 'text[]').notNullable()

      // Device information (surfaced in the user's 'Authorized apps' screen)
      table.string('device_name', 255).nullable()
      table.string('device_platform', 50).nullable()
      table.string('device_os', 100).nullable()
      table.string('last_ip', 45).nullable()
      table.text('last_user_agent').nullable()

      // Lifecycle
      table.timestamp('expires_at').notNullable()
      table.timestamp('refresh_expires_at').notNullable()
      table.timestamp('last_used_at').nullable()
      table.timestamp('revoked_at').nullable()
      table.string('revoked_reason', 100).nullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index(['access_token_hash'], 'idx_oauth_tokens_access_hash')
      table.index(['refresh_token_hash'], 'idx_oauth_tokens_refresh_hash')
      table.index(['user_id'], 'idx_oauth_tokens_user_id')
      table.index(['oauth_app_id'], 'idx_oauth_tokens_app_id')
      table.index(['revoked_at'], 'idx_oauth_tokens_revoked_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
