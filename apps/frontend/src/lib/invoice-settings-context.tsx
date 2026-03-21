'use client'

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { api } from '@/lib/api'

/** Resolve logo URL - add cache buster to prevent stale logos */
function resolveLogoUrl(url: string | null): string | null {
  if (!url) return null
  const sep = url.includes('?') ? '&' : '?'
  return `${url}${sep}_t=${Date.now()}`
}

export interface InvoiceSettings {
  billingType: 'quick' | 'detailed'
  logoUrl: string | null
  logoSource: 'custom' | 'company'
  accentColor: string
  paymentMethods: string[]
  customPaymentMethod: string
  template: string
  darkMode: boolean
  documentFont: string
  eInvoicingEnabled: boolean
  pdpProvider: 'b2brouter' | 'sandbox' | null
  pdpApiKey: string | null
  pdpSandbox: boolean
  defaultOperationCategory: 'service' | 'goods' | 'mixed' | null
  defaultSubject: string | null
  defaultAcceptanceConditions: string | null
  defaultSignatureField: boolean
  defaultFreeField: string | null
  defaultShowNotes: boolean
  defaultVatExempt: boolean
  defaultFooterText: string | null
  defaultShowDeliveryAddress: boolean
  defaultLanguage: string
  quoteFilenamePattern: string
  invoiceFilenamePattern: string
  footerMode: 'company_info' | 'custom'
  logoBorderRadius: number
  aiKeyMode: 'server' | 'custom'
  aiEnabled: boolean
  aiProvider: 'claude' | 'gemini' | 'groq'
  aiModel: string
  aiCustomApiKey: string | null
  aiApiKeyClaude: string | null
  aiApiKeyGemini: string | null
  aiApiKeyGroq: string | null
}

interface InvoiceSettingsContextType {
  settings: InvoiceSettings
  companyLogoUrl: string | null
  loading: boolean
  updateSettings: (partial: Partial<InvoiceSettings>) => void
  uploadLogo: (file: File) => Promise<void>
  refreshCompanyLogo: () => Promise<void>
  refreshSettings: () => Promise<void>
}

const defaultSettings: InvoiceSettings = {
  billingType: 'quick',
  logoUrl: null,
  logoSource: 'custom',
  accentColor: '#6366f1',
  paymentMethods: ['bank_transfer'],
  customPaymentMethod: '',
  template: 'classique',
  darkMode: false,
  documentFont: 'Lexend',
  eInvoicingEnabled: false,
  pdpProvider: null,
  pdpApiKey: null,
  pdpSandbox: true,
  defaultOperationCategory: 'service',
  defaultSubject: null,
  defaultAcceptanceConditions: null,
  defaultSignatureField: false,
  defaultFreeField: null,
  defaultShowNotes: true,
  defaultVatExempt: false,
  defaultFooterText: null,
  defaultShowDeliveryAddress: false,
  defaultLanguage: 'fr',
  quoteFilenamePattern: 'DEV-{numéro}',
  invoiceFilenamePattern: 'FAC-{numéro}',
  footerMode: 'company_info',
  logoBorderRadius: 0,
  aiKeyMode: 'server',
  aiEnabled: false,
  aiProvider: 'gemini',
  aiModel: 'gemini-2.5-flash-lite',
  aiCustomApiKey: null,
  aiApiKeyClaude: null,
  aiApiKeyGemini: null,
  aiApiKeyGroq: null,
}

const InvoiceSettingsContext = createContext<InvoiceSettingsContextType>({
  settings: defaultSettings,
  companyLogoUrl: null,
  loading: true,
  updateSettings: () => {},
  uploadLogo: async () => {},
  refreshCompanyLogo: async () => {},
  refreshSettings: async () => {},
})

export function useInvoiceSettings() {
  return useContext(InvoiceSettingsContext)
}

export function InvoiceSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<InvoiceSettings>(defaultSettings)
  const [companyLogoUrl, setCompanyLogoUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const settingsRef = useRef(settings)

  // Keep ref in sync
  settingsRef.current = settings

  const loadSettings = useCallback(async () => {
    const { data } = await api.get<{ settings: InvoiceSettings; companyLogoUrl: string | null }>('/settings/invoices')
    if (data?.settings) {
      setSettings({ ...data.settings, logoUrl: resolveLogoUrl(data.settings.logoUrl) })
    }
    if (data?.companyLogoUrl) {
      setCompanyLogoUrl(resolveLogoUrl(data.companyLogoUrl))
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
      setSettings((prev) => ({ ...prev, logoUrl: resolveLogoUrl(data.logoUrl) }))
    }
  }, [])

  const refreshCompanyLogo = useCallback(async () => {
    const { data } = await api.get<{ settings: InvoiceSettings; companyLogoUrl: string | null }>('/settings/invoices')
    if (data?.companyLogoUrl) {
      setCompanyLogoUrl(resolveLogoUrl(data.companyLogoUrl))
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
    <InvoiceSettingsContext.Provider value={{ settings, companyLogoUrl, loading, updateSettings, uploadLogo, refreshCompanyLogo, refreshSettings: loadSettings }}>
      {children}
    </InvoiceSettingsContext.Provider>
  )
}
