'use client'

import { useCallback, useRef } from 'react'
import { useCollaborationContext } from '@/components/collaboration/collaboration-provider'
import type { DocumentChange } from '@/hooks/use-collaboration'

export function useCollaborativeSync() {
  const collab = useCollaborationContext()
  const sendDocumentChange = collab?.sendDocumentChange

  const localChangeRef = useRef(new Set<string>())

  const collaborativeSet = useCallback(
    <T>(path: string, value: T, setter: React.Dispatch<React.SetStateAction<T>>) => {
      setter(value as any)
      sendDocumentChange?.(path, value)
    },
    [sendDocumentChange]
  )

  return { collaborativeSet }
}
