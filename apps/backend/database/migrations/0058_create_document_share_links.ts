import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'document_share_links'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.db.rawQuery('gen_random_uuid()').knexQuery)
      table.uuid('team_id').notNullable().references('id').inTable('teams').onDelete('CASCADE')

      // Polymorphic document reference (reuse the enum from migration 0057)
      table
        .enum('document_type', ['invoice', 'quote', 'credit_note'], {
          useNative: true,
          enumName: 'document_share_type',
          existingType: true,
        })
        .notNullable()
      table.uuid('document_id').notNullable()

      // Secure token for the shareable link
      table.string('token', 64).notNullable().unique()

      // Permission level (reuse the enum from migration 0057)
      table
        .enum('permission', ['viewer', 'editor'], {
          useNative: true,
          enumName: 'share_permission',
          existingType: true,
        })
        .notNullable()
        .defaultTo('viewer')

      // Who created this link
      table.uuid('created_by_user_id').notNullable().references('id').inTable('users').onDelete('CASCADE')

      table.boolean('is_active').notNullable().defaultTo(true)
      table.timestamp('expires_at').nullable()

      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('updated_at').notNullable().defaultTo(this.now())
    })

    // Indexes
    this.schema.raw(
      'CREATE INDEX idx_document_share_links_token ON document_share_links (token)'
    )
    this.schema.raw(
      'CREATE INDEX idx_document_share_links_document ON document_share_links (document_type, document_id)'
    )
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
