import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'einvoicing_submissions'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.db.rawQuery('gen_random_uuid()').knexQuery)
      table.uuid('team_id').notNullable().references('id').inTable('teams').onDelete('CASCADE')
      table
        .enum('document_type', ['invoice', 'quote', 'credit_note'], {
          useNative: true,
          enumName: 'einvoicing_document_type',
          existingType: false,
        })
        .notNullable()
      table.uuid('document_id').notNullable()
      table.string('document_number').notNullable()
      table.string('provider').notNullable().defaultTo('b2brouter')
      table.string('tracking_id').nullable()
      table.string('external_id').nullable()
      table
        .enum('status', ['pending', 'submitted', 'accepted', 'rejected', 'delivered', 'error'], {
          useNative: true,
          enumName: 'einvoicing_submission_status',
          existingType: false,
        })
        .notNullable()
        .defaultTo('pending')
      table.string('status_message').nullable()
      table.jsonb('lifecycle_events').notNullable().defaultTo('[]')
      table.text('xml_content').nullable()
      table.uuid('submitted_by_user_id').nullable().references('id').inTable('users').onDelete('SET NULL')
      table.timestamp('submitted_at').nullable()
      table.timestamp('last_checked_at').nullable()
      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('updated_at').notNullable().defaultTo(this.now())
    })

    this.schema.raw(
      'CREATE INDEX idx_einvoicing_submissions_team ON einvoicing_submissions (team_id)'
    )
    this.schema.raw(
      'CREATE INDEX idx_einvoicing_submissions_document ON einvoicing_submissions (document_type, document_id)'
    )
    this.schema.raw(
      'CREATE INDEX idx_einvoicing_submissions_status ON einvoicing_submissions (status)'
    )
    this.schema.raw(
      'CREATE INDEX idx_einvoicing_submissions_tracking ON einvoicing_submissions (tracking_id) WHERE tracking_id IS NOT NULL'
    )
  }

  async down() {
    this.schema.dropTable(this.tableName)
    this.schema.raw('DROP TYPE IF EXISTS einvoicing_document_type')
    this.schema.raw('DROP TYPE IF EXISTS einvoicing_submission_status')
  }
}
