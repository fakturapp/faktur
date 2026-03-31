import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.createTable('ai_usage_logs', (table) => {
      table.uuid('id').primary().defaultTo(this.db.rawQuery('gen_random_uuid()').knexQuery)
      table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE')
      table.uuid('team_id').notNullable().references('id').inTable('teams').onDelete('CASCADE')
      table.string('action', 100).notNullable()
      table.string('provider', 50).notNullable()
      table.string('model', 100).notNullable()
      table.integer('tokens_used').nullable()
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())

      table.index(['user_id', 'created_at'])
      table.index(['team_id', 'created_at'])
    })
  }

  async down() {
    this.schema.dropTable('ai_usage_logs')
  }
}
