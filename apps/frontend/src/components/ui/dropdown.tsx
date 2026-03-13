'use client'

import * as React from 'react'
import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

interface DropdownProps {
  trigger: React.ReactNode
  children: React.ReactNode
  align?: 'left' | 'right'
  className?: string
}

export function Dropdown({ trigger, children, align = 'right', className }: DropdownProps) {
  const [open, setOpen] = React.useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={ref} className="relative">
      <div onClick={() => setOpen(!open)} className="cursor-pointer">
        {trigger}
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={cn(
              'absolute z-50 mt-2 min-w-[200px] rounded-xl border border-border bg-card p-1.5 shadow-xl',
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
        'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
        destructive
          ? 'text-destructive hover:bg-destructive/10'
          : 'text-foreground hover:bg-muted',
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
)
DropdownItem.displayName = 'DropdownItem'

export const DropdownSeparator = () => <div className="my-1 h-px bg-border" />
