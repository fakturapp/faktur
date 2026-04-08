import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.createTable('expense_categories', (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))

      table.uuid('team_id').notNullable().references('id').inTable('teams').onDelete('CASCADE')

      table.string('name', 100).notNullable()
      table.string('color', 7).nullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index(['team_id'])
    })

    this.schema.createTable('expenses', (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))

      table.uuid('team_id').notNullable().references('id').inTable('teams').onDelete('CASCADE')

      table
        .uuid('category_id')
        .nullable()
        .references('id')
        .inTable('expense_categories')
        .onDelete('SET NULL')

      table.string('description', 500).notNullable()
      table.decimal('amount', 12, 2).notNullable()
      table.decimal('vat_amount', 12, 2).notNullable().defaultTo(0)
      table.decimal('vat_rate', 5, 2).notNullable().defaultTo(0)
      table.string('currency', 3).notNullable().defaultTo('EUR')
      table.string('expense_date', 10).notNullable()
      table.string('payment_method', 50).nullable()
      table.string('supplier', 255).nullable()
      table.text('notes').nullable()
      table.string('receipt_url', 500).nullable()
      table.boolean('is_deductible').notNullable().defaultTo(true)

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index(['team_id'])
      table.index(['team_id', 'expense_date'])
      table.index(['team_id', 'category_id'])
    })
  }

  async down() {
    this.schema.dropTable('expenses')
    this.schema.dropTable('expense_categories')
  }
}
