'use client'

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { api } from '@/lib/api'

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
  collaborationEnabled: boolean
  aiEnabled: boolean
  aiProvider: 'gemini'
  aiModel: string
}

interface InvoiceSettingsContextType {
  settings: InvoiceSettings
  companyLogoUrl: string | null
  loading: boolean
  saving: boolean
  saveError: string | null
  hasChanges: boolean
  updateSettings: (partial: Partial<InvoiceSettings>) => void
  save: () => Promise<void>
  resetChanges: () => void
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
  collaborationEnabled: false,
  aiEnabled: false,
  aiProvider: 'gemini',
  aiModel: 'nvidia/nemotron-3-super-120b-a12b:free',
}

const InvoiceSettingsContext = createContext<InvoiceSettingsContextType>({
  settings: defaultSettings,
  companyLogoUrl: null,
  loading: true,
  saving: false,
  saveError: null,
  hasChanges: false,
  updateSettings: () => {},
  save: async () => {},
  resetChanges: () => {},
  uploadLogo: async () => {},
  refreshCompanyLogo: async () => {},
  refreshSettings: async () => {},
})

export function useInvoiceSettings() {
  return useContext(InvoiceSettingsContext)
}

export function InvoiceSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<InvoiceSettings>(defaultSettings)
  const [savedSettings, setSavedSettings] = useState<InvoiceSettings>(defaultSettings)
  const [companyLogoUrl, setCompanyLogoUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const settingsRef = useRef(settings)

  settingsRef.current = settings

  const hasChanges = JSON.stringify(settings) !== JSON.stringify(savedSettings)

  const loadSettings = useCallback(async () => {
    const { data } = await api.get<{ settings: InvoiceSettings; companyLogoUrl: string | null }>('/settings/invoices')
    if (data?.settings) {
      const resolved = { ...data.settings, logoUrl: resolveLogoUrl(data.settings.logoUrl) }
      setSettings(resolved)
      setSavedSettings(resolved)
    }
    if (data?.companyLogoUrl) {
      setCompanyLogoUrl(resolveLogoUrl(data.companyLogoUrl))
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  const save = useCallback(async () => {
    setSaving(true)
    setSaveError(null)
    const { error } = await api.put('/settings/invoices', settingsRef.current)
    setSaving(false)
    if (error) {
      setSaveError(error)
    } else {
      setSavedSettings({ ...settingsRef.current })
    }
  }, [])

  const resetChanges = useCallback(() => {
    setSettings({ ...savedSettings })
    setSaveError(null)
  }, [savedSettings])

  const updateSettings = useCallback(
    (partial: Partial<InvoiceSettings>) => {
      setSaveError(null)
      setSettings((prev) => ({ ...prev, ...partial }))
    },
    []
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

  return (
    <InvoiceSettingsContext.Provider value={{ settings, companyLogoUrl, loading, saving, saveError, hasChanges, updateSettings, save, resetChanges, uploadLogo, refreshCompanyLogo, refreshSettings: loadSettings }}>
      {children}
    </InvoiceSettingsContext.Provider>
  )
}
