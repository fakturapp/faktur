import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'passkey_credentials'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.db.rawQuery('gen_random_uuid()').knexQuery)
      table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE')
      table.string('credential_id', 512).notNullable().unique()
      table.text('public_key').notNullable()
      table.bigInteger('counter').notNullable().defaultTo(0)
      table.text('transports').nullable()
      table.string('friendly_name', 255).notNullable().defaultTo('Clé d\'accès')
      table.boolean('backed_up').notNullable().defaultTo(false)
      table.text('encrypted_kek').nullable()
      table.timestamp('last_used_at').nullable()
      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('updated_at').notNullable().defaultTo(this.now())
    })

    this.schema.raw(
      'CREATE INDEX idx_passkey_credentials_user ON passkey_credentials (user_id)'
    )
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
