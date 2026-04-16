import { timingSafeEqual } from 'node:crypto'

export function timingSafeEqualStr(a: string | null | undefined, b: string | null | undefined): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') {
    return false
  }
  const bufA = Buffer.from(a, 'utf8')
  const bufB = Buffer.from(b, 'utf8')
  if (bufA.length !== bufB.length) {
    const max = Math.max(bufA.length, bufB.length, 1)
    const padA = Buffer.alloc(max)
    const padB = Buffer.alloc(max)
    bufA.copy(padA)
    bufB.copy(padB)
    timingSafeEqual(padA, padB)
    return false
  }
  return timingSafeEqual(bufA, bufB)
}
