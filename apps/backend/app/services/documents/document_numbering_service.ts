const NUMBER_PLACEHOLDER_REGEX = /\{num(?:ero|éro|Ã©ro)\}/gi
const YEAR_PLACEHOLDER_REGEX = /\{ann(?:ee|ée|Ã©e)\}/gi

interface SequenceOptions {
  pattern: string | null | undefined
  fallbackPattern: string
  currentYear?: string
  lastNumber?: string | null
  padding?: number
}

interface ResolvePatternVariables {
  numero: string
  date?: string
  client?: string
  entreprise?: string
  annee?: string
}

class DocumentNumberingService {
  normalizePattern(pattern: string | null | undefined, fallbackPattern: string): string {
    const basePattern = pattern?.trim() || fallbackPattern

    return basePattern
      .replace(NUMBER_PLACEHOLDER_REGEX, '{numero}')
      .replace(YEAR_PLACEHOLDER_REGEX, '{annee}')
  }

  buildSequencePrefix(pattern: string | null | undefined, fallbackPattern: string, currentYear?: string) {
    return this.normalizePattern(pattern, fallbackPattern)
      .replace(/\{annee\}/gi, currentYear || new Date().getFullYear().toString())
      .replace(/\{numero\}/gi, '')
  }

  buildNextSequentialNumber({
    pattern,
    fallbackPattern,
    currentYear,
    lastNumber,
    padding = 3,
  }: SequenceOptions): string {
    const prefix = this.buildSequencePrefix(pattern, fallbackPattern, currentYear)
    let nextNumber = 1

    if (lastNumber?.startsWith(prefix)) {
      const suffix = lastNumber.slice(prefix.length)
      const parsed = Number.parseInt(suffix, 10)
      if (Number.isFinite(parsed)) {
        nextNumber = parsed + 1
      }
    }

    return `${prefix}${nextNumber.toString().padStart(padding, '0')}`
  }

  resolvePattern(pattern: string | null | undefined, fallbackPattern: string, vars: ResolvePatternVariables) {
    return this.normalizePattern(pattern, fallbackPattern)
      .replace(/\{numero\}/gi, vars.numero)
      .replace(/\{date\}/gi, vars.date || '')
      .replace(/\{client\}/gi, vars.client || '')
      .replace(/\{entreprise\}/gi, vars.entreprise || '')
      .replace(/\{annee\}/gi, vars.annee || new Date().getFullYear().toString())
  }
}

export default new DocumentNumberingService()
