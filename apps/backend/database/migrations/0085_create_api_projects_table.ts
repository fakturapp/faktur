import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'api_projects'

  async up() {
    const exists = await this.db.schema.hasTable(this.tableName)
    if (exists) {
      const hasTeamId = await this.db.schema.hasColumn(this.tableName, 'team_id')
      if (hasTeamId) return
      this.schema.dropTable(this.tableName)
    }

    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))

      table.uuid('team_id').notNullable().references('id').inTable('teams').onDelete('CASCADE')

      table
        .uuid('created_by_user_id')
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')

      table.string('name', 100).notNullable()
      table.text('description').nullable()
      table.string('color', 16).nullable()

      table.boolean('is_default').notNullable().defaultTo(false)
      table.boolean('is_archived').notNullable().defaultTo(false)

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index(['team_id'], 'idx_api_projects_team_id')
      table.unique(['team_id', 'name'], { indexName: 'uq_api_projects_team_name' })
    })
  }

  async down() {
    this.schema.dropTableIfExists(this.tableName)
  }
}
