import { DateTime } from 'luxon'
import ApiKeyWebhook from '#models/api/api_key_webhook'
import ApiWebhookDelivery from '#models/api/api_webhook_delivery'
import encryptionService from '#services/encryption/encryption_service'
import webhookSigner from '#services/api/webhook_signer'
import logger from '@adonisjs/core/services/logger'

export const RETRY_DELAYS_SECONDS = [0, 30, 120, 600, 3600, 21600, 86400] as const
export const MAX_ATTEMPTS = RETRY_DELAYS_SECONDS.length + 1
export const REQUEST_TIMEOUT_MS = 10_000
export const CONSECUTIVE_410_DEACTIVATE_THRESHOLD = 5

export interface DispatchOutcome {
  delivered: boolean
  statusCode: number | null
  error: string | null
  latencyMs: number
}

class WebhookDispatcher {
  async dispatch(delivery: ApiWebhookDelivery): Promise<DispatchOutcome> {
    const webhook = await ApiKeyWebhook.query()
      .where('apiKeyId', delivery.apiKeyId)
      .first()

    if (!webhook) {
      delivery.status = 'failed_permanent'
      delivery.lastError = 'webhook_config_missing'
      delivery.nextAttemptAt = null
      await delivery.save()
      return { delivered: false, statusCode: null, error: 'webhook_config_missing', latencyMs: 0 }
    }

    delivery.status = 'in_flight'
    delivery.attemptCount += 1
    await delivery.save()

    let rawBody: string
    try {
      rawBody = encryptionService.decrypt(delivery.encryptedPayload)
    } catch (err) {
      delivery.status = 'failed_permanent'
      delivery.lastError = `payload_decrypt_failed: ${(err as Error).message}`
      delivery.nextAttemptAt = null
      await delivery.save()
      return {
        delivered: false,
        statusCode: null,
        error: delivery.lastError,
        latencyMs: 0,
      }
    }

    let secret: string
    try {
      secret = encryptionService.decrypt(webhook.secretHash)
    } catch {
      secret = webhook.secretHash
    }

    const signed = webhookSigner.sign(rawBody, secret)
    const start = Date.now()
    let statusCode: number | null = null
    let errorMessage: string | null = null

    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
      const response = await fetch(delivery.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Faktur-Webhooks/2.0',
          'X-Faktur-Signature': signed.signature,
          'X-Faktur-Event-Id': delivery.eventId,
          'X-Faktur-Event-Type': delivery.eventType,
          'X-Faktur-Delivery': String(delivery.attemptCount),
        },
        body: rawBody,
        signal: controller.signal,
      })
      clearTimeout(timer)
      statusCode = response.status
    } catch (err) {
      errorMessage = (err as Error).message || 'network_error'
    }

    const latencyMs = Date.now() - start
    const ok = statusCode !== null && statusCode >= 200 && statusCode < 300

    delivery.lastStatusCode = statusCode
    delivery.lastError = ok ? null : errorMessage ?? `non_2xx_status_${statusCode}`

    if (ok) {
      delivery.status = 'delivered'
      delivery.deliveredAt = DateTime.now()
      delivery.nextAttemptAt = null
      webhook.lastDeliveryAt = DateTime.now()
      webhook.lastDeliveryStatus = 'delivered'
      webhook.consecutiveFailures = 0
    } else if (delivery.attemptCount >= MAX_ATTEMPTS) {
      delivery.status = 'failed_permanent'
      delivery.nextAttemptAt = null
      webhook.lastDeliveryStatus = 'failed_permanent'
      webhook.consecutiveFailures += 1
    } else {
      delivery.status = 'failed'
      const delaySeconds = RETRY_DELAYS_SECONDS[delivery.attemptCount] ?? 86400
      delivery.nextAttemptAt = DateTime.now().plus({ seconds: delaySeconds })
      webhook.lastDeliveryStatus = 'failed'
      webhook.consecutiveFailures += 1
    }

    if (statusCode === 410 && webhook.consecutiveFailures >= CONSECUTIVE_410_DEACTIVATE_THRESHOLD) {
      webhook.isActive = false
    }

    webhook.lastDeliveryAt = DateTime.now()
    await Promise.all([delivery.save(), webhook.save()])

    if (!ok) {
      logger.warn(
        { delivery_id: delivery.id, attempt: delivery.attemptCount, status: statusCode, error: errorMessage },
        'api-v2 webhook delivery failed'
      )
    }

    return { delivered: ok, statusCode, error: errorMessage, latencyMs }
  }

  async dispatchPending(batchSize = 25): Promise<number> {
    const pending = await ApiWebhookDelivery.query()
      .whereIn('status', ['pending', 'failed'])
      .where('next_attempt_at', '<=', DateTime.now().toSQL()!)
      .orderBy('next_attempt_at', 'asc')
      .limit(batchSize)

    let processed = 0
    for (const delivery of pending) {
      try {
        await this.dispatch(delivery)
      } catch (err) {
        logger.error({ err, delivery_id: delivery.id }, 'webhook dispatch crashed')
      }
      processed += 1
    }
    return processed
  }
}

export default new WebhookDispatcher()
