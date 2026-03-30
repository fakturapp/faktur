import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import crypto from 'node:crypto'

export default class Start {
  async handle({ auth, response }: HttpContext) {
    const user = auth.user!

    // Generate a unique deletion token
    const token = crypto.randomBytes(32).toString('hex')

    user.deletionToken = token
    user.deletionStep = 0
    user.deletionCode = null
    user.deletionCodeExpiresAt = null
    user.deletionStartedAt = DateTime.now()
    await user.save()

    return response.ok({
      token,
      message: 'Session de suppression initiée',
    })
  }
}
