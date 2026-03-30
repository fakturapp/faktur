import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import { validateDeletionSession } from './_helpers.js'

const verifyNameValidator = vine.compile(
  vine.object({
    fullName: vine.string().trim(),
  })
)

export default class VerifyName {
  async handle({ auth, request, response }: HttpContext) {
    const user = auth.user!
    const token = request.header('x-deletion-token')

    const error = validateDeletionSession(user, token)
    if (error) return response.badRequest({ message: error })

    const payload = await request.validateUsing(verifyNameValidator)

    if (payload.fullName !== user.fullName) {
      return response.unprocessableEntity({ message: 'Le nom ne correspond pas' })
    }

    user.deletionStep = 3
    await user.save()

    return response.ok({ message: 'Nom vérifié' })
  }
}
