import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'api_keys'

  async up() {
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
      table.string('prefix', 16).notNullable().defaultTo('fk_live_')
      table.string('last_4', 4).notNullable()
      table.string('hash', 64).notNullable().unique()

      table.specificType('scopes', 'text[]').notNullable()
      table.string('rate_limit_tier', 32).notNullable().defaultTo('default')
      table.specificType('allowed_ips', 'text[]').nullable()

      table.timestamp('expires_at').nullable()
      table.timestamp('last_used_at').nullable()
      table.string('last_ip', 45).nullable()
      table.bigInteger('usage_count').notNullable().defaultTo(0)

      table.timestamp('revoked_at').nullable()
      table.string('revoked_reason', 100).nullable()

      table.uuid('rotating_to_id').nullable()
      table.timestamp('rotation_grace_until').nullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index(['hash'], 'idx_api_keys_hash')
      table.index(['team_id'], 'idx_api_keys_team_id')
      table.index(['revoked_at'], 'idx_api_keys_revoked_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
