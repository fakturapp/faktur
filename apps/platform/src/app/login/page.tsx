'use client'

import { useEffect, useState } from 'react'
import {
  OAUTH_AUTHORIZE_URL,
  OAUTH_CLIENT_ID,
  OAUTH_REDIRECT_URI,
  OAUTH_SCOPES,
  STORAGE_KEYS,
} from '@/lib/oauth-config'
import { computeChallenge, generateState, generateVerifier } from '@/lib/pkce'
import { getStoredAccessToken } from '@/lib/oauth-storage'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { ArrowRight, Key, ShieldCheck, Webhook } from 'lucide-react'

export default function LoginPage() {
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    if (params.get('error')) {
      setError(params.get('error_description') || params.get('error'))
    }
    if (getStoredAccessToken()) {
      window.location.replace('/api-keys')
    }
  }, [])

  async function startOAuth() {
    setStarting(true)
    setError(null)
    try {
      const verifier = generateVerifier(64)
      const challenge = await computeChallenge(verifier)
      const state = generateState()

      sessionStorage.setItem(STORAGE_KEYS.pkceVerifier, verifier)
      sessionStorage.setItem(STORAGE_KEYS.oauthState, state)

      const url = new URL(OAUTH_AUTHORIZE_URL)
      url.searchParams.set('client_id', OAUTH_CLIENT_ID)
      url.searchParams.set('redirect_uri', OAUTH_REDIRECT_URI)
      url.searchParams.set('response_type', 'code')
      url.searchParams.set('scope', OAUTH_SCOPES)
      url.searchParams.set('state', state)
      url.searchParams.set('code_challenge', challenge)
      url.searchParams.set('code_challenge_method', 'S256')

      window.location.assign(url.toString())
    } catch (err) {
      setStarting(false)
      setError(err instanceof Error ? err.message : 'Erreur inattendue')
    }
  }

  return (
    <div className="flex min-h-[100svh] items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center justify-center gap-2">
          <FakturBadge />
          <span className="text-sm font-semibold tracking-tight text-foreground">
            Faktur Platform
          </span>
        </div>

        <div className="rounded-2xl border border-border bg-overlay p-8 shadow-overlay">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Plateforme développeur
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Connecte-toi avec ton compte Faktur pour gérer tes clés API et tes webhooks.
          </p>

          {error && (
            <div className="mt-5 rounded-xl border border-danger/30 bg-danger/5 px-3 py-2 text-xs text-danger">
              {error}
            </div>
          )}

          <Button
            className="mt-6 w-full"
            onClick={startOAuth}
            disabled={starting}
            fullWidth
          >
            {starting ? (
              <>
                <Spinner />
                Redirection...
              </>
            ) : (
              <>
                Continuer avec Faktur
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>

          <p className="mt-4 text-center text-[11px] text-muted-foreground">
            Tu seras redirigé vers fakturapp.cc pour confirmer l&apos;accès.
          </p>
        </div>

        <ul className="mt-8 space-y-3 text-xs text-muted-foreground">
          <Bullet icon={Key} text="Créer et révoquer des clés API team-owned" />
          <Bullet icon={Webhook} text="Configurer un webhook signé HMAC par clé" />
          <Bullet
            icon={ShieldCheck}
            text="Logs API + statistiques d'utilisation 30 jours"
          />
        </ul>
      </div>
    </div>
  )
}

function Bullet({
  icon: Icon,
  text,
}: {
  icon: typeof Key
  text: string
}) {
  return (
    <li className="flex items-start gap-2">
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
      <span>{text}</span>
    </li>
  )
}

function FakturBadge() {
  return (
    <svg viewBox="0 0 32 32" className="size-7" aria-hidden xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="32" height="32" rx="8" fill="var(--accent)" />
      <path
        d="M9 9h14M9 16h11M9 23h8"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  )
}
