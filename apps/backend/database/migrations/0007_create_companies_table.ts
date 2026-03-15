import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'companies'

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
      table.string('legal_name').notNullable()
      table.string('trade_name').nullable()
      table.string('siren', 9).nullable()
      table.string('siret', 14).nullable()
      table.string('vat_number').nullable()
      table.string('legal_form').nullable()
      table.string('address_line1').nullable()
      table.string('address_line2').nullable()
      table.string('city').nullable()
      table.string('postal_code').nullable()
      table.string('country').notNullable().defaultTo('FR')
      table.string('phone').nullable()
      table.string('email').nullable()
      table.string('website').nullable()
      table.string('logo_url', 500).nullable()
      table.string('iban').nullable()
      table.string('bic').nullable()
      table.string('bank_name').nullable()
      table.string('payment_conditions').nullable()
      table.string('currency', 3).notNullable().defaultTo('EUR')
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
