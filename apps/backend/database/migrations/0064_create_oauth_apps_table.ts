import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'oauth_apps'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))

      table.string('name', 100).notNullable()
      table.text('description').nullable()
      table.string('icon_url', 500).nullable()
      table.string('website_url', 500).nullable()

      table.string('client_id', 64).notNullable().unique()

      table.string('client_secret_hash', 128).notNullable()

      table.specificType('redirect_uris', 'text[]').notNullable()

      table.specificType('scopes', 'text[]').notNullable()

      table.string('webhook_url', 500).nullable()
      table.text('encrypted_webhook_secret').nullable()
      table.specificType('webhook_events', 'text[]').nullable()

      table.string('kind', 20).notNullable().defaultTo('desktop')

      table
        .uuid('created_by_user_id')
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')

      table.boolean('is_active').notNullable().defaultTo(true)
      table.boolean('is_first_party').notNullable().defaultTo(false)

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index(['client_id'], 'idx_oauth_apps_client_id')
      table.index(['created_by_user_id'], 'idx_oauth_apps_created_by')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
