import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'document_shares'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.db.rawQuery('gen_random_uuid()').knexQuery)
      table.uuid('team_id').notNullable().references('id').inTable('teams').onDelete('CASCADE')

      // Polymorphic document reference
      table
        .enum('document_type', ['invoice', 'quote', 'credit_note'], {
          useNative: true,
          enumName: 'document_share_type',
          existingType: false,
        })
        .notNullable()
      table.uuid('document_id').notNullable()

      // Who shared
      table.uuid('shared_by_user_id').notNullable().references('id').inTable('users').onDelete('CASCADE')

      // Who it's shared with (null if pending email invite)
      table.uuid('shared_with_user_id').nullable().references('id').inTable('users').onDelete('CASCADE')
      table.string('shared_with_email', 255).nullable()

      // Permission level
      table
        .enum('permission', ['viewer', 'editor'], {
          useNative: true,
          enumName: 'share_permission',
          existingType: false,
        })
        .notNullable()
        .defaultTo('viewer')

      // Status
      table
        .enum('status', ['active', 'pending', 'revoked'], {
          useNative: true,
          enumName: 'share_status',
          existingType: false,
        })
        .notNullable()
        .defaultTo('active')

      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('updated_at').notNullable().defaultTo(this.now())
    })

    // Indexes
    this.schema.raw(
      'CREATE INDEX idx_document_shares_team ON document_shares (team_id)'
    )
    this.schema.raw(
      'CREATE INDEX idx_document_shares_document ON document_shares (document_type, document_id)'
    )
    this.schema.raw(
      'CREATE INDEX idx_document_shares_shared_with ON document_shares (shared_with_user_id)'
    )
    // Prevent duplicate active shares for the same user on the same document
    this.schema.raw(
      `CREATE UNIQUE INDEX idx_document_shares_unique_active
       ON document_shares (document_type, document_id, shared_with_user_id)
       WHERE status = 'active' AND shared_with_user_id IS NOT NULL`
    )
  }

  async down() {
    this.schema.dropTable(this.tableName)
    this.schema.raw('DROP TYPE IF EXISTS document_share_type')
    this.schema.raw('DROP TYPE IF EXISTS share_permission')
    this.schema.raw('DROP TYPE IF EXISTS share_status')
  }
}
