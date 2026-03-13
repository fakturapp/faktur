'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import fr from '@/locales/fr.json'
import en from '@/locales/en.json'

export type Locale = 'fr' | 'en'

const translations: Record<Locale, Record<string, any>> = { fr, en }

interface I18nContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string, params?: Record<string, string | number>) => string
}

const I18nContext = createContext<I18nContextType | null>(null)

function getNestedValue(obj: Record<string, any>, path: string): string | undefined {
  const keys = path.split('.')
  let current: any = obj
  for (const key of keys) {
    if (current == null || typeof current !== 'object') return undefined
    current = current[key]
  }
  return typeof current === 'string' ? current : undefined
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('faktur_locale') as Locale | null
      if (saved && translations[saved]) return saved
    }
    return 'fr'
  })

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale)
    if (typeof window !== 'undefined') {
      localStorage.setItem('faktur_locale', newLocale)
    }
  }, [])

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      let value = getNestedValue(translations[locale], key)

      if (!value) {
        // Fallback to French
        value = getNestedValue(translations.fr, key)
      }

      if (!value) {
        // Return key as fallback
        return key
      }

      // Handle pluralization: "1 client | 2 clients" with {count}
      if (value.includes(' | ') && params?.count !== undefined) {
        const [singular, plural] = value.split(' | ')
        value = Number(params.count) <= 1 ? singular : plural
      }

      // Replace {param} placeholders
      if (params) {
        for (const [paramKey, paramValue] of Object.entries(params)) {
          value = value.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramValue))
        }
      }

      return value
    },
    [locale]
  )

  return <I18nContext.Provider value={{ locale, setLocale, t }}>{children}</I18nContext.Provider>
}

export function useTranslation() {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error('useTranslation must be used within an I18nProvider')
  }
  return context
}
