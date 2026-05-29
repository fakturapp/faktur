'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface OtpInputProps {
  value: string
  onChange: (value: string) => void
  onComplete?: (value: string) => void
  length?: number
  groupSize?: number
  autoFocus?: boolean
  disabled?: boolean
  className?: string
  ariaLabel?: string
  id?: string
  name?: string
  /**
   * Source of the code. Controls autofill behaviour:
   * - 'totp' / 'sms' → autoComplete='one-time-code' (iOS Keychain + Authenticator + SMS picker)
   * - 'email' → autoComplete='off' (no managers offering passwords or OTPs)
   */
  purpose?: 'totp' | 'sms' | 'email'
}

export function OtpInput({
  value,
  onChange,
  onComplete,
  length = 6,
  groupSize = 3,
  autoFocus = false,
  disabled = false,
  className,
  ariaLabel = 'Code de vérification',
  id,
  name,
  purpose = 'totp',
}: OtpInputProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [focused, setFocused] = React.useState(false)
  const sanitized = value.replace(/\D/g, '').slice(0, length)
  const digits = Array.from({ length }, (_, i) => sanitized[i] ?? '')
  const cursor = sanitized.length

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const next = e.target.value.replace(/\D/g, '').slice(0, length)
    onChange(next)
    if (next.length === length) onComplete?.(next)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') return
    if (e.key === 'Backspace' && sanitized.length > 0) {
      e.preventDefault()
      const next = sanitized.slice(0, -1)
      onChange(next)
    }
  }

  const groups: number[][] = []
  for (let i = 0; i < length; i += groupSize) {
    const slots: number[] = []
    for (let j = i; j < Math.min(i + groupSize, length); j++) slots.push(j)
    groups.push(slots)
  }

  return (
    <div
      className={cn('relative inline-flex items-center justify-center', className)}
      onClick={() => inputRef.current?.focus()}
    >
      <input
        ref={inputRef}
        id={id}
        name={name ?? (purpose === 'email' ? 'email-code' : 'one-time-code')}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete={purpose === 'email' ? 'off' : 'one-time-code'}
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        maxLength={length}
        value={sanitized}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        autoFocus={autoFocus}
        disabled={disabled}
        aria-label={ariaLabel}
        className="absolute inset-0 h-full w-full cursor-text bg-transparent text-transparent caret-transparent outline-none selection:bg-transparent"
        style={{ WebkitTextFillColor: 'transparent' }}
      />
      <div className="pointer-events-none flex items-center gap-1.5">
        {groups.map((slots, gi) => (
          <React.Fragment key={gi}>
            {gi > 0 && (
              <div className="px-1.5 text-muted-foreground/40 select-none" aria-hidden>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" className="opacity-70">
                  <circle cx="5" cy="5" r="1.2" />
                </svg>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              {slots.map((index) => {
                const digit = digits[index]
                const isActive = focused && cursor === index && !disabled
                const isFilled = !!digit
                return (
                  <div
                    key={index}
                    aria-hidden
                    className={cn(
                      'relative flex h-12 w-10 items-center justify-center rounded-md border bg-card text-lg font-semibold tabular-nums transition-all',
                      isFilled ? 'border-border text-foreground' : 'border-border/60 text-muted-foreground',
                      isActive && 'border-primary ring-2 ring-primary/20',
                      disabled && 'opacity-60',
                    )}
                  >
                    {digit || (isActive && (
                      <span className="h-5 w-px animate-[caret_1.2s_steps(2,end)_infinite] bg-foreground/80" />
                    ))}
                  </div>
                )
              })}
            </div>
          </React.Fragment>
        ))}
      </div>
      <style jsx>{`
        @keyframes caret { 0%, 100% { opacity: 0 } 50% { opacity: 1 } }
      `}</style>
    </div>
  )
}
