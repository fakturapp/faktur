import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.createTable('recurring_invoices', (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.uuid('team_id').notNullable().references('id').inTable('teams').onDelete('CASCADE')
      table.uuid('client_id').nullable().references('id').inTable('clients').onDelete('SET NULL')
      table.text('name').notNullable()
      table.string('frequency', 20).notNullable().defaultTo('monthly')
      table.integer('custom_interval_days').nullable()
      table.string('start_date').notNullable()
      table.string('next_execution_date').notNullable()
      table.string('end_date').nullable()
      table.boolean('is_active').notNullable().defaultTo(true)
      table.timestamp('last_generated_at').nullable()
      table.integer('generation_count').notNullable().defaultTo(0)

      table.text('subject').nullable()
      table.string('billing_type', 20).notNullable().defaultTo('detailed')
      table.string('accent_color', 7).notNullable().defaultTo('#6366f1')
      table.text('logo_url').nullable()
      table.string('language', 5).notNullable().defaultTo('fr')
      table.text('notes').nullable()
      table.text('acceptance_conditions').nullable()
      table.boolean('signature_field').notNullable().defaultTo(false)
      table.text('document_title').nullable()
      table.text('free_field').nullable()
      table.string('global_discount_type', 20).notNullable().defaultTo('none')
      table.decimal('global_discount_value', 12, 2).notNullable().defaultTo(0)
      table.text('delivery_address').nullable()
      table.text('client_siren').nullable()
      table.text('client_vat_number').nullable()
      table.text('payment_terms').nullable()
      table.string('payment_method', 50).nullable()
      table
        .uuid('bank_account_id')
        .nullable()
        .references('id')
        .inTable('bank_accounts')
        .onDelete('SET NULL')
      table.string('vat_exempt_reason', 30).notNullable().defaultTo('none')
      table.string('operation_category', 20).nullable()
      table.integer('due_days').notNullable().defaultTo(30)

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index(['team_id'])
      table.index(['team_id', 'is_active'])
      table.index(['next_execution_date', 'is_active'])
    })

    this.schema.createTable('recurring_invoice_lines', (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table
        .uuid('recurring_invoice_id')
        .notNullable()
        .references('id')
        .inTable('recurring_invoices')
        .onDelete('CASCADE')
      table.integer('position').notNullable().defaultTo(0)
      table.text('description').notNullable()
      table.string('sale_type', 50).nullable()
      table.decimal('quantity', 12, 2).notNullable().defaultTo(1)
      table.string('unit', 20).nullable()
      table.decimal('unit_price', 12, 2).notNullable().defaultTo(0)
      table.decimal('vat_rate', 5, 2).notNullable().defaultTo(0)
      table.decimal('total', 12, 2).notNullable().defaultTo(0)
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index(['recurring_invoice_id'])
    })
  }

  async down() {
    this.schema.dropTableIfExists('recurring_invoice_lines')
    this.schema.dropTableIfExists('recurring_invoices')
  }
}
