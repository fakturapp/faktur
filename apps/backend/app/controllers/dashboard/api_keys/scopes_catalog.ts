import type { HttpContext } from '@adonisjs/core/http'
import { KNOWN_RESOURCES, ACTIONS_BY_RESOURCE, allKnownScopes } from '#services/api/scope_checker'
import { WEBHOOK_EVENT_CATEGORIES, WEBHOOK_EVENT_TYPES } from '#services/api/webhook_events'

export default class ScopesCatalog {
  async handle({ response }: HttpContext) {
    return response.ok({
      data: {
        resources: KNOWN_RESOURCES.map((r) => ({
          name: r,
          actions: ACTIONS_BY_RESOURCE[r],
          scopes: ACTIONS_BY_RESOURCE[r].map((a) => `${r}:${a}`),
        })),
        all_scopes: allKnownScopes(),
        webhook_events: WEBHOOK_EVENT_TYPES,
        webhook_event_categories: WEBHOOK_EVENT_CATEGORIES,
        presets: {
          read_only: allKnownScopes().filter((s) => s.endsWith(':read')),
          read_write: allKnownScopes().filter((s) => s.endsWith(':read') || s.endsWith(':write')),
          full_access: ['*'],
        },
      },
    })
  }
}
