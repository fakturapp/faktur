import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'api_request_logs'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.bigIncrements('id')

      table
        .uuid('api_key_id')
        .notNullable()
        .references('id')
        .inTable('api_keys')
        .onDelete('CASCADE')

      table.string('method', 10).notNullable()
      table.string('path', 500).notNullable()
      table.integer('status').notNullable()
      table.integer('latency_ms').notNullable()
      table.string('ip', 45).notNullable()
      table.string('request_id', 64).notNullable()
      table.text('error_code').nullable()

      table.timestamp('created_at').notNullable()

      table.index(['api_key_id', 'created_at'], 'idx_api_request_logs_key_time')
      table.index(['created_at'], 'idx_api_request_logs_time')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
