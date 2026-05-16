import type Team from '#models/team/team'
import type ApiKey from '#models/api/api_key'

declare module '@adonisjs/core/http' {
  interface HttpContext {
    dek?: Buffer
    team?: Team
    apiKey?: ApiKey
    apiClientIp?: string
    apiRawBody?: string
    apiStartedAt?: number
  }
}
