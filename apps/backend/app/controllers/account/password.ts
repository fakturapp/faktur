import type { HttpContext } from '@adonisjs/core/http'
import hash from '@adonisjs/core/services/hash'
import vine from '@vinejs/vine'
import securityConfig from '#config/security'

const changePasswordValidator = vine.compile(
  vine.object({
    currentPassword: vine.string(),
    password: vine.string().minLength(securityConfig.password.minLength).maxLength(128).confirmed(),
  })
)

export default class Password {
  async handle({ auth, request, response }: HttpContext) {
    const user = auth.user!
    const payload = await request.validateUsing(changePasswordValidator)

    const isValid = await hash.verify(user.password, payload.currentPassword)
    if (!isValid) {
      return response.unauthorized({ message: 'Current password is incorrect' })
    }

    user.password = payload.password
    await user.save()

    return response.ok({ message: 'Password changed successfully' })
  }
}
