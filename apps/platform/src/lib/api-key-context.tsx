'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { apiKeysClient, type ApiKeyShape, type WebhookShape } from './api-keys-client'

interface ApiKeyContextValue {
  apiKey: ApiKeyShape | null
  webhook: WebhookShape | null
  loading: boolean
  reload: () => Promise<void>
}

const ApiKeyContext = createContext<ApiKeyContextValue | null>(null)

export function ApiKeyProvider({
  keyId,
  onNotFound,
  children,
}: {
  keyId: string
  onNotFound?: () => void
  children: ReactNode
}) {
  const [apiKey, setApiKey] = useState<ApiKeyShape | null>(null)
  const [webhook, setWebhook] = useState<WebhookShape | null>(null)
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    setLoading(true)
    const res = await apiKeysClient.show(keyId)
    setLoading(false)
    if (res.error || !res.data?.data) {
      onNotFound?.()
      return
    }
    setApiKey(res.data.data)
    setWebhook(res.data.webhook)
  }, [keyId, onNotFound])

  useEffect(() => {
    reload()
  }, [reload])

  return (
    <ApiKeyContext.Provider value={{ apiKey, webhook, loading, reload }}>
      {children}
    </ApiKeyContext.Provider>
  )
}

export function useApiKey(): ApiKeyContextValue {
  const ctx = useContext(ApiKeyContext)
  if (!ctx) {
    throw new Error('useApiKey must be used inside <ApiKeyProvider>')
  }
  return ctx
}
