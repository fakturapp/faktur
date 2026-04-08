import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'passkey_challenges'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.db.rawQuery('gen_random_uuid()').knexQuery)
      table.uuid('user_id').nullable().references('id').inTable('users').onDelete('CASCADE')
      table.text('challenge').notNullable()
      table.string('type', 20).notNullable()
      table.timestamp('expires_at').notNullable()
      table.timestamp('created_at').notNullable().defaultTo(this.now())
    })

    this.schema.raw(
      'CREATE INDEX idx_passkey_challenges_expires ON passkey_challenges (expires_at)'
    )
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
