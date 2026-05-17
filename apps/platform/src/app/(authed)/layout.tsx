'use client'

import { useEffect, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { Spinner } from '@/components/ui/spinner'
import { PlatformHeader } from '@/components/platform/platform-header'

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
    <>
      <PlatformHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 sm:px-6">{children}</main>
    </>
  )
}
