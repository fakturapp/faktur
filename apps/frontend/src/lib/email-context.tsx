'use client'

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { api } from '@/lib/api'

export interface EmailAccountItem {
  id: string
  provider: 'gmail' | 'resend' | 'smtp'
  email: string
  displayName: string | null
  isDefault: boolean
  isActive: boolean
  createdAt: string
}

interface EmailContextType {
  accounts: EmailAccountItem[]
  loading: boolean
  hasEmailConfigured: boolean
  defaultAccount: EmailAccountItem | null
  refreshAccounts: () => Promise<void>
}

const EmailContext = createContext<EmailContextType>({
  accounts: [],
  loading: true,
  hasEmailConfigured: false,
  defaultAccount: null,
  refreshAccounts: async () => {},
})

export function useEmail() {
  return useContext(EmailContext)
}

export function EmailProvider({ children }: { children: React.ReactNode }) {
  const [accounts, setAccounts] = useState<EmailAccountItem[]>([])
  const [loading, setLoading] = useState(true)
  const retryCount = useRef(0)

  const loadAccounts = useCallback(async () => {
    try {
      const { data, error } = await api.get<{ emailAccounts: EmailAccountItem[] }>('/email/accounts')
      if (data?.emailAccounts) {
        setAccounts(data.emailAccounts)
        retryCount.current = 0
      } else if (error && retryCount.current < 2) {
        retryCount.current++
        setTimeout(() => loadAccounts(), 1500)
        return
      }
    } catch {
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    loadAccounts()
  }, [loadAccounts])

  const hasEmailConfigured = accounts.length > 0
  const defaultAccount = accounts.find((a) => a.isDefault) || accounts[0] || null

  return (
    <EmailContext.Provider
      value={{ accounts, loading, hasEmailConfigured, defaultAccount, refreshAccounts: loadAccounts }}
    >
      {children}
    </EmailContext.Provider>
  )
}
