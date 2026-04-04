'use client'

import { useCollaborationContext } from '@/components/collaboration/collaboration-provider'

interface FieldIndicatorProps {
  fieldId: string
  children: React.ReactNode
  className?: string
}

/**
 * Wraps a form field to show a colored border when another collaborator
 * is editing the same field. Also broadcasts focus/blur events.
 */
export function CollaborativeField({ fieldId, children, className }: FieldIndicatorProps) {
  const collab = useCollaborationContext()

  const focusedFields = collab?.focusedFields ?? new Map()
  const collaborators = collab?.collaborators ?? []
  const sendFieldFocus = collab?.sendFieldFocus
  const sendFieldBlur = collab?.sendFieldBlur

  // Check if another user is focused on this field
  const focusedUserId = focusedFields.get(fieldId)
  const focusedCollab = focusedUserId
    ? collaborators.find((c) => c.userId === focusedUserId)
    : null

  return (
    <div
      className={className}
      style={focusedCollab ? {
        boxShadow: `0 0 0 2px ${focusedCollab.color}`,
        borderRadius: '0.5rem',
        transition: 'box-shadow 0.2s ease',
      } : undefined}
      onFocus={() => sendFieldFocus?.(fieldId)}
      onBlur={() => sendFieldBlur?.(fieldId)}
    >
      {children}
      {focusedCollab && (
        <span
          className="absolute -top-5 left-1 text-[10px] font-medium text-white px-1.5 py-0.5 rounded-t-md z-10"
          style={{ backgroundColor: focusedCollab.color }}
        >
          {focusedCollab.fullName?.split(' ')[0] ?? focusedCollab.email.split('@')[0]}
        </span>
      )}
    </div>
  )
}
