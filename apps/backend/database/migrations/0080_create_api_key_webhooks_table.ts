import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'api_key_webhooks'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))

      table
        .uuid('api_key_id')
        .notNullable()
        .references('id')
        .inTable('api_keys')
        .onDelete('CASCADE')
        .unique()

      table.string('url', 500).notNullable()
      table.string('secret_hash', 128).notNullable()
      table.string('secret_last_4', 4).notNullable()

      table.specificType('events', 'text[]').notNullable()

      table.boolean('is_active').notNullable().defaultTo(true)
      table.timestamp('last_delivery_at').nullable()
      table.string('last_delivery_status', 32).nullable()
      table.integer('consecutive_failures').notNullable().defaultTo(0)

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index(['api_key_id'], 'idx_api_key_webhooks_key_id')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
