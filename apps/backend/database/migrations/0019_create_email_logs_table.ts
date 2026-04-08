import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'email_logs'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.uuid('team_id').notNullable().references('id').inTable('teams').onDelete('CASCADE')
      table.string('document_type', 20).notNullable()
      table.uuid('document_id').notNullable()
      table.string('document_number', 100).notNullable()
      table.string('from_email', 255).notNullable()
      table.string('to_email', 255).notNullable()
      table.string('subject', 500).notNullable()
      table.text('body').notNullable()
      table.string('status', 20).notNullable().defaultTo('sent')
      table.text('error_message').nullable()
      table.string('email_type', 20).notNullable().defaultTo('send')
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index(['team_id', 'document_type', 'document_id'], 'idx_email_logs_document')
      table.index(['team_id'], 'idx_email_logs_team_id')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
