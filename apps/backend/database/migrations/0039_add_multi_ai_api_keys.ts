import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'invoice_settings'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.text('ai_api_key_claude').nullable().after('ai_custom_api_key')
      table.text('ai_api_key_gemini').nullable().after('ai_api_key_claude')
      table.text('ai_api_key_groq').nullable().after('ai_api_key_gemini')
    })

    this.defer(async (db) => {
      await db.rawQuery(`
        UPDATE invoice_settings SET ai_api_key_claude = ai_custom_api_key
        WHERE ai_provider = 'claude' AND ai_custom_api_key IS NOT NULL
      `)
      await db.rawQuery(`
        UPDATE invoice_settings SET ai_api_key_gemini = ai_custom_api_key
        WHERE ai_provider = 'gemini' AND ai_custom_api_key IS NOT NULL
      `)
      await db.rawQuery(`
        UPDATE invoice_settings SET ai_api_key_groq = ai_custom_api_key
        WHERE ai_provider = 'groq' AND ai_custom_api_key IS NOT NULL
      `)
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('ai_api_key_claude')
      table.dropColumn('ai_api_key_gemini')
      table.dropColumn('ai_api_key_groq')
    })
  }
}
