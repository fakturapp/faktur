import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'document_share_links'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table
        .enum('visibility', ['team', 'anyone'], {
          useNative: true,
          enumName: 'share_link_visibility',
          existingType: false,
        })
        .notNullable()
        .defaultTo('team')

      table.boolean('auto_expire').notNullable().defaultTo(false)
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('visibility')
      table.dropColumn('auto_expire')
    })
    this.schema.raw('DROP TYPE IF EXISTS share_link_visibility')
  }
}
