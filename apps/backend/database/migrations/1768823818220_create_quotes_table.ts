import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'quotes'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.db.rawQuery('gen_random_uuid()').knexQuery)
      table.uuid('team_id').notNullable().references('id').inTable('teams').onDelete('CASCADE')
      table.uuid('client_id').nullable().references('id').inTable('clients').onDelete('SET NULL')

      table.string('quote_number', 50).notNullable()
      table.string('status', 20).notNullable().defaultTo('draft') // draft, sent, accepted, refused, expired

      table.string('subject').nullable()
      table.date('issue_date').notNullable()
      table.date('validity_date').nullable()
      table.string('billing_type', 20).notNullable().defaultTo('quick') // quick, detailed

      table.string('accent_color', 7).notNullable().defaultTo('#6366f1')
      table.string('logo_url').nullable()
      table.string('language', 5).notNullable().defaultTo('fr')

      table.text('notes').nullable()
      table.text('acceptance_conditions').nullable()
      table.boolean('signature_field').notNullable().defaultTo(false)

      table.string('document_title').nullable()
      table.text('free_field').nullable()

      table.string('global_discount_type', 20).notNullable().defaultTo('none') // none, percentage, fixed
      table.decimal('global_discount_value', 12, 2).notNullable().defaultTo(0)

      table.text('delivery_address').nullable()
      table.string('client_siren', 20).nullable()
      table.string('client_vat_number', 30).nullable()

      table.decimal('subtotal', 12, 2).notNullable().defaultTo(0)
      table.decimal('tax_amount', 12, 2).notNullable().defaultTo(0)
      table.decimal('total', 12, 2).notNullable().defaultTo(0)

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index(['team_id'], 'idx_quotes_team_id')
      table.unique(['team_id', 'quote_number'], { indexName: 'uq_quotes_team_number' })
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
