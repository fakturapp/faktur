import type { HttpContext } from '@adonisjs/core/http'
import { loadKeyWithWebhook, applyDeliveryConfigUpdate } from './webhook_delivery_config.js'

export default class WebhookDeliveryConfigUpdate {
  async handle(ctx: HttpContext) {
    const loaded = await loadKeyWithWebhook(ctx)
    if (!loaded) return
    return applyDeliveryConfigUpdate(ctx, loaded)
  }
}
