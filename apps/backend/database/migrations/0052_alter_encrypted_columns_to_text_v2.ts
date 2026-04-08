import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('invoice_payments', (table) => {
      table.text('payment_method').alter()
    })

    this.schema.alterTable('client_contacts', (table) => {
      table.text('first_name').alter()
      table.text('last_name').alter()
      table.text('email').alter()
      table.text('phone').alter()
      table.text('role').alter()
    })
  }

  async down() {
    this.schema.alterTable('invoice_payments', (table) => {
      table.string('payment_method', 50).alter()
    })

    this.schema.alterTable('client_contacts', (table) => {
      table.string('first_name', 100).alter()
      table.string('last_name', 100).alter()
      table.string('email', 255).alter()
      table.string('phone', 50).alter()
      table.string('role', 100).alter()
    })
  }
}
