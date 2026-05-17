import type { HttpContext } from '@adonisjs/core/http'
import { loadKeyWithWebhook, serializeDeliveryConfig } from './webhook_delivery_config.js'

export default class WebhookDeliveryConfigShow {
  async handle(ctx: HttpContext) {
    const loaded = await loadKeyWithWebhook(ctx)
    if (!loaded) return
    return ctx.response.ok({ data: serializeDeliveryConfig(loaded.key.webhook) })
  }
}
