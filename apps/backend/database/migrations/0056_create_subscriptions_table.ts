import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.createTable('subscriptions', (table) => {
      table.uuid('id').primary().defaultTo(this.db.rawQuery('gen_random_uuid()').knexQuery)
      table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE')
      table.string('stripe_customer_id', 255).nullable()
      table.string('stripe_subscription_id', 255).nullable()
      table.string('plan_name', 50).notNullable().defaultTo('free')
      table.string('status', 50).notNullable().defaultTo('active')
      table.timestamp('current_period_start', { useTz: true }).nullable()
      table.timestamp('current_period_end', { useTz: true }).nullable()
      table.boolean('cancel_at_period_end').notNullable().defaultTo(false)
      table.timestamp('canceled_at', { useTz: true }).nullable()
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())

      table.unique(['user_id'])
      table.index(['stripe_customer_id'])
      table.unique(['stripe_subscription_id'])
    })
  }

  async down() {
    this.schema.dropTable('subscriptions')
  }
}
