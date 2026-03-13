import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'invoice_settings'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.db.rawQuery('gen_random_uuid()').knexQuery)
      table
        .uuid('team_id')
        .notNullable()
        .unique()
        .references('id')
        .inTable('teams')
        .onDelete('CASCADE')

      table.string('billing_type', 20).notNullable().defaultTo('quick') // 'quick' | 'detailed'
      table.string('accent_color', 7).notNullable().defaultTo('#6366f1')
      table.string('logo_url', 500).nullable()
      table.jsonb('payment_methods').notNullable().defaultTo('["bank_transfer"]')
      table.string('custom_payment_method', 255).nullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
