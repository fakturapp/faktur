import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'oauth_webhook_deliveries'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))

      table
        .uuid('oauth_app_id')
        .notNullable()
        .references('id')
        .inTable('oauth_apps')
        .onDelete('CASCADE')

      // Event identity
      table.string('event_type', 100).notNullable()
      table.string('event_id', 64).notNullable().unique()

      // Target
      table.string('url', 500).notNullable()

      // Signed payload (app-level encrypted at rest, HMAC on the wire)
      table.text('encrypted_payload').notNullable()

      // Delivery status
      table.string('status', 20).notNullable().defaultTo('pending')
      table.integer('attempt_count').notNullable().defaultTo(0)
      table.integer('last_status_code').nullable()
      table.text('last_error').nullable()
      table.timestamp('delivered_at').nullable()
      table.timestamp('next_attempt_at').nullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index(['oauth_app_id'], 'idx_oauth_webhooks_app_id')
      table.index(['status', 'next_attempt_at'], 'idx_oauth_webhooks_pending')
      table.index(['event_type'], 'idx_oauth_webhooks_event_type')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
