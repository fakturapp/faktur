import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'storage_files'

  async up() {
    const exists = await this.db.schema.hasTable(this.tableName)
    if (exists) return

    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary()
      table.uuid('team_id').notNullable().references('id').inTable('teams').onDelete('CASCADE')

      table.string('category', 32).notNullable()
      table.string('object_key', 512).notNullable().unique()
      table.string('public_url', 1024).notNullable()
      table.bigInteger('size_bytes').notNullable().defaultTo(0)
      table.string('content_type', 128).nullable()
      table.string('original_name', 255).nullable()
      table.boolean('is_orphaned').notNullable().defaultTo(false)

      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())

      table.index(['team_id'])
    })

    this.schema.raw(`
      ALTER TABLE storage_files
      ADD CONSTRAINT storage_files_category_check
      CHECK (category IN ('company_logo','invoice_logo','team_icon','payment_link_pdf'))
    `)
  }

  async down() {
    this.schema.raw(`ALTER TABLE storage_files DROP CONSTRAINT IF EXISTS storage_files_category_check`)
    this.schema.dropTableIfExists(this.tableName)
  }
}
