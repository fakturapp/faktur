import type { HttpContext } from '@adonisjs/core/http'
import { setTimeout as delay } from 'node:timers/promises'
import { checkEmailValidator } from '#validators/auth/auth_validators'

export default class CheckEmail {
  async handle({ request, response }: HttpContext) {
    const payload = await request.validateUsing(checkEmailValidator)

    const start = Date.now()
    const localPart = payload.email.split('@')[0]?.trim() ?? ''
    const body = {
      exists: true,
      avatarUrl: null,
      initial: (localPart[0] ?? payload.email[0] ?? '?').toUpperCase(),
    }

    const elapsed = Date.now() - start
    const minLatencyMs = 180
    if (elapsed < minLatencyMs) {
      await delay(minLatencyMs - elapsed)
    }

    return response.ok(body)
  }
}
