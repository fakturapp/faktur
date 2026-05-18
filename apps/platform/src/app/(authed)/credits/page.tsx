'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function CreditsRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/usage')
  }, [router])
  return null
}
