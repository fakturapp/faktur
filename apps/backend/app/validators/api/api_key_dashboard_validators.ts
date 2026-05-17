import vine from '@vinejs/vine'

export const createApiKeyValidator = vine.compile(
  vine.object({
    project_id: vine.string().trim().minLength(1).maxLength(40),
    name: vine.string().trim().minLength(1).maxLength(100),
    scopes: vine.array(vine.string().trim().minLength(1).maxLength(80)).minLength(1).maxLength(64),
    expires_at: vine.string().trim().optional(),
    allowed_ips: vine.array(vine.string().trim().maxLength(64)).maxLength(32).optional(),
    rate_limit_tier: vine.enum(['default', 'pro', 'business', 'unlimited'] as const).optional(),
  })
)

export const createProjectValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(1).maxLength(100),
    description: vine.string().trim().maxLength(2000).optional().nullable(),
    color: vine.string().trim().maxLength(16).optional().nullable(),
  })
)

export const updateProjectValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(1).maxLength(100).optional(),
    description: vine.string().trim().maxLength(2000).optional().nullable(),
    color: vine.string().trim().maxLength(16).optional().nullable(),
    is_archived: vine.boolean().optional(),
  })
)

export const explorerEventValidator = vine.compile(
  vine.object({
    method: vine.string().trim().minLength(1).maxLength(10),
    path: vine.string().trim().minLength(1).maxLength(2000),
    query: vine.string().trim().maxLength(2000).optional().nullable(),
    status: vine.number().withoutDecimals(),
    latency_ms: vine.number().withoutDecimals(),
    response_size_bytes: vine.number().withoutDecimals().optional(),
    api_key_id: vine.string().trim().maxLength(64).optional().nullable(),
    error: vine.string().trim().maxLength(500).optional().nullable(),
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
