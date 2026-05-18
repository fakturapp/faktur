import type { HttpContext } from '@adonisjs/core/http'
import apiResponse from '#services/api/api_response'

export default class NotFound {
  async handle(ctx: HttpContext) {
    return apiResponse.error(ctx.response, 404, {
      code: 'endpoint_not_found',
      message:
        'Endpoint inconnu. La surface /api/platform expose uniquement les méta-endpoints (ping, session). Les ressources métier sont sur /api/v1.',
      request_id: ctx.requestId,
      details: {
        method: ctx.request.method(),
        path: ctx.request.url(),
        available_endpoints: ['/api/platform/ping', '/api/platform/session'],
        resources_base: '/api/v1',
      },
    })
  }
}
