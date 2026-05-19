import type ApiAuditLog from '#models/api/api_audit_log'

export interface AuditLogShape {
  id: number
  action: string
  target_type: string
  target_id: string | null
  target_label: string | null
  actor: {
    user_id: string | null
    name: string | null
    email: string | null
  }
  ip: string | null
  user_agent: string | null
  metadata: Record<string, unknown>
  created_at: string
}

class ApiAuditLogTransformer {
  transform(log: ApiAuditLog): AuditLogShape {
    return {
      id: log.id,
      action: log.action,
      target_type: log.targetType,
      target_id: log.targetId,
      target_label: log.targetLabel,
      actor: {
        user_id: log.actorUserId,
        name: log.actorName,
        email: log.actorEmail,
      },
      ip: log.ip,
      user_agent: log.userAgent,
      metadata: log.metadata ?? {},
      created_at: log.createdAt.toISO() ?? '',
    }
  }

  transformMany(logs: ApiAuditLog[]): AuditLogShape[] {
    return logs.map((l) => this.transform(l))
  }
}

export default new ApiAuditLogTransformer()
