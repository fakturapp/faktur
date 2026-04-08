import { DateTime } from 'luxon'
import crypto from 'node:crypto'
import OauthApp from '#models/oauth/oauth_app'
import OauthWebhookDelivery from '#models/oauth/oauth_webhook_delivery'
import oauthCrypto from '#services/oauth/oauth_crypto_service'
import oauthAppService from '#services/oauth/oauth_app_service'
import encryptionService from '#services/encryption/encryption_service'
import type { OauthWebhookEvent } from '#services/oauth/oauth_constants'
import logger from '@adonisjs/core/services/logger'

class OauthWebhookService {
  private static RETRY_BACKOFF_SECONDS = [30, 120, 600, 3600, 10_800]
  private static MAX_ATTEMPTS = 5

  async enqueue(app: OauthApp, event: OauthWebhookEvent, payload: Record<string, unknown>): Promise<void> {
    if (!app.subscribesTo(event)) return
    if (!app.webhookUrl) return

    const eventId = crypto.randomUUID()
    const fullPayload = {
      id: eventId,
      type: event,
      created_at: DateTime.now().toISO(),
      data: payload,
    }

    const encrypted = encryptionService.encrypt(JSON.stringify(fullPayload))

    await OauthWebhookDelivery.create({
      oauthAppId: app.id,
      eventType: event,
      eventId,
      url: app.webhookUrl,
      encryptedPayload: encrypted,
      status: 'pending',
      attemptCount: 0,
      lastStatusCode: null,
      lastError: null,
      deliveredAt: null,
      nextAttemptAt: DateTime.now(),
    })

    this.attemptDelivery(eventId).catch((err) => {
      logger.error({ err, eventId }, 'webhook: attempt dispatch failed')
    })
  }

  async attemptDelivery(eventId: string): Promise<void> {
    const delivery = await OauthWebhookDelivery.query().where('event_id', eventId).first()
    if (!delivery) return
    if (delivery.status === 'delivered' || delivery.status === 'dead') return

    const app = await OauthApp.find(delivery.oauthAppId)
    if (!app) {
      delivery.status = 'dead'
      delivery.lastError = 'OAuth app no longer exists'
      await delivery.save()
      return
    }

    const secret = oauthAppService.getWebhookSecret(app)
    if (!secret) {
      delivery.status = 'dead'
      delivery.lastError = 'Missing webhook secret'
      await delivery.save()
      return
    }

    let payloadJson: string
    try {
      payloadJson = encryptionService.decrypt(delivery.encryptedPayload)
    } catch (err) {
      delivery.status = 'dead'
      delivery.lastError = 'Payload decryption failed'
      await delivery.save()
      return
    }

    const signature = oauthCrypto.hmacSign(payloadJson, secret)
    const timestamp = Math.floor(Date.now() / 1000).toString()

    delivery.attemptCount += 1

    try {
      const response = await fetch(delivery.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Faktur-Webhooks/1.0',
          'X-Faktur-Event': delivery.eventType,
          'X-Faktur-Event-Id': delivery.eventId,
          'X-Faktur-Timestamp': timestamp,
          'X-Faktur-Signature': `sha256=${signature}`,
        },
        body: payloadJson,
        // 10-second hard cap so a slow subscriber can't pin a worker.
        signal: AbortSignal.timeout(10_000),
      })

      delivery.lastStatusCode = response.status
      if (response.ok) {
        delivery.status = 'delivered'
        delivery.deliveredAt = DateTime.now()
        delivery.nextAttemptAt = null
        delivery.lastError = null
      } else {
        delivery.lastError = `HTTP ${response.status}`
        this.scheduleRetry(delivery)
      }
    } catch (err: any) {
      delivery.lastError = err?.message || 'network error'
      this.scheduleRetry(delivery)
    }

    await delivery.save()
  }

  /**
   * Picks the next backoff slot based on attempt count. After MAX_ATTEMPTS,
   * the delivery is marked 'dead' and no more retries happen.
   */
  private scheduleRetry(delivery: OauthWebhookDelivery): void {
    if (delivery.attemptCount >= OauthWebhookService.MAX_ATTEMPTS) {
      delivery.status = 'dead'
      delivery.nextAttemptAt = null
      return
    }
    const idx = Math.min(delivery.attemptCount - 1, OauthWebhookService.RETRY_BACKOFF_SECONDS.length - 1)
    const wait = OauthWebhookService.RETRY_BACKOFF_SECONDS[idx]
    delivery.status = 'failed'
    delivery.nextAttemptAt = DateTime.now().plus({ seconds: wait })
  }

  /**
   * Worker tick: grabs every delivery scheduled for retry before now and
   * tries them one by one. Intended to be called by the hooks worker
   * loop at a regular interval.
   */
  async tickRetries(): Promise<number> {
    const pending = await OauthWebhookDelivery.query()
      .whereIn('status', ['pending', 'failed'])
      .where('next_attempt_at', '<=', DateTime.now().toSQL()!)
      .limit(50)

    for (const d of pending) {
      await this.attemptDelivery(d.eventId)
    }
    return pending.length
  }
}

export default new OauthWebhookService()
