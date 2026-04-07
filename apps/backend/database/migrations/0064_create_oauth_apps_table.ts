import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'oauth_apps'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))

      // Identity
      table.string('name', 100).notNullable()
      table.text('description').nullable()
      table.string('icon_url', 500).nullable()
      table.string('website_url', 500).nullable()

      // Public identifier (32-char hex, safe to expose in URLs)
      table.string('client_id', 64).notNullable().unique()

      // Secret — stored as SHA-256 hash, raw value is shown only once at
      // creation and embedded in the desktop app's .env at build time.
      table.string('client_secret_hash', 128).notNullable()

      // Allowed callback URLs (desktop apps use http://127.0.0.1:<random>/callback)
      table.specificType('redirect_uris', 'text[]').notNullable()

      // Granted scopes (profile, invoices:read, invoices:write, vault:unlock, ...)
      table.specificType('scopes', 'text[]').notNullable()

      // Webhook — optional. Secret encrypted with app-level EncryptionService.
      table.string('webhook_url', 500).nullable()
      table.text('encrypted_webhook_secret').nullable()
      table.specificType('webhook_events', 'text[]').nullable()

      // Kind: 'desktop' | 'web' | 'cli' — helps rendering in the admin panel
      table.string('kind', 20).notNullable().defaultTo('desktop')

      // Admin ownership
      table
        .uuid('created_by_user_id')
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')

      // Lifecycle
      table.boolean('is_active').notNullable().defaultTo(true)
      table.boolean('is_first_party').notNullable().defaultTo(false)

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index(['client_id'], 'idx_oauth_apps_client_id')
      table.index(['created_by_user_id'], 'idx_oauth_apps_created_by')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
