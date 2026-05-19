import type { HttpContext } from '@adonisjs/core/http'
import ApiProject from '#models/api/api_project'
import ApiKey from '#models/api/api_key'
import auditLog from '#services/api/audit_log_service'
import publicIdCodec, { PublicIdParseError } from '#services/api/public_id_codec'
import { explorerEventValidator } from '#validators/api/api_key_dashboard_validators'

export default class ExplorerEvent {
  async handle(ctx: HttpContext) {
    const { auth, params, request, response } = ctx
    const user = auth.user!
    const teamId = user.currentTeamId
    if (!teamId) return response.badRequest({ message: 'No team selected' })

    let internalId: string
    try {
      internalId = publicIdCodec.decode('api_project', params.id)
    } catch (err) {
      if (err instanceof PublicIdParseError) {
        return response.notFound({ message: 'Project not found' })
      }
      throw err
    }

    const project = await ApiProject.query()
      .where('id', internalId)
      .where('team_id', teamId)
      .first()
    if (!project) return response.notFound({ message: 'Project not found' })

    const payload = await explorerEventValidator.validate(request.body())

    let apiKeyInternalId: string | null = null
    let apiKeyLabel: string | null = null
    if (payload.api_key_id) {
      try {
        apiKeyInternalId = publicIdCodec.decode('api_key', payload.api_key_id)
        const key = await ApiKey.query()
          .where('id', apiKeyInternalId)
          .where('team_id', teamId)
          .first()
        apiKeyLabel = key?.name ?? null
      } catch (err) {
        if (!(err instanceof PublicIdParseError)) throw err
      }
    }

    const tone =
      payload.status >= 500
        ? 'server_error'
        : payload.status >= 400
          ? 'client_error'
          : payload.status === 0
            ? 'network_error'
            : 'ok'

    await auditLog.emit({
      ctx,
      teamId,
      projectId: project.id,
      action: 'api_explorer.request',
      targetType: 'explorer',
      targetId: apiKeyInternalId,
      targetLabel: apiKeyLabel ?? `${payload.method.toUpperCase()} ${payload.path}`,
      metadata: {
        method: payload.method.toUpperCase(),
        path: payload.path,
        query: payload.query ?? null,
        status: payload.status,
        latency_ms: payload.latency_ms,
        response_size_bytes: payload.response_size_bytes ?? null,
        api_key_id: payload.api_key_id ?? null,
        api_key_name: apiKeyLabel,
        tone,
        error: payload.error ?? null,
      },
    })

    return response.created({ message: 'logged' })
  }
}
