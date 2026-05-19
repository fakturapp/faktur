import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'api_credit_usage'

  async up() {
    const exists = await this.db.schema.hasTable(this.tableName)
    if (exists) {
      const hasTeamId = await this.db.schema.hasColumn(this.tableName, 'team_id')
      if (hasTeamId) return
      this.schema.dropTable(this.tableName)
    }

    this.schema.createTable(this.tableName, (table) => {
      table.bigIncrements('id').primary()
      table.uuid('team_id').notNullable().references('id').inTable('teams').onDelete('CASCADE')
      table.uuid('user_id').nullable().references('id').inTable('users').onDelete('SET NULL')

      table.date('day').notNullable()
      table.date('week_start').notNullable()

      table.integer('daily_count').notNullable().defaultTo(0)
      table.integer('weekly_count').notNullable().defaultTo(0)

      table.timestamp('last_minute_at').nullable()
      table.integer('minute_count').notNullable().defaultTo(0)

      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())

      table.unique(['team_id', 'day'])
      table.index(['team_id', 'week_start'])
      table.index(['user_id', 'day'])
    })
  }

  async down() {
    this.schema.dropTableIfExists(this.tableName)
  }
}
