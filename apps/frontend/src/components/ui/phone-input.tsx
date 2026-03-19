'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

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

type CountryCode = typeof COUNTRIES[number]['code']

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

/** Strip everything except digits */
function stripDigits(val: string) {
  return val.replace(/\D/g, '')
}

/** Find country by dial code from a raw number like +33612345678 */
function detectCountry(raw: string) {
  if (!raw.startsWith('+')) return null
  const digits = raw.slice(1)
  // Try 3-digit codes first, then 2, then 1
  for (const len of [3, 2, 1]) {
    const prefix = digits.slice(0, len)
    const match = COUNTRIES.find((c) => c.dial === prefix)
    if (match) return { country: match, nationalDigits: digits.slice(len) }
  }
  return null
}

/** Format digits according to country format pattern */
function formatNumber(digits: string, format: readonly number[]) {
  const parts: string[] = []
  let pos = 0
  for (const len of format) {
    if (pos >= digits.length) break
    parts.push(digits.slice(pos, pos + len))
    pos += len
  }
  if (pos < digits.length) {
    parts.push(digits.slice(pos))
  }
  return parts.join(' ')
}

const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ value, onChange, defaultCountry = 'FR', className, placeholder, id, required, disabled }, ref) => {
    const [open, setOpen] = React.useState(false)
    const dropdownRef = React.useRef<HTMLDivElement>(null)

    // Parse the current value to extract country + national number
    const parsed = React.useMemo(() => {
      if (!value) return { country: COUNTRIES.find((c) => c.code === defaultCountry)!, digits: '' }

      // Try to detect from +XX prefix
      const detected = detectCountry(value)
      if (detected) {
        return { country: detected.country, digits: detected.nationalDigits }
      }

      // If starts with 0 (local format), assume default country and strip leading 0
      const country = COUNTRIES.find((c) => c.code === defaultCountry)!
      const stripped = stripDigits(value)
      if (stripped.startsWith('0')) {
        return { country, digits: stripped.slice(1) }
      }

      return { country, digits: stripped }
    }, [value, defaultCountry])

    const selectedCountry = parsed.country
    const nationalDigits = parsed.digits.slice(0, selectedCountry.maxDigits)

    // Display value: for FR, show with leading 0 (06 XX XX XX XX)
    const displayValue = React.useMemo(() => {
      if (!nationalDigits) return ''
      if (selectedCountry.code === 'FR') {
        return formatNumber('0' + nationalDigits, [2, 2, 2, 2, 2])
      }
      return formatNumber(nationalDigits, selectedCountry.format)
    }, [nationalDigits, selectedCountry])

    function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
      let input = e.target.value

      // If user pastes something with +XX, detect and switch country
      if (input.includes('+')) {
        const detected = detectCountry(input.replace(/\s/g, ''))
        if (detected) {
          const digits = stripDigits(detected.nationalDigits).slice(0, detected.country.maxDigits)
          onChange(`+${detected.country.dial}${digits}`)
          return
        }
      }

      let digits = stripDigits(input)

      // For FR: if user types 06/07, strip the leading 0
      if (selectedCountry.code === 'FR' && digits.startsWith('0')) {
        digits = digits.slice(1)
      }

      // Limit to max digits
      digits = digits.slice(0, selectedCountry.maxDigits)

      // Store as international format
      onChange(`+${selectedCountry.dial}${digits}`)
    }

    function selectCountry(code: CountryCode) {
      const country = COUNTRIES.find((c) => c.code === code)!
      // Keep existing digits, just change country code
      const digits = nationalDigits.slice(0, country.maxDigits)
      onChange(`+${country.dial}${digits}`)
      setOpen(false)
    }

    // Close dropdown on outside click
    React.useEffect(() => {
      function handleClick(e: MouseEvent) {
        if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
          setOpen(false)
        }
      }
      if (open) document.addEventListener('mousedown', handleClick)
      return () => document.removeEventListener('mousedown', handleClick)
    }, [open])

    return (
      <div className="relative flex" ref={dropdownRef}>
        {/* Country selector button */}
        <button
          type="button"
          onClick={() => !disabled && setOpen(!open)}
          disabled={disabled}
          className={cn(
            'flex items-center gap-1.5 px-2.5 h-10 rounded-l-lg border border-r-0 border-input bg-muted/50 text-sm',
            'hover:bg-muted transition-colors shrink-0',
            'disabled:cursor-not-allowed disabled:opacity-50'
          )}
        >
          <span className="text-base leading-none">{selectedCountry.flag}</span>
          <span className="text-muted-foreground text-xs">+{selectedCountry.dial}</span>
          <svg className="h-3 w-3 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Phone input */}
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

        {/* Dropdown */}
        {open && (
          <div className="absolute top-full left-0 z-50 mt-1 w-64 max-h-60 overflow-y-auto rounded-lg border border-border bg-popover shadow-lg">
            {COUNTRIES.map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => selectCountry(c.code)}
                className={cn(
                  'flex items-center gap-3 w-full px-3 py-2 text-sm text-left hover:bg-muted/50 transition-colors',
                  selectedCountry.code === c.code && 'bg-muted/50 font-medium'
                )}
              >
                <span className="text-base leading-none">{c.flag}</span>
                <span className="flex-1">{c.name}</span>
                <span className="text-muted-foreground text-xs">+{c.dial}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }
)
PhoneInput.displayName = 'PhoneInput'

export { PhoneInput, COUNTRIES }
