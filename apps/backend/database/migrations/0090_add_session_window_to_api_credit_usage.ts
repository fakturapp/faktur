import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'api_credit_usage'

  async up() {
    const [hasSessionStartedAt, hasSessionCount] = await Promise.all([
      this.db.schema.hasColumn(this.tableName, 'session_started_at'),
      this.db.schema.hasColumn(this.tableName, 'session_count'),
    ])

    if (hasSessionStartedAt && hasSessionCount) return

    this.schema.alterTable(this.tableName, (table) => {
      if (!hasSessionStartedAt) table.timestamp('session_started_at', { useTz: true }).nullable()
      if (!hasSessionCount) table.integer('session_count').notNullable().defaultTo(0)
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('session_started_at')
      table.dropColumn('session_count')
    })
  }
}
