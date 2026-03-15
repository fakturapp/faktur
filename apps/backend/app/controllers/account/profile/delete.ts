import type { HttpContext } from '@adonisjs/core/http'
import hash from '@adonisjs/core/services/hash'
import vine from '@vinejs/vine'

const deleteAccountValidator = vine.compile(
  vine.object({
    password: vine.string(),
  })
)

export default class Delete {
  async handle({ auth, request, response }: HttpContext) {
    const user = auth.user!
    const payload = await request.validateUsing(deleteAccountValidator)

    const isValid = await hash.verify(user.password, payload.password)
    if (!isValid) {
      return response.unauthorized({ message: 'Incorrect password' })
    }

    user.status = 'deleted'
    await user.save()

    return response.ok({ message: 'Account deleted successfully' })
  }
}
