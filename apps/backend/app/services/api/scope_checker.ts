export const KNOWN_RESOURCES = [
  'invoices',
  'quotes',
  'credit_notes',
  'recurring_invoices',
  'clients',
  'products',
  'expenses',
  'reminders',
  'payment_links',
  'bank_accounts',
  'company',
  'team',
  'email',
  'einvoicing',
  'webhooks',
  'files',
  'ai',
] as const

export type KnownResource = (typeof KNOWN_RESOURCES)[number]

export const ACTIONS_BY_RESOURCE: Record<KnownResource, readonly string[]> = {
  invoices: ['read', 'write', 'delete', 'send'],
  quotes: ['read', 'write', 'delete', 'send'],
  credit_notes: ['read', 'write', 'delete', 'send'],
  recurring_invoices: ['read', 'write', 'delete'],
  clients: ['read', 'write', 'delete'],
  products: ['read', 'write', 'delete'],
  expenses: ['read', 'write', 'delete'],
  reminders: ['read', 'write', 'delete', 'send'],
  payment_links: ['read', 'write', 'delete'],
  bank_accounts: ['read', 'write', 'delete'],
  company: ['read', 'write'],
  team: ['read'],
  email: ['send'],
  einvoicing: ['read', 'submit'],
  webhooks: ['manage'],
  files: ['read'],
  ai: ['use'],
}

export function allKnownScopes(): string[] {
  const scopes: string[] = []
  for (const resource of KNOWN_RESOURCES) {
    for (const action of ACTIONS_BY_RESOURCE[resource]) {
      scopes.push(`${resource}:${action}`)
    }
  }
  return scopes
}

const SCOPE_RE = /^([a-z][a-z_]*):([a-z*]+|\*)$/

export class ScopeChecker {
  validate(scope: string): boolean {
    if (scope === '*') return true
    return SCOPE_RE.test(scope)
  }

  hasScope(grantedScopes: string[], requiredScope: string): boolean {
    if (grantedScopes.includes('*')) return true
    if (grantedScopes.includes(requiredScope)) return true

    const colonIdx = requiredScope.indexOf(':')
    if (colonIdx <= 0) return false

    const resource = requiredScope.slice(0, colonIdx)
    if (grantedScopes.includes(`${resource}:*`)) return true

    return false
  }

  hasAllScopes(grantedScopes: string[], requiredScopes: string[]): boolean {
    return requiredScopes.every((s) => this.hasScope(grantedScopes, s))
  }

  expandWildcards(scopes: string[]): string[] {
    const result = new Set<string>()
    for (const scope of scopes) {
      if (scope === '*') {
        for (const s of allKnownScopes()) result.add(s)
        continue
      }
      if (scope.endsWith(':*')) {
        const resource = scope.slice(0, -2) as KnownResource
        const actions = ACTIONS_BY_RESOURCE[resource]
        if (actions) {
          for (const action of actions) result.add(`${resource}:${action}`)
        }
        continue
      }
      result.add(scope)
    }
    return Array.from(result).sort()
  }

  normalize(scopes: string[]): string[] {
    if (scopes.includes('*')) return ['*']

    const result = new Set<string>()
    const wildcardResources = new Set<string>()

    for (const scope of scopes) {
      if (scope.endsWith(':*')) {
        wildcardResources.add(scope.slice(0, -2))
        result.add(scope)
      }
    }

    for (const scope of scopes) {
      if (scope === '*' || scope.endsWith(':*')) continue
      const colonIdx = scope.indexOf(':')
      if (colonIdx <= 0) continue
      const resource = scope.slice(0, colonIdx)
      if (wildcardResources.has(resource)) continue
      result.add(scope)
    }

    return Array.from(result).sort()
  }
}

export default new ScopeChecker()
