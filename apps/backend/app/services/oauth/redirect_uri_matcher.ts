type ParsedUri = {
  readonly scheme: string
  readonly hostname: string
  readonly port: string
  readonly pathname: string
}

function parseUri(raw: string): ParsedUri | null {
  try {
    const url = new URL(raw)
    return {
      scheme: url.protocol.replace(/:$/, '').toLowerCase(),
      hostname: url.hostname.toLowerCase(),
      port: url.port,
      pathname: url.pathname || '/',
    }
  } catch {
    return null
  }
}

function matchWithGlob(pattern: string, value: string): boolean {
  if (pattern === '*' || pattern === '**') {
    return true
  }
  if (!pattern.includes('*')) {
    return pattern === value
  }
  const escaped = pattern
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*/g, '::DOUBLESTAR::')
    .replace(/\*/g, '[^/]*')
    .replace(/::DOUBLESTAR::/g, '.*')
  const regex = new RegExp(`^${escaped}$`)
  return regex.test(value)
}

function matchPort(patternPort: string, valuePort: string): boolean {
  if (patternPort === '' || patternPort === '*') {
    return true
  }
  return patternPort === valuePort
}

function isLoopbackHost(hostname: string): boolean {
  return hostname === '127.0.0.1' || hostname === 'localhost' || hostname === '[::1]'
}

export function matchRedirectUri(pattern: string, presented: string): boolean {
  if (pattern === presented) {
    return true
  }

  const parsedPattern = parseUri(pattern)
  const parsedPresented = parseUri(presented)
  if (!parsedPattern || !parsedPresented) {
    return false
  }

  if (parsedPattern.scheme !== parsedPresented.scheme) {
    return false
  }

  if (parsedPattern.scheme === 'http' || parsedPattern.scheme === 'https') {
    const patternIsLoopback = isLoopbackHost(parsedPattern.hostname)
    const presentedIsLoopback = isLoopbackHost(parsedPresented.hostname)
    if (patternIsLoopback && presentedIsLoopback) {
      if (matchWithGlob(parsedPattern.pathname, parsedPresented.pathname)) {
        return true
      }
    }
  }

  if (!matchWithGlob(parsedPattern.hostname, parsedPresented.hostname)) {
    return false
  }

  if (!matchPort(parsedPattern.port, parsedPresented.port)) {
    return false
  }

  if (!matchWithGlob(parsedPattern.pathname, parsedPresented.pathname)) {
    return false
  }

  return true
}

export function isRedirectUriAllowed(
  presented: string,
  options: {
    readonly redirectUris: readonly string[]
    readonly allowedOrigins: readonly string[]
    readonly allowAllOrigins: boolean
  }
): boolean {
  if (options.allowAllOrigins) {
    return true
  }

  if (!presented || typeof presented !== 'string') {
    return false
  }

  for (const exact of options.redirectUris) {
    if (exact === presented) {
      return true
    }
  }

  for (const pattern of options.redirectUris) {
    if (matchRedirectUri(pattern, presented)) {
      return true
    }
  }

  for (const pattern of options.allowedOrigins) {
    if (matchRedirectUri(pattern, presented)) {
      return true
    }
  }

  return false
}
