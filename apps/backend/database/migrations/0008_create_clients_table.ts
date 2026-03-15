import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'clients'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table
        .uuid('team_id')
        .notNullable()
        .references('id')
        .inTable('teams')
        .onDelete('CASCADE')
      table.string('type', 20).notNullable().defaultTo('company')
      table.string('company_name').nullable()
      table.string('siren', 9).nullable()
      table.string('siret', 14).nullable()
      table.string('vat_number').nullable()
      table.string('first_name').nullable()
      table.string('last_name').nullable()
      table.string('email').nullable()
      table.string('phone').nullable()
      table.boolean('include_in_emails').notNullable().defaultTo(true)
      table.string('address').nullable()
      table.string('address_complement').nullable()
      table.string('postal_code').nullable()
      table.string('city').nullable()
      table.string('country', 5).notNullable().defaultTo('FR')
      table.text('notes').nullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index(['team_id'], 'idx_clients_team_id')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
