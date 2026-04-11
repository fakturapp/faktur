import type { HttpContext } from '@adonisjs/core/http'
import { setTimeout as delay } from 'node:timers/promises'
import User from '#models/account/user'
import { checkEmailValidator } from '#validators/auth/auth_validators'

export default class CheckEmail {
  async handle({ request, response }: HttpContext) {
    const payload = await request.validateUsing(checkEmailValidator)

    const start = Date.now()
    const user = await User.findBy('email', payload.email)

    let body: {
      exists: boolean
      avatarUrl?: string | null
      initial?: string
    }

    if (!user) {
      body = { exists: false }
    } else {
      const source = (user.fullName ?? user.email).trim()
      const firstChar = source.length > 0 ? source[0] : '?'
      body = {
        exists: true,
        avatarUrl: user.avatarUrl ?? null,
        initial: firstChar.toUpperCase(),
      }
    }

    const elapsed = Date.now() - start
    const minLatencyMs = 180
    if (elapsed < minLatencyMs) {
      await delay(minLatencyMs - elapsed)
    }

    return response.ok(body)
  }
}
