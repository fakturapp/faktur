import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'bank_accounts'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table
        .uuid('team_id')
        .notNullable()
        .references('id')
        .inTable('teams')
        .onDelete('CASCADE')
      table.string('label', 255).notNullable()
      table.string('bank_name', 255).nullable()
      table.text('iban').nullable()
      table.text('bic').nullable()
      table.boolean('is_encrypted').notNullable().defaultTo(false)
      table.boolean('is_default').notNullable().defaultTo(false)
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index(['team_id'], 'idx_bank_accounts_team_id')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
