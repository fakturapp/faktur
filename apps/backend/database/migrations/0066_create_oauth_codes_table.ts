import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'oauth_codes'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))

      // Short-lived authorization code — SHA-256 hashed, raw only in the
      // one-shot redirect URL the browser forwards to the desktop app.
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

      // Copy of the redirect_uri used for the authorize request —
      // MUST match the one sent to /token when redeeming the code.
      table.text('redirect_uri').notNullable()

      // Scopes approved at authorize time
      table.specificType('scopes', 'text[]').notNullable()

      // PKCE: RFC 7636 code_challenge + method ('S256' only, no plain).
      table.string('code_challenge', 128).nullable()
      table.string('code_challenge_method', 10).nullable()

      // Short expiry (default 10 min)
      table.timestamp('expires_at').notNullable()
      table.timestamp('used_at').nullable()

      // Metadata
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
