import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'api_audit_logs'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.bigIncrements('id')

      table.uuid('team_id').notNullable().references('id').inTable('teams').onDelete('CASCADE')

      table
        .uuid('project_id')
        .nullable()
        .references('id')
        .inTable('api_projects')
        .onDelete('SET NULL')

      table
        .uuid('actor_user_id')
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')

      table.string('actor_email', 254).nullable()
      table.string('actor_name', 200).nullable()

      table.string('action', 64).notNullable()
      table.string('target_type', 32).notNullable()
      table.string('target_id', 64).nullable()
      table.string('target_label', 200).nullable()

      table.jsonb('metadata').notNullable().defaultTo('{}')

      table.string('ip', 45).nullable()
      table.text('user_agent').nullable()

      table.timestamp('created_at').notNullable()

      table.index(['team_id', 'created_at'], 'idx_audit_logs_team_time')
      table.index(['project_id', 'created_at'], 'idx_audit_logs_project_time')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
