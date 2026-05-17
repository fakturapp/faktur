import vine from '@vinejs/vine'

export const createApiKeyValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(1).maxLength(100),
    scopes: vine.array(vine.string().trim().minLength(1).maxLength(80)).minLength(1).maxLength(64),
    expires_at: vine.string().trim().optional(),
    allowed_ips: vine.array(vine.string().trim().maxLength(64)).maxLength(32).optional(),
    rate_limit_tier: vine.enum(['default', 'pro', 'business', 'unlimited'] as const).optional(),
  })
)

export const updateApiKeyValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(1).maxLength(100).optional(),
    scopes: vine
      .array(vine.string().trim().minLength(1).maxLength(80))
      .minLength(1)
      .maxLength(64)
      .optional(),
    allowed_ips: vine.array(vine.string().trim().maxLength(64)).maxLength(32).nullable().optional(),
  })
)

export const setWebhookValidator = vine.compile(
  vine.object({
    url: vine.string().trim().url({ require_protocol: true }).maxLength(500),
    events: vine.array(vine.string().trim().minLength(1).maxLength(80)).minLength(1).maxLength(64),
  })
)

export const testWebhookValidator = vine.compile(
  vine.object({
    event_type: vine.string().trim().minLength(1).maxLength(80).optional(),
  })
)
