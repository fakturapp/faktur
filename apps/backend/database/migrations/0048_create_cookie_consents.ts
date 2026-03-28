import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.createTable('cookie_consents', (table) => {
      table.uuid('id').primary().defaultTo(this.db.rawQuery('gen_random_uuid()').knexQuery)
      table.uuid('user_id').nullable().references('id').inTable('users').onDelete('SET NULL')
      table.string('visitor_id', 64).notNullable().index()
      table.boolean('consent_analytics').defaultTo(false)
      table.boolean('consent_essential').defaultTo(true)
      table.text('ip_address_encrypted').nullable()
      table.text('user_agent_encrypted').nullable()
      table.string('action', 20).notNullable()
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
    })
  }

  async down() {
    this.schema.dropTable('cookie_consents')
  }
}
