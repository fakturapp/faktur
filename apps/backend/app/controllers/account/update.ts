import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'

const updateProfileValidator = vine.compile(
  vine.object({
    fullName: vine.string().trim().minLength(2).maxLength(255).optional(),
    avatarUrl: vine.string().trim().maxLength(500).optional(),
  })
)

export default class Update {
  async handle({ auth, request, response }: HttpContext) {
    const user = auth.user!
    const payload = await request.validateUsing(updateProfileValidator)

    if (payload.fullName !== undefined) user.fullName = payload.fullName
    if (payload.avatarUrl !== undefined) user.avatarUrl = payload.avatarUrl

    await user.save()

    return response.ok({
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        avatarUrl: user.avatarUrl,
      },
    })
  }
}
