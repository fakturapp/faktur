'use client'

import { AuthProvider } from '@/lib/auth'
import { ToastProvider } from '@/components/ui/toast'
import { I18nProvider } from '@/lib/i18n'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <AuthProvider>
        <ToastProvider>{children}</ToastProvider>
      </AuthProvider>
    </I18nProvider>
  )
}
