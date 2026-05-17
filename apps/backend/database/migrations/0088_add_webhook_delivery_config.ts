import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'api_key_webhooks'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('delivery_max_retries').notNullable().defaultTo(5)
      table.integer('delivery_timeout_ms').notNullable().defaultTo(10000)
      table.integer('delivery_backoff_seconds').notNullable().defaultTo(30)
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
