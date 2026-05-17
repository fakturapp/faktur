'use client'

import { useEffect, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { ApiKeysProvider } from '@/lib/api-keys-context'
import { Sidebar } from '@/components/layout/sidebar'
import { Spinner } from '@/components/ui/spinner'

export default function AuthedLayout({ children }: { children: ReactNode }) {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login')
    }
  }, [loading, user, router])

  if (loading || !user) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Spinner />
      </div>
    )
  }

  return (
    <ApiKeysProvider>
      <div className="relative h-screen overflow-hidden bg-background">
        <Sidebar />
        <div className="flex h-screen flex-col overflow-hidden pl-(--sidebar-width)">
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    </ApiKeysProvider>
  )
}
