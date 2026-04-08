
export interface FakturDesktopCertificationStatus {
  certified: boolean
  version?: string | null
  issuedAt?: number | null
  expiresAt?: number | null
  asarSha256?: string | null
  reason?: string | null
}

export interface FakturDesktopUpdateInfo {
  version: string
  currentVersion: string
  downloadUrl: string
  size: number
  releaseNotes?: string
  publishedAt?: string
}

export interface FakturDesktopBridge {
  isDesktop: true
  version: string
  platform?: string
  getSessionState?: () => Promise<{ state: string }>
  getAppInfo?: () => Promise<{ version: string; platform: string; isDesktop: boolean }>
  getCertificationStatus?: () => Promise<FakturDesktopCertificationStatus>
  logout?: (opts?: { wipeAll?: boolean }) => Promise<{ ok: boolean }>
  openVaultUnlock?: () => Promise<{ ok: boolean }>
  openExternal?: (url: string) => Promise<{ ok: boolean }>
  onSessionChange?: (cb: (payload: unknown) => void) => () => void

  getPendingUpdate?: () => Promise<FakturDesktopUpdateInfo | null>
  checkForUpdate?: () => Promise<FakturDesktopUpdateInfo | null>
  beginUpdate?: () => Promise<{ ok: boolean }>
  onUpdateAvailable?: (cb: (info: FakturDesktopUpdateInfo) => void) => () => void
}

export function isFakturDesktop(): boolean {
  if (typeof window === 'undefined') return false

  const bridgeFlag =
    typeof (window as any).fakturDesktop === 'object' &&
    (window as any).fakturDesktop?.isDesktop === true
  if (bridgeFlag) return true

  const ua = window.navigator?.userAgent ?? ''
  if (/FakturDesktop\/\d+/i.test(ua)) return true

  try {
    if (window.localStorage?.getItem('faktur_source') === 'desktop') return true
  } catch {
  }

  return false
}

export function getFakturDesktopBridge(): FakturDesktopBridge | null {
  if (typeof window === 'undefined') return null
  const bridge = (window as any).fakturDesktop
  if (bridge && bridge.isDesktop === true) return bridge as FakturDesktopBridge
  return null
}

export function getFakturDesktopVersion(): string | null {
  const bridge = getFakturDesktopBridge()
  if (bridge?.version) return bridge.version
  if (typeof window === 'undefined') return null
  const ua = window.navigator?.userAgent ?? ''
  const match = ua.match(/FakturDesktop\/(\d+(?:\.\d+){0,2})/i)
  return match?.[1] ?? null
}
