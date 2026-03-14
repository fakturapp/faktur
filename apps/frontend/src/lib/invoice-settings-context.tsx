'use client'

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { api } from '@/lib/api'

export interface InvoiceSettings {
  billingType: 'quick' | 'detailed'
  logoUrl: string | null
  accentColor: string
  paymentMethods: string[]
  customPaymentMethod: string
  template: string
  darkMode: boolean
  documentFont: string
}

interface InvoiceSettingsContextType {
  settings: InvoiceSettings
  loading: boolean
  updateSettings: (partial: Partial<InvoiceSettings>) => void
  uploadLogo: (file: File) => Promise<void>
}

const defaultSettings: InvoiceSettings = {
  billingType: 'quick',
  logoUrl: null,
  accentColor: '#6366f1',
  paymentMethods: ['bank_transfer'],
  customPaymentMethod: '',
  template: 'classique',
  darkMode: false,
  documentFont: 'Lexend',
}

const InvoiceSettingsContext = createContext<InvoiceSettingsContextType>({
  settings: defaultSettings,
  loading: true,
  updateSettings: () => {},
  uploadLogo: async () => {},
})

export function useInvoiceSettings() {
  return useContext(InvoiceSettingsContext)
}

export function InvoiceSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<InvoiceSettings>(defaultSettings)
  const [loading, setLoading] = useState(true)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const settingsRef = useRef(settings)

  // Keep ref in sync
  settingsRef.current = settings

  const loadSettings = useCallback(async () => {
    const { data } = await api.get<{ settings: InvoiceSettings }>('/settings/invoices')
    if (data?.settings) {
      setSettings(data.settings)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  const saveSettings = useCallback(async (toSave: InvoiceSettings) => {
    await api.put('/settings/invoices', toSave)
  }, [])

  const updateSettings = useCallback(
    (partial: Partial<InvoiceSettings>) => {
      setSettings((prev) => {
        const next = { ...prev, ...partial }
        // Debounce auto-save
        if (debounceRef.current) {
          clearTimeout(debounceRef.current)
        }
        debounceRef.current = setTimeout(() => {
          saveSettings(next)
        }, 800)
        return next
      })
    },
    [saveSettings]
  )

  const uploadLogo = useCallback(async (file: File) => {
    const formData = new FormData()
    formData.append('logo', file)
    const { data } = await api.upload<{ logoUrl: string }>('/settings/invoices/logo', formData)
    if (data?.logoUrl) {
      setSettings((prev) => ({ ...prev, logoUrl: data.logoUrl }))
    }
  }, [])

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
        // Flush pending save
        saveSettings(settingsRef.current)
      }
    }
  }, [saveSettings])

  return (
    <InvoiceSettingsContext.Provider value={{ settings, loading, updateSettings, uploadLogo }}>
      {children}
    </InvoiceSettingsContext.Provider>
  )
}
