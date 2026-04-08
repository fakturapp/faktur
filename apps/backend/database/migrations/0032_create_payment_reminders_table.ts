import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.createTable('payment_reminder_settings', (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))

      table
        .uuid('team_id')
        .notNullable()
        .unique()
        .references('id')
        .inTable('teams')
        .onDelete('CASCADE')

      table.boolean('enabled').notNullable().defaultTo(false)

      table.integer('days_before_due').nullable()
      table.integer('days_after_due').nullable()
      table.integer('repeat_interval_days').nullable()

      table.text('email_subject_template').nullable()
      table.text('email_body_template').nullable()

      table.boolean('auto_send').notNullable().defaultTo(false)

      table
        .uuid('email_account_id')
        .nullable()
        .references('id')
        .inTable('email_accounts')
        .onDelete('SET NULL')

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })

    this.schema.createTable('payment_reminders', (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))

      table.uuid('team_id').notNullable().references('id').inTable('teams').onDelete('CASCADE')

      table
        .uuid('invoice_id')
        .notNullable()
        .references('id')
        .inTable('invoices')
        .onDelete('CASCADE')

      table.string('type', 20).notNullable()
      table.string('status', 20).notNullable().defaultTo('sent')
      table.string('to_email', 255).nullable()
      table.text('error_message').nullable()

      table.timestamp('sent_at').notNullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index(['team_id'])
      table.index(['invoice_id'])
      table.index(['team_id', 'invoice_id'])
    })
  }

  async down() {
    this.schema.dropTable('payment_reminders')
    this.schema.dropTable('payment_reminder_settings')
  }
}
