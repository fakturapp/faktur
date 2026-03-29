'use client'

import * as React from 'react'
import { useEffect, useRef, useLayoutEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

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

  // Calculate position when open
  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    const popupW = 220 // min-width
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
          initial={{ opacity: 0, y: position === 'above' ? 6 : -6, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: position === 'above' ? 6 : -6, scale: 0.96 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          className={cn(
            'fixed z-[9999] min-w-[220px] rounded-xl border border-border/80 bg-card p-1.5 shadow-xl shadow-black/10 backdrop-blur-xl',
            className
          )}
          style={{
            top: position === 'above' ? undefined : pos.top,
            bottom: position === 'above' ? `${window.innerHeight - pos.top}px` : undefined,
            left: pos.left,
          }}
          onClick={() => setOpen(false)}
        >
          {children}
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

interface DropdownItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  destructive?: boolean
}

export const DropdownItem = React.forwardRef<HTMLButtonElement, DropdownItemProps>(
  ({ className, destructive, children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
        destructive
          ? 'text-destructive hover:bg-destructive/10'
          : 'text-foreground/90 hover:bg-muted hover:text-foreground',
        className
      )}
      {...props}
    >
      {children}
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

export const DropdownSeparator = () => <div className="my-1.5 h-px bg-border/60" />
