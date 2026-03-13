'use client'

import * as React from 'react'
import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

interface DropdownProps {
  trigger: React.ReactNode
  children: React.ReactNode
  align?: 'left' | 'right'
  position?: 'below' | 'above'
  className?: string
}

export function Dropdown({ trigger, children, align = 'right', position = 'below', className }: DropdownProps) {
  const [open, setOpen] = React.useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
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

  return (
    <div ref={ref} className="relative">
      <div onClick={() => setOpen(!open)} className="cursor-pointer">
        {trigger}
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: position === 'above' ? 6 : -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: position === 'above' ? 6 : -6, scale: 0.96 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              'absolute z-50 min-w-[220px] rounded-xl border border-border/80 bg-card p-1.5 shadow-xl shadow-black/10 backdrop-blur-xl',
              position === 'above' ? 'bottom-full mb-2' : 'mt-2',
              align === 'right' ? 'right-0' : 'left-0',
              className
            )}
            onClick={() => setOpen(false)}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
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
