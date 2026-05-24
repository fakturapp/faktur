import type { HttpContext } from '@adonisjs/core/http'
import { realClientIp } from '#services/http/real_client_ip'
import { parseUserAgent } from '#services/analytics/user_agent_parser'

export interface OauthRequestContext {
  ip: string | null
  userAgent: string | null
  deviceName: string | null
  deviceOs: string | null
  devicePlatform: string | null
}

function deviceLabelFromUa(ua: string): string {
  const parsed = parseUserAgent(ua)
  const browser = parsed.browser !== 'Unknown' ? parsed.browser : null
  const os = parsed.os !== 'Unknown' ? parsed.os : null
  if (browser && os) return `${browser} sur ${os}`
  if (browser) return browser
  if (os) return os
  return 'Navigateur'
}

export function extractOauthRequestContext(
  ctx: HttpContext,
  override?: {
    deviceName?: string | null
    devicePlatform?: string | null
    deviceOs?: string | null
  }
): OauthRequestContext {
  const ua = ctx.request.header('user-agent') ?? null
  const parsed = ua ? parseUserAgent(ua) : null
  const deviceName = override?.deviceName ?? (ua ? deviceLabelFromUa(ua) : null)
  const deviceOs = override?.deviceOs ?? (parsed && parsed.os !== 'Unknown' ? parsed.os : null)
  const devicePlatform =
    override?.devicePlatform ?? (parsed ? parsed.deviceType : null)
  return {
    ip: realClientIp(ctx),
    userAgent: ua,
    deviceName,
    deviceOs,
    devicePlatform,
  }
}
