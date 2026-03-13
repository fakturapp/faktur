import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'quote_lines'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.db.rawQuery('gen_random_uuid()').knexQuery)
      table.uuid('quote_id').notNullable().references('id').inTable('quotes').onDelete('CASCADE')

      table.integer('position').notNullable().defaultTo(0)
      table.string('description').notNullable()
      table.string('sale_type').nullable()

      table.decimal('quantity', 12, 2).notNullable().defaultTo(1)
      table.string('unit', 20).nullable()
      table.decimal('unit_price', 12, 2).notNullable().defaultTo(0)
      table.decimal('vat_rate', 5, 2).notNullable().defaultTo(0)
      table.decimal('total', 12, 2).notNullable().defaultTo(0)

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index(['quote_id'], 'idx_quote_lines_quote_id')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
