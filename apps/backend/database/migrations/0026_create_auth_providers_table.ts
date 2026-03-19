import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'auth_providers'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table
        .uuid('user_id')
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
      table.string('provider', 50).notNullable() // 'google'
      table.string('provider_user_id', 255).notNullable()
      table.string('email', 255).notNullable()
      table.string('display_name', 255).nullable()
      table.string('avatar_url', 1024).nullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.unique(['user_id', 'provider'], { indexName: 'uniq_auth_providers_user_provider' })
      table.unique(['provider', 'provider_user_id'], {
        indexName: 'uniq_auth_providers_provider_sub',
      })
      table.index(['user_id'], 'idx_auth_providers_user_id')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
