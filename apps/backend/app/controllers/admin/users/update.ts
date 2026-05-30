import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import hash from '@adonisjs/core/services/hash'
import User from '#models/account/user'
import { isAdminEmail } from '#services/auth/is_admin'

const updateUserValidator = vine.compile(
  vine.object({
    password: vine.string().minLength(1),
    fullName: vine.string().trim().maxLength(255).nullable().optional(),
    email: vine.string().trim().email().optional(),
    avatarUrl: vine.string().trim().maxLength(2000).nullable().optional(),
    emailVerified: vine.boolean().optional(),
  })
)

export default class UpdateUser {
  async handle({ auth, params, request, response }: HttpContext) {
    const admin = auth.user!
    const payload = await request.validateUsing(updateUserValidator)

    const valid = await hash.verify(admin.password, payload.password)
    if (!valid) {
      return response.unauthorized({ message: 'Mot de passe administrateur incorrect' })
    }

    const target = await User.find(params.id)
    if (!target) {
      return response.notFound({ message: 'Utilisateur introuvable' })
    }

    if (payload.email !== undefined && payload.email.toLowerCase() !== target.email.toLowerCase()) {
      if (isAdminEmail(target.email)) {
        return response.forbidden({ message: "Impossible de changer l'email d'un administrateur." })
      }
      const existing = await User.query()
        .whereRaw('LOWER(email) = ?', [payload.email.toLowerCase()])
        .first()
      if (existing && existing.id !== target.id) {
        return response.unprocessableEntity({ message: 'Cet email est déjà utilisé.' })
      }
      target.email = payload.email
    }

    if (payload.fullName !== undefined) target.fullName = payload.fullName
    if (payload.avatarUrl !== undefined) target.avatarUrl = payload.avatarUrl
    if (payload.emailVerified !== undefined) target.emailVerified = payload.emailVerified

    await target.save()

    return response.ok({
      message: 'Utilisateur mis à jour',
      user: {
        id: target.id,
        email: target.email,
        fullName: target.fullName,
        avatarUrl: target.avatarUrl,
        emailVerified: target.emailVerified,
      },
    })
  }
}
