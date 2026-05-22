import type { HttpContext } from '@adonisjs/core/http'
import apiResponse from '#services/api/api_response'
import { API_PREFIX } from '#start/routes/_prefix'
import { API_PLATFORM_PREFIX } from '#start/routes/api_platform/_pipeline'

export default class NotFound {
  async handle(ctx: HttpContext) {
    return apiResponse.error(ctx.response, 404, {
      code: 'endpoint_not_found',
      message: `Endpoint inconnu. La surface ${API_PLATFORM_PREFIX} expose uniquement les méta-endpoints (ping, session). Les ressources métier sont sur ${API_PREFIX || '/'}.`,
      request_id: ctx.requestId,
      details: {
        method: ctx.request.method(),
        path: ctx.request.url(),
        available_endpoints: [`${API_PLATFORM_PREFIX}/ping`, `${API_PLATFORM_PREFIX}/session`],
        resources_base: API_PREFIX || '/',
      },
    })
  }
}
