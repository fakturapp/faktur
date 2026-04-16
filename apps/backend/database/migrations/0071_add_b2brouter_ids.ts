import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('teams', (table) => {
      table.string('b2b_account_id').nullable()
    })

    this.schema.alterTable('clients', (table) => {
      table.integer('b2b_contact_id').nullable()
    })

    this.schema.alterTable('invoice_settings', (table) => {
      table.string('b2b_account_id').nullable()
      table.string('b2b_enterprise_size').nullable()
      table.string('b2b_naf_code').nullable()
      table.string('b2b_type_operation').nullable()
      table.boolean('b2b_ereporting_enabled').notNullable().defaultTo(false)
    })
  }

  async down() {
    this.schema.alterTable('teams', (table) => {
      table.dropColumn('b2b_account_id')
    })

    this.schema.alterTable('clients', (table) => {
      table.dropColumn('b2b_contact_id')
    })

    this.schema.alterTable('invoice_settings', (table) => {
      table.dropColumn('b2b_account_id')
      table.dropColumn('b2b_enterprise_size')
      table.dropColumn('b2b_naf_code')
      table.dropColumn('b2b_type_operation')
      table.dropColumn('b2b_ereporting_enabled')
    })
  }
}
