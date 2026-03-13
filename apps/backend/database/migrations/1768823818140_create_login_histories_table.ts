import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'login_histories'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.db.rawQuery('gen_random_uuid()').knexQuery)
      table.uuid('user_id').nullable().references('id').inTable('users').onDelete('CASCADE')

      table.string('token_identifier', 255).nullable()
      table.string('ip_address', 45).notNullable()
      table.text('user_agent').nullable()
      table.string('country', 100).nullable()
      table.string('city', 100).nullable()

      table.string('status', 20).notNullable()
      table.string('failure_reason', 255).nullable()
      table.boolean('is_suspicious').defaultTo(false)

      table.timestamp('created_at').notNullable()

      table.index(['user_id'], 'idx_login_histories_user_id')
      table.index(['created_at'], 'idx_login_histories_created_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
