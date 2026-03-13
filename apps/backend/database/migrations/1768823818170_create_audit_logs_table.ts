import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'audit_logs'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.db.rawQuery('gen_random_uuid()').knexQuery)
      table.uuid('user_id').nullable().references('id').inTable('users').onDelete('SET NULL')

      table.string('action', 255).notNullable()
      table.string('resource_type', 100).notNullable()
      table.string('resource_id', 255).nullable()
      table.jsonb('metadata').nullable()
      table.string('ip_address', 45).nullable()
      table.text('user_agent').nullable()
      table.string('severity', 20).notNullable().defaultTo('info')

      table.timestamp('created_at').notNullable()

      table.index(['user_id'], 'idx_audit_logs_user_id')
      table.index(['action'], 'idx_audit_logs_action')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
