import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'api_key_webhooks'

  async up() {
    const [hasMaxRetries, hasTimeoutMs, hasBackoffSeconds, hasCustomHeaders] = await Promise.all([
      this.db.schema.hasColumn(this.tableName, 'delivery_max_retries'),
      this.db.schema.hasColumn(this.tableName, 'delivery_timeout_ms'),
      this.db.schema.hasColumn(this.tableName, 'delivery_backoff_seconds'),
      this.db.schema.hasColumn(this.tableName, 'delivery_custom_headers'),
    ])

    if (hasMaxRetries && hasTimeoutMs && hasBackoffSeconds && hasCustomHeaders) return

    this.schema.alterTable(this.tableName, (table) => {
      if (!hasMaxRetries) table.integer('delivery_max_retries').notNullable().defaultTo(5)
      if (!hasTimeoutMs) table.integer('delivery_timeout_ms').notNullable().defaultTo(10000)
      if (!hasBackoffSeconds)
        table.integer('delivery_backoff_seconds').notNullable().defaultTo(30)
      if (!hasCustomHeaders)
        table.jsonb('delivery_custom_headers').notNullable().defaultTo('{}')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('delivery_max_retries')
      table.dropColumn('delivery_timeout_ms')
      table.dropColumn('delivery_backoff_seconds')
      table.dropColumn('delivery_custom_headers')
    })
  }
}
