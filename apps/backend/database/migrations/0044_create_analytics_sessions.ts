import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.createTable('analytics_sessions', (table) => {
      table.uuid('id').primary().defaultTo(this.db.rawQuery('gen_random_uuid()').knexQuery)
      table.uuid('user_id').nullable().references('id').inTable('users').onDelete('SET NULL')
      table.string('session_token', 64).notNullable().unique()
      table.timestamp('started_at', { useTz: true }).notNullable().index()
      table.timestamp('ended_at', { useTz: true }).nullable()
      table.integer('duration_seconds').defaultTo(0)
      table.integer('page_count').defaultTo(0)
      table.integer('event_count').defaultTo(0)
      table.string('entry_page', 255).nullable()
      table.string('exit_page', 255).nullable()
      table.text('referrer_encrypted').nullable()
      table.text('ip_address_encrypted').nullable()
      table.string('ip_hash', 64).notNullable().index()
      table.text('user_agent_encrypted').nullable()
      table.string('browser', 50).nullable()
      table.string('browser_version', 20).nullable()
      table.string('os', 50).nullable()
      table.string('device_type', 20).nullable()
      table.integer('screen_width').nullable()
      table.integer('screen_height').nullable()
      table.string('country', 2).nullable()
      table.text('country_name_encrypted').nullable()
      table.text('city_encrypted').nullable()
      table.string('language', 10).nullable()
      table.boolean('is_authenticated').defaultTo(false)
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())
    })
  }

  async down() {
    this.schema.dropTable('analytics_sessions')
  }
}
