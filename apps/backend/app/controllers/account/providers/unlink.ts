import type { HttpContext } from '@adonisjs/core/http'
import AuthProvider from '#models/account/auth_provider'
import AuditLog from '#models/shared/audit_log'

export default class UnlinkProvider {
  async handle({ auth, request, response }: HttpContext) {
    const user = auth.user!
    const { provider } = request.only(['provider'])

    if (!provider) {
      return response.badRequest({ message: 'Provider is required' })
    }

    const authProvider = await AuthProvider.query()
      .where('userId', user.id)
      .where('provider', provider)
      .first()

    if (!authProvider) {
      return response.notFound({ message: 'Provider not found' })
    }

    await AuditLog.create({
      userId: user.id,
      action: 'user.provider.unlinked',
      resourceType: 'auth_provider',
      metadata: { provider: authProvider.provider, email: authProvider.email },
      ipAddress: request.ip(),
      userAgent: request.header('user-agent'),
      severity: 'info',
    })

    await authProvider.delete()

    return response.ok({ message: 'Provider unlinked successfully' })
  }
}
