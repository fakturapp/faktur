import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'invoice_settings'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table
        .uuid('team_id')
        .notNullable()
        .unique()
        .references('id')
        .inTable('teams')
        .onDelete('CASCADE')

      table.string('billing_type', 20).notNullable().defaultTo('quick')
      table.string('accent_color', 7).notNullable().defaultTo('#6366f1')
      table.string('logo_url', 500).nullable()
      table.string('template', 30).notNullable().defaultTo('classique')
      table.boolean('dark_mode').notNullable().defaultTo(false)
      table.string('document_font', 50).defaultTo('Lexend')
      table.string('logo_source', 20).defaultTo('custom')
      table.string('footer_mode', 30).defaultTo('vat_exempt')

      table.jsonb('payment_methods').notNullable().defaultTo('["bank_transfer"]')
      table.string('custom_payment_method', 255).nullable()

      table.boolean('e_invoicing_enabled').defaultTo(false)
      table.string('pdp_provider', 50).nullable()
      table.text('pdp_api_key').nullable()
      table.boolean('pdp_sandbox').defaultTo(true)

      table.text('default_subject').nullable()
      table.text('default_acceptance_conditions').nullable()
      table.boolean('default_signature_field').defaultTo(false)
      table.text('default_free_field').nullable()
      table.boolean('default_show_notes').defaultTo(true)
      table.boolean('default_vat_exempt').defaultTo(false)
      table.text('default_footer_text').nullable()
      table.boolean('default_show_delivery_address').defaultTo(false)
      table.string('default_language', 5).defaultTo('fr')

      table.string('quote_filename_pattern', 255).defaultTo('DEV-{numero}')
      table.string('invoice_filename_pattern', 255).defaultTo('FAC-{numero}')

      table.string('next_invoice_number', 50).nullable()
      table.string('next_quote_number', 50).nullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
