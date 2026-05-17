'use client'

import { useEffect, useState } from 'react'
import {
  OAUTH_CLIENT_ID,
  OAUTH_REDIRECT_URI,
  OAUTH_TOKEN_URL,
  STORAGE_KEYS,
} from '@/lib/oauth-config'
import { storeTokens } from '@/lib/oauth-storage'
import { Spinner } from '@/components/ui/spinner'
import { AlertTriangle } from 'lucide-react'
import Link from 'next/link'

export default function OAuthCallbackPage() {
  const [phase, setPhase] = useState<'exchanging' | 'error' | 'done'>('exchanging')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function exchange() {
      const params = new URLSearchParams(window.location.search)
      const code = params.get('code')
      const stateFromUrl = params.get('state')
      const oauthError = params.get('error')
      const oauthErrorDescription = params.get('error_description')

      if (oauthError) {
        setError(oauthErrorDescription || oauthError)
        setPhase('error')
        return
      }

      if (!code || !stateFromUrl) {
        setError('Réponse OAuth invalide : code ou state manquant.')
        setPhase('error')
        return
      }

      const expectedState = sessionStorage.getItem(STORAGE_KEYS.oauthState)
      const verifier = sessionStorage.getItem(STORAGE_KEYS.pkceVerifier)
      sessionStorage.removeItem(STORAGE_KEYS.oauthState)
      sessionStorage.removeItem(STORAGE_KEYS.pkceVerifier)

      if (!expectedState || expectedState !== stateFromUrl) {
        setError('Vérification anti-CSRF échouée. Recommence la connexion.')
        setPhase('error')
        return
      }
      if (!verifier) {
        setError('Code verifier PKCE manquant. Recommence la connexion.')
        setPhase('error')
        return
      }

      try {
        const body = new URLSearchParams()
        body.set('grant_type', 'authorization_code')
        body.set('client_id', OAUTH_CLIENT_ID)
        body.set('code', code)
        body.set('redirect_uri', OAUTH_REDIRECT_URI)
        body.set('code_verifier', verifier)

        const res = await fetch(OAUTH_TOKEN_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: body.toString(),
        })

        const data = await res.json().catch(() => ({}))
        if (cancelled) return

        if (!res.ok || !data.access_token) {
          setError(
            data.error_description || data.error || 'Échange de token échoué.'
          )
          setPhase('error')
          return
        }

        storeTokens({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          expires_in: data.expires_in,
        })

        setPhase('done')
        window.location.replace('/api-keys')
      } catch (err) {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Erreur réseau')
        setPhase('error')
      }
    }

    exchange()

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="flex min-h-[100svh] items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-overlay p-8 text-center shadow-overlay">
        {phase === 'exchanging' && (
          <>
            <div className="mx-auto flex size-10 items-center justify-center">
              <Spinner />
            </div>
            <h1 className="mt-4 text-base font-semibold text-foreground">
              Connexion en cours...
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              Échange du code OAuth avec api.fakturapp.cc
            </p>
          </>
        )}

        {phase === 'done' && (
          <>
            <div className="mx-auto flex size-10 items-center justify-center">
              <Spinner />
            </div>
            <h1 className="mt-4 text-base font-semibold text-foreground">Redirection...</h1>
          </>
        )}

        {phase === 'error' && (
          <>
            <div className="mx-auto inline-flex size-10 items-center justify-center rounded-full bg-danger/15">
              <AlertTriangle className="h-5 w-5 text-danger" />
            </div>
            <h1 className="mt-4 text-base font-semibold text-foreground">
              Connexion échouée
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              {error ?? 'Une erreur est survenue.'}
            </p>
            <Link
              href="/login"
              className="mt-5 inline-flex items-center justify-center rounded-lg border border-border bg-surface px-4 py-2 text-xs font-medium text-foreground transition-colors hover:bg-surface-hover"
            >
              Réessayer la connexion
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
