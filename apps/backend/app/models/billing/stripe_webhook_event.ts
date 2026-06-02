import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class StripeWebhookEvent extends BaseModel {
  public static table = 'stripe_webhook_events'
  public static selfAssignPrimaryKey = true

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare type: string

  @column.dateTime({ autoCreate: true })
  declare processedAt: DateTime
}
