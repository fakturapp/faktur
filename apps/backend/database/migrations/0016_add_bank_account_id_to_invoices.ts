import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'invoices'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('payment_method', 50).nullable()
      table
        .uuid('bank_account_id')
        .nullable()
        .references('id')
        .inTable('bank_accounts')
        .onDelete('SET NULL')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('payment_method')
      table.dropColumn('bank_account_id')
    })
  }
}
