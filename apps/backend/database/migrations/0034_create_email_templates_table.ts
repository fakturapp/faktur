import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'email_templates'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.uuid('team_id').notNullable().references('id').inTable('teams').onDelete('CASCADE')
      table.string('template_type', 50).notNullable() // invoice_send, quote_send, credit_note_send
      table.text('subject').notNullable()
      table.text('body').notNullable()
      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('updated_at').notNullable().defaultTo(this.now())

      table.unique(['team_id', 'template_type'])
    })
  }

  async down() {
    this.schema.dropTableIfExists(this.tableName)
  }
}
