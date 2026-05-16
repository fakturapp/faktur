import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'api_webhook_deliveries'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))

      table
        .uuid('api_key_id')
        .notNullable()
        .references('id')
        .inTable('api_keys')
        .onDelete('CASCADE')

      table.string('event_type', 100).notNullable()
      table.string('event_id', 64).notNullable().unique()

      table.string('url', 500).notNullable()

      table.text('encrypted_payload').notNullable()

      table.string('status', 20).notNullable().defaultTo('pending')
      table.integer('attempt_count').notNullable().defaultTo(0)
      table.integer('last_status_code').nullable()
      table.text('last_error').nullable()

      table.timestamp('delivered_at').nullable()
      table.timestamp('next_attempt_at').nullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index(['api_key_id'], 'idx_api_webhook_deliveries_key_id')
      table.index(['status', 'next_attempt_at'], 'idx_api_webhook_deliveries_pending')
      table.index(['event_type'], 'idx_api_webhook_deliveries_event_type')
    })

    this.schema.raw(`
      ALTER TABLE api_webhook_deliveries
      ADD CONSTRAINT api_webhook_deliveries_status_check
      CHECK (status IN ('pending','in_flight','delivered','failed','failed_permanent'))
    `)
  }

  async down() {
    this.schema.raw(
      `ALTER TABLE api_webhook_deliveries DROP CONSTRAINT IF EXISTS api_webhook_deliveries_status_check`
    )
    this.schema.dropTable(this.tableName)
  }
}
