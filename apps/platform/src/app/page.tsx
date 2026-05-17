'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { Spinner } from '@/components/ui/spinner'

export default function RootRedirect() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (loading) return
    if (user) router.replace('/api-keys')
    else router.replace('/login')
  }, [loading, user, router])

  return (
    <div className="flex flex-1 items-center justify-center">
      <Spinner />
    </div>
  )
}
