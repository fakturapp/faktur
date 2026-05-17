import type { HttpContext } from '@adonisjs/core/http'
import AuditLog from '#models/shared/audit_log'
import { realClientIp } from '#services/http/real_client_ip'

type AuditSeverity = 'info' | 'warning' | 'critical'

interface AuditEvent {
  action: string
  resourceType: string
  resourceId?: string | null
  severity?: AuditSeverity
  metadata?: Record<string, unknown> | null
}

export async function recordAuditEvent(ctx: HttpContext, event: AuditEvent) {
  const user = ctx.auth.user

  await AuditLog.create({
    userId: user?.id || null,
    action: event.action,
    resourceType: event.resourceType,
    resourceId: event.resourceId || null,
    ipAddress: realClientIp(ctx),
    userAgent: ctx.request.header('user-agent') || null,
    severity: event.severity || 'info',
    metadata: event.metadata || null,
  })
}
