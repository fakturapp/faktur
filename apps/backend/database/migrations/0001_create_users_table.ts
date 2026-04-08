import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.string('full_name').nullable()
      table.string('email', 254).notNullable().unique()
      table.string('password').notNullable()
      table.string('avatar_url', 500).nullable()

      table.boolean('email_verified').defaultTo(false)
      table.string('email_verification_token', 255).nullable()
      table.timestamp('email_verification_sent_at').nullable()
      table.string('pending_email', 254).nullable()

      table.boolean('two_factor_enabled').defaultTo(false)
      table.text('two_factor_secret_encrypted').nullable()
      table.text('recovery_codes_encrypted').nullable()

      table.string('password_reset_token', 255).nullable()
      table.timestamp('password_reset_expires_at').nullable()

      table.integer('failed_login_attempts').defaultTo(0)
      table.timestamp('locked_until').nullable()
      table.string('security_code').nullable()
      table.timestamp('security_code_expires_at').nullable()
      table.string('status').defaultTo('active')
      table.timestamp('last_login_at').nullable()

      table.boolean('onboarding_completed').notNullable().defaultTo(false)

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
