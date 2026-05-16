import crypto from 'node:crypto'
import { DateTime } from 'luxon'
import ApiKey from '#models/api/api_key'
import ApiKeyWebhook from '#models/api/api_key_webhook'
import ApiWebhookDelivery from '#models/api/api_webhook_delivery'
import encryptionService from '#services/encryption/encryption_service'
import { isKnownEvent, type WebhookEventType } from '#services/api/webhook_events'
import publicIdCodec from '#services/api/public_id_codec'

export interface EventEnvelope<T = Record<string, unknown>> {
  id: string
  type: WebhookEventType
  created_at: string
  api_version: 'v2'
  team_id: string
  data: T
  previous_data: Record<string, unknown> | null
}

export interface EmitOptions<T = Record<string, unknown>> {
  type: WebhookEventType
  teamId: string
  data: T
  previousData?: Record<string, unknown> | null
}

class WebhookEventEmitter {
  async emit<T = Record<string, unknown>>(options: EmitOptions<T>): Promise<number> {
    if (!isKnownEvent(options.type)) return 0

    const keys = await ApiKey.query()
      .where('teamId', options.teamId)
      .whereNull('revoked_at')
      .preload('webhook')

    let enqueued = 0
    for (const key of keys) {
      if (key.isExpired) continue
      const webhook = key.webhook
      if (!webhook || !webhook.isActive) continue
      if (!webhook.events.includes(options.type)) continue

      const envelope: EventEnvelope<T> = {
        id: `evt_${crypto.randomUUID()}`,
        type: options.type,
        created_at: DateTime.utc().toISO()!,
        api_version: 'v2',
        team_id: publicIdCodec.encode('team', options.teamId),
        data: options.data,
        previous_data: options.previousData ?? null,
      }

      const encryptedPayload = encryptionService.encrypt(JSON.stringify(envelope))

      await ApiWebhookDelivery.create({
        apiKeyId: key.id,
        eventType: options.type,
        eventId: envelope.id,
        url: webhook.url,
        encryptedPayload,
        status: 'pending',
        attemptCount: 0,
        nextAttemptAt: DateTime.now(),
      })
      enqueued += 1
    }
    return enqueued
  }

  async createTestDelivery(input: {
    apiKey: ApiKey
    webhook: ApiKeyWebhook
    eventType: WebhookEventType
  }): Promise<ApiWebhookDelivery> {
    const envelope: EventEnvelope = {
      id: `evt_test_${crypto.randomUUID()}`,
      type: input.eventType,
      created_at: DateTime.utc().toISO()!,
      api_version: 'v2',
      team_id: publicIdCodec.encode('team', input.apiKey.teamId),
      data: { message: 'This is a test webhook event' },
      previous_data: null,
    }
    const encryptedPayload = encryptionService.encrypt(JSON.stringify(envelope))
    return await ApiWebhookDelivery.create({
      apiKeyId: input.apiKey.id,
      eventType: input.eventType,
      eventId: envelope.id,
      url: input.webhook.url,
      encryptedPayload,
      status: 'pending',
      attemptCount: 0,
      nextAttemptAt: DateTime.now(),
    })
  }
}

export default new WebhookEventEmitter()
