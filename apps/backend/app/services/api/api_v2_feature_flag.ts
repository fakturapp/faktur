import env from '#start/env'

const ALLOW_ALL = '*'

class ApiV2FeatureFlag {
  /**
   * Is API V2 enabled for the given team?
   *
   * Controlled by env vars (priority order):
   *   API_V2_ENABLED=true|false         (global toggle, default true)
   *   API_V2_TEAM_ALLOWLIST=tm_a,tm_b  (closed beta — only listed teams)
   *
   * When allowlist is set, all teams not in it get a 403 from the middleware.
   * Empty allowlist or "*" means everyone is allowed.
   */
  isEnabled(teamId: string): boolean {
    if (env.get('API_V2_ENABLED', 'true') === 'false') return false

    const allowlist = env.get('API_V2_TEAM_ALLOWLIST', '').trim()
    if (!allowlist || allowlist === ALLOW_ALL) return true

    const ids = allowlist
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    return ids.includes(teamId)
  }

  isGloballyEnabled(): boolean {
    return env.get('API_V2_ENABLED', 'true') !== 'false'
  }
}

export default new ApiV2FeatureFlag()
