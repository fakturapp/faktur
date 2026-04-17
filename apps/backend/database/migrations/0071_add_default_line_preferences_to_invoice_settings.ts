import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'invoice_settings'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.float('default_vat_rate').notNullable().defaultTo(20)
      table.boolean('default_show_quantity_column').notNullable().defaultTo(true)
      table.boolean('default_show_unit_column').notNullable().defaultTo(true)
      table.boolean('default_show_unit_price_column').notNullable().defaultTo(true)
      table.boolean('default_show_vat_column').notNullable().defaultTo(true)
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('default_vat_rate')
      table.dropColumn('default_show_quantity_column')
      table.dropColumn('default_show_unit_column')
      table.dropColumn('default_show_unit_price_column')
      table.dropColumn('default_show_vat_column')
    })
  }
}
