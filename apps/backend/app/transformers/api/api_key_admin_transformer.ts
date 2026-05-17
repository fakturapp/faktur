import type ApiKey from '#models/api/api_key'
import type ApiKeyWebhook from '#models/api/api_key_webhook'
import type ApiWebhookDelivery from '#models/api/api_webhook_delivery'
import type ApiRequestLog from '#models/api/api_request_log'
import publicIdCodec from '#services/api/public_id_codec'

export interface ApiKeyAdminShape {
  id: string
  project_id: string
  name: string
  prefix: string
  masked_token: string
  scopes: string[]
  rate_limit_tier: string
  allowed_ips: string[] | null
  expires_at: string | null
  last_used_at: string | null
  last_ip: string | null
  usage_count: number
  status: 'active' | 'expired' | 'revoked' | 'rotating'
  revoked_at: string | null
  revoked_reason: string | null
  rotation_grace_until: string | null
  created_at: string
  updated_at: string | null
}

function statusOf(key: ApiKey): ApiKeyAdminShape['status'] {
  if (key.revokedAt) return 'revoked'
  if (key.expiresAt && key.isExpired) return 'expired'
  if (key.rotatingToId) return 'rotating'
  return 'active'
}

class ApiKeyAdminTransformer {
  transform(key: ApiKey): ApiKeyAdminShape {
    return {
      id: publicIdCodec.encode('api_key', key.id),
      project_id: publicIdCodec.encode('api_project', key.projectId),
      name: key.name,
      prefix: key.prefix,
      masked_token: `${key.prefix}…${key.last4}`,
      scopes: key.scopes,
      rate_limit_tier: key.rateLimitTier,
      allowed_ips: key.allowedIps,
      expires_at: key.expiresAt?.toISO() ?? null,
      last_used_at: key.lastUsedAt?.toISO() ?? null,
      last_ip: key.lastIp,
      usage_count: Number(key.usageCount ?? 0),
      status: statusOf(key),
      revoked_at: key.revokedAt?.toISO() ?? null,
      revoked_reason: key.revokedReason,
      rotation_grace_until: key.rotationGraceUntil?.toISO() ?? null,
      created_at: key.createdAt.toISO() ?? '',
      updated_at: key.updatedAt?.toISO() ?? null,
    }
  }

  transformMany(keys: ApiKey[]): ApiKeyAdminShape[] {
    return keys.map((k) => this.transform(k))
  }

  transformWebhook(webhook: ApiKeyWebhook): {
    id: string
    url: string
    masked_secret: string
    events: string[]
    is_active: boolean
    last_delivery_at: string | null
    last_delivery_status: string | null
    consecutive_failures: number
  } {
    return {
      id: webhook.id,
      url: webhook.url,
      masked_secret: `whsec_…${webhook.secretLast4}`,
      events: webhook.events,
      is_active: webhook.isActive,
      last_delivery_at: webhook.lastDeliveryAt?.toISO() ?? null,
      last_delivery_status: webhook.lastDeliveryStatus,
      consecutive_failures: webhook.consecutiveFailures,
    }
  }

  transformDelivery(delivery: ApiWebhookDelivery): {
    id: string
    event_type: string
    event_id: string
    url: string
    status: string
    attempt_count: number
    last_status_code: number | null
    last_error: string | null
    delivered_at: string | null
    next_attempt_at: string | null
    created_at: string
  } {
    return {
      id: publicIdCodec.encode('webhook_delivery', delivery.id),
      event_type: delivery.eventType,
      event_id: delivery.eventId,
      url: delivery.url,
      status: delivery.status,
      attempt_count: delivery.attemptCount,
      last_status_code: delivery.lastStatusCode,
      last_error: delivery.lastError,
      delivered_at: delivery.deliveredAt?.toISO() ?? null,
      next_attempt_at: delivery.nextAttemptAt?.toISO() ?? null,
      created_at: delivery.createdAt.toISO() ?? '',
    }
  }

  transformRequestLog(log: ApiRequestLog): {
    id: number
    method: string
    path: string
    status: number
    latency_ms: number
    ip: string
    request_id: string
    error_code: string | null
    created_at: string
  } {
    return {
      id: log.id,
      method: log.method,
      path: log.path,
      status: log.status,
      latency_ms: log.latencyMs,
      ip: log.ip,
      request_id: log.requestId,
      error_code: log.errorCode,
      created_at: log.createdAt.toISO() ?? '',
    }
  }
}

export default new ApiKeyAdminTransformer()
