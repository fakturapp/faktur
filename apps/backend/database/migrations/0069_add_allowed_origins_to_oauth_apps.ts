import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'oauth_apps'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table
        .specificType('allowed_origins', 'text[]')
        .notNullable()
        .defaultTo(this.raw("'{}'::text[]"))
      table.boolean('allow_all_origins').notNullable().defaultTo(false)
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('allowed_origins')
      table.dropColumn('allow_all_origins')
    })
  }
}
