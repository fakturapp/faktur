import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'team_members'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.uuid('user_id').nullable().alter()
    })

    // Drop the unique constraint and recreate it to allow multiple null user_ids
    this.schema.alterTable(this.tableName, (table) => {
      table.dropUnique(['team_id', 'user_id'])
    })

    // Add a partial unique index: unique (team_id, user_id) WHERE user_id IS NOT NULL
    this.defer(async (db) => {
      await db.rawQuery(
        'CREATE UNIQUE INDEX team_members_team_user_unique ON team_members (team_id, user_id) WHERE user_id IS NOT NULL'
      )
    })
  }

  async down() {
    this.defer(async (db) => {
      await db.rawQuery('DROP INDEX IF EXISTS team_members_team_user_unique')
    })

    this.schema.alterTable(this.tableName, (table) => {
      table.unique(['team_id', 'user_id'])
      table.uuid('user_id').notNullable().alter()
    })
  }
}
