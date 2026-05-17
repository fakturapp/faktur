import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'api_key_webhooks'

  async up() {
    this.schema.raw(`
      ALTER TABLE ${this.tableName}
      ALTER COLUMN secret_hash TYPE text
    `)
  }

  async down() {
    this.schema.raw(`
      ALTER TABLE ${this.tableName}
      ALTER COLUMN secret_hash TYPE varchar(128)
    `)
  }
}
