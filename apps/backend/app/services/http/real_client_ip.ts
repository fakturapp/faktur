import type { HttpContext } from '@adonisjs/core/http'
import net from 'node:net'

function isPrivateOrLocal(ip: string): boolean {
  if (!ip) return true
  if (ip === '127.0.0.1' || ip === '::1' || ip === 'localhost') return true
  if (ip.startsWith('10.')) return true
  if (ip.startsWith('192.168.')) return true
  if (ip.startsWith('169.254.')) return true
  if (/^fe80:/i.test(ip)) return true
  if (/^(fc|fd)[0-9a-f]{2}:/i.test(ip)) return true
  const m = ip.match(/^172\.(\d+)\./)
  if (m) {
    const second = Number(m[1])
    if (second >= 16 && second <= 31) return true
  }
  return false
}

function normalize(raw: string): string {
  let s = raw.trim()
  if (!s) return ''
  if (s.startsWith('[') && s.includes(']')) {
    const end = s.indexOf(']')
    const tail = s.slice(end + 1)
    s = s.slice(1, end)
    if (tail.startsWith(':') && /^:\d+$/.test(tail)) {
      // bracketed form with trailing :port — already handled by the slice above
    }
  } else {
    const lastColon = s.lastIndexOf(':')
    if (lastColon > 0 && s.indexOf(':') === lastColon) {
      const port = s.slice(lastColon + 1)
      if (/^\d+$/.test(port)) s = s.slice(0, lastColon)
    }
  }
  if (s.toLowerCase().startsWith('::ffff:')) s = s.slice(7)
  if (net.isIPv6(s)) s = s.toLowerCase()
  return s
}

function ipKind(ip: string): 'v4' | 'v6' | 'other' {
  if (net.isIPv4(ip)) return 'v4'
  if (net.isIPv6(ip)) return 'v6'
  return 'other'
}

function collectCandidates(ctx: HttpContext): string[] {
  const headers = ctx.request.headers()
  const out: string[] = []
  const push = (raw: unknown) => {
    if (typeof raw !== 'string') return
    for (const piece of raw.split(',')) {
      const norm = normalize(piece)
      if (norm) out.push(norm)
    }
  }
  push(headers['cf-connecting-ip'])
  push(headers['x-real-ip'])
  push(headers['x-forwarded-for'])
  return out
}

export function realClientIp(ctx: HttpContext): string {
  const candidates = collectCandidates(ctx)
  const publicV4 = candidates.find((ip) => ipKind(ip) === 'v4' && !isPrivateOrLocal(ip))
  if (publicV4) return publicV4
  const publicV6 = candidates.find((ip) => ipKind(ip) === 'v6' && !isPrivateOrLocal(ip))
  if (publicV6) return publicV6
  const anyPublic = candidates.find((ip) => !isPrivateOrLocal(ip))
  if (anyPublic) return anyPublic
  const first = candidates[0]
  if (first) return first
  return normalize(ctx.request.ip())
}
