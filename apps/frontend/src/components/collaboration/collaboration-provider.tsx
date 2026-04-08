'use client'

import { createContext, useContext, type ReactNode } from 'react'
import {
  useCollaboration,
  type UseCollaborationReturn,
  type UseCollaborationOptions,
} from '@/hooks/use-collaboration'

const CollaborationContext = createContext<UseCollaborationReturn | null>(null)

interface CollaborationProviderProps extends UseCollaborationOptions {
  children: ReactNode
}

export function CollaborationProvider({
  children,
  ...options
}: CollaborationProviderProps) {
  const collaboration = useCollaboration(options)

  return (
    <CollaborationContext.Provider value={collaboration}>
      {children}
    </CollaborationContext.Provider>
  )
}

export function useCollaborationContext(): UseCollaborationReturn | null {
  return useContext(CollaborationContext)
}
