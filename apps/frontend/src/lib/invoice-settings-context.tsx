'use client'

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { api } from '@/lib/api'

/** Resolve logo URL - relative paths go through Next.js rewrites */
function resolveLogoUrl(url: string | null): string | null {
  if (!url) return null
  return url
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
  pdpProvider: string | null
  pdpApiKey: string | null
  pdpSandbox: boolean
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
  footerMode: 'company_info' | 'vat_exempt' | 'custom'
}

interface InvoiceSettingsContextType {
  settings: InvoiceSettings
  companyLogoUrl: string | null
  loading: boolean
  updateSettings: (partial: Partial<InvoiceSettings>) => void
  uploadLogo: (file: File) => Promise<void>
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
  footerMode: 'vat_exempt',
}

const InvoiceSettingsContext = createContext<InvoiceSettingsContextType>({
  settings: defaultSettings,
  companyLogoUrl: null,
  loading: true,
  updateSettings: () => {},
  uploadLogo: async () => {},
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
    <InvoiceSettingsContext.Provider value={{ settings, companyLogoUrl, loading, updateSettings, uploadLogo }}>
      {children}
    </InvoiceSettingsContext.Provider>
  )
}
