import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('teams', (table) => {
      table.string('stripe_customer_id').nullable()
      table.string('stripe_subscription_id').nullable()
      table.string('subscription_status', 32).nullable()
      table.string('plan_period', 16).nullable()
      table.timestamp('subscription_current_period_end').nullable()
      table.timestamp('subscription_grace_ends_at').nullable()
      table.boolean('subscription_cancel_at_period_end').notNullable().defaultTo(false)
    })
  }

  async down() {
    this.schema.alterTable('teams', (table) => {
      table.dropColumn('stripe_customer_id')
      table.dropColumn('stripe_subscription_id')
      table.dropColumn('subscription_status')
      table.dropColumn('plan_period')
      table.dropColumn('subscription_current_period_end')
      table.dropColumn('subscription_grace_ends_at')
      table.dropColumn('subscription_cancel_at_period_end')
    })
  }
}
