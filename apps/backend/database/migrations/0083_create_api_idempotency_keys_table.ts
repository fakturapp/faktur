import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'api_idempotency_keys'

  async up() {
    const exists = await this.db.schema.hasTable(this.tableName)
    if (exists) {
      const hasApiKeyId = await this.db.schema.hasColumn(this.tableName, 'api_key_id')
      if (hasApiKeyId) return
      this.schema.dropTable(this.tableName)
    }

    this.schema.createTable(this.tableName, (table) => {
      table.string('key', 128).primary()

      table
        .uuid('api_key_id')
        .notNullable()
        .references('id')
        .inTable('api_keys')
        .onDelete('CASCADE')

      table.string('method', 10).notNullable()
      table.string('path', 500).notNullable()
      table.string('body_hash', 64).notNullable()

      table.integer('response_status').notNullable()
      table.text('response_body').notNullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('expires_at').notNullable()

      table.index(['expires_at'], 'idx_api_idempotency_expires')
      table.index(['api_key_id'], 'idx_api_idempotency_key_id')
    })
  }

  async down() {
    this.schema.dropTableIfExists(this.tableName)
  }
}
