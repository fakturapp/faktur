import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'ai_usage_logs'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.db.rawQuery('gen_random_uuid()').knexQuery)
      table.uuid('team_id').notNullable().references('id').inTable('teams').onDelete('CASCADE')
      table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE')
      table.string('model', 100).notNullable()
      table.string('endpoint', 100).notNullable()
      table.timestamp('created_at').notNullable().defaultTo(this.now())
    })

    this.schema.raw(
      'CREATE INDEX idx_ai_usage_team_created ON ai_usage_logs (team_id, created_at DESC)'
    )
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
