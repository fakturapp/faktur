import type { HttpContext } from '@adonisjs/core/http'
import apiResponse from '#services/api/api_response'

const RESOURCES = [
  'clients',
  'invoices',
  'quotes',
  'credit-notes',
  'recurring-invoices',
  'products',
  'expenses',
  'bank-accounts',
  'company',
  'team',
] as const

function levenshtein(a: string, b: string): number {
  if (a === b) return 0
  if (a.length === 0) return b.length
  if (b.length === 0) return a.length
  const dp: number[][] = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0))
  for (let i = 0; i <= a.length; i++) dp[i][0] = i
  for (let j = 0; j <= b.length; j++) dp[0][j] = j
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost)
    }
  }
  return dp[a.length][b.length]
}

function suggestResource(presented: string): string | null {
  let best: { name: string; dist: number } | null = null
  for (const r of RESOURCES) {
    const d = levenshtein(presented.toLowerCase(), r)
    if (best === null || d < best.dist) best = { name: r, dist: d }
  }
  if (!best) return null
  if (best.dist === 0) return null
  if (best.dist > Math.max(2, Math.floor(best.name.length / 2))) return null
  return best.name
}

export default class NotFound {
  async handle(ctx: HttpContext) {
    const url = ctx.request.url()
    const segments = url.split('/').filter(Boolean)
    const v2Idx = segments.indexOf('v2')
    const resourceCandidate = v2Idx >= 0 ? (segments[v2Idx + 1] ?? '') : ''
    const suggestion = resourceCandidate ? suggestResource(resourceCandidate) : null

    const hint = suggestion
      ? `Endpoint inconnu. Tu voulais dire /api/v2/${suggestion} ?`
      : 'Endpoint inconnu. Vérifie la documentation pour les routes disponibles.'

    return apiResponse.error(ctx.response, 404, {
      code: 'endpoint_not_found',
      message: hint,
      request_id: ctx.requestId,
      details: {
        method: ctx.request.method(),
        path: url,
        suggestion: suggestion ? `/api/v2/${suggestion}` : null,
        available_resources: RESOURCES.map((r) => `/api/v2/${r}`),
      },
    })
  }
}
