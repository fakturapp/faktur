import type { ApplicationService } from '@adonisjs/core/types'
import logger from '@adonisjs/core/services/logger'
import env from '#start/env'

const POLL_INTERVAL_MS = 10_000

export default class ApiV2WebhookProvider {
  constructor(protected app: ApplicationService) {}

  #timer: NodeJS.Timeout | null = null
  #running = false

  async ready() {
    if (this.app.getEnvironment() !== 'web') return
    if (env.get('NODE_ENV') === 'test') return
    if (env.get('API_V2_WEBHOOK_WORKER', 'true') === 'false') return

    logger.info('[api-v2] webhook dispatch worker enabled, polling every 10s')
    this.#timer = setInterval(() => {
      void this.#tick()
    }, POLL_INTERVAL_MS)

    if (this.#timer.unref) this.#timer.unref()
  }

  async #tick() {
    if (this.#running) return
    this.#running = true
    try {
      const { default: webhookDispatcher } = await import(
        '#services/api/webhook_dispatcher'
      )
      const processed = await webhookDispatcher.dispatchPending(25)
      if (processed > 0) {
        logger.debug({ processed }, '[api-v2] webhook batch dispatched')
      }
    } catch (err) {
      logger.error({ err }, '[api-v2] webhook worker crashed')
    } finally {
      this.#running = false
    }
  }

  async shutdown() {
    if (this.#timer) {
      clearInterval(this.#timer)
      this.#timer = null
    }
  }
}
