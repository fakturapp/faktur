import type { HttpContext } from '@adonisjs/core/http'

function isPrivateOrLocal(ip: string): boolean {
  if (!ip) return true
  if (ip === '127.0.0.1' || ip === '::1' || ip === 'localhost') return true
  if (ip.startsWith('10.')) return true
  if (ip.startsWith('192.168.')) return true
  if (ip.startsWith('169.254.')) return true
  if (ip.startsWith('fe80:')) return true
  if (ip.startsWith('fc') || ip.startsWith('fd')) return true
  const m = ip.match(/^172\.(\d+)\./)
  if (m) {
    const second = Number(m[1])
    if (second >= 16 && second <= 31) return true
  }
  return false
}

function normalize(ip: string): string {
  let s = ip.trim()
  if (s.startsWith('[') && s.includes(']')) s = s.slice(1, s.indexOf(']'))
  const lastColon = s.lastIndexOf(':')
  if (lastColon > 0 && s.indexOf(':') === lastColon) {
    const port = s.slice(lastColon + 1)
    if (/^\d+$/.test(port)) s = s.slice(0, lastColon)
  }
  if (s.startsWith('::ffff:')) s = s.slice(7)
  return s
}

export function realClientIp(ctx: HttpContext): string {
  const headers = ctx.request.headers()
  const cf = headers['cf-connecting-ip']
  if (typeof cf === 'string' && cf.length > 0) {
    const ip = normalize(cf)
    if (ip) return ip
  }

  const real = headers['x-real-ip']
  if (typeof real === 'string' && real.length > 0) {
    const ip = normalize(real)
    if (ip && !isPrivateOrLocal(ip)) return ip
  }

  const fwd = headers['x-forwarded-for']
  const fwdStr = Array.isArray(fwd) ? fwd[0] : fwd
  if (typeof fwdStr === 'string' && fwdStr.length > 0) {
    const candidates = fwdStr.split(',').map((s) => normalize(s))
    for (const candidate of candidates) {
      if (candidate && !isPrivateOrLocal(candidate)) return candidate
    }
    if (candidates.length > 0 && candidates[0]) return candidates[0]
  }

  if (typeof real === 'string' && real.length > 0) {
    const ip = normalize(real)
    if (ip) return ip
  }

  return ctx.request.ip()
}
