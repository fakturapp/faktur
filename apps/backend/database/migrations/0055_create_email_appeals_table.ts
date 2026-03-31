import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.createTable('email_appeals', (table) => {
      table.uuid('id').primary().defaultTo(this.db.rawQuery('gen_random_uuid()').knexQuery)
      table.string('email', 255).notNullable()
      table.string('domain', 255).notNullable()
      table.text('reason').notNullable()
      table.enum('status', ['pending', 'approved', 'rejected']).notNullable().defaultTo('pending')
      table.text('admin_note').nullable()
      table.string('ip_address', 45).nullable()
      table.timestamp('reviewed_at', { useTz: true }).nullable()
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())
    })
  }

  async down() {
    this.schema.dropTable('email_appeals')
  }
}
