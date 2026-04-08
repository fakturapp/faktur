import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'invoice_payments'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table
        .uuid('invoice_id')
        .notNullable()
        .references('id')
        .inTable('invoices')
        .onDelete('CASCADE')
      table.uuid('team_id').notNullable().references('id').inTable('teams').onDelete('CASCADE')
      table.decimal('amount', 12, 2).notNullable()
      table.string('payment_date', 10).notNullable()
      table.string('payment_method', 50).nullable()
      table.text('notes').nullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index(['invoice_id'])
      table.index(['team_id'])
      table.index(['team_id', 'payment_date'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
