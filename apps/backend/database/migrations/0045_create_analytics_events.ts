import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.createTable('analytics_events', (table) => {
      table.uuid('id').primary().defaultTo(this.db.rawQuery('gen_random_uuid()').knexQuery)
      table.uuid('session_id').notNullable().references('id').inTable('analytics_sessions').onDelete('CASCADE')
      table.uuid('user_id').nullable().references('id').inTable('users').onDelete('SET NULL')
      table.string('event_type', 30).notNullable()
      table.string('event_name', 100).notNullable()
      table.string('page_path', 255).nullable()
      table.text('page_path_full_encrypted').nullable()
      table.jsonb('metadata').nullable()
      table.text('metadata_encrypted').nullable()
      table.timestamp('timestamp', { useTz: true }).notNullable().index()
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
    })
  }

  async down() {
    this.schema.dropTable('analytics_events')
  }
}
