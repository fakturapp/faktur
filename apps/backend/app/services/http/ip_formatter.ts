import net from 'node:net'

export interface FormattedIp {
  value: string
  kind: 'ipv4' | 'ipv6' | 'unknown'
  display: string
  short: string
}

function compressIpv6(ip: string): string {
  const lower = ip.toLowerCase()
  if (lower.includes('::')) return lower
  const groups = lower.split(':')
  if (groups.length !== 8) return lower
  let bestStart = -1
  let bestLen = 0
  let curStart = -1
  let curLen = 0
  for (let i = 0; i < groups.length; i++) {
    if (groups[i] === '0' || groups[i] === '0000') {
      if (curStart === -1) curStart = i
      curLen++
      if (curLen > bestLen) {
        bestLen = curLen
        bestStart = curStart
      }
    } else {
      curStart = -1
      curLen = 0
    }
  }
  const stripped = groups.map((g) => g.replace(/^0+(?=.)/, ''))
  if (bestLen < 2) return stripped.join(':')
  const head = stripped.slice(0, bestStart).join(':')
  const tail = stripped.slice(bestStart + bestLen).join(':')
  return `${head}::${tail}`.replace(/:::+/g, '::')
}

export function formatIp(raw: string | null | undefined): FormattedIp {
  const value = (raw || '').trim()
  if (!value) {
    return { value: '', kind: 'unknown', display: '', short: '' }
  }
  if (net.isIPv4(value)) {
    return { value, kind: 'ipv4', display: value, short: value }
  }
  if (net.isIPv6(value)) {
    const compact = compressIpv6(value)
    const segments = compact.split(':').filter(Boolean)
    const short = segments.length <= 3 ? compact : `${segments.slice(0, 3).join(':')}::`
    return { value: compact, kind: 'ipv6', display: compact, short }
  }
  return { value, kind: 'unknown', display: value, short: value }
}
