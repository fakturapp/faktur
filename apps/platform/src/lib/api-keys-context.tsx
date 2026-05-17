'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { apiKeysClient, type ApiKeyShape } from './api-keys-client'

interface ApiKeysContextValue {
  keys: ApiKeyShape[] | null
  loading: boolean
  reload: () => Promise<void>
  openCreate: () => void
  createOpen: boolean
  closeCreate: () => void
}

const ApiKeysContext = createContext<ApiKeysContextValue | null>(null)

export function ApiKeysProvider({ children }: { children: ReactNode }) {
  const [keys, setKeys] = useState<ApiKeyShape[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)

  const reload = useCallback(async () => {
    setLoading(true)
    const res = await apiKeysClient.list()
    setKeys(res.data?.data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  const openCreate = useCallback(() => setCreateOpen(true), [])
  const closeCreate = useCallback(() => setCreateOpen(false), [])

  return (
    <ApiKeysContext.Provider
      value={{ keys, loading, reload, openCreate, createOpen, closeCreate }}
    >
      {children}
    </ApiKeysContext.Provider>
  )
}

export function useApiKeys(): ApiKeysContextValue {
  const ctx = useContext(ApiKeysContext)
  if (!ctx) {
    throw new Error('useApiKeys must be used inside <ApiKeysProvider>')
  }
  return ctx
}
