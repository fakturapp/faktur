'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useCollaborationContext } from '@/components/collaboration/collaboration-provider'
import type { CollaboratorInfo } from '@/hooks/use-collaboration'

interface TypingIndicatorProps {
  fieldId: string
  className?: string
}

export function TypingIndicator({ fieldId, className }: TypingIndicatorProps) {
  const collab = useCollaborationContext()
  if (!collab) return null

  const { focusedFields, collaborators } = collab
  const focusedUserId = focusedFields.get(fieldId)
  const collab_ = focusedUserId ? collaborators.find((c) => c.userId === focusedUserId) : null

  if (!collab_) return null

  return (
    <AnimatePresence>
      <motion.div
        key={collab_.userId}
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        className={className}
      >
        <div className="flex items-center gap-1.5">
          {}
          <div
            className="w-0.5 h-4 rounded-full animate-pulse"
            style={{ backgroundColor: collab_.color }}
          />
          <span
            className="text-[10px] font-medium px-1.5 py-0.5 rounded-md text-white whitespace-nowrap"
            style={{ backgroundColor: collab_.color }}
          >
            {collab_.fullName?.split(' ')[0] ?? collab_.email.split('@')[0]} \u00e9crit...
          </span>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

export function CollaborativeFieldWrapper({
  fieldId,
  children,
  className,
}: {
  fieldId: string
  children: React.ReactNode
  className?: string
}) {
  const collab = useCollaborationContext()
  if (!collab) return <div className={className}>{children}</div>

  const { focusedFields, collaborators, sendFieldFocus, sendFieldBlur } = collab
  const focusedUserId = focusedFields.get(fieldId)
  const focusedCollab = focusedUserId ? collaborators.find((c) => c.userId === focusedUserId) : null

  return (
    <div
      className={`relative ${className ?? ''}`}
      style={focusedCollab ? {
        boxShadow: `0 0 0 2px ${focusedCollab.color}40`,
        borderRadius: '0.5rem',
        transition: 'box-shadow 0.2s ease',
      } : { transition: 'box-shadow 0.2s ease' }}
      onFocusCapture={() => sendFieldFocus(fieldId)}
      onBlurCapture={() => sendFieldBlur(fieldId)}
    >
      {children}
      {focusedCollab && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute -top-6 left-2 z-20"
        >
          <div className="flex items-center gap-1">
            <div
              className="w-0.5 h-3.5 rounded-full animate-pulse"
              style={{ backgroundColor: focusedCollab.color }}
            />
            <span
              className="text-[9px] font-semibold px-1.5 py-0.5 rounded text-white shadow-sm"
              style={{ backgroundColor: focusedCollab.color }}
            >
              {focusedCollab.fullName?.split(' ')[0] ?? focusedCollab.email.split('@')[0]}
            </span>
          </div>
        </motion.div>
      )}
    </div>
  )
}
