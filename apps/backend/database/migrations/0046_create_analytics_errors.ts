import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.createTable('analytics_errors', (table) => {
      table.uuid('id').primary().defaultTo(this.db.rawQuery('gen_random_uuid()').knexQuery)
      table.uuid('session_id').nullable().references('id').inTable('analytics_sessions').onDelete('SET NULL')
      table.uuid('user_id').nullable().references('id').inTable('users').onDelete('SET NULL')
      table.string('error_type', 50).notNullable()
      table.string('error_message', 255).notNullable()
      table.text('error_message_full_encrypted').nullable()
      table.text('stack_trace_encrypted').nullable()
      table.string('page_path', 255).nullable()
      table.string('browser', 50).nullable()
      table.string('os', 50).nullable()
      table.integer('occurrence_count').defaultTo(1)
      table.string('fingerprint', 64).notNullable().index()
      table.boolean('is_resolved').defaultTo(false)
      table.timestamp('timestamp', { useTz: true }).notNullable().index()
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
    })
  }

  async down() {
    this.schema.dropTable('analytics_errors')
  }
}
