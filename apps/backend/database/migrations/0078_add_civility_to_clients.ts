import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('clients', (table) => {
      table.string('civility', 10).nullable()
    })
  }

  async down() {
    this.schema.alterTable('clients', (table) => {
      table.dropColumn('civility')
    })
  }
}
