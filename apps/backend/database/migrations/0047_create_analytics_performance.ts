import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.createTable('analytics_performance', (table) => {
      table.uuid('id').primary().defaultTo(this.db.rawQuery('gen_random_uuid()').knexQuery)
      table.uuid('session_id').nullable().references('id').inTable('analytics_sessions').onDelete('SET NULL')
      table.uuid('user_id').nullable().references('id').inTable('users').onDelete('SET NULL')
      table.string('metric_name', 10).notNullable()
      table.decimal('metric_value', 10, 3).notNullable()
      table.string('rating', 20).notNullable()
      table.string('page_path', 255).nullable()
      table.string('connection_type', 20).nullable()
      table.string('device_type', 20).nullable()
      table.timestamp('timestamp', { useTz: true }).notNullable().index()
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
    })
  }

  async down() {
    this.schema.dropTable('analytics_performance')
  }
}
