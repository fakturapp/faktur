import type { ApplicationService } from '@adonisjs/core/types'
import logger from '@adonisjs/core/services/logger'
import env from '#start/env'

const POLL_INTERVAL_MS = 3_600_000
const INITIAL_DELAY_MS = 30_000

export default class BillingGraceProvider {
  constructor(protected app: ApplicationService) {}

  #timer: NodeJS.Timeout | null = null
  #initial: NodeJS.Timeout | null = null
  #running = false

  async ready() {
    if (this.app.getEnvironment() !== 'web') return
    if (env.get('NODE_ENV') === 'test') return

    logger.info('[billing] grace enforcement worker enabled, checking hourly')

    this.#initial = setTimeout(() => {
      void this.#tick()
    }, INITIAL_DELAY_MS)
    if (this.#initial.unref) this.#initial.unref()

    this.#timer = setInterval(() => {
      void this.#tick()
    }, POLL_INTERVAL_MS)
    if (this.#timer.unref) this.#timer.unref()
  }

  async #tick() {
    if (this.#running) return
    this.#running = true
    try {
      const { enforceExpiredGrace } = await import('#services/billing/grace_enforcer')
      const downgraded = await enforceExpiredGrace()
      if (downgraded > 0) {
        logger.info({ downgraded }, '[billing] downgraded teams past 7-day grace')
      }
    } catch (err) {
      logger.error({ err }, '[billing] grace enforcement worker crashed')
    } finally {
      this.#running = false
    }
  }

  async shutdown() {
    if (this.#initial) {
      clearTimeout(this.#initial)
      this.#initial = null
    }
    if (this.#timer) {
      clearInterval(this.#timer)
      this.#timer = null
    }
  }
}
