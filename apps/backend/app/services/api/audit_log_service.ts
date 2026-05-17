import type { HttpContext } from '@adonisjs/core/http'
import ApiAuditLog, { type AuditAction, type AuditTargetType } from '#models/api/api_audit_log'
import logger from '@adonisjs/core/services/logger'

interface EmitOptions {
  ctx: HttpContext
  teamId: string
  projectId?: string | null
  action: AuditAction
  targetType: AuditTargetType
  targetId?: string | null
  targetLabel?: string | null
  metadata?: Record<string, unknown>
}

class AuditLogService {
  async emit(opts: EmitOptions): Promise<void> {
    try {
      const user = opts.ctx.auth.user ?? null
      await ApiAuditLog.create({
        teamId: opts.teamId,
        projectId: opts.projectId ?? null,
        actorUserId: user?.id ?? null,
        actorEmail: user?.email ?? null,
        actorName: (user as any)?.fullName ?? null,
        action: opts.action,
        targetType: opts.targetType,
        targetId: opts.targetId ?? null,
        targetLabel: opts.targetLabel ?? null,
        metadata: opts.metadata ?? {},
        ip: opts.ctx.request.ip(),
        userAgent: opts.ctx.request.header('user-agent') ?? null,
      })
    } catch (err) {
      logger.error({ err, action: opts.action }, 'audit_log: failed to emit')
    }
  }
}

export default new AuditLogService()
