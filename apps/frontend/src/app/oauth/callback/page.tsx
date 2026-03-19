'use client'

import { useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function OAuthCallbackContent() {
  const searchParams = useSearchParams()

  useEffect(() => {
    const success = searchParams.get('success')
    const error = searchParams.get('error')

    if (window.opener) {
      window.opener.postMessage(
        { type: 'oauth_callback', success: success === 'true', error: error || null },
        window.location.origin
      )
      window.close()
    } else {
      // Not opened as popup — redirect to account page
      window.location.href = `/dashboard/account?${success ? 'provider_linked=true' : `error=${error || 'unknown'}`}`
    }
  }, [searchParams])

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-center space-y-3">
        <div className="h-8 w-8 mx-auto border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Fermeture en cours...</p>
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
