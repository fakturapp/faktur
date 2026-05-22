import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'api_request_logs'

  async up() {
    const exists = await this.db.schema.hasTable(this.tableName)
    let needsCreate = !exists

    if (exists) {
      const [hasApiKeyId, hasCreatedAt, hasStatus, hasLatency, hasMethod, hasPath] =
        await Promise.all([
          this.db.schema.hasColumn(this.tableName, 'api_key_id'),
          this.db.schema.hasColumn(this.tableName, 'created_at'),
          this.db.schema.hasColumn(this.tableName, 'status'),
          this.db.schema.hasColumn(this.tableName, 'latency_ms'),
          this.db.schema.hasColumn(this.tableName, 'method'),
          this.db.schema.hasColumn(this.tableName, 'path'),
        ])

      const broken =
        !hasApiKeyId || !hasCreatedAt || !hasStatus || !hasLatency || !hasMethod || !hasPath
      if (broken) {
        this.schema.raw(`DROP TABLE IF EXISTS ${this.tableName} CASCADE`)
        needsCreate = true
      }
    }

    if (needsCreate) {
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
  }

  async down() {
    // Intentional no-op: this is a repair migration. Rolling it back would
    // re-introduce the broken state on environments where it had to act.
  }
}
