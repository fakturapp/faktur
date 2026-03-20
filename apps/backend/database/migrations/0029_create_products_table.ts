import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'products'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table
        .uuid('team_id')
        .notNullable()
        .references('id')
        .inTable('teams')
        .onDelete('CASCADE')
      table.text('name').notNullable()
      table.text('description').nullable()
      table.decimal('unit_price', 12, 2).notNullable().defaultTo(0)
      table.string('vat_rate', 10).notNullable().defaultTo('20')
      table.text('unit').nullable()
      table.text('sale_type').nullable()
      table.text('reference').nullable()
      table.boolean('is_archived').notNullable().defaultTo(false)
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index(['team_id'], 'idx_products_team_id')
      table.index(['team_id', 'is_archived'], 'idx_products_team_archived')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
