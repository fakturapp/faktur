import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import vine from '@vinejs/vine'
import { validateDeletionSession } from './_helpers.js'

const verifyCodeValidator = vine.compile(
  vine.object({
    code: vine.string().trim(),
  })
)

export default class VerifyCode {
  async handle({ auth, request, response }: HttpContext) {
    const user = auth.user!
    const token = request.header('x-deletion-token')

    const error = validateDeletionSession(user, token, 3)
    if (error) return response.badRequest({ message: error })

    const payload = await request.validateUsing(verifyCodeValidator)

    if (!user.deletionCode || !user.deletionCodeExpiresAt) {
      return response.badRequest({ message: "Aucun code n'a été envoyé" })
    }

    if (DateTime.now() > user.deletionCodeExpiresAt) {
      return response.badRequest({ message: 'Le code a expiré' })
    }

    if (payload.code !== user.deletionCode) {
      return response.unprocessableEntity({ message: 'Code incorrect' })
    }

    // Clear code and advance step
    user.deletionCode = null
    user.deletionCodeExpiresAt = null
    user.deletionStep = 4
    await user.save()

    return response.ok({ message: 'Code vérifié' })
  }
}
