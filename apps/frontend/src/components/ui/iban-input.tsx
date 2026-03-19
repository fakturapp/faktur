'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Copy, Check } from 'lucide-react'

interface IbanInputProps {
  value: string
  onChange: (raw: string) => void
  defaultCountry?: string
  className?: string
  placeholder?: string
  id?: string
  required?: boolean
  disabled?: boolean
}

/** Strip everything except alphanumeric */
function stripIban(val: string) {
  return val.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
}

/** Format IBAN with spaces every 4 chars */
function formatIban(raw: string) {
  return raw.replace(/(.{4})/g, '$1 ').trim()
}

const IbanInput = React.forwardRef<HTMLInputElement, IbanInputProps>(
  ({ value, onChange, defaultCountry = 'FR', className, placeholder, id, required, disabled }, ref) => {
    const [copied, setCopied] = React.useState(false)

    const raw = stripIban(value)

    // Auto-prefix country code if user starts typing digits without it
    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
      let stripped = stripIban(e.target.value)

      // If starts with digits (no country code), prepend default
      if (stripped.length > 0 && /^\d/.test(stripped)) {
        stripped = defaultCountry + stripped
      }

      // IBAN max length (34 chars raw)
      if (stripped.length > 34) {
        stripped = stripped.slice(0, 34)
      }

      onChange(stripped)
    }

    function handleCopy() {
      navigator.clipboard.writeText(raw)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }

    return (
      <div className="relative">
        <input
          ref={ref}
          id={id}
          type="text"
          inputMode="text"
          autoComplete="off"
          spellCheck={false}
          value={formatIban(raw)}
          onChange={handleChange}
          placeholder={placeholder || 'FR76 3000 6000 0112 3456 7890 189'}
          required={required}
          disabled={disabled}
          className={cn(
            'flex h-10 w-full rounded-lg border border-input bg-background/50 px-3 py-2 text-sm text-foreground font-mono tracking-wider',
            'placeholder:text-muted-foreground placeholder:font-mono',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'transition-all duration-200 pr-10',
            className
          )}
        />
        {raw.length > 0 && (
          <button
            type="button"
            onClick={handleCopy}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            tabIndex={-1}
            title="Copier l'IBAN"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
        )}
      </div>
    )
  }
)
IbanInput.displayName = 'IbanInput'

export { IbanInput }
