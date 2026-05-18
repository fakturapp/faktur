import env from '#start/env'

const ALLOW_ALL = '*'

class ApiPlatformFeatureFlag {
  isEnabled(teamId: string): boolean {
    if (this.read('ENABLED', 'true') === 'false') return false

    const allowlist = this.read('TEAM_ALLOWLIST', '').trim()
    if (!allowlist || allowlist === ALLOW_ALL) return true

    const ids = allowlist
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    return ids.includes(teamId)
  }

  isGloballyEnabled(): boolean {
    return this.read('ENABLED', 'true') !== 'false'
  }

  private read(key: 'ENABLED' | 'TEAM_ALLOWLIST', fallback: string): string {
    const platformVal = env.get(`API_PLATFORM_${key}` as 'API_PLATFORM_ENABLED', '')
    if (platformVal !== '') return String(platformVal)
    return String(env.get(`API_V2_${key}` as 'API_V2_ENABLED', fallback))
  }
}

export default new ApiPlatformFeatureFlag()
