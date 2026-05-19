import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'api_keys'

  async up() {
    const hasColumn = await this.db.schema.hasColumn(this.tableName, 'project_id')
    if (!hasColumn) {
      this.schema.alterTable(this.tableName, (table) => {
        table
          .uuid('project_id')
          .nullable()
          .references('id')
          .inTable('api_projects')
          .onDelete('RESTRICT')
      })
    }

    this.schema.raw(`
      INSERT INTO api_projects (id, team_id, name, description, is_default, created_at)
      SELECT gen_random_uuid(), id, 'Projet par défaut', 'Projet créé automatiquement pour vos clés API existantes.', true, now()
      FROM teams
      WHERE EXISTS (SELECT 1 FROM api_keys WHERE api_keys.team_id = teams.id)
      ON CONFLICT (team_id, name) DO NOTHING
    `)

    this.schema.raw(`
      UPDATE api_keys SET project_id = (
        SELECT id FROM api_projects
        WHERE api_projects.team_id = api_keys.team_id AND is_default = true
        LIMIT 1
      )
      WHERE project_id IS NULL
    `)

    this.schema.alterTable(this.tableName, (table) => {
      table.uuid('project_id').notNullable().alter()
    })

    this.schema.raw(`CREATE INDEX IF NOT EXISTS idx_api_keys_project_id ON api_keys(project_id)`)
  }

  async down() {
    this.schema.raw(`DROP INDEX IF EXISTS idx_api_keys_project_id`)
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('project_id')
    })
  }
}
