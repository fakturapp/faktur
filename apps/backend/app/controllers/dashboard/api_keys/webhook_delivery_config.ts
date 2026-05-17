import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import ApiKey from '#models/api/api_key'
import ApiKeyWebhook from '#models/api/api_key_webhook'
import publicIdCodec, { PublicIdParseError } from '#services/api/public_id_codec'
import auditLog from '#services/api/audit_log_service'

export const updateValidator = vine.compile(
  vine.object({
    deliveryMaxRetries: vine.number().min(0).max(20).optional(),
    deliveryTimeoutMs: vine.number().min(1000).max(60000).optional(),
    deliveryBackoffSeconds: vine.number().min(5).max(3600).optional(),
    deliveryCustomHeaders: vine
      .record(vine.string().trim().minLength(1).maxLength(256))
      .optional(),
  })
)

export const FORBIDDEN_HEADERS = new Set([
  'authorization',
  'content-type',
  'content-length',
  'host',
  'connection',
  'x-faktur-signature',
  'x-faktur-event',
  'x-faktur-delivery',
  'x-faktur-timestamp',
])

interface LoadOk {
  key: ApiKey & { webhook: ApiKeyWebhook }
  teamId: string
}

export async function loadKeyWithWebhook(ctx: HttpContext): Promise<LoadOk | null> {
  const { auth, params, response } = ctx
  const user = auth.user!
  const teamId = user.currentTeamId
  if (!teamId) {
    response.badRequest({ message: 'No team selected' })
    return null
  }

  let internalId: string
  try {
    internalId = publicIdCodec.decode('api_key', params.id)
  } catch (err) {
    if (err instanceof PublicIdParseError) {
      response.notFound({ message: 'API key not found' })
      return null
    }
    throw err
  }

  const key = await ApiKey.query()
    .where('id', internalId)
    .where('team_id', teamId)
    .preload('webhook')
    .first()

  if (!key) {
    response.notFound({ message: 'API key not found' })
    return null
  }
  if (!key.webhook) {
    response.notFound({ message: 'Webhook not configured for this API key.' })
    return null
  }

  return { key: key as ApiKey & { webhook: ApiKeyWebhook }, teamId }
}

export function serializeDeliveryConfig(webhook: ApiKeyWebhook) {
  return {
    delivery_max_retries: webhook.deliveryMaxRetries,
    delivery_timeout_ms: webhook.deliveryTimeoutMs,
    delivery_backoff_seconds: webhook.deliveryBackoffSeconds,
    delivery_custom_headers: webhook.deliveryCustomHeaders ?? {},
  }
}

export async function applyDeliveryConfigUpdate(
  ctx: HttpContext,
  loaded: LoadOk
): Promise<Response> {
  const payload = await updateValidator.validate(ctx.request.body())
  const webhook = loaded.key.webhook

  if (payload.deliveryCustomHeaders) {
    for (const headerName of Object.keys(payload.deliveryCustomHeaders)) {
      if (FORBIDDEN_HEADERS.has(headerName.toLowerCase())) {
        ctx.response.unprocessableEntity({
          code: 'forbidden_header',
          message: `L'en-tête « ${headerName} » est réservé par Faktur et ne peut pas être surchargé.`,
        })
        return ctx.response as never
      }
    }
  }

  if (payload.deliveryMaxRetries !== undefined) {
    webhook.deliveryMaxRetries = payload.deliveryMaxRetries
  }
  if (payload.deliveryTimeoutMs !== undefined) {
    webhook.deliveryTimeoutMs = payload.deliveryTimeoutMs
  }
  if (payload.deliveryBackoffSeconds !== undefined) {
    webhook.deliveryBackoffSeconds = payload.deliveryBackoffSeconds
  }
  if (payload.deliveryCustomHeaders !== undefined) {
    webhook.deliveryCustomHeaders = payload.deliveryCustomHeaders
  }
  await webhook.save()

  await auditLog.emit({
    ctx,
    teamId: loaded.teamId,
    projectId: loaded.key.projectId,
    action: 'webhook.updated',
    targetType: 'webhook',
    targetId: webhook.id,
    targetLabel: loaded.key.name,
    metadata: {
      delivery_config: {
        max_retries: webhook.deliveryMaxRetries,
        timeout_ms: webhook.deliveryTimeoutMs,
        backoff_seconds: webhook.deliveryBackoffSeconds,
        custom_headers_count: Object.keys(webhook.deliveryCustomHeaders ?? {}).length,
      },
    },
  })

  ctx.response.ok({ data: serializeDeliveryConfig(webhook) })
  return ctx.response as never
}
