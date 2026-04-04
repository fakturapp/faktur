'use client'

import { useEffect, useRef } from 'react'
import { useCollaborationContext } from '@/components/collaboration/collaboration-provider'

// Global flag: when true, state changes are from a remote user — don't re-broadcast
let _isApplyingRemote = false

export function setApplyingRemote(v: boolean) {
  _isApplyingRemote = v
}

export function isApplyingRemote() {
  return _isApplyingRemote
}

/**
 * Broadcasts a value change to collaborators immediately on every change.
 * Uses JSON.stringify for deep comparison (works with objects/arrays).
 * Skips initial render and remote-originated changes to prevent echo loops.
 *
 * NO DEBOUNCE — every keystroke syncs in real-time like Liveblocks/Figma.
 */
export function useBroadcast(path: string, value: any) {
  const collab = useCollaborationContext()
  const prevJsonRef = useRef<string>('')
  const initializedRef = useRef(false)

  useEffect(() => {
    const json = typeof value === 'string' ? value : JSON.stringify(value)

    // Skip initial render (data loading from API)
    if (!initializedRef.current) {
      initializedRef.current = true
      prevJsonRef.current = json
      return
    }

    // Skip if value hasn't actually changed (deep compare)
    if (prevJsonRef.current === json) return
    prevJsonRef.current = json

    // Skip if this change originated from a remote user
    if (_isApplyingRemote) return

    // Broadcast immediately — no debounce
    collab?.sendDocumentChange?.(path, value)
  }, [value, path, collab])
}
