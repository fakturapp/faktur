'use client'

import { useEffect, useRef } from 'react'
import { useCollaborationContext } from '@/components/collaboration/collaboration-provider'

let _isApplyingRemote = false

export function setApplyingRemote(v: boolean) {
  _isApplyingRemote = v
}

export function isApplyingRemote() {
  return _isApplyingRemote
}

export function useBroadcast(path: string, value: any) {
  const collab = useCollaborationContext()
  const prevJsonRef = useRef<string>('')
  const initializedRef = useRef(false)

  useEffect(() => {
    const json = typeof value === 'string' ? value : JSON.stringify(value)

    if (!initializedRef.current) {
      initializedRef.current = true
      prevJsonRef.current = json
      return
    }

    if (prevJsonRef.current === json) return
    prevJsonRef.current = json

    if (_isApplyingRemote) return

    collab?.sendDocumentChange?.(path, value)
  }, [value, path, collab])
}
