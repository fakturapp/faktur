'use client'

import { useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function OAuthCallbackContent() {
  const searchParams = useSearchParams()

  useEffect(() => {
    const success = searchParams.get('success') === 'true'
    const error = searchParams.get('error')

    const wasFullPageFallback = (() => {
      try { return sessionStorage.getItem('faktur_google_link_pending') === '1' } catch { return false }
    })()

    if (window.opener && !wasFullPageFallback) {
      window.opener.postMessage(
        { type: 'oauth_callback', success, error: error || null },
        window.location.origin
      )
      window.close()
      return
    }

    try { sessionStorage.removeItem('faktur_google_link_pending') } catch {}
    if (success) {
      window.location.href = '/dashboard/account/google-linked'
    } else {
      window.location.href = `/dashboard/account?error=${error || 'unknown'}`
    }
  }, [searchParams])

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-center space-y-3">
        <div className="h-8 w-8 mx-auto border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Redirection en cours...</p>
      </div>
    </div>
  )
}

export default function OAuthCallbackPage() {
  return (
    <Suspense>
      <OAuthCallbackContent />
    </Suspense>
  )
}
