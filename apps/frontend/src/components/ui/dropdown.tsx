'use client'

import * as React from 'react'
import { useEffect, useRef, useLayoutEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronRight } from 'lucide-react'

interface DropdownProps {
  trigger: React.ReactNode
  children: React.ReactNode
  align?: 'left' | 'right'
  position?: 'below' | 'above'
  sideOffset?: number
  alignOffset?: number
  className?: string
}

export function Dropdown({ trigger, children, align = 'right', position = 'below', sideOffset = 0, alignOffset = 0, className }: DropdownProps) {
  const [open, setOpen] = React.useState(false)
  const triggerRef = useRef<HTMLDivElement>(null)
  const popupRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ top: 0, left: 0 })

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as Node
      if (
        triggerRef.current && !triggerRef.current.contains(target) &&
        popupRef.current && !popupRef.current.contains(target)
      ) {
        setOpen(false)
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    const popupW = 220
    let top: number
    let left: number

    if (position === 'above') {
      top = rect.top - 8 - sideOffset
    } else {
      top = rect.bottom + 8 + sideOffset
    }

    if (align === 'right') {
      left = rect.right - popupW + alignOffset
      if (left < 8) left = 8
    } else {
      left = rect.left + alignOffset
      if (left + popupW > window.innerWidth - 8) {
        left = window.innerWidth - popupW - 8
      }
    }

    setPos({ top, left })
  }, [open, align, position, sideOffset, alignOffset])

  const popup = (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={popupRef}
          initial={{ opacity: 0, y: position === 'above' ? 4 : -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: position === 'above' ? 4 : -4 }}
          transition={{ duration: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
          className={cn(
            'fixed z-[9999] min-w-[220px] rounded-xl bg-overlay shadow-overlay overflow-hidden border border-border/10',
            className
          )}
          style={{
            top: position === 'above' ? undefined : pos.top,
            bottom: position === 'above' ? `${window.innerHeight - pos.top}px` : undefined,
            left: pos.left,
          }}
          onClick={() => setOpen(false)}
        >
          <div className="p-1.5">
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  return (
    <div ref={triggerRef} className="relative">
      <div onClick={() => setOpen(!open)} className="cursor-pointer">
        {trigger}
      </div>
      {typeof document !== 'undefined' && createPortal(popup, document.body)}
    </div>
  )
}

/* ── Sub-menu (hover flyout) ── */

interface DropdownSubProps {
  trigger: React.ReactNode
  children: React.ReactNode
  className?: string
}

export function DropdownSub({ trigger, children, className }: DropdownSubProps) {
  const [open, setOpen] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const triggerBtnRef = useRef<HTMLButtonElement>(null)
  const flyoutRef = useRef<HTMLDivElement>(null)
  const [flyoutPos, setFlyoutPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 })

  function handleEnter() {
    clearTimeout(timeoutRef.current)
    setOpen(true)
  }

  function handleLeave() {
    timeoutRef.current = setTimeout(() => setOpen(false), 150)
  }

  useEffect(() => {
    return () => clearTimeout(timeoutRef.current)
  }, [])

  // Calculate position using trigger bounding rect
  useLayoutEffect(() => {
    if (!open || !triggerBtnRef.current) return
    const rect = triggerBtnRef.current.getBoundingClientRect()
    let top = rect.top
    let left = rect.right + 8

    // Wait a frame so the flyout is rendered and we can read its size
    requestAnimationFrame(() => {
      if (!flyoutRef.current) return
      const flyRect = flyoutRef.current.getBoundingClientRect()

      // If it would overflow to the right, place it on the left
      if (left + flyRect.width > window.innerWidth - 8) {
        left = rect.left - flyRect.width - 8
      }

      // If it would overflow at the bottom, clamp it
      if (top + flyRect.height > window.innerHeight - 8) {
        top = window.innerHeight - flyRect.height - 8
      }

      setFlyoutPos({ top, left })
    })

    setFlyoutPos({ top, left })
  }, [open])

  const flyout = (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={flyoutRef}
          initial={{ opacity: 0, x: -4 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -4 }}
          transition={{ duration: 0.12, ease: [0.25, 0.46, 0.45, 0.94] }}
          className={cn(
            'fixed z-[10000] min-w-[200px] rounded-xl bg-overlay shadow-overlay overflow-hidden border border-border/10',
            className
          )}
          style={{ top: flyoutPos.top, left: flyoutPos.left }}
          onMouseEnter={handleEnter}
          onMouseLeave={handleLeave}
        >
          <div className="p-1.5">
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  return (
    <div
      className="relative"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <button
        ref={triggerBtnRef}
        type="button"
        className={cn(
          'flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
          'text-foreground/90 hover:bg-foreground/[0.06] hover:text-foreground',
          open && 'bg-foreground/[0.06] text-foreground'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {trigger}
        <ChevronRight className="h-3.5 w-3.5 ml-auto text-muted-foreground" />
      </button>

      {typeof document !== 'undefined' && createPortal(flyout, document.body)}
    </div>
  )
}

interface DropdownItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  destructive?: boolean
  selected?: boolean
}

export const DropdownItem = React.forwardRef<HTMLButtonElement, DropdownItemProps>(
  ({ className, destructive, selected, children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'relative flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
        destructive
          ? 'text-danger hover:bg-danger-soft'
          : 'text-foreground/90 hover:bg-foreground/[0.06] hover:text-foreground',
        selected && 'pr-9',
        className
      )}
      {...props}
    >
      {children}
      {selected !== undefined && (
        <span className="absolute top-1/2 right-3 flex h-4 w-4 shrink-0 -translate-y-1/2 items-center justify-center text-primary">
          <svg
            aria-hidden="true"
            fill="none"
            role="presentation"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            viewBox="0 0 17 18"
            className="h-3 w-3"
            style={{
              strokeDasharray: 22,
              strokeDashoffset: selected ? 44 : 66,
              transition: 'stroke-dashoffset 250ms linear',
            }}
          >
            <polyline points="1 9 7 14 15 4" />
          </svg>
        </span>
      )}
    </button>
  )
)
DropdownItem.displayName = 'DropdownItem'

export function DropdownLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('px-3 py-2', className)}>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {children}
      </p>
    </div>
  )
}

export const DropdownSeparator = () => <div className="my-1.5 h-px bg-separator" />

/* ── FormSelect (native <select> replacement) ── */

interface FormSelectProps {
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  placeholder?: string
  className?: string
  id?: string
  disabled?: boolean
  showCheck?: boolean
}

export function FormSelect({
  value,
  onChange,
  options,
  placeholder = 'Sélectionner...',
  className,
  id,
  disabled,
  showCheck = true,
}: FormSelectProps) {
  const [open, setOpen] = useState(false)
  const triggerBtnRef = useRef<HTMLButtonElement>(null)
  const popupRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ top: 0, left: 0, width: 220 })

  const selected = options.find((o) => o.value === value)

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      const target = e.target as Node
      if (
        triggerBtnRef.current && !triggerBtnRef.current.contains(target) &&
        popupRef.current && !popupRef.current.contains(target)
      ) {
        setOpen(false)
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open])

  useLayoutEffect(() => {
    if (!open || !triggerBtnRef.current) return
    const rect = triggerBtnRef.current.getBoundingClientRect()
    setPos({ top: rect.bottom + 4, left: rect.left, width: Math.max(220, rect.width) })
  }, [open])

  const popup = (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={popupRef}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="fixed z-[9999] rounded-xl bg-overlay shadow-overlay overflow-hidden border border-border/10"
          style={{ top: pos.top, left: pos.left, minWidth: pos.width }}
        >
          <div className="p-1.5 max-h-[280px] overflow-y-auto">
            {options.map((opt) => (
              <DropdownItem
                key={opt.value}
                selected={showCheck ? value === opt.value : undefined}
                onClick={() => { onChange(opt.value); setOpen(false) }}
              >
                {opt.label}
              </DropdownItem>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  return (
    <div className="relative">
      <button
        ref={triggerBtnRef}
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => !disabled && setOpen(!open)}
        className={cn(
          'input w-full flex items-center justify-between gap-2 text-left',
          disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
      >
        <span className={cn('truncate text-sm', !selected && 'text-muted-foreground')}>
          {selected?.label || placeholder}
        </span>
        <ChevronDown className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-transform', open && 'rotate-180')} />
      </button>
      {typeof document !== 'undefined' && createPortal(popup, document.body)}
    </div>
  )
}
