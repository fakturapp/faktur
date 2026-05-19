import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'api_credit_usage'

  async up() {
    const hasWeeklyStartedAt = await this.db.schema.hasColumn(
      this.tableName,
      'weekly_started_at'
    )
    if (hasWeeklyStartedAt) return

    this.schema.alterTable(this.tableName, (table) => {
      table.timestamp('weekly_started_at', { useTz: true }).nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('weekly_started_at')
    })
  }
}
