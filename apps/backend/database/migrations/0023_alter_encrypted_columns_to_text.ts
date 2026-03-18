import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    // Clients - all encrypted fields must be text to hold "v1:iv:tag:ciphertext"
    this.schema.alterTable('clients', (table) => {
      table.text('company_name').alter()
      table.text('first_name').alter()
      table.text('last_name').alter()
      table.text('email').alter()
      table.text('phone').alter()
      table.text('address').alter()
      table.text('address_complement').alter()
      // notes is already text
      table.text('siren').alter() // was varchar(9)
      table.text('siret').alter() // was varchar(14)
      table.text('vat_number').alter()
    })

    // Invoices - encrypted fields
    this.schema.alterTable('invoices', (table) => {
      table.text('subject').alter()
      // notes is already text
      // acceptance_conditions is already text
      table.text('document_title').alter()
      // free_field is already text
      // delivery_address is already text
      table.text('client_siren').alter() // was varchar(20)
      table.text('client_vat_number').alter() // was varchar(30)
      // comment is already text
      table.text('payment_terms').alter()
    })

    // Invoice lines - encrypted fields
    this.schema.alterTable('invoice_lines', (table) => {
      table.text('description').alter()
      table.text('sale_type').alter()
      table.text('unit').alter() // was varchar(20)
    })

    // Quotes - encrypted fields
    this.schema.alterTable('quotes', (table) => {
      table.text('subject').alter()
      // notes is already text
      // acceptance_conditions is already text
      table.text('document_title').alter()
      // free_field is already text
      // delivery_address is already text
      table.text('client_siren').alter() // was varchar(20)
      table.text('client_vat_number').alter() // was varchar(30)
      // comment is already text
    })

    // Quote lines - encrypted fields
    this.schema.alterTable('quote_lines', (table) => {
      table.text('description').alter()
      table.text('sale_type').alter()
      table.text('unit').alter() // was varchar(20)
    })

    // Companies - encrypted fields
    this.schema.alterTable('companies', (table) => {
      table.text('phone').alter()
      table.text('email').alter()
      table.text('iban').alter()
      table.text('bic').alter()
      table.text('bank_name').alter()
      table.text('payment_conditions').alter()
    })

    // Bank accounts - iban and bic are already text, no changes needed
  }

  async down() {
    // Reverting to original types would truncate encrypted data
    // Only revert if you're sure data is decrypted first
    this.schema.alterTable('clients', (table) => {
      table.string('company_name', 255).alter()
      table.string('first_name', 255).alter()
      table.string('last_name', 255).alter()
      table.string('email', 255).alter()
      table.string('phone', 255).alter()
      table.string('address', 255).alter()
      table.string('address_complement', 255).alter()
      table.string('siren', 9).alter()
      table.string('siret', 14).alter()
      table.string('vat_number', 255).alter()
    })

    this.schema.alterTable('invoices', (table) => {
      table.string('subject', 255).alter()
      table.string('document_title', 255).alter()
      table.string('client_siren', 20).alter()
      table.string('client_vat_number', 30).alter()
      table.string('payment_terms', 255).alter()
    })

    this.schema.alterTable('invoice_lines', (table) => {
      table.string('description', 255).alter()
      table.string('sale_type', 255).alter()
      table.string('unit', 20).alter()
    })

    this.schema.alterTable('quotes', (table) => {
      table.string('subject', 255).alter()
      table.string('document_title', 255).alter()
      table.string('client_siren', 20).alter()
      table.string('client_vat_number', 30).alter()
    })

    this.schema.alterTable('quote_lines', (table) => {
      table.string('description', 255).alter()
      table.string('sale_type', 255).alter()
      table.string('unit', 20).alter()
    })

    this.schema.alterTable('companies', (table) => {
      table.string('phone', 255).alter()
      table.string('email', 255).alter()
      table.string('iban', 255).alter()
      table.string('bic', 255).alter()
      table.string('bank_name', 255).alter()
      table.string('payment_conditions', 255).alter()
    })
  }
}
