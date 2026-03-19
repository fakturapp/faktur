'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Check, ChevronsUpDown, Search } from 'lucide-react'

const COUNTRIES = [
  { code: 'FR', dial: '33', flag: '🇫🇷', name: 'France', maxDigits: 9, format: [1, 2, 2, 2, 2] },
  { code: 'BE', dial: '32', flag: '🇧🇪', name: 'Belgique', maxDigits: 9, format: [3, 2, 2, 2] },
  { code: 'CH', dial: '41', flag: '🇨🇭', name: 'Suisse', maxDigits: 9, format: [2, 3, 2, 2] },
  { code: 'LU', dial: '352', flag: '🇱🇺', name: 'Luxembourg', maxDigits: 9, format: [3, 3, 3] },
  { code: 'DE', dial: '49', flag: '🇩🇪', name: 'Allemagne', maxDigits: 11, format: [3, 3, 3, 2] },
  { code: 'ES', dial: '34', flag: '🇪🇸', name: 'Espagne', maxDigits: 9, format: [3, 3, 3] },
  { code: 'IT', dial: '39', flag: '🇮🇹', name: 'Italie', maxDigits: 10, format: [3, 3, 4] },
  { code: 'GB', dial: '44', flag: '🇬🇧', name: 'Royaume-Uni', maxDigits: 10, format: [4, 3, 3] },
  { code: 'US', dial: '1', flag: '🇺🇸', name: 'États-Unis', maxDigits: 10, format: [3, 3, 4] },
  { code: 'CA', dial: '1', flag: '🇨🇦', name: 'Canada', maxDigits: 10, format: [3, 3, 4] },
  { code: 'PT', dial: '351', flag: '🇵🇹', name: 'Portugal', maxDigits: 9, format: [3, 3, 3] },
  { code: 'NL', dial: '31', flag: '🇳🇱', name: 'Pays-Bas', maxDigits: 9, format: [2, 3, 2, 2] },
  { code: 'MA', dial: '212', flag: '🇲🇦', name: 'Maroc', maxDigits: 9, format: [3, 2, 2, 2] },
] as const

type CountryCode = (typeof COUNTRIES)[number]['code']

interface PhoneInputProps {
  value: string
  onChange: (fullNumber: string) => void
  defaultCountry?: CountryCode
  className?: string
  placeholder?: string
  id?: string
  required?: boolean
  disabled?: boolean
}

function stripDigits(val: string) {
  return val.replace(/\D/g, '')
}

function detectCountry(raw: string) {
  if (!raw.startsWith('+')) return null
  const digits = raw.slice(1)
  for (const len of [3, 2, 1]) {
    const prefix = digits.slice(0, len)
    const match = COUNTRIES.find((c) => c.dial === prefix)
    if (match) return { country: match, nationalDigits: digits.slice(len) }
  }
  return null
}

function formatNumber(digits: string, format: readonly number[]) {
  const parts: string[] = []
  let pos = 0
  for (const len of format) {
    if (pos >= digits.length) break
    parts.push(digits.slice(pos, pos + len))
    pos += len
  }
  if (pos < digits.length) parts.push(digits.slice(pos))
  return parts.join(' ')
}

const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ value, onChange, defaultCountry = 'FR', className, placeholder, id, required, disabled }, ref) => {
    const [open, setOpen] = React.useState(false)
    const [search, setSearch] = React.useState('')
    const containerRef = React.useRef<HTMLDivElement>(null)
    const searchInputRef = React.useRef<HTMLInputElement>(null)

    const parsed = React.useMemo(() => {
      if (!value) return { country: COUNTRIES.find((c) => c.code === defaultCountry)!, digits: '' }
      const detected = detectCountry(value)
      if (detected) return { country: detected.country, digits: detected.nationalDigits }
      const country = COUNTRIES.find((c) => c.code === defaultCountry)!
      const stripped = stripDigits(value)
      if (stripped.startsWith('0')) return { country, digits: stripped.slice(1) }
      return { country, digits: stripped }
    }, [value, defaultCountry])

    const selectedCountry = parsed.country
    const nationalDigits = parsed.digits.slice(0, selectedCountry.maxDigits)

    const displayValue = React.useMemo(() => {
      if (!nationalDigits) return ''
      if (selectedCountry.code === 'FR') return formatNumber('0' + nationalDigits, [2, 2, 2, 2, 2])
      return formatNumber(nationalDigits, selectedCountry.format)
    }, [nationalDigits, selectedCountry])

    const filteredCountries = React.useMemo(() => {
      if (!search) return [...COUNTRIES]
      const q = search.toLowerCase()
      return COUNTRIES.filter(
        (c) => c.name.toLowerCase().includes(q) || c.dial.includes(q) || c.code.toLowerCase().includes(q)
      )
    }, [search])

    function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
      let input = e.target.value
      if (input.includes('+')) {
        const detected = detectCountry(input.replace(/\s/g, ''))
        if (detected) {
          const digits = stripDigits(detected.nationalDigits).slice(0, detected.country.maxDigits)
          onChange(`+${detected.country.dial}${digits}`)
          return
        }
      }
      let digits = stripDigits(input)
      if (selectedCountry.code === 'FR' && digits.startsWith('0')) digits = digits.slice(1)
      digits = digits.slice(0, selectedCountry.maxDigits)
      onChange(`+${selectedCountry.dial}${digits}`)
    }

    function selectCountry(code: CountryCode) {
      const country = COUNTRIES.find((c) => c.code === code)!
      const digits = nationalDigits.slice(0, country.maxDigits)
      onChange(`+${country.dial}${digits}`)
      setOpen(false)
      setSearch('')
    }

    React.useEffect(() => {
      function handleClick(e: MouseEvent) {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setOpen(false)
          setSearch('')
        }
      }
      function handleKey(e: KeyboardEvent) {
        if (e.key === 'Escape') {
          setOpen(false)
          setSearch('')
        }
      }
      if (open) {
        document.addEventListener('mousedown', handleClick)
        document.addEventListener('keydown', handleKey)
        setTimeout(() => searchInputRef.current?.focus(), 50)
      }
      return () => {
        document.removeEventListener('mousedown', handleClick)
        document.removeEventListener('keydown', handleKey)
      }
    }, [open])

    return (
      <div className="relative flex" ref={containerRef}>
        <button
          type="button"
          onClick={() => !disabled && (setOpen(!open), setSearch(''))}
          disabled={disabled}
          className={cn(
            'flex items-center gap-1.5 px-2.5 h-10 rounded-l-lg border border-r-0 border-input bg-muted/50 text-sm',
            'hover:bg-muted transition-colors shrink-0',
            'disabled:cursor-not-allowed disabled:opacity-50',
            open && 'bg-muted ring-2 ring-ring border-transparent'
          )}
        >
          <span className="text-base leading-none">{selectedCountry.flag}</span>
          <span className="text-muted-foreground text-xs tabular-nums">+{selectedCountry.dial}</span>
          <ChevronsUpDown className="h-3 w-3 text-muted-foreground" />
        </button>

        <input
          ref={ref}
          id={id}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={displayValue}
          onChange={handleInputChange}
          placeholder={placeholder || (selectedCountry.code === 'FR' ? '06 12 34 56 78' : '...')}
          required={required}
          disabled={disabled}
          className={cn(
            'flex h-10 w-full rounded-r-lg border border-input bg-background/50 px-3 py-2 text-sm text-foreground',
            'placeholder:text-muted-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'transition-all duration-200',
            className
          )}
        />

        {open && (
          <div className="absolute top-full left-0 z-50 mt-1.5 w-72 rounded-xl border border-border bg-popover shadow-xl animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-150">
            <div className="p-2 border-b border-border">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Rechercher un pays..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full h-8 pl-8 pr-3 text-sm rounded-lg bg-muted/50 border border-border/50 text-foreground focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
                />
              </div>
            </div>
            <div className="max-h-52 overflow-y-auto p-1">
              {filteredCountries.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">Aucun résultat</p>
              )}
              {filteredCountries.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => selectCountry(c.code)}
                  className={cn(
                    'flex items-center gap-2.5 w-full px-2.5 py-2 text-sm rounded-lg transition-colors',
                    selectedCountry.code === c.code
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'hover:bg-muted/50 text-foreground'
                  )}
                >
                  <span className="text-base leading-none">{c.flag}</span>
                  <span className="flex-1 text-left truncate">{c.name}</span>
                  <span className="text-muted-foreground text-xs tabular-nums">+{c.dial}</span>
                  {selectedCountry.code === c.code && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }
)
PhoneInput.displayName = 'PhoneInput'

export { PhoneInput, COUNTRIES }
