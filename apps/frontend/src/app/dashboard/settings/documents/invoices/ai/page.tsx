'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function FakturAIRedirectPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/dashboard/settings/fakturai/edit')
  }, [router])
  return null
}
