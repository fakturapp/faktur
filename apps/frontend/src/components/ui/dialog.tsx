'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

interface DialogProps {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  className?: string
  dismissible?: boolean
  zIndex?: string
}

export function Dialog({ open, onClose, children, className, dismissible = true, zIndex = 'z-50' }: DialogProps) {
  React.useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <div className={cn('fixed inset-0 flex items-center justify-center', zIndex)}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-backdrop backdrop-blur-sm"
            onClick={dismissible ? onClose : undefined}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
            className={cn(
              'relative z-10 w-full max-w-md bg-overlay shadow-overlay rounded-[30px] p-6',
              className
            )}
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

interface DialogHeaderProps {
  onClose?: () => void
  children: React.ReactNode
  className?: string
  showClose?: boolean
  icon?: React.ReactNode
}

export function DialogHeader({ onClose, children, className, showClose = true, icon }: DialogHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between gap-3 mb-4', className)}>
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {icon && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft">
            {icon}
          </div>
        )}
        <div className="min-w-0 flex-1">{children}</div>
      </div>
      {showClose && onClose && (
        <button
          onClick={onClose}
          className="flex h-8 w-8 min-w-8 shrink-0 items-center justify-center rounded-full bg-surface transition-all hover:bg-surface-hover active:scale-95"
          aria-label="Fermer"
          type="button"
        >
          <X className="h-3.5 w-3.5 text-foreground" strokeWidth={3} />
        </button>
      )}
    </div>
  )
}

export function DialogTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn('text-base font-semibold tracking-[-0.015em] text-foreground', className)} {...props} />
}

export function DialogDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('mt-0.5 text-sm text-muted-foreground leading-relaxed', className)} {...props} />
}

export function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mt-5 flex justify-end gap-3', className)} {...props} />
}
