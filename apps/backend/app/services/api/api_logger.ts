import { DateTime } from 'luxon'
import ApiRequestLog from '#models/api/api_request_log'

export interface LogEntry {
  apiKeyId: string
  method: string
  path: string
  status: number
  latencyMs: number
  ip: string
  requestId: string
  errorCode?: string | null
}

class ApiLogger {
  async record(entry: LogEntry): Promise<void> {
    try {
      await ApiRequestLog.create({
        apiKeyId: entry.apiKeyId,
        method: entry.method,
        path: entry.path,
        status: entry.status,
        latencyMs: entry.latencyMs,
        ip: entry.ip,
        requestId: entry.requestId,
        errorCode: entry.errorCode ?? null,
        createdAt: DateTime.now(),
      })
    } catch {
      // intentionally swallowed: never fail a request on logging
    }
  }
}

export default new ApiLogger()
